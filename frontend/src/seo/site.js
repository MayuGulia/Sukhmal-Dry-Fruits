export const SITE_URL = 'https://sukhmaldryfruits.com';
export const SITE_NAME = 'Sukhmal Dry Fruits Korner';
export const DEFAULT_OG_IMAGE = '/brand/sukhmal.png';
export const DEFAULT_LOGO = '/brand/sukhmal-logo.png';

export function absUrl(path = '/') {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function assetUrl(src) {
  if (!src) return absUrl(DEFAULT_OG_IMAGE);
  return absUrl(src);
}

export function clip(text, max) {
  const t = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t) return '';
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1)).replace(/\s+\S*$/, '').trim()}…`;
}

export function cleanPath(pathname = '/') {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}
