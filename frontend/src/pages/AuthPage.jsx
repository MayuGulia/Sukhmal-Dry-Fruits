import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Mail, Phone, Lock, User, ArrowRight, ShieldCheck, Loader2,
  CheckCircle2, RefreshCw, Eye, EyeOff, ArrowLeft,
} from 'lucide-react';
import { HERO_IMG } from '@/data/mockContent';

/* UserFlows §5 — enumeration-safe copy (never reveal email/phone existence on login/forgot). */
const MSG = {
  credentials: 'Something went wrong. Please check your details and try again.',
  otpInvalid: 'Invalid or expired code. Please try again.',
  otpSent: 'We’ve sent a 6-digit code. Enter it below to continue.',
  forgotDone: 'Check your email for a reset link. If you don’t see it, check spam or try again shortly.',
  signupTaken: 'Account exists — log in instead.',
  needPhone: 'Please enter a valid phone number.',
  needEmail: 'Please enter a valid email address.',
  needPassword: 'Please enter your password.',
  needName: 'Please enter your full name.',
};

const AUTH_PATHS = new Set(['/login', '/signup', '/forgot-password', '/verify-otp']);
const OTP_COOLDOWN_S = 30;
const MOCK_OTP = '123456'; // demo only — any other 6-digit fails generically
const MOCK_TAKEN_EMAIL = 'taken@sukhmal.in';

const modeConfig = {
  login: {
    title: 'Welcome back',
    sub: 'Log in or create an account to enter the store.',
    cta: 'Log In',
    hasName: false,
  },
  signup: {
    title: 'Create your account',
    sub: 'Faster checkout, order tracking, and exclusive offers.',
    cta: 'Create Account',
    hasName: true,
  },
  forgot: {
    title: 'Reset your password',
    sub: 'Enter your email and we’ll send a secure reset link.',
    cta: 'Send Reset Link',
    hasName: false,
  },
  otp: {
    title: 'Verify OTP',
    sub: 'Enter the 6-digit code we sent to your phone.',
    cta: 'Verify & Continue',
    hasName: false,
  },
};

/** Safe relative return path for post-login redirect (checkout, account, etc.). */
export function resolveReturnPath(location, searchParams) {
  const candidates = [
    location?.state?.from,
    location?.state?.returnTo,
    location?.state?.returnUrl,
    searchParams?.get?.('return'),
    searchParams?.get?.('returnUrl'),
    searchParams?.get?.('redirect'),
  ];
  for (const raw of candidates) {
    if (typeof raw !== 'string') continue;
    const path = raw.trim();
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) continue;
    const pathname = path.split('?')[0].split('#')[0];
    if (AUTH_PATHS.has(pathname)) continue;
    return path;
  }
  return '/';
}

function BrandMark({ compact = false }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 group">
      <div className="w-11 h-11 rounded-full bg-brand-900 grid place-items-center text-cream-300 font-display text-xl leading-none shadow-sk-sm group-hover:bg-brand-800 transition-colors">
        S
      </div>
      {!compact && (
        <div className="flex flex-col leading-tight">
          <span className="font-display text-brand-900 text-xl font-bold tracking-tight">SUKHMAL</span>
          <span className="text-[10px] tracking-[0.22em] text-brand-700 -mt-0.5">DRY FRUITS KORNER</span>
        </div>
      )}
    </Link>
  );
}

function Field({ icon: Icon, children, hint }) {
  return (
    <div>
      <div className="relative">
        {Icon && (
          <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" aria-hidden />
        )}
        {children}
      </div>
      {hint && <p className="mt-1.5 text-[12px] text-ink-500">{hint}</p>}
    </div>
  );
}

function Alert({ tone = 'error', children }) {
  const styles =
    tone === 'success'
      ? 'bg-[var(--sk-green-100)] text-[var(--sk-green-500)] border-[var(--sk-green-500)]/20'
      : tone === 'info'
        ? 'bg-cream-300 text-brand-900 border-line-strong'
        : 'bg-red-50 text-[var(--sk-red-500)] border-red-100';
  return (
    <div role="alert" className={`rounded-lg border px-3.5 py-2.5 text-sm font-medium ${styles}`}>
      {children}
    </div>
  );
}

function SubmitButton({ loading, children, disabled }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="sk-btn-primary w-full !py-3.5 disabled:opacity-60"
      data-testid="auth-submit"
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Please wait…
        </>
      ) : (
        <>
          {children}
          <ArrowRight size={16} />
        </>
      )}
    </button>
  );
}

