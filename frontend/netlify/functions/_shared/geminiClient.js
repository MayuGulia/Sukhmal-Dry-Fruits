/**
 * Chat/JSON stays on generateContent (v1beta).
 * New AI Studio keys must use the Interactions API for images (Imagen :predict is retired).
 * GEMINI_MODEL is the config switch when Google retires a model.
 */
import { envGet, geminiApiKey } from './geminiEnv.js';

const FALLBACK_MODEL = 'gemini-flash-latest';
const SKIP = /lite|tts|image|video|audio|1\.5|gemini-pro$|gemini-1\.0|computer-use|robotics|lyria|deep-research|antigravity|gemma-|omni-|eap|customtools/i;
/** ListModels still returns these, but generateContent 404s them for new AI Studio keys. */
const LISTED_BUT_BLOCKED_FOR_NEW_KEYS = /^gemini-2\.5-flash$/;
const IMAGE_MODELS = [
  'gemini-2.5-flash-image',
  'gemini-3.1-flash-lite-image',
  'gemini-3.1-flash-image',
];

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

function maskKeyMeta(key) {
  if (!key) return { present: false };
  return {
    present: true,
    length: key.length,
    prefix: key.slice(0, 3),
    looksLikeAiStudioAuthKey: key.startsWith('AQ.'),
    looksLikeLegacyGoogleKey: key.startsWith('AIza'),
  };
}

function logExactRequest(label, { method, url, apiVersion, model, key }) {
  console.log(
    `[Sukhmal Gemini] ${label} EXACT REQUEST`,
    JSON.stringify({
      method,
      completeUrl: url,
      apiVersion,
      model,
      modelPathHasModelsPrefix: /\/models\//.test(url),
      headers: {
        'Content-Type': method === 'POST' ? 'application/json' : undefined,
        'x-goog-api-key': maskKeyMeta(key),
      },
    }),
  );
}

export function rankStableFlashModels(ids) {
  return [...new Set(ids || [])]
    .filter(
      (id) =>
        id &&
        !SKIP.test(id) &&
        !LISTED_BUT_BLOCKED_FOR_NEW_KEYS.test(id) &&
        (/^gemini-\d+(\.\d+)?-flash$/.test(id) || id === 'gemini-flash-latest'),
    )
    .sort((a, b) => flashRank(b) - flashRank(a));
}

export function pickStableFlashModel(ids, envModel) {
  const ranked = rankStableFlashModels(ids);
  if (envModel && (SKIP.test(envModel) || LISTED_BUT_BLOCKED_FOR_NEW_KEYS.test(envModel))) {
    console.warn(`[Sukhmal Gemini] GEMINI_MODEL=${envModel} is lite/retired/blocked for new keys — ignoring`);
  } else if (envModel && ranked.includes(envModel)) {
    return envModel;
  }
  return ranked[0] || FALLBACK_MODEL;
}

