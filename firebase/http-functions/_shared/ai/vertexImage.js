import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import https from 'node:https';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { envGet, geminiImageApiKey } from './geminiEnv.js';

const execFileAsync = promisify(execFile);
const CLOUD_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

function truthy(value) {
  return /^(1|true|yes)$/i.test(String(value || '').trim());
}

export function vertexImageEnabled() {
  return truthy(
    envGet('GOOGLE_GENAI_USE_ENTERPRISE')
    || envGet('GOOGLE_GENAI_USE_ENTERPRISE')
    || envGet('GOOGLE_GENAI_USE_VERTEXAI')
    || envGet('GOOGLE_GENAI_USE_VERTEXAI'),
  );
}

export function vertexProject() {
  return envGet('GOOGLE_CLOUD_PROJECT')
    || envGet('GOOGLE_CLOUD_PROJECT')
    || envGet('REACT_APP_FIREBASE_PROJECT_ID')
    || 'sukhmal-website';
}

export function vertexLocation() {
  return envGet('GOOGLE_CLOUD_LOCATION') || envGet('GOOGLE_CLOUD_LOCATION') || 'global';
}

export function vertexImageModel() {
  return envGet('GEMINI_IMAGE_MODEL') || envGet('GEMINI_IMAGE_MODEL') || 'gemini-2.5-flash-image';
}

function resolveCredentialFile() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const firebaseDir = path.resolve(here, '../../..');
  const repoRoot = path.resolve(firebaseDir, '..');
  const fromEnv = envGet('GOOGLE_APPLICATION_CREDENTIALS');
  const candidates = [];
  if (fromEnv) {
    candidates.push(path.resolve(fromEnv));
    candidates.push(path.resolve(process.cwd(), fromEnv));
    candidates.push(path.resolve(repoRoot, fromEnv.replace(/^[.][/\\]/, '')));
    candidates.push(path.resolve(repoRoot, fromEnv.replace(/^[.]{2}[/\\]/, '')));
  }
  candidates.push(
    path.join(firebaseDir, 'serviceAccountKey.json'),
    path.join(firebaseDir, 'serviceAccountKey.json'),
    path.join(repoRoot, 'secrets', 'serviceAccountKey.json'),
    path.join(repoRoot, 'secrets', 'sukhmal-website.json'),
    path.join(repoRoot, 'secrets', 'sukhmal-website-7818c3bd4fdf.json'),
  );
  return candidates.find((file) => file && existsSync(file)) || '';
}

function toBase64(data) {
  if (!data) return '';
  if (typeof data === 'string') {
    const compact = data.replace(/\s/g, '');
    if (compact.length > 80 && /^[A-Za-z0-9+/]+=*$/.test(compact.slice(0, 120))) return compact;
    return Buffer.from(data, 'binary').toString('base64');
  }
  return Buffer.from(data).toString('base64');
}

function imageFromParts(parts) {
  for (const part of parts || []) {
    const inline = part.inlineData || part.inline_data;
    if (inline?.data) {
      return {
        mimeType: inline.mimeType || inline.mime_type || 'image/png',
        data: toBase64(inline.data),
      };
    }
  }
  return null;
}

