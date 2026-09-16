export function optimizedSrc(src) {
  const path = String(src || '');
  if (!path || path.startsWith('data:') || path.startsWith('blob:') || /^https?:\/\//i.test(path)) return path;
  return path.replace(/\.(jpe?g|png)(?=$|[?#])/i, '.webp');
}
