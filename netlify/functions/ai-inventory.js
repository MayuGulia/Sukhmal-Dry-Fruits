import { json, env } from './_shared/http.js';
import { previewInventoryCommand, buildPreviewPayload } from './_shared/geminiInventory.js';
import { CUSTOMER_AI_FALLBACK, GEMINI_AUTH_HELP } from './_shared/geminiEnv.js';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method', message: 'POST required' }, 405);

  const url = new URL(req.url);
  const op = url.searchParams.get('op') || '';
  const path = url.pathname || '';
  let body = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_request', message: 'Invalid JSON body' }, 400);
  }

  const isApply = op === 'apply' || path.includes('/apply') || (body.previewId && !body.command);
  const isPreview = !isApply && (op === 'preview' || path.includes('/preview') || Boolean(body.command));

  if (isApply) {
    return json({
      ok: true,
      note: 'Apply is performed against the live catalog / Firestore from the admin session.',
      previewId: body.previewId || null,
    });
  }

  if (!isPreview) return json({ error: 'not_found', message: 'Unknown inventory path' }, 404);

  if (!env('GEMINI_API_KEY') && !env('GEMINI_ASSISTANT_API_KEY')) {
    return json({
      error: 'not_configured',
      message: 'GEMINI_API_KEY is not set on the server. Add it in Netlify env (or frontend/.env for local) and restart.',
    }, 501);
  }

  try {
    const result = await previewInventoryCommand(body.command, body.catalog);
    return json(buildPreviewPayload(result));
  } catch (err) {
    const code = err.code || 'gemini_error';
    const status = code === 'not_configured' || code === 'gemini_auth' ? 501 : code === 'bad_request' || code === 'no_match' ? 422 : 502;
    const message =
      code === 'bad_request' || code === 'no_match'
        ? (err.message || 'Could not understand that command')
        : code === 'gemini_auth' || code === 'not_configured'
          ? (err.message || GEMINI_AUTH_HELP)
          : CUSTOMER_AI_FALLBACK;
    return json({ error: code, message }, status);
  }
};

export const config = {
  path: ['/api/admin/ai-inventory/preview', '/api/admin/ai-inventory/apply'],
};
