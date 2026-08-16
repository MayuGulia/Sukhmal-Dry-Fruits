const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IN_PHONE_RE = /^[6-9]\d{9}$/;

export function stripHtml(value, max = 2000) {
  return String(value || '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, max);
}

export function isValidEmail(value) {
  const email = String(value || '').trim();
  return email.length > 3 && email.length < 320 && EMAIL_RE.test(email);
}

export function normalizeIndianPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export function isValidIndianPhone(value) {
  return IN_PHONE_RE.test(normalizeIndianPhone(value));
}

/** Min 8 chars, at least one number and one special character. */
export function isStrongPassword(value) {
  const pw = String(value || '');
  return pw.length >= 8 && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw);
}

export function passwordPolicyMessage() {
  return 'Password must be at least 8 characters and include a number and a special character.';
}

const LOCK_KEY = 'sk_login_lock';
const MAX_FAILS = 5;
const LOCK_MS = 30 * 60 * 1000;

export function loginLockStatus() {
  try {
    const raw = sessionStorage.getItem(LOCK_KEY);
    if (!raw) return { locked: false, fails: 0, remainingMs: 0 };
    const data = JSON.parse(raw);
    const until = Number(data.until || 0);
    if (until && Date.now() < until) {
      return { locked: true, fails: data.fails || MAX_FAILS, remainingMs: until - Date.now() };
    }
    if (until && Date.now() >= until) {
      sessionStorage.removeItem(LOCK_KEY);
      return { locked: false, fails: 0, remainingMs: 0 };
    }
    return { locked: false, fails: Number(data.fails || 0), remainingMs: 0 };
  } catch {
    return { locked: false, fails: 0, remainingMs: 0 };
  }
}

export function recordLoginFailure() {
  const cur = loginLockStatus();
  if (cur.locked) return cur;
  const fails = cur.fails + 1;
  const payload = fails >= MAX_FAILS
    ? { fails, until: Date.now() + LOCK_MS }
    : { fails, until: 0 };
  try { sessionStorage.setItem(LOCK_KEY, JSON.stringify(payload)); } catch {}
  return loginLockStatus();
}

export function clearLoginFailures() {
  try { sessionStorage.removeItem(LOCK_KEY); } catch {}
}
