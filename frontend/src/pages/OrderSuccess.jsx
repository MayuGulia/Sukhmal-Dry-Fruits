import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/shared/Breadcrumb';
import { CheckCircle2, Package, MapPin, Truck, Copy } from 'lucide-react';
import ProductCard, { SectionHeader } from '@/components/shared/ProductCard';
import { useProducts, ProductSkeleton } from '@/lib/catalog';

export default function OrderSuccess() {
  const { orderId = 'ord_XXXXX' } = useParams();
  const { data: PRODUCTS, loading } = useProducts({ bestseller: true, limit: 6 });
  return (
    <div>
      <div className="bg-cream-300 relative overflow-hidden">
        <div className="sk-container py-14 md:py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--sk-green-500)] text-white mx-auto grid place-items-center animate-pulse"><CheckCircle2 size={32} /></div>
          <h1 className="font-display text-3xl md:text-5xl text-brand-900 font-bold mt-4">Order Placed Successfully!</h1>
          <p className="text-ink-600 mt-2">Thank you for shopping with Sukhmal. Your order is confirmed.</p>
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-line">
            <span className="text-sm text-ink-500">Order ID:</span>
            <span className="font-mono font-bold text-brand-900" data-testid="order-id">{orderId}</span>
            <button onClick={() => navigator.clipboard.writeText(orderId)} className="text-brand-900" aria-label="Copy"><Copy size={14} /></button>
          </div>
        </div>
      </div>

      <div className="sk-container py-10 grid md:grid-cols-3 gap-4">
        {[{Ic:Package,t:'Payment',s:'Received & Confirmed'},{Ic:MapPin,t:'Delivery To',s:'New Delhi, 110006'},{Ic:Truck,t:'Estimated Delivery',s:'Mon, 3–5 business days'}].map(({Ic,t,s}) => (
          <div key={t} className="sk-card p-5 flex items-center gap-3"><Ic size={26} className="text-brand-900" /><div><div className="text-[12px] text-ink-500">{t}</div><div className="font-semibold text-brand-900">{s}</div></div></div>
        ))}
      </div>

      <div className="sk-container pb-10 flex flex-wrap gap-3">
        <Link to="/track-order" className="sk-btn-primary"><Truck size={16} /> Track Your Order</Link>
        <Link to="/category/all" className="sk-btn-outline">Continue Shopping</Link>
      </div>

      <div className="sk-container pb-16">
        <SectionHeader title="You May Also Like" />
        <div className="sk-scroll-x md:grid md:grid-cols-4 md:gap-4 md:scroll-auto">
          {loading ? Array.from({length:6}).map((_,i)=><ProductSkeleton key={i} />) : PRODUCTS.slice(0, 6).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    </div>
  );
}

export function OrderFailed() {
  const { orderId = 'ord_XXXXX' } = useParams();
  return (
    <div className="sk-container py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--sk-red-500)] text-white mx-auto grid place-items-center">✕</div>
      <h1 className="font-display text-3xl md:text-4xl text-brand-900 font-bold mt-4">Payment Failed</h1>
      <p className="text-ink-600 mt-2 max-w-lg mx-auto">Your payment could not be processed. No amount has been debited. You may retry the payment for the same order or try a different method.</p>
      <div className="mt-4 text-sm text-ink-500">Order ID: <b className="text-brand-900">{orderId}</b></div>
      <div className="mt-6 flex justify-center gap-3 flex-wrap">
        <Link to="/checkout" className="sk-btn-primary">Retry Payment</Link>
        <Link to="/cart" className="sk-btn-outline">Back to Cart</Link>
      </div>
    </div>
  );
}
