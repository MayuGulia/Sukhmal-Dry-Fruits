/**
 * Homepage assets locked to 01-home-page.jpeg structure.
 * HERO_IMG must not be swapped without explicit user approval.
 */

/** FROZEN — current luxury hamper hero (do not replace). */
export const HERO_IMG = '/brand/hero-luxury-hamper-v2.png';
/**
 * Homepage hero — sukhmal.mp4 is 1920×1080 (16:9 landscape).
 * Banner is aspect-[16/9] so the clip fills the frame with no stretch.
 */
export const HERO_VIDEO_SRC = '/assets/videos/sukhmal.mp4';
export const HERO_VIDEO_LAYOUT = 'cover'; // 'cover' | 'split'
export const HERO_VIDEO_POSITION = 'center center';
/**
 * Wedding hero uses homepage-hero.mp4 inside the same full-bleed frame as sukhmal.mp4
 * (min-h 80vh, object-fit cover). The clip is cropped to that landscape frame —
 * the hero size and aspect are unchanged.
 */
export const WEDDING_VIDEO_SRC = '/assets/videos/homepage-hero.mp4?v=enhanced';
export const WEDDING_VIDEO_POSITION = 'center center';
/** Optional YouTube/Vimeo embed URL — used in the lightbox if set. */
export const HERO_VIDEO_EMBED = '';

export const BYOH_BANNER_IMG = '/brand/byoh-lifestyle.png';
export const WEDDING_PROMO_IMG = '/brand/wedding-gifts-banner.png';
export const CORP_PROMO_IMG = '/brand/corporate-gifts-banner.png';
export const AI_PREVIEW_IMG = '/brand/hero-luxury-hamper-v2.png';

/** Square category cards — product photography on beige bases */
export const SHOP_CATEGORY_TILES = [
  { name: 'Almonds', sub: 'Premium Californian', to: '/product/badam-cf', image: '/products/badam-cf-1.jpg' },
  { name: 'Cashews', sub: 'Whole & Crunchy', to: '/product/kaju-320-n', image: '/products/kaju-320-n-1.jpg' },
  { name: 'Pistachios', sub: 'Iranian Premium', to: '/product/pista-irani', image: '/products/pista-irani-1.jpg' },
  { name: 'Raisins', sub: 'Sun-dried Afghan', to: '/product/kishmish-indian', image: '/products/kishmish-indian-1.jpg' },
  { name: 'Walnuts', sub: 'Kashmiri Kernels', to: '/product/walnut-premium', image: '/products/walnut-premium-1.jpg' },
  { name: 'Dates', sub: 'Medjool & Ajwa', to: '/category/dates', image: '/products/medjoul-dates-1.jpg' },
];

export const FESTIVAL_TILES = [
  { key: 'diwali', name: 'Diwali Gifts', image: '/brand/hampers/hamper-ganesha-goldbox-hero.png', to: '/festival-collections#diwali' },
  { key: 'wedding', name: 'Wedding Gifts', image: '/brand/hampers/hamper-copper-tray-hero.png', to: '/wedding-gifts' },
  { key: 'birthday', name: 'Birthday Gifts', image: '/brand/hampers/hamper-pink-tulle-hero.png', to: '/gift-hampers' },
  { key: 'corporate', name: 'Corporate Gifts', image: '/brand/hampers/hamper-navy-crocodile-closed-hero.png', to: '/corporate-gifts' },
  { key: 'rakhi', name: 'Rakhi Gifts', image: '/brand/hampers/hamper-gold-elephant-hero.png', to: '/festival-collections#rakhi' },
  { key: 'eid', name: 'Eid Gifts', image: '/brand/hampers/hamper-silver-tray-hero.png', to: '/festival-collections#eid' },
];

export const WHY_CHOOSE = [
  { key: 'trust', label: 'Years of Trust', sub: 'Since 1994' },
  { key: 'natural', label: '100% Natural', sub: 'No preservatives' },
  { key: 'quality', label: 'Premium Quality', sub: 'Grade-A only' },
  { key: 'hygiene', label: 'Hygienically Packed', sub: 'Vacuum-sealed' },
  { key: 'delivery', label: 'Express Delivery', sub: 'Pan-India' },
  { key: 'love', label: 'Customer Satisfaction', sub: '50,000+ happy homes' },
];

export const INSTAGRAM_POSTS = [
  '/brand/hampers/hamper-copper-tray-hero.png',
  '/brand/hampers/hamper-gold-elephant-hero.png',
  '/brand/hampers/hamper-ganesha-goldbox-hero.png',
  '/brand/hampers/hamper-pink-tulle-hero.png',
  '/brand/hampers/hamper-navy-crocodile-closed-hero.png',
  '/brand/hampers/hamper-tan-rope-hero.png',
  '/brand/hampers/hamper-grand-basket-hero.png',
  '/brand/hampers/hamper-silver-tray-hero.png',
];
