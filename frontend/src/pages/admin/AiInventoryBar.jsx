import React, { useRef, useState } from 'react';
import { Sparkles, Send, Mic, MicOff } from 'lucide-react';
import { adminApi } from '@/lib/adminApi';

function formatVal(v) {
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (v == null || v === '') return '—';
  return String(v);
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

  const runnable = (preview?.changes || []).filter((c) => {
    const before = c.currentValue ?? c.before;
    const after = c.newValue ?? c.after;
    return !c.noop && before !== after && String(before) !== String(after);
  });

  const runApply = async () => {
    if (!preview?.previewId || !runnable.length) return;
    setBusy(true);
    setError('');
    try {
      await adminApi.applyInventory(preview.previewId);
      setPreview(null);
      setCommand('');
      onApplied?.();
    } catch (err) {
      setError(err.message || 'Apply failed');
    } finally {
      setBusy(false);
    }
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
            placeholder="e.g. roasted namkeen out of stock"
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
      {preview?.changes?.length > 0 && !error && (
        <div className="mt-3 rounded-xl border border-line bg-white p-4">
          <div className="text-[12px] uppercase tracking-widest text-ink-500 mb-2">Proposed changes — nothing written yet</div>
          <ul className="space-y-1.5 text-sm">
            {preview.changes.map((c, i) => {
              const before = c.currentValue ?? c.before;
              const after = c.newValue ?? c.after;
              const same = c.noop || before === after || String(before) === String(after);
              return (
                <li key={i} className="flex justify-between gap-3 border-b border-line last:border-0 py-1.5">
                  <span>
                    <span className="font-semibold">{c.field || c.type}</span>
                    {c.productName ? ` · ${c.productName}` : ''}
                  </span>
                  <span className={`shrink-0 font-mono ${same ? 'text-ink-400' : 'text-brand-900'}`}>
                    {formatVal(before)} → {formatVal(after)}
                    {same ? ' (no change)' : ''}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex gap-2">
            {runnable.length > 0 && (
              <button type="button" onClick={runApply} disabled={busy} className="sk-btn-primary !py-2 !px-4 text-sm">Apply</button>
            )}
            <button type="button" onClick={() => setPreview(null)} className="sk-btn-outline !py-2 !px-4 text-sm">Discard</button>
          </div>
          {runnable.length === 0 && (
            <p className="text-[12px] text-ink-500 mt-2">Current value already matches the proposed value, so Apply is disabled.</p>
          )}
        </div>
      )}
    </section>
  );
}
