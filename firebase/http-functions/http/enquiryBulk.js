const { json, readJsonBody, httpsFn, RESEND_SECRETS } = require('../_shared/httpFn');
const { adminDb } = require('../_shared/firebaseAdmin');
const { notifyOwnerOfEnquiry } = require('../_shared/notify');

function strip(value, max) {
  return String(value || '').replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim().slice(0, max);
}

function requestPath(req) {
  return String(req.originalUrl || req.url || req.path || '');
}

function isContactEnquiry(req, body = {}) {
  return body.type === 'contact' || /enquiry\/contact/i.test(requestPath(req));
}

async function saveRow(collection, row) {
  const admin = await adminDb();
  if (!admin) return null;
  const ref = await admin.db.collection(collection).add({
    ...row,
    createdAt: admin.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

const enquiryBulk = httpsFn(async (req, res) => {
  if (req.method !== 'POST') return json(res, { error: 'method' }, 405);
  const body = readJsonBody(req);

  if (isContactEnquiry(req, body)) {
    const first = strip(body.first || body.firstName, 80);
    const last = strip(body.last || body.lastName, 80);
    const name = strip(body.name, 80) || [first, last].filter(Boolean).join(' ').trim();
    const email = strip(body.email, 120);
    const phone = strip(body.phone, 20);
    const subject = strip(body.subject, 160);
    const qtype = strip(body.qtype || body.queryType, 40) || 'General';
    const orderId = strip(body.orderId, 40);
    const message = strip(body.msg || body.message, 2000);
    if (name.length < 2) return json(res, { error: 'invalid_name' }, 400);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, { error: 'invalid_email' }, 400);
    if (message.length < 4) return json(res, { error: 'invalid_message' }, 400);

    const row = {
      type: 'contact',
      name,
      first,
      last,
      email,
      phone,
      subject,
      qtype,
      orderId,
      message,
      status: 'new',
    };
    const id = await saveRow('contactInquiries', row);
    const sent = await notifyOwnerOfEnquiry({
      subject: `Contact form: ${subject || qtype} from ${name}`,
      replyTo: email,
      fields: {
        Name: name,
        Email: email,
        Phone: phone,
        Subject: subject,
        'Query type': qtype,
        'Order ID': orderId,
        Message: message,
      },
    });
    return json(res, { ok: true, id, ownerNotified: Boolean(sent?.ok) });
  }

  const digits = String(body.phone || '').replace(/\D/g, '');
  const phone = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits.slice(-10);
  if (!/^[6-9]\d{9}$/.test(phone)) return json(res, { error: 'invalid_phone' }, 400);
  const email = strip(body.email, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, { error: 'invalid_email' }, 400);

  const row = {
    type: 'bulk',
    companyName: strip(body.company || body.companyName, 120),
    name: strip(body.name, 80),
    contact: strip(body.name || body.contact, 80),
    phone,
    email,
    quantity: strip(body.qty || body.quantity, 40),
    occasion: strip(body.occasion, 80),
    notes: strip(body.notes, 500),
    budget: strip(body.budget, 40),
    status: 'new',
  };

  const id = await saveRow('bulkInquiries', row);
  const sent = await notifyOwnerOfEnquiry({
    subject: `Bulk enquiry${row.occasion ? ` (${row.occasion})` : ''} from ${row.name || row.companyName || phone}`,
    replyTo: email,
    fields: {
      Company: row.companyName,
      Name: row.name,
      Phone: phone,
      Email: email,
      Quantity: row.quantity,
      Occasion: row.occasion,
      Budget: row.budget,
      Notes: row.notes,
    },
  });
  return json(res, { ok: true, id, ownerNotified: Boolean(sent?.ok) });
}, { secrets: RESEND_SECRETS });

module.exports = { enquiryBulk };
