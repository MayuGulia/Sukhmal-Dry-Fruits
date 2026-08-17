import React from 'react';
import { useLocation } from 'react-router-dom';
import SeoHead from './SeoHead';
import { resolveRouteSeo } from './pageMeta';
import { localBusinessSchema } from './schemas';

export default function RouteSeo() {
  const { pathname } = useLocation();
  const meta = resolveRouteSeo(pathname);
  const jsonLd = [...(meta.jsonLd || [])];
  const hasLocal = jsonLd.some((b) => b?.['@type'] === 'LocalBusiness');
  if (!meta.noindex && !hasLocal) jsonLd.push(localBusinessSchema());
  return <SeoHead {...meta} jsonLd={jsonLd} />;
}
