import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { cartItemImage } from '@/lib/orderImages';

const CartCtx = createContext(null);
const LS_KEY = 'sk_cart_v1';

export function cartLineKey(p, { variant, source = 'product' } = {}) {
  return String(p?.id ?? '') + (variant?.w || '') + (source || '');
}

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [coupon, setCoupon] = useState(null);
  const [hydrated, setHydrated] = useState(false); // gate the save effect until first load completes

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        setItems(p.items || []);
        setCoupon(p.coupon || null);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return; // prevent overwriting saved cart with initial empty state
    try { localStorage.setItem(LS_KEY, JSON.stringify({ items, coupon })); } catch {}
  }, [items, coupon, hydrated]);

  const add = (p, { qty = 1, variant, source = 'product', meta } = {}) => {
    setItems((cur) => {
      const key = cartLineKey(p, { variant, source });
      const exist = cur.find((x) => x.key === key);
      if (exist) return cur.map((x) => (x.key === key ? { ...x, qty: x.qty + qty } : x));
      return [
        ...cur,
        {
          key,
          id: p.id,
          name: p.name,
          image: cartItemImage(p, { source, meta: meta || p.meta }),
          price: (variant && variant.price) || p.price,
          variant: variant?.w || null,
          qty,
          source,
          slug: p.slug,
          meta: meta || p.meta || null,
        },
      ];
    });
  };

  const updateQty = (key, qty) =>
    setItems((cur) => (qty <= 0 ? cur.filter((x) => x.key !== key) : cur.map((x) => (x.key === key ? { ...x, qty } : x))));

  const remove = (key) => setItems((cur) => cur.filter((x) => x.key !== key));
  const clear = () => { setItems([]); setCoupon(null); };

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, x) => s + x.qty * x.price, 0);
    let discount = 0;
    if (coupon?.code === 'WELCOME10') discount = Math.round(subtotal * 0.10);
    if (coupon?.code === 'FESTIVE500' && subtotal >= 1500) discount = 500;
    if (coupon?.code === 'BULK25' && subtotal >= 10000) discount = Math.round(subtotal * 0.25);
    const freeShippingThreshold = 999;
    const shipping = subtotal - discount >= freeShippingThreshold ? 0 : (subtotal > 0 ? 79 : 0);
    const gst = Math.round((subtotal - discount) * 0.05);
    const total = Math.max(0, subtotal - discount + shipping + gst);
    return { subtotal, discount, shipping, gst, total, freeShippingThreshold };
  }, [items, coupon]);

  const count = items.reduce((s, x) => s + x.qty, 0);

  return (
    <CartCtx.Provider value={{ items, add, updateQty, remove, clear, coupon, setCoupon, totals, count, hydrated }}>
      {children}
    </CartCtx.Provider>
  );
};

export const useCart = () => useContext(CartCtx);
