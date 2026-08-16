import { generateGeminiContent } from './geminiClient.js';
import { geminiApiKey } from './geminiEnv.js';

const ALLOWED_FIELDS = new Set(['inStock', 'stock', 'price', 'isActive', 'isDeleted', 'isBestseller']);
const PRODUCT_FIELDS = new Set(['isActive', 'isDeleted', 'isBestseller']);

function geminiKey() {
  return geminiApiKey();
}

function norm(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function normWeight(w) {
  return String(w || '').replace(/\s+/g, '').toLowerCase();
}

function weightsEqual(a, b) {
  return Boolean(normWeight(a)) && normWeight(a) === normWeight(b);
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
    if (['true', '1', 'yes', 'in stock', 'available', 'instock'].includes(s)) return true;
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
  if (/in\s*stock|instock|available/.test(lower) && !/unavailable/.test(lower)) return 'inStock';
  if (/%|discount|price|₹/.test(lower)) return 'price';
  return f || 'inStock';
}

function matchCatalogWeight(product, raw) {
  const variants = product.weightVariants || [];
  const n = normWeight(raw);
  if (!n) return null;
  return (
    variants.find((v) => normWeight(v.weight) === n)?.weight
    || variants.find((v) => normWeight(v.weight).startsWith(n) || n.startsWith(normWeight(v.weight)))?.weight
    || null
  );
}

function extractMentionedWeights(command, product) {
  const text = String(command || '');
  const found = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(kg|g|gm|grams?)\b/gi)].map((m) => {
    const unit = m[2].toLowerCase().startsWith('kg') ? 'kg' : 'g';
    return matchCatalogWeight(product, `${m[1]}${unit}`) || `${m[1]}${unit}`;
  }).filter(Boolean);
  return [...new Set(found)];
}

function wantsAllWeights(command) {
  return /all\s+weights|saare\s+weight|dono(\s+weight)?|both\s+weights|har\s+weight/i.test(String(command || ''));
}

function resolveVariants(command, product, hinted) {
  const catalogWeights = (product.weightVariants || []).map((v) => v.weight);
  const hintedList = (Array.isArray(hinted) ? hinted : hinted ? [hinted] : [])
    .map((w) => matchCatalogWeight(product, w))
    .filter(Boolean);
  const mentioned = extractMentionedWeights(command, product);
  if (hintedList.length) return [...new Set(hintedList)];
  if (mentioned.length) return mentioned;
  if (wantsAllWeights(command) || catalogWeights.length) return catalogWeights;
  return [null];
}

function extractPairedPrices(command) {
  const text = String(command || '');
  const m = text.match(/(\d{2,5})\s*(?:se|to|-|→)\s*(\d{2,5})/i);
  if (!m) return null;
  return [Number(m[1]), Number(m[2])];
}

export function readCurrentValue(product, field, variantWeight) {
  if (!product) return null;
  const variants = product.weightVariants || [];
  const v = variantWeight
    ? variants.find((x) => weightsEqual(x.weight, variantWeight))
    : null;
  if (field === 'inStock') {
    if (v) return (v.stock ?? 0) > 0;
    if (typeof product.inStock === 'boolean') return product.inStock;
    if (typeof product.stock === 'number') return product.stock > 0;
    if (!variants.length) return true;
    return variants.some((row) => (row.stock ?? 0) > 0);
  }
  if (field === 'stock') {
    if (v) return typeof v.stock === 'number' ? v.stock : 0;
    if (typeof product.stock === 'number') return product.stock;
    return typeof variants[0]?.stock === 'number' ? variants[0].stock : 0;
  }
  if (field === 'price') {
    if (v) return Number(v.price) || 0;
    return Number(product.price) || 0;
  }
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
  const arrayStart = raw.indexOf('[');
  const objStart = raw.indexOf('{');
  if (arrayStart >= 0 && (objStart < 0 || arrayStart < objStart)) {
    const end = raw.lastIndexOf(']');
    if (end > arrayStart) return JSON.parse(raw.slice(arrayStart, end + 1));
  }
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('Gemini did not return JSON');
  return JSON.parse(raw.slice(start, end + 1));
}

function rowsFromGemini(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.changes)) return parsed.changes;
  if (parsed && typeof parsed === 'object' && parsed.productName) return [parsed];
  return [];
}

function commandImpliesInStock(command) {
  const lower = String(command || '').toLowerCase();
  if (/out of stock|\boos\b|unavailable/.test(lower)) return false;
  if (/in\s*stock|instock|available/.test(lower)) return true;
  return null;
}

