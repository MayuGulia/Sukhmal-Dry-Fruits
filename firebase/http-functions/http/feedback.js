const { json, readJsonBody, httpsFn, RESEND_SECRETS } = require('../_shared/httpFn');
const { adminDb } = require('../_shared/firebaseAdmin');
const { sendResend, ownerNotifyTo } = require('../_shared/notify');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function strip(value, max) {
  return String(value || '').replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim().slice(0, max);
}

function parseFeedback(body = {}) {
  if (strip(body.company, 80)) return { spam: true };
  const name = strip(body.name, 80);
  const email = strip(body.email, 120).toLowerCase();
  const text = strip(body.message || body.text, 600);
  const rating = Math.round(Number(body.rating));
  if (name.length < 2) return { error: 'invalid_name', message: 'Please enter your name.' };
  if (!rating || rating < 1 || rating > 5) return { error: 'invalid_rating', message: 'Please choose a star rating.' };
  if (text.length < 8) return { error: 'invalid_text', message: 'Please write a few words about your experience.' };
  if (email && !EMAIL_RE.test(email)) return { error: 'invalid_email', message: 'Please enter a valid email address.' };
  return { name, email, text, rating };
}

const feedback = httpsFn(async (req, res) => {
  if (req.method !== 'POST') return json(res, { error: 'method' }, 405);
  const parsed = parseFeedback(readJsonBody(req));
  if (parsed.spam) return json(res, { ok: true });
  if (parsed.error) return json(res, { error: parsed.error, message: parsed.message }, 400);

  const row = {
    name: parsed.name,
    email: parsed.email,
    text: parsed.text,
    rating: parsed.rating,
    published: false,
    source: 'homepage',
  };

  let id = null;
  const admin = await adminDb();
  if (admin) {
    const ref = await admin.db.collection('feedback').add({
      ...row,
      createdAt: admin.FieldValue.serverTimestamp(),
      createdAtIso: new Date().toISOString(),
    });
    id = ref.id;
  }

  const stars = '★'.repeat(parsed.rating) + '☆'.repeat(5 - parsed.rating);
  const sent = await sendResend({
    to: ownerNotifyTo(),
    subject: `New homepage feedback (${parsed.rating}/5) from ${parsed.name}`,
    html: `
      <p><strong>Rating:</strong> ${stars} (${parsed.rating}/5)</p>
      <p><strong>Name:</strong> ${parsed.name}</p>
      <p><strong>Email:</strong> ${parsed.email || '—'}</p>
      <p><strong>Feedback:</strong></p>
      <p>${parsed.text}</p>
    `,
  });
  if (!sent?.ok && !sent?.skipped) {
    console.error('feedback owner email failed', sent);
  }

  return json(res, { ok: true, id });
}, { secrets: RESEND_SECRETS });

module.exports = { feedback };
