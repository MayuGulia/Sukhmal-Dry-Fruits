// Catalog data hooks — fetch from backend /api/catalog/*
import { useEffect, useState, useCallback } from 'react';
import { api } from './api';

export function useCategories() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let m = true;
    api.get('/catalog/categories').then((r) => { if (m) setData(r.data); }).finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
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
    return api.get('/catalog/products', { params }).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [category, q, bestseller, sort, limit]);
  useEffect(() => { fetchIt(); }, [fetchIt]);
  return { data, loading, refetch: fetchIt };
}

export function useProduct(slug) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let m = true;
    setLoading(true);
    api.get(`/catalog/product/${slug}`).then((r) => { if (m) setData(r.data); }).catch((e) => { if (m) setError(e); }).finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
  }, [slug]);
  return { data, loading, error };
}

export function useHampers({ tag } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let m = true;
    setLoading(true);
    const params = {};
    if (tag) params.tag = tag;
    api.get('/catalog/hampers', { params }).then((r) => { if (m) setData(r.data); }).finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
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
    api.get(`/catalog/hamper/${slug}`).then((r) => { if (m) setData(r.data); }).catch((e) => { if (m) setError(e); }).finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
  }, [slug]);
  return { data, loading, error };
}

export function ProductSkeleton() {
  return (
    <div className="sk-card animate-pulse">
      <div className="aspect-square bg-cream-300" />
      <div className="p-3.5 space-y-2"><div className="h-3 bg-cream-300 rounded w-1/3" /><div className="h-4 bg-cream-300 rounded w-3/4" /><div className="h-3 bg-cream-300 rounded w-1/4" /><div className="h-5 bg-cream-300 rounded w-1/2 mt-2" /></div>
    </div>
  );
}

export function HamperSkeleton() {
  return (
    <div className="sk-card animate-pulse">
      <div className="aspect-[4/5] bg-cream-300" />
      <div className="p-4 space-y-2"><div className="h-3 bg-cream-300 rounded w-1/4" /><div className="h-4 bg-cream-300 rounded w-2/3" /><div className="h-5 bg-cream-300 rounded w-1/3" /></div>
    </div>
  );
}
