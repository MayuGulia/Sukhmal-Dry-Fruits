import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const SESSION_KEY = 'sk_analytics_session';
const FIRST_DAY_KEY = 'sk_analytics_first_day';
const USER_DAYS_KEY = 'sk_analytics_user_days';

export const ANALYTICS_EVENTS = [
  'page_view',
  'product_view',
  'add_to_cart',
  'wishlist_add',
  'checkout_started',
  'order_placed',
  'hamper_builder_started',
  'ai_widget_used',
];

const ALLOWED = new Set(ANALYTICS_EVENTS);
const recent = new Map();

export function analyticsDay(d = new Date()) {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export function analyticsSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `ses_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    const today = analyticsDay();
    if (!localStorage.getItem(FIRST_DAY_KEY)) localStorage.setItem(FIRST_DAY_KEY, today);
    return id;
  } catch {
    return `ses_${Date.now().toString(36)}`;
  }
}

function isReturningVisitor() {
  try {
    const today = analyticsDay();
    const first = localStorage.getItem(FIRST_DAY_KEY);
    const uid = auth?.currentUser?.uid;
    let userDays = [];
    try { userDays = JSON.parse(localStorage.getItem(USER_DAYS_KEY) || '[]'); } catch { userDays = []; }
    if (uid && !userDays.includes(today)) {
      userDays = [...userDays.filter((d) => d !== today), today].slice(-60);
      localStorage.setItem(USER_DAYS_KEY, JSON.stringify(userDays));
    }
    if (uid && userDays.some((d) => d && d !== today)) return true;
    return Boolean(first && first !== today);
  } catch {
    return false;
  }
}

export function trackEvent(eventType, { productId = null, metadata = {} } = {}) {
  if (!db || !ALLOWED.has(eventType) || typeof window === 'undefined') return;
  const page = String(window.location.pathname || '/').slice(0, 180);
  const key = `${eventType}:${productId || ''}:${page}`;
  const now = Date.now();
  if ((recent.get(key) || 0) > now - 2500) return;
  recent.set(key, now);

  addDoc(collection(db, 'analytics_events'), {
    event_type: eventType,
    session_id: analyticsSessionId(),
    user_id: auth?.currentUser?.uid || null,
    product_id: productId || null,
    page,
    timestamp: serverTimestamp(),
    day: analyticsDay(),
    returning: isReturningVisitor(),
    metadata: metadata && typeof metadata === 'object' ? metadata : {},
  }).catch(() => {});
}
