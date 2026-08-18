export function normalizeHamperProducts(body) {
  const names = [];
  const push = (raw) => {
    const text = String(raw || '').replace(/\s+/g, ' ').trim();
    if (text) names.push(text);
  };
  const fromItem = (item) => {
    if (!item) return;
    if (typeof item === 'string') {
      push(item);
      return;
    }
    const name = item.name || item.productName || '';
    if (!name) return;
    const weight = item.weight || item.variant || '';
    const qty = Number(item.qty) > 1 ? ` ×${item.qty}` : '';
    push(`${name}${weight ? ` ${weight}` : ''}${qty}`);
  };

  (Array.isArray(body?.products) ? body.products : []).forEach(fromItem);
  if (!names.length) {
    (Array.isArray(body?.productSelections) ? body.productSelections : []).forEach(fromItem);
  }
  return [...new Set(names)].slice(0, 12);
}

export function normalizeGiftCard(raw) {
  if (!raw) return { name: 'Especially For You', message: '', recipient: '' };
  if (typeof raw === 'string') return { name: raw.trim() || 'Especially For You', message: '', recipient: '' };
  return {
    name: String(raw.name || raw.title || 'Especially For You').trim() || 'Especially For You',
    message: String(raw.message || '').trim().slice(0, 150),
    recipient: String(raw.recipient || raw.to || '').trim().slice(0, 80),
  };
}

export function buildHamperImagePrompt({ products, boxType, hamperName, packaging, giftCard }) {
  const list = (products || []).join(', ');
  const hamper = String(hamperName || 'Sukhmal luxury gift hamper').trim();
  const box = String(packaging || boxType || 'luxury gift box').trim();
  const card = normalizeGiftCard(giftCard);
  const toLine = card.recipient ? ` addressed to ${card.recipient}` : '';
  const msgLine = card.message ? ` The card text reads: "${card.message}".` : '';

  return `Photorealistic commercial product photo of a Sukhmal Dry Fruits Korner gift hamper.
Start from a completely EMPTY "${hamper}" in ${box} packaging, then pack it.
The hamper is filled only with these selected dry-fruit products, in branded jars or pouches: ${list}.
Each pack is distinct and recognizable. Do not invent extra snacks. Do not keep leftover fruits from a catalogue photo.
A physical paper gift card titled "${card.name}"${toLine} sits in the front of the hamper.${msgLine}
Gold ribbon, festive Indian gifting style, warm golden lighting, dark velvet surface, shallow depth of field, 4K product photography, front-facing view.
The finished image must look like a real packed gift: the chosen empty hamper filled with the chosen products, the ${box} packaging, and the gift card together.`;
}

export function buildEmptyHamperPrompt({ boxType, hamperName, packaging }) {
  const hamper = String(hamperName || 'Sukhmal luxury gift hamper').trim();
  const box = String(packaging || boxType || 'luxury gift box').trim();
  return `Photorealistic studio product photo of an EMPTY "${hamper}" gift vessel.
Packaging type: ${box}. Lid or wrap OPEN so the empty interior is clearly visible.
The hamper is completely empty: no nuts, no dry fruits, no jars, no pouches, no tissue filler, no food of any kind.
Gold ribbon may rest beside the vessel, not covering the empty cavity.
Warm golden lighting, dark velvet surface, 4K catalog photography, front-facing eye-level view.
Do not add any products.`;
}

export function buildPackedHamperPrompt({ products, boxType, hamperName, packaging, giftCard, angle }) {
  const list = (products || []).join(', ');
  const hamper = String(hamperName || 'Sukhmal luxury gift hamper').trim();
  const box = String(packaging || boxType || 'luxury gift box').trim();
  const card = normalizeGiftCard(giftCard);
  const toLine = card.recipient ? ` addressed to ${card.recipient}` : '';
  const msgLine = card.message ? ` The card text reads: "${card.message}".` : '';
  const views = {
    front: 'Camera: eye-level FRONT view, looking straight at the open hamper.',
    side: 'Camera: LEFT three-quarter view, showing the left side and front of the open hamper.',
    top: 'Camera: TOP-DOWN view looking into the packed hamper from above.',
  };
  const camera = views[angle] || views.front;

  return `The attached photo is the EMPTY selected "${hamper}" in ${box} packaging. Keep that same vessel, wood/weave/box material, lighting, and dark velvet surface.
Fill the empty hamper only with these selected products in branded jars or pouches: ${list}.
Do not invent extra snacks. Do not leave the hamper empty. Do not copy random catalogue fruit mixes.
A physical paper gift card titled "${card.name}"${toLine} sits at the front of the packed hamper.${msgLine}
${camera}
Gold ribbon, festive Indian gifting style, warm golden lighting, 4K product photography.
The result must be this exact hamper, packed with only the selected products, plus the gift card.`;
}

export function buildFreeformHamperPrompt(userPrompt) {
  const text = String(userPrompt || '').replace(/\s+/g, ' ').trim().slice(0, 500);
  return `Photorealistic commercial product photo for Sukhmal Dry Fruits Korner.
${text}
Luxury Indian dry-fruit gift hamper, gold ribbon, warm studio lighting, cream marble or dark velvet surface, 4K catalog photography, no text overlay, no watermarks, no logos other than the product itself.`;
}
