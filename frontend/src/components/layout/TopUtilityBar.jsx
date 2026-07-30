import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Truck, MapPin, User, Leaf, Award, ShieldCheck } from 'lucide-react';

export default function TopUtilityBar() {
  return (
    <div className="hidden md:block bg-brand-900 text-cream-200 text-[12px]">
      <div className="sk-container flex items-center justify-between h-9">
        <div className="flex items-center gap-5 opacity-90">
          <span className="inline-flex items-center gap-1.5"><Truck size={14} /> Free delivery on orders ₹799+</span>
          <span className="inline-flex items-center gap-1.5"><Leaf size={14} /> 100% Natural</span>
          <span className="inline-flex items-center gap-1.5"><Award size={14} /> Premium Quality</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} /> Handpicked with Care</span>
        </div>
        <div className="flex items-center gap-5">
          <button data-testid="top-ai" className="inline-flex items-center gap-1.5 hover:text-white"><Bot size={14} /> AI Assistant</button>
          <Link data-testid="top-track" to="/track-order" className="inline-flex items-center gap-1.5 hover:text-white"><Truck size={14} /> Track Order</Link>
          <Link to="/store-locator" className="inline-flex items-center gap-1.5 hover:text-white"><MapPin size={14} /> Store Locator</Link>
          <Link data-testid="top-login" to="/login" className="inline-flex items-center gap-1.5 hover:text-white"><User size={14} /> Login / Sign Up</Link>
        </div>
      </div>
    </div>
  );
}
