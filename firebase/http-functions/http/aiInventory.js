const { json, readJsonBody, httpsFn } = require('../_shared/httpFn');

const aiInventory = httpsFn(async (req, res) => {
  if (req.method !== 'POST') return json(res, { error: 'method', message: 'POST required' }, 405);

  const { previewInventoryCommand, buildPreviewPayload } = await import('../_shared/ai/geminiInventory.js');
  const { CUSTOMER_AI_FALLBACK, GEMINI_AUTH_HELP, envGet } = await import('../_shared/ai/geminiEnv.js');

  const op = String(req.query?.op || '').trim();
  const path = String(req.path || req.originalUrl || req.url || '');
  const body = readJsonBody(req);

  const isApply = op === 'apply' || path.includes('/apply') || (body.previewId && !body.command);
  const isPreview = !isApply && (op === 'preview' || path.includes('/preview') || Boolean(body.command));

  if (isApply) {
    return json(res, {
      ok: true,
      note: 'Apply is performed against the live catalog / Firestore from the admin session.',
      previewId: body.previewId || null,
    });
  }

  if (!isPreview) return json(res, { error: 'not_found', message: 'Unknown inventory path' }, 404);

  if (!envGet('GEMINI_API_KEY') && !envGet('GEMINI_ASSISTANT_API_KEY')) {
    return json(res, {
      error: 'not_configured',
      message: 'GEMINI_API_KEY is not set on the server. Add it in Secret Manager and bind it to this function.',
    }, 501);
  }

  try {
    const result = await previewInventoryCommand(body.command, body.catalog);
    return json(res, buildPreviewPayload(result));
  } catch (err) {
    const code = err.code || 'gemini_error';
    const status = code === 'not_configured' || code === 'gemini_auth' ? 501 : code === 'bad_request' || code === 'no_match' ? 422 : 502;
    const message =
      code === 'bad_request' || code === 'no_match'
        ? (err.message || 'Could not understand that command')
        : code === 'gemini_auth' || code === 'not_configured'
          ? (err.message || GEMINI_AUTH_HELP)
          : CUSTOMER_AI_FALLBACK;
    return json(res, { error: code, message }, status);
  }
}, { timeoutSeconds: 60 });

module.exports = { aiInventory };
