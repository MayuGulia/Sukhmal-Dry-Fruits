import { json } from './_shared/http.js';
import { generateHamperPreview } from './_shared/generateHamperPreview.js';
import { CUSTOMER_AI_FALLBACK, GEMINI_AUTH_HELP } from './_shared/geminiEnv.js';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method', message: 'POST required' }, 405);

  let body = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_request', message: 'Invalid JSON body' }, 400);
  }

  try {
    const result = await generateHamperPreview(body);
    return json(result);
  } catch (err) {
    const code = err.code || 'gemini_error';
    const quota = /prepayment credits are depleted/i.test(err.message || '');
    const busy = /resource has been exhausted|rate[- ]limit/i.test(err.message || '');
    const status = code === 'not_configured' || code === 'gemini_auth'
      ? 503
      : code === 'bad_request' ? 422 : quota || busy ? 503 : 502;
    const message = code === 'bad_request'
      ? (err.message || 'Add products first')
      : code === 'gemini_auth'
        ? (err.message || GEMINI_AUTH_HELP)
        : quota
          ? 'Gemini image credits are used up. Add billing in Google AI Studio, then try again.'
          : busy
            ? 'The photo studio is busy. Wait a few seconds and tap Generate AI Preview again.'
          : CUSTOMER_AI_FALLBACK;
    return json({ error: quota ? 'quota' : busy ? 'busy' : code, message, fallback: true }, status);
  }
};

export const config = { path: '/api/generate-hamper-image' };
