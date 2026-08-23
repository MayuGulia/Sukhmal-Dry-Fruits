import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { VertexAI, type Part } from '@google-cloud/vertexai';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL_ID = 'gemini-2.5-flash-image';
const STORAGE_OBJECT_PREFIX = 'hamper-previews';
const MAX_INLINE_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_FETCH_TIMEOUT_MS = 20_000;

type GenerateHamperImageBody = {
  hamperImageBase64?: unknown;
  productImages?: unknown;
  productNames?: unknown;
  giftCardMessage?: unknown;
};

type InlineImage = {
  mimeType: 'image/png' | 'image/jpeg';
  data: string;
};

function failedGeneration() {
  return NextResponse.json({ error: 'generation_failed' }, { status: 500 });
}

/**
 * PLACEHOLDER — replace this function body with the production edit prompt.
 * The exact copy will be supplied separately; do not treat this stub as final.
 */
function buildEditPrompt(input: {
  productNames: string[];
  giftCardMessage?: string;
}): string {
  const names = input.productNames.filter(Boolean).join(', ');
  const gift = input.giftCardMessage?.trim();
  // PLACEHOLDER_PROMPT_TEXT — swap the returned string for the real edit prompt.
  return [
    'PLACEHOLDER: replace this string with the production hamper-edit prompt.',
    names ? `Products: ${names}` : '',
    gift ? `Gift card message: ${gift}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function stripDataUrlPrefix(raw: string): { mimeType: string; data: string } | null {
  const trimmed = raw.trim();
  const dataUrl = /^data:([^;]+);base64,(.+)$/i.exec(trimmed);
  if (dataUrl) {
    return { mimeType: dataUrl[1].trim().toLowerCase(), data: dataUrl[2].replace(/\s/g, '') };
  }
  if (/^[a-z0-9+/=\s]+$/i.test(trimmed) && trimmed.replace(/\s/g, '').length > 32) {
    return { mimeType: 'image/jpeg', data: trimmed.replace(/\s/g, '') };
  }
  return null;
}

/** @google-cloud/vertexai GenerativeContentBlob accepts only image/png or image/jpeg. */
function toVertexMime(mimeType: string): 'image/png' | 'image/jpeg' {
  return mimeType.toLowerCase().includes('png') ? 'image/png' : 'image/jpeg';
}

function inlineImageFromParsed(parsed: { mimeType: string; data: string }): InlineImage | null {
  if (!parsed.data) return null;
  const approxBytes = Math.floor((parsed.data.length * 3) / 4);
  if (approxBytes > MAX_INLINE_IMAGE_BYTES) return null;
  return { mimeType: toVertexMime(parsed.mimeType), data: parsed.data };
}

async function inlineImageFromValue(value: string): Promise<InlineImage | null> {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = stripDataUrlPrefix(trimmed);
  if (parsed && !/^https?:\/\//i.test(trimmed)) {
    return inlineImageFromParsed(parsed);
  }

  if (!/^https?:\/\//i.test(trimmed)) return null;

  const res = await fetch(trimmed, { signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS) });
  if (!res.ok) return null;
  const buffer = Buffer.from(await res.arrayBuffer());
  if (!buffer.length || buffer.length > MAX_INLINE_IMAGE_BYTES) return null;
  const headerType = (res.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
  return {
    mimeType: toVertexMime(headerType),
    data: buffer.toString('base64'),
  };
}

function extractGeneratedImage(parts: Part[] | undefined): InlineImage | null {
  if (!parts?.length) return null;
  for (const part of parts) {
    if ('inlineData' in part && part.inlineData?.data) {
      return {
        mimeType: toVertexMime(part.inlineData.mimeType || 'image/png'),
        data: part.inlineData.data,
      };
    }
  }
  return null;
}

function firebaseAdminApp() {
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET?.trim();
  if (!storageBucket) {
    throw new Error('missing_storage_bucket');
  }
  const existing = getApps()[0];
  if (existing) return existing;
  return initializeApp({
    credential: applicationDefault(),
    storageBucket,
  });
}

async function uploadPreviewPng(base64Png: string): Promise<string> {
  firebaseAdminApp();
  const bucket = getStorage().bucket();
  const objectPath = `${STORAGE_OBJECT_PREFIX}/${uuidv4()}.png`;
  const file = bucket.file(objectPath);
  const buffer = Buffer.from(base64Png, 'base64');

  await file.save(buffer, {
    resumable: false,
    contentType: 'image/png',
    metadata: { contentType: 'image/png' },
  });

  try {
    await file.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
  } catch {
    // Uniform bucket-level access rejects makePublic(); fall back to a V4 signed URL.
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
    return signedUrl;
  }
}

export async function POST(request: Request) {
  try {
    // RATE LIMIT INSERTION POINT
    // TODO: Firestore-based per-session / per-user limiting.
    // Resolve the caller (session id or auth uid), increment a counter document
    // (e.g. hamperPreviewRateLimits/{id}), and return 429 when over quota.
    // Do not implement the full logic here yet.

    const project = process.env.GCP_PROJECT_ID?.trim();
    const location = process.env.GCP_LOCATION?.trim();
    if (!project || !location) {
      return failedGeneration();
    }

    let body: GenerateHamperImageBody;
    try {
      body = (await request.json()) as GenerateHamperImageBody;
    } catch {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }

    if (typeof body.hamperImageBase64 !== 'string' || !body.hamperImageBase64.trim()) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }

    const productNames = asStringArray(body.productNames);
    const giftCardMessage =
      typeof body.giftCardMessage === 'string' ? body.giftCardMessage : undefined;

    const hamperImage = await inlineImageFromValue(body.hamperImageBase64);
    if (!hamperImage) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }

    const productImageParts: Part[] = [];
    for (const image of asStringArray(body.productImages)) {
      try {
        const inline = await inlineImageFromValue(image);
        if (!inline) continue;
        productImageParts.push({
          inlineData: { mimeType: inline.mimeType, data: inline.data },
        });
      } catch {
        // Skip a single product image that cannot be inlined; Vertex still receives the rest.
      }
    }

    const parts: Part[] = [
      { text: buildEditPrompt({ productNames, giftCardMessage }) },
      { inlineData: { mimeType: hamperImage.mimeType, data: hamperImage.data } },
      ...productImageParts,
    ];

    try {
      // ADC / GOOGLE_APPLICATION_CREDENTIALS is picked up by the SDK. Do not load the JSON here.
      const vertexAI = new VertexAI({ project, location });
      const model = vertexAI.getGenerativeModel({ model: MODEL_ID });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts }],
      });

      const generated = extractGeneratedImage(result.response.candidates?.[0]?.content?.parts);
      if (!generated) {
        return failedGeneration();
      }

      const url = await uploadPreviewPng(generated.data);
      return NextResponse.json({ url });
    } catch {
      return failedGeneration();
    }
  } catch {
    return failedGeneration();
  }
}
