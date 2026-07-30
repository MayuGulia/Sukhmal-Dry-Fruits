import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Phone, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

const modeConfig = {
  login:    { title: 'Welcome Back', sub: 'Log in to continue shopping', cta: 'Log In', hasName: false },
  signup:   { title: 'Create Your Account', sub: 'Enjoy faster checkout and exclusive offers', cta: 'Create Account', hasName: true },
  forgot:   { title: 'Reset Your Password', sub: 'We’ll send a link to reset your password', cta: 'Send Reset Link', hasName: false },
  otp:      { title: 'Verify OTP', sub: 'Enter the 6-digit code sent to your phone', cta: 'Verify & Continue', hasName: false },
};

export default function AuthPage({ mode = 'login' }) {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [tab, setTab] = useState('email');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', otp: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [genericMsg, setGenericMsg] = useState('');
  const cfg = modeConfig[mode];

  const submit = (e) => {
    e.preventDefault();
    if (mode === 'forgot') {
      // Enumeration-safe generic messaging
      setGenericMsg('If an account exists for this email, we’ve sent a reset link.');
      return;
    }
    if (mode === 'otp') {
      if (form.otp.length !== 6) { setGenericMsg('Invalid or expired code.'); return; }
      login({ phone: form.phone || '+919876543210', name: 'Guest' });
      nav('/account');
      return;
    }
    if (mode === 'signup') {
      // Generic “account exists” prompt would be shown here in real API
      login({ email: form.email, phone: form.phone, name: form.name });
      nav('/account');
      return;
    }
    // login
    if (tab === 'otp' && !otpSent) {
      setOtpSent(true);
      nav('/verify-otp', { state: { phone: form.phone } });
      return;
    }
    if (!form.email && !form.phone) { setGenericMsg('Please check your details and try again.'); return; }
    login({ email: form.email, phone: form.phone, name: form.email?.split('@')[0] });
    nav('/account');
  };

  return (
    <div className="min-h-[75vh] grid md:grid-cols-2">
      <div className="hidden md:block relative">
        <img src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-brand-900/30 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <div className="sk-section-eyebrow !text-gold-300">SUKHMAL SINCE 1994</div>
          <div className="font-display text-4xl font-bold mt-2">Premium dry fruits<br />delivered fresh.</div>
          <div className="flex items-center gap-2 mt-3 text-sm"><ShieldCheck size={14} /> Secure. Trusted. Verified.</div>
        </div>
      </div>

      <div className="sk-container py-10 md:py-16 flex items-center">
        <div className="w-full max-w-md mx-auto">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-brand-900">{cfg.title}</h1>
          <p className="text-ink-600 mt-2">{cfg.sub}</p>

          {mode === 'login' && (
            <div className="mt-6 grid grid-cols-2 rounded-lg bg-cream-200 p-1">
              {['email','otp'].map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`py-2 rounded-md text-sm font-semibold ${tab === t ? 'bg-white text-brand-900 shadow-sk-sm' : 'text-ink-500'}`}>{t === 'email' ? 'Email + Password' : 'Phone + OTP'}</button>
              ))}
            </div>
          )}

          <form onSubmit={submit} className="mt-5 space-y-3">
            {cfg.hasName && (
              <div className="relative"><User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="sk-input pl-10" required /></div>
            )}
            {mode === 'otp' ? (
              <div className="relative"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g,'').slice(0,6) })} inputMode="numeric" maxLength={6} placeholder="6-digit OTP" className="sk-input pl-10 tracking-widest" data-testid="otp-input" /></div>
            ) : (mode === 'login' && tab === 'otp') || mode === 'signup' ? (
              <>
                <div className="relative"><Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 phone number" className="sk-input pl-10" data-testid="auth-phone" /></div>
                {mode === 'signup' && <div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="Email address" className="sk-input pl-10" data-testid="auth-email" /></div>}
              </>
            ) : (
              <div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="Email address" className="sk-input pl-10" required data-testid="auth-email" /></div>
            )}
            {(mode === 'login' && tab === 'email') || mode === 'signup' ? (
              <div className="relative"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" placeholder="Password" className="sk-input pl-10" required data-testid="auth-password" /></div>
            ) : null}

            {mode === 'login' && (
              <div className="flex items-center justify-between text-[12px]">
                <label className="flex items-center gap-2 text-ink-600"><input type="checkbox" /> Remember me</label>
                <Link to="/forgot-password" className="text-brand-900 font-semibold hover:underline">Forgot Password?</Link>
              </div>
            )}

            {genericMsg && <div className="text-sm text-[var(--sk-red-500)]">{genericMsg}</div>}

            <button className="sk-btn-primary w-full !py-3.5" data-testid="auth-submit">{cfg.cta} <ArrowRight size={16} /></button>
          </form>

          <div className="mt-5 text-center text-sm text-ink-600">
            {mode === 'login' && <>New to Sukhmal? <Link to="/signup" className="text-brand-900 font-semibold hover:underline">Create an account</Link></>}
            {mode === 'signup' && <>Already have an account? <Link to="/login" className="text-brand-900 font-semibold hover:underline">Log in</Link></>}
            {mode === 'forgot' && <><Link to="/login" className="text-brand-900 font-semibold hover:underline">Back to login</Link></>}
            {mode === 'otp' && <>Didn’t get the code? <button className="text-brand-900 font-semibold hover:underline">Resend in 30s</button></>}
          </div>
        </div>
      </div>
    </div>
  );
}
