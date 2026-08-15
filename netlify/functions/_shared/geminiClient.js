/**
 * Single-turn inventory/gift JSON stays on generateContent (v1beta).
 * Interactions API is for multi-turn server-side sessions — not needed here.
 * GEMINI_MODEL is the config switch when Google retires a model.
 */
const FALLBACK_MODEL = 'gemini-flash-latest';
const SKIP = /lite|tts|image|video|audio|1\.5|gemini-pro$|gemini-1\.0|computer-use|robotics|lyria|deep-research|antigravity|gemma-|omni-|eap|customtools/i;

function envGet(name) {
  try {
    if (typeof Netlify !== 'undefined' && Netlify.env?.get) {
      const v = Netlify.env.get(name);
      if (v) return String(v);
    }
  } catch {}
  return process.env[name] || '';
}

export function configuredGeminiModel() {
  return (envGet('GEMINI_MODEL') || '').trim().replace(/^models\//, '');
}

function generateContentIds(listJson) {
  return (listJson?.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => String(m.name || '').replace(/^models\//, ''));
}

function flashRank(id) {
  if (id === 'gemini-flash-latest') return 500000;
  const dotted = /^gemini-(\d+)\.(\d+)-flash$/.exec(id);
  if (dotted) return Number(dotted[1]) * 1000 + Number(dotted[2]);
  const major = /^gemini-(\d+)-flash$/.exec(id);
  if (major) return Number(major[1]) * 1000;
  return 0;
}

export function rankStableFlashModels(ids) {
  return [...new Set(ids || [])]
    .filter((id) => id && !SKIP.test(id) && (/^gemini-\d+(\.\d+)?-flash$/.test(id) || id === 'gemini-flash-latest'))
    .sort((a, b) => flashRank(b) - flashRank(a));
}

export function pickStableFlashModel(ids, envModel) {
  const ranked = rankStableFlashModels(ids);
  if (envModel && SKIP.test(envModel)) {
    console.warn(`[Sukhmal Gemini] GEMINI_MODEL=${envModel} is lite/retired — ignoring`);
  } else if (envModel && ranked.includes(envModel)) {
    return envModel;
  }
  return ranked[0] || FALLBACK_MODEL;
}

export function geminiGenerateUrl(apiVersion, model) {
  return `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent`;
}

let modelsCache = null;

async function listModels(key, apiVersion) {
  if (modelsCache) return modelsCache;
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models?pageSize=200`;
  console.log(`[Sukhmal Gemini] ListModels GET ${url}`);
  const res = await fetch(url, { headers: { 'x-goog-api-key': key } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.warn(`[Sukhmal Gemini] ListModels failed (${res.status}):`, JSON.stringify(json));
    modelsCache = { models: [] };
    return modelsCache;
  }
  const summary = (json.models || []).map((m) => ({
    name: m.name,
    supportedGenerationMethods: m.supportedGenerationMethods || [],
  }));
  console.log('[Sukhmal Gemini] ListModels full response:', JSON.stringify(summary, null, 2));
  const gc = generateContentIds(json);
  console.log('[Sukhmal Gemini] models supporting generateContent:', gc.join(', ') || '(none)');
  modelsCache = json;
  return json;
}

console.log(
  `[Sukhmal Gemini] helper loaded; GEMINI_MODEL=${configuredGeminiModel() || '(unset → pick newest stable Flash from ListModels)'} api=v1beta method=generateContent`,
);

function isUnavailableModel(status, message) {
  return status === 404 || /no longer available|not found for API version|not supported for generateContent/i.test(message || '');
}

export async function generateGeminiContent({ key, label, body }) {
  const listed = await listModels(key, 'v1beta');
  const ids = generateContentIds(listed);
  const envModel = configuredGeminiModel();
  const ranked = rankStableFlashModels(ids);
  const preferred = pickStableFlashModel(ids, envModel);
  const queue = [preferred, ...ranked.filter((id) => id !== preferred)];
  const seen = new Set();
  let lastErr = null;

  console.log(`[Sukhmal Gemini] ${label} candidate Flash models (no lite): ${queue.join(', ') || '(none)'}`);

  for (const model of queue) {
    if (!model || seen.has(model)) continue;
    seen.add(model);
    const apiVersion = 'v1beta';
    const url = geminiGenerateUrl(apiVersion, model);
    console.log(`[Sukhmal Gemini] ${label} sending model=${model} (GEMINI_MODEL=${envModel || 'unset'}) api=${apiVersion} url=${url}`);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
      if (!text) {
        lastErr = new Error('Gemini returned an empty response');
        lastErr.code = 'gemini_error';
        continue;
      }
      console.log(`[Sukhmal Gemini] ${label} ok model=${model} api=${apiVersion}`);
      return { text, model, apiVersion };
    }

    const msg = json?.error?.message || `Gemini request failed (${res.status})`;
    console.warn(`[Sukhmal Gemini] ${label} failed model=${model} status=${res.status} message=${msg}`);
    lastErr = new Error(msg);
    lastErr.code = 'gemini_error';
    if (!isUnavailableModel(res.status, msg)) throw lastErr;
  }

  throw lastErr || new Error('Gemini request failed');
}
