import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/Breadcrumb';
import { PRODUCTS } from '@/data/mockCatalog';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { inr } from '@/lib/utils';

export default function Wishlist() {
  const { ids, toggle, clear } = useWishlist();
  const { add } = useCart();
  const items = PRODUCTS.filter((p) => ids.includes(p.id));

  return (
    <div>
      <PageHeader title="My Wishlist" subtitle={`${items.length} saved item${items.length !== 1 ? 's' : ''}`} breadcrumb={[{ label: 'Wishlist' }]} />
      <div className="sk-container py-8">
        {items.length === 0 ? (
          <div className="sk-card p-10 text-center max-w-lg mx-auto">
            <Heart size={40} className="mx-auto text-brand-900" />
            <div className="font-display text-2xl mt-3 text-brand-900">Your wishlist is empty</div>
            <p className="text-ink-600 mt-2">Save favourites by tapping the heart icon on any product.</p>
            <Link to="/category/all" className="sk-btn-primary mt-4 inline-flex">Browse Products</Link>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4 gap-2">
              <button onClick={() => { items.forEach((p) => add(p, { qty: 1, variant: p.variants?.[0] })); }} className="sk-btn-primary text-sm"><ShoppingBag size={14} /> Move All to Cart</button>
              <button onClick={clear} className="sk-btn-outline text-sm"><Trash2 size={14} /> Clear</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {items.map((p) => (
                <div key={p.id} className="sk-card overflow-hidden">
                  <Link to={`/product/${p.slug}`} className="block aspect-square bg-cream-200"><img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /></Link>
                  <div className="p-3">
                    <div className="font-semibold text-brand-900 line-clamp-1">{p.name}</div>
                    <div className="font-display font-bold text-brand-900 mt-0.5">{inr(p.price)}</div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button onClick={() => { add(p, { qty: 1, variant: p.variants?.[0] }); toggle(p.id); }} className="sk-btn-primary text-[12px] !py-1.5"><ShoppingBag size={12} /> Cart</button>
                      <button onClick={() => toggle(p.id)} className="sk-btn-outline text-[12px] !py-1.5"><Trash2 size={12} /> Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
