import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/Breadcrumb';
import { Search, CheckCircle2, Package, Truck, Home as HomeIcon, Info, PhoneCall } from 'lucide-react';

const STEPS = [
  { key: 'confirmed', label: 'Confirmed', Ic: CheckCircle2 },
  { key: 'packed', label: 'Packed', Ic: Package },
  { key: 'shipped', label: 'Shipped', Ic: Truck },
  { key: 'ofd', label: 'Out for Delivery', Ic: Truck },
  { key: 'delivered', label: 'Delivered', Ic: HomeIcon },
];

export default function TrackOrder() {
  const [id, setId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!id.trim()) { setError('Please enter an order ID'); return; }
    // simulate lookup
    setResult({
      id: id.trim(),
      date: 'Wed, 14 Jan 2025',
      recipient: 'Priya Sharma',
      paymentStatus: 'Paid • UPI',
      amount: 1499,
      status: 'shipped',
      partner: 'Blue Dart',
      awb: 'BDT12345678IN',
      timeline: [
        { at: 'Mon 10:15 AM', text: 'Order confirmed — payment received' },
        { at: 'Mon 4:30 PM', text: 'Packing started at Delhi facility' },
        { at: 'Tue 9:00 AM', text: 'Order packed & handed to Blue Dart' },
        { at: 'Wed 6:00 AM', text: 'Shipment departed Delhi hub' },
      ]
    });
  };

  const statusIdx = result ? STEPS.findIndex((s) => s.key === result.status) : -1;

  return (
    <div>
      <PageHeader title="Track Your Order" subtitle="Enter your order ID to see live delivery status." breadcrumb={[{ label: 'Track Order' }]} />
      <div className="sk-container py-8 max-w-4xl">
        <form onSubmit={submit} className="sk-card p-5 flex gap-2">
          <input value={id} onChange={(e) => setId(e.target.value)} data-testid="track-input" placeholder="e.g. ord_abc123def456" className="sk-input" />
          <button className="sk-btn-primary whitespace-nowrap"><Search size={16} /> Track</button>
        </form>
        {error && <div className="mt-3 text-sm text-[var(--sk-red-500)]">{error}</div>}

        {result && (
          <div className="mt-8 space-y-6">
            <div className="sk-card p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><div className="text-[11px] uppercase text-ink-500">Order ID</div><div className="font-mono font-bold text-brand-900">{result.id}</div></div>
              <div><div className="text-[11px] uppercase text-ink-500">Placed On</div><div className="font-semibold text-brand-900">{result.date}</div></div>
              <div><div className="text-[11px] uppercase text-ink-500">Recipient</div><div className="font-semibold text-brand-900">{result.recipient}</div></div>
              <div><div className="text-[11px] uppercase text-ink-500">Payment</div><div className="font-semibold text-brand-900">₹{result.amount} • {result.paymentStatus}</div></div>
            </div>

            {/* Stepper */}
            <div className="sk-card p-6">
              <div className="font-display font-bold text-brand-900 text-lg mb-4">Shipment Progress</div>
              <div className="hidden md:flex items-center justify-between">
                {STEPS.map((s, i) => (
                  <React.Fragment key={s.key}>
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-11 h-11 rounded-full grid place-items-center ${i <= statusIdx ? 'bg-[var(--sk-green-500)] text-white' : 'bg-cream-300 text-ink-500'}`}><s.Ic size={20} /></div>
                      <div className={`mt-2 text-[12px] ${i <= statusIdx ? 'text-brand-900 font-semibold' : 'text-ink-500'}`}>{s.label}</div>
                    </div>
                    {i < STEPS.length - 1 && <div className={`h-[3px] flex-1 rounded ${i < statusIdx ? 'bg-[var(--sk-green-500)]' : 'bg-cream-300'}`} />}
                  </React.Fragment>
                ))}
              </div>
              {/* Mobile vertical */}
              <ol className="md:hidden space-y-3">
                {STEPS.map((s, i) => (
                  <li key={s.key} className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full grid place-items-center ${i <= statusIdx ? 'bg-[var(--sk-green-500)] text-white' : 'bg-cream-300 text-ink-500'}`}><s.Ic size={16} /></div>
                    <div className={`font-semibold ${i <= statusIdx ? 'text-brand-900' : 'text-ink-500'}`}>{s.label}</div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="sk-card p-5">
              <div className="font-display font-bold text-brand-900 text-lg mb-3">Tracking Timeline</div>
              <ol className="space-y-3 border-l-2 border-line pl-4">
                {result.timeline.map((t, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[9px] top-1 w-3 h-3 rounded-full bg-brand-900" />
                    <div className="text-[12px] text-ink-500">{t.at}</div>
                    <div className="font-medium text-brand-900">{t.text}</div>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <div className="sk-pill">Partner: {result.partner}</div>
                <div className="sk-pill">AWB: {result.awb}</div>
                <a href="tel:+919876543210" className="sk-btn-ghost"><PhoneCall size={14} /> Support: +91 98765 43210</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
