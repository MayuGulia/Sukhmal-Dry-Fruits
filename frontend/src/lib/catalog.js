// Catalog data hooks — fetch from backend /api/catalog/*, fall back to mock data offline
import { useEffect, useState, useCallback } from 'react';
import { api, HAS_BACKEND } from './api';
import { getLiveProducts, subscribeCatalog } from './commerceStore';
import { subscribeLiveProduct, subscribeLiveProducts } from './liveCatalog';
import { db } from './firebase';
import {
  CATEGORIES as MOCK_CATEGORIES,
  PRODUCTS as MOCK_PRODUCTS,
  HAMPERS as MOCK_HAMPERS,
} from '@/data/mockCatalog';

/** Legacy mock slugs → Excel-sourced product slugs (Home tiles / old links). */
const PRODUCT_SLUG_ALIASES = {
  'california-almonds-premium': 'badam-cf',
  'kaju-w320-cashews': 'kaju-320-n',
  'roasted-salted-pistachios': 'pista',
  'kashmiri-walnut-kernels': 'walnut-premium',
  'green-seedless-raisins': 'kishmish-indian',
  'medjool-dates': 'medjoul-dates',
  'ajwa-dates-saudi': 'medjoul-dates',
  'anjeer-turkish-figs': 'anjeer-jumbo',
  'dried-apricots-jumbo': 'khubani-apricot',
  'chia-seeds-black': 'chia-seeds',
  'pumpkin-seeds-roasted': 'pumpkin-seeds',
  'dried-cranberries': 'cranberries',
  'dried-blueberries': 'blue-berry',
};

function findMockProduct(slug) {
  if (!slug) return null;
  const resolved = PRODUCT_SLUG_ALIASES[slug] || slug;
  const live = getLiveProducts({ activeOnly: false });
  const fromLive = live.find((p) => p.slug === resolved || p.slug === slug || p.id === slug || p.id === resolved);
  if (fromLive) return fromLive;
  return MOCK_PRODUCTS.find((p) => p.slug === resolved || p.slug === slug || p.id === slug) || null;
}

function filterProducts({ category, q, bestseller, sort, limit = 200 } = {}) {
  let list = getLiveProducts({ activeOnly: true });
  if (!list.length) list = [...MOCK_PRODUCTS];
  if (category) list = list.filter((p) => p.category === category);
  if (bestseller) list = list.filter((p) => p.bestseller);
  if (q) {
    const needle = q.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        (p.tagline || '').toLowerCase().includes(needle) ||
        (p.category || '').toLowerCase().includes(needle)
    );
  }
  if (sort === 'price_asc') list.sort((a, b) => a.price - b.price);
  if (sort === 'price_desc') list.sort((a, b) => b.price - a.price);
  if (sort === 'rating') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  return list.slice(0, limit);
}

function filterHampers({ tag } = {}) {
  let list = [...MOCK_HAMPERS];
  if (tag) {
    const needle = tag.toLowerCase();
    list = list.filter((h) => (h.tags || []).some((t) => t.toLowerCase() === needle || t.toLowerCase().includes(needle)));
  }
  return list;
}

const HAMPER_SLUG_ALIASES = {
  'royal-gold-hamper': 'gold-elephant-stand',
  'diwali-delight-hamper': 'ganesha-blessing-box',
  'wedding-classic-hamper': 'royal-copper-tray',
  'corporate-elite-hamper': 'navy-peacock-box',
  'birthday-bliss-hamper': 'pink-tulle-basket',
  'rakhi-special-hamper': 'ganesha-blessing-box',
  'eid-mubarak-hamper': 'royal-copper-tray',
  'christmas-cheer-hamper': 'grand-celebration-basket',
  'new-year-glow-hamper': 'gold-elephant-stand',
};

function isCatalogList(value) {
  return Array.isArray(value);
}

function isCatalogItem(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function useCategories() {
  const [data, setData] = useState(MOCK_CATEGORIES);
  const [loading, setLoading] = useState(HAS_BACKEND);
  useEffect(() => {
    if (!HAS_BACKEND) {
      setData(MOCK_CATEGORIES);
      setLoading(false);
      return undefined;
    }
    let m = true;
    api
      .get('/catalog/categories')
      .then((r) => {
        if (m) setData(isCatalogList(r.data) ? r.data : MOCK_CATEGORIES);
      })
      .catch(() => {
        if (m) setData(MOCK_CATEGORIES);
      })
      .finally(() => {
        if (m) setLoading(false);
      });
    return () => {
      m = false;
    };
  }, []);
  return { data, loading };
}

export function useProducts({ category, q, bestseller, sort, limit = 200 } = {}) {
  const [data, setData] = useState(() => filterProducts({ category, q, bestseller, sort, limit }));
  const [loading, setLoading] = useState(Boolean(db) || HAS_BACKEND);

  const applyLocal = useCallback((rows) => {
    const source = Array.isArray(rows) && rows.length ? rows : getLiveProducts({ activeOnly: true });
    let list = source.filter((p) => p.isActive !== false && !p.isDeleted);
    if (category) list = list.filter((p) => p.category === category);
    if (bestseller) list = list.filter((p) => p.bestseller || p.isBestseller);
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          (p.tagline || '').toLowerCase().includes(needle) ||
          (p.category || '').toLowerCase().includes(needle),
      );
    }
    if (sort === 'price_asc') list.sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') list.sort((a, b) => b.price - a.price);
    if (sort === 'rating') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    setData(list.slice(0, limit));
    setLoading(false);
  }, [category, q, bestseller, sort, limit]);

  const fetchIt = useCallback(() => {
    const fallbackData = filterProducts({ category, q, bestseller, sort, limit });
    if (db) {
      applyLocal(getLiveProducts({ activeOnly: true }));
      return Promise.resolve();
    }
    if (!HAS_BACKEND) {
      setData(fallbackData);
      setLoading(false);
      return Promise.resolve();
    }
    setLoading(true);
    const params = {};
    if (category) params.category = category;
    if (q) params.q = q;
    if (bestseller) params.bestseller = true;
    if (sort) params.sort = sort;
    if (limit) params.limit = limit;
    return api
      .get('/catalog/products', { params })
      .then((r) => setData(isCatalogList(r.data) ? r.data : fallbackData))
      .catch(() => setData(fallbackData))
      .finally(() => setLoading(false));
  }, [applyLocal, category, q, bestseller, sort, limit]);

  useEffect(() => {
    if (db) {
      setLoading(true);
      return subscribeLiveProducts((rows) => applyLocal(rows), { activeOnly: true });
    }
    fetchIt();
    if (HAS_BACKEND) return undefined;
    return subscribeCatalog(fetchIt);
  }, [applyLocal, fetchIt]);

  return { data, loading, refetch: fetchIt };
}

