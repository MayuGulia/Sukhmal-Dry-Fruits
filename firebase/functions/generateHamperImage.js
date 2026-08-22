const crypto = require('crypto');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { VertexAI } = require('@google-cloud/vertexai');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'sukhmal-website';
if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
const db = getFirestore('default');

const FUNCTION_REGION = 'asia-south1';
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
const SITE_ORIGIN = (process.env.SITE_ORIGIN || 'https://sukhmaldryfruits.com').replace(/\/$/, '');
const IMAGE_SA = String(process.env.VERTEX_IMAGE_SA || '').trim();

const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'global',
});
const imageModel = vertexAI.getGenerativeModel({
  model: IMAGE_MODEL,
  generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
});

function buildPrompt({ hamperName, layoutType, products, giftCard }) {
  const productList = products
    .map(p => `- ${p.name} (${p.quantity})`)
    .join('\n');

  const taskSection = layoutType === 'compartment'
    ? `Using the reference hamper image as the exact packaging/box structure
(preserve box material, color, compartment count and shape), fill each
visible compartment with the specified products from the product
reference images. Match product color, texture, and packaging exactly
as shown in the product references. Do not alter the box exterior,
ribbon, or lid design. If number of products is fewer than compartments,
leave remaining compartments empty rather than duplicating items.`
    : `Using the reference tray/basket image as the base container, arrange
the specified products naturally across its surface — the way a curated
dry-fruit gift spread is styled (some items in small piles, jars/packets
placed upright, garnish elements like flowers if present in the
reference kept as-is). Match each product's real packaging/appearance
from its reference image. Keep the tray/basket material and shape
unchanged.`;

  const giftCardSection = giftCard?.included
    ? `\n\nPlace a folded gift card near the front-right of the composition,
propped upright or laid flat, showing the card design from the card
reference image with the message "${giftCard.message}" rendered legibly
on it in a clean serif font matching the brand.`
    : '';

  return `SYSTEM CONTEXT:
You are generating a single photorealistic product preview image for an
e-commerce gift hamper builder. Output must look like a professional
studio product photograph — soft natural lighting, neutral background
matching the reference hamper's original background, no text overlays
except where explicitly instructed for the gift card.

INPUTS PROVIDED:
1. Reference image: [empty/base hamper photo] — hamper name: "${hamperName}",
   layout_type: "${layoutType}"
2. Product reference images:
${productList}
3. Gift card (optional): included = ${!!giftCard?.included}, message text = "${giftCard?.message || ''}"

TASK:
${taskSection}${giftCardSection}

CONSTRAINTS:
- Do not invent products not in the product list
- Do not change hamper/basket type, color, or size
- Output aspect ratio: 1:1, resolution suitable for product listing (min 1024x1024)
- Lighting and background must match the original hamper reference photo`;
}

function cacheDocId({ hamperId, productIds, giftCard }) {
  const ids = [...productIds].map(String).sort().join(',');
  const msg = giftCard?.included ? String(giftCard.message || '') : 'none';
  return crypto
    .createHash('sha256')
    .update(`${hamperId}|${ids}|${msg}`)
    .digest('hex')
    .slice(0, 40);
}

function layoutFromHamper(hamper) {
  const explicit = String(hamper.layoutType || '').toLowerCase();
  if (explicit === 'compartment' || explicit === 'open_arrangement') return explicit;
  const kind = String(hamper.packagingKind || hamper.packaging || '').toLowerCase();
  return /box|compartment/.test(kind) ? 'compartment' : 'open_arrangement';
}

function productImageUrl(product) {
  const listed = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  return product.referenceImageUrl
    || product.imageUrl
    || product.img
    || product.image
    || listed[0]
    || '';
}

function absoluteUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (/^(gs|https?):\/\//i.test(raw) || raw.startsWith('data:')) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('/')) return `${SITE_ORIGIN}${raw}`;
  return raw;
}

function mimeFromUrl(url, fallback = 'image/jpeg') {
  const path = String(url || '').split('?')[0].toLowerCase();
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.gif')) return 'image/gif';
  if (/\.jpe?g$/.test(path)) return 'image/jpeg';
  return fallback;
}

async function fetchInlinePart(url) {
  const resolved = absoluteUrl(url);
  if (!resolved) return null;
  if (resolved.startsWith('gs://')) {
    return { fileData: { mimeType: mimeFromUrl(resolved), fileUri: resolved } };
  }
  const res = await fetch(resolved, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) {
    console.warn('reference image fetch failed', res.status, resolved.slice(0, 180));
    return null;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length || buf.length > 4 * 1024 * 1024) return null;
  const mime = res.headers.get('content-type')?.split(';')[0] || mimeFromUrl(resolved);
  return { inlineData: { mimeType: mime, data: buf.toString('base64') } };
}

