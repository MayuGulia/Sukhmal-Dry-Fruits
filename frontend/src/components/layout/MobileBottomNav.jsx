import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutGrid, Gift, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

const tabs = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/category/all', label: 'Categories', Icon: LayoutGrid },
  { to: '/build-hamper/budget', label: 'Hamper', Icon: Gift },
  { to: '/cart', label: 'Cart', Icon: ShoppingBag, showBadge: true },
  { to: '/account', label: 'Account', Icon: User },
];

export default function MobileBottomNav() {
  const { count } = useCart();
  return (
    <nav data-testid="mob-bottom-nav" className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-line shadow-sk-md">
      <div className="grid grid-cols-5">
        {tabs.map(({ to, label, Icon, showBadge }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex flex-col items-center justify-center py-2.5 text-[10px] gap-1 relative ${isActive ? 'text-brand-900' : 'text-ink-500'}`}>
            <Icon size={20} />
            <span>{label}</span>
            {showBadge && count > 0 && (
              <span className="absolute top-1 right-1/2 translate-x-4 -translate-y-1 min-w-[16px] h-[16px] rounded-full bg-gold-500 text-white text-[9px] font-bold grid place-items-center px-1">{count}</span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
