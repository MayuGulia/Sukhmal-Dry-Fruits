import { json } from './_shared/http.js';
import { adviseGifts } from './_shared/geminiGiftAdvisor.js';
import { CUSTOMER_AI_FALLBACK } from './_shared/geminiEnv.js';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method', message: 'POST required' }, 405);

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
    const status = code === 'not_configured' ? 503 : code === 'bad_request' ? 422 : 502;
    const message = code === 'bad_request' ? (err.message || 'Type a message first') : CUSTOMER_AI_FALLBACK;
    return json({ error: code, message }, status);
  }
};

export const config = { path: '/api/ai-chat' };
