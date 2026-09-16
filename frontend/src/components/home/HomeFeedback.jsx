import React, { useEffect, useState } from 'react';
import { Star, Send, MessageSquareHeart, User, Mail, FileText, Heart, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useAccountData';
import { submitFeedback, subscribePublishedFeedback } from '@/lib/feedback';
import { FEEDBACK_SCENE_IMG } from '@/data/homeBrand';

const EMPTY = { name: '', email: '', rating: 5, text: '', company: '' };

const fieldClass =
  'w-full h-12 pl-11 pr-4 rounded-2xl border border-[#E8DFD3] bg-white text-[14px] text-[#3A2C1F] placeholder:text-[#6F6A62]/70 outline-none transition focus:border-[#D4A762] focus:ring-2 focus:ring-[#D4A762]/20';

function initials(name) {
  return String(name || 'G')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function GoldFlourish({ mirror = false }) {
  return (
    <svg
      aria-hidden
      className={`text-[#D4A762] shrink-0 ${mirror ? 'scale-x-[-1]' : ''}`}
      width="44"
      height="16"
      viewBox="0 0 44 16"
      fill="none"
    >
      <path d="M1 8c6-7 12-7 21 0 9 7 14 7 21 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="22" cy="8" r="2.1" fill="currentColor" />
    </svg>
  );
}

function StarPick({ value, onChange, disabled }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {Array.from({ length: 5 }).map((_, i) => {
        const n = i + 1;
        const on = n <= value;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            aria-checked={on && n === value}
            role="radio"
            onClick={() => onChange(n)}
            className={`p-0.5 transition ${disabled ? 'cursor-default' : 'hover:scale-110'}`}
            data-testid={`feedback-star-${n}`}
          >
            <Star
              size={22}
              className={on ? 'text-[#E8A11A] fill-current' : 'text-[#E8DFD3]'}
            />
          </button>
        );
      })}
      <span className="ml-2 text-[13px] text-[#6F6A62] font-medium">{value}/5</span>
    </div>
  );
}