function vertexGenerateUrl(project, location, model) {
  const id = String(model || '').replace(/^models\//, '');
  if (location === 'global') {
    return `https://aiplatform.googleapis.com/v1/projects/${project}/locations/global/publishers/google/models/${id}:generateContent`;
  }
  return `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${id}:generateContent`;
}

let tokenCache = { token: '', expiresAt: 0 };

function gcloudBin() {
  const fromEnv = envGet('CLOUDSDK_GCLOUD_PATH');
  if (fromEnv) return fromEnv;
  const home = homedir();
  const localApp = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
  const candidates = [
    path.join(home, 'google-cloud-sdk/bin/gcloud'),
    '/opt/homebrew/bin/gcloud',
    '/usr/local/bin/gcloud',
    path.join(localApp, 'Google', 'Cloud SDK', 'google-cloud-sdk', 'bin', 'gcloud.cmd'),
    'C:\\Program Files (x86)\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd',
    'C:\\Program Files\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd',
  ];
  return candidates.find((file) => existsSync(file)) || (process.platform === 'win32' ? 'gcloud.cmd' : 'gcloud');
}

function gcloudEnv() {
  const env = { ...process.env };
  const py = env.CLOUDSDK_PYTHON
    || path.join(homedir(), '.local/share/uv/python/cpython-3.12-macos-aarch64-none/bin/python3.12');
  if (existsSync(py)) env.CLOUDSDK_PYTHON = py;
  const sdkBins = [
    path.join(homedir(), 'google-cloud-sdk/bin'),
    path.join(process.env.LOCALAPPDATA || path.join(homedir(), 'AppData', 'Local'), 'Google', 'Cloud SDK', 'google-cloud-sdk', 'bin'),
    'C:\\Program Files (x86)\\Google\\Cloud SDK\\google-cloud-sdk\\bin',
    'C:\\Program Files\\Google\\Cloud SDK\\google-cloud-sdk\\bin',
  ].filter((dir) => existsSync(dir));
  if (sdkBins.length) {
    const sep = process.platform === 'win32' ? ';' : ':';
    const pathKey = process.platform === 'win32' && env.Path ? 'Path' : 'PATH';
    env[pathKey] = `${sdkBins.join(sep)}${sep}${env[pathKey] || env.PATH || ''}`;
    env.PATH = env[pathKey];
  }
  return env;
}

async function tokenFromGoogleAuth() {
  const { GoogleAuth } = await import('google-auth-library');
  const json = envGet('GOOGLE_APPLICATION_CREDENTIALS_JSON');
  const keyFile = resolveCredentialFile();
  const opts = { scopes: [CLOUD_SCOPE] };
  if (json) {
    opts.credentials = JSON.parse(json);
  } else if (keyFile) {
    opts.keyFilename = keyFile;
    console.log('[Sukhmal Gemini] vertex auth using service-account file');
  } else {
    const raw = envGet('GOOGLE_APPLICATION_CREDENTIALS');
    if (raw) {
      const abs = path.resolve(process.cwd(), raw);
      if (!existsSync(abs) && !existsSync(path.resolve(raw))) {
        delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
        console.warn('[Sukhmal Gemini] vertex auth GOOGLE_APPLICATION_CREDENTIALS path missing; trying ADC/gcloud');
      }
    }
  }
  const auth = new GoogleAuth(opts);
  const client = await auth.getClient();
  const result = await client.getAccessToken();
  return typeof result === 'string' ? result : result?.token || '';
}

async function tokenFromGcloud() {
  const env = gcloudEnv();
  const bin = gcloudBin();
  const opts = { env, timeout: 20000, windowsHide: true, maxBuffer: 1024 * 1024 };
  if (process.platform === 'win32') {
    const comspec = process.env.ComSpec || 'cmd.exe';
    const quoted = existsSync(bin) ? `"${bin}"` : 'gcloud';
    const { stdout } = await execFileAsync(
      comspec,
      ['/d', '/s', '/c', `${quoted} auth print-access-token`],
      opts,
    );
    return String(stdout || '').trim().split(/\r?\n/).filter(Boolean).pop() || '';
  }
  const { stdout } = await execFileAsync(bin, ['auth', 'print-access-token'], opts);
  return String(stdout || '').trim().split(/\r?\n/).filter(Boolean).pop() || '';
}

async function vertexAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) return tokenCache.token;

  const attempts = [tokenFromGoogleAuth, tokenFromGcloud];
  let lastErr = null;
  for (const attempt of attempts) {
    try {
      const token = await attempt();
      if (token) {
        tokenCache = { token, expiresAt: Date.now() + 45 * 60 * 1000 };
        return token;
      }
    } catch (err) {
      lastErr = err;
      console.warn(
        `[Sukhmal Gemini] vertex auth ${attempt.name} failed: ${String(err.message || err).slice(0, 220)}`,
      );
    }
  }

  const missing = new Error(
    lastErr?.message
      || 'Vertex auth is missing. For local preview set GOOGLE_APPLICATION_CREDENTIALS to firebase/serviceAccountKey.json',
  );
  missing.code = 'gemini_auth';
  throw missing;
}

