import React, { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { adminApi } from '@/lib/adminApi';

const FILTERS = [
  { id: 'new', label: 'Waiting to share' },
  { id: 'live', label: 'On the website' },
  { id: 'all', label: 'All' },
];

function when(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export function AdminFeedback() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('new');
  const [err, setErr] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    setErr('');
    return adminApi.subscribeFeedback(
      setRows,
      (e) => setErr(e?.message || 'Could not load feedback.'),
    );
  }, []);

  const shown = useMemo(() => {
    if (filter === 'live') return rows.filter((r) => r.published);
    if (filter === 'new') return rows.filter((r) => !r.published);
    return rows;
  }, [rows, filter]);

  const waiting = rows.filter((r) => !r.published).length;

  const toggle = async (row, published) => {
    setBusyId(row.id);
    setErr('');
    try {
      await adminApi.setFeedbackPublished(row.id, published);
    } catch (e) {
      setErr(e?.message || 'Could not update this review.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl md:text-[2.1rem] font-bold text-brand-900">Customer feedback</h1>
          <p className="text-sm text-ink-500 mt-1">
            New reviews stay private until you share them on the live homepage.
          </p>
        </div>
        <div className="text-sm text-ink-600">
          {waiting} waiting · {rows.length - waiting} on website
        </div>
      </div>

      {err && (
        <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{err}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-5 mb-4">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`px-3 py-1.5 rounded-full text-[13px] font-medium ${
              filter === item.id ? 'bg-brand-900 text-white' : 'bg-white border border-line text-brand-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-line bg-white overflow-hidden">
        {shown.map((row) => (
          <article key={row.id} className="px-4 py-4 border-b border-line last:border-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-brand-900">{row.name}</span>
                  <span className="flex items-center gap-0.5 text-[var(--sk-star)]">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={13} className={j < row.rating ? 'fill-current' : 'opacity-20'} />
                    ))}
                  </span>
                  <span className={`text-[10px] font-bold tracking-wide px-2 py-0.5 rounded ${
                    row.published ? 'bg-[#D9F0D2] text-[#2E7D32]' : 'bg-[#F3EBE1] text-brand-900'
                  }`}>
                    {row.published ? 'ON WEBSITE' : 'WAITING'}
                  </span>
                </div>
                <div className="text-[12px] text-ink-500 mt-1">
                  {when(row.createdAt)}
                  {row.email ? ` · ${row.email}` : ''}
                </div>
                <p className="text-sm text-ink-600 mt-2 leading-relaxed">“{row.text}”</p>
              </div>
              <button
                type="button"
                disabled={busyId === row.id}
                onClick={() => toggle(row, !row.published)}
                className={`shrink-0 px-3 py-2 rounded-full text-[13px] font-semibold ${
                  row.published
                    ? 'border border-line text-ink-600 hover:bg-cream-100'
                    : 'bg-brand-900 text-white hover:bg-brand-800'
                }`}
              >
                {busyId === row.id ? 'Saving…' : row.published ? 'Remove from website' : 'Share on website'}
              </button>
            </div>
          </article>
        ))}
        {!shown.length && (
          <div className="px-4 py-10 text-center text-ink-500 text-sm">
            {filter === 'new' ? 'No new reviews waiting. Fresh customer feedback will land here.' : 'No feedback in this list yet.'}
          </div>
        )}
      </div>
    </div>
  );
}
