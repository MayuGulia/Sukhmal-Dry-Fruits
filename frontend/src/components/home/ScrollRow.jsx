import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Horizontal scroller with optional desktop arrow controls. */
export default function ScrollRow({ children, className = '', itemClassName = '', testId }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [update, children]);

  const scrollBy = (dir) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(360, el.clientWidth * 0.7), behavior: 'smooth' });
  };

  return (
    <div className={`relative group/scroll ${className}`} data-testid={testId}>
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => scrollBy(-1)}
        disabled={!canLeft}
        className="hidden md:grid absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 z-10 h-10 w-10 place-items-center rounded-full bg-white border border-[var(--sk-line-strong)] shadow-sk-md text-brand-900 disabled:opacity-30 hover:bg-cream-200 transition-opacity"
      >
        <ChevronLeft size={20} />
      </button>
      <div ref={ref} className={`sk-scroll-x scrollbar-none ${itemClassName}`} style={{ scrollbarWidth: 'none' }}>
        {children}
      </div>
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scrollBy(1)}
        disabled={!canRight}
        className="hidden md:grid absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 z-10 h-10 w-10 place-items-center rounded-full bg-white border border-[var(--sk-line-strong)] shadow-sk-md text-brand-900 disabled:opacity-30 hover:bg-cream-200 transition-opacity"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
