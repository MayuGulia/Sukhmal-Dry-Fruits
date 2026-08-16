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

export function buildHamperImagePrompt({ products, boxType }) {
  const list = (products || []).join(', ');
  const box = String(boxType || 'luxury gift box').trim();
  return `A luxury gift hamper box elegantly filled with ${list}, packed in a ${box}, photographed with warm golden lighting on a dark velvet surface, Sukhmal Dry Fruits Korner label visible, festive Indian gifting style, product photography, 4K quality. The contents must clearly include: ${list}.`;
}
