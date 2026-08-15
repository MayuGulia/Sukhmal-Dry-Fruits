import React, { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { inr } from '@/lib/utils';
import { adminApi } from '@/lib/adminApi';
import { subscribeCatalog, productInStock } from '@/lib/commerceStore';
import { AiInventoryBar } from './AiInventoryBar';

const STATUS_OPTS = ['pending', 'confirmed', 'in_preparation', 'dispatched', 'delivered', 'cancelled', 'pending_cod'];
const statusLabel = (s) => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function AdminOrders() {
  const [filter, setFilter] = useState('all');
  const [rows, setRows] = useState([]);
  const [manual, setManual] = useState({ recipientName: '', recipientPhone: '', total: '', paymentMethod: 'whatsapp' });

  const reload = () => adminApi.orders({ status: filter, from: new Date(Date.now() - 86400000 * 45).toISOString(), to: new Date().toISOString() }).then(setRows);

  useEffect(() => {
    reload();
    return subscribeCatalog(reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-4">Orders</h1>
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
            <select value={o.orderStatus} onChange={(e) => adminApi.setStatus(o.orderId, e.target.value).then(reload)} className="sk-input !py-1.5 !text-sm">
              {STATUS_OPTS.map((x) => <option key={x} value={x}>{statusLabel(x)}</option>)}
            </select>
          </div>
        ))}
      </div>

      <h2 className="font-display text-xl font-bold mb-3">Log WhatsApp / phone order</h2>
      <form
        className="grid md:grid-cols-4 gap-2 items-end max-w-3xl"
        onSubmit={(e) => {
          e.preventDefault();
          adminApi.createManual({ ...manual, total: Number(manual.total) }).then(() => {
            setManual({ recipientName: '', recipientPhone: '', total: '', paymentMethod: 'whatsapp' });
            reload();
          });
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
  const reload = () => adminApi.products({ activeOnly: false }).then(setList);
  useEffect(() => {
    reload();
    return subscribeCatalog(reload);
  }, []);
  const filtered = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-3xl font-bold">Products</h1>
        <button type="button" className="sk-btn-primary text-sm"><Plus size={14} /> Add Product</button>
      </div>
      <div className="relative max-w-sm mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." className="sk-input pl-9 !py-2" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((p) => {
          const ok = productInStock(p);
          const pack = p.weightVariants?.[0];
          return (
            <div key={p.id} className="rounded-xl border border-line bg-white overflow-hidden">
              <div className="aspect-square bg-cream-200 overflow-hidden"><img src={p.images?.[0]} alt="" className="w-full h-full object-cover" /></div>
              <div className="p-3">
                <div className="font-display font-bold leading-tight">{p.name}{pack?.weight ? ` (${pack.weight})` : ''}</div>
                <div className="text-sm mt-1">{inr(pack?.price ?? p.price)}</div>
                <span className={`mt-2 inline-flex text-[10px] font-bold px-2 py-0.5 rounded ${ok ? 'bg-[#D9F0D2] text-[#2E7D32]' : 'bg-red-100 text-red-600'}`}>{ok ? 'IN STOCK' : 'OUT OF STOCK'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AdminInventory() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-2">AI Inventory</h1>
      <p className="text-sm text-ink-500 mb-4">Preview a command, review the diff, then Apply. Nothing is written until you confirm.</p>
      <AiInventoryBar onApplied={() => window.dispatchEvent(new Event('sk-catalog-updated'))} />
    </div>
  );
}

export function AdminPayments() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    adminApi.orders({ from: new Date(Date.now() - 86400000 * 45).toISOString(), to: new Date().toISOString() }).then(setRows);
  }, []);
  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-4">Payments</h1>
      <div className="rounded-xl border border-line bg-white overflow-hidden">
        {rows.map((o) => (
          <div key={o.orderId} className="grid grid-cols-4 gap-3 px-4 py-3 border-b border-line last:border-0 text-sm">
            <div className="font-mono">#{o.orderId}</div>
            <div className="capitalize">{o.paymentMethod}</div>
            <div className="capitalize">{o.paymentStatus}</div>
            <div className="font-semibold">{inr(o.total)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminSettings() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-4">Settings</h1>
      <div className="rounded-xl border border-line bg-white p-5 max-w-xl space-y-3 text-sm">
        <p>Admin session lasts 1 hour on Firebase. Local demo stores catalog changes in this browser only until Firestore is connected.</p>
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
