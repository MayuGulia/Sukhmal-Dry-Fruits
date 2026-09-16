import React, { useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash/debounce';
import { Download, FileSpreadsheet, ImagePlus, Plus, Search, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { CATEGORIES } from '@/data/mockCatalog';
import { adminApi } from '@/lib/adminApi';
import { applyProductPackPatch, defaultPack } from '@/lib/adminProductPatch';
import {
  PRODUCT_CATEGORIES,
  diffImportedProducts,
  downloadProductsExcel,
  parseProductWorkbook,
} from '@/lib/adminProductExcel';
import { inr } from '@/lib/utils';

const CAT_OPTS = CATEGORIES.filter((c) => PRODUCT_CATEGORIES.includes(c.slug) || c.slug === 'gift-hampers');
const WEIGHT_OPTS = ['100g', '250g', '500g', '1kg'];
const SAVE_WAIT_MS = 400;

const EMPTY_NEW = {
  name: '',
  description: '',
  category: 'dry-fruits',
  weight: '250g',
  price: '',
  stock: '20',
  inStock: true,
  sku: '',
  files: [],
};

function FileThumb({ file, onRemove }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-line bg-cream-200 shrink-0">
      {src ? <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" /> : null}
      <button
        type="button"
        className="absolute top-1 right-1 bg-white/95 rounded-full p-0.5 shadow-sk-sm"
        onClick={onRemove}
        aria-label="Remove image"
      >
        <X size={12} />
      </button>
    </div>
  );
}

function mergeRow(product, draft) {
  return draft ? applyProductPackPatch(product, draft) : product;
}

export function AdminProductTable() {
  const [q, setQ] = useState('');
  const [list, setList] = useState([]);
  const [err, setErr] = useState('');
  const [source, setSource] = useState('firestore');
  const [seeding, setSeeding] = useState(false);
  const [drafts, setDrafts] = useState(() => new Map());
  const [savingIds, setSavingIds] = useState(() => new Set());
  const [uploadingId, setUploadingId] = useState('');
  const [importPreview, setImportPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [showAdd, setShowAdd] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newProduct, setNewProduct] = useState(EMPTY_NEW);

  const pendingRef = useRef(new Map());
  const flushersRef = useRef(new Map());
  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);
  const imageTargetRef = useRef('');
  const live = source === 'firestore';

  useEffect(() => adminApi.subscribeProducts(
    { activeOnly: false },
    (rows, meta) => {
      setList(rows);
      setSource(meta?.source || 'firestore');
    },
    (e) => setErr(e?.message || 'Could not load products.'),
  ), []);

  useEffect(() => () => {
    flushersRef.current.forEach((fn) => {
      try { fn.flush?.(); } catch {}
      fn.cancel?.();
    });
  }, []);

  const getFlusher = (id) => {
    if (!flushersRef.current.has(id)) {
      flushersRef.current.set(id, debounce(async () => {
        const patch = pendingRef.current.get(id);
        pendingRef.current.delete(id);
        if (!patch || !Object.keys(patch).length) return;
        setSavingIds((prev) => new Set(prev).add(id));
        try {
          await adminApi.patchProduct(id, patch);
          if (!pendingRef.current.has(id)) {
            setDrafts((prev) => {
              if (!prev.has(id)) return prev;
              const next = new Map(prev);
              next.delete(id);
              return next;
            });
          }
        } catch (error) {
          toast.error(error?.message || 'Could not save product.');
          setErr(error?.message || 'Could not save product.');
        } finally {
          setSavingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
      }, SAVE_WAIT_MS));
    }
    return flushersRef.current.get(id);
  };

  const queuePatch = (product, patch) => {
    if (!live) {
      toast.error('Publish the catalog to Firestore before editing.');
      return;
    }
    const id = product.id;
    setDrafts((prev) => {
      const next = new Map(prev);
      next.set(id, { ...(prev.get(id) || {}), ...patch });
      return next;
    });
    pendingRef.current.set(id, { ...(pendingRef.current.get(id) || {}), ...patch });
    getFlusher(id)();
  };

  const publishCatalog = async () => {
    setSeeding(true);
    setErr('');
    try {
      const result = await adminApi.seedCatalog();
      if (!result.existing) {
        toast.success(`Published ${result.wrote} products to Firestore.`);
      }
    } catch (error) {
      setErr(error?.message || 'Could not publish the catalog.');
    } finally {
      setSeeding(false);
    }
  };

  const openImagePicker = (id) => {
    if (!live) {
      toast.error('Publish the catalog to Firestore before replacing images.');
      return;
    }
    imageTargetRef.current = id;
    fileInputRef.current?.click();
  };

  const onImagePicked = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    const id = imageTargetRef.current;
    if (!files.length || !id) return;
    setUploadingId(id);
    setErr('');
    try {
      const images = await adminApi.uploadProductImages(id, files);
      setList((prev) => prev.map((p) => (p.id === id ? { ...p, images } : p)));
      toast.success(files.length === 1 ? 'Image uploaded.' : `${files.length} images uploaded.`);
    } catch (error) {
      toast.error(error?.message || 'Could not upload the image.');
      setErr(error?.message || 'Could not upload the image.');
    } finally {
      setUploadingId('');
    }
  };

  const addNewFiles = (files) => {
    const next = Array.from(files || []).filter((f) => /^image\/(jpeg|png|webp)$/i.test(f.type));
    if (!next.length) {
      toast.error('Use JPEG, PNG, or WebP images under 5 MB.');
      return;
    }
    setNewProduct((p) => ({ ...p, files: [...p.files, ...next].slice(0, 5) }));
  };

  const submitNewProduct = async (e) => {
    e.preventDefault();
    if (!live) {
      toast.error('Publish the catalog to Firestore before adding products.');
      return;
    }
    setAdding(true);
    setErr('');
    try {
      const created = await adminApi.createProduct({
        ...newProduct,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
      });
      toast.success(`Saved. It now shows on the shop in ${created.category || 'the catalog'}.`);
      setNewProduct(EMPTY_NEW);
    } catch (error) {
      toast.error(error?.message || 'Could not add product.');
      setErr(error?.message || 'Could not add product.');
    } finally {
      setAdding(false);
    }
  };

  const onImportPicked = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!live) {
      toast.error('Publish the catalog to Firestore before importing.');
      return;
    }
    setErr('');
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseProductWorkbook(buffer);
      const changes = diffImportedProducts(parsed.rows, list);
      if (!changes.length && !parsed.errors.length) {
        toast.message('No product changes found in that file.');
        return;
      }
      setImportPreview({
        fileName: file.name,
        kind: parsed.kind,
        errors: parsed.errors,
        changes,
      });
    } catch (error) {
      toast.error(error?.message || 'Could not read that spreadsheet.');
      setErr(error?.message || 'Could not read that spreadsheet.');
    }
  };

  const confirmImport = async () => {
    if (!importPreview?.changes?.length) {
      setImportPreview(null);
      return;
    }
    setImporting(true);
    setErr('');
    try {
      const result = await adminApi.commitProductImport(importPreview.changes);
      toast.success(`Imported ${result.wrote} product${result.wrote === 1 ? '' : 's'}.`);
      setImportPreview(null);
    } catch (error) {
      toast.error(error?.message || 'Import failed. Nothing further was written.');
      setErr(error?.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return list
      .map((p) => mergeRow(p, drafts.get(p.id)))
      .filter((p) => {
        if (!needle) return true;
        return [p.name, p.slug, p.id, p.category].some((v) => String(v || '').toLowerCase().includes(needle));
      });
  }, [list, drafts, q]);

  const cellClass = 'sk-input !py-1.5 !px-2 !text-sm !rounded-lg min-w-0';

  return (
    <div className="min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4 min-w-0">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Products</h1>
          <p className="text-sm text-ink-500 mt-1">
            {live
              ? `${list.length} products in Firestore — edits save after ${SAVE_WAIT_MS}ms and update the shop`
              : `${list.length} products from the site catalog — publish them to Firestore to edit live stock.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="sk-btn-outline !py-2 !px-3 text-sm" onClick={() => setShowAdd((v) => !v)}>
            <Plus size={14} /> {showAdd ? 'Hide form' : 'Add product'}
          </button>
          <button type="button" className="sk-btn-outline !py-2 !px-3 text-sm" onClick={() => downloadProductsExcel(list)} disabled={!list.length}>
            <Download size={14} /> Export
          </button>
          <button type="button" className="sk-btn-outline !py-2 !px-3 text-sm" onClick={() => importInputRef.current?.click()} disabled={!live}>
            <Upload size={14} /> Import
          </button>
          <button type="button" className="sk-btn-primary !py-2 !px-3 text-sm" onClick={publishCatalog} disabled={seeding}>
            {seeding ? 'Publishing…' : live ? 'Sync catalog' : 'Publish catalog'}
          </button>
        </div>
      </div>

      {err && <p className="mb-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3 break-words">{err}</p>}

      {showAdd && (
        <form onSubmit={submitNewProduct} className="mb-5 rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-sk-sm min-w-0 overflow-hidden">
          <h2 className="font-display text-xl sm:text-2xl font-bold">Add product</h2>
          <p className="text-sm text-ink-500 mt-1 mb-4">
            Saves to Firestore and shows immediately on category pages, search, and the product page.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0">
            <label className="block min-w-0">
              <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">Name</span>
              <input
                className="sk-input mt-1.5 max-w-full"
                required
                value={newProduct.name}
                onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Kaju 320 N"
              />
            </label>
            <label className="block min-w-0">
              <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">SKU</span>
              <input
                className="sk-input mt-1.5 max-w-full"
                value={newProduct.sku}
                onChange={(e) => setNewProduct((p) => ({ ...p, sku: e.target.value }))}
                placeholder="Optional — generated from name"
              />
            </label>
            <label className="block min-w-0">
              <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">Category</span>
              <select
                className="sk-input mt-1.5 max-w-full"
                value={newProduct.category}
                onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
              >
                {CAT_OPTS.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="block min-w-0">
              <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">Weight</span>
              <select
                className="sk-input mt-1.5 max-w-full"
                value={WEIGHT_OPTS.includes(newProduct.weight) ? newProduct.weight : '__custom'}
                onChange={(e) => setNewProduct((p) => ({ ...p, weight: e.target.value === '__custom' ? '' : e.target.value }))}
              >
                {WEIGHT_OPTS.map((w) => <option key={w} value={w}>{w}</option>)}
                <option value="__custom">Custom</option>
              </select>
              {!WEIGHT_OPTS.includes(newProduct.weight) && (
                <input
                  className="sk-input mt-2 max-w-full"
                  placeholder="e.g. 750g"
                  value={newProduct.weight}
                  onChange={(e) => setNewProduct((p) => ({ ...p, weight: e.target.value }))}
                />
              )}
            </label>
            <label className="block min-w-0">
              <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">Price (₹)</span>
              <input
                className="sk-input mt-1.5 max-w-full"
                type="number"
                min="0"
                step="1"
                required
                value={newProduct.price}
                onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))}
              />
            </label>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 min-w-0">
              <label className="block min-w-0">
                <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">Stock qty</span>
                <input
                  className="sk-input mt-1.5 max-w-full"
                  type="number"
                  min="0"
                  step="1"
                  value={newProduct.stock}
                  disabled={!newProduct.inStock}
                  onChange={(e) => setNewProduct((p) => ({ ...p, stock: e.target.value }))}
                />
              </label>
              <label className="block min-w-0">
                <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">Availability</span>
                <select
                  className="sk-input mt-1.5 max-w-full"
                  value={newProduct.inStock ? 'in' : 'out'}
                  onChange={(e) => {
                    const inStock = e.target.value === 'in';
                    setNewProduct((p) => ({ ...p, inStock, stock: inStock ? (p.stock === '0' ? '20' : p.stock) : '0' }));
                  }}
                >
                  <option value="in">In stock</option>
                  <option value="out">Out of stock</option>
                </select>
              </label>
            </div>
            <label className="block min-w-0 sm:col-span-2">
              <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">Description</span>
              <textarea
                className="sk-input mt-1.5 min-h-[96px] max-w-full"
                rows={3}
                value={newProduct.description}
                onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))}
                placeholder="Short product description shown on the product page"
              />
            </label>
            <div className="sm:col-span-2 min-w-0">
              <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">Images</span>
              <div className="mt-1.5 flex flex-wrap gap-2 items-center">
                {newProduct.files.map((file, i) => (
                  <FileThumb
                    key={`${file.name}-${file.lastModified}-${i}`}
                    file={file}
                    onRemove={() => setNewProduct((p) => ({ ...p, files: p.files.filter((_, idx) => idx !== i) }))}
                  />
                ))}
              </div>
              {newProduct.files.length < 5 && (
                <label className="mt-2 flex w-full min-h-[88px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-cream-100 px-3 py-4 text-sm text-ink-600 hover:bg-cream-200">
                  <ImagePlus size={18} />
                  <span>Add images (up to 5)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      addNewFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
              <p className="text-[11px] text-ink-500 mt-1.5">JPEG, PNG, or WebP · under 5 MB each</p>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-line flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button type="submit" className="sk-btn-primary w-full sm:w-auto text-sm !px-6" disabled={adding || !live}>
              {adding ? 'Adding…' : 'Add to catalog'}
            </button>
          </div>
        </form>
      )}

      <div className="relative max-w-sm mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, slug, or id…" className="sk-input has-leading-icon !py-2" />
      </div>

      <p className="text-[12px] text-ink-500 mb-3 flex items-center gap-1.5">
        <FileSpreadsheet size={13} />
        Import accepts Product_Listings_Master.xlsx (full catalog columns) or the simpler admin template (id/slug, name, price, stock, category).
      </p>

      <div className="rounded-xl border border-line bg-white overflow-auto max-h-[70vh]">
        <table className="w-full text-sm min-w-[1240px] border-collapse">
          <thead className="sticky top-0 bg-cream-200 z-10">
            <tr className="text-left text-[11px] uppercase tracking-wide text-ink-500">
              <th className="px-3 py-2 font-semibold w-[140px]">Images</th>
              <th className="px-3 py-2 font-semibold min-w-[180px]">Name</th>
              <th className="px-3 py-2 font-semibold w-[140px]">Category</th>
              <th className="px-3 py-2 font-semibold w-[90px]">Weight</th>
              <th className="px-3 py-2 font-semibold w-[110px]">Price</th>
              <th className="px-3 py-2 font-semibold w-[90px]">Stock</th>
              <th className="px-3 py-2 font-semibold w-[140px]">Availability</th>
              <th className="px-3 py-2 font-semibold min-w-[220px]">Description</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const pack = defaultPack(p);
              const ok = (pack.stock ?? 0) > 0;
              const busy = savingIds.has(p.id) || uploadingId === p.id;
              return (
                <tr key={p.id} className="border-t border-line align-top">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {(p.images?.length ? p.images : [p.img]).filter(Boolean).slice(0, 3).map((src) => (
                        <button
                          key={src}
                          type="button"
                          onClick={() => openImagePicker(p.id)}
                          disabled={!live || uploadingId === p.id}
                          className="relative w-11 h-11 rounded-lg overflow-hidden border border-line bg-cream-200 shrink-0"
                          title="Add or replace images"
                        >
                          <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                          {uploadingId === p.id && (
                            <span className="absolute inset-0 bg-black/40 text-white text-[10px] grid place-items-center">…</span>
                          )}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => openImagePicker(p.id)}
                        disabled={!live || uploadingId === p.id}
                        className="w-11 h-11 rounded-lg border border-dashed border-line-strong text-ink-400 grid place-items-center shrink-0"
                        title="Add images"
                      >
                        <ImagePlus size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className={cellClass}
                      value={p.name || ''}
                      disabled={!live}
                      onChange={(e) => queuePatch(p, { name: e.target.value })}
                    />
                    <div className="mt-1 text-[10px] text-ink-500 font-mono flex items-center gap-2">
                      <span>{p.id}</span>
                      {busy && <span className="text-brand-900">Saving…</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className={cellClass}
                      value={CAT_OPTS.some((c) => c.slug === p.category) ? p.category : (p.category || 'dry-fruits')}
                      disabled={!live}
                      onChange={(e) => queuePatch(p, { category: e.target.value })}
                    >
                      {CAT_OPTS.map((c) => (
                        <option key={c.slug} value={c.slug}>{c.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className={cellClass}
                      value={pack.weight || '250g'}
                      disabled={!live}
                      onChange={(e) => queuePatch(p, { weight: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className={cellClass}
                      type="number"
                      min="0"
                      step="1"
                      value={pack.price ?? p.price ?? ''}
                      disabled={!live}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (e.target.value === '' || !Number.isFinite(n) || n < 0) {
                          setDrafts((prev) => {
                            const next = new Map(prev);
                            next.set(p.id, { ...(prev.get(p.id) || {}), price: e.target.value });
                            return next;
                          });
                          return;
                        }
                        queuePatch(p, { price: n });
                      }}
                    />
                    <div className="text-[10px] text-ink-500 mt-0.5">{inr(pack.price ?? p.price)}</div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className={cellClass}
                      type="number"
                      min="0"
                      step="1"
                      value={pack.stock ?? 0}
                      disabled={!live}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (e.target.value === '' || !Number.isFinite(n) || n < 0) return;
                        queuePatch(p, { stock: Math.round(n) });
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className={cellClass}
                      value={ok ? 'in' : 'out'}
                      disabled={!live}
                      onChange={(e) => queuePatch(p, { inStock: e.target.value === 'in' })}
                    >
                      <option value="in">In stock</option>
                      <option value="out">Out of stock</option>
                    </select>
                    <span className={`mt-1 inline-flex text-[10px] font-bold px-2 py-0.5 rounded ${ok ? 'bg-[#D9F0D2] text-[#2E7D32]' : 'bg-red-100 text-red-600'}`}>
                      {ok ? 'IN STOCK' : 'OUT OF STOCK'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <textarea
                      className={`${cellClass} min-h-[52px] resize-y`}
                      rows={2}
                      value={p.description || ''}
                      disabled={!live}
                      onChange={(e) => queuePatch(p, { description: e.target.value })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="px-4 py-8 text-center text-ink-500 text-sm">
            No products to show. Publish the catalog to Firestore, then refresh.
          </div>
        )}
      </div>

      <p className="mt-3 text-[12px] text-ink-500">
        Table rows edit name, images, category, weight, price, stock, availability, and description. Weight/price/stock apply to the first pack (250g when present).
      </p>

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={onImagePicked} />
      <input ref={importInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onImportPicked} />

      {importPreview && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl border border-line max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-line">
              <h2 className="font-display text-xl font-bold">Confirm product import</h2>
              <p className="text-sm text-ink-500 mt-1">
                {importPreview.fileName} · {importPreview.kind === 'master' ? 'Product_Listings_Master format' : 'admin template'} · {importPreview.changes.length} change{importPreview.changes.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="px-5 py-3 overflow-auto text-sm space-y-3">
              {importPreview.errors?.length > 0 && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-red-700 text-[13px]">
                  {importPreview.errors.slice(0, 8).map((msg) => <div key={msg}>{msg}</div>)}
                  {importPreview.errors.length > 8 && <div>+{importPreview.errors.length - 8} more</div>}
                </div>
              )}
              {!importPreview.changes.length && (
                <p className="text-ink-500">No matching creates or updates to write.</p>
              )}
              {importPreview.changes.map((c) => (
                <div key={`${c.action}-${c.id}`} className="rounded-xl border border-line px-3 py-2">
                  <div className="font-semibold">
                    <span className={`mr-2 text-[10px] uppercase tracking-wide ${c.action === 'create' ? 'text-green-700' : 'text-brand-900'}`}>{c.action}</span>
                    {c.name}
                    <span className="ml-2 font-mono text-[11px] font-normal text-ink-500">{c.id}</span>
                  </div>
                  <ul className="mt-1 text-[12px] text-ink-500 space-y-0.5">
                    {(c.fields || []).map((f) => (
                      <li key={f.field}>
                        {f.field}: {String(f.from ?? '—')} → {String(f.to ?? '—')}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-line flex justify-end gap-2">
              <button type="button" className="sk-btn-outline !py-2 !px-3 text-sm" onClick={() => setImportPreview(null)} disabled={importing}>
                Cancel
              </button>
              <button
                type="button"
                className="sk-btn-primary !py-2 !px-3 text-sm"
                onClick={confirmImport}
                disabled={importing || !importPreview.changes.length}
              >
                {importing ? 'Writing…' : `Confirm ${importPreview.changes.length} change${importPreview.changes.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
