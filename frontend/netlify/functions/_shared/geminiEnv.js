/** Server-only Gemini keys. Never use REACT_APP_ or NEXT_PUBLIC_ prefixes. */
export const CUSTOMER_AI_FALLBACK =
  "I'm having trouble connecting, please try again in a moment, or chat with us on WhatsApp.";

export const GEMINI_AUTH_HELP =
  'Gemini rejected this API key. Create a new key at https://aistudio.google.com/apikey, set GEMINI_API_KEY in frontend/.env, and restart the server. Do not paste the key into chat.';

export function isGeminiAuthFailure(status, message) {
  return (
    status === 401 ||
    status === 403 ||
    /UNAUTHENTICATED|ACCESS_TOKEN_TYPE_UNSUPPORTED|invalid authentication credentials/i.test(message || '')
  );
}

export function envGet(name) {
  let fromNetlify = '';
  try {
    if (typeof Netlify !== 'undefined' && Netlify.env?.get) {
      fromNetlify = Netlify.env.get(name) || '';
    }
  } catch {}
  return String(fromNetlify || process.env[name] || '').trim();
}

export function geminiApiKey() {
  return envGet('GEMINI_ASSISTANT_API_KEY') || envGet('GEMINI_API_KEY');
}

export function geminiImageApiKey() {
  return envGet('GEMINI_IMAGE_API_KEY') || geminiApiKey();
}

export function vertexEnterpriseEnabled() {
  return /^(1|true|yes)$/i.test(envGet('GOOGLE_GENAI_USE_ENTERPRISE') || envGet('GOOGLE_GENAI_USE_VERTEXAI'));
}

export function keyFingerprint(key) {
  if (!key) return 'none';
  return `${key.slice(0, 3)}…${key.slice(-4)}`;
}
