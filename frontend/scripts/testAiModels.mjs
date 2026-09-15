/**
 * Probe gift advisor, admin inventory, and hamper image against the current env.
 * Keys come from process env (never commit secrets).
 *
 *   TEST_GEMINI_KEY=... node scripts/testAiModels.mjs
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const testKey = String(process.env.TEST_GEMINI_KEY || '').trim();
if (testKey) {
  process.env.GEMINI_API_KEY = testKey;
  process.env.GEMINI_ASSISTANT_API_KEY = testKey;
  process.env.GEMINI_IMAGE_API_KEY = testKey;
}

if (process.env.AI_TEST_VERTEX !== '1') {
  process.env.GOOGLE_GENAI_USE_ENTERPRISE = 'false';
  process.env.GOOGLE_GENAI_USE_VERTEXAI = 'false';
  process.env.GOOGLE_CLOUD_PROJECT = '';
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
}

const catalog = [
  {
    id: 'california-almonds',
    slug: 'california-almonds',
    name: 'California Almonds',
    category: 'nuts',
    price: 649,
    tagline: 'Crunchy premium almonds',
    bestseller: true,
    weightVariants: [{ weight: '250g', price: 649, stock: 20 }],
  },
  {
    id: 'medjool-dates',
    slug: 'medjool-dates',
    name: 'Medjool Dates',
    category: 'dates',
    price: 499,
    tagline: 'Soft royal dates',
    isBestseller: true,
    weightVariants: [{ weight: '250g', price: 499, stock: 12 }],
  },
];

function summarize(label, result) {
  const out = { label, ok: result.ok, ms: result.ms };
  if (result.error) out.error = String(result.error).slice(0, 400);
  if (result.code) out.code = result.code;
  if (result.extra) Object.assign(out, result.extra);
  console.log(JSON.stringify(out));
}

async function timed(fn) {
  const t0 = Date.now();
  try {
    const extra = await fn();
    return { ok: true, ms: Date.now() - t0, extra };
  } catch (err) {
    return {
      ok: false,
      ms: Date.now() - t0,
      error: err?.message || String(err),
      code: err?.code || err?.status || null,
    };
  }
}

async function main() {
  const imageKey = process.env.GEMINI_IMAGE_API_KEY || process.env.GEMINI_API_KEY || '';
  const chatKey = process.env.GEMINI_ASSISTANT_API_KEY || process.env.GEMINI_API_KEY || '';
  const only = process.env.AI_TEST_ONLY || 'all';
  console.log(JSON.stringify({
    mode: process.env.AI_TEST_VERTEX === '1' ? 'vertex' : 'ai-studio-key',
    only,
    imageKeyLen: imageKey.length,
    imageKeyPrefix: imageKey ? `${imageKey.slice(0, 3)}…${imageKey.slice(-4)}` : 'none',
    chatKeyLen: chatKey.length,
    geminiModel: process.env.GEMINI_MODEL || '',
    vertexEnterprise: process.env.GOOGLE_GENAI_USE_ENTERPRISE || '',
    cloudProject: process.env.GOOGLE_CLOUD_PROJECT || '',
  }));

  const { adviseGifts } = await import('../netlify/functions/_shared/geminiGiftAdvisor.js');
  const { previewInventoryCommand, buildPreviewPayload } = await import('../netlify/functions/_shared/geminiInventory.js');
  const { generateHamperPreview } = await import('../netlify/functions/_shared/generateHamperPreview.js');
  const { vertexImageEnabled } = await import('../netlify/functions/_shared/vertexImage.js');
  console.log(JSON.stringify({ vertexImageEnabled: vertexImageEnabled() }));

  let usedLocalFallback = false;
  const origWarn = console.warn;
  console.warn = (...args) => {
    const msg = args.map((a) => (typeof a === 'string' ? a : '')).join(' ');
    if (/catalogue advisor|using catalogue/i.test(msg)) usedLocalFallback = true;
    origWarn(...args);
  };

  summarize('gift-advisor', await timed(async () => {
    if (only === 'image') return { skipped: true };
    usedLocalFallback = false;
    const r = await adviseGifts({
      messages: [{ role: 'user', text: 'I need a Diwali gift under 2000 rupees with almonds.' }],
      catalog,
    });
    return {
      localFallback: usedLocalFallback,
      text: String(r.text || '').slice(0, 180),
      productCount: Array.isArray(r.products) ? r.products.length : 0,
      productNames: (r.products || []).map((p) => p.name || p.slug),
    };
  }));

  summarize('admin-inventory', await timed(async () => {
    if (only === 'image') return { skipped: true };
    const parsed = await previewInventoryCommand('Set California Almonds 250g price to 699', catalog);
    const payload = buildPreviewPayload(parsed);
    return {
      changeCount: payload.changes?.length || parsed.changes?.length || 0,
      summary: String(payload.summary || parsed.summary || '').slice(0, 200),
      firstChange: (payload.changes || parsed.changes || [])[0] || null,
    };
  }));

  summarize('hamper-image', await timed(async () => {
    const r = await generateHamperPreview({
      hamperName: 'Test Diwali Box',
      boxType: 'luxury gift box',
      products: [{ name: 'California Almonds', weight: '250g' }],
    });
    const url = r.url || r.views?.[0]?.url || '';
    return {
      hasImage: Boolean(url && url.startsWith('data:image')),
      mime: r.views?.[0]?.mimeType || (url.startsWith('data:') ? url.slice(5, url.indexOf(';')) : ''),
      bytes: url ? Math.round((url.length * 3) / 4) : 0,
      viewCount: Array.isArray(r.views) ? r.views.length : 0,
    };
  }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
