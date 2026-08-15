import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

function Splash() {
  return (
    <div className="min-h-screen grid place-items-center bg-[#FAF7F2] text-brand-900">
      <div className="text-center">
        <div className="font-display text-2xl font-bold">SUKHMAL</div>
        <p className="text-sm text-ink-500 mt-2">Loading…</p>
      </div>
    </div>
  );
}

export function RequireAuth({ children }) {
  const { isAuthed, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Splash />;
  if (!isAuthed) {
    const from = `${loc.pathname}${loc.search || ''}`;
    return <Navigate to="/login" replace state={{ from, returnTo: from }} />;
  }
  return children;
}

export function PublicOnly({ children }) {
  const { isAuthed, isAdmin, loading } = useAuth();
  if (loading) return <Splash />;
  if (isAuthed) return <Navigate to={isAdmin ? '/admin' : '/'} replace />;
  return children;
}
