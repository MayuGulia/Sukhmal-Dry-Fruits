import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateGeminiImage } from './geminiClient.js';
import { CUSTOMER_AI_FALLBACK, envGet, geminiImageApiKey, keyFingerprint } from './geminiEnv.js';
import { vertexImageEnabled } from './vertexImage.js';
import { buildHamperImageDemo, hamperImageDemoEnabled } from './hamperImageDemo.js';
import {
  buildFreeformHamperPrompt,
  buildPackHamperEditPrompt,
  layoutFromHamper,
  normalizeGiftCard,
  normalizeHamperProductItems,
  normalizeHamperProducts,
} from './hamperImagePrompt.js';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const LARGE_PNG_BYTES = 900 * 1024;

async function loadSharp() {
  // Resolve from this package only. Do not fall back to the repo-root
  // sharp (different version / possibly wrong ABI). Cloud Functions
  // ignores uploaded node_modules and npm-installs linux-x64 glibc
  // @img/sharp-linux-x64 on Node 22.
  const { default: sharp } = await import('sharp');
  return sharp;
}

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
    path.join(here, '../../../../../frontend/public'),
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
    || 'https://sukhmaldryfruits.com'
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

function productSlug(item) {
  const raw = String(item?.slug || '').trim();
  if (raw && !/^p_/i.test(raw) && !/^mp\d+$/i.test(raw)) {
    return raw.replace(/^\/+/, '').replace(/\.(jpe?g|png|webp)$/i, '');
  }
  const fromUrl = String(item?.imageUrl || item?.images?.[0] || '');
  const match = /\/products\/([^/?#]+?)(?:-\d+)?\.(jpe?g|png|webp)/i.exec(fromUrl);
  return match ? match[1] : '';
}

function catalogFilesForSlug(slug) {
  const want = String(slug || '').toLowerCase();
  if (!want) return [];
  const ranked = [];
  for (const dir of publicDirs()) {
    const productsDir = path.join(dir, 'products');
    if (!existsSync(productsDir)) continue;
    let names = [];
    try {
      names = readdirSync(productsDir);
    } catch {
      continue;
    }
    for (const name of names) {
      const lower = name.toLowerCase();
      if (!lower.startsWith(`${want}-`) && lower !== `${want}.jpg` && lower !== `${want}.png`) continue;
      const rank = /-2\.(jpe?g|png|webp)$/i.test(lower) ? 0
        : /-1\.(jpe?g|png|webp)$/i.test(lower) ? 1
          : 2;
      ranked.push({ rank, url: `/products/${name}` });
    }
    if (ranked.length) break;
  }
  ranked.sort((a, b) => a.rank - b.rank);
  return ranked.map((row) => row.url);
}

function productFileCandidates(item) {
  const urls = [];
  const push = (url) => {
    const raw = String(url || '').trim();
    if (raw && !urls.includes(raw)) urls.push(raw);
  };
  const slug = productSlug(item);
  push(item?.imageUrl);
  (Array.isArray(item?.images) ? item.images : []).forEach(push);
  if (slug) {
    push(`/products/${slug}-2.jpg`);
    push(`/products/${slug}-2.png`);
    catalogFilesForSlug(slug).forEach(push);
    push(`/products/${slug}-1.jpg`);
  }
  return urls;
}

async function fetchFirstImage(urls) {
  for (const url of urls) {
    const img = await fetchInlineImage(url);
    if (img) return { ...img, source: url };
  }
  return null;
}

async function compactLargeRef(img, label) {
  if (!img?.data) return img;
  const raw = Buffer.from(String(img.data).replace(/\s/g, ''), 'base64');
  const isPng = (img.mimeType || '').includes('png') || raw.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (!isPng || raw.length <= LARGE_PNG_BYTES) return img;
  const sharp = await loadSharp();
  const out = await sharp(raw).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  console.log(
    `[Sukhmal Gemini] hamper-image compact ${label} png_bytes=${raw.length} jpeg_bytes=${out.length}`,
  );
  return {
    ...img,
    mimeType: 'image/jpeg',
    data: out.toString('base64'),
  };
}

function escapeXml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function composeProductCollage(productRefs) {
  const sharp = await loadSharp();
  const cell = 520;
  const labelH = 56;
  const n = productRefs.length;
  const cols = n <= 1 ? 1 : 2;
  const rows = Math.ceil(n / cols);
  const width = cols * cell;
  const tiles = [];
  for (let i = 0; i < productRefs.length; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const photo = await sharp(Buffer.from(String(productRefs[i].data).replace(/\s/g, ''), 'base64'))
      .resize(cell, cell, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 85 })
      .toBuffer();
    const label = escapeXml(productRefs[i].name || `Product ${i + 1}`);
    const svg = Buffer.from(
      `<svg width="${cell}" height="${labelH}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ffffff"/>
        <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="22" font-family="Arial, sans-serif" fill="#111111">${i + 1}. ${label}</text>
      </svg>`,
    );
    const labeled = await sharp({
      create: {
        width: cell,
        height: cell + labelH,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite([
        { input: photo, top: 0, left: 0 },
        { input: svg, top: cell, left: 0 },
      ])
      .jpeg({ quality: 85 })
      .toBuffer();
    tiles.push({ input: labeled, top: row * (cell + labelH), left: col * cell });
  }
  const collage = await sharp({
    create: {
      width,
      height: rows * (cell + labelH),
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(tiles)
    .jpeg({ quality: 85 })
    .toBuffer();
  console.log(
    `[Sukhmal Gemini] hamper-image product-collage cells=${n} grid=${cols}x${rows} jpeg_bytes=${collage.length}`,
  );
  return {
    mimeType: 'image/jpeg',
    data: collage.toString('base64'),
    name: productRefs.map((img) => img.name).filter(Boolean).join(', '),
    source: 'product-collage',
  };
}

async function collectReferenceImages(body, productItems) {
  const hamperUrl = String(
    body.hamperImage
      || body.referenceImageUrl
      || body.hamperImageUrl
      || body.img
      || '',
  ).trim();
  const extraHamper = Array.isArray(body.hamperImages) ? body.hamperImages : [];
  const hamperRef = await compactLargeRef(
    await fetchFirstImage([hamperUrl, ...extraHamper].filter(Boolean)),
    'hamper',
  );
  const productRefs = [];
  for (const item of productItems.slice(0, 6)) {
    const img = await fetchFirstImage(productFileCandidates(item));
    if (img) productRefs.push({ ...img, name: item.name });
  }

  return {
    hamperRef,
    productRefs,
    hamperUrl,
  };
}

export async function generateHamperPreview(body) {
  if (hamperImageDemoEnabled()) {
    const products = normalizeHamperProducts(body);
    const freePrompt = String(body.prompt || body.description || '').trim();
    if (!products.length && !freePrompt) {
      const err = new Error('Add products to your hamper before generating a preview.');
      err.code = 'bad_request';
      throw err;
    }
    return buildHamperImageDemo(body);
  }

  const key = geminiImageApiKey();
  if (!key && !vertexImageEnabled()) {
    console.warn('[Sukhmal Gemini] hamper-image missing GEMINI_IMAGE_API_KEY / Vertex billing');
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
  const layoutType = layoutFromHamper(body);
  const giftCard = normalizeGiftCard(body.giftCard);
  const refs = productItems.length ? await collectReferenceImages(body, productItems) : { hamperRef: null, productRefs: [] };
  if (!productItems.length) {
    const image = await generateGeminiImage({
      key,
      prompt: buildFreeformHamperPrompt(freePrompt),
      label: 'hamper-image',
      editFirstImage: false,
    });
    const packed = view('front', 'Front', image);
    return { url: packed.url, views: [packed], products, boxType, hamperName, layoutType, giftCard };
  }

  if (!refs.hamperRef) {
    console.warn('[Sukhmal Gemini] hamper-image missing selected hamper photo', refs.hamperUrl || '(empty url)');
    const err = new Error('Could not load the selected hamper photo. Choose a hamper and try again.');
    err.code = 'bad_request';
    throw err;
  }

  if (refs.productRefs.length < productItems.length) {
    console.warn(
      '[Sukhmal Gemini] hamper-image missing catalog product files',
      JSON.stringify(productItems.map((item) => ({ name: item.name, slug: item.slug, imageUrl: item.imageUrl }))),
    );
    const err = new Error('Could not load the selected product photos from the catalog. Try again, or pick different products.');
    err.code = 'bad_request';
    throw err;
  }

  const productImages = refs.productRefs.map((img) => ({ mimeType: img.mimeType, data: img.data }));
  let sendProducts = productImages;
  let imageLabels = refs.productRefs.map((img) => img.name);
  let productCollage = false;
  if (refs.productRefs.length > 1) {
    try {
      const collage = await composeProductCollage(refs.productRefs);
      sendProducts = [{ mimeType: collage.mimeType, data: collage.data }];
      imageLabels = ['Selected product packs collage (names under each cell)'];
      productCollage = true;
    } catch (err) {
      console.warn(`[Sukhmal Gemini] hamper-image collage failed, sending separate packs: ${String(err.message || err).slice(0, 200)}`);
    }
  }

  console.log(
    '[Sukhmal Gemini] hamper-image img2img',
    JSON.stringify({
      hamperName,
      hamperUrl: refs.hamperUrl,
      layoutType,
      products,
      refs: {
        hamper: Boolean(refs.hamperRef),
        hamperFirst: true,
        productCollage,
        products: productCollage
          ? [{ name: 'collage', file: 'product-collage', cells: refs.productRefs.map((img) => img.name) }]
          : refs.productRefs.map((img) => ({ name: img.name, file: img.source })),
      },
      giftCard: {
        included: giftCard.included,
        hasMessage: Boolean(giftCard.message),
      },
      imageKey: keyFingerprint(key),
      api: vertexImageEnabled() ? 'vertex' : 'generativelanguage',
      steps: 'edit-filled-hamper-with-catalog-product-photos',
    }),
  );

  const image = await generateGeminiImage({
    key,
    prompt: buildPackHamperEditPrompt({
      products: productItems,
      giftCard,
      layoutType,
      productCollage,
    }),
    label: 'hamper-compose',
    referenceImage: refs.hamperRef,
    referenceImages: sendProducts,
    imageLabels,
    editFirstImage: true,
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
