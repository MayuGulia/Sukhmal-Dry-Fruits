import { aiApi } from '@/lib/api';
import { composeHamperPreview } from '@/lib/composeHamperPreview';

export async function requestHamperPreview(payload) {
  try {
    const r = await aiApi.post('/generate-hamper-image', payload, { timeout: 180000 });
    if (r?.data?.url || r?.data?.views?.length) return r.data;
  } catch (err) {
    console.warn('[hamper preview] in-place edit failed, using selected hamper photo', err?.response?.data?.error || err?.message);
  }
  const url = await composeHamperPreview(payload);
  if (!url) throw new Error('empty');
  return {
    url,
    views: [{ key: 'front', label: 'Front', url }],
    composed: true,
  };
}
