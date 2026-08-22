const { httpsFn } = require('../_shared/httpFn');

const sitemap = httpsFn(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).type('application/json').send(JSON.stringify({ error: 'method' }));
    return;
  }
  const { buildSitemapXml } = await import('../_shared/sitemapUrls.mjs');
  const xml = buildSitemapXml();
  res
    .status(200)
    .set({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    })
    .send(xml);
});

module.exports = { sitemap };
