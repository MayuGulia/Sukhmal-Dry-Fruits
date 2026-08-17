import { CATEGORIES, HAMPERS, PRODUCTS } from '@/data/mockCatalog';
import { FAQS, POLICIES } from '@/data/mockContent';
import {
  breadcrumbSchema,
  faqSchema,
  localBusinessSchema,
  organizationSchema,
  productSchema,
  websiteSchema,
} from './schemas';
import { clip, cleanPath, DEFAULT_OG_IMAGE } from './site';

const CTA = ' Order now. Free delivery above ₹799.';

export const HAMPER_INTRO =
  'Sukhmal premium dry fruit gift hampers are built for high-intent gifting in Delhi and across India — Diwali gift hampers online, wedding return gift dry fruits, Rakhi dry fruit gift boxes, and New Year corporate hampers. Every tray and rigid box is packed in Surajmal Vihar, East Delhi with graded cashews, almonds, pistachios and raisins in airtight pouches, then finished with ribbon-ready presentation. Choose by occasion, budget or weight; add a gift card in Build Your Own Hamper if you need a custom mix. Corporate teams get GST invoicing and bulk dispatch from 25 units. Families order pantry-plus-gift boxes with free delivery above ₹799. Browse the collection below, then order a ready hamper or build one around California almonds, 320-grade kaju, and festive namkeen.';

export const CATEGORY_COPY = {
  'dry-fruits': {
    title: 'Buy Dry Fruits Online Delhi | Sukhmal',
    description: 'Premium dry fruits online from East Delhi. Hygienically packed raisins, figs & more. Order now — free delivery above ₹799.',
    intro: 'Shop premium dry fruits online from Sukhmal Dry Fruits Korner in East Delhi. Our sun-dried raisins, figs, apricots and mixed dry fruit packs are handpicked, hygienically packed, and delivered pan-India. Whether you are stocking the pantry or assembling a Diwali gift hamper, every pack is graded for freshness and flavour. Buy dry fruits online Delhi families have trusted since our Surajmal Vihar store opened — no preservatives, vacuum-sealed pouches, and free delivery on orders above ₹799.',
  },
  nuts: {
    title: 'Premium Nuts Online | Cashews Almonds | Sukhmal',
    description: 'California almonds, 320-grade kaju, pistachios & walnuts. Buy premium nuts online. Order now, free delivery above ₹799.',
    intro: 'Sukhmal nuts are sourced for size, crunch and natural sweetness — from 320-grade whole cashews to California almonds, Iranian pistachios and Kashmiri walnuts. Packs are sorted, sealed and ready for daily snacking, sweets, or corporate gifting in Delhi NCR. Choose 250g, 500g or 1kg pouches. Every listing shows grade, allergen notes and best-for use so you can buy nuts online with confidence. Free delivery above ₹799 across India.',
  },
  seeds: {
    title: 'Seeds & Makhana Online | Sukhmal Dry Fruits',
    description: 'Roasted makhana, mixed seeds and pantry staples. 100% natural packs. Order now with free delivery above ₹799.',
    intro: 'From fox nuts (makhana) to mixed seed blends, Sukhmal seeds are roasted or packed natural — no artificial flavouring. They work as light snacks, festival namkeen bases, and healthy gifting add-ons. We pack in resealable pouches from our East Delhi facility so crunch lasts. Shop seeds online with the same hygiene standards as our nuts and dry fruits, with pan-India dispatch and free shipping above ₹799.',
  },
  dates: {
    title: 'Ajwa & Medjool Dates Online India | Sukhmal',
    description: 'Buy Ajwa and Medjool dates online in India. Premium, plump dates packed fresh. Order now — free delivery above ₹799.',
    intro: 'Dates are a Sukhmal staple for Ramadan, winter wellness, and luxury hampers. We list plump Medjool-style and Ajwa dates with clear pack sizes so you can compare Ajwa dates online India against everyday cooking dates. Each box is packed to protect moisture and flavour. Pair dates with nuts for wedding return gifts or corporate winter hampers. Order from Surajmal Vihar with pan-India delivery and free shipping above ₹799.',
  },
  berries: {
    title: 'Dried Berries Online | Cranberries | Sukhmal',
    description: 'Antioxidant-rich cranberries and dried berries for snacking and gifting. Order now. Free delivery above ₹799.',
    intro: 'Sukhmal dried berries — cranberries and related sweet-tart packs — add colour to trail mixes, baking, and festive platters. We keep listings short and honest: origin-style notes, pack weight, and allergen-safe packing. Use berries in Diwali hampers or everyday snacking. All pouches ship from East Delhi with the same vacuum-seal standard as our nuts. Free delivery above ₹799.',
  },
  'gift-hampers': {
    title: 'Premium Dry Fruit Gift Hampers | Sukhmal',
    description: 'Diwali, wedding and corporate dry fruit gift hampers. Order now. Free delivery above ₹799.',
    intro: 'Sukhmal gift hampers combine graded nuts, dry fruits and festive packaging for Diwali, weddings, Rakhi and corporate gifting in Delhi. Each hamper is assembled in East Delhi with airtight inner packs so gifts arrive fresh. Browse ready boxes or build your own hamper online. Free delivery above ₹799 across India.',
  },
  all: {
    title: 'Shop All Dry Fruits & Nuts | Sukhmal Dry Fruits',
    description: 'Browse the full Sukhmal catalog — nuts, dry fruits, dates, seeds and berries. Order now. Free delivery above ₹799.',
    intro: 'Explore the complete Sukhmal Dry Fruits Korner catalog: premium cashews, almonds, pistachios, walnuts, raisins, dates, seeds and berries. Every product is photographed in pack, priced in INR, and ready to add to a gift hamper or pantry order. Filter by category, weight and price. We dispatch from East Delhi across India, with free delivery on orders above ₹799.',
  },
};

