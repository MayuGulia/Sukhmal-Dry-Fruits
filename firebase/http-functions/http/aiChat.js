const { json, readJsonBody, httpsFn } = require('../_shared/httpFn');

const CUSTOMER_AI_FALLBACK =
  "I'm having trouble connecting, please try again in a moment, or chat with us on WhatsApp.";

const aiChat = httpsFn(async (req, res) => {
  if (req.method !== 'POST') return json(res, { error: 'method', message: 'POST required' }, 405);

  const { adviseGifts } = await import('../_shared/ai/geminiGiftAdvisor.js');
  const { CUSTOMER_AI_FALLBACK: fallback, geminiApiKey } = await import('../_shared/ai/geminiEnv.js');

  if (!geminiApiKey()) {
    console.warn('[Sukhmal Gemini] ai-chat missing server API key');
    return json(res, { error: 'not_configured', message: fallback || CUSTOMER_AI_FALLBACK }, 503);
  }

  const body = readJsonBody(req);

  try {
    const result = await adviseGifts({ messages: body.messages, catalog: body.catalog });
    return json(res, result);
  } catch (err) {
    const code = err.code || 'gemini_error';
    const status = code === 'not_configured' ? 503 : code === 'bad_request' ? 422 : 502;
    const message = code === 'bad_request' ? (err.message || 'Type a message first') : (fallback || CUSTOMER_AI_FALLBACK);
    return json(res, { error: code, message }, status);
  }
}, { timeoutSeconds: 60 });

module.exports = { aiChat };
