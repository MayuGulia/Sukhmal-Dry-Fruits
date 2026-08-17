import {
  STORE_EMAIL,
  STORE_HOURS,
  STORE_MAPS_URL,
  STORE_NAME,
} from '@/data/storeInfo';
import { absUrl, assetUrl, DEFAULT_LOGO, SITE_NAME, SITE_URL } from './site';

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: STORE_NAME,
    image: assetUrl(DEFAULT_LOGO),
    url: SITE_URL,
    telephone: '+91-8595321912',
    email: STORE_EMAIL,
    priceRange: '₹₹',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Ground Floor, B-1, Surajmal Vihar',
      addressLocality: 'East Delhi',
      addressRegion: 'Delhi',
      postalCode: '110092',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '28.6532',
      longitude: '77.3030',
    },
    openingHours: 'Mo-Sa 10:00-20:00',
    hasMap: STORE_MAPS_URL,
    description: `${SITE_NAME} — premium dry fruits, nuts, and gift hampers from East Delhi. ${STORE_HOURS}.`,
  };
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: assetUrl(DEFAULT_LOGO),
    email: STORE_EMAIL,
    telephone: '+91-8595321912',
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbSchema(items = []) {
  const list = [{ label: 'Home', to: '/' }, ...items.filter((it) => it?.label)];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: list.map((it, i) => {
      const row = {
        '@type': 'ListItem',
        position: i + 1,
        name: it.label,
      };
      if (it.to) row.item = absUrl(it.to);
      return row;
    }),
  };
}

export function faqSchema(faqs = []) {
  if (!faqs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function productSchema(p, { path, availability } = {}) {
  if (!p) return null;
  const images = (p.images || []).filter(Boolean).map(assetUrl);
  const price = p.variants?.[0]?.price ?? p.price;
  const inStock = availability !== false;
  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: p.name,
    image: images.length ? images : [assetUrl(p.image || p.img)],
    description: p.tagline || p.description || p.name,
    sku: p.sku || p.id,
    brand: { '@type': 'Brand', name: 'Sukhmal' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: String(price ?? ''),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: absUrl(path),
    },
    ...(p.rating && p.reviews
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: String(p.rating),
            reviewCount: String(p.reviews),
          },
        }
      : {}),
  };
}