const STATIC = {
  '/': {
    title: 'Buy Dry Fruits Online Delhi | Sukhmal Dry Fruits',
    description: 'Premium dry fruits, nuts and gift hampers from East Delhi. Hygienically packed. Order now — free delivery above ₹799.',
    image: DEFAULT_OG_IMAGE,
  },
  '/gift-hampers': {
    title: 'Premium Dry Fruit Gift Hampers | Sukhmal',
    description: 'Diwali, wedding and corporate dry fruit gift hampers. Curated in East Delhi. Order now. Free delivery above ₹799.',
    image: '/brand/hampers/hamper-copper-tray-hero.png',
  },
  '/wedding-gifts': {
    title: 'Wedding Return Gift Dry Fruits | Sukhmal',
    description: 'Wedding return gift dry fruit boxes and bulk hampers with GST invoicing. Request a proposal. Pan-India delivery.',
    image: '/brand/wedding-gifts-banner.png',
  },
  '/corporate-gifts': {
    title: 'Corporate Gifting Dry Fruits Delhi | Sukhmal',
    description: 'Corporate gifting dry fruits in Delhi — branded hampers, GST invoices, bulk pricing from 25 units. Request a proposal.',
    image: '/brand/corporate-gifts-banner.png',
  },
  '/festival-collections': {
    title: 'Diwali Gift Hampers Online | Sukhmal Dry Fruits',
    description: 'Diwali, Rakhi and Eid dry fruit gift hampers online. Premium boxes from East Delhi. Order now, free delivery above ₹799.',
    image: '/brand/hampers/hamper-ganesha-goldbox-hero.png',
  },
  '/offers': {
    title: 'Dry Fruit Offers & Deals | Sukhmal Dry Fruits',
    description: 'Seasonal markdowns on premium nuts, dry fruits and gift hampers. Shop deals. Free delivery above ₹799.',
  },
  '/build-hamper': {
    title: 'Build Your Own Hamper | Sukhmal Dry Fruits',
    description: 'Build a premium dry fruit gift hamper — pick budget, box, products and a gift card. Order now with pan-India delivery.',
  },
  '/about-us': {
    title: 'Our Story | Sukhmal Dry Fruits Korner Delhi',
    description: 'Sukhmal Dry Fruits Korner in Surajmal Vihar, East Delhi — premium nuts and hampers packed with care since our first store.',
    image: '/brand/about-hero-family.png',
  },
  '/contact-us': {
    title: 'Contact Us | Sukhmal Dry Fruits Korner',
    description: 'Visit Ground Floor, B-1, Surajmal Vihar, East Delhi 110092 or call 8595321912. WhatsApp and email support for orders.',
    image: '/brand/contact-hero-hamper.png',
  },
  '/store-locator': {
    title: 'Store Locator | Sukhmal Dry Fruits East Delhi',
    description: 'Find Sukhmal Dry Fruits Korner at Ground Floor, B-1, Surajmal Vihar, East Delhi, Delhi 110092. Open Mon–Sat 10 AM–8 PM.',
  },
  '/faqs': {
    title: 'FAQs | Shipping, Returns & Gifting | Sukhmal',
    description: 'Answers on freshness, pan-India shipping, returns, Build Your Own Hamper, and corporate bulk orders from Sukhmal.',
  },
  '/shipping-delivery': {
    title: 'Shipping & Delivery | Sukhmal Dry Fruits',
    description: 'Pan-India delivery in 2–7 days. Free shipping above ₹799. Track every Sukhmal dry fruit order by SMS and email.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | Sukhmal Dry Fruits Korner',
    description: 'How Sukhmal Dry Fruits Korner collects, uses and protects your order and account information.',
  },
  '/terms-conditions': {
    title: 'Terms & Conditions | Sukhmal Dry Fruits',
    description: 'Purchase terms, returns and GST-inclusive pricing for Sukhmal Dry Fruits Korner online orders.',
  },
};

