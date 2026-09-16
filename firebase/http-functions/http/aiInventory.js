const path = require('path');
const { pathToFileURL } = require('url');
const { json, readJsonBody, httpsFn, VERTEX_RUNTIME_SA } = require('../_shared/httpFn');

const GREETING_RE = /^(hi|hii+|hello|hey|namaste|yo|hola|good\s+(morning|afternoon|evening))\b/i;
const GREETING_ANSWER = 'Hi — I’m Sukhmal’s inventory assistant. I can check today’s revenue, list low-stock products, summarise the cart-to-checkout funnel, and preview stock or price changes before anything is written. Try “what’s today’s revenue”, “which products are low in stock”, or “set almonds 250g price to ₹399”.';

let helperMod = null;
const HELPER_REV = 'category-count-v11';
async function loadInventoryHelper() {
  if (helperMod) return helperMod;
  const url = pathToFileURL(path.join(__dirname, '../_shared/ai/geminiInventory.js')).href;
  helperMod = await import(`${url}?v=${HELPER_REV}`);
  return helperMod;
}

const aiInventory = httpsFn(async (req, res) => {
  if (req.method !== 'POST') return json(res, { error: 'method', message: 'POST required' }, 405);

  const op = String(req.query?.op || '').trim();
  const reqPath = String(req.path || req.originalUrl || req.url || '');
  const body = readJsonBody(req);
  const command = String(body.command || '').trim();

  const isApply = op === 'apply' || reqPath.includes('/apply') || (body.previewId && !command);
  const isPreview = !isApply && (op === 'preview' || reqPath.includes('/preview') || Boolean(command));

  if (isApply) {
    return json(res, {
      ok: true,
      note: 'Apply is performed against the live catalog / Firestore from the admin session.',
      previewId: body.previewId || null,
    });
  }

  if (!isPreview) return json(res, { error: 'not_found', message: 'Unknown inventory path' }, 404);

  if (GREETING_RE.test(command) && command.length < 24) {
    return json(res, {
      mode: 'answer',
      answer: GREETING_ANSWER,
      toolsUsed: [],
      changes: [],
      hasChanges: false,
    });
  }

  let previewInventoryCommand;
  let buildPreviewPayload;
  let CUSTOMER_AI_FALLBACK = "I'm having trouble connecting, please try again in a moment, or chat with us on WhatsApp.";
  try {
    const helper = await loadInventoryHelper();
    previewInventoryCommand = helper.previewInventoryCommand;
    buildPreviewPayload = helper.buildPreviewPayload;
    const envMod = await import(pathToFileURL(path.join(__dirname, '../_shared/ai/geminiEnv.js')).href);
    CUSTOMER_AI_FALLBACK = envMod.CUSTOMER_AI_FALLBACK || CUSTOMER_AI_FALLBACK;
  } catch (err) {
    console.error('[aiInventory] helper import failed', err);
    return json(res, {
      error: 'gemini_error',
      message: err.message || 'Inventory assistant failed to load',
    }, 502);
  }

  try {
    const result = await previewInventoryCommand(command, body.catalog);
    return json(res, buildPreviewPayload(result));
  } catch (err) {
    const code = err.code || 'gemini_error';
    const status = code === 'not_configured' || code === 'gemini_auth' ? 501 : code === 'quota' ? 503 : code === 'bad_request' || code === 'no_match' ? 422 : 502;
    const message =
      code === 'bad_request' || code === 'no_match'
        ? (err.message || 'Could not understand that command')
        : code === 'quota'
          ? (err.message || 'Vertex AI quota is exhausted on this GCP project. Check billing for sukhmal-website, then try again.')
        : code === 'gemini_auth' || code === 'not_configured'
          ? (err.message || 'Vertex AI predict denied. In Google Cloud project sukhmal-website open IAM & Admin → IAM (not Service Accounts) and grant Vertex AI User to firebase-adminsdk-fbsvc@sukhmal-website.iam.gserviceaccount.com, then enable the Vertex AI API.')
          : (err.message || CUSTOMER_AI_FALLBACK);
    return json(res, { error: code, message }, status);
  }
}, { timeoutSeconds: 60, serviceAccount: VERTEX_RUNTIME_SA, secrets: [] });

module.exports = { aiInventory };
