/**
 * Single-turn inventory/gift JSON stays on generateContent (v1beta).
 * Interactions API is for multi-turn server-side sessions — not needed here.
 * GEMINI_MODEL is the config switch when Google retires a model.
 */
import { envGet, GEMINI_AUTH_HELP, isGeminiAuthFailure } from './geminiEnv.js';
import { generateVertexContent, generateVertexImage, vertexImageEnabled } from './vertexImage.js';

const FALLBACK_MODEL = 'gemini-flash-latest';
const SKIP = /lite|tts|image|video|audio|1\.5|gemini-pro$|gemini-1\.0|computer-use|robotics|lyria|deep-research|antigravity|gemma-|omni-|eap|customtools/i;
/** ListModels still returns these, but generateContent 404s them for new AI Studio keys. */
const LISTED_BUT_BLOCKED_FOR_NEW_KEYS = /^gemini-2\.5-flash$/;
const IMAGE_MODELS = [
  'gemini-3.1-flash-image',
  'gemini-3.1-flash-image-preview',
  'gemini-2.5-flash-image',
  'gemini-3-pro-image',
  'gemini-3-pro-image-preview',
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

let modelsCache = null;

async function listModels(key, apiVersion) {
  if (modelsCache) return modelsCache;
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models?pageSize=200`;
  logExactRequest('ListModels', { method: 'GET', url, apiVersion, model: '(list)', key });
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
  if (vertexImageEnabled()) {
    try {
      return await generateVertexContent({
        contents: body.contents,
        generationConfig: body.generationConfig,
        label,
      });
    } catch (err) {
      console.warn(`[Sukhmal Gemini] ${label} vertex text failed: ${String(err.message || '').slice(0, 300)}`);
      if (!key) throw err;
    }
  }
  if (!key) {
    const err = new Error(GEMINI_AUTH_HELP);
    err.code = 'not_configured';
    throw err;
  }
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
    lastErr.status = res.status;
    lastErr.code = isGeminiAuthFailure(res.status, msg) ? 'gemini_auth' : 'gemini_error';
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

async function generateImageWithKey({ key, prompt, label = 'image' }) {
  const listed = await listModels(key, 'v1beta');
  const ids = generateContentIds(listed);
  const listedImage = ids.filter((id) => /image/i.test(id) && !/tts|video|audio|lite/i.test(id));
  const queue = [
    ...IMAGE_MODELS.filter((id) => !ids.length || ids.includes(id)),
    ...listedImage.filter((id) => !IMAGE_MODELS.includes(id)),
  ];
  const seen = new Set();
  let lastErr = null;

  console.log(`[Sukhmal Gemini] ${label} candidate image models: ${queue.join(', ') || '(none)'}`);

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
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      const image = firstInlineImage(json);
      if (!image) {
        lastErr = new Error('Gemini returned no image');
        lastErr.code = 'gemini_error';
        continue;
      }
      console.log(`[Sukhmal Gemini] ${label} ok model=${model} api=${apiVersion}`);
      return { ...image, model, apiVersion };
    }

    const msg = json?.error?.message || `Gemini image request failed (${res.status})`;
    console.warn(`[Sukhmal Gemini] ${label} failed model=${model} status=${res.status} message=${msg}`);
    lastErr = new Error(msg);
    lastErr.status = res.status;
    lastErr.code = isGeminiAuthFailure(res.status, msg) ? 'gemini_auth' : 'gemini_error';
    if (!shouldTryNextModel(res.status, msg)) throw lastErr;
  }

  throw lastErr || new Error('Gemini image request failed');
}

export async function generateGeminiImage({ key, prompt, label = 'image', referenceImage }) {
  let vertexErr = null;
  if (vertexImageEnabled()) {
    try {
      return await generateVertexImage({ prompt, label, referenceImage });
    } catch (err) {
      vertexErr = err;
      console.warn(`[Sukhmal Gemini] ${label} vertex path failed: ${String(err.message || '').slice(0, 300)}`);
      const rateLimited = err.status === 429 || /resource has been exhausted|rate[- ]limit/i.test(err.message || '');
      if (!rateLimited || !key || referenceImage) throw err;
    }
  }
  if (key && !referenceImage) {
    try {
      return await generateImageWithKey({ key, prompt, label });
    } catch (err) {
      throw vertexErr || err;
    }
  }
  if (vertexErr) throw vertexErr;
  const err = new Error(GEMINI_AUTH_HELP);
  err.code = 'not_configured';
  throw err;
}
