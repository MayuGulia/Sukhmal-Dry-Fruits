export function defaultPackIndex(product) {
  const vs = Array.isArray(product?.weightVariants) ? product.weightVariants : [];
  const i = vs.findIndex((v) => /250/i.test(String(v.weight || v.w || '')));
  return i >= 0 ? i : 0;
}

export function defaultPack(product) {
  const vs = Array.isArray(product?.weightVariants) ? product.weightVariants : [];
  if (!vs.length) {
    return { weight: '250g', price: Number(product?.price) || 0, stock: 20 };
  }
  return vs[defaultPackIndex(product)] || vs[0];
}

function syncVariantMirrors(product) {
  const weightVariants = (product.weightVariants || []).map((v) => ({
    weight: v.weight || v.w,
    price: Number(v.price) || 0,
    stock: typeof v.stock === 'number' ? v.stock : 20,
    sku: v.sku,
  }));
  const pack = weightVariants[defaultPackIndex({ weightVariants })] || weightVariants[0];
  return {
    ...product,
    weightVariants,
    variants: weightVariants.map((v) => ({ w: v.weight, price: v.price, stock: v.stock })),
    price: Number(pack?.price) || Number(product.price) || 0,
  };
}

/** Patch name/category/description and the 250g pack (price, stock, weight, inStock). */
export function applyProductPackPatch(product, patch = {}) {
  let next = {
    ...product,
    weightVariants: Array.isArray(product?.weightVariants)
      ? product.weightVariants.map((v) => ({ ...v }))
      : [],
  };
  if (patch.name != null) next.name = String(patch.name);
  if (patch.category != null) next.category = String(patch.category);
  if (patch.description != null) next.description = String(patch.description);
  if (patch.subcategory != null) next.subcategory = String(patch.subcategory);
  if (patch.tagline != null) next.tagline = String(patch.tagline);

  const packTouched = ['price', 'stock', 'weight', 'inStock'].some((k) => patch[k] !== undefined);
  if (packTouched) {
    let variants = next.weightVariants;
    if (!variants.length) {
      variants = [{ weight: '250g', price: Number(next.price) || 0, stock: 20, sku: `${next.id || 'p'}-250g` }];
    }
    const idx = defaultPackIndex({ weightVariants: variants });
    const current = { ...variants[idx] };
    if (patch.weight != null && String(patch.weight).trim()) current.weight = String(patch.weight).trim();
    if (patch.price != null && patch.price !== '') {
      const n = Number(patch.price);
      if (Number.isFinite(n)) current.price = n;
    }
    if (patch.stock != null && patch.stock !== '') {
      const n = Number(patch.stock);
      if (Number.isFinite(n)) current.stock = Math.max(0, Math.round(n));
    }
    if (patch.inStock === false) current.stock = 0;
    if (patch.inStock === true && (current.stock || 0) <= 0) current.stock = 20;
    variants[idx] = current;
    next.weightVariants = variants;
  }

  if (patch.prices && typeof patch.prices === 'object') {
    const variants = next.weightVariants.length
      ? next.weightVariants
      : [{ weight: '250g', price: Number(next.price) || 0, stock: 20 }];
    Object.entries(patch.prices).forEach(([weight, price]) => {
      if (price == null || price === '') return;
      const n = Number(price);
      if (!Number.isFinite(n)) return;
      const i = variants.findIndex((v) => v.weight === weight);
      if (i >= 0) variants[i] = { ...variants[i], price: n };
      else variants.push({ weight, price: n, stock: 20, sku: `${next.id || 'p'}-${weight}` });
    });
    next.weightVariants = variants;
  }

  return syncVariantMirrors(next);
}

export function productFromImportRow(row, existing) {
  if (!existing) {
    return applyProductPackPatch({
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category || 'dry-fruits',
      subcategory: row.subcategory || '',
      tagline: row.tagline || '',
      description: row.description || '',
      price: Number(row.price) || 0,
      images: row.slug ? [1, 2, 3, 4, 5].map((n) => `/products/${row.slug}-${n}.jpg`) : [],
      weightVariants: [],
      isActive: true,
      isDeleted: false,
      sku: row.sku || row.id,
    }, {
      price: row.price,
      stock: row.stock ?? 20,
      weight: row.weight || '250g',
      prices: row.prices,
      name: row.name,
      category: row.category || 'dry-fruits',
      description: row.description || '',
      subcategory: row.subcategory,
      tagline: row.tagline,
    });
  }
  const patch = {};
  if (row.name) patch.name = row.name;
  if (row.category) patch.category = row.category;
  if (row.subcategory) patch.subcategory = row.subcategory;
  if (row.tagline) patch.tagline = row.tagline;
  if (row.description) patch.description = row.description;
  if (row.price != null) patch.price = row.price;
  if (row.stock != null) patch.stock = row.stock;
  if (row.weight) patch.weight = row.weight;
  if (row.prices) patch.prices = row.prices;
  return applyProductPackPatch(existing, patch);
}
