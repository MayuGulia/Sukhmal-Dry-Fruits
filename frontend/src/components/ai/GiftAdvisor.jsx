import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Send, Sparkles, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { compactInventoryCatalog, getLiveProducts } from '@/lib/commerceStore';
import { aiApi } from '@/lib/api';
import { inr } from '@/lib/utils';

import { STORE_WHATSAPP } from '@/data/storeInfo';

const WA = process.env.REACT_APP_WHATSAPP_NUMBER || STORE_WHATSAPP;
const SESSION_KEY = 'sk_gift_session';
const MAX_MSGS = 15;
export const OPEN_GIFT_ADVISOR = 'sk-open-gift-advisor';

export function openGiftAdvisor() {
  window.dispatchEvent(new CustomEvent(OPEN_GIFT_ADVISOR));
}

function sessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `cs_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'cs_anon';
  }
}

export default function GiftAdvisor() {
  const { add } = useCart();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi — I’m Sukhmal’s Gift Advisor. What’s the occasion, and roughly what budget did you have in mind?' },
  ]);
  const countRef = useRef(0);
  const scroller = useRef(null);
  const inputRef = useRef(null);

  const show = () => setOpen(true);
  const hide = () => setOpen(false);

  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener(OPEN_GIFT_ADVISOR, openChat);
    return () => window.removeEventListener(OPEN_GIFT_ADVISOR, openChat);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') hide(); };
    document.addEventListener('keydown', onKey);
    const focus = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(focus);
    };
  }, [open]);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages, busy, open]);

  const send = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    if (countRef.current >= MAX_MSGS) {
      setMessages((m) => [...m, { role: 'assistant', text: `You’ve reached today’s chat limit. WhatsApp us instead: https://wa.me/${WA}` }]);
      return;
    }
    countRef.current += 1;
    setInput('');
    const history = [...messages, { role: 'user', text }].slice(-12);
    setMessages(history);
    setBusy(true);
    try {
      const catalog = compactInventoryCatalog(getLiveProducts({ activeOnly: true }));
      const r = await aiApi.post('/ai-chat', { sessionId: sessionId(), messages: history, catalog });
      const data = r.data;
      if (!data?.text) throw new Error(data?.message || 'Gift Advisor returned an empty reply');
      setMessages((m) => [...m, { role: 'assistant', text: data.text, products: data.products || [] }]);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Gift Advisor is unavailable right now.';
      setMessages((m) => [...m, { role: 'assistant', text: msg }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative z-[1] flex flex-col items-start gap-3">
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gift-advisor-title"
          className="w-[min(360px,calc(100vw-2rem))] h-[min(520px,calc(100vh-11rem))] flex flex-col rounded-2xl bg-white border border-line shadow-sk-lg overflow-hidden"
        >
          <div className="flex items-center justify-between px-3.5 py-3 bg-[var(--sk-espresso)] text-white shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="h-8 w-8 rounded-full bg-gold-300/15 ring-1 ring-[#C5A059]/70 grid place-items-center shrink-0">
                <Gift size={16} className="text-gold-300" />
              </span>
              <div className="min-w-0">
                <h2 id="gift-advisor-title" className="font-display font-bold leading-tight text-[15px]">AI Gift Advisor</h2>
                <p className="text-[11px] text-cream-200/80 font-normal truncate">Occasion · recipient · budget</p>
              </div>
            </div>
            <button type="button" onClick={hide} aria-label="Close" className="p-1.5 rounded-lg hover:bg-white/10">
              <X size={16} />
            </button>
          </div>
          <div ref={scroller} className="flex-1 overflow-auto p-3 space-y-3 bg-[#FDFCFB]">
            {messages.map((m, i) => (
              <div key={i} className={`text-sm ${m.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block max-w-[90%] rounded-2xl px-3 py-2 ${m.role === 'user' ? 'bg-brand-900 text-white' : 'bg-white border border-line text-ink-800'}`}>
                  {m.text}
                </div>
                {m.products?.length > 0 && (
                  <div className="mt-2 space-y-2 text-left">
                    {m.products.map((p) => (
                      <div key={p.id || p.slug} className="flex gap-2 items-center rounded-xl border border-line bg-white p-2">
                        <img src={p.images?.[0] || p.image} alt="" className="w-12 h-12 object-cover rounded-lg bg-cream-200" />
                        <div className="flex-1 min-w-0">
                          <Link to={`/product/${p.slug}`} className="text-[13px] font-semibold truncate block hover:underline">
                            {p.name}
                          </Link>
                          <div className="text-[12px]">{inr(p.price)}</div>
                        </div>
                        <button type="button" className="sk-btn-primary !py-1.5 !px-2.5 text-[11px]" onClick={() => add(p, { qty: 1 })}>Add</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="text-[12px] text-ink-500 inline-flex items-center gap-1.5">
                <Sparkles size={12} className="text-[var(--sk-gold-600)]" /> Thinking…
              </div>
            )}
          </div>
          <form onSubmit={send} className="flex gap-2 p-2.5 border-t border-line bg-white shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="sk-input !py-2 flex-1"
              placeholder="Occasion, recipient, budget…"
            />
            <button type="submit" disabled={busy} className="sk-btn-primary !px-3" aria-label="Send">
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group relative h-14 w-14 rounded-full bg-[var(--sk-espresso)] text-gold-300 grid place-items-center shadow-sk-lg ring-2 ring-[#C5A059] hover:scale-105 hover:bg-brand-800 transition-transform"
        aria-label={open ? 'Close AI Gift Advisor' : 'Open AI Gift Advisor'}
        aria-expanded={open}
      >
        {open ? <X size={22} strokeWidth={2} /> : <Gift size={26} strokeWidth={1.75} />}
        <span className="pointer-events-none absolute left-[4.35rem] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[var(--sk-espresso)] text-white text-[12px] px-3.5 py-1.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shadow-sk-md">
          Gift Advisor
        </span>
      </button>
    </div>
  );
}
