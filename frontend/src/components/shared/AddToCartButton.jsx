import React, { useEffect, useRef, useState } from 'react';
import { Ban, Minus, Plus, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cartLineKey, useCart } from '@/contexts/CartContext';

export function hamperAsProduct(h, extraMeta = {}) {
  const image = h.image || (Array.isArray(h.images) ? h.images[0] : '');
  return {
    id: h.id,
    name: h.name,
    image,
    images: (Array.isArray(h.images) && h.images.length ? h.images : [image]).filter(Boolean),
    slug: h.slug,
    price: h.price,
    meta: { type: 'hamper', ...extraMeta },
  };
}

export function hamperVariant(h) {
  return { w: h.weight, price: h.price };
}

/**
 * Larger circular + / Add to Cart morphs into the spec quantity pill.
 * No popup — quantity lives on the same control.
 */
export default function AddToCartButton({
  product,
  variant,
  source = 'product',
  max,
  disabled = false,
  layout = 'card',
  addLabel = 'Add to Cart',
  testId,
  className,
  meta,
  onAdded,
}) {
  const { items, add, updateQty } = useCart();
  const key = cartLineKey(product, { variant, source });
  const qty = items.find((x) => x.key === key)?.qty || 0;
  const oos = Boolean(disabled);
  const isBar = layout === 'bar' || layout === 'gold';
  const inCart = qty > 0;
  const atMax = typeof max === 'number' && qty >= max;
  const [pop, setPop] = useState(false);
  const prevQty = useRef(qty);

  useEffect(() => {
    if (qty === prevQty.current) return undefined;
    const grew = qty > prevQty.current;
    prevQty.current = qty;
    if (!grew || qty <= 0) return undefined;
    setPop(true);
    const t = setTimeout(() => setPop(false), 340);
    return () => clearTimeout(t);
  }, [qty]);

  const inc = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (oos) return;
    if (atMax) return;
    const wasEmpty = qty === 0;
    add(product, { qty: 1, variant, source, meta });
    if (wasEmpty) onAdded?.();
  };

  const dec = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    updateQty(key, qty - 1);
  };

  const shell = cn(
    'sk-qty',
    isBar ? 'sk-qty--bar' : 'sk-qty--card',
    !inCart && !oos && 'is-add',
    oos && 'is-oos',
    pop && 'is-pop',
    className,
  );

  if (oos) {
    return (
      <div className={cn(shell, 'is-oos')} data-testid={testId} role="group" aria-label="Out of stock">
        <span className="sk-qty-slot" aria-hidden>
          <Minus size={isBar ? 18 : 16} strokeWidth={2.25} />
        </span>
        <span className="sk-qty-div" aria-hidden />
        <span className="sk-qty-slot">
          <Ban size={isBar ? 18 : 16} strokeWidth={2} />
        </span>
        <span className="sk-qty-div" aria-hidden />
        <span className="sk-qty-slot" aria-hidden>
          <Plus size={isBar ? 18 : 16} strokeWidth={2.25} />
        </span>
      </div>
    );
  }

  if (!inCart) {
    return (
      <button
        type="button"
        onClick={inc}
        data-testid={testId}
        aria-label={addLabel}
        className={shell}
      >
        {isBar ? (
          <>
            <ShoppingBag size={18} strokeWidth={2} />
            <span>{addLabel}</span>
          </>
        ) : (
          <Plus size={18} strokeWidth={2.5} />
        )}
      </button>
    );
  }

  const iconPx = isBar ? 18 : 14;

  return (
    <div role="group" aria-label="Quantity in cart" data-testid={testId} className={shell}>
      <button type="button" className="sk-qty-slot" aria-label="Decrease quantity" onClick={dec}>
        <Minus size={iconPx} strokeWidth={2.25} />
      </button>
      <span className="sk-qty-div" aria-hidden />
      <span className="sk-qty-slot sk-qty-num" aria-live="polite">{qty}</span>
      <span className="sk-qty-div" aria-hidden />
      <button
        type="button"
        className="sk-qty-slot"
        aria-label="Increase quantity"
        onClick={inc}
        disabled={atMax}
      >
        <Plus size={iconPx} strokeWidth={2.25} />
      </button>
    </div>
  );
}
