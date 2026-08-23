import { GoogleGenAI, Modality, type Part } from '@google/genai';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL_ID = 'gemini-2.5-flash-image';
const STORAGE_OBJECT_PREFIX = 'hamperPreviews';
const LIMITS_COLLECTION = 'generationLimits';
const GUEST_LIMIT_PER_SESSION = 3;
const USER_LIMIT_PER_DAY = 5;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_INLINE_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_FETCH_TIMEOUT_MS = 20_000;
const SESSION_COOKIE = 'sk_session';

type GenerateHamperImageBody = {
  hamperImageBase64?: unknown;
  productImages?: unknown;
  productNames?: unknown;
  giftCardMessage?: unknown;
  sessionId?: unknown;
};

type InlineImage = {
  mimeType: 'image/png' | 'image/jpeg';
  data: string;
};

class RateLimitError extends Error {
  readonly status = 429 as const;
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

function logRouteError(stage: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  const safe = message.replace(/secrets[\\/][^\s'"]+/gi, 'secrets/<redacted>').slice(0, 400);
  console.error(`[generate-hamper-image] ${stage}: ${safe}`);
}

function failedGeneration() {
  return NextResponse.json({ error: 'generation_failed' }, { status: 500 });
}

function buildEditPrompt(input: {
  productNames: string[];
  giftCardMessage?: string;
}): string {
  const names = input.productNames.filter(Boolean);
  const n = names.length;
  const brand = 'Sukhmal';
  const productLines = names
    .map((name, index) => {
      if (index === 0) {
        return `${index + 1}. ${name} — recognizable jar/pack as typically packaged, labeled "${brand}" if visible on the reference product photo`;
      }
      return `${index + 1}. ${name}`;
    })
    .join('\n');
  const giftCardMessage = input.giftCardMessage?.trim();
  const giftSection = giftCardMessage
    ? `A small gift card is visible in the scene. Keep its position and design exactly as shown in the original image, only update its printed/handwritten message text to: "${giftCardMessage}". If no message was provided, leave the card as it appears in the original reference — do not add placeholder text.`
    : `If a gift card is already visible in the original reference, leave it as it appears — do not add placeholder text. Do not add a gift card.`;

  return `Edit the provided hamper image. Do not create a new scene, do not change the box, background, lighting, angle, ribbon, fabric, decorations, or camera framing in any way — keep every element of the original image exactly as it is.

The ONLY thing to change is the contents visible inside the box: replace whatever product jars/packs are currently shown with exactly the following ${n} products, and show all ${n} of them, no more, no fewer:

${productLines}

Arrange these ${n} items inside the box the same way products are already arranged in the original reference (same general layout style, same scale relative to the box). Do not add any product not in this list. Do not remove or leave the box looking emptier or fuller than ${n} items would naturally fill.

${giftSection}

Output a single photorealistic image, same resolution and aspect ratio as the input image. This is a product-accuracy preview for e-commerce — the box, its exterior, and its styling must remain visually identical to the original reference; only the interior contents (and gift card text, if applicable) may change.`;
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

function toInlineMime(mimeType: string): 'image/png' | 'image/jpeg' {
  return mimeType.toLowerCase().includes('png') ? 'image/png' : 'image/jpeg';
}

function inlineImageFromParsed(parsed: { mimeType: string; data: string }): InlineImage | null {
  if (!parsed.data) return null;
  const approxBytes = Math.floor((parsed.data.length * 3) / 4);
  if (approxBytes > MAX_INLINE_IMAGE_BYTES) return null;
  return { mimeType: toInlineMime(parsed.mimeType), data: parsed.data };
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
    mimeType: toInlineMime(headerType),
    data: buffer.toString('base64'),
  };
}

function extractGeneratedImage(parts: Part[] | undefined): InlineImage | null {
  if (!parts?.length) return null;
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        mimeType: toInlineMime(part.inlineData.mimeType || 'image/png'),
        data: part.inlineData.data,
      };
    }
  }
  return null;
}

function sanitizeDocId(raw: string): string {
  return raw.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 128);
}

function cookieValue(header: string | null, name: string): string {
  if (!header) return '';
  const match = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(header);
  if (!match?.[1]) return '';
  try {
    return decodeURIComponent(match[1].trim());
  } catch {
    return match[1].trim();
  }
}

function firebaseAdminApp() {
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET?.trim();
  const projectId = process.env.GCP_PROJECT_ID?.trim();
  if (!storageBucket || !projectId) {
    throw new Error('missing_firebase_config');
  }
  const existing = getApps()[0];
  if (existing) return existing;
  return initializeApp({
    credential: applicationDefault(),
    projectId,
    storageBucket,
  });
}

