import * as XLSX from 'xlsx';
import { defaultPack } from '@/lib/adminProductPatch';

export const PRODUCT_CATEGORIES = ['nuts', 'dry-fruits', 'seeds', 'dates', 'berries'];

const EXCEL_CATEGORY_MAP = {
  'Cashew (Kaju)': 'nuts',
  'Almonds (Badam)': 'nuts',
  'Mamra Almonds (Irani)': 'nuts',
  'Pistachio (Pista)': 'nuts',
  'Raisins (Kishmish & Munakka)': 'dry-fruits',
  'Figs (Anjeer)': 'dry-fruits',
  'Walnuts (Akhrot)': 'nuts',
  'Pine Nuts (Chilgoza)': 'nuts',
  'Exotic & Mixed Nuts': 'nuts',
  'Makhana': 'seeds',
  'Dates & Apricot': 'dates',
  'Seeds': 'seeds',
  'Cardamom (Elaichi)': 'seeds',
  'Mishri': 'dry-fruits',
  'Gaund / Gum': 'dry-fruits',
  'Murabba': 'dry-fruits',
  'Dried Fruits': 'dry-fruits',
  'Berries': 'berries',
  'Namkeen, Chips & Snacks': 'dry-fruits',
  'Mouth Fresheners': 'dry-fruits',
};

