import { envGet } from './geminiEnv.js';
import {
  normalizeGiftCard,
  normalizeHamperProducts,
} from './hamperImagePrompt.js';

function truthy(value) {
  return /^(1|true|yes)$/i.test(String(value || '').trim());
}

function xmlEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * LOCAL DEV ONLY. Never honor this flag on Netlify/Cloud Run production,
 * deploy-preview, or branch-deploy — even if someone sets the env var there.
 */
export function hamperImageDemoEnabled() {
  if (!truthy(envGet('HAMPER_IMAGE_DEMO_MODE'))) return false;

  const context = String(envGet('CONTEXT') || envGet('NETLIFY_CONTEXT') || '').toLowerCase();
  if (['production', 'deploy-preview', 'branch-deploy'].includes(context)) return false;

  const nodeEnv = String(process.env.NODE_ENV || '').toLowerCase();
  const netlifyDev = truthy(process.env.NETLIFY_DEV);
  const isLocal = netlifyDev || nodeEnv === 'development' || nodeEnv === 'test' || context === 'dev';
  return isLocal;
}

function demoSvg({ hamperName, products }) {
  const names = (products || []).slice(0, 4).map((p) => (
    typeof p === 'string' ? p : (p.name || p.productId || 'Item')
  )).join(' · ')
    || 'No products listed';
  const title = 'DEMO PREVIEW — NOT AI GENERATED';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="#3D2914"/>
  <rect x="36" y="36" width="728" height="728" fill="#F6EFE4" stroke="#C4A35A" stroke-width="10"/>
  <text x="400" y="220" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="28" font-weight="700" fill="#8B1E1E">${xmlEscape(title)}</text>
  <text x="400" y="280" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="22" fill="#3D2914">${xmlEscape(hamperName || 'Custom hamper')}</text>
  <text x="400" y="360" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#5C4A3A">Local placeholder while Gemini billing is off</text>
  <foreignObject x="80" y="420" width="640" height="200">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,sans-serif;font-size:18px;color:#3D2914;text-align:center;line-height:1.4">${xmlEscape(names)}</div>
  </foreignObject>
  <text x="400" y="700" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#8A7A68">HAMPER_IMAGE_DEMO_MODE — not a real model output</text>
</svg>`;
}

export function buildHamperImageDemo(body = {}) {
  const products = normalizeHamperProducts(body);
  const hamperName = String(body.hamperName || body.hamperId || 'Custom hamper').trim();
  const boxType = String(body.boxType || body.packaging || hamperName || 'luxury gift box').trim();
  const giftCard = normalizeGiftCard(body.giftCard);
  const svg = demoSvg({ hamperName, products });
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  console.warn('[Sukhmal Gemini] hamper-image DEMO MODE — returning labeled placeholder, not calling Gemini/Vertex');
  return {
    url,
    views: [{ key: 'front', label: 'Front (demo)', url, mimeType: 'image/svg+xml' }],
    products,
    boxType,
    hamperName,
    giftCard,
    demo: true,
    demoLabel: 'DEMO PREVIEW — NOT AI GENERATED',
  };
}
