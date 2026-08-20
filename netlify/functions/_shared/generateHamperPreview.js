import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateGeminiImage } from './geminiClient.js';
import { CUSTOMER_AI_FALLBACK, envGet, geminiImageApiKey, keyFingerprint } from './geminiEnv.js';
import {
  buildFreeformHamperPrompt,
  buildHamperImagePrompt,
  layoutFromHamper,
  normalizeGiftCard,
  normalizeHamperProductItems,
  normalizeHamperProducts,
} from './hamperImagePrompt.js';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function dataUrl(image) {
  return `data:${image.mimeType};base64,${image.data}`;
}

function view(key, label, image) {
  return { key, label, url: dataUrl(image), mimeType: image.mimeType };
}

function publicDirs() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return [
    path.join(process.cwd(), 'public'),
    path.join(process.cwd(), 'frontend', 'public'),
    path.join(here, '../../../public'),
    path.join(here, '../../../../frontend/public'),
  ];
}

function mimeFromPath(filePath) {
  const lower = String(filePath || '').toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

function siteOrigin() {
  return (
    envGet('SITE_ORIGIN')
    || envGet('URL')
    || envGet('DEPLOY_PRIME_URL')
    || 'http://127.0.0.1:3000'
  ).replace(/\/$/, '');
}

async function fetchInlineImage(url) {
  const raw = String(url || '').trim();
  if (!raw) return null;
  if (raw.startsWith('data:')) {
    const match = /^data:([^;]+);base64,(.+)$/i.exec(raw);
    if (!match) return null;
    return { mimeType: match[1], data: match[2].replace(/\s/g, '') };
  }

  const pathname = raw.replace(/[?#].*$/, '');
  if (pathname.startsWith('/')) {
    const rel = pathname.replace(/^\/+/, '');
    for (const dir of publicDirs()) {
      const file = path.join(dir, rel);
      if (!existsSync(file)) continue;
      const buf = readFileSync(file);
      if (!buf.length || buf.length > MAX_IMAGE_BYTES) return null;
      return { mimeType: mimeFromPath(file), data: buf.toString('base64') };
    }
  }

  const resolved = /^(https?:)?\/\//i.test(raw)
    ? (raw.startsWith('//') ? `https:${raw}` : raw)
    : `${siteOrigin()}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
  try {
    const res = await fetch(resolved, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) {
      console.warn('[Sukhmal Gemini] hamper-image ref fetch failed', res.status, resolved.slice(0, 160));
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length || buf.length > MAX_IMAGE_BYTES) return null;
    const mime = res.headers.get('content-type')?.split(';')[0] || mimeFromPath(resolved);
    return { mimeType: mime, data: buf.toString('base64') };
  } catch (err) {
    console.warn('[Sukhmal Gemini] hamper-image ref fetch error', String(err.message || '').slice(0, 160));
    return null;
  }
}

async function collectReferenceImages(body, productItems) {
  const hamperUrl = String(
    body.hamperImage
      || body.referenceImageUrl
      || body.hamperImageUrl
      || body.img
      || '',
  ).trim();
  const cardUrl = String(body.giftCard?.imageUrl || body.giftCard?.img || body.cardImage || '').trim();
  const productUrls = productItems.map((item) => item.imageUrl).filter(Boolean).slice(0, 6);

  const hamperRef = await fetchInlineImage(hamperUrl);
  const productRefs = (await Promise.all(productUrls.map((url) => fetchInlineImage(url)))).filter(Boolean);
  const cardRef = await fetchInlineImage(cardUrl);

  return {
    hamperRef,
    productRefs,
    cardRef,
    images: [hamperRef, ...productRefs, cardRef].filter(Boolean),
  };
}

export async function generateHamperPreview(body) {
  const key = geminiImageApiKey();
  if (!key) {
    console.warn('[Sukhmal Gemini] hamper-image missing GEMINI_IMAGE_API_KEY / GEMINI_API_KEY');
    const err = new Error(CUSTOMER_AI_FALLBACK);
    err.code = 'not_configured';
    throw err;
  }

  const productItems = normalizeHamperProductItems(body);
  const products = normalizeHamperProducts(body);
  const freePrompt = String(body.prompt || body.description || '').trim();
  if (!productItems.length && !freePrompt) {
    const err = new Error('Add products to your hamper before generating a preview.');
    err.code = 'bad_request';
    throw err;
  }

  const hamperName = String(body.hamperName || body.hamperId || '').trim();
  const boxType = String(body.boxType || body.packaging || hamperName || 'luxury gift box').trim();
  const packaging = String(body.packaging || body.boxType || boxType).trim();
  const layoutType = layoutFromHamper(body);
  const giftCard = normalizeGiftCard(body.giftCard);
  const refs = productItems.length ? await collectReferenceImages(body, productItems) : { images: [] };
  const prompt = productItems.length
    ? buildHamperImagePrompt({
      products: productItems,
      boxType,
      hamperName,
      packaging,
      giftCard,
      layoutType,
      hasHamperRef: Boolean(refs.hamperRef),
      hasProductRefs: Boolean(refs.productRefs?.length),
      hasCardRef: Boolean(refs.cardRef),
    })
    : buildFreeformHamperPrompt(freePrompt);

  console.log(
    '[Sukhmal Gemini] hamper-image prompt',
    JSON.stringify({
      hamperName,
      boxType,
      packaging,
      layoutType,
      products,
      refs: {
        hamper: Boolean(refs.hamperRef),
        products: refs.productRefs?.length || 0,
        card: Boolean(refs.cardRef),
      },
      giftCard: {
        name: giftCard.name,
        included: giftCard.included,
        hasMessage: Boolean(giftCard.message),
      },
      imageKey: keyFingerprint(key),
      api: 'generativelanguage',
      steps: 'single-packed-front',
    }),
  );

  const image = await generateGeminiImage({
    key,
    prompt,
    label: 'hamper-image',
    referenceImages: refs.images,
  });
  const packed = view('front', 'Front', image);
  return {
    url: packed.url,
    views: [packed],
    products,
    boxType,
    hamperName,
    layoutType,
    giftCard,
  };
}
