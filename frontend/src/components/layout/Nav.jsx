import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu } from 'lucide-react';

const LINKS = [
  { to: '/category/dry-fruits', label: 'Dry Fruits' },
  { to: '/category/nuts',       label: 'Nuts' },
  { to: '/category/seeds',      label: 'Seeds' },
  { to: '/category/dates',      label: 'Dates' },
  { to: '/category/berries',    label: 'Berries' },
  { to: '/gift-hampers',        label: 'Gift Hampers' },
  { to: '/wedding-gifts',       label: 'Wedding Gifts', badge: 'New', badgeColor: 'green' },
  { to: '/corporate-gifts',     label: 'Corporate Gifts' },
  { to: '/offers',              label: 'Offers', badge: '%', badgeColor: 'gold' },
];

export default function Nav() {
  return (
    <div className="hidden md:block bg-cream-100 border-b border-line">
      <div className="sk-container flex items-center gap-5 h-12">
        <Link to="/category/all" className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-900 text-white text-sm font-semibold"><Menu size={16} /> Shop by Category</Link>
        <nav className="flex items-center gap-5 text-[14px] font-medium text-brand-900">
          {LINKS.map((l) => (
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
