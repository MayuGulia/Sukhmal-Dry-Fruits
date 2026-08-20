/**
 * AQ. AI Studio auth keys: Google's current docs use Interactions + x-goog-api-key.
 * ListModels/generateContent often return 401 ACCESS_TOKEN_TYPE_UNSUPPORTED for those keys.
 * GEMINI_MODEL is the config switch when Google retires a model.
 */
import { envGet, GEMINI_AUTH_HELP, isGeminiAuthFailure, isZeroImageQuota } from './geminiEnv.js';
import { generateVertexContent, vertexImageEnabled } from './vertexImage.js';

const FALLBACK_MODEL = 'gemini-flash-latest';
const SKIP = /lite|tts|image|video|audio|1\.5|gemini-pro$|gemini-1\.0|computer-use|robotics|lyria|deep-research|antigravity|gemma-|omni-|eap|customtools/i;
/** ListModels still returns these, but generateContent 404s them for new AI Studio keys. */
const LISTED_BUT_BLOCKED_FOR_NEW_KEYS = /^gemini-2\.5-flash$/;
const STATIC_FLASH_QUEUE = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
];
const IMAGE_MODELS = [
  'gemini-3.1-flash-image-preview',
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
  'gemini-3.1-flash-image',
  'gemini-3.1-flash-lite-image',
];
const DESCRIBE_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-flash-latest',
];
const TEXT_TO_IMAGE_MODELS = [
  'gemini-2.0-flash-preview-image-generation',
  'gemini-2.0-flash-exp-image-generation',
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-image-preview',
];

