import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/919876543210?text=Hi%20Sukhmal%2C%20I%20need%20help%20with%20an%20order"
      target="_blank" rel="noreferrer"
      className="fixed right-4 bottom-20 md:bottom-6 z-40 h-14 w-14 rounded-full bg-[#25D366] shadow-sk-lg grid place-items-center text-white hover:scale-105 transition-transform"
      aria-label="Chat on WhatsApp"
      data-testid="whatsapp-float"
    >
      <MessageCircle size={26} />
    </a>
  );
}
