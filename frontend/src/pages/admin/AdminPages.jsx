import React, { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { inr } from '@/lib/utils';
import { adminApi } from '@/lib/adminApi';
import { productInStock } from '@/lib/commerceStore';
import { AiInventoryBar } from './AiInventoryBar';

const STATUS_OPTS = ['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'pending_cod'];
const statusLabel = (s) => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function AdminOrders() {
  const [filter, setFilter] = useState('all');
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const [manual, setManual] = useState({ recipientName: '', recipientPhone: '', total: '', paymentMethod: 'whatsapp' });

  useEffect(() => {
    setErr('');
    const from = new Date(Date.now() - 86400000 * 365).toISOString();
    const to = new Date().toISOString();
    return adminApi.subscribeOrders(
      { status: filter, from, to },
      setRows,
      (e) => setErr(e?.message || 'Could not load live orders.'),
    );
  }, [filter]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-4">Orders</h1>
      {err && <p className="mb-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{err}</p>}
      <div className="flex flex-wrap gap-2 mb-4">
        {['all', ...STATUS_OPTS].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-[13px] font-medium ${filter === s ? 'bg-brand-900 text-white' : 'bg-white border border-line text-brand-900'}`}>
            {s === 'all' ? 'All' : statusLabel(s)}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-line bg-white overflow-hidden mb-8">
        {rows.map((o) => (
          <div key={o.orderId} className="grid md:grid-cols-[1fr_1fr_120px_120px_180px] gap-3 items-center px-4 py-3 border-b border-line last:border-0">
            <div>
              <div className="font-mono font-semibold">#{o.orderId}</div>
              <div className="text-[11px] text-ink-500">{new Date(o.createdAt).toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div className="text-sm">{o.recipientName}</div>
              <div className="text-[12px] text-ink-500">{o.recipientPhone}</div>
            </div>
            <div className="capitalize text-sm">{o.paymentMethod}</div>
            <div className="font-semibold">{inr(o.total)}</div>
            <select
              value={o.orderStatus}
              onChange={(e) => {
                const next = e.target.value;
                adminApi.setStatus(o.orderId, next).catch((error) => {
                  setErr(error?.message || 'Could not update order status.');
                  e.target.value = o.orderStatus;
                });
              }}
              className="sk-input !py-1.5 !text-sm"
            >
              {STATUS_OPTS.map((x) => <option key={x} value={x}>{statusLabel(x)}</option>)}
            </select>
          </div>
        ))}
        {!rows.length && <div className="px-4 py-8 text-center text-ink-500 text-sm">No orders yet.</div>}
      </div>

      <h2 className="font-display text-xl font-bold mb-3">Log WhatsApp / phone order</h2>
      <form
        className="grid md:grid-cols-4 gap-2 items-end max-w-3xl"
        onSubmit={(e) => {
          e.preventDefault();
          setErr('');
          adminApi.createManual({ ...manual, total: Number(manual.total) }).then(() => {
            setManual({ recipientName: '', recipientPhone: '', total: '', paymentMethod: 'whatsapp' });
          }).catch((error) => setErr(error?.message || 'Could not save this order.'));
        }}
      >
        <input className="sk-input" placeholder="Recipient name" value={manual.recipientName} onChange={(e) => setManual({ ...manual, recipientName: e.target.value })} required />
        <input className="sk-input" placeholder="Phone" value={manual.recipientPhone} onChange={(e) => setManual({ ...manual, recipientPhone: e.target.value })} />
        <input className="sk-input" placeholder="Total ₹" type="number" value={manual.total} onChange={(e) => setManual({ ...manual, total: e.target.value })} required />
        <div className="flex gap-2">
          <select className="sk-input" value={manual.paymentMethod} onChange={(e) => setManual({ ...manual, paymentMethod: e.target.value })}>
            <option value="whatsapp">WhatsApp</option>
            <option value="cod">COD</option>
          </select>
          <button className="sk-btn-primary !py-2.5" type="submit">Add</button>
        </div>
      </form>
    </div>
  );
}

export function AdminProducts() {
  const [q, setQ] = useState('');
  const [list, setList] = useState([]);
  const [err, setErr] = useState('');
  const [source, setSource] = useState('firestore');
  const [seeding, setSeeding] = useState(false);

  useEffect(() => adminApi.subscribeProducts(
    { activeOnly: false },
    (rows, meta) => {
      setList(rows);
      setSource(meta?.source || 'firestore');
    },
    (e) => setErr(e?.message || 'Could not load products.'),
  ), []);

  const publishCatalog = async () => {
    setSeeding(true);
    setErr('');
    try {
      const result = await adminApi.seedCatalog();
      if (result.existing) {
        setErr(`Firestore already has ${result.existing} products.`);
      }
    } catch (error) {
      setErr(error?.message || 'Could not publish the catalog.');
    } finally {
      setSeeding(false);
    }
  };

  const filtered = list.filter((p) => (p.name || '').toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Products</h1>
          <p className="text-sm text-ink-500 mt-1">
            {source === 'firestore'
              ? `${list.length} products in Firestore`
              : `${list.length} products from the site catalog — publish them to Firestore to edit live stock.`}
          </p>
        </div>
        {source !== 'firestore' ? (
          <button type="button" className="sk-btn-primary text-sm" onClick={publishCatalog} disabled={seeding}>
            <Plus size={14} /> {seeding ? 'Publishing…' : 'Publish catalog to Firestore'}
          </button>
        ) : (
          <button type="button" className="sk-btn-primary text-sm" onClick={publishCatalog} disabled={seeding}>
            <Plus size={14} /> {seeding ? 'Publishing…' : 'Sync catalog'}
          </button>
        )}
      </div>
      {err && <p className="mb-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{err}</p>}
      <div className="relative max-w-sm mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." className="sk-input has-leading-icon !py-2" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((p) => {
          const ok = productInStock(p);
          const pack = p.weightVariants?.[0];
          return (
            <div key={p.id} className="rounded-xl border border-line bg-white overflow-hidden">
              <div className="aspect-square bg-cream-200 overflow-hidden">
                <img src={p.images?.[0] || p.img} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <div className="font-display font-bold leading-tight">{p.name}{pack?.weight ? ` (${pack.weight})` : ''}</div>
                <div className="text-sm mt-1">{inr(pack?.price ?? p.price)}</div>
                <span className={`mt-2 inline-flex text-[10px] font-bold px-2 py-0.5 rounded ${ok ? 'bg-[#D9F0D2] text-[#2E7D32]' : 'bg-red-100 text-red-600'}`}>{ok ? 'IN STOCK' : 'OUT OF STOCK'}</span>
              </div>
            </div>
          );
        })}
      </div>
      {!filtered.length && (
        <div className="rounded-xl border border-line bg-white px-4 py-8 text-center text-ink-500 text-sm">
          No products to show. Publish the catalog to Firestore, then refresh.
        </div>
      )}
    </div>
  );
}

export function AdminInventory() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-2">AI Inventory</h1>
      <p className="text-sm text-ink-500 mb-4">
        Type a stock or price command, then Preview. Apply writes to Firestore only after you confirm.
        If Preview fails, restart the frontend so the Gemini route can load.
      </p>
      <AiInventoryBar onApplied={() => window.dispatchEvent(new Event('sk-catalog-updated'))} />
    </div>
  );
}

export function AdminPayments() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  useEffect(() => {
    const from = new Date(Date.now() - 86400000 * 365).toISOString();
    const to = new Date().toISOString();
    return adminApi.subscribeOrders({ from, to }, setRows, (e) => setErr(e?.message || 'Could not load payments.'));
  }, []);
  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-4">Payments</h1>
      {err && <p className="mb-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{err}</p>}
      <div className="rounded-xl border border-line bg-white overflow-hidden">
        {rows.map((o) => (
          <div key={o.orderId} className="grid grid-cols-4 gap-3 px-4 py-3 border-b border-line last:border-0 text-sm">
            <div className="font-mono">#{o.orderId}</div>
            <div className="capitalize">{o.paymentMethod}</div>
            <div className="capitalize">{o.paymentStatus}</div>
            <div className="font-semibold">{inr(o.total)}</div>
          </div>
        ))}
        {!rows.length && <div className="px-4 py-8 text-center text-ink-500 text-sm">No payments yet.</div>}
      </div>
    </div>
  );
}

export function AdminSettings() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-4">Settings</h1>
      <div className="rounded-xl border border-line bg-white p-5 max-w-xl space-y-3 text-sm">
        <p>Orders, payments, and inventory in this admin panel come from Firestore. Status changes save immediately.</p>
        <p>Set <code className="bg-cream-200 px-1 rounded">REACT_APP_FIREBASE_*</code>, Razorpay, and Gemini keys in environment variables — never in client bundles except the public Firebase config.</p>
      </div>
    </div>
  );
}

export function AdminCustomers() {
  return <AdminOrders />;
}

export function AdminOffers() {
  return <AdminSettings />;
}
