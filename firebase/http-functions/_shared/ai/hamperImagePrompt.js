export function layoutFromHamper(body = {}) {
  const explicit = String(body.layoutType || body.layout_type || '').toLowerCase();
  if (explicit === 'compartment' || explicit === 'open_arrangement') return explicit;
  const kind = String(
    body.packagingKind || body.packaging || body.boxType || body.category || '',
  ).toLowerCase();
  return /box|compartment/.test(kind) ? 'compartment' : 'open_arrangement';
}

export function normalizeHamperProductItems(body) {
  const items = [];
  const fromItem = (item) => {
    if (!item) return;
    if (typeof item === 'string') {
      const name = item.replace(/\s+/g, ' ').trim();
      if (name) items.push({ name, quantity: 1, imageUrl: '' });
      return;
    }
    const name = String(item.name || item.productName || '').replace(/\s+/g, ' ').trim();
    if (!name) return;
    const weight = String(item.weight || item.variant || '').trim();
    const qty = Math.max(1, Number(item.qty || item.quantity) || 1);
    const imageUrl = String(
      item.imageUrl
        || item.img
        || item.image
        || item.referenceImageUrl
        || (Array.isArray(item.images) ? item.images[0] : '')
        || '',
    ).trim();
    const extraImages = Array.isArray(item.images) ? item.images.map((u) => String(u || '').trim()).filter(Boolean) : [];
    items.push({
      name: `${name}${weight ? ` ${weight}` : ''}`.trim(),
      quantity: qty,
      imageUrl,
      slug: String(item.slug || item.productId || item.id || '').trim(),
      images: extraImages,
    });
  };

  const selections = Array.isArray(body?.productSelections) ? body.productSelections : [];
  const products = Array.isArray(body?.products) ? body.products : [];
  (selections.length ? selections : products).forEach(fromItem);
  if (!items.length) products.forEach(fromItem);

  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  }).slice(0, 12);
}

export function normalizeHamperProducts(body) {
  return normalizeHamperProductItems(body).map((item) => (
    item.quantity > 1 ? `${item.name} ×${item.quantity}` : item.name
  ));
}

export function normalizeGiftCard(raw) {
  if (!raw) return { name: 'Especially For You', message: '', recipient: '', included: false, style: '' };
  if (typeof raw === 'string') {
    const name = raw.trim() || 'Especially For You';
    return { name, message: '', recipient: '', included: false, style: name };
  }
  const message = String(raw.message || '').trim().slice(0, 150);
  const name = String(raw.name || raw.title || 'Especially For You').trim() || 'Especially For You';
  const included = raw.included === true && Boolean(message);
  return {
    name,
    message,
    recipient: String(raw.recipient || raw.to || '').trim().slice(0, 80),
    included,
    style: String(raw.style || raw.design || name).trim(),
  };
}

export function buildPackHamperEditPrompt({
  products,
  giftCard,
  brand = 'Sukhmal',
  layoutType = 'open_arrangement',
} = {}) {
  const items = Array.isArray(products) && products[0] && typeof products[0] === 'object'
    ? products
    : (products || []).map((name) => ({ name, quantity: 1 }));
  const lines = [];
  items.forEach((item) => {
    const copies = Math.max(1, Number(item.quantity) || 1);
    for (let i = 0; i < copies; i += 1) {
      const n = lines.length + 1;
      const brandBit = n === 1
        ? ` — recognizable jar/pack as typically packaged, labeled "${brand}" if visible on the reference product photo`
        : '';
      lines.push(`${n}. ${item.name}${brandBit}`);
    }
  });
  const count = lines.length;
  const card = normalizeGiftCard(giftCard);
  const giftSection = (card.included || card.message)
    ? `ADD a small physical gift card into this same photograph (folded or propped near the front of the hamper, not covering product labels). The card title is "${card.name}".${card.recipient ? ` Address it to "${card.recipient}".` : ''} Print this message legibly on the card: "${card.message}". The gift card is an extra object in the scene — do not replace the hamper or the selected products with it.`
    : `Do not add a gift card. If a gift card is already visible in the original reference, leave it as it appears.`;
  const layoutInstruction = layoutType === 'compartment'
    ? `This hamper has visible internal compartments. Fill each compartment
with one of the replacement products below, matching each product's real
size to a compartment of an appropriate scale. Do not merge products into
one compartment unless the original reference shows multiple items sharing
a compartment. If there are more compartments than products, leave the
extra compartments empty rather than duplicating an item.`
    : `This hamper is an open tray/basket arrangement, not a compartmented
box. Arrange the replacement products the way a curated dry-fruit spread is
naturally styled — some items in small piles, jars/pouches placed upright,
matching the general density and spread of the original reference photo.
Do not force items into a grid.`;

  return `Edit the provided hamper image. Do not create a new scene, do not change the box, background, lighting, angle, ribbon, fabric, decorations, or camera framing in any way — keep every element of the original image exactly as it is.

The ONLY thing to change is the contents visible inside the box: replace whatever product jars/packs are currently shown with exactly the following ${count} products, and show all ${count} of them, no more, no fewer:

${lines.join('\n')}

Arrange these ${count} items inside the box the same way products are already arranged in the original reference (same general layout style, same scale relative to the box). Do not add any product not in this list. Do not remove or leave the box looking emptier or fuller than ${count} items would naturally fill.

${layoutInstruction}

${giftSection}

The photos after this instruction are the selected product packs. Copy each pack's jar/box, lid, and label from those photos. Place those packs at full product scale inside the actual basket/box interior — do not paste a tiny cluster, thumbnail, or sticker overlay in one corner.

Output a single photorealistic image, same resolution and aspect ratio as the input image. This is a product-accuracy preview for e-commerce — the box, its exterior, and its styling must remain visually identical to the original reference; only the interior contents (and gift card text, if applicable) may change.`;
}

