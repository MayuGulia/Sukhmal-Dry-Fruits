import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, ChevronDown, Percent } from 'lucide-react';
import { useCategories } from '@/lib/catalog';

const PRIMARY = [
  { to: '/category/dry-fruits', label: 'Dry Fruits' },
  { to: '/category/nuts', label: 'Nuts' },
  { to: '/category/seeds', label: 'Seeds' },
  { to: '/festival-collections', label: 'Festive Gift Hampers' },
  { to: '/category/dates', label: 'Dates' },
  { to: '/category/berries', label: 'Berries' },
  { to: '/gift-hampers', label: 'Gift Hampers' },
  { to: '/wedding-gifts', label: 'Wedding Gifts', badge: 'New' },
  { to: '/corporate-gifts', label: 'Corporate Gifts' },
  { to: '/offers', label: 'Offers', percent: true },
];

const MEGA_EXTRA = [
  { to: '/festival-collections', label: 'Festive Gift Hampers', tagline: 'Diwali, Eid, Rakhi, Christmas & New Year' },
  { to: '/gift-hampers', label: 'Gift Hampers', tagline: 'Curated for every celebration' },
  { to: '/wedding-gifts', label: 'Wedding Gifts', tagline: 'Elegant boxes for the big day' },
  { to: '/corporate-gifts', label: 'Corporate Gifts', tagline: 'Branded hampers for teams' },
  { to: '/offers', label: 'Offers & Combos', tagline: 'Seasonal savings & bundles' },
];

const SPECIAL_CATEGORY_TO = {
  'gift-hampers': '/gift-hampers',
  'festival-collections': '/festival-collections',
};

export default function Nav() {
  const { data: cats } = useCategories();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const extraKeys = new Set(MEGA_EXTRA.map((x) => x.to));
  const fromApi = (cats?.length
    ? cats.map((c) => ({
        to: SPECIAL_CATEGORY_TO[c.slug] || `/category/${c.slug}`,
        label: c.name,
        tagline: c.tagline,
      }))
    : PRIMARY.slice(0, 5).map((l) => ({ to: l.to, label: l.label, tagline: '' }))
  ).filter((item) => !extraKeys.has(item.to) && !MEGA_EXTRA.some((x) => x.label === item.label));

  const megaItems = [...MEGA_EXTRA, ...fromApi];

  return (
    <div className="hidden lg:block bg-white border-b border-line relative z-30">
      <div className="sk-container flex items-center gap-4 xl:gap-5 h-12">
        <div ref={wrapRef} className="relative shrink-0">
          <button
            type="button"
            data-testid="nav-shop-category"
            aria-expanded={open}
            aria-haspopup="true"
            onClick={() => setOpen((v) => !v)}
            onMouseEnter={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[8px] bg-brand-900 text-white text-[13px] font-semibold whitespace-nowrap shadow-sk-sm"
          >
            <Menu size={15} strokeWidth={2} /> Shop by Category
            <ChevronDown size={14} className={`opacity-80 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div
              className="absolute left-0 top-[calc(100%+6px)] w-[min(720px,70vw)] rounded-xl bg-white border border-line shadow-sk-lg overflow-hidden"
              onMouseLeave={() => setOpen(false)}
            >
              <div className="grid grid-cols-2 gap-0 p-2">
                {megaItems.map((item) => (
                  <Link
                    key={item.to + item.label}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="flex flex-col gap-0.5 px-4 py-3 rounded-lg hover:bg-cream-200 transition-colors sk-tap-target"
                  >
                    <span className="text-[12px] font-semibold text-brand-900">{item.label}</span>
                    {item.tagline && <span className="text-[11px] text-ink-500 leading-snug">{item.tagline}</span>}
                  </Link>
                ))}
              </div>
              <div className="border-t border-line px-4 py-2.5 bg-cream-100 flex justify-between items-center">
                <span className="text-[11px] text-ink-500">Explore our full collection</span>
                <Link to="/category/all" onClick={() => setOpen(false)} className="text-[12px] font-semibold text-brand-900 hover:text-brand-700">
                  View all categories →
                </Link>
              </div>
            </div>
          )}
        </div>

        <nav className="flex items-center gap-3 xl:gap-4 text-[12px] xl:text-[12.5px] font-medium text-brand-900 whitespace-nowrap overflow-x-auto scrollbar-none">
          {PRIMARY.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 hover:text-brand-700 transition-colors sk-tap-target ${isActive ? 'text-brand-700' : ''}`
              }
            >
              {l.label}
              {l.badge && (
                <span className="px-1.5 py-[1px] rounded-full text-[9px] font-bold bg-brand-900 text-white leading-none">
                  {l.badge}
                </span>
              )}
              {l.percent && (
                <span className="inline-grid place-items-center w-4 h-4 rounded-full bg-brand-900 text-white" aria-hidden>
                  <Percent size={9} strokeWidth={3} />
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
