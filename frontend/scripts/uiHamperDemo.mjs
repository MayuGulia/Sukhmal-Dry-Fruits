/**
 * LOCAL DEMO ONLY. Drive Build Hamper preview in a real Chromium window
 * against the CRA server. Delete this file with the rest of demo-mode code.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const BASE = process.env.HAMPER_DEMO_URL || 'http://127.0.0.1:3001';
const outDir = path.join(__dirname, '..');
const shotPath = path.join(outDir, 'tmp-hamper-preview-ui.png');
const jsonPath = path.join(outDir, 'tmp-hamper-preview-ui.json');

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p));
}

function clickByText(page, text, { exact = false } = {}) {
  return page.evaluate((needle, exactMatch) => {
    const buttons = [...document.querySelectorAll('button')];
    const match = buttons.find((b) => {
      const t = (b.textContent || '').replace(/\s+/g, ' ').trim();
      return exactMatch ? t === needle : t.includes(needle);
    });
    if (!match) throw new Error(`No button containing "${needle}"`);
    if (match.disabled) throw new Error(`Button "${needle}" is disabled`);
    match.click();
  }, text, exact);
}

async function waitForText(page, text, timeout = 30000) {
  await page.waitForFunction(
    (needle) => document.body && document.body.innerText.includes(needle),
    { timeout },
    text,
  );
}

const chrome = findChrome();
if (!chrome) {
  console.error(JSON.stringify({ ok: false, error: 'no_chrome' }));
  process.exit(1);
}

let puppeteer;
try {
  puppeteer = require('puppeteer-core');
} catch {
  console.error(JSON.stringify({ ok: false, error: 'puppeteer-core missing. Run npm i -D puppeteer-core in frontend (temporary).' }));
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,960'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1400 });
page.setDefaultTimeout(45000);

let captured = null;
page.on('response', async (res) => {
  try {
    if (!res.url().includes('/generate-hamper-image')) return;
    if (res.request().method() !== 'POST') return;
    captured = {
      status: res.status(),
      url: res.url(),
      body: await res.json(),
    };
  } catch (err) {
    captured = { status: res.status(), url: res.url(), parseError: String(err.message || err) };
  }
});

try {
  await page.goto(`${BASE}/build-hamper/budget`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForText(page, 'Set Your Budget');
  await clickByText(page, 'Continue');

  await waitForText(page, 'Choose Your Hamper');
  await clickByText(page, 'Continue');

  await page.waitForFunction(
    () => [...document.querySelectorAll('button')].some((b) => (b.textContent || '').trim() === 'Add'),
    { timeout: 30000 },
  );
  await page.evaluate(() => {
    const add = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === 'Add');
    add.click();
  });
  await page.waitForFunction(
    () => [...document.querySelectorAll('button')].some((b) => (b.textContent || '').includes('Added')),
  );
  await clickByText(page, 'Continue');

  await waitForText(page, 'Choose Your Gift Card');
  await page.waitForFunction(
    () => [...document.querySelectorAll('aside button')].some((b) => (b.textContent || '').includes('Continue to Preview')),
    { timeout: 15000 },
  );
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('aside button')].find((b) => (b.textContent || '').includes('Continue to Preview'));
    if (!btn) throw new Error('missing sidebar Continue to Preview');
    if (btn.disabled) throw new Error('sidebar Continue to Preview is disabled');
    btn.scrollIntoView({ block: 'center' });
    btn.click();
  });
  await page.waitForFunction(
    () => window.location.pathname.includes('/build-hamper/preview'),
    { timeout: 15000 },
  );

  await waitForText(page, 'A Glimpse of Your Masterpiece', 15000);
  await page.waitForFunction(
    () => {
      const note = [...document.querySelectorAll('p')].some((p) => (p.textContent || '').includes('Local demo placeholder'));
      const img = [...document.querySelectorAll('img')].some((el) => String(el.src || '').startsWith('data:image/svg+xml'));
      return note && img;
    },
    { timeout: 20000 },
  );

  await page.screenshot({ path: shotPath, fullPage: false });

  const ui = await page.evaluate(() => {
    const img = [...document.querySelectorAll('img')].find((el) => String(el.src || '').startsWith('data:image/svg+xml'));
    const note = [...document.querySelectorAll('p')].find((p) => (p.textContent || '').includes('Local demo placeholder'));
    return {
      note: note ? note.textContent.trim() : null,
      imgSrcPrefix: img ? img.src.slice(0, 80) : null,
      imgSrcLen: img ? img.src.length : 0,
      bannerInImg: img ? decodeURIComponent(img.src).includes('DEMO PREVIEW — NOT AI GENERATED') : false,
    };
  });

  const body = captured?.body || {};
  const evidence = {
    ok: true,
    chrome,
    pageUrl: page.url(),
    ui,
    http: captured
      ? {
          status: captured.status,
          url: captured.url,
          demo: body.demo,
          demoLabel: body.demoLabel,
          mime: body.views?.[0]?.mimeType,
          viewLabel: body.views?.[0]?.label,
          hamperName: body.hamperName,
          products: body.products,
          urlPrefix: String(body.url || '').slice(0, 64),
          urlLen: String(body.url || '').length,
          containsBanner: String(decodeURIComponent(body.url || '')).includes('DEMO PREVIEW — NOT AI GENERATED'),
        }
      : null,
  };
  fs.writeFileSync(jsonPath, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
} catch (err) {
  const html = await page.content().catch(() => '');
  fs.writeFileSync(path.join(outDir, 'tmp-hamper-preview-ui-fail.html'), html.slice(0, 20000));
  await page.screenshot({ path: shotPath }).catch(() => {});
  console.error(JSON.stringify({
    ok: false,
    error: String(err.message || err),
    pageUrl: page.url(),
    capturedStatus: captured?.status || null,
    screenshot: fs.existsSync(shotPath) ? shotPath : null,
  }));
  process.exitCode = 1;
} finally {
  await browser.close();
}
