export const AUTH_RETURN_KEY = 'sk_auth_return';
export const GOOGLE_AUTH_ERROR_KEY = 'sk_google_auth_error';

export function safeReturnPath(raw) {
  if (typeof raw !== 'string') return '/';
  const path = raw.trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) return '/';
  const pathname = path.split('?')[0].split('#')[0];
  if (['/login', '/signup', '/forgot-password', '/verify-otp'].includes(pathname)) return '/';
  return path;
}

export function rememberReturnTo(path) {
  try {
    sessionStorage.setItem(AUTH_RETURN_KEY, safeReturnPath(path));
  } catch {}
}

export function consumeReturnTo() {
  try {
    const value = safeReturnPath(sessionStorage.getItem(AUTH_RETURN_KEY) || '/');
    sessionStorage.removeItem(AUTH_RETURN_KEY);
    return value;
  } catch {
    return '/';
  }
}

export function peekReturnTo() {
  try {
    return safeReturnPath(sessionStorage.getItem(AUTH_RETURN_KEY) || '');
  } catch {
    return '/';
  }
}

export function storeGoogleAuthError(err) {
  try {
    sessionStorage.setItem(GOOGLE_AUTH_ERROR_KEY, JSON.stringify({
      code: err?.code || '',
      message: err?.message || '',
    }));
  } catch {}
}

export function consumeGoogleAuthError() {
  try {
    const raw = sessionStorage.getItem(GOOGLE_AUTH_ERROR_KEY);
    sessionStorage.removeItem(GOOGLE_AUTH_ERROR_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Safari, iOS, and in-app browsers often block Google popups. Use redirect there. */
export function googleSignInPrefersRedirect() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isiOS = /iPad|iPhone|iPod/i.test(ua)
    || (navigator.platform === 'MacIntel' && Number(navigator.maxTouchPoints || 0) > 1);
  const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|Chromium|Edg|OPR|Firefox|Android/i.test(ua);
  const isInApp = /FBAN|FBAV|Instagram|Line\/|Twitter|LinkedInApp|WhatsApp|MicroMessenger|Snapchat|Pinterest|TikTok|Bytedance|; wv|WV\)/i.test(ua);
  const isStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches
    || window.navigator.standalone === true;
  return Boolean(isiOS || isSafari || isInApp || isStandalone);
}

export function shouldFallbackGoogleRedirect(err) {
  const code = err?.code || '';
  return [
    'auth/popup-blocked',
    'auth/operation-not-supported-in-this-environment',
    'auth/internal-error',
    'auth/web-storage-unsupported',
    'auth/network-request-failed',
  ].includes(code) || /Cross-Origin-Opener-Policy|window\.closed|Unable to establish|popup/i.test(err?.message || '');
}
