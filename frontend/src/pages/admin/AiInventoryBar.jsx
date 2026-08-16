import React, { useMemo, useRef, useState } from 'react';
import { Sparkles, Send, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/adminApi';

function formatVal(v) {
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (v == null || v === '') return '—';
  return String(v);
}

function parseEditedValue(field, raw) {
  if (field === 'inStock' || field === 'isActive' || field === 'isDeleted' || field === 'isBestseller') {
    if (raw === true || raw === 'true') return true;
    if (raw === false || raw === 'false') return false;
    return Boolean(raw);
  }
  if (field === 'stock' || field === 'price') {
    const n = Number(String(raw).replace(/[₹,\s]/g, ''));
    return Number.isFinite(n) ? n : raw;
  }
  return raw;
}

function isSame(before, after) {
  if (typeof before === 'boolean' || typeof after === 'boolean') return Boolean(before) === Boolean(after);
  if (typeof before === 'number' || typeof after === 'number') return Number(before) === Number(after);
  return String(before) === String(after);
}

export function AiInventoryBar({ onApplied }) {
  const [command, setCommand] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('Voice input is not supported in this browser');
      return;
    }
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.onresult = (e) => {
      const said = e.results[0][0].transcript;
      setCommand((c) => (c ? `${c} ${said}` : said));
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  const runPreview = async (e) => {
    e?.preventDefault();
    setError('');
    setPreview(null);
    setBusy(true);
    try {
      const data = await adminApi.previewInventory(command);
      const changes = data.changes || [];
      if (!changes.length) {
        setError('Gemini did not propose a product change. Try a clearer command, e.g. “roasted namkeen out of stock”.');
        return;
      }
      setPreview(data);
    } catch (err) {
      setPreview(null);
      setError(err.message || 'Preview failed');
    } finally {
      setBusy(false);
    }
  };

  const runnable = useMemo(
    () => (preview?.changes || []).filter((c) => {
      const before = c.currentValue ?? c.before;
      const after = c.newValue ?? c.after;
      return !isSame(before, after);
    }),
    [preview],
  );

  const editChange = (index, nextValue) => {
    setPreview((prev) => {
      if (!prev) return prev;
      const next = prev.changes.map((c, i) => {
        if (i !== index) return c;
        const before = c.currentValue ?? c.before;
        const after = parseEditedValue(c.field, nextValue);
        return {
          ...c,
          newValue: after,
          after,
          noop: isSame(before, after),
        };
      });
      return { ...prev, changes: next };
    });
  };

  const runApply = async () => {
    if (!preview?.previewId || !runnable.length) return;
    setBusy(true);
    setError('');
    try {
      const result = await adminApi.applyInventory(preview.previewId, preview.changes);
      const n = (result?.applied || runnable).length;
      toast.success(`${n} change${n === 1 ? '' : 's'} applied`);
      setPreview(null);
      setCommand('');
      onApplied?.();
    } catch (err) {
      setError(err.message || 'Apply failed. Proposed changes were not cleared — you can retry.');
    } finally {
      setBusy(false);
    }
  };

  const discard = () => {
    setPreview(null);
    setError('');
  };

  return (
    <section className="mt-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={16} className="text-[var(--sk-gold-600)]" />
        <h2 className="text-[12px] font-bold tracking-[0.16em] uppercase text-brand-900">AI Inventory Manager</h2>
      </div>
      <form onSubmit={runPreview} className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder='e.g. roasted namkeen all weights 250g 500g instock kar do aur price 399 se 599 kardo'
            className="sk-input !rounded-xl !py-3.5 pr-12 w-full bg-white"
          />
          <button
            type="button"
            onClick={listening ? () => recRef.current?.stop() : startVoice}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-ink-500 hover:text-brand-900"
            aria-label="Voice input"
          >
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        </div>
        <button type="submit" disabled={busy || !command.trim()} className="sk-btn-primary !rounded-xl !px-5 shrink-0">
          Preview <Send size={14} />
        </button>
      </form>
      {error && (
        <div role="alert" className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">
          {error}
        </div>
      )}
      {preview?.changes?.length > 0 && (
        <div className="mt-3 rounded-xl border border-line bg-white p-4">
          <div className="text-[12px] uppercase tracking-widest text-ink-500 mb-2">
            Proposed changes — nothing written yet
          </div>
          <ul className="space-y-1 text-sm">
            {preview.changes.map((c, i) => {
              const before = c.currentValue ?? c.before;
              const after = c.newValue ?? c.after;
              const same = isSame(before, after);
              const boolField = c.field === 'inStock' || c.field === 'isActive' || c.field === 'isDeleted' || c.field === 'isBestseller';
              return (
                <li key={`${c.productId}-${c.variant}-${c.field}-${i}`} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 border-b border-line last:border-0 py-2">
                  <div>
                    <span className="font-semibold">{c.field}</span>
                    {c.variant ? <span className="text-ink-500"> · {c.variant}</span> : null}
                    {c.productName ? <span> · {c.productName}</span> : null}
                  </div>
                  <div className="flex items-center gap-2 justify-end font-mono text-[13px]">
                    <span className="text-ink-500">{formatVal(before)} →</span>
                    {boolField ? (
                      <select
                        className="sk-input !py-1 !px-2 !rounded-md w-[7.5rem]"
                        value={String(after)}
                        onChange={(e) => editChange(i, e.target.value)}
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : (
                      <input
                        className="sk-input !py-1 !px-2 !rounded-md w-[7.5rem] text-right"
                        value={after ?? ''}
                        onChange={(e) => editChange(i, e.target.value)}
                      />
                    )}
                    {same ? <span className="text-ink-400">(no change)</span> : null}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={runApply}
              disabled={busy || runnable.length === 0}
              className="sk-btn-primary !py-2 !px-4 text-sm disabled:opacity-40"
            >
              Apply {runnable.length ? `(${runnable.length})` : ''}
            </button>
            <button type="button" onClick={discard} className="sk-btn-outline !py-2 !px-4 text-sm">Discard</button>
          </div>
          {runnable.length === 0 && (
            <p className="text-[12px] text-ink-500 mt-2">Every row already matches the live value, so Apply is disabled. Edit a value to enable it.</p>
          )}
        </div>
      )}
    </section>
  );
}
