import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { envGet, geminiImageApiKey } from './geminiEnv.js';

const execFileAsync = promisify(execFile);
const CLOUD_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

function truthy(value) {
  return /^(1|true|yes)$/i.test(String(value || '').trim());
}

export function vertexImageEnabled() {
  return truthy(envGet('GOOGLE_GENAI_USE_ENTERPRISE') || envGet('GOOGLE_GENAI_USE_VERTEXAI'));
}

export function vertexProject() {
  return envGet('GOOGLE_CLOUD_PROJECT') || envGet('REACT_APP_FIREBASE_PROJECT_ID') || 'sukhmal-website';
}

export function vertexLocation() {
  return envGet('GOOGLE_CLOUD_LOCATION') || 'global';
}

export function vertexImageModel() {
  return envGet('GEMINI_IMAGE_MODEL') || 'gemini-2.5-flash-image';
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
  const sdkBin = path.join(homedir(), 'google-cloud-sdk/bin');
  if (existsSync(sdkBin)) env.PATH = `${sdkBin}:${env.PATH || ''}`;
  return env;
}

async function tokenFromGoogleAuth() {
  const { GoogleAuth } = await import('google-auth-library');
  const json = envGet('GOOGLE_APPLICATION_CREDENTIALS_JSON');
  const opts = { scopes: [CLOUD_SCOPE] };
  if (json) {
    opts.credentials = JSON.parse(json);
  }
  const auth = new GoogleAuth(opts);
  const client = await auth.getClient();
  const result = await client.getAccessToken();
  return typeof result === 'string' ? result : result?.token || '';
}

async function tokenFromGcloud() {
  const { stdout } = await execFileAsync(gcloudBin(), ['auth', 'print-access-token'], {
    env: gcloudEnv(),
    timeout: 20000,
  });
  return String(stdout || '').trim();
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
    }
  }

  const missing = new Error(
    lastErr?.message
      || 'Vertex auth is missing. For local preview set GOOGLE_APPLICATION_CREDENTIALS to firebase/serviceAccountKey.json',
  );
  missing.code = 'gemini_auth';
  throw missing;
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

export async function generateVertexImage({ prompt, label = 'vertex-image', referenceImage }) {
  const project = vertexProject();
  const location = vertexLocation();
  const model = vertexImageModel();
  const token = await vertexAccessToken();
  const url = vertexGenerateUrl(project, location, model);
  const parts = [{ text: prompt }];
  if (referenceImage?.data) {
    parts.push({
      inlineData: {
        mimeType: referenceImage.mimeType || 'image/png',
        data: toBase64(referenceImage.data),
      },
    });
  }

  console.log(`[Sukhmal Gemini] ${label} vertex=oauth project=${project} location=${location} model=${model} ref=${Boolean(referenceImage?.data)}`);

  const payload = {
    contents: [{ role: 'user', parts }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  };
  const waits = [0, 4000];
  let lastErr = null;

  for (let attempt = 0; attempt < waits.length; attempt += 1) {
    if (waits[attempt]) {
      console.warn(`[Sukhmal Gemini] ${label} waiting ${waits[attempt]}ms then retry ${attempt + 1}/${waits.length}`);
      await sleep(waits[attempt]);
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(120000),
    });
    const json = await res.json().catch(() => ({}));
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