export function geminiGenerateUrl(apiVersion, model) {
  const id = String(model || '').replace(/^models\//, '');
  return `https://generativelanguage.googleapis.com/${apiVersion}/models/${id}:generateContent`;
}

const modelsCacheByKey = new Map();

async function listModels(key, apiVersion) {
  const cacheKey = `${apiVersion}:${key ? key.slice(-8) : 'none'}`;
  if (modelsCacheByKey.has(cacheKey)) return modelsCacheByKey.get(cacheKey);
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models?pageSize=200`;
  logExactRequest('ListModels', { method: 'GET', url, apiVersion, model: '(list)', key });
  const res = await fetch(url, { headers: { 'x-goog-api-key': key } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.warn(`[Sukhmal Gemini] ListModels failed (${res.status}):`, JSON.stringify(json));
    modelsCacheByKey.set(cacheKey, { models: [] });
    return modelsCacheByKey.get(cacheKey);
  }
  const summary = (json.models || []).map((m) => ({
    name: m.name,
    supportedGenerationMethods: m.supportedGenerationMethods || [],
  }));
  console.log('[Sukhmal Gemini] ListModels full response:', JSON.stringify(summary, null, 2));
  const gc = generateContentIds(json);
  console.log('[Sukhmal Gemini] models supporting generateContent:', gc.join(', ') || '(none)');
  modelsCacheByKey.set(cacheKey, json);
  return json;
}

console.log(
  `[Sukhmal Gemini] helper loaded; GEMINI_MODEL=${configuredGeminiModel() || '(unset → pick newest stable Flash from ListModels)'} api=v1beta method=generateContent`,
);

function shouldTryNextModel(status, message) {
  return (
    status === 404 ||
    status === 429 ||
    status === 503 ||
    /no longer available|not found for API version|not supported for generateContent|high demand|unavailable/i.test(
      message || '',
    )
  );
}

export async function generateGeminiContent({ key, label, body }) {
  const listed = await listModels(key, 'v1beta');
  const ids = generateContentIds(listed);
  const envModel = configuredGeminiModel();
  const ranked = rankStableFlashModels(ids);
  const preferred = pickStableFlashModel(ids, envModel);
  const queue = [preferred, FALLBACK_MODEL, ...ranked.filter((id) => id !== preferred && id !== FALLBACK_MODEL)];
  const seen = new Set();
  let lastErr = null;

  console.log(`[Sukhmal Gemini] ${label} candidate Flash models (no lite): ${queue.join(', ') || '(none)'}`);

  for (const model of queue) {
    if (!model || seen.has(model)) continue;
    seen.add(model);
    const apiVersion = 'v1beta';
    const url = geminiGenerateUrl(apiVersion, model);
    logExactRequest(label, { method: 'POST', url, apiVersion, model, key });

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
    if (!shouldTryNextModel(res.status, msg)) throw lastErr;
  }

  throw lastErr || new Error('Gemini request failed');
}

function firstInlineImage(json) {
  const parts = json?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  if (!imagePart) return null;
  return {
    mimeType: imagePart.inlineData.mimeType || 'image/png',
    data: imagePart.inlineData.data,
  };
}

function isZeroQuota(status, message) {
  return status === 429 && /limit:\s*0/i.test(message || '');
}

function firstInteractionsImage(json) {
  const direct = json?.output_image || json?.outputImage;
  if (direct?.data) {
    return {
      mimeType: direct.mime_type || direct.mimeType || 'image/jpeg',
      data: direct.data,
    };
  }
  const stack = [json];
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;
    if (Array.isArray(node)) {
      for (const item of node) stack.push(item);
      continue;
    }
    if (node.inlineData?.data) {
      return {
        mimeType: node.inlineData.mimeType || 'image/png',
        data: node.inlineData.data,
      };
    }
    if (
      typeof node.data === 'string' &&
      node.data.length > 200 &&
      (node.type === 'image' || node.mime_type || node.mimeType)
    ) {
      return {
        mimeType: node.mime_type || node.mimeType || 'image/png',
        data: node.data,
      };
    }
    for (const value of Object.values(node)) {
      if (value && typeof value === 'object') stack.push(value);
    }
  }
  return null;
}

function imageModelQueue() {
  return [...IMAGE_MODELS];
}

async function generateWithInteractions({ key, prompt, label, model }) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/interactions';
  logExactRequest(label, { method: 'POST', url, apiVersion: 'v1beta', model, key });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key,
      'Api-Revision': '2026-05-20',
    },
    body: JSON.stringify({
      model,
      input: prompt,
      response_format: {
        type: 'image',
        mime_type: 'image/jpeg',
        aspect_ratio: '1:1',
        image_size: '1K',
      },
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json?.error?.message || `Gemini interactions request failed (${res.status})`);
    err.code = 'gemini_error';
    err.status = res.status;
    throw err;
  }
  const image = firstInteractionsImage(json);
  if (!image) {
    const err = new Error('Gemini returned no image');
    err.code = 'gemini_error';
    throw err;
  }
  console.log(`[Sukhmal Gemini] ${label} ok model=${model} api=interactions`);
  return { ...image, model, apiVersion: 'v1beta' };
}

async function generateImageWithKey({ key, prompt, label }) {
  const queue = imageModelQueue();
  let lastErr = null;
  console.log(`[Sukhmal Gemini] ${label} Interactions candidates: ${queue.join(', ')}`);

  for (const model of queue) {
    try {
      return await generateWithInteractions({ key, prompt, label, model });
    } catch (err) {
      const msg = err.message || '';
      const status = err.status || 0;
      console.warn(`[Sukhmal Gemini] ${label} failed model=${model} api=interactions status=${status} message=${msg}`);
      lastErr = err;
      if (status === 401 || status === 403) throw err;
      if (isZeroQuota(status, msg)) throw err;
      if (status === 429) throw err;
      if (status === 404 && /interactions/i.test(msg)) break;
    }
  }

  throw lastErr || new Error('Gemini image request failed');
}

export async function generateGeminiImage({ key, prompt, label = 'image' }) {
  const keys = [...new Set([key, geminiApiKey()].filter(Boolean))];
  let lastErr = null;
  for (const nextKey of keys) {
    try {
      return await generateImageWithKey({ key: nextKey, prompt, label });
    } catch (err) {
      lastErr = err;
      const status = err.status || 0;
      const msg = err.message || '';
      if (status === 401 || status === 403) continue;
      if (isZeroQuota(status, msg) || status === 429) continue;
    }
  }
  throw lastErr || new Error('Gemini image request failed');
}
