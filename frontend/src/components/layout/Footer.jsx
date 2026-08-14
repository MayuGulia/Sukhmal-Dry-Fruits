import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, ShieldCheck, Send, Leaf } from 'lucide-react';

function BrandSeal({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden className="shrink-0">
      <circle cx="32" cy="32" r="31" fill="var(--sk-brown-900)" stroke="var(--sk-gold-400)" strokeWidth="2" />
      <circle cx="32" cy="32" r="26" stroke="var(--sk-gold-500)" strokeWidth="1.25" opacity="0.85" />
      <circle cx="32" cy="32" r="22.5" stroke="var(--sk-gold-300)" strokeWidth="0.75" opacity="0.55" />
      <path
        d="M38.5 20.5c-2.2-1.8-5.1-2.4-7.8-1.5-3.4 1.1-5.6 4.2-5.6 7.7 0 3.2 1.7 5.7 4.8 7.1l6.2 2.8c2.1.9 3.2 2.1 3.2 3.8 0 2.3-2 3.9-4.7 3.9-2.1 0-3.9-.8-5.2-2.3l-2.6 2.7c1.9 2.1 4.7 3.3 7.8 3.3 5.1 0 8.7-3.1 8.7-7.6 0-3.5-2-5.9-5.6-7.5l-5.5-2.5c-1.9-.9-2.9-2-2.9-3.5 0-2 1.7-3.4 4.1-3.4 1.7 0 3.2.6 4.3 1.8l2.8-2.8z"
        fill="var(--sk-gold-400)"
      />
    </svg>
  );
}

function PinterestIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.5 2 2 6.3 2 11.6c0 3.9 2.4 7.2 5.8 8.5-.1-.7-.1-1.8.1-2.6.2-.9 1.4-5.9 1.4-5.9s-.3-.7-.3-1.7c0-1.6.9-2.8 2.1-2.8 1 0 1.5.7 1.5 1.6 0 1-.6 2.4-.9 3.8-.3 1.1.5 2.1 1.6 2.1 1.9 0 3.2-2.4 3.2-5.3 0-2.2-1.5-3.8-4.2-3.8-3.1 0-5 2.3-5 4.8 0 .9.3 1.5.7 2 .1.1.1.2.1.3l-.3 1.1c0 .2-.1.2-.3.1-1.3-.5-1.9-1.9-1.9-3.5 0-2.6 2.2-5.8 6.5-5.8 3.5 0 5.8 2.5 5.8 5.2 0 3.6-2 6.2-4.9 6.2-1 0-1.9-.5-2.2-1.2l-.6 2.3c-.2.8-.7 1.7-1.1 2.3.9.3 1.9.4 2.9.4 5.5 0 10-4.3 10-9.6C22 6.3 17.5 2 12 2z" />
    </svg>
  );
}