async function loadHamper(hamperId) {
  const direct = await db.collection('hampers').doc(hamperId).get();
  if (direct.exists) return { id: direct.id, ...direct.data() };

  const slugSnap = await db.collection('hampers').where('slug', '==', hamperId).limit(1).get();
  if (!slugSnap.empty) {
    const doc = slugSnap.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  const asProduct = await db.collection('products').doc(hamperId).get();
  if (asProduct.exists) {
    const data = asProduct.data() || {};
    const isHamper = data.category === 'gift-hampers' || String(hamperId).startsWith('h_');
    if (isHamper) return { id: asProduct.id, ...data };
  }

  return null;
}

function normalizeGiftCard(giftCard) {
  if (!giftCard) return { included: false, message: '' };
  const message = String(giftCard.message || '').trim().slice(0, 280);
  const included = giftCard.included !== false && Boolean(message);
  return { included, message };
}

function extractImageData(result) {
  const response = result?.response || result;
  const parts = response?.candidates?.[0]?.content?.parts || [];
  const inline = parts.find((p) => p.inlineData || p.inline_data);
  const data = inline?.inlineData?.data || inline?.inline_data?.data;
  const mime = inline?.inlineData?.mimeType || inline?.inline_data?.mime_type || 'image/png';
  return data ? { data, mime } : null;
}

async function generateImage(parts) {
  const result = await imageModel.generateContent({
    contents: [{ role: 'user', parts }],
  });
  const image = extractImageData(result);
  if (!image) throw new Error(`No image part from ${IMAGE_MODEL} in global`);
  return image;
}

const callOpts = {
  region: FUNCTION_REGION,
  timeoutSeconds: 180,
  memory: '1GiB',
  enforceAppCheck: false,
  cors: true,
};
if (IMAGE_SA) callOpts.serviceAccount = IMAGE_SA;

exports.generateHamperImage = onCall(
  callOpts,
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Login required');
    }

    const { hamperId, productIds, giftCard, quantities } = request.data || {};
    const ids = Array.isArray(productIds) ? productIds.map(String).filter(Boolean) : [];
    if (!hamperId || !ids.length) {
      throw new HttpsError('invalid-argument', 'hamperId and productIds required');
    }

    const hamper = await loadHamper(String(hamperId));
    if (!hamper) {
      throw new HttpsError('not-found', 'Hamper not found');
    }

    const productDocs = await Promise.all(
      ids.map((id) => db.collection('products').doc(id).get()),
    );
    const qtyMap = quantities && typeof quantities === 'object' ? quantities : {};
    const products = productDocs
      .map((doc, index) => {
        if (!doc.exists) return null;
        const data = doc.data() || {};
        const qty = Number(qtyMap[doc.id] ?? qtyMap[ids[index]] ?? data.quantity ?? 1) || 1;
        return {
          id: doc.id,
          name: data.name || ids[index],
          quantity: qty,
          imageUrl: productImageUrl(data),
        };
      })
      .filter(Boolean);

    if (!products.length) {
      throw new HttpsError('not-found', 'No matching products found');
    }

    const card = normalizeGiftCard(giftCard);
    const cacheKey = cacheDocId({ hamperId: String(hamperId), productIds: ids, giftCard: card });
    const cacheDoc = await db.collection('imageCache').doc(cacheKey).get();
    if (cacheDoc.exists && cacheDoc.data()?.imageUrl) {
      return { imageUrl: cacheDoc.data().imageUrl, cached: true };
    }

    const prompt = buildPrompt({
      hamperName: hamper.name || String(hamperId),
      layoutType: layoutFromHamper(hamper),
      products,
      giftCard: card,
    });

    const refs = [
      hamper.referenceImageUrl || hamper.imageUrl || hamper.image || hamper.img
        || (Array.isArray(hamper.images) ? hamper.images[0] : ''),
      ...products.map((p) => p.imageUrl),
    ];
    const imageParts = (await Promise.all(refs.map((url) => fetchInlinePart(url)))).filter(Boolean);

    try {
      const image = await generateImage([{ text: prompt }, ...imageParts]);
      const bucket = admin.storage().bucket();
      const fileName = `hamperPreviews/${cacheKey}.png`;
      const file = bucket.file(fileName);
      await file.save(Buffer.from(image.data, 'base64'), {
        metadata: {
          contentType: image.mime || 'image/png',
          cacheControl: 'public, max-age=31536000',
        },
      });
      const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;

      await db.collection('imageCache').doc(cacheKey).set({
        imageUrl,
        hamperId: String(hamperId),
        productIds: ids,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: request.auth.uid,
      });

      return { imageUrl, cached: false };
    } catch (err) {
      console.error('Image generation failed:', err);
      throw new HttpsError('internal', 'Image generation failed, try again');
    }
  },
);
