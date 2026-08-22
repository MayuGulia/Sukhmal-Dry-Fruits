const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

let cached = null;

function projectId() {
  return process.env.GCLOUD_PROJECT
    || process.env.GOOGLE_CLOUD_PROJECT
    || process.env.FIREBASE_PROJECT_ID
    || 'sukhmal-website';
}

function serviceAccountPath() {
  const fromEnv = String(process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim();
  const candidates = [
    fromEnv,
    fromEnv ? path.resolve(process.cwd(), fromEnv) : '',
    path.resolve(__dirname, '../../serviceAccountKey.json'),
  ].filter(Boolean);
  return candidates.find((file) => fs.existsSync(file)) || '';
}

async function adminDb() {
  if (cached) return cached;
  try {
    if (!admin.apps.length) {
      const saPath = serviceAccountPath();
      if (saPath) {
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(fs.readFileSync(saPath, 'utf8'))),
          projectId: projectId(),
        });
      } else {
        admin.initializeApp({ projectId: projectId() });
      }
    }
    cached = { db: getFirestore('default'), FieldValue };
    return cached;
  } catch (err) {
    console.error('firebase-admin unavailable', err?.message);
    return null;
  }
}

module.exports = { adminDb };