export default function HomeFeedback() {
  const { user } = useAuth();
  const { name: profileName, email: profileEmail } = useUserProfile();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [live, setLive] = useState([]);

  useEffect(() => {
    setForm((f) => ({
      ...f,
      name: f.name || profileName || user?.displayName || '',
      email: f.email || profileEmail || user?.email || '',
    }));
  }, [profileName, profileEmail, user?.displayName, user?.email]);

  useEffect(() => {
    const scrollToForm = () => {
      if (window.location.hash === '#home-feedback') {
        document.getElementById('home-feedback')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    scrollToForm();
    window.addEventListener('hashchange', scrollToForm);
    const stop = subscribePublishedFeedback(setLive);
    return () => {
      window.removeEventListener('hashchange', scrollToForm);
      stop();
    };
  }, []);

  const set = (key) => (e) => {
    setError('');
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await submitFeedback(form);
      setSent(true);
      setForm((f) => ({ ...EMPTY, name: f.name, email: f.email, rating: 5 }));
    } catch (err) {
      setError(err?.message || 'Could not send your feedback. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      id="home-feedback"
      className="relative overflow-hidden scroll-mt-24"
      data-testid="home-feedback"
    >
      <img
        src={FEEDBACK_SCENE_IMG}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover object-center" loading="lazy" decoding="async" />
      <div className="absolute inset-0 bg-[#FAF7F0]/35" aria-hidden />

      <div className="relative sk-container py-14 md:py-16 lg:py-[4.25rem]">
        <div className="text-center mb-8 md:mb-10">
          <div className="flex items-center justify-center gap-3 md:gap-4">
            <GoldFlourish />
            <h2 className="font-display text-[1.85rem] md:text-[2.15rem] lg:text-[2.35rem] font-semibold leading-[1.3] tracking-[-0.02em] text-[#4A2E1E]">
              Share Your Feedback
            </h2>
            <GoldFlourish mirror />
          </div>
          <p className="mt-2.5 text-[14px] md:text-[16px] text-[#6F6A62] font-normal">
            Your thoughts help us grow and serve you better.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-5 md:gap-6 items-start">
          <form
            onSubmit={submit}
            className="bg-white/95 backdrop-blur-[2px] rounded-[24px] border border-[#E8DFD3] p-5 sm:p-7 md:p-8 shadow-[0_12px_40px_rgba(74,46,30,0.08)] space-y-4"
            data-testid="feedback-form"
          >
            {sent ? (
              <div className="text-center py-8">
                <div className="mx-auto h-12 w-12 rounded-full bg-[#F8F1E6] text-[#4A2E1E] grid place-items-center">
                  <MessageSquareHeart size={22} />
                </div>
                <div className="font-display font-semibold text-[#4A2E1E] text-2xl mt-4">Thank you!</div>
                <p className="text-[#6F6A62] mt-2 text-sm leading-relaxed max-w-md mx-auto">
                  Your review has been sent to our team. We’ll share it on the website after we read it.
                </p>
                <button
                  type="button"
                  className="mt-5 inline-flex items-center justify-center h-12 px-5 rounded-full border border-[#4A2E1E] text-[#4A2E1E] text-sm font-medium hover:bg-[#F8F1E6] transition"
                  onClick={() => setSent(false)}
                >
                  Write another review
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 h-9 w-9 rounded-full bg-[#F8F1E6] text-[#6B4F3B] grid place-items-center shrink-0">
                    <User size={16} strokeWidth={1.75} />
                  </span>
                  <p className="text-[#6F6A62] text-[14px] leading-relaxed pt-1.5">
                    Tell us about your order, hamper, or store visit. We read every note.
                  </p>
                </div>

                <div>
                  <label className="text-[13px] font-medium text-[#3A2C1F] mb-1.5 block">Your rating *</label>
                  <StarPick value={form.rating} onChange={(rating) => setForm((f) => ({ ...f, rating }))} disabled={busy} />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[13px] font-medium text-[#3A2C1F] mb-1.5 block">Name *</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F6A62]" strokeWidth={1.75} />
                      <input
                        required
                        value={form.name}
                        onChange={set('name')}
                        className={fieldClass}
                        placeholder="Your name"
                        maxLength={80}
                        data-testid="feedback-name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-[#3A2C1F] mb-1.5 block">Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F6A62]" strokeWidth={1.75} />
                      <input
                        type="email"
                        value={form.email}
                        onChange={set('email')}
                        className={fieldClass}
                        placeholder="you@email.com"
                        maxLength={120}
                        data-testid="feedback-email"
                      />
                    </div>
                  </div>
                </div>

                <div className="hidden" aria-hidden>
                  <label>Company
                    <input tabIndex={-1} autoComplete="off" value={form.company} onChange={set('company')} />
                  </label>
                </div>

                <div>
                  <label className="text-[13px] font-medium text-[#3A2C1F] mb-1.5 block">Your feedback *</label>
                  <textarea
                    required
                    rows={5}
                    value={form.text}
                    onChange={set('text')}
                    className="w-full min-h-[120px] px-4 py-3 rounded-2xl border border-[#E8DFD3] bg-white text-[14px] text-[#3A2C1F] placeholder:text-[#6F6A62]/70 outline-none transition focus:border-[#D4A762] focus:ring-2 focus:ring-[#D4A762]/20 resize-y"
                    placeholder="What did you love? What can we improve?"
                    maxLength={600}
                    data-testid="feedback-message"
                  />
                  <div className="text-[11px] text-[#6F6A62] text-right mt-1">{form.text.length}/600</div>
                </div>

                {error && <p className="text-sm text-red-700">{error}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-[#4A2E1E] text-white text-[15px] font-medium hover:bg-[#6B4F3B] disabled:opacity-60 transition shadow-[0_8px_18px_rgba(74,46,30,0.18)]"
                  data-testid="feedback-submit"
                >
                  <Send size={16} strokeWidth={1.8} />
                  {busy ? 'Sending…' : 'Submit Feedback'}
                  <ChevronRight size={16} strokeWidth={2.2} />
                </button>
              </>
            )}
          </form>

          <div className="relative lg:mt-2">
            <p className="hidden lg:block absolute -right-3 top-16 text-[13px] italic text-[#D4A762] whitespace-nowrap origin-center rotate-90 translate-x-1/2 pointer-events-none">
              Your opinion matters
            </p>
            <div className="bg-white/95 backdrop-blur-[2px] rounded-[24px] border border-[#E8DFD3] p-5 sm:p-7 shadow-[0_12px_40px_rgba(74,46,30,0.08)]">
              <div className="flex items-start gap-3">
                <span className="h-9 w-9 rounded-lg bg-[#F8F1E6] text-[#6B4F3B] grid place-items-center shrink-0">
                  <FileText size={16} strokeWidth={1.75} />
                </span>
                <div>
                  <div className="font-display font-semibold text-[#4A2E1E] text-[1.15rem] leading-snug">
                    Recent notes from customers
                  </div>
                  <p className="text-[#6F6A62] text-[13px] mt-1">Reviews our team has shared from this page.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3" data-testid="feedback-live">
                {live.length === 0 && (
                  <p className="text-[14px] text-[#6F6A62] leading-relaxed italic">
                    “New reviews appear here after our team shares them.”
                  </p>
                )}
                {live.slice(0, 4).map((row) => (
                  <article key={row.id} className="rounded-2xl border border-[#E8DFD3] bg-[#F8F1E6]/70 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#4A2E1E] text-white text-[12px] font-semibold grid place-items-center shrink-0">
                        {initials(row.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-[#3A2C1F] text-[13px] truncate">{row.name}</div>
                        <div className="flex items-center gap-0.5 text-[#E8A11A] mt-0.5">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star key={j} size={12} className={j < row.rating ? 'fill-current' : 'opacity-20'} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-[13px] text-[#6F6A62] leading-relaxed mt-3 italic">“{row.text}”</p>
                  </article>
                ))}
              </div>

              <div className="mt-5 flex justify-center text-[#D4A762]">
                <Heart size={16} className="fill-current" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