const col = (title, links) => (
  <div>
    <h4 className="font-ui text-[13px] font-bold tracking-wide text-cream-300 mb-4 uppercase">{title}</h4>
    <ul className="space-y-2.5 text-[13px] text-cream-200/75">
      {links.map((l) => (
        <li key={l.to}>
          <Link to={l.to} className="hover:text-white transition-colors">
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const PAY = [
  { label: 'VISA', sub: null },
  { label: 'MC', sub: 'Mastercard' },
  { label: 'RuPay', sub: null },
  { label: 'UPI', sub: null },
];

export default function Footer() {
  return (
    <footer className="bg-brand-900 text-white mt-16">
      {/* Newsletter */}
      <div className="border-b border-white/10 bg-brand-800/40">
        <div className="sk-container py-10 sm:py-12 lg:py-14 grid lg:grid-cols-[1.1fr_1fr] gap-6 items-center">
          <div className="flex items-start gap-4">
            <BrandSeal size={44} />
            <div>
              <div className="sk-section-eyebrow !text-gold-400">Stay in the loop</div>
              <h3 className="font-display text-2xl sm:text-[1.75rem] mt-1.5 text-cream-100">Get Exclusive Offers & Updates</h3>
              <p className="text-cream-200/75 mt-2 text-sm">Subscribe to our newsletter and never miss a deal.</p>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert('Subscribed!');
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              type="email"
              required
              placeholder="Your email address"
              className="sk-input !rounded-full !bg-white !border-transparent !text-brand-900 placeholder:text-ink-400 flex-1"
            />
            <button type="submit" className="sk-btn-primary !rounded-full whitespace-nowrap px-6">
              <Send size={15} /> Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="sk-container py-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-12 gap-8 lg:gap-6">
        {/* Brand */}
        <div className="col-span-2 sm:col-span-3 lg:col-span-3">
          <Link to="/" className="inline-flex items-center gap-3">
            <BrandSeal size={48} />
            <div className="leading-tight">
              <div className="font-display text-xl text-gold-400 tracking-wide">SUKHMAL</div>
              <div className="text-[9px] tracking-[0.22em] text-cream-200/80 uppercase">Dry Fruits Korner</div>
              <div className="text-[11px] italic text-cream-200/60 mt-0.5 inline-flex items-center gap-1">
                Healthy Life, Naturally <Leaf size={10} className="text-[var(--sk-green-500)]" />
              </div>
            </div>
          </Link>
          <p className="text-sm text-cream-200/65 mt-4 max-w-xs leading-relaxed">
            Premium dry fruits, nuts & curated gift hampers — hand-picked and delivered across India since 1994.
          </p>
          <div className="flex items-center gap-2.5 mt-5">
            {[
              { Ic: Facebook, href: '#', label: 'Facebook' },
              { Ic: Instagram, href: '#', label: 'Instagram' },
              { Ic: Youtube, href: '#', label: 'YouTube' },
              { Ic: PinterestIcon, href: '#', label: 'Pinterest' },
            ].map(({ Ic, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-9 h-9 rounded-full border border-gold-500/40 text-gold-400 grid place-items-center hover:bg-white/10 hover:border-gold-400 transition-colors"
              >
                <Ic size={14} />
              </a>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {col('Shop', [
            { to: '/category/dry-fruits', label: 'Dry Fruits' },
            { to: '/category/nuts', label: 'Nuts' },
            { to: '/category/seeds', label: 'Seeds' },
            { to: '/category/dates', label: 'Dates' },
            { to: '/category/berries', label: 'Berries' },
            { to: '/gift-hampers', label: 'Gift Hampers' },
            { to: '/wedding-gifts', label: 'Wedding Gifts' },
            { to: '/corporate-gifts', label: 'Corporate Gifts' },
            { to: '/offers', label: 'Offers' },
          ])}
        </div>

        <div className="lg:col-span-2">
          {col('Customer Service', [
            { to: '/track-order', label: 'Track Order' },
            { to: '/store-locator', label: 'Store Locator' },
            { to: '/shipping-delivery', label: 'Shipping & Delivery' },
            { to: '/returns-refunds', label: 'Returns & Refunds' },
            { to: '/faqs', label: 'FAQs' },
            { to: '/contact-us', label: 'Contact Us' },
          ])}
        </div>

        <div className="lg:col-span-2">
          {col('My Account', [
            { to: '/account', label: 'My Profile' },
            { to: '/account/orders', label: 'My Orders' },
            { to: '/wishlist', label: 'Wishlist' },
            { to: '/account/addresses', label: 'Addresses' },
            { to: '/account/loyalty', label: 'Loyalty Points' },
          ])}
        </div>

        <div className="lg:col-span-3">
          {col('About Us', [
            { to: '/about-us', label: 'Our Story' },
            { to: '/quality-purity', label: 'Quality & Purity' },
            { to: '/blog', label: 'Blog' },
            { to: '/careers', label: 'Careers' },
            { to: '/sitemap', label: 'Sitemap' },
          ])}

          <div className="mt-8">
            <div className="text-[11px] font-bold tracking-wide uppercase text-cream-300 mb-3">We Accept</div>
            <div className="flex flex-wrap items-center gap-2">
              {PAY.map((p) => (
                <span
                  key={p.label}
                  title={p.sub || p.label}
                  className="min-w-[3.25rem] h-8 px-2 grid place-items-center rounded border border-white/20 bg-white/5 text-[10px] font-bold tracking-wide text-cream-100"
                >
                  {p.label}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-cream-200/80">
                <span className="w-7 h-7 rounded-full border border-gold-500/50 grid place-items-center text-gold-400">
                  <ShieldCheck size={13} />
                </span>
                SSL Secured
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-cream-200/80">
                <span className="w-7 h-7 rounded-full border border-gold-500/50 grid place-items-center text-gold-400">
                  <ShieldCheck size={13} />
                </span>
                100% Secure Payment
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="sk-container py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-cream-200/65">
          <div>© 2025 Sukhmal Dry Fruits Korner. All Rights Reserved.</div>
          <div className="flex items-center gap-3">
            <Link to="/privacy-policy" className="hover:text-white">
              Privacy Policy
            </Link>
            <span className="opacity-40">|</span>
            <Link to="/terms-conditions" className="hover:text-white">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
