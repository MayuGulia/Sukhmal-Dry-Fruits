function userTurns(messages) {
  return (messages || []).filter((m) => m?.role === 'user' && m.text).map((m) => String(m.text).trim());
}

function threadText(messages) {
  return (messages || [])
    .filter((m) => m?.text)
    .map((m) => String(m.text))
    .join(' \n ');
}

function extractBudget(text) {
  const nums = [...String(text).matchAll(/₹?\s*(\d{3,6})/g)]
    .map((m) => Number(m[1]))
    .filter((n) => n >= 199 && n <= 200000);
  return nums.length ? Math.min(...nums) : null;
}

function occasionOf(text) {
  const t = String(text || '');
  if (/diwali|deepavali|festive|holi|rakhi|eid/i.test(t)) return 'festive';
  if (/wedding|shaadi|bridal|marriage/i.test(t)) return 'wedding';
  if (/corporate|office|client|employee|boss/i.test(t)) return 'corporate';
  if (/birthday|anniversary|bday/i.test(t)) return 'celebration';
  if (/health|diet|sugar|fitness|immunity/i.test(t)) return 'health';
  if (/hamper|gift box|gift hamper/i.test(t)) return 'hamper';
  return '';
}

function recipientOf(text) {
  const t = String(text || '');
  if (/parent|mother|mom|mummy|father|dad|in-?laws/i.test(t)) return 'family elders';
  if (/wife|husband|spouse|partner/i.test(t)) return 'your partner';
  if (/kid|child|son|daughter/i.test(t)) return 'the kids';
  if (/boss|client|colleague|office/i.test(t)) return 'work';
  if (/friend/i.test(t)) return 'a friend';
  return '';
}

function wantsHamper(text) {
  return /hamper|gift box|packed|assorted/i.test(text || '');
}

function wantsLoose(text) {
  return /loose|pouch|jar|not a hamper|dry fruits only/i.test(text || '');
}

function blob(p) {
  return `${p.name || ''} ${p.category || ''} ${p.subcategory || ''} ${p.tagline || ''} ${p.slug || ''}`.toLowerCase();
}

function alreadyShown(messages) {
  const ids = new Set();
  for (const m of messages || []) {
    for (const p of m.products || []) {
      const id = String(p.id || p.slug || p.name || '').toLowerCase();
      if (id) ids.add(id);
    }
  }
  return ids;
}

function scoreProduct(p, { budget, occasion, query, recipient, hamper, loose }) {
  if (!p || p.isDeleted || p.isActive === false || p.inStock === false) return -999;
  let s = 1;
  const price = Number(p.price) || 0;
  if (p.isBestseller || p.bestseller) s += 5;
  if (budget && price) {
    if (price <= budget) s += 16;
    else if (price <= budget * 1.12) s += 3;
    else s -= 30;
  }
  const b = blob(p);
  const isHamper = /hamper|gift/i.test(b) || /hamper/.test(String(p.category || '').toLowerCase());
  if (hamper && isHamper) s += 14;
  if (loose && isHamper) s -= 12;
  if (occasion === 'festive' && /hamper|gift|mix|dry.?fruit|cashew|almond|pista|date/i.test(b)) s += 6;
  if (occasion === 'wedding' && /hamper|gift|premium|royal|pista|cashew/i.test(b)) s += 6;
  if (occasion === 'corporate' && /hamper|box|gift|corporate/i.test(b)) s += 6;
  if (occasion === 'health' && /date|fig|seed|walnut|berry|makhana/i.test(b)) s += 8;
  if (recipient === 'family elders' && /date|fig|almond|walnut|raisin|anjeer/i.test(b)) s += 6;
  if (recipient === 'work' && /hamper|box|premium/i.test(b)) s += 6;
  for (const word of String(query).toLowerCase().split(/[^a-z0-9]+/)) {
    if (word.length > 3 && b.includes(word)) s += 6;
  }
  return s;
}

function replyFor({ budget, occasion, recipient, hamper, loose, products, turn }) {
  const names = products.map((p) => p.name).filter(Boolean);
  const listed = names.length ? ` ${names.join(', ')}.` : '';
  const who = recipient ? ` for ${recipient}` : '';
  if (turn === 0 && !occasion && !budget) {
    return 'I can help pick a Sukhmal gift. What’s the occasion, who is it for, and roughly what budget?';
  }
  if (hamper && listed) {
    return `A packed hamper${who}${budget ? ` around ₹${budget}` : ''} is a good call:${listed} Want a smaller box or something more premium?`;
  }
  if (loose && listed) {
    return `Keeping it as loose dry fruits${who}:${listed} I can swap any of these for dates or a mix if you prefer.`;
  }
  if (occasion === 'festive' && listed) {
    return turn === 0
      ? `For a festive gift${who}${budget ? ` under ₹${budget}` : ''}:${listed} Should I lean towards a ready hamper, or pouches they can refill?`
      : `Different festive options this time${who}:${listed}`;
  }
  if (occasion === 'wedding' && listed) {
    return `Wedding-ready picks${who}${budget ? ` around ₹${budget}` : ''}:${listed} Share guest count if you need bulk boxes.`;
  }
  if (occasion === 'corporate' && listed) {
    return `For office gifting${budget ? ` around ₹${budget}` : ''}:${listed} How many boxes do you need?`;
  }
  if (listed) {
    return turn === 0
      ? `Here are Sukhmal options${who}${budget ? ` around ₹${budget}` : ''}:${listed} Tell me if you want a hamper or individual packs.`
      : `Switching the mix based on that:${listed} Any flavour they like — cashew, dates, or a mix?`;
  }
  return 'Tell me the occasion, who it’s for, and a budget — I’ll pick from the Sukhmal catalogue.';
}

export function localAdviseGifts({ messages, catalog }) {
  const users = userTurns(messages);
  const query = users[users.length - 1] || '';
  const thread = threadText(messages);
  const budget = extractBudget(thread);
  const occasion = occasionOf(thread);
  const recipient = recipientOf(thread);
  const hamper = wantsHamper(query) || (wantsHamper(thread) && !wantsLoose(query));
  const loose = wantsLoose(query);
  const shown = alreadyShown(messages);
  const ranked = [...(catalog || [])]
    .map((p) => ({
      p,
      s: scoreProduct(p, { budget, occasion, query: `${query} ${thread}`, recipient, hamper, loose }),
    }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);

  const fresh = ranked.filter((x) => {
    const id = String(x.p.id || x.p.slug || x.p.name || '').toLowerCase();
    return !shown.has(id);
  });
  const pool = (fresh.length ? fresh : ranked).slice(0, 3).map((x) => x.p);

  return {
    text: replyFor({
      budget,
      occasion,
      recipient,
      hamper,
      loose,
      products: pool,
      turn: Math.max(0, users.length - 1),
    }),
    products: pool,
  };
}
