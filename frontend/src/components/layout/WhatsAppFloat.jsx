import React from 'react';
import { MessageCircle } from 'lucide-react';
import { STORE_WHATSAPP } from '@/data/storeInfo';

const WA = process.env.REACT_APP_WHATSAPP_NUMBER || STORE_WHATSAPP;

export default function WhatsAppFloat() {
  return (
    <div className="relative z-[1] group">
      <div
        role="tooltip"
        className="pointer-events-none absolute right-[4.25rem] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[var(--sk-espresso)] text-white text-[12px] px-3.5 py-1.5 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shadow-sk-md"
      >
        Need Help? Chat with us
      </div>
      <a
        href={`https://wa.me/${WA}?text=${encodeURIComponent('Hi Sukhmal, I need help with an order')}`}
        target="_blank"
        rel="noreferrer"
        className="h-14 w-14 rounded-full bg-[#25D366] shadow-sk-lg grid place-items-center text-white hover:scale-105 transition-transform"
        aria-label="Need Help? Chat with us"
        data-testid="whatsapp-float"
      >
        <MessageCircle size={26} strokeWidth={1.75} />
      </a>
    </div>
  );
}