export function useProduct(slug) {
  const resolved = PRODUCT_SLUG_ALIASES[slug] || slug;
  const [data, setData] = useState(() => findMockProduct(slug));
  const [loading, setLoading] = useState(() => !findMockProduct(slug) && (Boolean(db) || HAS_BACKEND));
  const [error, setError] = useState(null);

  useEffect(() => {
    const fallback = findMockProduct(slug);
    if (fallback) {
      setData(fallback);
      setLoading(false);
      setError(null);
    }
    if (db) {
      if (!fallback) setLoading(true);
      setError(null);
      return subscribeLiveProduct(resolved, (row) => {
        const next = row || fallback;
        setData(next);
        setError(next ? null : new Error('Product not found'));
        setLoading(false);
      });
    }
    if (!HAS_BACKEND) {
      setData(fallback);
      setError(fallback ? null : new Error('Product not found'));
      setLoading(false);
      return subscribeCatalog(() => setData(findMockProduct(slug)));
    }
    let m = true;
    setLoading(true);
    setError(null);
    api
      .get(`/catalog/product/${slug}`)
      .then((r) => {
        if (m) setData(isCatalogItem(r.data) ? r.data : fallback);
      })
      .catch((e) => {
        if (m) {
          if (fallback) setData(fallback);
          else setError(e);
        }
      })
      .finally(() => {
        if (m) setLoading(false);
      });
    return () => {
      m = false;
    };
  }, [slug, resolved]);
  return { data, loading, error };
}

const REAL_HAMPER_SLUGS = new Set(MOCK_HAMPERS.map((h) => h.slug));

function onlyRealHampers(rows) {
  if (!Array.isArray(rows) || !rows.length) return null;
  const real = rows.filter((h) => REAL_HAMPER_SLUGS.has(h.slug));
  return real.length ? real : null;
}

export function useHampers({ tag } = {}) {
  const [data, setData] = useState(() => filterHampers({ tag }));
  const [loading, setLoading] = useState(HAS_BACKEND);
  useEffect(() => {
    const fallback = filterHampers({ tag });
    if (!HAS_BACKEND) {
      setData(fallback);
      setLoading(false);
      return undefined;
    }
    let m = true;
    setLoading(true);
    const params = {};
    if (tag) params.tag = tag;
    api
      .get('/catalog/hampers', { params })
      .then((r) => {
        if (!m) return;
        setData(onlyRealHampers(r.data) || fallback);
      })
      .catch(() => {
        if (m) setData(fallback);
      })
      .finally(() => {
        if (m) setLoading(false);
      });
    return () => {
      m = false;
    };
  }, [tag]);
  return { data, loading };
}

export function useHamper(slug) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(HAS_BACKEND);
  const [error, setError] = useState(null);
  useEffect(() => {
    const resolved = HAMPER_SLUG_ALIASES[slug] || slug;
    const fallback = MOCK_HAMPERS.find((h) => h.slug === resolved || h.slug === slug) || null;
    if (!HAS_BACKEND) {
      setData(fallback);
      setError(fallback ? null : new Error('Hamper not found'));
      setLoading(false);
      return undefined;
    }
    let m = true;
    setLoading(true);
    setError(null);
    api
      .get(`/catalog/hamper/${resolved}`)
      .then((r) => {
        if (!m) return;
        const row = r.data;
        if (isCatalogItem(row) && REAL_HAMPER_SLUGS.has(row.slug)) setData(row);
        else setData(fallback);
      })
      .catch((e) => {
        if (m) {
          if (fallback) setData(fallback);
          else setError(e);
        }
      })
      .finally(() => {
        if (m) setLoading(false);
      });
    return () => {
      m = false;
    };
  }, [slug]);
  return { data, loading, error };
}

export function ProductSkeleton() {
  return (
    <div className="sk-card animate-pulse">
      <div className="aspect-square bg-cream-300" />
      <div className="p-3.5 space-y-2">
        <div className="h-3 bg-cream-300 rounded w-1/3" />
        <div className="h-4 bg-cream-300 rounded w-3/4" />
        <div className="h-3 bg-cream-300 rounded w-1/4" />
        <div className="h-5 bg-cream-300 rounded w-1/2 mt-2" />
      </div>
    </div>
  );
}

export function HamperSkeleton() {
  return (
    <div className="sk-card animate-pulse">
      <div className="aspect-square bg-cream-300" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-cream-300 rounded w-1/4" />
        <div className="h-4 bg-cream-300 rounded w-2/3" />
        <div className="h-5 bg-cream-300 rounded w-1/3" />
      </div>
    </div>
  );
}