export function slugifyProductName(text) {
  const s = String(text || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
  return s || 'product';
}

export function productDocIdFromSlug(slug) {
  return `p_${String(slug || '').replace(/-/g, '_')}`.slice(0, 48);
}

function mapExcelCategory(excelCat, productName) {
  const name = String(productName || '').toLowerCase();
  if (/apricot|khubani/.test(name)) return 'dry-fruits';
  if (/date|medjoul|medjool/.test(name)) return 'dates';
  const mapped = EXCEL_CATEGORY_MAP[String(excelCat || '').trim()];
  if (mapped) return mapped;
  const slug = String(excelCat || '').toLowerCase().trim();
  if (PRODUCT_CATEGORIES.includes(slug)) return slug;
  return 'dry-fruits';
}

function cell(row, i) {
  if (!row || i >= row.length) return '';
  const v = row[i];
  if (v == null) return '';
  return String(v).trim();
}

function num(value) {
  if (value == null || value === '') return null;
  const n = Number(String(value).replace(/[₹,\s]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function headerKey(raw) {
  return String(raw || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function isMasterSheet(wb, matrix) {
  if (wb.SheetNames.some((n) => /product listings/i.test(n))) return true;
  const first = (matrix[0] || []).map((h) => headerKey(h)).join(' ');
  if (/price250|250g/.test(first) && /500/.test(first)) return true;
  const row4 = matrix[3] || [];
  const looksLikeHeader = (matrix[0] || []).some((h) => /^(id|slug|name)$/i.test(String(h || '').trim()));
  return !looksLikeHeader && Boolean(row4[2]);
}

function parseMasterMatrix(matrix) {
  const rows = [];
  const errors = [];
  matrix.slice(3).forEach((row, offset) => {
    const excelRow = offset + 4;
    const name = cell(row, 2);
    if (!name) return;
    const excelCategory = cell(row, 1);
    const p250 = num(row[9]);
    const p500 = num(row[10]);
    const p1kg = num(row[11]);
    if (p250 == null) {
      errors.push(`Row ${excelRow}: missing 250g price for "${name}"`);
      return;
    }
    const slug = slugifyProductName(name);
    rows.push({
      kind: 'master',
      excelRow,
      id: productDocIdFromSlug(slug),
      slug,
      name,
      category: mapExcelCategory(excelCategory, name),
      subcategory: excelCategory,
      tagline: cell(row, 4) || cell(row, 3),
      description: cell(row, 5),
      price: p250,
      prices: {
        '250g': p250,
        ...(p500 != null ? { '500g': p500 } : {}),
        ...(p1kg != null ? { '1kg': p1kg } : {}),
      },
      sku: '',
    });
  });
  return { kind: 'master', rows, errors };
}

function parseAdminMatrix(matrix) {
  const headerRow = matrix[0] || [];
  const keys = headerRow.map((h) => headerKey(h));
  const idx = (aliases) => {
    for (const alias of aliases) {
      const i = keys.indexOf(alias);
      if (i >= 0) return i;
    }
    return -1;
  };
  const col = {
    id: idx(['id', 'productid']),
    slug: idx(['slug']),
    name: idx(['name', 'product', 'productname']),
    category: idx(['category']),
    price: idx(['price', 'price250', '250gprice']),
    stock: idx(['stock', 'qty', 'quantity']),
    inStock: idx(['instock']),
    weight: idx(['weight', 'size', 'pack']),
    description: idx(['description', 'desc']),
  };
  if (col.name < 0 && col.id < 0 && col.slug < 0) {
    return { kind: 'admin', rows: [], errors: ['Could not find id, slug, or name column in the first row.'] };
  }
  const rows = [];
  const errors = [];
  matrix.slice(1).forEach((row, offset) => {
    const excelRow = offset + 2;
    const name = col.name >= 0 ? cell(row, col.name) : '';
    const slug = col.slug >= 0 ? slugifyProductName(cell(row, col.slug)) : slugifyProductName(name);
    const idRaw = col.id >= 0 ? cell(row, col.id) : '';
    const id = idRaw || (slug ? productDocIdFromSlug(slug) : '');
    if (!id && !name) return;
    if (!name && !id) {
      errors.push(`Row ${excelRow}: missing name and id`);
      return;
    }
    const price = col.price >= 0 ? num(row[col.price]) : null;
    let stock = col.stock >= 0 ? num(row[col.stock]) : null;
    const inStockRaw = col.inStock >= 0 ? cell(row, col.inStock).toLowerCase() : '';
    if (stock == null && inStockRaw) {
      if (['no', 'false', '0', 'out'].includes(inStockRaw)) stock = 0;
    }
    if (col.price >= 0 && cell(row, col.price) && price == null) {
      errors.push(`Row ${excelRow}: invalid price`);
      return;
    }
    if (stock != null && (stock < 0 || !Number.isFinite(stock))) {
      errors.push(`Row ${excelRow}: invalid stock`);
      return;
    }
    let category = col.category >= 0 ? cell(row, col.category).toLowerCase() : '';
    if (category && !PRODUCT_CATEGORIES.includes(category)) {
      category = mapExcelCategory(category, name);
    }
    rows.push({
      kind: 'admin',
      excelRow,
      id,
      slug: slug || id,
      name: name || id,
      category,
      description: col.description >= 0 ? cell(row, col.description) : '',
      price,
      stock: stock == null ? null : Math.round(stock),
      weight: col.weight >= 0 ? cell(row, col.weight) : '',
    });
  });
  return { kind: 'admin', rows, errors };
}

export function parseProductWorkbook(buffer) {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames.find((n) => /product listings/i.test(n)) || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
  return isMasterSheet(wb, matrix) ? parseMasterMatrix(matrix) : parseAdminMatrix(matrix);
}

function packOf(product) {
  return defaultPack(product);
}

export function buildProductExportRows(products) {
  return (products || []).map((p) => {
    const pack = packOf(p);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category || '',
      weight: pack.weight || '250g',
      price: pack.price ?? p.price ?? 0,
      stock: pack.stock ?? 0,
      inStock: (pack.stock ?? 0) > 0 ? 'yes' : 'no',
      description: p.description || '',
      image: (p.images && p.images[0]) || p.img || '',
    };
  });
}

export function downloadProductsExcel(products) {
  const rows = buildProductExportRows(products);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  XLSX.writeFile(wb, `sukhmal-products-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function diffImportedProducts(incoming, existing) {
  const byId = new Map((existing || []).map((p) => [p.id, p]));
  const bySlug = new Map((existing || []).map((p) => [p.slug, p]));
  const byName = new Map((existing || []).map((p) => [String(p.name || '').toLowerCase(), p]));
  const changes = [];
  incoming.forEach((row) => {
    const current = byId.get(row.id) || bySlug.get(row.slug) || byName.get(String(row.name || '').toLowerCase());
    if (!current) {
      changes.push({ action: 'create', id: row.id, name: row.name, fields: summarizeCreate(row), row });
      return;
    }
    const fields = [];
    const pack = packOf(current);
    if (row.name && row.name !== current.name) fields.push({ field: 'name', from: current.name, to: row.name });
    if (row.category && row.category !== current.category) fields.push({ field: 'category', from: current.category || '', to: row.category });
    if (row.description && row.description !== (current.description || '')) {
      fields.push({ field: 'description', from: (current.description || '').slice(0, 80), to: row.description.slice(0, 80) });
    }
    if (!row.prices) {
      if (row.price != null && Number(row.price) !== Number(pack.price)) {
        fields.push({ field: 'price (250g)', from: pack.price, to: row.price });
      }
      if (row.stock != null && Number(row.stock) !== Number(pack.stock)) {
        fields.push({ field: 'stock (250g)', from: pack.stock, to: row.stock });
      }
    }
    if (row.prices) {
      Object.entries(row.prices).forEach(([weight, next]) => {
        if (next == null) return;
        const currentV = (current.weightVariants || []).find((v) => v.weight === weight);
        if (!currentV || Number(next) !== Number(currentV.price)) {
          fields.push({ field: `price ${weight}`, from: currentV?.price ?? '', to: next });
        }
      });
    }
    if (fields.length) {
      changes.push({ action: 'update', id: current.id, name: current.name, fields, row: { ...row, id: current.id, slug: current.slug } });
    }
  });
  return changes;
}

function summarizeCreate(row) {
  const fields = [
    { field: 'name', from: '', to: row.name },
    { field: 'category', from: '', to: row.category || '' },
  ];
  if (row.prices) {
    Object.entries(row.prices).forEach(([weight, price]) => {
      if (price != null) fields.push({ field: `price ${weight}`, from: '', to: price });
    });
  } else if (row.price != null) {
    fields.push({ field: 'price (250g)', from: '', to: row.price });
  }
  if (row.stock != null) fields.push({ field: 'stock (250g)', from: '', to: row.stock });
  return fields;
}
