import { generateGeminiContent } from './geminiClient.js';

const ALLOWED_FIELDS = new Set(['inStock', 'stock', 'price', 'isActive', 'isDeleted', 'isBestseller']);

function geminiKey() {
  if (typeof Netlify !== 'undefined' && Netlify.env?.get) {
    return Netlify.env.get('GEMINI_API_KEY') || Netlify.env.get('GEMINI_ASSISTANT_API_KEY') || '';
  }
  return process.env.GEMINI_API_KEY || process.env.GEMINI_ASSISTANT_API_KEY || '';
}

function norm(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function fuzzyFindProduct(catalog, name) {
  const n = norm(name);
  if (!n) return null;
  let best = null;
  let bestScore = 0;
  for (const p of catalog || []) {
    const hay = norm(`${p.name} ${p.slug} ${p.subcategory || ''} ${p.category || ''}`);
    let score = 0;
    if (hay === n) score = 100;
    else if (hay.includes(n) || n.includes(hay)) score = 80;
    else {
      const words = n.split(' ').filter((w) => w.length > 2);
      if (!words.length) continue;
      const hits = words.filter((w) => hay.includes(w)).length;
      score = (hits / words.length) * 55;
    }
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return bestScore >= 30 ? best : null;
}

function coerceValue(field, raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    if ('value' in raw) return coerceValue(field, raw.value);
  }
  if (field === 'inStock' || field === 'isActive' || field === 'isDeleted' || field === 'isBestseller') {
    if (typeof raw === 'boolean') return raw;
    if (typeof raw === 'number') return raw > 0;
    const s = String(raw ?? '').trim().toLowerCase();
    if (['false', '0', 'no', 'out of stock', 'oos', 'unavailable'].includes(s)) return false;
    if (['true', '1', 'yes', 'in stock', 'available'].includes(s)) return true;
    return Boolean(s);
  }
  if (field === 'stock' || field === 'price') {
    const n = Number(String(raw).replace(/[₹,\s]/g, ''));
    return Number.isFinite(n) ? n : raw;
  }
  return raw;
}

function normalizeField(field, command) {
  const f = String(field || '').trim();
  const mapped = {
    instock: 'inStock',
    in_stock: 'inStock',
    outofstock: 'inStock',
    out_of_stock: 'inStock',
    oos: 'inStock',
    stock: 'stock',
    price: 'price',
    isactive: 'isActive',
    is_active: 'isActive',
    isdeleted: 'isDeleted',
    is_deleted: 'isDeleted',
    isbestseller: 'isBestseller',
    is_bestseller: 'isBestseller',
    bestseller: 'isBestseller',
  }[f.toLowerCase().replace(/\s+/g, '_')];
  if (mapped) return mapped;
  const lower = String(command || '').toLowerCase();
  if (/out of stock|oos|unavailable/.test(lower)) return 'inStock';
  if (/in stock|available/.test(lower) && !/unavailable/.test(lower)) return 'inStock';
  if (/%|discount|price|₹/.test(lower)) return 'price';
  return f || 'inStock';
}

export function readCurrentValue(product, field) {
  if (!product) return null;
  if (field === 'inStock') {
    const variants = product.weightVariants || [];
    if (typeof product.inStock === 'boolean') return product.inStock;
    if (typeof product.stock === 'number') return product.stock > 0;
    if (!variants.length) return true;
    return variants.some((v) => (v.stock ?? 0) > 0);
  }
  if (field === 'stock') {
    if (typeof product.stock === 'number') return product.stock;
    const v = (product.weightVariants || [])[0];
    return typeof v?.stock === 'number' ? v.stock : 0;
  }
  if (field === 'price') return Number(product.price) || 0;
  if (field === 'isActive') return product.isActive !== false;
  if (field === 'isDeleted') return Boolean(product.isDeleted);
  if (field === 'isBestseller') return Boolean(product.isBestseller || product.bestseller);
  return product[field] ?? null;
}

function valuesEqual(a, b) {
  if (typeof a === 'boolean' || typeof b === 'boolean') return Boolean(a) === Boolean(b);
  if (typeof a === 'number' || typeof b === 'number') return Number(a) === Number(b);
  return String(a) === String(b);
}

function parseGeminiJson(text) {
  const raw = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('Gemini did not return JSON');
  return JSON.parse(raw.slice(start, end + 1));
}

async function callGemini(command, catalog) {
  const key = geminiKey();
  if (!key) {
    const err = new Error('GEMINI_API_KEY is not set on the server');
    err.code = 'not_configured';
    throw err;
  }

  const slim = (catalog || []).slice(0, 120).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    price: p.price,
    inStock: readCurrentValue(p, 'inStock'),
    stock: readCurrentValue(p, 'stock'),
  }));

  const prompt = `You are the inventory manager for Sukhmal Dry Fruits Korner.
Read the admin's natural-language command and return ONE proposed field change.

Command: ${JSON.stringify(command)}

Catalog (use these names only):
${JSON.stringify(slim)}

Rules:
- productName must match a catalog product (prefer the closest name).
- field must be one of: inStock, stock, price, isActive, isDeleted, isBestseller.
- "out of stock", "oos", "mark unavailable" → field "inStock", newValue false.
- "in stock" / "available" → field "inStock", newValue true.
- stock counts → field "stock", newValue a number.
- price / ₹ / discount to a rupee amount → field "price", newValue the new integer rupee price.
- newValue must be the TARGET value, not the current value.
- Return JSON only: {"productName": string, "field": string, "newValue": boolean|number|string}`;

  const { text } = await generateGeminiContent({
    key,
    label: 'ai-inventory',
    body: {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            productName: { type: 'STRING' },
            field: { type: 'STRING' },
            newValue: { type: 'STRING' },
          },
          required: ['productName', 'field', 'newValue'],
        },
      },
    },
  });
  return parseGeminiJson(text);
}

