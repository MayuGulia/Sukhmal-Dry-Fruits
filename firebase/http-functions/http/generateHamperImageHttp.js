const { json, readJsonBody, httpsFn } = require('../_shared/httpFn');

const generateHamperImageHttp = httpsFn(async (req, res) => {
  if (req.method !== 'POST') return json(res, { error: 'method', message: 'POST required' }, 405);

  const { generateHamperPreview } = await import('../_shared/ai/generateHamperPreview.js');
  const { classifyGeminiFailure, CUSTOMER_AI_FALLBACK, GEMINI_AUTH_HELP } = await import('../_shared/ai/geminiEnv.js');

  const body = readJsonBody(req);

  try {
    const result = await generateHamperPreview(body);
    return json(res, result);
  } catch (err) {
    const code = err.code || 'gemini_error';
    const { quota, busy } = classifyGeminiFailure(err);
    const status = code === 'not_configured' || code === 'gemini_auth'
      ? 503
      : code === 'bad_request' ? 422 : quota || busy ? 503 : 502;
    const message = code === 'bad_request'
      ? (err.message || 'Add products first')
      : code === 'gemini_auth'
        ? (err.message || GEMINI_AUTH_HELP)
        : quota
          ? 'Gemini image models have no free-tier quota on this key. Turn on billing in Google AI Studio, then try again.'
          : busy
            ? 'The photo studio is busy. Wait a few seconds and tap Generate AI Preview again.'
            : CUSTOMER_AI_FALLBACK;
    return json(res, { error: quota ? 'quota' : busy ? 'busy' : code, message, fallback: true }, status);
  }
}, {
  timeoutSeconds: 180,
  memory: '1GiB',
});

module.exports = { generateHamperImageHttp };
