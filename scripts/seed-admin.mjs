/**
 * ONE-TIME admin seed. Run locally, then DELETE this file and any service-account JSON.
 * Never commit credentials. Admin flag is a Firebase custom claim, not a Firestore field.
 *
 *   node scripts/seed-admin.mjs
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'node:fs';

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_INITIAL_PASSWORD;
const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!email || !password || !saPath) {
  console.error('Set ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD, GOOGLE_APPLICATION_CREDENTIALS');
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync(saPath, 'utf8'))) });

const auth = getAuth();
const existing = await auth.getUserByEmail(email).catch(() => null);
const user = existing || await auth.createUser({ email, password, emailVerified: true });
await auth.setCustomUserClaims(user.uid, { admin: true });
console.log('Seeded admin custom claim for', email, user.uid);
console.log('Delete this script and the service account JSON from the repo now.');
