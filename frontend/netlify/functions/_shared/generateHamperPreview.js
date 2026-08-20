import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateGeminiDescribe, generateGeminiImage, generateGeminiImageFromText } from './geminiClient.js';
import { CUSTOMER_AI_FALLBACK, envGet, geminiImageApiKey, keyFingerprint } from './geminiEnv.js';
import { buildHamperImageDemo, hamperImageDemoEnabled } from './hamperImageDemo.js';
import {
  buildComposeImagePrompt,
  buildFreeformHamperPrompt,
  buildProductDescribePrompt,
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

async function collectReferenceImages(body, productItems) {
  const hamperUrl = String(
    body.hamperImage
      || body.referenceImageUrl
      || body.hamperImageUrl
      || body.img
      || '',
  ).trim();
  const extraHamper = Array.isArray(body.hamperImages) ? body.hamperImages : [];
  const hamperRef = await fetchFirstImage([hamperUrl, ...extraHamper].filter(Boolean));
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

  console.log(
    '[Sukhmal Gemini] hamper-image two-step',
    JSON.stringify({
      hamperName,
      hamperUrl: refs.hamperUrl,
      products,
      refs: {
        hamper: Boolean(refs.hamperRef),
        products: refs.productRefs.map((img) => ({ name: img.name, file: img.source })),
      },
      imageKey: keyFingerprint(key),
      api: 'generativelanguage',
      steps: 'gemini-2.0-flash describe → gemini-2.0-flash-preview-image-generation',
    }),
  );

  const described = await generateGeminiDescribe({
    key,
    prompt: buildProductDescribePrompt({
      products: productItems,
      hamperName,
      packaging,
      hasHamperPhoto: Boolean(refs.hamperRef),
    }),
    images: [refs.hamperRef, ...refs.productRefs].filter(Boolean),
    label: 'hamper-describe',
  });
  console.log(
    '[Sukhmal Gemini] hamper-describe ok',
    JSON.stringify({ model: described.model, chars: String(described.text || '').length }),
  );

  const image = await generateGeminiImageFromText({
    key,
    prompt: buildComposeImagePrompt({
      products: productItems,
      giftCard,
      hamperName,
      packaging,
      productDescription: described.text,
    }),
    label: 'hamper-compose',
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
