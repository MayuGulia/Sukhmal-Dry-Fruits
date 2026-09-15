const r = await fetch('http://127.0.0.1:3001/api/generate-hamper-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hamperName: 'Classic Four Nut Basket',
    boxType: 'Woven Basket',
    products: ['California Almonds 250g'],
    productSelections: [{ productId: 'mp1', name: 'California Almonds', weight: '250g', qty: 1 }],
  }),
});
const body = await r.json();
const url = String(body.url || '');
const svg = decodeURIComponent(url.replace(/^data:image\/svg\+xml;charset=utf-8,/, ''));
console.log(JSON.stringify({
  status: r.status,
  demo: body.demo,
  demoLabel: body.demoLabel,
  mime: body.views?.[0]?.mimeType,
  viewLabel: body.views?.[0]?.label,
  hamperName: body.hamperName,
  products: body.products,
  urlPrefix: url.slice(0, 72),
  urlLen: url.length,
  containsBanner: svg.includes('DEMO PREVIEW — NOT AI GENERATED'),
  svgHead: svg.slice(0, 700),
}, null, 2));
