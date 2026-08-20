/**
 * Local AI health check. Prints statuses only — never keys or tokens.
 *   node scripts/check-ai.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { GoogleAuth } from 'google-auth-library';

function loadDotEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

loadDotEnv(resolve(process.cwd(), '../frontend/.env'));
loadDotEnv(resolve(process.cwd(), '../frontend/.env.example'));

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || 'sukhmal';
const studioKey = process.env.GEMINI_IMAGE_API_KEY || process.env.GEMINI_ASSISTANT_API_KEY || process.env.GEMINI_API_KEY || '';
const gcloud = process.env.CLOUDSDK_GCLOUD_PATH
  || `${process.env.LOCALAPPDATA}\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd`;

function fp(key) {
  if (!key) return 'missing';
  return `${key.slice(0, 3)}…len${key.length}`;
}

function errMsg(json, status) {
  return String(json?.error?.message || json?.error?.status || `HTTP ${status}`).slice(0, 220);
}

async function postJson(url, { headers, body, timeoutMs = 45000 }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function adcToken() {
  try {
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    const result = await client.getAccessToken();
    const token = typeof result === 'string' ? result : result?.token || '';
    if (token) return { token };
  } catch (err) {
    /* fall through to gcloud */
  }
  const r = spawnSync('cmd.exe', ['/c', `"${gcloud}" auth application-default print-access-token`], {
    encoding: 'utf8',
    timeout: 25000,
    windowsHide: true,
  });
  const token = String(r.stdout || '').trim();
  if (r.status !== 0 || !token) {
    return { error: String(r.stderr || r.stdout || 'gcloud failed').slice(0, 200) };
  }
  return { token };
}

function vertexUrl(location, model) {
  const id = String(model).replace(/^models\//, '');
  if (location === 'global') {
    return `https://aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/global/publishers/google/models/${id}:generateContent`;
  }
  return `https://${location}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${location}/publishers/google/models/${id}:generateContent`;
}

async function studioText(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const { status, json } = await postJson(url, {
    headers: { 'x-goog-api-key': studioKey },
    body: { contents: [{ role: 'user', parts: [{ text: 'Reply with OK only.' }] }] },
  });
  const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  return { ok: status === 200 && Boolean(text), status, detail: text ? 'text' : errMsg(json, status) };
}

async function studioImage(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const { status, json } = await postJson(url, {
    headers: { 'x-goog-api-key': studioKey },
    timeoutMs: 90000,
    body: {
      contents: [{ role: 'user', parts: [{ text: 'A single almond on white, product photo, no text.' }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    },
  });
  const parts = json?.candidates?.[0]?.content?.parts || [];
  const hasImage = parts.some((p) => p.inlineData?.data || p.inline_data?.data);
  return { ok: status === 200 && hasImage, status, detail: hasImage ? 'image' : errMsg(json, status) };
}

async function vertexCall(token, location, model, { image = false } = {}) {
  const url = vertexUrl(location, model);
  const body = {
    contents: [{ role: 'user', parts: [{ text: image ? 'A single almond on white, product photo, no text.' : 'Reply with OK only.' }] }],
  };
  if (image) body.generationConfig = { responseModalities: ['TEXT', 'IMAGE'] };
  const { status, json } = await postJson(url, {
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: image ? 120000 : 45000,
    body,
  });
  const parts = json?.candidates?.[0]?.content?.parts || [];
  const hasImage = parts.some((p) => p.inlineData?.data || p.inline_data?.data);
  const hasText = parts.some((p) => p.text);
  const ok = status === 200 && (image ? hasImage : hasText);
  return { ok, status, detail: ok ? (image ? 'image' : 'text') : errMsg(json, status) };
}

const results = [];
function row(name, r) {
  results.push({ name, ...r });
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${name}  ${r.status || '-'}  ${r.detail}`);
}

console.log('project', PROJECT);
console.log('studioKey', fp(studioKey), studioKey.startsWith('AQ.') ? 'AI-Studio-AQ' : studioKey.startsWith('AIza') ? 'AIza' : 'other');
console.log('vertexFlags', {
  GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || '(unset in frontend/.env)',
  GOOGLE_GENAI_USE_ENTERPRISE: process.env.GOOGLE_GENAI_USE_ENTERPRISE || '(unset)',
  GEMINI_MODEL: process.env.GEMINI_MODEL || '(unset)',
  GEMINI_IMAGE_MODEL: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image',
});

const adc = await adcToken();
if (adc.error) {
  row('vertex-adc-token', { ok: false, status: 0, detail: adc.error });
} else {
  row('vertex-adc-token', { ok: true, status: 200, detail: `token-len-${adc.token.length}` });
}

if (studioKey) {
  for (const model of ['gemini-3.7-flash', 'gemini-2.5-flash', 'gemini-flash-latest']) {
    try { row(`studio-text ${model}`, await studioText(model)); }
    catch (e) { row(`studio-text ${model}`, { ok: false, status: 0, detail: String(e.message || e).slice(0, 180) }); }
  }
  for (const model of ['gemini-2.5-flash-image', 'gemini-3.1-flash-image-preview']) {
    try { row(`studio-image ${model}`, await studioImage(model)); }
    catch (e) { row(`studio-image ${model}`, { ok: false, status: 0, detail: String(e.message || e).slice(0, 180) }); }
  }
} else {
  row('studio-key', { ok: false, status: 0, detail: 'no GEMINI_* key in frontend/.env' });
}

if (adc.token) {
  const textModels = ['gemini-2.5-flash', 'gemini-3.7-flash', 'gemini-flash-latest'];
  const locations = ['global', 'us-central1', 'asia-south1'];
  for (const location of locations) {
    for (const model of textModels) {
      try { row(`vertex-text ${location} ${model}`, await vertexCall(adc.token, location, model)); }
      catch (e) { row(`vertex-text ${location} ${model}`, { ok: false, status: 0, detail: String(e.message || e).slice(0, 180) }); }
    }
  }
  for (const location of ['global', 'us-central1', 'asia-south1']) {
    try { row(`vertex-image ${location} gemini-2.5-flash-image`, await vertexCall(adc.token, location, 'gemini-2.5-flash-image', { image: true })); }
    catch (e) { row(`vertex-image ${location} gemini-2.5-flash-image`, { ok: false, status: 0, detail: String(e.message || e).slice(0, 180) }); }
  }
}

const passed = results.filter((r) => r.ok).length;
console.log(`summary ${passed}/${results.length} passed`);
