import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dirs = [
  path.join(root, 'frontend/public/products'),
  path.join(root, 'frontend/public/assets'),
  path.join(root, 'frontend/public/brand'),
];
const exts = new Set(['.jpg', '.jpeg', '.png']);

async function loadSharp() {
  const candidates = [
    path.join(root, 'firebase/http-functions/node_modules/sharp'),
    path.join(root, 'frontend/node_modules/sharp'),
    'sharp',
  ];
  for (const c of candidates) {
    try {
      const href = c.includes('node_modules') ? pathToFileURL(c).href : c;
      return (await import(href)).default;
    } catch {}
  }
  throw new Error('Install sharp first (firebase/http-functions already has it).');
}

async function walk(dir, out = []) {
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) await walk(full, out);
    else if (exts.has(path.extname(ent.name).toLowerCase())) out.push(full);
  }
  return out;
}

const sharp = await loadSharp();
const files = (await Promise.all(dirs.map((d) => walk(d)))).flat();
let wrote = 0;
for (const file of files) {
  const dest = file.replace(/\.(jpe?g|png)$/i, '.webp');
  const img = sharp(file).rotate();
  const meta = await img.metadata();
  const width = meta.width > 1600 ? 1600 : undefined;
  await img
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 78, effort: 4 })
    .toFile(dest);
  wrote += 1;
  if (wrote % 40 === 0) console.log(`webp ${wrote}/${files.length}`);
}
console.log(`Wrote ${wrote} WebP files`);
