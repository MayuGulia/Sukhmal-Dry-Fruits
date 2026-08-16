import { generateGeminiImage } from './geminiClient.js';
import { CUSTOMER_AI_FALLBACK, geminiImageApiKey } from './geminiEnv.js';
import { buildHamperImagePrompt, normalizeHamperProducts } from './hamperImagePrompt.js';

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

  const boxType = String(body.boxType || body.packaging || body.hamperName || 'luxury gift box').trim();
  const prompt = buildHamperImagePrompt({ products, boxType });
  console.log('[Sukhmal Gemini] hamper-image prompt', JSON.stringify({ boxType, products }));

  const image = await generateGeminiImage({ key, prompt, label: 'hamper-image' });
  return {
    url: `data:${image.mimeType};base64,${image.data}`,
    products,
    boxType,
  };
}
