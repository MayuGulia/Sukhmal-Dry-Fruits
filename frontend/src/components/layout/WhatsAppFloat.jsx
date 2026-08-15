import React from 'react';
import { MessageCircle } from 'lucide-react';

/**
 * Clears the mobile bottom tab bar (&lt;640px). From tablet up, standard corner margin.
 */
export default function WhatsAppFloat() {
  return (
    <div className="fixed right-4 z-40 bottom-[5.5rem] sm:bottom-6 group">
      <div
        role="tooltip"
        className="pointer-events-none absolute right-[4.25rem] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[var(--sk-espresso)] text-white text-[12px] px-3.5 py-1.5 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shadow-sk-md"
      >
        Need Help? Chat with us
      </div>
      <a
        href="https://wa.me/919876543210?text=Hi%20Sukhmal%2C%20I%20need%20help%20with%20an%20order"
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
