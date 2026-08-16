import { generateGeminiImage } from './geminiClient.js';
import { CUSTOMER_AI_FALLBACK, geminiImageApiKey, keyFingerprint } from './geminiEnv.js';
import { buildHamperImagePrompt, normalizeGiftCard, normalizeHamperProducts } from './hamperImagePrompt.js';

export async function generateHamperPreview(body) {
  const key = geminiImageApiKey();
  if (!key) {
    console.warn('[Sukhmal Gemini] hamper-image missing server API key');
    const err = new Error(CUSTOMER_AI_FALLBACK);
    err.code = 'not_configured';
    throw err;
  }

  const products = normalizeHamperProducts(body);
  if (!products.length) {
    const err = new Error('Add products to your hamper before generating a preview.');
    err.code = 'bad_request';
    throw err;
  }

  const hamperName = String(body.hamperName || body.hamperId || '').trim();
  const boxType = String(body.boxType || body.packaging || hamperName || 'luxury gift box').trim();
  const packaging = String(body.packaging || body.boxType || boxType).trim();
  const giftCard = normalizeGiftCard(body.giftCard);
  const prompt = buildHamperImagePrompt({ products, boxType, hamperName, packaging, giftCard });
  console.log(
    '[Sukhmal Gemini] hamper-image prompt',
    JSON.stringify({
      hamperName,
      boxType,
      packaging,
      products,
      giftCard: { name: giftCard.name, hasMessage: Boolean(giftCard.message), hasRecipient: Boolean(giftCard.recipient) },
      imageKey: keyFingerprint(key),
    }),
  );

  const image = await generateGeminiImage({ key, prompt, label: 'hamper-image' });
  return {
    url: `data:${image.mimeType};base64,${image.data}`,
    products,
    boxType,
    hamperName,
    giftCard,
  };
}
