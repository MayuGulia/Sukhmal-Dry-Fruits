/**
 * Replace static estimate / manual tracking entry with DTDC API
 * once API key is available — DTDC will provide real-time status + ETA.
 */

const NCR_PREFIXES = ['110', '121', '122', '201', '124', '131', '250'];
const METRO_PREFIXES = ['400', '401', '410', '411', '412', '500', '560', '562', '600', '700', '380', '382', '395', '302', '226', '160', '682', '641'];

function fmt(d) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function addDays(from, days) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

function zoneForPincode(pincode) {
  const pin = String(pincode || '').replace(/\D/g, '').slice(0, 6);
  const prefix = pin.slice(0, 3);
  if (pin.length === 6 && NCR_PREFIXES.includes(prefix)) return 'ncr';
  if (pin.length === 6 && METRO_PREFIXES.includes(prefix)) return 'metro';
  return 'rest';
}

export function estimateDeliveryByPincode(pincode, from = new Date()) {
  // TODO: Replace static estimate / manual tracking entry with DTDC API
  // once API key is available — DTDC will provide real-time status + ETA.
  const zone = zoneForPincode(pincode);
  const days = zone === 'ncr'
    ? { min: 1, max: 2, window: '1–2 business days', zoneLabel: 'NCR' }
    : zone === 'metro'
      ? { min: 3, max: 4, window: '3–4 business days', zoneLabel: 'Metro' }
      : { min: 5, max: 7, window: '5–7 business days', zoneLabel: 'Rest of India' };
  const start = addDays(from, days.min);
  const end = addDays(from, days.max);
  const label = `${fmt(start)} – ${fmt(end)}`;
  return {
    zone,
    minDays: days.min,
    maxDays: days.max,
    window: days.window,
    zoneLabel: days.zoneLabel,
    start: start.toISOString(),
    end: end.toISOString(),
    label,
    estimatedDeliveryDate: label,
    detail: `${days.zoneLabel} · ${days.window}`,
  };
}
