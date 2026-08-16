import { getLiveProducts, savePreview } from '@/lib/commerceStore';

function norm(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function fuzzyFind(products, name) {
  const n = norm(name);
  if (!n) return [];
  const scored = products.map((p) => {
    const hay = norm(`${p.name} ${p.slug} ${p.subcategory || ''} ${p.category || ''}`);
    let score = 0;
    if (hay === n) score = 100;
    else if (hay.includes(n) || n.includes(hay)) score = 80;
    else if (n.split(' ').every((w) => w.length < 3 || hay.includes(w))) score = 50;
    else {
      const words = n.split(' ').filter((w) => w.length > 2);
      const hits = words.filter((w) => hay.includes(w)).length;
      score = hits ? (hits / words.length) * 40 : 0;
    }
    return { p, score };
  }).filter((x) => x.score >= 30);
  scored.sort((a, b) => b.score - a.score);
  return scored.map((x) => x.p);
}

function parseWeight(text) {
  const m = String(text).match(/(\d+\s?(g|kg|ml))/i);
  return m ? m[1].replace(/\s+/g, '') : null;
}

export function resolveInventoryCommand(command, adminEmail = 'sukhmaldryfruitskorner2@gmail.com') {
  const text = (command || '').trim();
  if (!text) return { previewId: null, changes: [], error: 'Type a command first' };

  const products = getLiveProducts({ activeOnly: false });
  const changes = [];
  const lower = text.toLowerCase();

  if (/list\s+(out of stock|oos)|which .*out of stock/.test(lower)) {
    const oos = products.filter((p) => (p.weightVariants || []).some((v) => (v.stock || 0) <= 0));
    changes.push({
      type: 'list',
      field: 'outOfStock',
      productName: oos.length ? oos.map((p) => p.name).join(', ') : 'None',
      before: oos.length,
      after: oos.length,
    });
  }

  const discount = lower.match(/(\d+)\s*%\s*discount/);
  if (discount) {
    const pct = Number(discount[1]);
    const catHint = lower.match(/to\s+([a-z\s&]+?)(?:,|and|mark|$)/);
    const cat = catHint ? catHint[1].trim() : '';
    const matched = products.filter((p) => {
      const hay = norm(`${p.category} ${p.subcategory} ${p.name}`);
      if (!cat) return /tea|infusion/.test(hay);
      return hay.includes(norm(cat)) || norm(cat).split(' ').some((w) => w.length > 2 && hay.includes(w));
    });
    const affected = matched.length ? matched : fuzzyFind(products, cat || text).slice(0, 8);
    affected.forEach((p) => {
      changes.push({
        type: 'discount',
        productId: p.id,
        productName: p.name,
        category: p.category,
        discountPercent: pct,
        durationHours: null,
        field: 'price',
        before: p.price,
        after: Math.round(p.price * (1 - pct / 100)),
      });
    });
    if (affected.length) {
      changes.push({
        type: 'discount',
        category: cat || 'matched products',
        affectedCount: affected.length,
        discountPercent: pct,
        durationHours: null,
      });
    }
  }

  const oosPhrase = /mark\s+(.+?)\s+out of stock/.exec(lower) || /(.+?)\s+out of stock/.exec(lower);
  if (oosPhrase && !/list/.test(lower)) {
    const name = oosPhrase[1].replace(/apply.*?stock/i, '').replace(/,\s*$/, '').trim();
    const hits = fuzzyFind(products, name).slice(0, 3);
    hits.forEach((p) => {
      const weight = parseWeight(text);
      const v = p.weightVariants?.find((x) => x.weight === weight) || p.weightVariants?.[0];
      changes.push({
        type: 'stock',
        productId: p.id,
        productName: p.name,
        weight: v?.weight || null,
        field: 'stock',
        before: (v?.stock ?? 0) > 0,
        after: false,
      });
    });
  }

  const inStockPhrase = /mark\s+(.+?)\s+(in stock|available)/.exec(lower);
  if (inStockPhrase) {
    fuzzyFind(products, inStockPhrase[1]).slice(0, 3).forEach((p) => {
      const v = p.weightVariants?.[0];
      changes.push({
        type: 'stock',
        productId: p.id,
        productName: p.name,
        weight: v?.weight || null,
        field: 'stock',
        before: (v?.stock ?? 0) > 0,
        after: true,
      });
    });
  }

  const pricePhrase = /(?:set|update)?\s*(?:price of\s+)?(.+?)\s+(?:to|at)\s+₹?\s*(\d+)/i.exec(text);
  if (pricePhrase) {
    const hits = fuzzyFind(products, pricePhrase[1]).slice(0, 2);
    hits.forEach((p) => {
      const weight = parseWeight(text);
      changes.push({
        type: 'price',
        productId: p.id,
        productName: p.name,
        weight,
        field: 'price',
        before: p.price,
        after: Number(pricePhrase[2]),
      });
    });
  }

  const removePhrase = /remove\s+(.+)/i.exec(text);
  if (removePhrase && !/discount/.test(lower)) {
    fuzzyFind(products, removePhrase[1]).slice(0, 1).forEach((p) => {
      changes.push({
        type: 'remove',
        productId: p.id,
        productName: p.name,
        field: 'isDeleted',
        before: false,
        after: true,
      });
    });
  }

  if (!changes.length) {
    const hits = fuzzyFind(products, text).slice(0, 3);
    if (hits.length) {
      hits.forEach((p) => {
        changes.push({
          type: 'list',
          productId: p.id,
          productName: p.name,
          field: 'match',
          before: p.price,
          after: p.price,
        });
      });
    }
  }

  const preview = savePreview({ command: text, changes, adminEmail });
  return { previewId: preview.previewId, changes, expiresAt: preview.expiresAt };
}
