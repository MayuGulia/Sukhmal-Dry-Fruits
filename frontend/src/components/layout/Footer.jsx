import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, ShieldCheck } from 'lucide-react';
import { BrandLockup } from '@/components/brand/BrandSeal';

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
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="bg-[var(--sk-espresso)] text-white">
      <div className="bg-brand-800">
        <div className="sk-container py-8 md:py-10 flex flex-col md:flex-row md:items-center gap-5 md:gap-8 justify-between">
          <div>
            <h3 className="font-display text-xl md:text-2xl font-bold">Get Exclusive Offers & Updates</h3>
            <p className="text-cream-200/70 text-sm mt-1">Join our newsletter for festive launches and member-only deals.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setEmail('');
              setSubscribed(true);
              setTimeout(() => setSubscribed(false), 2500);
            }}
            className="flex w-full md:w-auto md:min-w-[400px] gap-2"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="sk-input !bg-white !border-transparent flex-1 !rounded-full !text-brand-900"
              aria-label="Email for newsletter"
            />
            <button type="submit" className="sk-btn-gold whitespace-nowrap !px-5 !rounded-full">
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </form>
        </div>
      </div>

      <div className="sk-container py-12 grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-10">
        <div className="col-span-2 md:col-span-1">
          <BrandLockup sealSize={56} inverted />
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

        {col('Customer Service', [
          { to: '/track-order', label: 'Track Order' },
          { to: '/store-locator', label: 'Store Locator' },
          { to: '/shipping-delivery', label: 'Shipping & Delivery' },
          { to: '/returns-refunds', label: 'Returns & Refunds' },
          { to: '/faqs', label: 'FAQs' },
          { to: '/contact-us', label: 'Contact Us' },
        ])}

        <div>
          {col('My Account', [
            { to: '/account', label: 'My Profile' },
            { to: '/account/orders', label: 'My Orders' },
            { to: '/wishlist', label: 'Wishlist' },
            { to: '/account/addresses', label: 'Addresses' },
            { to: '/account/loyalty', label: 'Loyalty Points' },
          ])}
          <div className="mt-8">
            {col('About Us', [
              { to: '/about-us', label: 'Our Story' },
              { to: '/quality-purity', label: 'Quality & Purity' },
              { to: '/blog', label: 'Blog' },
              { to: '/careers', label: 'Careers' },
            ])}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="sk-container py-5 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="text-[12px] text-cream-200/65">
            © {new Date().getFullYear()} Sukhmal Dry Fruits Korner. All Rights Reserved.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {PAY.map((p) => (
              <span
                key={p.label}
                title={p.sub || p.label}
                className="min-w-[3.25rem] h-8 px-2 grid place-items-center rounded border border-white/20 bg-white/5 text-[10px] font-bold tracking-wide text-cream-100"
              >
                {p.label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 text-[11px] text-cream-200/80 ml-2">
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

          <div className="flex items-center gap-3 text-[12px] text-cream-200/65">
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
