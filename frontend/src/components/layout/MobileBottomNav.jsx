import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutGrid, Gift, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function MobileBottomNav() {
  const { count } = useCart();
  const { isAuthed } = useAuth();

  const tabs = [
    { to: '/', label: 'Home', Icon: Home, end: true },
    { to: '/category/all', label: 'Categories', Icon: LayoutGrid },
    { to: '/build-hamper/budget', label: 'Build Hamper', Icon: Gift },
    { to: '/cart', label: 'Cart', Icon: ShoppingBag, showBadge: true },
    { to: isAuthed ? '/account' : '/login', label: 'Account', Icon: User },
  ];

  return (
    <nav
      data-testid="mob-bottom-nav"
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-cream-100/95 backdrop-blur-md border-t border-line shadow-sk-md pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Primary"
    >
      <div className="grid grid-cols-5">
        {tabs.map(({ to, label, Icon, showBadge, end }) => (
          <NavLink
            key={`${label}-${to}`}
            to={to}
            end={!!end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center pt-2.5 pb-2 gap-0.5 relative transition-colors ${
                isActive ? 'text-brand-900' : 'text-ink-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`relative grid place-items-center ${isActive ? 'scale-105' : ''} transition-transform`}>
                  <Icon size={20} strokeWidth={isActive ? 2.1 : 1.75} />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] rounded-full bg-[var(--sk-badge-red)] text-white text-[9px] font-bold grid place-items-center px-1 leading-none">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </span>
                <span
                  className={`text-[9px] xs:text-[10px] leading-tight text-center px-0.5 ${
                    isActive ? 'font-semibold' : 'font-medium'
                  }`}
                >
                  {label}
                </span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-brand-900" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