const NOINDEX_PREFIXES = [
  '/admin',
  '/checkout',
  '/account',
  '/cart',
  '/login',
  '/signup',
  '/forgot-password',
  '/wishlist',
  '/order-success',
  '/order-failed',
];

function productBySlug(slug) {
  return PRODUCTS.find((p) => p.slug === slug);
}

function hamperBySlug(slug) {
  return HAMPERS.find((h) => h.slug === slug);
}

function productMeta(p, path) {
  const rawTitle = p.seoTitle || `${p.name} | Sukhmal Dry Fruits`;
  const title = clip(rawTitle.includes('Sukhmal') ? rawTitle : `${clip(rawTitle, 40)} | Sukhmal`, 60);
  const desc = clip(`${p.tagline || p.description || p.name}.${CTA}`, 160);
  return {
    title,
    description: desc,
    path,
    image: p.images?.[0] || DEFAULT_OG_IMAGE,
    jsonLd: [
      productSchema(p, { path }),
      breadcrumbSchema([
        { label: CATEGORIES.find((c) => c.slug === p.category)?.name || 'Shop', to: `/category/${p.category}` },
        { label: p.name },
      ]),
    ],
  };
}

function hamperMeta(h, path) {
  return {
    title: clip(`${h.name} Gift Hamper | Sukhmal`, 60),
    description: clip(`${h.description || h.name}. Premium dry fruit gift hamper.${CTA}`, 160),
    path,
    image: h.images?.[0] || h.image || DEFAULT_OG_IMAGE,
    jsonLd: [
      productSchema(
        {
          ...h,
          sku: h.id,
          images: h.images || [h.image],
          tagline: h.description,
          rating: h.rating || 4.6,
          reviews: h.reviews || 48,
        },
        { path },
      ),
      breadcrumbSchema([{ label: 'Gift Hampers', to: '/gift-hampers' }, { label: h.name }]),
    ],
  };
}

