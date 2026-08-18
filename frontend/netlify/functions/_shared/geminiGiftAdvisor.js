import { generateGeminiContent } from './geminiClient.js';
import { geminiApiKey } from './geminiEnv.js';
import { localAdviseGifts } from './localGiftAdvisor.js';
import { vertexImageEnabled } from './vertexImage.js';

let geminiSkipUntil = 0;

function parseGeminiJson(text) {
  const raw = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('Gemini did not return JSON');
  return JSON.parse(raw.slice(start, end + 1));
}

function slimCatalog(catalog) {
  return (catalog || []).slice(0, 80).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    price: p.price,
    tagline: p.tagline || '',
    bestseller: Boolean(p.bestseller || p.isBestseller),
  }));
}

function matchProducts(catalog, ids) {
  const needles = (ids || []).map((x) => String(x).toLowerCase());
  if (!needles.length) return [];
  const hits = [];
  for (const p of catalog || []) {
    const keys = [p.id, p.slug, p.name].map((x) => String(x || '').toLowerCase());
    if (needles.some((n) => keys.some((k) => k === n || k.includes(n) || n.includes(k)))) {
      hits.push(p);
    }
    if (hits.length >= 4) break;
  }
  return hits;
}

export async function adviseGifts({ messages, catalog }) {
  const history = (messages || [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.text)
    .slice(-12)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.text).slice(0, 1200) }],
    }));

  if (!history.length) {
    const err = new Error('Type a message first');
    err.code = 'bad_request';
    throw err;
  }

  const key = geminiApiKey();
  if (!vertexImageEnabled() && (!key || Date.now() < geminiSkipUntil)) {
    if (!key) console.warn('[Sukhmal Gemini] gift-advisor missing API key — using catalogue advisor');
    return localAdviseGifts({ messages, catalog });
  }

  try {
    const slim = slimCatalog(catalog);
    const system = `You are Sukhmal Dry Fruits Korner's Gift Advisor.
Help customers pick dry fruits, nuts, dates, berries, seeds, and gift hampers.
Be warm, concise, and practical. Ask a short follow-up if occasion, recipient, or budget is missing.
Only recommend items from this catalogue:
${JSON.stringify(slim)}

Return JSON only:
{"text":"your reply","productIds":["slug-or-id","..."]}
Recommend 0–3 products. productIds must match catalogue id or slug. Prices are in INR.`;

    const contents = [
      { role: 'user', parts: [{ text: system }] },
      { role: 'model', parts: [{ text: '{"text":"I can help you pick a Sukhmal gift. What is the occasion and budget?","productIds":[]}' }] },
      ...history,
    ];

    const { text: raw } = await generateGeminiContent({
      key,
      label: 'gift-advisor',
      body: {
        contents,
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              text: { type: 'STRING' },
              productIds: { type: 'ARRAY', items: { type: 'STRING' } },
            },
            required: ['text'],
          },
        },
      },
    });
    const parsed = parseGeminiJson(raw);
    const text = String(parsed.text || '').trim();
    if (!text) throw new Error('Gemini returned an empty reply');
    const products = matchProducts(catalog, parsed.productIds || parsed.productSlugs || []);
    return { text, products };
  } catch (err) {
    if (err.code === 'bad_request') throw err;
    console.warn('[Sukhmal Gemini] gift-advisor using catalogue advisor:', err.code || err.message);
    if (err.code === 'gemini_auth' || err.code === 'not_configured') {
      geminiSkipUntil = Date.now() + 10 * 60 * 1000;
    }
    return localAdviseGifts({ messages, catalog });
  }
}