export function buildEmptyHamperEditPrompt({ hamperName } = {}) {
  const hamper = String(hamperName || 'selected gift hamper').trim();
  return `IMAGE-TO-IMAGE EDIT of the attached photograph. Do not generate a new image from scratch.

This photograph IS the customer's selected "${hamper}".
Keep the EXACT same photo: camera angle, crop, background, lighting, container, ribbon, wrap, flowers, pearls.
REMOVE every product currently inside or on it (jars, tins, pouches, nuts, snacks, food).
Leave the container empty. Tissue or filler paper may stay.

Do not draw a different hamper. Do not change the background. No text, logos, prices, or watermarks.`;
}

export function buildProductDescribePrompt({ products, hamperName, packaging, hasHamperPhoto = false } = {}) {
  const items = Array.isArray(products) && products[0] && typeof products[0] === 'object'
    ? products
    : (products || []).map((name) => ({ name, quantity: 1 }));
  const list = items
    .map((item, i) => `${i + 1}. ${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}`)
    .join('\n');
  const hamper = String(hamperName || 'selected gift hamper').trim();
  const pack = String(packaging || '').trim();

  if (hasHamperPhoto) {
    return `You will receive photographs. Image 1 is the selected gift hamper "${hamper}"${pack ? ` (${pack})` : ''}. The following images are the selected product packs, in this order:

${list}

Write two sections, text only:

A) HAMPER — a precise visual description of image 1: box/basket/tray material, color, shape, ribbon, fabric, decorations, flowers, pearls, background, lighting, camera angle/framing, and how items currently sit inside. Describe the exterior so a painter could recreate the same photo.

B) PRODUCTS — a precise visual description of EACH selected pack from the product photos after image 1. Cover container type, lid, label colors/text, visible contents. One numbered subsection per product, matching the list. Do not invent extra products.`;
  }

  return `You will receive catalog photographs of packaged dry-fruit products, in this exact order:

${list}

Write a detailed visual description of EACH product pack from its photo. Cover: container type (jar, pouch, tin, box), shape, materials, lid/cap color, label colors and any readable brand/product text, visible contents, and overall look.

Rules:
- One numbered section per product, matching the list order.
- Describe only what is visible in that product photo.
- Do not invent extra products.
- Do not describe a gift hamper or a scene.
- Text only.`;
}

export function buildComposeImagePrompt({
  products,
  giftCard,
  hamperName,
  packaging,
  productDescription,
  brand = 'Sukhmal',
  layoutType = 'open_arrangement',
} = {}) {
  const edit = buildPackHamperEditPrompt({ products, giftCard, brand, layoutType });
  const hamper = String(hamperName || 'selected gift hamper').trim();
  const pack = String(packaging || '').trim();
  return `${edit}

Selected hamper: "${hamper}"${pack ? ` (${pack})` : ''}.

Use the following visual descriptions of the selected product packs (from their catalog photos). Recreate those packs exactly:

${String(productDescription || '').trim()}

Photorealistic e-commerce product photo. Same styling as a studio hamper catalog shot.`;
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

export function buildPackedHamperPrompt(args) {
  return buildHamperImagePrompt(args);
}

export function buildFreeformHamperPrompt(userPrompt) {
  const text = String(userPrompt || '').replace(/\s+/g, ' ').trim().slice(0, 500);
  return `Photorealistic commercial product photo for Sukhmal Dry Fruits Korner.
${text}
Luxury Indian dry-fruit gift hamper, gold ribbon, warm studio lighting, cream marble or dark velvet surface, 4K catalog photography, no text overlay, no watermarks, no logos other than the product itself. Aspect ratio 1:1.`;
}
