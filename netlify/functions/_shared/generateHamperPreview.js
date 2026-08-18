import { generateGeminiImage } from './geminiClient.js';
import { CUSTOMER_AI_FALLBACK, geminiImageApiKey, keyFingerprint } from './geminiEnv.js';
import { vertexImageEnabled } from './vertexImage.js';
import {
  buildFreeformHamperPrompt,
  buildHamperImagePrompt,
  normalizeGiftCard,
  normalizeHamperProducts,
} from './hamperImagePrompt.js';

function dataUrl(image) {
  return `data:${image.mimeType};base64,${image.data}`;
}

function view(key, label, image) {
  return { key, label, url: dataUrl(image), mimeType: image.mimeType };
}

export async function generateHamperPreview(body) {
  const key = geminiImageApiKey();
  if (!vertexImageEnabled() && !key) {
    console.warn('[Sukhmal Gemini] hamper-image missing Vertex ADC and server API key');
    const err = new Error(CUSTOMER_AI_FALLBACK);
    err.code = 'not_configured';
    throw err;
  }

  const products = normalizeHamperProducts(body);
  const freePrompt = String(body.prompt || body.description || '').trim();
  if (!products.length && !freePrompt) {
    const err = new Error('Add products to your hamper before generating a preview.');
    err.code = 'bad_request';
    throw err;
  }

  const hamperName = String(body.hamperName || body.hamperId || '').trim();
  const boxType = String(body.boxType || body.packaging || hamperName || 'luxury gift box').trim();
  const packaging = String(body.packaging || body.boxType || boxType).trim();
  const giftCard = normalizeGiftCard(body.giftCard);
  const prompt = products.length
    ? buildHamperImagePrompt({ products, boxType, hamperName, packaging, giftCard })
    : buildFreeformHamperPrompt(freePrompt);

  console.log(
    '[Sukhmal Gemini] hamper-image prompt',
    JSON.stringify({
      hamperName,
      boxType,
      packaging,
      products,
      giftCard: { name: giftCard.name, hasMessage: Boolean(giftCard.message), hasRecipient: Boolean(giftCard.recipient) },
      imageKey: key ? keyFingerprint(key) : 'vertex-adc',
      vertex: vertexImageEnabled(),
      steps: 'single-packed-front',
    }),
  );

  const image = await generateGeminiImage({ key, prompt, label: 'hamper-image' });
  const packed = view('front', 'Front', image);
  return {
    url: packed.url,
    views: [packed],
    products,
    boxType,
    hamperName,
    giftCard,
  };
}
