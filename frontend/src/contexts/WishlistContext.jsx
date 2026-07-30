import React, { createContext, useContext, useEffect, useState } from 'react';

const Ctx = createContext(null);
const LS = 'sk_wishlist_v1';

export const WishlistProvider = ({ children }) => {
  const [ids, setIds] = useState([]);
  useEffect(() => {
    try { const raw = localStorage.getItem(LS); if (raw) setIds(JSON.parse(raw)); } catch {}
  }, []);
  useEffect(() => { localStorage.setItem(LS, JSON.stringify(ids)); }, [ids]);

  const toggle = (id) => setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const has = (id) => ids.includes(id);
  const clear = () => setIds([]);
  return <Ctx.Provider value={{ ids, toggle, has, clear }}>{children}</Ctx.Provider>;
};

export const useWishlist = () => useContext(Ctx);