type CallerIdentity =
  | { kind: 'user'; id: string }
  | { kind: 'guest'; id: string; isNewSession: boolean };

async function resolveCaller(request: Request, body: GenerateHamperImageBody): Promise<CallerIdentity> {
  firebaseAdminApp();
  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.match(/^Bearer\s+(\S+)/i)?.[1];
  if (bearer) {
    try {
      const decoded = await getAuth().verifyIdToken(bearer);
      if (decoded.uid) {
        return { kind: 'user', id: decoded.uid };
      }
    } catch {
      // Invalid token: treat as guest so a forged header cannot claim the daily user quota.
    }
  }

  const fromBody = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
  const fromHeader = request.headers.get('x-session-id')?.trim() || '';
  const fromCookie = cookieValue(request.headers.get('cookie'), SESSION_COOKIE);
  const existing = sanitizeDocId(fromBody || fromHeader || fromCookie);
  if (existing) {
    return { kind: 'guest', id: existing, isNewSession: false };
  }
  return { kind: 'guest', id: sanitizeDocId(uuidv4()) || uuidv4(), isNewSession: true };
}

/**
 * Check-and-increment MUST run before Vertex. Incrementing here (not after a
 * successful image) closes the race where parallel requests all pass a stale
 * count and each spend a billable generation.
 */
async function consumeGenerationSlot(identity: CallerIdentity): Promise<void> {
  const db = getFirestore(firebaseAdminApp(), 'default');
  const ref = db.collection(LIMITS_COLLECTION).doc(identity.id);
  const max = identity.kind === 'user' ? USER_LIMIT_PER_DAY : GUEST_LIMIT_PER_SESSION;
  const nowMs = Date.now();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() as { count?: number; resetAt?: Timestamp } | undefined;
    let count = Number(data?.count) || 0;
    let resetAtMs = data?.resetAt instanceof Timestamp ? data.resetAt.toMillis() : 0;

    if (identity.kind === 'user') {
      if (!resetAtMs || nowMs >= resetAtMs) {
        count = 0;
        resetAtMs = nowMs + DAY_MS;
      }
    }

    if (count >= max) {
      throw new RateLimitError(
        identity.kind === 'user'
          ? `You have reached the daily preview limit (${USER_LIMIT_PER_DAY} per day). Try again tomorrow.`
          : `You have reached the preview limit (${GUEST_LIMIT_PER_SESSION} per session). Sign in for a higher daily limit, or start a new session later.`,
      );
    }

    tx.set(ref, {
      count: count + 1,
      resetAt: Timestamp.fromMillis(
        identity.kind === 'user' ? resetAtMs : resetAtMs || nowMs + DAY_MS,
      ),
      kind: identity.kind,
      updatedAt: Timestamp.fromMillis(nowMs),
    });
  });
}

function attachSessionCookie(response: NextResponse, identity: CallerIdentity) {
  if (identity.kind === 'guest' && identity.isNewSession) {
    response.cookies.set(SESSION_COOKIE, identity.id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === 'production',
    });
  }
  return response;
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
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
    return signedUrl;
  }
}

export async function POST(request: Request) {
  let identity: CallerIdentity | null = null;
  try {
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

    identity = await resolveCaller(request, body);

    try {
      await consumeGenerationSlot(identity);
    } catch (err) {
      const limited =
        err instanceof RateLimitError
        || (typeof err === 'object' && err !== null && 'status' in err && (err as { status: unknown }).status === 429);
      if (limited) {
        const message = err instanceof Error ? err.message : 'Preview limit reached.';
        return attachSessionCookie(
          NextResponse.json({ error: 'rate_limited', message }, { status: 429 }),
          identity,
        );
      }
      logRouteError('rate_limit', err);
      return failedGeneration();
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
      const ai = new GoogleGenAI({
        vertexai: true,
        project,
        location,
      });
      const result = await ai.models.generateContent({
        model: MODEL_ID,
        contents: [{ role: 'user', parts }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      const generated = extractGeneratedImage(result.candidates?.[0]?.content?.parts);
      if (!generated) {
        logRouteError('no_image', new Error('candidates contained no inline image'));
        return attachSessionCookie(failedGeneration(), identity);
      }

      const url = await uploadPreviewPng(generated.data);
      return attachSessionCookie(NextResponse.json({ url }), identity);
    } catch (err) {
      logRouteError('vertex_or_upload', err);
      return attachSessionCookie(failedGeneration(), identity);
    }
  } catch (err) {
    logRouteError('unhandled', err);
    const response = failedGeneration();
    return identity ? attachSessionCookie(response, identity) : response;
  }
}
