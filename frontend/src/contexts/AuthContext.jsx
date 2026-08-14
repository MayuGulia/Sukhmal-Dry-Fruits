import React, { createContext, useContext, useEffect, useState } from 'react';

const Ctx = createContext(null);
const LS = 'sk_auth_v1';

/**
 * Build a /login location that preserves a safe post-auth return path
 * (e.g. checkout). Prefer navigate('/login', { state: { from: '/checkout' } }).
 * Query form: /login?return=/checkout — resolved by AuthPage.resolveReturnPath.
 */
export function loginLocation(returnTo = '/account') {
  const path = typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')
    ? returnTo
    : '/account';
  return { pathname: '/login', search: `?return=${encodeURIComponent(path)}`, state: { from: path, returnTo: path } };
}

// Firebase-shaped mock: user object matches shape we’ll get from Firebase Auth in Phase 7 swap.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const login = ({ email, phone, name, role = 'customer' }) => {
    const u = {
      uid: 'usr_' + Math.random().toString(36).slice(2, 10),
      email: email || null,
      phone: phone || null,
      displayName: name || (email ? email.split('@')[0] : 'Guest'),
      role, // 'customer' | 'admin'
      emailVerified: true,
    };
    localStorage.setItem(LS, JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = () => { localStorage.removeItem(LS); setUser(null); };

  return (
    <Ctx.Provider value={{ user, isAuthed: !!user, isAdmin: user?.role === 'admin', login, logout, loading, loginLocation }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
