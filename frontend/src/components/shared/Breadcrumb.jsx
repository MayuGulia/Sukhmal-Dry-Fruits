import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb({ items }) {
  return (
    <nav className="text-[12px] text-ink-500 flex items-center gap-1.5 flex-wrap">
      <Link to="/" className="inline-flex items-center gap-1 hover:text-brand-900"><Home size={12} /> Home</Link>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          <ChevronRight size={12} />
          {it.to ? <Link to={it.to} className="hover:text-brand-900">{it.label}</Link> : <span className="text-brand-900 font-medium">{it.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}

export function PageHeader({ title, subtitle, breadcrumb }) {
  return (
    <div className="bg-cream-200 border-b border-line">
      <div className="sk-container py-8 md:py-12">
        {breadcrumb && <div className="mb-3"><Breadcrumb items={breadcrumb} /></div>}
        <h1 className="font-display font-bold text-brand-900 text-3xl md:text-5xl leading-tight">{title}</h1>
        {subtitle && <p className="text-ink-600 mt-2 max-w-2xl text-sm md:text-base">{subtitle}</p>}
      </div>
    </div>
  );
}
