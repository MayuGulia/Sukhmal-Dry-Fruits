const { json, readJsonBody, httpsFn } = require('../_shared/httpFn');
const { addResendContact } = require('../_shared/resendContact');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const subscribe = httpsFn(async (req, res) => {
    if (req.method !== 'POST') return json(res, { error: 'method' }, 405);
    const body = readJsonBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return json(res, { error: 'invalid_email', message: 'Please enter a valid email address.' }, 400);
    }
    try {
      const result = await addResendContact(email);
      return json(res, {
        ok: true,
        already: Boolean(result.already),
        skipped: Boolean(result.skipped),
        message: result.already ? 'You’re already subscribed.' : 'You’re subscribed. Welcome to Sukhmal.',
      });
    } catch {
      return json(res, { ok: true, message: 'You’re subscribed. Welcome to Sukhmal.' });
    }
});

module.exports = { subscribe };
