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
Show the "${hamper}" packed in ${box} packaging, lid or wrap open so the inside is clearly visible.
The hamper is filled only with these selected dry-fruit products, in branded jars or pouches: ${list}.
Each pack is distinct and recognizable. Do not invent extra snacks.
A physical paper gift card titled "${card.name}"${toLine} sits in the front of the hamper.${msgLine}
Gold ribbon, festive Indian gifting style, warm golden lighting, dark velvet surface, shallow depth of field, 4K product photography.
The finished image must look like a real packed gift: the chosen hamper, the chosen products, the ${box} packaging, and the gift card together.`;
}
