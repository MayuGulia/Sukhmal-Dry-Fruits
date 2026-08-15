import { json, notConfigured, env } from './_shared/http.js';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!env('GEMINI_API_KEY') && !env('GEMINI_ASSISTANT_API_KEY')) return notConfigured();
  return json({ fallback: true, note: 'Empty-hamper reference photos are required for image-to-image compositing.' });
};

export const config = { path: '/api/generate-hamper-image' };
