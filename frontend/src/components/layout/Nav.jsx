import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useCategories } from '@/lib/catalog';

const STATIC_LINKS = [
  { to: '/gift-hampers',    label: 'Gift Hampers' },
  { to: '/wedding-gifts',   label: 'Wedding Gifts', badge: 'New', badgeColor: 'green' },
  { to: '/corporate-gifts', label: 'Corporate Gifts' },
  { to: '/offers',          label: 'Offers', badge: '%', badgeColor: 'gold' },
];

export default function Nav() {
  const { data: cats } = useCategories();
  return (
    <div className="hidden md:block bg-cream-100 border-b border-line">
      <div className="sk-container flex items-center gap-5 h-12 overflow-x-auto">
        <Link to="/category/all" className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-900 text-white text-sm font-semibold whitespace-nowrap shrink-0"><Menu size={16} /> Shop by Category</Link>
        <nav className="flex items-center gap-5 text-[14px] font-medium text-brand-900 whitespace-nowrap">
          {cats.map((c) => (
            <NavLink key={c.slug} to={`/category/${c.slug}`} className={({ isActive }) => `hover:text-brand-700 ${isActive ? 'text-brand-700' : ''}`}>{c.name}</NavLink>
          ))}
          {STATIC_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `hover:text-brand-700 inline-flex items-center gap-1.5 ${isActive ? 'text-brand-700' : ''}`}>
              {l.label}
              {l.badge && <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${l.badgeColor === 'gold' ? 'bg-gold-500 text-white' : 'bg-[var(--sk-green-100)] text-[var(--sk-green-500)]'}`}>{l.badge}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
