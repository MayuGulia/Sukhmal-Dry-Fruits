export const inr = (n) => `₹${(Math.round((n || 0) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const cn = (...args) => args.filter(Boolean).join(' ');

export const slug = (s) => (s || '').toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const gstAmount = (subtotal, rate = 0.05) => Math.round(subtotal * rate * 100) / 100;
