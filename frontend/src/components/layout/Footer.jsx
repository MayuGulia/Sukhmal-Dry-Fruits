import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Twitter, Linkedin, ShieldCheck, Send } from 'lucide-react';

const col = (title, links) => (
  <div>
    <h4 className="font-display text-lg text-cream-300 mb-4">{title}</h4>
    <ul className="space-y-2.5 text-[13px] text-cream-200/80">
      {links.map((l) => <li key={l.to}><Link to={l.to} className="hover:text-white">{l.label}</Link></li>)}
    </ul>
  </div>
);

export default function Footer() {
  return (
    <footer className="bg-brand-900 text-white mt-16">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="sk-container py-10 md:py-14 grid md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="sk-section-eyebrow !text-gold-400">STAY IN THE LOOP</div>
            <h3 className="font-display text-2xl md:text-3xl mt-2">Get Exclusive Offers & Updates</h3>
            <p className="text-cream-200/80 mt-2 text-sm">Join 20,000+ subscribers. Only quality, no spam.</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed!'); }} className="flex gap-2">
            <input type="email" required placeholder="Your email address" className="sk-input !bg-white/10 !border-white/20 !text-white placeholder:text-white/50" />
            <button className="sk-btn-gold whitespace-nowrap"><Send size={16} /> Subscribe</button>
          </form>
        </div>
      </div>

      <div className="sk-container py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gold-500 grid place-items-center font-display text-white text-xl">S</div>
            <div>
              <div className="font-display text-xl">SUKHMAL</div>
              <div className="text-[10px] tracking-[.24em] opacity-70">DRY FRUITS KORNER</div>
            </div>
          </div>
          <p className="text-sm text-cream-200/70 mt-3 max-w-sm">Premium dry fruits, nuts & curated gift hampers, hand-picked and delivered across India since 1994.</p>
          <div className="flex items-center gap-3 mt-5">
            {[Facebook, Instagram, Youtube, Twitter, Linkedin].map((Ic, i) => (
              <a key={i} href="#" className="w-8 h-8 rounded-full border border-white/20 grid place-items-center hover:bg-white/10"><Ic size={14} /></a>
            ))}
          </div>
        </div>
        {col('Shop', [
          { to: '/category/dry-fruits', label: 'Dry Fruits' },
          { to: '/category/nuts', label: 'Nuts' },
          { to: '/gift-hampers', label: 'Gift Hampers' },
          { to: '/wedding-gifts', label: 'Wedding Gifts' },
          { to: '/corporate-gifts', label: 'Corporate Gifts' },
          { to: '/offers', label: 'Offers' },
        ])}
        {col('Customer Service', [
          { to: '/contact-us', label: 'Contact Us' },
          { to: '/track-order', label: 'Track Order' },
          { to: '/shipping-delivery', label: 'Shipping & Delivery' },
          { to: '/returns-refunds', label: 'Returns & Refunds' },
          { to: '/faqs', label: 'FAQs' },
          { to: '/store-locator', label: 'Store Locator' },
        ])}
        {col('Company', [
          { to: '/about-us', label: 'About Us' },
          { to: '/careers', label: 'Careers' },
          { to: '/blog', label: 'Blog' },
          { to: '/privacy-policy', label: 'Privacy Policy' },
          { to: '/terms-conditions', label: 'Terms & Conditions' },
        ])}
      </div>
      <div className="border-t border-white/10">
        <div className="sk-container py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[12px] text-cream-200/70">
          <div>© 2025 Sukhmal Dry Fruits Korner. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} /> Secure Checkout</span>
            <div className="flex items-center gap-2 opacity-80">
              {['VISA', 'MC', 'RuPay', 'UPI', 'NB'].map((p) => <span key={p} className="px-1.5 py-0.5 border border-white/20 rounded text-[9px] font-bold">{p}</span>)}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
