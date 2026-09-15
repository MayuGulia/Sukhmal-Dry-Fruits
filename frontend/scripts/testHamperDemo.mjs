import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const { generateHamperPreview } = await import('../netlify/functions/_shared/generateHamperPreview.js');
const { hamperImageDemoEnabled } = await import('../netlify/functions/_shared/hamperImageDemo.js');

const body = {
  hamperName: 'Classic Four Nut Basket',
  boxType: 'open basket',
  products: [{ name: 'California Almonds', weight: '250g' }],
};

console.log(JSON.stringify({
  flag: process.env.HAMPER_IMAGE_DEMO_MODE || '',
  nodeEnv: process.env.NODE_ENV,
  context: process.env.CONTEXT || '',
  netlifyDev: process.env.NETLIFY_DEV || '',
  demoEnabled: hamperImageDemoEnabled(),
}));

const result = await generateHamperPreview(body);
const url = result.url || '';
console.log(JSON.stringify({
  demo: result.demo || false,
  demoLabel: result.demoLabel || null,
  mime: result.views?.[0]?.mimeType,
  urlPrefix: url.slice(0, 48),
  urlLen: url.length,
  containsBanner: decodeURIComponent(url).includes('DEMO PREVIEW — NOT AI GENERATED'),
  hamperName: result.hamperName,
  viewLabel: result.views?.[0]?.label,
}));

const svg = decodeURIComponent(url.replace(/^data:image\/svg\+xml;charset=utf-8,/, ''));
writeFileSync(path.join(__dirname, '../tmp-hamper-demo.svg'), svg);

process.env.CONTEXT = 'production';
process.env.NODE_ENV = 'production';
console.log(JSON.stringify({ productionWouldEnable: hamperImageDemoEnabled() }));
