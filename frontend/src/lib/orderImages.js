import { HAMPERS, PRODUCTS } from '@/data/mockCatalog';
import { getLiveProducts } from '@/lib/commerceStore';
import { boxCatalogShot } from '@/lib/liveCatalog';

export function isHamperLine(it = {}) {
  const source = String(it.source || it.meta?.type || '').toLowerCase();
  if (source.includes('hamper')) return true;
  const id = String(it.id || it.productId || '');
  if (id.startsWith('h_') || id.startsWith('custom_')) return true;
  const slug = String(it.slug || '');
  if (slug === 'custom-hamper' || /hamper/i.test(slug)) return true;
  return HAMPERS.some((h) => h.id === id || h.slug === slug);
}

function findProduct(it = {}) {
  const id = it.id || it.productId;
  const slug = it.slug;
  const live = getLiveProducts({ activeOnly: false });
  return live.find((p) => p.id === id || p.slug === slug)
    || PRODUCTS.find((p) => p.id === id || p.slug === slug)
    || null;
}

function findHamper(it = {}) {
  const id = it.id || it.productId;
  const slug = it.slug;
  return HAMPERS.find((h) => h.id === id || h.slug === slug) || null;
}

function boxFromPath(src, slug) {
  const path = String(src || '');
  if (slug && !/^p_/i.test(slug) && !/hamper/i.test(slug)) {
    if (!path || /\/products\//i.test(path)) {
      const swapped = path.replace(/-\d+\.(jpe?g|png|webp)/i, '-2.$1');
      if (swapped !== path && path) return swapped;
      return `/products/${slug}-2.jpg?v=3`;
    }
  }
  if (/-\d+\.(jpe?g|png|webp)/i.test(path)) {
    return path.replace(/-\d+\.(jpe?g|png|webp)/i, '-2.$1');
  }
  return path;
}

const FIRESTORE_URL_MAX = 2048;

/** True for data URLs / blobs / oversized strings that must not be written to Firestore. */
export function isInlineMediaUrl(value) {
  const s = String(value || '');
  return /^data:/i.test(s) || /^blob:/i.test(s) || s.length > FIRESTORE_URL_MAX;
}

export function firestoreSafeMediaUrl(value, fallback = '') {
  const s = String(value || '').trim();
  if (!s || isInlineMediaUrl(s)) return fallback || null;
  return s;
}

function catalogItemImage(it = {}) {
  if (isHamperLine(it)) {
    const h = findHamper(it);
    return h?.image || h?.images?.[0] || '/brand/hero-luxury-hamper-v2.png';
  }
  const p = findProduct(it);
  if (p) return boxCatalogShot(p) || p.img || p.image || '';
  return boxFromPath(firestoreSafeMediaUrl(it.image) || '', it.slug) || '';
}

/** Catalog/HTTP path only — never the generated hamper PNG (those exceed the 1MB doc cap). */
export function persistOrderItemImage(it = {}) {
  return firestoreSafeMediaUrl(it.image)
    || firestoreSafeMediaUrl(it.meta?.previewImageUrl)
    || firestoreSafeMediaUrl(catalogItemImage(it))
    || '/brand/hero-luxury-hamper-v2.png';
}

/** Box/jar for catalog products; hamper hero (or custom preview) for gift hampers. */
export function orderItemImage(it = {}) {
  if (isHamperLine(it)) {
    const h = findHamper(it);
    return it.meta?.previewImageUrl
      || h?.image
      || h?.images?.[0]
      || it.image
      || '';
  }
  const p = findProduct(it);
  if (p) return boxCatalogShot(p) || p.img || p.image || '';
  return boxFromPath(it.image, it.slug) || it.image || '';
}

export function cartItemImage(product, { source, meta } = {}) {
  return orderItemImage({
    id: product?.id,
    productId: product?.id,
    slug: product?.slug,
    image: product?.image || product?.img || (Array.isArray(product?.images) ? product.images[0] : ''),
    source,
    meta: meta || product?.meta,
  });
}
