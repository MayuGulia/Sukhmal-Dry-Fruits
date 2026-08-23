/**
 * Standalone probe for POST /api/generate-hamper-image.
 * Does not import or start the Next app — npm run dev must already be running.
 *
 * Request body matches app/api/generate-hamper-image/route.ts:
 *   hamperImageBase64, productImages[], productNames[], giftCardMessage?, sessionId
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'test-images');
const API_URL = process.env.HAMPER_API_URL || 'http://localhost:3000/api/generate-hamper-image';
const TIMEOUT_MS = 180_000;

const HAMPER_CANDIDATES = ['hamper.png', 'hamper.jpg', 'hamper.jpeg', 'hamper.webp'];
const PRODUCT_CANDIDATES = [
  ['product1.png', 'product1.jpg', 'product1.jpeg', 'product1.webp'],
  ['product2.png', 'product2.jpg', 'product2.jpeg', 'product2.webp'],
  ['product3.png', 'product3.jpg', 'product3.jpeg', 'product3.webp'],
];

function firstExisting(names) {
  for (const name of names) {
    const full = path.join(IMAGES_DIR, name);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) return full;
  }
  return null;
}

function readRequiredImages() {
  const hamperPath = firstExisting(HAMPER_CANDIDATES);
  const productPaths = PRODUCT_CANDIDATES.map(firstExisting).filter(Boolean);

  if (!hamperPath || productPaths.length < 2) {
    console.error(`
Missing real photos in ${IMAGES_DIR}

Drop these files before running (PNG or JPG):
  hamper.png      — hamper / basket reference photo
  product1.png    — first product pack photo
  product2.png    — second product pack photo
  product3.png    — optional third product pack photo

Do not use empty or fake files — Vertex needs real image bytes.
`);
    process.exit(1);
  }

  return { hamperPath, productPaths };
}

function toBase64(filePath) {
  const buf = fs.readFileSync(filePath);
  if (!buf.length) {
    console.error(`File is empty (not usable): ${filePath}`);
    process.exit(1);
  }
  return buf.toString('base64');
}

function formatErrorBody(status, body) {
  if (body && typeof body === 'object') {
    const message = body.message || body.error || JSON.stringify(body);
    return `${status} — ${message}`;
  }
  return `${status} — ${String(body)}`;
}

async function postGenerate(payload) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': String(payload.sessionId),
      },
      body: JSON.stringify(payload),
      signal: ac.signal,
    });
    const text = await res.text();
    let parsed = text;
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      parsed = { raw: text };
    }
    return { status: res.status, body: parsed };
  } finally {
    clearTimeout(timer);
  }
}

function printResult(label, status, body) {
  console.log(`\n=== ${label} ===`);
  console.log(`Status: ${status}`);

  if (status === 429 || status >= 500) {
    console.error(`Error: ${formatErrorBody(status, body)}`);
    return;
  }

  console.log('Body:', typeof body === 'string' ? body : JSON.stringify(body, null, 2));
  if (body && typeof body === 'object' && body.url) {
    console.log('\nImage URL (copy/click):\n' + body.url);
  }
}

async function runFirstGeneration(payload) {
  console.log(`POST ${API_URL}`);
  console.log(`Session: ${payload.sessionId}`);
  console.log(`Hamper + ${payload.productImages.length} product image(s)`);
  const { status, body } = await postGenerate(payload);
  printResult('First generation', status, body);
  return status;
}

async function testRateLimit(payload) {
  console.log('\n=== Rate-limit probe (3 more calls, same session) ===');
  console.log('Guest limit is 3 per session. Call 4 overall should be 429.');

  let fourthStatus = null;
  for (let n = 2; n <= 4; n += 1) {
    const { status, body } = await postGenerate(payload);
    printResult(`Call ${n} of 4`, status, body);
    fourthStatus = status;
  }

  const pass = fourthStatus === 429;
  console.log('\n========================================');
  console.log(pass ? 'PASS — 4th call returned 429 as expected.' : `FAIL — 4th call returned ${fourthStatus}, expected 429.`);
  console.log('========================================');
  return pass;
}

async function main() {
  const { hamperPath, productPaths } = readRequiredImages();
  console.log('Using images:');
  console.log(' ', hamperPath);
  productPaths.forEach((p) => console.log(' ', p));

  const sessionId = `hamper_test_${Date.now()}`;
  const payload = {
    hamperImageBase64: toBase64(hamperPath),
    productImages: productPaths.map(toBase64),
    productNames: ['Mango Candy', 'Gaund Katira', 'Kesar Mishri'].slice(0, productPaths.length),
    giftCardMessage: 'Happy Diwali — with love from Sukhmal',
    sessionId,
  };

  await runFirstGeneration(payload);
  const pass = await testRateLimit(payload);
  process.exit(pass ? 0 : 1);
}

main().catch((err) => {
  const msg = err?.name === 'AbortError'
    ? `Request timed out after ${TIMEOUT_MS / 1000}s. Is npm run dev running?`
    : (err?.cause?.code === 'ECONNREFUSED' || err?.code === 'ECONNREFUSED')
      ? `Could not connect to ${API_URL}. Start the Next server first: npm run dev`
      : (err instanceof Error ? err.message : String(err));
  console.error('\nFAIL —', msg);
  process.exit(1);
});
