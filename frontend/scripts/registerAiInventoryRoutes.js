const path = require('path');
const { pathToFileURL } = require('url');

try {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} catch {}

function readJson(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      resolve(req.body);
      return;
    }
    if (req.readableEnded) {
      resolve({});
      return;
    }
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

const GEMINI_MODULE_BUST = 'hamper-image-two-step-v8';
const helperUrl = `${pathToFileURL(
  path.join(__dirname, '../netlify/functions/_shared/geminiInventory.js'),
).href}?v=${GEMINI_MODULE_BUST}`;
const giftHelperUrl = `${pathToFileURL(
  path.join(__dirname, '../netlify/functions/_shared/geminiGiftAdvisor.js'),
).href}?v=${GEMINI_MODULE_BUST}`;
const hamperHelperUrl = `${pathToFileURL(
  path.join(__dirname, '../netlify/functions/_shared/generateHamperPreview.js'),
).href}?v=${GEMINI_MODULE_BUST}`;
const sitemapHelperUrl = `${pathToFileURL(
  path.join(__dirname, '../netlify/functions/_shared/sitemapUrls.js'),
).href}?v=${GEMINI_MODULE_BUST}`;

function registerAiInventoryRoutes(app) {
  if (!app || app.__skAiInventoryRegistered) return app;
  app.__skAiInventoryRegistered = true;
  console.log(
    `[Sukhmal Gemini] local routes registered; GEMINI_MODEL=${process.env.GEMINI_MODEL || '(unset → gemini-2.5-flash)'} imageKey=${Boolean(process.env.GEMINI_IMAGE_API_KEY || process.env.GEMINI_ASSISTANT_API_KEY || process.env.GEMINI_API_KEY)} helper=${helperUrl}`,
  );

  const preview = async (req, res) => {
    try {
      const body = await readJson(req);
      const { previewInventoryCommand, buildPreviewPayload } = await import(helperUrl);
      const result = await previewInventoryCommand(body.command, body.catalog);
      send(res, 200, { ...buildPreviewPayload(result), previewId: null });
    } catch (err) {
      const code = err.code || 'gemini_error';
      const status = code === 'not_configured' || code === 'gemini_auth' ? 501 : code === 'bad_request' || code === 'no_match' ? 422 : 502;
      const message =
        code === 'bad_request' || code === 'no_match'
          ? (err.message || 'Could not understand that command')
          : code === 'gemini_auth' || code === 'not_configured'
            ? (err.message || 'Gemini rejected this API key. Add a new GEMINI_API_KEY in frontend/.env and restart.')
            : "I'm having trouble connecting, please try again in a moment, or chat with us on WhatsApp.";
      send(res, status, { error: code, message });
    }
  };

  const apply = async (req, res) => {
    try {
      const body = await readJson(req);
      send(res, 200, { ok: true, previewId: body.previewId || null });
    } catch (err) {
      send(res, 400, { error: 'bad_request', message: err.message || 'Invalid JSON body' });
    }
  };

  app.post('/api/admin/ai-inventory/preview', preview);
  app.post('/api/admin/ai-inventory/apply', apply);

  app.post('/api/ai-chat', async (req, res) => {
    try {
      const body = await readJson(req);
      const { adviseGifts } = await import(giftHelperUrl);
      const result = await adviseGifts({ messages: body.messages, catalog: body.catalog });
      send(res, 200, result);
    } catch (err) {
      const code = err.code || 'gemini_error';
      const status = code === 'not_configured' ? 503 : code === 'bad_request' ? 422 : 502;
      const message = code === 'bad_request'
        ? (err.message || 'Type a message first')
        : "I'm having trouble connecting, please try again in a moment, or chat with us on WhatsApp.";
      send(res, status, { error: code, message });
    }
  });

  app.post('/api/generate-hamper-image', async (req, res) => {
    try {
      const body = await readJson(req);
      const { generateHamperPreview } = await import(hamperHelperUrl);
      const result = await generateHamperPreview(body);
      send(res, 200, result);
    } catch (err) {
      console.error('[Sukhmal Gemini] generate-hamper-image failed', err.code || '', String(err.message || '').slice(0, 400));
      const code = err.code || 'gemini_error';
      const { classifyGeminiFailure } = await import(
        `${pathToFileURL(path.join(__dirname, '../netlify/functions/_shared/geminiEnv.js')).href}?v=${GEMINI_MODULE_BUST}`
      );
      const { quota, busy } = classifyGeminiFailure(err);
      const status = code === 'not_configured' || code === 'gemini_auth'
        ? 503
        : code === 'bad_request' ? 422 : quota || busy ? 503 : 502;
      const message = code === 'bad_request'
        ? (err.message || 'Add products first')
        : quota
          ? 'Gemini image models have no free-tier quota on this key. Turn on billing in Google AI Studio, then try again.'
          : busy
            ? 'The photo studio is busy. Wait a few seconds and tap Generate AI Preview again.'
          : code === 'gemini_auth'
            ? (err.message || 'Gemini rejected this API key. Add GEMINI_IMAGE_API_KEY in frontend/.env and restart.')
          : "I'm having trouble connecting, please try again in a moment, or chat with us on WhatsApp.";
      send(res, status, { error: quota ? 'quota' : busy ? 'busy' : code, message, fallback: true });
    }
  });

  app.get('/sitemap.xml', async (req, res) => {
    try {
      const { buildSitemapXml } = await import(sitemapHelperUrl);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.end(buildSitemapXml());
    } catch (err) {
      send(res, 500, { error: 'sitemap', message: err.message || 'Sitemap failed' });
    }
  });
  return app;
}

module.exports = { registerAiInventoryRoutes };
