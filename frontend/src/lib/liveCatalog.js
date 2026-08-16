import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  startAfter,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { replaceProductsFromRemote, subscribeCatalog, getLiveProducts } from '@/lib/commerceStore';
import { PRODUCTS as MOCK_CATALOG_PRODUCTS } from '@/data/mockCatalog';

export function hydrateStorefrontProduct(id, data) {
  const raw = data || {};
  const weightVariants = (raw.weightVariants || raw.variants || []).map((v) => ({
    weight: v.weight || v.w,
    price: Number(v.price) || 0,
    stock: typeof v.stock === 'number' ? v.stock : 20,
    sku: v.sku,
  }));
  const variants = weightVariants.map((v) => ({ w: v.weight, price: v.price, stock: v.stock }));
  const first = weightVariants[0];
  return {
    ...raw,
    id: raw.id || id,
    slug: raw.slug || id,
    name: raw.name,
    price: Number(raw.price) || first?.price || 0,
    images: Array.isArray(raw.images) && raw.images.length ? raw.images : (raw.img ? [raw.img] : []),
    weightVariants,
    variants: variants.length ? variants : (raw.variants || []),
    isActive: raw.isActive !== false,
    isDeleted: Boolean(raw.isDeleted),
    bestseller: Boolean(raw.bestseller || raw.isBestseller),
    isBestseller: Boolean(raw.bestseller || raw.isBestseller),
  };
}

export function subscribeLiveProducts(onRows, { activeOnly = true } = {}) {
  if (!db) {
    const emit = () => onRows(getLiveProducts({ activeOnly }));
    emit();
    return subscribeCatalog(emit);
  }

  const q = activeOnly
    ? query(collection(db, 'products'), where('isActive', '==', true))
    : collection(db, 'products');

  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs
        .map((d) => hydrateStorefrontProduct(d.id, d.data()))
        .filter((p) => !p.isDeleted && (!activeOnly || p.isActive !== false));
      if (rows.length) replaceProductsFromRemote(rows);
      onRows(rows.length ? rows : getLiveProducts({ activeOnly }));
    },
    () => onRows(getLiveProducts({ activeOnly })),
  );
}

export function subscribeLiveProduct(slug, onRow) {
  if (!slug) {
    onRow(null);
    return undefined;
  }

  const localHit = () => {
    const live = getLiveProducts({ activeOnly: false }).find(
      (p) => p.slug === slug || p.id === slug,
    );
    if (live) return live;
    return MOCK_CATALOG_PRODUCTS.find((p) => p.slug === slug || p.id === slug) || null;
  };

  const finish = (row) => {
    const local = localHit();
    if (!row) {
      onRow(local);
      return;
    }
    if (!local) {
      onRow(row);
      return;
    }
    onRow({
      ...local,
      ...row,
      images: Array.isArray(row.images) && row.images.length ? row.images : local.images,
      name: row.name || local.name,
      description: row.description || local.description,
      highlights: row.highlights?.length ? row.highlights : local.highlights,
      variants: row.variants?.length ? row.variants : local.variants,
      weightVariants: row.weightVariants?.length ? row.weightVariants : local.weightVariants,
    });
  };

  if (!db) {
    const emit = () => finish(null);
    emit();
    return subscribeCatalog(emit);
  }

  const applyDirect = () => {
    Promise.all([
      getDoc(doc(db, 'products', slug)).catch(() => null),
      localHit()?.id && localHit().id !== slug
        ? getDoc(doc(db, 'products', localHit().id)).catch(() => null)
        : Promise.resolve(null),
    ]).then(([bySlug, byId]) => {
      const hit = (bySlug && bySlug.exists() && bySlug) || (byId && byId.exists() && byId);
      if (hit) finish(hydrateStorefrontProduct(hit.id, hit.data()));
      else finish(null);
    }).catch(() => finish(null));
  };

  return onSnapshot(
    query(collection(db, 'products'), where('slug', '==', slug), limit(1)),
    (snap) => {
      if (!snap.empty) {
        finish(hydrateStorefrontProduct(snap.docs[0].id, snap.docs[0].data()));
        return;
      }
      applyDirect();
    },
    () => applyDirect(),
  );
}

export const HAMPER_BUILDER_PAGE_SIZE = 24;

export function mapHamperBuilderProduct(p) {
  if (!p) return null;
  const variants = p.weightVariants || p.variants || [];
  const first = variants[0] || {};
  const weight = first.weight || first.w || p.weight || '250g';
  const price = Number(first.price ?? p.price) || 0;
  const rawImg = (Array.isArray(p.images) && p.images[0]) || p.img || p.image || '';
  return {
    id: p.id,
    slug: p.slug || p.id,
    name: p.name,
    price,
    weight,
    category: p.category || '',
    bestseller: Boolean(p.bestseller || p.isBestseller),
    premium: Boolean(p.premium || p.tier === 'premium' || price >= 399),
    img: rawImg,
  };
}

function localHamperSource() {
  const live = getLiveProducts({ activeOnly: true });
  return live.length ? live : MOCK_CATALOG_PRODUCTS;
}

function filterLocalHamperCategory(list, category) {
  if (!category) return list;
  if (category === 'dry-fruits') {
    return list.filter((p) => p.category === 'dry-fruits' || p.category === 'dates');
  }
  return list.filter((p) => p.category === category);
}

function paginateLocalHamper({ category, cursor, pageSize }) {
  const all = filterLocalHamperCategory(localHamperSource(), category)
    .filter((p) => !p.isDeleted && p.isActive !== false);
  const offset = typeof cursor === 'number' ? cursor : 0;
  const slice = all.slice(offset, offset + pageSize);
  return {
    items: slice.map((p) => mapHamperBuilderProduct(hydrateStorefrontProduct(p.id, p))).filter(Boolean),
    cursor: offset + slice.length,
    hasMore: offset + slice.length < all.length,
  };
}

/** Paginated hamper-builder catalog. Does not subscribe to the full products collection. */
export async function fetchHamperBuilderPage({
  category = null,
  cursor = null,
  pageSize = HAMPER_BUILDER_PAGE_SIZE,
} = {}) {
  if (!db) return paginateLocalHamper({ category, cursor, pageSize });

  try {
    const constraints = [];
    if (category) constraints.push(where('category', '==', category));
    constraints.push(where('isActive', '==', true));
    if (cursor) constraints.push(startAfter(cursor));
    constraints.push(limit(pageSize));
    const snap = await getDocs(query(collection(db, 'products'), ...constraints));
    return {
      items: snap.docs
        .map((d) => mapHamperBuilderProduct(hydrateStorefrontProduct(d.id, d.data())))
        .filter((p) => p && p.id),
      cursor: snap.docs[snap.docs.length - 1] || null,
      hasMore: snap.docs.length === pageSize,
    };
  } catch {
    if (cursor && typeof cursor !== 'number') {
      return { items: [], cursor: null, hasMore: false };
    }
    return paginateLocalHamper({ category, cursor: typeof cursor === 'number' ? cursor : 0, pageSize });
  }
}
