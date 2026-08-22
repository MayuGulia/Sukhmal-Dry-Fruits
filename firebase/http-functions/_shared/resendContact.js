const { envGet } = require('./env');

function ownerNotifyTo() {
  return envGet('ADMIN_NOTIFY_EMAIL') || envGet('REACT_APP_ADMIN_EMAIL') || 'mayu.gulia156@gmail.com';
}

/** Same behavior as Netlify addResendContact. */
async function addResendContact(email) {
  const key = envGet('RESEND_API_KEY');
  if (!key) return { skipped: true, reason: 'missing_key' };
  const admin = ownerNotifyTo();
  const from = envGet('RESEND_FROM') || 'Sukhmal Dry Fruits <onboarding@resend.dev>';
  const send = async (to, subject, html) => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  try {
    await send(
      admin,
      `Newsletter signup: ${email}`,
      `<p>${email} joined the Sukhmal mailing list.</p>`,
    );
  } catch {}
  try {
    await send(
      email,
      'You’re on the Sukhmal list',
      '<p>Thanks for subscribing to Sukhmal Dry Fruits. We’ll send festive launches and member-only offers here.</p>',
    );
  } catch {}
  return { ok: true, already: false };
}

module.exports = { addResendContact, ownerNotifyTo };
