import { createRequire } from 'node:module';
import { envGet } from './geminiEnv.js';
import { generateVertexContent } from './vertexImage.js';

const require = createRequire(import.meta.url);
const { ASSISTANT_TOOLS, runInventoryTool } = require('./inventoryTools.cjs');

const ALLOWED_FIELDS = new Set(['inStock', 'stock', 'price', 'isActive', 'isDeleted', 'isBestseller']);
const PRODUCT_FIELDS = new Set(['isActive', 'isDeleted', 'isBestseller']);

function vertexInventoryModel() {
  const configured = String(envGet('GEMINI_MODEL') || '').replace(/^models\//, '');
  if (/^gemini-2\.5-flash/.test(configured)) return configured;
  return 'gemini-2.5-flash';
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

const GREETING_RE = /^(hi|hii+|hello|hey|namaste|yo|hola|good\s+(morning|afternoon|evening))\b/i;

export function greetingAnswer() {
  return 'Hi — I’m Sukhmal’s inventory assistant. I can check today’s revenue, list low-stock products, summarise the cart-to-checkout funnel, and preview stock or price changes before anything is written. Try “what’s today’s revenue”, “which products are low in stock”, or “set almonds 250g price to ₹399”.';
}

function slimCatalog(catalog) {
  return (catalog || []).slice(0, 80).map((p) => ({
    name: p.name,
    slug: p.slug,
    price: p.price,
    weightVariants: (p.weightVariants || []).map((v) => ({
      weight: v.weight,
      price: v.price,
      stock: v.stock,
    })),
  }));
}

const SYSTEM_PROMPT = `You are the admin assistant for Sukhmal Dry Fruits Korner.
Use tools for business questions and catalog writes. Reply in concise plain English.
For greetings, introduce what you can do and do not call tools.
For revenue, orders, low stock, top products, website funnel, or how many products are in a category (including “total stock of dry fruits”), call the matching tool then answer from the tool result. For category questions, report the product COUNT, never kilograms.
For stock or price updates (Hindi or English), call updateStock and/or updatePrice. Never claim the change is already saved.
If a write tool returns proposed:true, tell the admin to review the preview table and tap Apply.
Use catalog names from the prompt. Do not invent products.`;

async function callAssistant(command, catalog) {
  const slim = looksLikeWrite(command) ? slimCatalog(catalog) : [];
  const catalogBlock = slim.length ? `\n\nCatalog:\n${JSON.stringify(slim)}` : '';
  const contents = [{
    role: 'user',
    parts: [{
      text: `Command: ${JSON.stringify(command)}${catalogBlock}`,
    }],
  }];
  const toolsUsed = [];
  const proposed = [];

  for (let round = 0; round < 2; round += 1) {
    const result = await generateVertexContent({
      contents,
      systemInstruction: SYSTEM_PROMPT,
      tools: ASSISTANT_TOOLS,
      generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
      label: 'ai-inventory',
      model: vertexInventoryModel(),
      allowEmpty: true,
    });
    const calls = result.functionCalls || [];
    if (!calls.length) {
      return { text: result.text || '', toolsUsed, proposed };
    }
    contents.push({ role: 'model', parts: result.parts });
    const responseParts = [];
    for (const call of calls) {
      const output = await runInventoryTool(call.name, call.args, catalog);
      toolsUsed.push(call.name);
      if (output?.proposed) proposed.push(output);
      responseParts.push({
        functionResponse: {
          name: call.name,
          response: output && typeof output === 'object' ? output : { result: output },
        },
      });
    }
    contents.push({ role: 'user', parts: responseParts });
  }
  return { text: 'I looked that up. Ask me to Preview again if you need a shorter summary.', toolsUsed, proposed };
}

async function callGeminiLegacy(command, catalog) {
  const slim = slimCatalog(catalog);
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

  const { text } = await generateVertexContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, responseMimeType: 'application/json', maxOutputTokens: 800 },
    label: 'ai-inventory-json',
    model: vertexInventoryModel(),
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

function rowsFromProposed(proposed, command, catalog) {
  return (proposed || []).flatMap((row) => expandRow({
    productName: row.productName,
    variant: row.variant,
    field: row.field,
    newValue: row.newValue,
  }, command, catalog));
}

function looksLikeWrite(command) {
  const t = String(command || '').trim();
  if (/^(what|which|how many|show|list|tell me|kaun|kitna|kya)\b/i.test(t)) return false;
  return /price|₹|set |update |instock|in stock|out of stock|\boos\b|unavailable|isactive|bestseller|delete/i.test(t);
}

function extractCategoryFromCommand(command) {
  const t = String(command || '').toLowerCase();
  if (/dry[\s_-]*fruits?/.test(t)) return 'dry-fruits';
  if (/gift[\s_-]*hampers?|\bhampers?\b/.test(t)) return 'gift-hampers';
  if (/\bnuts?\b/.test(t)) return 'nuts';
  if (/\bseeds?\b/.test(t)) return 'seeds';
  if (/\bdates?\b/.test(t)) return 'dates';
  if (/\bberr(?:y|ies)\b/.test(t)) return 'berries';
  if (/all products|whole catalog|entire catalog/.test(t)) return 'all';
  return '';
}

function looksLikeCategoryCount(command) {
  const t = String(command || '').toLowerCase();
  if (/^(set|update|make)\b/.test(t) || /out of stock|\boos\b|₹/.test(t)) return false;
  if (!extractCategoryFromCommand(command)) return false;
  return /how many|total|kitne|kitna|count|stock|product|categor/.test(t);
}

function looksLikeLookup(command) {
  const t = String(command || '').toLowerCase();
  if (looksLikeCategoryCount(command)) return 'getCategorySummary';
  if (looksLikeWrite(command)) return '';
  if (/revenue|sales|kitna.*(aaya|kamaya|sale)/i.test(t)) return 'getRevenue';
  if (/orders? today|aaj.*order/i.test(t)) return 'getOrdersToday';
  if (/low.?stock|kam stock|out of stock list|khatam|khatm/i.test(t)) return 'getLowStock';
  if (/top (sell|product)|sabse.*(bik|zyada)/i.test(t)) return 'getTopProducts';
  if (/funnel|visitor|website analytic|traffic|clicks/i.test(t)) return 'getWebsiteAnalyticsSummary';
  return '';
}

function rupee(n) {
  return `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
}

function formatToolAnswer(name, data) {
  if (!data || data.error) return data?.error || 'Could not load that figure.';
  if (name === 'getRevenue' || name === 'getOrdersToday') {
    return `${data.dateRange || 'today'}: ${rupee(data.revenue)} paid from ${data.paidOrders} paid orders (${data.orderCount} total).`;
  }
  if (name === 'getLowStock') {
    if (!data.count) return `Nothing at or below ${data.threshold} units.`;
    const lines = (data.items || []).slice(0, 12).map((row) => (
      `${row.productName}${row.variant ? ` ${row.variant}` : ''}: ${row.stock}`
    ));
    return `${data.count} low-stock packs:\n${lines.join('\n')}`;
  }
  if (name === 'getTopProducts') {
    const lines = (data.items || []).map((row, i) => (
      `${i + 1}. ${row.name}: ${row.units} units, ${rupee(row.revenue)}`
    ));
    return lines.length ? `Top sellers (${data.dateRange}):\n${lines.join('\n')}` : 'No paid sales in that range yet.';
  }
  if (name === 'getWebsiteAnalyticsSummary') {
    if (data.empty) return data.message || 'No website analytics yet.';
    return [
      `Visitors: ${data.uniqueVisitors} unique, ${data.returningVisitors} returning.`,
      `Funnel: ${data.funnel?.productView || 0} views → ${data.funnel?.addToCart || 0} carts → ${data.funnel?.checkoutStarted || 0} checkouts → ${data.funnel?.orderPlaced || 0} orders.`,
    ].join('\n');
  }
  if (name === 'getCategorySummary') {
    const label = data.label || 'this category';
    const count = Number(data.productCount) || 0;
    if (!count) return `There are no products in the ${label} category.`;
    const samples = (data.names || []).slice(0, 8);
    const extra = samples.length ? `\nExamples: ${samples.join(', ')}.` : '';
    return `The ${label} category has ${count} products.${extra}`;
  }
  return JSON.stringify(data);
}

function extractStockQty(command) {
  const m = String(command || '').match(/(?:stock|qty|quantity)\s*(?:to|=|:)?\s*(\d{1,5})/i)
    || String(command || '').match(/(\d{1,5})\s*(?:units?|pcs|pieces)/i);
  return m ? Number(m[1]) : null;
}

function localWriteRows(command, catalog) {
  const product = fuzzyFindProduct(catalog, command);
  if (!product) return [];
  const lower = String(command || '').toLowerCase();
  const seed = [];
  const paired = extractPairedPrices(command);
  const priceHit = String(command || '').match(/(?:₹|rs\.?|price)\s*(?:to|=|:)?\s*(\d{2,5})/i);
  if (paired || priceHit) {
    seed.push({
      productName: product.name,
      field: 'price',
      newValue: paired ? paired[0] : Number(priceHit[1]),
      variant: '',
    });
  }
  if (/in\s*stock|instock|out of stock|\boos\b|unavailable|available/.test(lower)) {
    seed.push({
      productName: product.name,
      field: 'inStock',
      newValue: commandImpliesOutOfStock(command) ? false : true,
      variant: '',
    });
  }
  const qty = extractStockQty(command);
  if (qty != null) {
    seed.push({ productName: product.name, field: 'stock', newValue: qty, variant: '' });
  }
  if (/bestseller/.test(lower)) {
    seed.push({
      productName: product.name,
      field: 'isBestseller',
      newValue: !/\bnot\b|nahi|remove|unmark/.test(lower),
    });
  }
  if (!seed.length) return [];
  return dedupeRows(ensureStockAndPriceCoverage(
    command,
    catalog,
    seed.flatMap((row) => expandRow(row, command, catalog)),
  ));
}

async function localLookup(command, catalog) {
  const tool = looksLikeLookup(command);
  if (!tool) return null;
  const args = tool === 'getCategorySummary'
    ? { category: extractCategoryFromCommand(command) || 'all' }
    : {};
  const output = await runInventoryTool(tool, args, catalog);
  return {
    mode: 'answer',
    answer: formatToolAnswer(tool, output),
    rows: [],
    toolsUsed: [tool],
  };
}

export async function previewInventoryCommand(command, catalog) {
  const text = String(command || '').trim();
  if (!text) {
    const err = new Error('Type a command first');
    err.code = 'bad_request';
    throw err;
  }
  if (GREETING_RE.test(text) && text.length < 24) {
    return { mode: 'answer', answer: greetingAnswer(), rows: [], toolsUsed: [] };
  }

  const catalogRows = Array.isArray(catalog) ? catalog : [];

  const localAnswer = await localLookup(text, catalogRows);
  if (localAnswer) return localAnswer;

  if (looksLikeWrite(text)) {
    const localRows = localWriteRows(text, catalogRows);
    if (localRows.length) {
      return {
        mode: 'changes',
        answer: 'Preview of the catalog change. Nothing is written until you tap Apply.',
        rows: localRows,
        toolsUsed: ['local'],
      };
    }
  }

  try {
    const assistant = await callAssistant(text, catalogRows);
    let expanded = dedupeRows(rowsFromProposed(assistant.proposed, text, catalogRows));
    if (!expanded.length && looksLikeWrite(text) && !assistant.proposed.length && !assistant.text) {
      try {
        const parsed = await callGeminiLegacy(text, catalogRows);
        expanded = dedupeRows(
          ensureStockAndPriceCoverage(text, catalogRows, rowsFromGemini(parsed).flatMap((row) => expandRow(row, text, catalogRows))),
        );
      } catch {}
    }
    if (expanded.length) {
      return {
        mode: 'changes',
        answer: assistant.text || '',
        rows: expanded,
        toolsUsed: assistant.toolsUsed,
      };
    }
    return {
      mode: 'answer',
      answer: assistant.text || greetingAnswer(),
      rows: [],
      toolsUsed: assistant.toolsUsed,
    };
  } catch (err) {
    if (GREETING_RE.test(text)) {
      return { mode: 'answer', answer: greetingAnswer(), rows: [], toolsUsed: [] };
    }
    throw err;
  }
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
  const mode = result.mode || (changes.length ? 'changes' : 'answer');
  return {
    mode,
    answer: result.answer || '',
    toolsUsed: result.toolsUsed || [],
    changes,
    hasChanges: changes.some((c) => !c.noop),
  };
}

export { ALLOWED_FIELDS, coerceValue, normalizeField, valuesEqual };
