import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, Menu, Gift, User } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Header({ onOpenDrawer }) {
  const { count } = useCart();
  const { user, isAuthed } = useAuth();
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const submit = (e) => { e.preventDefault(); if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`); };

  return (
    <header className="bg-cream-100 border-b border-line">
      <div className="sk-container flex items-center gap-3 h-16 md:h-20">
        {/* Mobile hamburger */}
        <button data-testid="mob-hamburger" onClick={onOpenDrawer} className="md:hidden text-brand-900" aria-label="Menu"><Menu size={26} /></button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-brand-900 grid place-items-center text-cream-300 font-display text-lg md:text-xl leading-none">S</div>
          <div className="hidden md:flex flex-col leading-tight">
            <span className="font-display text-brand-900 text-xl font-bold">SUKHMAL</span>
            <span className="text-[10px] tracking-[.24em] text-brand-700 -mt-0.5">DRY FRUITS KORNER</span>
            <span className="text-[10px] italic text-ink-500 -mt-0.5">Healthy Life, Naturally</span>
          </div>
        </Link>

        {/* Search (desktop) */}
        <form onSubmit={submit} className="hidden md:flex flex-1 max-w-xl mx-4 relative">
          <input value={q} onChange={(e) => setQ(e.target.value)} data-testid="hdr-search" placeholder="Search dry fruits, nuts, gift hampers..." className="sk-input pr-11 pl-4" />
          <button aria-label="Search" className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg bg-brand-900 text-white grid place-items-center"><Search size={18} /></button>
        </form>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <Link to="/wishlist" className="hidden md:inline-flex items-center gap-1 text-brand-900 hover:text-brand-700" aria-label="Wishlist"><Heart size={22} /></Link>
          <Link to="/build-hamper/budget" data-testid="hdr-build-hamper" className="hidden md:inline-flex sk-btn-primary !py-2.5 !px-4 text-sm"><Gift size={16} /> Build Your Own Hamper</Link>
          <button className="md:hidden text-brand-900" onClick={() => nav('/search')} aria-label="Search"><Search size={22} /></button>
          <Link to={isAuthed ? '/account' : '/login'} className="md:hidden text-brand-900" aria-label="Account"><User size={22} /></Link>
          <Link to="/cart" data-testid="hdr-cart" className="relative text-brand-900" aria-label="Cart">
            <ShoppingBag size={24} />
            {count > 0 && <span data-testid="cart-badge" className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gold-500 text-white text-[10px] font-bold grid place-items-center">{count}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}
