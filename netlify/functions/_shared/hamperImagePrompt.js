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
    items.push({
      name: `${name}${weight ? ` ${weight}` : ''}`.trim(),
      quantity: qty,
      imageUrl,
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
  const included = raw.included === true || (raw.included !== false && Boolean(message));
  return {
    name,
    message,
    recipient: String(raw.recipient || raw.to || '').trim().slice(0, 80),
    included,
    style: String(raw.style || raw.design || name).trim(),
  };
}

function arrangementInstructions(layout, packaging) {
  const kind = String(packaging || '').toLowerCase();
  if (layout === 'compartment' || /box/.test(kind)) {
    return `Box: populate the interior ONLY if the box is shown open in reference image 1.
If the lid is closed in the reference, keep that closed look and do not invent an open interior.
If it is open, fill visible compartments with the selected jars/packs. Preserve box material,
color, compartment count/shape, ribbon, and lid. Fewer products than compartments: leave
the rest empty — never duplicate or invent items.`;
  }
  if (/tray/.test(kind)) {
    return `Tray: lay the selected products side by side on the tray surface. Keep the tray
material, color, rim, and any handles exactly as in reference image 1. Do not stack extra
items around the tray.`;
  }
  return `Open basket: nestle the selected jars/packs inside the basket so they sit naturally
and slightly overlap, as a curated dry-fruit gift would. Keep basket weave, rim color,
cellophane, ribbon, pearls, flowers, and other garnish from reference image 1.`;
}

export function buildHamperImagePrompt({
  products,
  boxType,
  hamperName,
  packaging,
  giftCard,
  layoutType,
  hasHamperRef = false,
  hasProductRefs = false,
  hasCardRef = false,
}) {
  const items = Array.isArray(products) && products[0] && typeof products[0] === 'object'
    ? products
    : (products || []).map((name) => ({ name, quantity: 1 }));
  const hamper = String(hamperName || 'Sukhmal luxury gift hamper').trim();
  const box = String(packaging || boxType || 'luxury gift box').trim();
  const layout = layoutType === 'compartment' ? 'compartment' : 'open_arrangement';
  const productList = items
    .map((item) => `- ${item.name} (qty ${item.quantity || 1})`)
    .join('\n') || '- (none)';
  const card = normalizeGiftCard(giftCard);
  const printedMessage = card.message || 'Especially For You';
  const showCard = Boolean(hasCardRef || card.included);

  const hamperRefNote = hasHamperRef
    ? 'attached as reference image 1 (the selected hamper/container)'
    : `no photo attached — recreate a realistic ${box} named "${hamper}"`;
  const productRefNote = hasProductRefs
    ? 'attached after the hamper photo, in the same order as the list below. Use ONLY these exact jars/packs.'
    : 'no product photos attached — match the listed Sukhmal jars exactly; do not invent other SKUs.';

  const giftCardSection = showCard
    ? `

If a gift card design reference is attached, include a small card propped against the hamper
(front-right), matching that design. Print the message "${printedMessage}" in a clean, readable
handwritten-style font. If no custom message was provided, the printed line is "Especially For You"
(or leave the writing area blank if the card artwork already shows that title).`
    : `

Do not add a gift card.`;

  return `You are compositing a product preview image for an e-commerce gift hamper website.
You will be given reference images:
1. A reference hamper/container image showing the packaging style (basket weave, box type, tray, ribbon, color scheme): ${hamperRefNote}. Hamper name: "${hamper}". Packaging: "${box}". layout_type: "${layout}".
2. One or more individual product photos (jars/packs of dry fruits, nuts, or snacks) that the customer has actually selected and added to this hamper: ${productRefNote}
${productList}
3. (Optional) A gift card design reference with a handwritten-style message area. included = ${showCard}.

Your task: Generate ONE photorealistic image of the hamper from reference image 1, but populate/arrange it using ONLY the exact products shown in the product reference images — do not invent, substitute, or add any product not explicitly provided. Preserve the container's material, color, ribbon, and overall style exactly as shown in reference image 1. Match the lighting, camera angle, and background style of reference image 1 as closely as possible.

Arrangement for this container:
${arrangementInstructions(layout, box)}
Match each product's real packaging, label, lid, and contents from its reference photo.
${giftCardSection}

Do not add text overlays, watermarks, logos, or price information anywhere in the image. Output should look like a professional product photography shot suitable for an e-commerce preview, front-facing angle, soft studio lighting, plain neutral background matching reference image 1. Aspect ratio 1:1, at least 1024x1024.`;
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
