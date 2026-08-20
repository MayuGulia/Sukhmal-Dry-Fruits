import { buildSitemapXml } from './_shared/sitemapUrls.js';

export default async () =>
  new Response(buildSitemapXml(), {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });

export const config = { path: '/sitemap.xml' };