export function resolveRouteSeo(pathname) {
  const path = cleanPath(pathname);
  const noindex = NOINDEX_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`)) || path.startsWith('/search');

  if (path.startsWith('/build-hamper')) {
    return { ...STATIC['/build-hamper'], path, noindex: false, jsonLd: [localBusinessSchema()] };
  }

  const productMatch = path.match(/^\/products?\/([^/]+)$/);
  if (productMatch) {
    const p = productBySlug(productMatch[1]);
    if (p) return { ...productMeta(p, `/product/${p.slug}`), noindex: false };
  }

  const hamperMatch = path.match(/^\/gift-hampers\/([^/]+)$/);
  if (hamperMatch) {
    const h = hamperBySlug(hamperMatch[1]);
    if (h) return { ...hamperMeta(h, path), noindex: false };
  }

  const catMatch = path.match(/^\/category\/([^/]+)$/);
  if (catMatch) {
    const slug = catMatch[1];
    const copy = CATEGORY_COPY[slug] || CATEGORY_COPY.all;
    const cat = CATEGORIES.find((c) => c.slug === slug);
    return {
      title: copy.title,
      description: copy.description,
      path: `/category/${slug}`,
      image: cat?.image || DEFAULT_OG_IMAGE,
      jsonLd: [
        breadcrumbSchema([{ label: cat?.name || 'Shop', to: `/category/${slug}` }]),
      ],
    };
  }

  if (path === '/faqs') {
    return {
      ...STATIC['/faqs'],
      path,
      jsonLd: [faqSchema(FAQS), breadcrumbSchema([{ label: 'FAQs' }])],
    };
  }

  if (path === '/shipping-delivery') {
    const sections = POLICIES['shipping-delivery']?.sections || [];
    const faqs = sections.map((s) => ({ q: s.h, a: s.p }));
    return {
      ...STATIC[path],
      path,
      jsonLd: [faqSchema(faqs), breadcrumbSchema([{ label: 'Shipping & Delivery' }])],
    };
  }

  const staticMeta = STATIC[path];
  if (staticMeta) {
    const extra =
      path === '/'
        ? [organizationSchema(), websiteSchema(), localBusinessSchema()]
        : path === '/store-locator' || path === '/contact-us'
          ? [localBusinessSchema(), breadcrumbSchema([{ label: staticMeta.title.split('|')[0].trim() }])]
          : [breadcrumbSchema([{ label: staticMeta.title.split('|')[0].trim() }])];
    return { ...staticMeta, path, jsonLd: extra, noindex: false };
  }

  return {
    title: noindex ? `${clip(path.replace(/\//g, ' '), 40)} | Sukhmal` : 'Sukhmal Dry Fruits Korner',
    description: 'Premium dry fruits, nuts and gift hampers from Sukhmal Dry Fruits Korner, East Delhi.',
    path,
    noindex,
    jsonLd: noindex ? [] : [localBusinessSchema()],
  };
}

export function staticSitemapPaths() {
  return [
    { path: '/', priority: 1 },
    { path: '/gift-hampers', priority: 0.9 },
    { path: '/wedding-gifts', priority: 0.8 },
    { path: '/corporate-gifts', priority: 0.8 },
    { path: '/festival-collections', priority: 0.8 },
    { path: '/build-hamper/budget', priority: 0.7 },
    { path: '/offers', priority: 0.6 },
    { path: '/about-us', priority: 0.5 },
    { path: '/contact-us', priority: 0.5 },
    { path: '/store-locator', priority: 0.5 },
    { path: '/faqs', priority: 0.4 },
    { path: '/shipping-delivery', priority: 0.4 },
    { path: '/privacy-policy', priority: 0.3 },
    { path: '/terms-conditions', priority: 0.3 },
    ...CATEGORIES.map((c) => ({ path: `/category/${c.slug}`, priority: 0.8 })),
    ...PRODUCTS.map((p) => ({ path: `/product/${p.slug}`, priority: 0.7 })),
    ...HAMPERS.map((h) => ({ path: `/gift-hampers/${h.slug}`, priority: 0.8 })),
  ];
}
