/**
 * Seed Firestore `hampers` for Vertex hamper-image generation.
 *
 *   node scripts/seed-hampers.mjs
 *
 * Uses firebase/serviceAccountKey.json (GOOGLE_APPLICATION_CREDENTIALS).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const canonicalSa = resolve(repoRoot, 'firebase/serviceAccountKey.json');
const fromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : '';
const saPath = [fromEnv, canonicalSa].find((file) => file && existsSync(file)) || canonicalSa;
const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'sukhmal-website';

if (!existsSync(saPath)) {
  console.error('Missing Admin SDK JSON. Drop it at firebase/serviceAccountKey.json');
  process.exit(1);
}

initializeApp({
  credential: cert(JSON.parse(readFileSync(saPath, 'utf8'))),
  projectId,
});
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
