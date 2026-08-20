function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = String(src || '').trim();
  });
}

function drawContain(ctx, img, canvasSize) {
  const scale = Math.min(canvasSize / img.width, canvasSize / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = (canvasSize - dw) / 2;
  const dy = (canvasSize - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
  return { dx, dy, dw, dh };
}

function sampleRgb(ctx, x, y) {
  const px = ctx.getImageData(Math.max(0, Math.floor(x)), Math.max(0, Math.floor(y)), 1, 1).data;
  return [px[0], px[1], px[2]];
}

function fillBowl(ctx, cx, cy, rx, ry, rgb) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  ctx.fill();
  ctx.restore();
}

function drawPack(ctx, img, x, y, size) {
  const radius = Math.min(18, size * 0.12);
  ctx.save();
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, size, size, radius);
  } else {
    ctx.rect(x, y, size, size);
  }
  ctx.clip();
  ctx.fillStyle = '#F6EFE4';
  ctx.fill();
  const scale = Math.max(size / img.width, size / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (size - dw) / 2, y + (size - dh) / 2, dw, dh);
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, size, size, radius);
  } else {
    ctx.rect(x, y, size, size);
  }
  ctx.strokeStyle = 'rgba(60, 36, 21, 0.18)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function packLayout(count, cx, cy, bowlR) {
  const n = Math.max(1, count);
  const size = Math.min(bowlR * (n === 1 ? 1.15 : n === 2 ? 0.95 : 0.82), 280);
  if (n === 1) return [{ x: cx - size / 2, y: cy - size / 2, size }];
  const radius = bowlR * (n <= 3 ? 0.38 : 0.42);
  return Array.from({ length: n }, (_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return {
      x: cx + Math.cos(angle) * radius - size / 2,
      y: cy + Math.sin(angle) * radius * 0.72 - size / 2,
      size,
    };
  });
}

/**
 * Builds the preview from the selected hamper photo + selected product photos.
 * Does not call Gemini — the hamper stays the original catalog image.
 */
export async function composeHamperPreview(payload) {
  const hamperSrc = String(payload?.hamperImage || payload?.hamperImages?.[0] || '').split('?')[0];
  const productSrcs = (Array.isArray(payload?.productSelections) ? payload.productSelections : payload?.products || [])
    .map((item) => {
      if (typeof item === 'string') return item;
      return String(item.imageUrl || item.img || item.images?.[0] || '').split('?')[0];
    })
    .filter((src) => src.startsWith('/'));

  if (!hamperSrc) throw new Error('Choose a hamper first');
  if (!productSrcs.length) throw new Error('Add products first');

  const hamper = await loadImage(hamperSrc);
  const products = await Promise.all(productSrcs.slice(0, 6).map((src) => loadImage(src)));

  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#F3EBE0';
  ctx.fillRect(0, 0, size, size);

  const box = drawContain(ctx, hamper, size);
  const cx = box.dx + box.dw * 0.5;
  const cy = box.dy + box.dh * 0.5;
  const bowlRx = box.dw * 0.28;
  const bowlRy = box.dh * 0.24;
  const bowlRgb = sampleRgb(ctx, cx, cy + bowlRy * 0.15);
  fillBowl(ctx, cx, cy + bowlRy * 0.08, bowlRx, bowlRy, bowlRgb);

  const slots = packLayout(products.length, cx, cy + bowlRy * 0.02, Math.min(bowlRx, bowlRy) * 1.35);
  products.forEach((img, i) => {
    const slot = slots[i];
    if (slot) drawPack(ctx, img, slot.x, slot.y, slot.size);
  });

  return canvas.toDataURL('image/jpeg', 0.92);
}
