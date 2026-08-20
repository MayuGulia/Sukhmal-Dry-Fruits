import { httpsCallable } from 'firebase/functions';
import { aiApi } from '@/lib/api';
import { auth, functions } from '@/lib/firebase';

function cloudPayload(payload) {
  const selections = Array.isArray(payload.productSelections) ? payload.productSelections : [];
  const productIds = selections.map((p) => p.productId || p.id).filter(Boolean);
  const quantities = Object.fromEntries(
    selections.map((p) => [p.productId || p.id, Number(p.qty) || 1]),
  );
  return {
    hamperId: payload.hamperId,
    productIds,
    quantities,
    giftCard: {
      included: Boolean(payload.giftCard?.message || payload.giftCard?.included),
      message: payload.giftCard?.message || '',
      name: payload.giftCard?.name || '',
    },
  };
}

async function fromVertex(payload) {
  const call = httpsCallable(functions, 'generateHamperImage', { timeout: 180000 });
  const { data } = await call(cloudPayload(payload));
  if (!data?.imageUrl) throw new Error('empty');
  return {
    url: data.imageUrl,
    views: [{ key: 'front', label: 'Front', url: data.imageUrl }],
    cached: Boolean(data.cached),
  };
}

export async function requestHamperPreview(payload) {
  if (auth?.currentUser && functions) {
    try {
      return await fromVertex(payload);
    } catch (err) {
      console.warn('[hamper preview] Vertex callable failed, using local route', err?.code || err?.message);
    }
  }
  const r = await aiApi.post('/generate-hamper-image', payload, { timeout: 180000 });
  return r.data;
}
