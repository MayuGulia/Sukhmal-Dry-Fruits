import { json, env } from './_shared/http.js';
import { adviseGifts } from './_shared/geminiGiftAdvisor.js';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method', message: 'POST required' }, 405);
  if (!env('GEMINI_ASSISTANT_API_KEY') && !env('GEMINI_API_KEY')) {
    return json({
      error: 'not_configured',
      message: 'Set GEMINI_ASSISTANT_API_KEY on the server (never in the browser).',
    }, 501);
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_request', message: 'Invalid JSON body' }, 400);
  }

  try {
    const result = await adviseGifts({ messages: body.messages, catalog: body.catalog });
    return json(result);
  } catch (err) {
    const code = err.code || 'gemini_error';
    const status = code === 'not_configured' ? 501 : code === 'bad_request' ? 422 : 502;
    return json({ error: code, message: err.message || 'Gift Advisor failed' }, status);
  }
};

export const config = { path: '/api/ai-chat' };