export default function AuthPage({ mode = 'login' }) {
  const { login, signInWithEmail, signUpWithEmail, signInWithGoogle, sendReset, firebaseEnabled } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [searchParams] = useSearchParams();
  const returnTo = useMemo(() => resolveReturnPath(loc, searchParams), [loc, searchParams]);
  const returnState = useMemo(() => ({ from: returnTo, returnTo }), [returnTo]);

  const cfg = modeConfig[mode];
  const phoneFromState = loc.state?.phone || '';

  const [tab, setTab] = useState('email'); // login: email | otp
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: phoneFromState,
    password: '',
    otp: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', tone: 'error' });
  const [forgotSent, setForgotSent] = useState(false);
  const [resendIn, setResendIn] = useState(mode === 'otp' ? OTP_COOLDOWN_S : 0);
  const [otpFocused, setOtpFocused] = useState(false);
  const otpRef = useRef(null);

  useEffect(() => {
    if (firebaseEnabled) setTab('email');
  }, [firebaseEnabled]);

  useEffect(() => {
    setMsg({ text: '', tone: 'error' });
    setForgotSent(false);
    setLoading(false);
    if (mode === 'otp') {
      setResendIn(OTP_COOLDOWN_S);
      if (loc.state?.phone) setForm((f) => ({ ...f, phone: loc.state.phone }));
    } else {
      setResendIn(0);
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  useEffect(() => {
    if (mode === 'otp') {
      const t = setTimeout(() => otpRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [mode]);

  const set = (key) => (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [key]: v }));
    if (msg.text) setMsg({ text: '', tone: 'error' });
  };

  const finishAuth = (sessionUser) => {
    nav(sessionUser?.customClaims?.admin ? '/admin' : returnTo, { replace: true });
  };

  const firebaseError = (err, fallback) => {
    const code = err?.code || '';
    if (code === 'auth/email-already-in-use') return MSG.signupTaken;
    if (code === 'auth/weak-password') return MSG.needPassword;
    if (code === 'auth/invalid-email') return MSG.needEmail;
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return 'Google sign-in was cancelled.';
    }
    if (code === 'auth/unauthorized-domain') {
      return 'This domain is not authorised in Firebase. Add it under Authentication → Settings → Authorised domains.';
    }
    if (code === 'auth/popup-blocked') {
      return 'The Google sign-in popup was blocked. Allow popups and try again.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'This sign-in method is not enabled yet in Firebase Authentication.';
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-login-credentials') {
      return fallback;
    }
    return fallback;
  };

  const delay = (ms = 700) => new Promise((r) => setTimeout(r, ms));

  const startResendTimer = () => setResendIn(OTP_COOLDOWN_S);

  const handleResendOtp = async () => {
    if (resendIn > 0 || loading) return;
    setLoading(true);
    setMsg({ text: '', tone: 'error' });
    await delay(600);
    setLoading(false);
    startResendTimer();
    setMsg({ text: MSG.otpSent, tone: 'info' });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setMsg({ text: '', tone: 'error' });

    // ——— Forgot password ———
    if (mode === 'forgot') {
      if (!form.email.trim() || !form.email.includes('@')) {
        setMsg({ text: MSG.needEmail, tone: 'error' });
        return;
      }
      setLoading(true);
      try {
        if (firebaseEnabled) await sendReset(form.email.trim());
        else await delay(900);
        setForgotSent(true);
      } catch {
        setForgotSent(true);
      } finally {
        setLoading(false);
      }
      return;
    }

    // ——— OTP verify (demo only when Firebase is off) ———
    if (mode === 'otp') {
      if (firebaseEnabled) {
        nav('/login', { replace: true, state: returnState });
        return;
      }
      if (form.otp.length !== 6) {
        setMsg({ text: MSG.otpInvalid, tone: 'error' });
        return;
      }
      setLoading(true);
      await delay(800);
      // Mock: only MOCK_OTP succeeds; failures stay generic
      if (form.otp !== MOCK_OTP) {
        setLoading(false);
        setMsg({ text: MSG.otpInvalid, tone: 'error' });
        return;
      }
      finishAuth(login({
        phone: form.phone || phoneFromState || '+919876543210',
        name: 'Guest',
      }));
      return;
    }

    // ——— Sign up ———
    if (mode === 'signup') {
      if (!form.name.trim()) {
        setMsg({ text: MSG.needName, tone: 'error' });
        return;
      }
      if (!form.email.trim() || !form.email.includes('@')) {
        setMsg({ text: MSG.needEmail, tone: 'error' });
        return;
      }
      if (!form.password || form.password.length < 6) {
        setMsg({ text: MSG.needPassword, tone: 'error' });
        return;
      }
      setLoading(true);
      try {
        if (firebaseEnabled) {
          const session = await signUpWithEmail({
            email: form.email.trim(),
            password: form.password,
            name: form.name.trim(),
            phone: form.phone.trim() || null,
          });
          finishAuth(session);
          return;
        }
        await delay(900);
        if (form.email.trim().toLowerCase() === MOCK_TAKEN_EMAIL) {
          setLoading(false);
          setMsg({ text: MSG.signupTaken, tone: 'error' });
          return;
        }
        finishAuth(login({
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          name: form.name.trim(),
        }));
      } catch (err) {
        setMsg({ text: firebaseError(err, MSG.credentials), tone: 'error' });
      } finally {
        setLoading(false);
      }
      return;
    }

    // ——— Login ———
    if (tab === 'otp') {
      if (firebaseEnabled) {
        setMsg({ text: 'Use email, password, or Google to sign in.', tone: 'error' });
        return;
      }
      const phone = form.phone.trim();
      if (!phone || phone.replace(/\D/g, '').length < 10) {
        setMsg({ text: MSG.needPhone, tone: 'error' });
        return;
      }
      setLoading(true);
      await delay(700);
      setLoading(false);
      nav('/verify-otp', { state: { ...returnState, phone } });
      return;
    }

    // Email + password
    if (!form.email.trim() || !form.email.includes('@')) {
      setMsg({ text: MSG.credentials, tone: 'error' });
      return;
    }
    if (!form.password) {
      setMsg({ text: MSG.credentials, tone: 'error' });
      return;
    }
    setLoading(true);
    try {
      if (firebaseEnabled) {
        const session = await signInWithEmail(form.email.trim(), form.password);
        finishAuth(session);
        return;
      }
      await delay(850);
      finishAuth(login({
        email: form.email.trim(),
        name: form.email.trim().split('@')[0],
      }));
    } catch (err) {
      setMsg({ text: firebaseError(err, MSG.credentials), tone: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const maskedPhone = (form.phone || phoneFromState || '').replace(/(\d{2})\d+(\d{2})/, '$1••••••$2');

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-cream-100">
      {/* Brand panel */}
      <aside className="hidden md:block relative overflow-hidden">
        <img
          src={HERO_IMG}
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900 via-brand-900/55 to-brand-900/20" />
        <div className="absolute inset-0 opacity-[0.12]" style={{
          backgroundImage: 'radial-gradient(circle at 20% 20%, #E4C79A 0, transparent 40%), radial-gradient(circle at 80% 60%, #BDAA7E 0, transparent 35%)',
        }} />
        <div className="relative h-full flex flex-col p-10 lg:p-14 text-white">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur grid place-items-center font-display text-xl text-gold-300 border border-white/20">S</div>
            <div className="leading-tight">
              <div className="font-display text-2xl font-bold">SUKHMAL</div>
              <div className="text-[10px] tracking-[0.24em] text-gold-300">DRY FRUITS KORNER</div>
            </div>
          </div>
          <div className="mt-auto max-w-md pb-4">
            <div className="sk-section-eyebrow !text-gold-300">Since 1994</div>
            <h2 className="font-display text-4xl lg:text-5xl font-bold mt-3 leading-[1.1]">
              Premium dry fruits,<br />delivered fresh.
            </h2>
            <p className="mt-4 text-cream-300/90 text-[15px] leading-relaxed">
              Grade-A nuts and gift hampers, vacuum-packed and shipped across India.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-cream-200/90">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} className="text-gold-300" /> Secure checkout</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} className="text-gold-300" /> Trusted since 1994</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-10 md:py-14">
        <div className="w-full max-w-[420px] sk-fade-up">
          <div className="md:hidden mb-8">
            <BrandMark />
          </div>

          <div className="sk-card p-6 sm:p-8 shadow-sk-md border-line">
            {mode === 'forgot' && forgotSent ? (
              <div className="text-center py-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-[var(--sk-green-100)] grid place-items-center text-[var(--sk-green-500)]">
                  <CheckCircle2 size={28} />
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-brand-900 mt-4">Check your email</h1>
                <p className="text-ink-600 mt-2 text-sm leading-relaxed">{MSG.forgotDone}</p>
                <Link
                  to="/login"
                  state={returnState}
                  className="sk-btn-primary w-full !py-3.5 mt-6"
                >
                  Back to login <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <>
                {(mode === 'otp' || mode === 'forgot') && (
                  <Link
                    to="/login"
                    state={returnState}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-900 hover:text-brand-700 mb-4"
                  >
                    <ArrowLeft size={14} /> Back to login
                  </Link>
                )}

                <h1 className="font-display text-2xl md:text-[1.85rem] font-bold text-brand-900 tracking-tight">
                  {cfg.title}
                </h1>
                <p className="text-ink-600 mt-1.5 text-[15px]">
                  {mode === 'otp' && maskedPhone
                    ? `Enter the 6-digit code sent to ${maskedPhone}.`
                    : cfg.sub}
                </p>

                {returnTo === '/checkout' && mode === 'login' && (
                  <div className="mt-4">
                    <Alert tone="info">Sign in to complete your checkout. Your cart is saved.</Alert>
                  </div>
                )}

                {mode === 'login' && !firebaseEnabled && (
                  <div className="mt-5 grid grid-cols-2 rounded-lg bg-cream-200 p-1 border border-line">
                    {[
                      { id: 'email', label: 'Email' },
                      { id: 'otp', label: 'Phone OTP' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => { setTab(t.id); setMsg({ text: '', tone: 'error' }); }}
                        className={`py-2.5 rounded-md text-sm font-semibold transition-all ${
                          tab === t.id
                            ? 'bg-white text-brand-900 shadow-sk-sm'
                            : 'text-ink-500 hover:text-brand-900'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}

                <form onSubmit={submit} className="mt-5 space-y-3.5" noValidate>
                  {cfg.hasName && (
                    <Field icon={User}>
                      <input
                        value={form.name}
                        onChange={set('name')}
                        placeholder="Full name"
                        autoComplete="name"
                        className="sk-input pl-10"
                        data-testid="auth-name"
                      />
                    </Field>
                  )}

                  {mode === 'otp' ? (
                    <div>
                      <label className="sr-only" htmlFor="otp-input">One-time password</label>
                      <div
                        className={`relative rounded-lg border-[1.5px] transition-shadow ${
                          otpFocused ? 'ring-[3px] ring-[rgba(62,39,21,.08)] border-brand-900' : 'border-line-strong'
                        }`}
                      >
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                        <input
                          ref={otpRef}
                          id="otp-input"
                          value={form.otp}
                          onChange={(e) => {
                            setForm((f) => ({ ...f, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }));
                            if (msg.text) setMsg({ text: '', tone: 'error' });
                          }}
                          onFocus={() => setOtpFocused(true)}
                          onBlur={() => setOtpFocused(false)}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          placeholder="• • • • • •"
                          className="w-full pl-10 pr-4 py-3.5 rounded-lg bg-white text-brand-900 text-center text-2xl font-semibold tracking-[0.55em] font-mono outline-none"
                          data-testid="otp-input"
                        />
                      </div>
                      <div className="mt-2 flex justify-center gap-1.5" aria-hidden>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <span
                            key={i}
                            className={`h-1 w-6 rounded-full transition-colors ${
                              i < form.otp.length ? 'bg-brand-900' : 'bg-line-strong'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="mt-2 text-center text-[12px] text-ink-500">
                        Demo code: <span className="font-mono font-semibold text-brand-900">{MOCK_OTP}</span>
                      </p>
                    </div>
                  ) : mode === 'login' && tab === 'otp' ? (
                    <Field icon={Phone} hint="We’ll text a one-time code. Standard rates may apply.">
                      <input
                        value={form.phone}
                        onChange={set('phone')}
                        placeholder="+91 phone number"
                        autoComplete="tel"
                        inputMode="tel"
                        className="sk-input pl-10"
                        data-testid="auth-phone"
                      />
                    </Field>
                  ) : mode === 'signup' ? (
                    <>
                      <Field icon={Phone}>
                        <input
                          value={form.phone}
                          onChange={set('phone')}
                          placeholder="+91 phone number (optional)"
                          autoComplete="tel"
                          inputMode="tel"
                          className="sk-input pl-10"
                          data-testid="auth-phone"
                        />
                      </Field>
                      <Field icon={Mail}>
                        <input
                          value={form.email}
                          onChange={set('email')}
                          type="email"
                          placeholder="Email address"
                          autoComplete="email"
                          className="sk-input pl-10"
                          data-testid="auth-email"
                        />
                      </Field>
                    </>
                  ) : (
                    <Field icon={Mail}>
                      <input
                        value={form.email}
                        onChange={set('email')}
                        type="email"
                        placeholder="Email address"
                        autoComplete={mode === 'forgot' ? 'email' : 'username'}
                        className="sk-input pl-10"
                        required={mode !== 'forgot'}
                        data-testid="auth-email"
                      />
                    </Field>
                  )}

                  {((mode === 'login' && tab === 'email') || mode === 'signup') && (
                    <Field icon={Lock}>
                      <input
                        value={form.password}
                        onChange={set('password')}
                        type={showPw ? 'text' : 'password'}
                        placeholder={mode === 'signup' ? 'Password (min. 6 characters)' : 'Password'}
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        className="sk-input pl-10 pr-11"
                        data-testid="auth-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-brand-900 p-1"
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </Field>
                  )}

                  {mode === 'login' && tab === 'email' && (
                    <div className="flex items-center justify-between text-[12px] pt-0.5">
                      <label className="flex items-center gap-2 text-ink-600 cursor-pointer select-none">
                        <input type="checkbox" className="accent-[var(--sk-brown-900)] rounded" />
                        Remember me
                      </label>
                      <Link
                        to="/forgot-password"
                        state={returnState}
                        className="text-brand-900 font-semibold hover:underline"
                        data-testid="login-forgot-password-link"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  )}

                  {msg.text && (
                    <Alert tone={msg.tone}>
                      {msg.text}
                      {msg.text === MSG.signupTaken && (
                        <>
                          {' '}
                          <Link to="/login" state={returnState} className="underline font-bold">
                            Log in
                          </Link>
                        </>
                      )}
                    </Alert>
                  )}

                  <SubmitButton loading={loading}>
                    {mode === 'login' && tab === 'otp' ? 'Send OTP' : cfg.cta}
                  </SubmitButton>
                </form>

                {firebaseEnabled && (mode === 'login' || mode === 'signup') && tab !== 'otp' && (
                  <div className="mt-4">
                    <div className="relative my-4 text-center text-[11px] uppercase tracking-widest text-ink-400">
                      <span className="bg-cream-100 px-2 relative z-10">or</span>
                      <span className="absolute left-0 right-0 top-1/2 border-t border-line" />
                    </div>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={async () => {
                        setLoading(true);
                        setMsg({ text: '', tone: 'error' });
                        try {
                          const session = await signInWithGoogle();
                          finishAuth(session);
                        } catch (err) {
                          setMsg({ text: firebaseError(err, MSG.credentials), tone: 'error' });
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="w-full sk-btn-outline !py-2.5"
                    >
                      Continue with Google
                    </button>
                  </div>
                )}

                <div className="mt-5 text-center text-sm text-ink-600">
                  {mode === 'login' && (
                    <>
                      New to Sukhmal?{' '}
                      <Link
                        to="/signup"
                        state={returnState}
                        className="text-brand-900 font-semibold hover:underline"
                        data-testid="login-register-link"
                      >
                        Create an account
                      </Link>
                    </>
                  )}
                  {mode === 'signup' && (
                    <>
                      Already have an account?{' '}
                      <Link to="/login" state={returnState} className="text-brand-900 font-semibold hover:underline">
                        Log in
                      </Link>
                    </>
                  )}
                  {mode === 'otp' && (
                    <div className="flex flex-col items-center gap-1">
                      <span>Didn’t get the code?</span>
                      {resendIn > 0 ? (
                        <span className="text-ink-500 font-medium tabular-nums">
                          Resend in {String(resendIn).padStart(2, '0')}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 text-brand-900 font-semibold hover:underline disabled:opacity-50"
                        >
                          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                          Resend OTP
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-[11px] text-ink-400 leading-relaxed px-2">
            By continuing, you agree to Sukhmal’s Terms & Privacy Policy.
            Your credentials are never shared.
          </p>
        </div>
      </div>
    </div>
  );
}
