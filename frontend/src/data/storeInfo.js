/** Canonical store contact — used by Contact, Footer, Store Locator, WhatsApp, Gift Advisor. */
export const STORE_NAME = 'Sukhmal Dry Fruits Korner';
export const STORE_ADDRESS =
  'Ground Floor, B-1, Surajmal Vihar, Delhi, East Delhi, Delhi, 110092';
export const STORE_PHONE_DIGITS = '8595321912';
export const STORE_PHONE_DISPLAY = '8595321912';
export const STORE_PHONE_TEL = `+91${STORE_PHONE_DIGITS}`;
export const STORE_WHATSAPP = `91${STORE_PHONE_DIGITS}`;
export const STORE_EMAIL = 'info@sukhmaldryfruits.com';
export const STORE_INSTAGRAM = 'https://www.instagram.com/sukhmal_dry_fruits_korner/';
export const STORE_INSTAGRAM_HANDLE = '@sukhmal_dry_fruits_korner';
export const STORE_HOURS = 'Mon–Sat: 10:00 AM – 8:00 PM';
export const STORE_PHOTOS = [
  '/brand/store-storefront.webp',
  '/brand/store-roasted-salted.webp',
  '/brand/store-hand-mixed-blends.webp',
];

export const STORE_MAPS_URL = `https://maps.google.com/?q=${encodeURIComponent(STORE_ADDRESS)}`;

export const STORES = [
  {
    name: STORE_NAME,
    address: STORE_ADDRESS,
    phone: STORE_PHONE_DISPLAY,
    phoneTel: STORE_PHONE_TEL,
    hours: STORE_HOURS,
    photos: STORE_PHOTOS,
    directionsUrl: STORE_MAPS_URL,
  },
];