function commandImpliesOutOfStock(command) {
  return /out of stock|\boos\b|unavailable/.test(String(command || '').toLowerCase());
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
    weightVariants: (p.weightVariants || []).map((v) => ({
      weight: v.weight,
      price: v.price,
      stock: v.stock,
      inStock: (v.stock ?? 0) > 0,
    })),
  }));

  const prompt = `You are the inventory manager for Sukhmal Dry Fruits Korner.
Parse the admin's Hindi-English command into EVERY field change and EVERY pack size mentioned.

Command: ${JSON.stringify(command)}

Catalog (use these names and weightVariants only):
${JSON.stringify(slim)}

Rules:
- Return JSON only: {"changes":[...]} with one object per field per variant.
- Each change: {"productName": string, "variant": string, "field": string, "newValue": string|number|boolean}
- field must be one of: inStock, stock, price, isActive, isDeleted, isBestseller.
- variant is the pack size (e.g. "250g", "500g"). Use "" for product-level fields (isActive, isDeleted, isBestseller).
- "all weights 250g 500g" means TWO variants: 250g and 500g — not 1kg, not a single row.
- inStock / "instock kar do" / available → field inStock, newValue true (per mentioned variant).
- out of stock / oos → inStock false (per mentioned variant).
- If N weights and N prices appear (including "399 se 599" with 250g and 500g), PAIR IN ORDER: first weight gets first price, second weight gets second price.
- If only one target price ("price 599" or "from 399 to 599" with a single pack), apply that target to each mentioned variant.
- "X se Y" with two weights and two numbers is a range across packs (pair), not "set every pack to Y".
- Emit stock AND price as separate rows when both are mentioned.
- newValue is the TARGET value.
- Never return only one change when multiple variants or fields are named.`;

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
            changes: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  productName: { type: 'STRING' },
                  variant: { type: 'STRING' },
                  field: { type: 'STRING' },
                  newValue: { type: 'STRING' },
                },
                required: ['productName', 'field', 'newValue'],
              },
            },
          },
          required: ['changes'],
        },
      },
    },
  });
  return parseGeminiJson(text);
}

function expandRow(row, command, catalog) {
  const field = normalizeField(row.field, command);
  if (!ALLOWED_FIELDS.has(field)) return [];
  const product = fuzzyFindProduct(catalog, row.productName) || fuzzyFindProduct(catalog, command);
  if (!product) return [];

  if (PRODUCT_FIELDS.has(field)) {
    let newValue = coerceValue(field, row.newValue);
    const currentValue = readCurrentValue(product, field, null);
    return [{ product, field, variant: null, currentValue, newValue, changed: !valuesEqual(currentValue, newValue) }];
  }

  const variants = resolveVariants(command, product, row.variant);
  const paired = extractPairedPrices(command);
  const inStockHint = commandImpliesInStock(command);
  const oos = commandImpliesOutOfStock(command);

  return variants.map((variant, idx) => {
    let newValue = coerceValue(field, row.newValue);
    if (field === 'inStock') {
      if (oos) newValue = false;
      else if (inStockHint === true) newValue = true;
    }
    if (field === 'price' && paired && variants.length === paired.length) {
      newValue = paired[idx];
    }
    const currentValue = readCurrentValue(product, field, variant);
    return {
      product,
      field,
      variant,
      currentValue,
      newValue,
      changed: !valuesEqual(currentValue, newValue),
    };
  });
}

function ensureStockAndPriceCoverage(command, catalog, expanded) {
  const product = expanded[0]?.product || fuzzyFindProduct(catalog, command);
  if (!product) return expanded;
  const lower = String(command || '').toLowerCase();
  const wantsStock = /in\s*stock|instock|out of stock|\boos\b|unavailable|available/.test(lower);
  const wantsPrice = /price|₹|rs\.?|\d{2,5}\s*se\s*\d{2,5}/.test(lower);
  const variants = resolveVariants(command, product, null);
  const have = (field, variant) => expanded.some((r) => r.field === field && weightsEqual(r.variant, variant));
  const extra = [];
  if (wantsStock) {
    const oos = commandImpliesOutOfStock(command);
    const want = oos ? false : true;
    variants.forEach((variant) => {
      if (have('inStock', variant)) return;
      const currentValue = readCurrentValue(product, 'inStock', variant);
      extra.push({
        product, field: 'inStock', variant, currentValue, newValue: want,
        changed: !valuesEqual(currentValue, want),
      });
    });
  }
  if (wantsPrice) {
    const paired = extractPairedPrices(command);
    variants.forEach((variant, idx) => {
      if (have('price', variant)) return;
      const newValue = paired
        ? (variants.length === paired.length ? paired[idx] : paired[paired.length - 1])
        : null;
      if (newValue == null || Number.isNaN(Number(newValue))) return;
      const currentValue = readCurrentValue(product, 'price', variant);
      extra.push({
        product, field: 'price', variant, currentValue, newValue: Number(newValue),
        changed: !valuesEqual(currentValue, Number(newValue)),
      });
    });
  }
  return [...expanded, ...extra];
}

function dedupeRows(rows) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const key = `${row.product?.id || ''}::${row.variant || ''}::${row.field}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
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
  const rawRows = rowsFromGemini(parsed);
  if (!rawRows.length) {
    const err = new Error('Gemini did not propose a product change');
    err.code = 'bad_request';
    throw err;
  }

  let expanded = rawRows.flatMap((row) => expandRow(row, text, catalog));
  expanded = ensureStockAndPriceCoverage(text, catalog, expanded);
  expanded = dedupeRows(expanded);

  if (!expanded.length) {
    const err = new Error(`No product matched "${rawRows[0]?.productName || text}"`);
    err.code = 'no_match';
    throw err;
  }

  return { rows: expanded };
}

export function buildPreviewPayload(result) {
  const rows = result.rows || (result.product ? [result] : []);
  const changes = rows.map((row) => ({
    type: 'update',
    productId: row.product.id,
    slug: row.product.slug,
    productName: row.product.name,
    variant: row.variant || '',
    weight: row.variant || '',
    field: row.field,
    before: row.currentValue,
    after: row.newValue,
    currentValue: row.currentValue,
    newValue: row.newValue,
    noop: !row.changed,
  }));
  return {
    changes,
    hasChanges: changes.some((c) => !c.noop),
  };
}

export { ALLOWED_FIELDS, coerceValue, normalizeField, valuesEqual };
