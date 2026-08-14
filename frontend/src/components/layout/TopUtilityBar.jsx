import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Truck, MapPin, User, Leaf, Award, Hand, ShoppingBag, Package } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

const LEFT = [
  { Icon: Truck, label: 'Free Delivery on Orders Above ₹999' },
  { Icon: Leaf, label: '100% Natural' },
  { Icon: Award, label: 'Premium Quality' },
  { Icon: Hand, label: 'Handpicked with Care' },
];

export default function TopUtilityBar() {
  const { count } = useCart();

  return (
    <div className="hidden lg:block bg-brand-900 text-cream-200 text-[12px] leading-none">
      <div className="sk-container flex items-center justify-between h-9">
        <div className="flex items-center gap-5 min-w-0">
          {LEFT.map(({ Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5 whitespace-nowrap text-cream-200/95">
              <Icon size={13} strokeWidth={1.75} className="text-gold-400 shrink-0" />
              {label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <button type="button" data-testid="top-ai" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
            <Bot size={13} strokeWidth={1.75} className="text-gold-400" /> AI Assistant
          </button>
          <Link data-testid="top-track" to="/track-order" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
            <Package size={13} strokeWidth={1.75} className="text-gold-400" /> Track Order
          </Link>
          <Link to="/store-locator" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
            <MapPin size={13} strokeWidth={1.75} className="text-gold-400" /> Store Locator
          </Link>
          <Link data-testid="top-login" to="/login" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
            <User size={13} strokeWidth={1.75} className="text-gold-400" /> Login / Sign Up
          </Link>
          <Link to="/cart" data-testid="top-cart" className="relative inline-flex items-center text-cream-200 hover:text-white transition-colors" aria-label="Cart">
            <ShoppingBag size={16} strokeWidth={1.75} className="text-gold-400" />
            <span
              data-testid="top-cart-badge"
              className="absolute -top-2 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--sk-badge-red)] text-white text-[9px] font-bold grid place-items-center leading-none shadow-sm"
            >
              {count}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