export function configuredGeminiModel() {
  return (envGet('GEMINI_MODEL') || '').trim().replace(/^models\//, '');
}

function isAuthKey(key) {
  return String(key || '').startsWith('AQ.');
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

function redactUrl(url) {
  return String(url || '').replace(/([?&]key=)[^&]+/gi, '$1REDACTED');
}

function logExactRequest(label, { method, url, apiVersion, model, key, authName }) {
  console.log(
    `[Sukhmal Gemini] ${label} EXACT REQUEST`,
    JSON.stringify({
      method,
      completeUrl: redactUrl(url),
      apiVersion,
      model,
      auth: authName || 'x-goog-api-key',
      modelPathHasModelsPrefix: /\/models\//.test(url),
      headers: {
        'Content-Type': method === 'POST' ? 'application/json' : undefined,
        'x-goog-api-key': authName === 'query-key' ? { present: false } : maskKeyMeta(key),
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
  } else if (envModel) {
    return envModel;
  }
  return ranked[0] || FALLBACK_MODEL;
}

export function geminiGenerateUrl(apiVersion, model) {
  const id = String(model || '').replace(/^models\//, '');
  return `https://generativelanguage.googleapis.com/${apiVersion}/models/${id}:generateContent`;
}

function authAttempts(key) {
  return [
    {
      name: 'x-goog-api-key',
      headers(extra = {}) {
        return { ...extra, 'x-goog-api-key': key };
      },
      url(base) {
        return base;
      },
    },
    {
      name: 'query-key',
      headers(extra = {}) {
        return extra;
      },
      url(base) {
        return `${base}${base.includes('?') ? '&' : '?'}key=${encodeURIComponent(key)}`;
      },
    },
    {
      name: 'bearer',
      headers(extra = {}) {
        return { ...extra, Authorization: `Bearer ${key}` };
      },
      url(base) {
        return base;
      },
    },
  ];
}

function authError(message) {
  const err = new Error(GEMINI_AUTH_HELP);
  err.code = 'gemini_auth';
  err.status = 401;
  err.causeMessage = message;
  return err;
}

const modelsCacheByKey = new Map();

async function listModels(key, apiVersion) {
  if (isAuthKey(key)) {
    console.log('[Sukhmal Gemini] skipping ListModels for AQ. auth key (often 401 ACCESS_TOKEN_TYPE_UNSUPPORTED)');
    return { models: [] };
  }
  const cacheKey = `${apiVersion}:${key ? key.slice(-8) : 'none'}`;
  if (modelsCacheByKey.has(cacheKey)) return modelsCacheByKey.get(cacheKey);
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models?pageSize=200`;
  logExactRequest('ListModels', { method: 'GET', url, apiVersion, model: '(list)', key });
  const res = await fetch(url, { headers: { 'x-goog-api-key': key } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || `ListModels failed (${res.status})`;
    console.warn(`[Sukhmal Gemini] ListModels failed (${res.status}):`, msg);
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
  `[Sukhmal Gemini] helper loaded; GEMINI_MODEL=${configuredGeminiModel() || '(unset → pick newest stable Flash)'} api=v1beta method=interactions+generateContent`,
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

function contentsToInput(contents) {
  const turns = (contents || [])
    .map((c) => {
      const text = (c.parts || []).map((p) => p.text || '').join('\n').trim();
      const role = c.role === 'model' ? 'Assistant' : 'User';
      return { role, text };
    })
    .filter((t) => t.text);
  if (!turns.length) return '';
  if (turns.length === 1) return turns[0].text;
  return turns.map((t) => `${t.role}: ${t.text}`).join('\n\n');
}

function firstGenerateText(json) {
  return json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
}

function firstInteractionsText(json) {
  if (typeof json?.output_text === 'string' && json.output_text.trim()) return json.output_text;
  const texts = [];
  for (const step of json?.steps || []) {
    if (/user_input|thought/i.test(step?.type || '')) continue;
    for (const part of step?.content || []) {
      if (part?.text) texts.push(part.text);
    }
  }
  return texts.join('').trim();
}

async function postJson(url, { key, auth, extraHeaders, body, label, model, apiVersion }) {
  const finalUrl = auth.url(url);
  logExactRequest(label, {
    method: 'POST',
    url: finalUrl,
    apiVersion,
    model,
    key,
    authName: auth.name,
  });
  const res = await fetch(finalUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...auth.headers(extraHeaders),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  const msg = json?.error?.message || `Gemini request failed (${res.status})`;
  return { res, json, msg };
}

async function generateWithInteractionsText({ key, model, body, label, auth }) {
  const gc = body?.generationConfig || {};
  const payload = {
    model,
    input: contentsToInput(body?.contents),
  };
  if (gc.temperature != null) payload.generation_config = { temperature: gc.temperature };
  if (gc.responseMimeType || gc.responseSchema) {
    payload.response_format = [
      {
        type: 'text',
        mime_type: gc.responseMimeType || 'application/json',
        ...(gc.responseSchema ? { schema: gc.responseSchema } : {}),
      },
    ];
  }
  const { res, json, msg } = await postJson(
    'https://generativelanguage.googleapis.com/v1beta/interactions',
    {
      key,
      auth,
      extraHeaders: { 'Api-Revision': '2026-05-20' },
      body: payload,
      label: `${label}:interactions`,
      model,
      apiVersion: 'v1beta',
    },
  );
  if (!res.ok) {
    const err = new Error(msg);
    err.code = 'gemini_error';
    err.status = res.status;
    throw err;
  }
  const text = firstInteractionsText(json);
  if (!text) {
    const err = new Error('Gemini returned an empty response');
    err.code = 'gemini_error';
    throw err;
  }
  console.log(`[Sukhmal Gemini] ${label} ok model=${model} api=interactions auth=${auth.name}`);
  return { text, model, apiVersion: 'v1beta' };
}

async function generateWithContent({ key, model, body, label, auth }) {
  const { res, json, msg } = await postJson(geminiGenerateUrl('v1beta', model), {
    key,
    auth,
    body,
    label: `${label}:generateContent`,
    model,
    apiVersion: 'v1beta',
  });
  if (!res.ok) {
    const err = new Error(msg);
    err.code = 'gemini_error';
    err.status = res.status;
    throw err;
  }
  const text = firstGenerateText(json);
  if (!text) {
    const err = new Error('Gemini returned an empty response');
    err.code = 'gemini_error';
    throw err;
  }
  console.log(`[Sukhmal Gemini] ${label} ok model=${model} api=generateContent auth=${auth.name}`);
  return { text, model, apiVersion: 'v1beta' };
}

function textTransports(key) {
  const apis = isAuthKey(key)
    ? [generateWithInteractionsText, generateWithContent]
    : [generateWithContent, generateWithInteractionsText];
  const attempts = [];
  for (const api of apis) {
    for (const auth of authAttempts(key)) {
      attempts.push({ api, auth });
    }
  }
  return attempts;
}

function modelQueue(ids, envModel) {
  const preferred = pickStableFlashModel(ids, envModel);
  return [...new Set([preferred, envModel, FALLBACK_MODEL, ...rankStableFlashModels(ids), ...STATIC_FLASH_QUEUE].filter(Boolean))];
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
  const queue = modelQueue(ids, envModel);
  const transports = textTransports(key);
  const seen = new Set();
  let lastErr = null;

  console.log(`[Sukhmal Gemini] ${label} candidate Flash models: ${queue.join(', ') || '(none)'}`);

  for (const model of queue) {
    if (!model || seen.has(model)) continue;
    seen.add(model);
    for (const { api, auth } of transports) {
      try {
        return await api({ key, model, body, label, auth });
      } catch (err) {
        const status = err.status || 0;
        const msg = err.message || '';
        console.warn(
          `[Sukhmal Gemini] ${label} failed model=${model} api=${api.name} auth=${auth.name} status=${status} message=${msg}`,
        );
        lastErr = err;
        if (isGeminiAuthFailure(status, msg)) throw authError(msg);
        if (shouldTryNextModel(status, msg) || /empty response/i.test(msg)) continue;
        throw err;
      }
    }
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
  return isZeroImageQuota(status, message);
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

function imageModelQueue(editFirstImage, textToImage) {
  const envModel = (envGet('GEMINI_IMAGE_MODEL') || '').trim().replace(/^models\//, '');
  if (textToImage) {
    return [...new Set([envModel, ...TEXT_TO_IMAGE_MODELS].filter(Boolean))];
  }
  const preferred = editFirstImage
    ? ['gemini-2.5-flash-image', ...IMAGE_MODELS]
    : IMAGE_MODELS;
  return [...new Set([envModel, ...preferred].filter(Boolean))];
}

function normalizeImageRefs(referenceImage, referenceImages) {
  const list = [];
  const push = (img) => {
    if (!img) return;
    const data = img.data || img.inlineData?.data;
    if (!data) return;
    list.push({
      mimeType: img.mimeType || img.inlineData?.mimeType || 'image/jpeg',
      data: String(data).replace(/\s/g, ''),
    });
  };
  push(referenceImage);
  (Array.isArray(referenceImages) ? referenceImages : []).forEach(push);
  return list.slice(0, 8);
}

function interactionsInput(prompt, referenceImages, imageLabels, editFirstImage) {
  const refs = referenceImages || [];
  if (!refs.length) return prompt;
  const chunks = [];
  const label = (i) => imageLabels?.[i] || (i === 0 && editFirstImage
    ? 'PHOTO TO EDIT:'
    : `Reference photo ${i + 1}:`);
  if (editFirstImage && refs[0]) {
    chunks.push({ type: 'text', text: label(0) });
    chunks.push({ type: 'image', mime_type: refs[0].mimeType, data: refs[0].data });
    chunks.push({ type: 'text', text: prompt });
    refs.slice(1).forEach((img, i) => {
      chunks.push({ type: 'text', text: label(i + 1) });
      chunks.push({ type: 'image', mime_type: img.mimeType, data: img.data });
    });
    return chunks;
  }
  return [
    { type: 'text', text: prompt },
    ...refs.map((img, i) => ({ type: 'text', text: label(i) })),
    ...refs.map((img) => ({
      type: 'image',
      mime_type: img.mimeType,
      data: img.data,
    })),
  ];
}

function generateContentParts(prompt, referenceImages, imageLabels, editFirstImage) {
  const refs = referenceImages || [];
  if (editFirstImage && refs[0]) {
    const parts = [{ inlineData: { mimeType: refs[0].mimeType, data: refs[0].data } }];
    parts.push({ text: prompt });
    refs.slice(1).forEach((img) => {
      parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
    });
    return parts;
  }
  const label = (i) => imageLabels?.[i] || `Reference photo ${i + 1}:`;
  return [
    { text: prompt },
    ...refs.flatMap((img, i) => [
      { text: label(i) },
      { inlineData: { mimeType: img.mimeType, data: img.data } },
    ]),
  ];
}

async function generateWithInteractions({ key, prompt, label, model, auth, referenceImages, imageLabels, editFirstImage }) {
  const { res, json, msg } = await postJson(
    'https://generativelanguage.googleapis.com/v1beta/interactions',
    {
      key,
      auth,
      extraHeaders: { 'Api-Revision': '2026-05-20' },
      body: {
        model,
        input: interactionsInput(prompt, referenceImages, imageLabels, editFirstImage),
        response_format: {
          type: 'image',
          mime_type: 'image/jpeg',
          aspect_ratio: '1:1',
          image_size: '1K',
        },
      },
      label,
      model,
      apiVersion: 'v1beta',
    },
  );
  if (!res.ok) {
    const err = new Error(msg);
    err.code = 'gemini_error';
    err.status = res.status;
    throw err;
  }
  const image = firstInteractionsImage(json) || firstInlineImage(json);
  if (!image) {
    const err = new Error('Gemini returned no image');
    err.code = 'gemini_error';
    throw err;
  }
  console.log(`[Sukhmal Gemini] ${label} ok model=${model} api=interactions auth=${auth.name}`);
  return { ...image, model, apiVersion: 'v1beta' };
}

async function generateImageWithContent({ key, prompt, label, model, auth, referenceImages, imageLabels, editFirstImage }) {
  const { res, json, msg } = await postJson(geminiGenerateUrl('v1beta', model), {
    key,
    auth,
    body: {
      contents: [{ role: 'user', parts: generateContentParts(prompt, referenceImages, imageLabels, editFirstImage) }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: { aspectRatio: '1:1' },
      },
    },
    label: `${label}:generateContent`,
    model,
    apiVersion: 'v1beta',
  });
  if (!res.ok) {
    const err = new Error(msg);
    err.code = 'gemini_error';
    err.status = res.status;
    throw err;
  }
  const image = firstInlineImage(json);
  if (!image) {
    const err = new Error('Gemini returned no image');
    err.code = 'gemini_error';
    throw err;
  }
  console.log(`[Sukhmal Gemini] ${label} ok model=${model} api=generateContent auth=${auth.name}`);
  return { ...image, model, apiVersion: 'v1beta' };
}

function imageTransports(key, editFirstImage, textToImage) {
  const apis = (editFirstImage || textToImage)
    ? [generateImageWithContent]
    : (isAuthKey(key)
      ? [generateWithInteractions, generateImageWithContent]
      : [generateImageWithContent, generateWithInteractions]);
  const attempts = [];
  for (const api of apis) {
    for (const auth of authAttempts(key)) {
      attempts.push({ api, auth });
    }
  }
  return attempts;
}

async function generateImageWithKey({ key, prompt, label, referenceImages, imageLabels, editFirstImage, textToImage }) {
  const queue = imageModelQueue(editFirstImage, textToImage);
  const transports = imageTransports(key, editFirstImage, textToImage);
  let lastErr = null;
  let sawAuthFailure = false;
  console.log(
    `[Sukhmal Gemini] ${label} image candidates: ${queue.join(', ')} refs=${(referenceImages || []).length} img2img=${Boolean(editFirstImage)} t2i=${Boolean(textToImage)}`,
  );

  for (const model of queue) {
    for (const { api, auth } of transports) {
      try {
        return await api({
          key, prompt, label, model, auth, referenceImages, imageLabels, editFirstImage,
        });
      } catch (err) {
        const msg = err.message || '';
        const status = err.status || 0;
        console.warn(
          `[Sukhmal Gemini] ${label} failed model=${model} api=${api.name} auth=${auth.name} status=${status} message=${msg}`,
        );
        lastErr = err;
        if (isGeminiAuthFailure(status, msg)) {
          sawAuthFailure = true;
          continue;
        }
        if (isZeroQuota(status, msg)) {
          err.code = 'quota';
          throw err;
        }
        if (status === 429) {
          err.code = 'busy';
          throw err;
        }
      }
    }
  }

  if (sawAuthFailure) throw authError(lastErr?.message);
  throw lastErr || new Error('Gemini image request failed');
}

export async function generateGeminiDescribe({ key, prompt, images, label = 'describe' }) {
  if (!key) {
    const err = new Error(GEMINI_AUTH_HELP);
    err.code = 'not_configured';
    throw err;
  }
  const parts = [
    { text: prompt },
    ...(images || []).filter((img) => img?.data).map((img) => ({
      inlineData: { mimeType: img.mimeType || 'image/jpeg', data: img.data },
    })),
  ];
  const body = { contents: [{ role: 'user', parts }] };
  const queue = [...new Set(DESCRIBE_MODELS)];
  const attempts = authAttempts(key).map((auth) => ({ api: generateWithContent, auth }));
  let lastErr = null;
  console.log(`[Sukhmal Gemini] ${label} describe models: ${queue.join(', ')} images=${(images || []).length}`);

  for (const model of queue) {
    for (const { api, auth } of attempts) {
      try {
        return await api({ key, model, body, label, auth });
      } catch (err) {
        const status = err.status || 0;
        const msg = err.message || '';
        console.warn(
          `[Sukhmal Gemini] ${label} failed model=${model} api=${api.name} auth=${auth.name} status=${status} message=${msg}`,
        );
        lastErr = err;
        if (isGeminiAuthFailure(status, msg)) continue;
        if (shouldTryNextModel(status, msg) || /empty response/i.test(msg)) continue;
        throw err;
      }
    }
  }
  if (lastErr && isGeminiAuthFailure(lastErr.status, lastErr.message)) throw authError(lastErr.message);
  throw lastErr || new Error('Gemini describe request failed');
}

export async function generateGeminiImageFromText({ key, prompt, label = 'image' }) {
  if (!key) {
    const err = new Error(GEMINI_AUTH_HELP);
    err.code = 'not_configured';
    throw err;
  }
  return generateImageWithKey({
    key,
    prompt,
    label,
    referenceImages: [],
    editFirstImage: false,
    textToImage: true,
  });
}

export async function generateGeminiImage({
  key,
  prompt,
  label = 'image',
  referenceImage,
  referenceImages,
  imageLabels,
  editFirstImage = true,
}) {
  const refs = normalizeImageRefs(referenceImage, referenceImages);
  if (key) {
    return generateImageWithKey({
      key, prompt, label, referenceImages: refs, imageLabels, editFirstImage: Boolean(editFirstImage && refs.length),
    });
  }
  const err = new Error(GEMINI_AUTH_HELP);
  err.code = 'not_configured';
  throw err;
}
