const ORDER_STATUSES = [
  'Placed',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

const LEGACY_TO_STATUS = {
  placed: 'Placed',
  pending: 'Placed',
  pending_cod: 'Placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  in_preparation: 'Packed',
  shipped: 'Shipped',
  dispatched: 'Shipped',
  ofd: 'Out for Delivery',
  out_for_delivery: 'Out for Delivery',
  'out for delivery': 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function canonicalStatus(raw) {
  const value = String(raw || '').trim();
  if (ORDER_STATUSES.includes(value) || value === 'Cancelled') return value;
  return LEGACY_TO_STATUS[value.toLowerCase()] || 'Placed';
}

function statusSlug(raw) {
  const status = canonicalStatus(raw);
  if (status === 'Out for Delivery') return 'ofd';
  if (status === 'Cancelled') return 'cancelled';
  return status.toLowerCase();
}

function statusIndex(raw) {
  const idx = ORDER_STATUSES.indexOf(canonicalStatus(raw));
  return idx < 0 ? 0 : idx;
}

function isShippedStatus(raw) {
  return canonicalStatus(raw) === 'Shipped';
}

function isDispatchStatus(raw) {
  return statusIndex(raw) >= ORDER_STATUSES.indexOf('Shipped');
}

function courierTrackingUrl(courierName, trackingNumber) {
  const code = String(trackingNumber || '').trim();
  if (!code) return 'https://www.dtdc.in/tracking';
  const q = encodeURIComponent(code);
  const courier = String(courierName || 'DTDC').toLowerCase();
  if (courier.includes('delhivery')) return `https://www.delhivery.com/track/package/${q}`;
  if (courier.includes('bluedart') || courier.includes('blue dart')) {
    return `https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo=${q}`;
  }
  if (courier.includes('india post') || courier.includes('speed post')) {
    return 'https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx';
  }
  return `https://www.dtdc.in/tracking?consignmentNo=${q}`;
}

module.exports = {
  ORDER_STATUSES,
  canonicalStatus,
  statusSlug,
  statusIndex,
  isShippedStatus,
  isDispatchStatus,
  courierTrackingUrl,
};