export async function previewInventoryCommand(command, catalog) {
  const text = String(command || '').trim();
  if (!text) {
    const err = new Error('Type a command first');
    err.code = 'bad_request';
    throw err;
  }
  if (!Array.isArray(catalog) || !catalog.length) {
    const err = new Error('No products available to look up');
    err.code = 'bad_request';
    throw err;
  }

  const parsed = await callGemini(text, catalog);
  const field = normalizeField(parsed.field, text);
  if (!ALLOWED_FIELDS.has(field)) {
    const err = new Error(`Unsupported field "${parsed.field || field}"`);
    err.code = 'bad_request';
    throw err;
  }

  const product = fuzzyFindProduct(catalog, parsed.productName) || fuzzyFindProduct(catalog, text);
  if (!product) {
    const err = new Error(`No product matched "${parsed.productName || text}"`);
    err.code = 'no_match';
    throw err;
  }

  let newValue = coerceValue(field, parsed.newValue);
  if (field === 'inStock' && /out of stock|oos|unavailable/.test(text.toLowerCase())) {
    newValue = false;
  }
  if (field === 'inStock' && /\bin stock\b|\bavailable\b/.test(text.toLowerCase()) && !/out of stock|unavailable/.test(text.toLowerCase())) {
    newValue = true;
  }

  const currentValue = readCurrentValue(product, field);
  const changed = !valuesEqual(currentValue, newValue);

  return {
    productName: parsed.productName,
    field,
    newValue,
    product,
    currentValue,
    changed,
  };
}

export function buildPreviewPayload(result) {
  const change = {
    type: 'update',
    productId: result.product.id,
    slug: result.product.slug,
    productName: result.product.name,
    field: result.field,
    before: result.currentValue,
    after: result.newValue,
    currentValue: result.currentValue,
    newValue: result.newValue,
    noop: !result.changed,
  };
  return {
    changes: [change],
    hasChanges: result.changed,
  };
}

export { ALLOWED_FIELDS, coerceValue, normalizeField, valuesEqual };