export async function vertexAuthPing() {
  const token = await vertexAccessToken();
  return { ok: Boolean(token), project: vertexProject(), location: vertexLocation(), model: vertexImageModel() };
}

function apiError(status, message) {
  const err = new Error(message || `Vertex image request failed (${status})`);
  err.status = status;
  err.code = status === 401 || status === 403 ? 'gemini_auth' : 'gemini_error';
  return err;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** HTTP/1.1 POST — Node fetch/HTTP2 resets on ~4MB Vertex image payloads. */
function postVertexJson(url, token, body, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const payload = Buffer.from(body);
    const req = https.request({
      hostname: target.hostname,
      path: `${target.pathname}${target.search}`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
      },
      timeout: timeoutMs,
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = {};
        try { json = JSON.parse(text || '{}'); } catch { json = {}; }
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json,
        });
      });
    });
    req.on('timeout', () => {
      req.destroy();
      const err = new Error('Vertex image request timed out');
      err.code = 'gemini_error';
      reject(err);
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function isRateLimit(status, message) {
  return status === 429 || /resource has been exhausted|rate[- ]limit|quota/i.test(message || '');
}

export function vertexTextModel() {
  return envGet('GEMINI_MODEL') || 'gemini-2.5-flash';
}

function textFromParts(parts) {
  return (parts || []).map((part) => part.text || '').join('\n').trim();
}

export async function generateVertexContent({ contents, generationConfig, label = 'vertex-text' }) {
  const project = vertexProject();
  const location = vertexLocation();
  const model = vertexTextModel();
  const token = await vertexAccessToken();
  const url = vertexGenerateUrl(project, location, model);

  console.log(`[Sukhmal Gemini] ${label} vertex=oauth project=${project} location=${location} model=${model}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      generationConfig: generationConfig || { temperature: 0.4 },
    }),
    signal: AbortSignal.timeout(60000),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || `Vertex HTTP ${res.status}`;
    console.warn(`[Sukhmal Gemini] ${label} vertex failed status=${res.status} message=${String(msg).slice(0, 300)}`);
    throw apiError(res.status, msg);
  }

  const text = textFromParts(json?.candidates?.[0]?.content?.parts);
  if (!text) {
    const err = new Error('Vertex Gemini returned an empty reply');
    err.code = 'gemini_error';
    throw err;
  }
  console.log(`[Sukhmal Gemini] ${label} ok model=${model} api=vertex-oauth chars=${text.length}`);
  return { text, model, apiVersion: 'vertex' };
}

/** Same parts layout as Studio generateContentParts() in geminiClient.js. */
function vertexImageParts(prompt, referenceImages, imageLabels, editFirstImage) {
  const refs = (referenceImages || []).filter((img) => img?.data);
  if (editFirstImage && refs[0]) {
    const parts = [{
      inlineData: {
        mimeType: refs[0].mimeType || 'image/png',
        data: toBase64(refs[0].data),
      },
    }];
    parts.push({ text: prompt });
    refs.slice(1).forEach((img, i) => {
      const name = imageLabels?.[i];
      if (name) parts.push({ text: `Selected product pack: ${name}` });
      parts.push({
        inlineData: {
          mimeType: img.mimeType || 'image/png',
          data: toBase64(img.data),
        },
      });
    });
    return parts;
  }
  const labelFor = (i) => imageLabels?.[i] || `Reference photo ${i + 1}:`;
  return [
    { text: prompt },
    ...refs.flatMap((img, i) => [
      { text: labelFor(i) },
      {
        inlineData: {
          mimeType: img.mimeType || 'image/png',
          data: toBase64(img.data),
        },
      },
    ]),
  ];
}

function collectImageRefs(referenceImage, referenceImages) {
  const list = [];
  const push = (img) => {
    if (!img?.data) return;
    list.push({
      mimeType: img.mimeType || 'image/png',
      data: img.data,
    });
  };
  push(referenceImage);
  (Array.isArray(referenceImages) ? referenceImages : []).forEach(push);
  return list;
}

export async function generateVertexImage({
  prompt,
  label = 'vertex-image',
  referenceImage,
  referenceImages,
  imageLabels,
  editFirstImage = true,
}) {
  const project = vertexProject();
  const location = vertexLocation();
  const model = vertexImageModel();
  const token = await vertexAccessToken();
  const url = vertexGenerateUrl(project, location, model);
  const refs = collectImageRefs(referenceImage, referenceImages);
  const parts = vertexImageParts(prompt, refs, imageLabels, Boolean(editFirstImage && refs.length));
  const partsOrder = parts.map((part, i) => (
    part.inlineData
      ? `${i}:image:${part.inlineData.mimeType || 'unknown'}`
      : `${i}:text`
  ));
  console.log(
    `[Sukhmal Gemini] ${label} vertex parts_order first_is_hamper_image=${partsOrder[0]?.startsWith('0:image:')} order=${partsOrder.join(' | ')}`,
  );

  console.log(
    `[Sukhmal Gemini] ${label} vertex=oauth project=${project} location=${location} model=${model} refs=${refs.length} url=${url}`,
  );

  const payload = {
    contents: [{ role: 'user', parts }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  };
  const body = JSON.stringify(payload);
  console.log(`[Sukhmal Gemini] ${label} vertex payload_bytes=${Buffer.byteLength(body)} parts=${parts.length}`);
  const waits = [0, 4000, 10000, 20000];
  let lastErr = null;

  for (let attempt = 0; attempt < waits.length; attempt += 1) {
    if (waits[attempt]) {
      console.warn(`[Sukhmal Gemini] ${label} waiting ${waits[attempt]}ms then retry ${attempt + 1}/${waits.length}`);
      await sleep(waits[attempt]);
    }
    let res;
    try {
      res = await postVertexJson(url, token, body, 120000);
    } catch (err) {
      const detail = [err.message, err.cause?.code, err.cause?.message].filter(Boolean).join(' | ');
      console.warn(`[Sukhmal Gemini] ${label} vertex fetch threw: ${detail.slice(0, 400)}`);
      lastErr = new Error(`Vertex fetch failed: ${detail}`);
      lastErr.code = 'gemini_error';
      if (attempt + 1 >= waits.length) throw lastErr;
      continue;
    }
    const json = res.json || {};
    if (res.ok) {
      const image = imageFromParts(json?.candidates?.[0]?.content?.parts);
      if (!image?.data) {
        lastErr = new Error('Vertex Gemini returned no image');
        lastErr.code = 'gemini_error';
        continue;
      }
      console.log(`[Sukhmal Gemini] ${label} ok model=${model} api=vertex-oauth bytes=${image.data.length}`);
      return { ...image, model, apiVersion: 'vertex' };
    }
    const msg = json?.error?.message || `Vertex HTTP ${res.status}`;
    console.warn(`[Sukhmal Gemini] ${label} vertex failed status=${res.status} message=${String(msg).slice(0, 300)}`);
    lastErr = apiError(res.status, msg);
    if (!isRateLimit(res.status, msg)) throw lastErr;
  }

  throw lastErr || new Error('Vertex Gemini returned no image');
}

export function developerApiKeyAvailable() {
  return Boolean(geminiImageApiKey());
}
