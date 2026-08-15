// Catalog data hooks — fetch from backend /api/catalog/*, fall back to mock data offline
import { useEffect, useState, useCallback } from 'react';
import { api } from './api';
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
  return MOCK_PRODUCTS.find((p) => p.slug === resolved || p.slug === slug) || null;
}

function filterProducts({ category, q, bestseller, sort, limit = 200 } = {}) {
  let list = [...MOCK_PRODUCTS];
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

export function useCategories() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let m = true;
    api
      .get('/catalog/categories')
      .then((r) => {
        if (m) setData(r.data);
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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchIt = useCallback(() => {
    setLoading(true);
    const params = {};
    if (category) params.category = category;
    if (q) params.q = q;
    if (bestseller) params.bestseller = true;
    if (sort) params.sort = sort;
    if (limit) params.limit = limit;
    return api
      .get('/catalog/products', { params })
      .then((r) => setData(r.data))
      .catch(() => setData(filterProducts({ category, q, bestseller, sort, limit })))
      .finally(() => setLoading(false));
  }, [category, q, bestseller, sort, limit]);
  useEffect(() => {
    fetchIt();
  }, [fetchIt]);
  return { data, loading, refetch: fetchIt };
}

export function useProduct(slug) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let m = true;
    setLoading(true);
    setError(null);
    api
      .get(`/catalog/product/${slug}`)
      .then((r) => {
        if (m) setData(r.data);
      })
      .catch((e) => {
        const fallback = findMockProduct(slug);
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

const REAL_HAMPER_SLUGS = new Set(MOCK_HAMPERS.map((h) => h.slug));

function onlyRealHampers(rows) {
  if (!Array.isArray(rows) || !rows.length) return null;
  const real = rows.filter((h) => REAL_HAMPER_SLUGS.has(h.slug));
  return real.length ? real : null;
}

export function useHampers({ tag } = {}) {
  const [data, setData] = useState(() => filterHampers({ tag }));
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let m = true;
    setLoading(true);
    const fallback = filterHampers({ tag });
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let m = true;
    setLoading(true);
    setError(null);
    const resolved = HAMPER_SLUG_ALIASES[slug] || slug;
    const fallback = MOCK_HAMPERS.find((h) => h.slug === resolved || h.slug === slug) || null;
    api
      .get(`/catalog/hamper/${resolved}`)
      .then((r) => {
        if (!m) return;
        const row = r.data;
        if (row && REAL_HAMPER_SLUGS.has(row.slug)) setData(row);
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
