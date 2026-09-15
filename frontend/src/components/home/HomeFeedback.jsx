import React, { useEffect, useState } from 'react';
import { Star, Send, MessageSquareHeart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useAccountData';
import { submitFeedback, subscribePublishedFeedback } from '@/lib/feedback';
import FlourishTitle from '@/components/home/FlourishTitle';

const EMPTY = { name: '', email: '', rating: 5, text: '', company: '' };

function initials(name) {
  return String(name || 'G')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
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
              className={on ? 'text-[var(--sk-star)] fill-current' : 'text-ink-300'}
            />
          </button>
        );
      })}
      <span className="ml-2 text-[12px] text-ink-500">{value}/5</span>
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
    <section id="home-feedback" className="scroll-mt-24 bg-[#F6F0E8] py-12 md:py-16 border-t border-[var(--sk-line)]" data-testid="home-feedback">
      <div className="sk-container">
        <FlourishTitle title="Share Your Feedback" />
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-5 md:gap-6 -mt-2">
          <form
            onSubmit={submit}
            className="bg-white rounded-2xl border border-[var(--sk-line)] p-6 md:p-8 shadow-sk-sm space-y-4"
            data-testid="feedback-form"
          >
            {sent ? (
              <div className="text-center py-8">
                <div className="mx-auto h-12 w-12 rounded-full bg-[var(--sk-green-100)] text-[var(--sk-green-500)] grid place-items-center">
                  <MessageSquareHeart size={22} />
                </div>
                <div className="font-display font-bold text-brand-900 text-2xl mt-4">Thank you!</div>
                <p className="text-ink-600 mt-2 text-sm leading-relaxed max-w-md mx-auto">
                  Your review has been sent to our team and may appear with other customer stories on this page.
                </p>
                <button
                  type="button"
                  className="sk-btn-outline mt-5 text-sm"
                  onClick={() => setSent(false)}
                >
                  Write another review
                </button>
              </div>
            ) : (
              <>
                <p className="text-ink-600 text-sm md:text-[15px] leading-relaxed">
                  Tell us about your order, hamper, or store visit. We read every note.
                </p>
                <div>
                  <label className="text-[11px] font-semibold text-ink-500 mb-1.5 block">Your rating *</label>
                  <StarPick value={form.rating} onChange={(rating) => setForm((f) => ({ ...f, rating }))} disabled={busy} />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-500 mb-1 block">Name *</label>
                    <input
                      required
                      value={form.name}
                      onChange={set('name')}
                      className="sk-input"
                      placeholder="Your name"
                      maxLength={80}
                      data-testid="feedback-name"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-ink-500 mb-1 block">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={set('email')}
                      className="sk-input"
                      placeholder="you@email.com"
                      maxLength={120}
                      data-testid="feedback-email"
                    />
                  </div>
                </div>
                <div className="hidden" aria-hidden>
                  <label>Company
                    <input tabIndex={-1} autoComplete="off" value={form.company} onChange={set('company')} />
                  </label>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-500 mb-1 block">Your feedback *</label>
                  <textarea
                    required
                    rows={4}
                    value={form.text}
                    onChange={set('text')}
                    className="sk-input"
                    placeholder="What did you love? What can we improve?"
                    maxLength={600}
                    data-testid="feedback-message"
                  />
                  <div className="text-[11px] text-ink-400 text-right mt-1">{form.text.length}/600</div>
                </div>
                {error && <p className="text-sm text-red-700">{error}</p>}
                <button type="submit" disabled={busy} className="sk-btn-primary !bg-[var(--sk-espresso)]" data-testid="feedback-submit">
                  <Send size={16} /> {busy ? 'Sending…' : 'Submit Feedback'}
                </button>
              </>
            )}
          </form>

          <div className="space-y-3">
            <div className="rounded-2xl border border-[var(--sk-line)] bg-white p-6 md:p-8 shadow-sk-sm">
              <div className="font-display font-bold text-brand-900 text-xl">Recent notes from customers</div>
              <p className="text-ink-500 text-sm mt-1.5">Live reviews from this page, shown as they come in.</p>
              <div className="mt-5 space-y-3" data-testid="feedback-live">
                {live.length === 0 && (
                  <p className="text-sm text-ink-500 leading-relaxed">
                    Be the first to share a review here. Star ratings and a few kind words help other families choose with confidence.
                  </p>
                )}
                {live.slice(0, 4).map((row) => (
                  <article key={row.id} className="rounded-xl border border-[var(--sk-line)] bg-[#FAF7F2] p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[var(--sk-espresso)] text-white text-[12px] font-semibold grid place-items-center shrink-0">
                        {initials(row.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-brand-900 text-[13px] truncate">{row.name}</div>
                        <div className="flex items-center gap-0.5 text-[var(--sk-star)] mt-0.5">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star key={j} size={12} className={j < row.rating ? 'fill-current' : 'opacity-20'} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-[13px] text-ink-600 leading-relaxed mt-3 italic">“{row.text}”</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
