/**
 * Seed Firestore `hampers` for Vertex hamper-image generation.
 *
 *   node scripts/seed-hampers.mjs
 *
 * Uses Application Default Credentials:
 *   gcloud auth application-default login
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'sukhmal' });
const db = getFirestore('default');

const BASE_URL = (process.env.SITE_ORIGIN || 'https://sukhmaldryfruits.com').replace(/\/$/, '');

const hampers = [
  { slug: 'silver-crystal-tray', name: 'Silver Crystal Tray', layoutType: 'compartment', image: '/brand/hampers/hamper-silver-tray-hero.png' },
  { slug: 'pearl-namkeen-basket', name: 'Pearl Namkeen Basket', layoutType: 'open_arrangement', image: '/brand/hampers/hamper-tan-rope-hero.png' },
  { slug: 'navy-peacock-box', name: 'Navy Peacock Box', layoutType: 'compartment', image: '/brand/hampers/hamper-navy-crocodile-closed-hero.png' },
  { slug: 'ganesha-blessing-box', name: 'Ganesha Blessing Box', layoutType: 'compartment', image: '/brand/hampers/hamper-ganesha-goldbox-hero.png' },
  { slug: 'classic-four-nut-basket', name: 'Classic Four Nut Basket', layoutType: 'open_arrangement', image: '/brand/hampers/hamper-classic-basket-hero.png' },
  { slug: 'orchard-mixed-basket', name: 'Orchard Mixed Basket', layoutType: 'open_arrangement', image: '/brand/hampers/hamper-orchard-basket-hero.png' },
  { slug: 'grand-celebration-basket', name: 'Grand Celebration Basket', layoutType: 'open_arrangement', image: '/brand/hampers/hamper-grand-basket-hero.png' },
  { slug: 'pink-tulle-basket', name: 'Pink Tulle Basket', layoutType: 'open_arrangement', image: '/brand/hampers/hamper-pink-tulle-hero.png' },
  { slug: 'royal-copper-tray', name: 'Royal Copper Tray', layoutType: 'compartment', image: '/brand/hampers/hamper-copper-tray-hero.png' },
  { slug: 'gold-elephant-stand', name: 'Gold Elephant Stand', layoutType: 'compartment', image: '/brand/hampers/hamper-gold-elephant-hero.png' },
];

for (const h of hampers) {
  await db.collection('hampers').doc(h.slug).set({
    name: h.name,
    slug: h.slug,
    layoutType: h.layoutType,
    referenceImageUrl: `${BASE_URL}${h.image}`,
  });
  console.log('seeded', h.slug);
}
console.log('done');
