import React, { useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash/debounce';
import { Download, FileSpreadsheet, Plus, Search, Upload } from 'lucide-react';
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

const CAT_OPTS = CATEGORIES.filter((c) => PRODUCT_CATEGORIES.includes(c.slug));
const SAVE_WAIT_MS = 400;

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
    const file = e.target.files?.[0];
    e.target.value = '';
    const id = imageTargetRef.current;
    if (!file || !id) return;
    setUploadingId(id);
    setErr('');
    try {
      const url = await adminApi.uploadProductImage(id, file);
      setList((prev) => prev.map((p) => (p.id === id ? { ...p, images: [url, ...(p.images || []).slice(1)] } : p)));
      toast.success('Image uploaded.');
    } catch (error) {
      toast.error(error?.message || 'Could not upload the image.');
      setErr(error?.message || 'Could not upload the image.');
    } finally {
      setUploadingId('');
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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Products</h1>
          <p className="text-sm text-ink-500 mt-1">
            {live
              ? `${list.length} products in Firestore — edits save after ${SAVE_WAIT_MS}ms`
              : `${list.length} products from the site catalog — publish them to Firestore to edit live stock.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="sk-btn-outline !py-2 !px-3 text-sm" onClick={() => downloadProductsExcel(list)} disabled={!list.length}>
            <Download size={14} /> Export
          </button>
          <button type="button" className="sk-btn-outline !py-2 !px-3 text-sm" onClick={() => importInputRef.current?.click()} disabled={!live}>
            <Upload size={14} /> Import Excel
          </button>
          <button type="button" className="sk-btn-primary text-sm" onClick={publishCatalog} disabled={seeding}>
            <Plus size={14} /> {seeding ? 'Publishing…' : live ? 'Sync catalog' : 'Publish catalog to Firestore'}
          </button>
        </div>
      </div>

      {err && <p className="mb-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{err}</p>}

      <div className="relative max-w-sm mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, slug, or id…" className="sk-input has-leading-icon !py-2" />
      </div>

      <p className="text-[12px] text-ink-500 mb-3 flex items-center gap-1.5">
        <FileSpreadsheet size={13} />
        Import accepts Product_Listings_Master.xlsx (full catalog columns) or the simpler admin template (id/slug, name, price, stock, category).
      </p>

      <div className="rounded-xl border border-line bg-white overflow-auto max-h-[70vh]">
        <table className="w-full text-sm min-w-[1080px] border-collapse">
          <thead className="sticky top-0 bg-cream-200 z-10">
            <tr className="text-left text-[11px] uppercase tracking-wide text-ink-500">
              <th className="px-3 py-2 font-semibold w-[72px]">Image</th>
              <th className="px-3 py-2 font-semibold min-w-[180px]">Name</th>
              <th className="px-3 py-2 font-semibold w-[140px]">Category</th>
              <th className="px-3 py-2 font-semibold w-[90px]">Weight</th>
              <th className="px-3 py-2 font-semibold w-[110px]">Price</th>
              <th className="px-3 py-2 font-semibold w-[90px]">Stock</th>
              <th className="px-3 py-2 font-semibold w-[110px]">In stock</th>
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
                    <button
                      type="button"
                      onClick={() => openImagePicker(p.id)}
                      disabled={!live || uploadingId === p.id}
                      className="relative w-12 h-12 rounded-lg overflow-hidden border border-line bg-cream-200 block"
                      title="Replace image"
                    >
                      <img src={p.images?.[0] || p.img} alt="" className="w-full h-full object-cover" />
                      {uploadingId === p.id && (
                        <span className="absolute inset-0 bg-black/40 text-white text-[10px] grid place-items-center">…</span>
                      )}
                    </button>
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
                      value={PRODUCT_CATEGORIES.includes(p.category) ? p.category : (p.category || 'dry-fruits')}
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
                    <label className="inline-flex items-center gap-2 text-[12px]">
                      <input
                        type="checkbox"
                        checked={(pack.stock ?? 0) > 0}
                        disabled={!live}
                        onChange={(e) => queuePatch(p, { inStock: e.target.checked })}
                      />
                      <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded ${ok ? 'bg-[#D9F0D2] text-[#2E7D32]' : 'bg-red-100 text-red-600'}`}>
                        {ok ? 'IN STOCK' : 'OUT'}
                      </span>
                    </label>
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
        This table edits the <strong>250g pack</strong> only (first variant matching 250g, otherwise the first pack).
        500g / 1kg variant-level stock and price editing is Phase 2 — not in this build.
      </p>

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onImagePicked} />
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
