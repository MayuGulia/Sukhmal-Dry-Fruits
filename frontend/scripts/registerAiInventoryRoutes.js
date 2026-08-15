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

const GEMINI_MODULE_BUST = 'listmodels-gemini-3.7-flash';
const helperUrl = `${pathToFileURL(
  path.join(__dirname, '../netlify/functions/_shared/geminiInventory.js'),
).href}?v=${GEMINI_MODULE_BUST}`;
const giftHelperUrl = `${pathToFileURL(
  path.join(__dirname, '../netlify/functions/_shared/geminiGiftAdvisor.js'),
).href}?v=${GEMINI_MODULE_BUST}`;

function registerAiInventoryRoutes(app) {
  if (!app || app.__skAiInventoryRegistered) return app;
  app.__skAiInventoryRegistered = true;
  console.log(
    `[Sukhmal Gemini] local routes registered; GEMINI_MODEL=${process.env.GEMINI_MODEL || '(unset → gemini-2.5-flash)'} helper=${helperUrl}`,
  );

  const preview = async (req, res) => {
    try {
      const body = await readJson(req);
      const { previewInventoryCommand, buildPreviewPayload } = await import(helperUrl);
      const result = await previewInventoryCommand(body.command, body.catalog);
      send(res, 200, { ...buildPreviewPayload(result), previewId: null });
    } catch (err) {
      const code = err.code || 'gemini_error';
      const status = code === 'not_configured' ? 501 : code === 'bad_request' || code === 'no_match' ? 422 : 502;
      send(res, status, { error: code, message: err.message || 'AI preview failed' });
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
      const status = code === 'not_configured' ? 501 : code === 'bad_request' ? 422 : 502;
      send(res, status, { error: code, message: err.message || 'Gift Advisor failed' });
    }
  });
  return app;
}

module.exports = { registerAiInventoryRoutes };
