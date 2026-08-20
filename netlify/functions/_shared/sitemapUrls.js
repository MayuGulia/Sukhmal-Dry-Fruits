import { CATEGORIES, HAMPERS, PRODUCTS } from '../../../frontend/src/data/mockCatalog.js';

const SITE = 'https://sukhmaldryfruits.com';

export function sitemapEntries() {
  const staticPaths = [
    ['/', 1],
    ['/gift-hampers', 0.9],
    ['/wedding-gifts', 0.8],
    ['/corporate-gifts', 0.8],
    ['/festival-collections', 0.8],
    ['/build-hamper/budget', 0.7],
    ['/offers', 0.6],
    ['/about-us', 0.5],
    ['/contact-us', 0.5],
    ['/store-locator', 0.5],
    ['/faqs', 0.4],
    ['/shipping-delivery', 0.4],
    ['/privacy-policy', 0.3],
    ['/terms-conditions', 0.3],
  ];
  return [
    ...staticPaths.map(([path, priority]) => ({ path, priority })),
    ...CATEGORIES.map((c) => ({ path: `/category/${c.slug}`, priority: 0.8 })),
    ...PRODUCTS.filter((p) => p.slug).map((p) => ({ path: `/product/${p.slug}`, priority: 0.7 })),
    ...HAMPERS.filter((h) => h.slug).map((h) => ({ path: `/gift-hampers/${h.slug}`, priority: 0.8 })),
  ].map((row) => ({
    url: `${SITE}${row.path === '/' ? '/' : row.path}`,
    priority: row.priority,
  }));
}

export function buildSitemapXml() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = sitemapEntries()
    .map(
      ({ url, priority }) => `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
