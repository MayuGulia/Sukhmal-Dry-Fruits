// FAQs, timeline, blog posts, policies content
import { verifiedImg } from './verifiedImages';

const img = (id) => `https://images.unsplash.com/${id}?w=800&auto=format&fit=crop`;

export const FAQS = [
  { q: 'How fresh are your dry fruits?', a: 'All our products are hand-picked and vacuum-packed within 72 hours of arrival at our facility. Every batch is quality-tested for moisture and aflatoxin levels.' },
  { q: 'Do you ship pan-India?', a: 'Yes! We deliver to 20,000+ pincodes across India. Metro cities usually receive orders in 2–3 business days.' },
  { q: 'What is your return policy?', a: 'If you receive a damaged or unsatisfactory product, we offer a 100% refund or free replacement within 7 days of delivery. Just email support@sukhmal.in with your order ID.' },
  { q: 'How do I customize a gift hamper?', a: 'Use our \u201cBuild Your Own Hamper\u201d wizard — pick your budget, container, products, gift card & personalized message.' },
  { q: 'Do you take corporate/bulk orders?', a: 'Absolutely. Fill out the Wedding/Corporate inquiry form or WhatsApp us. Bulk pricing kicks in from 25+ hampers with GST invoicing.' },
  { q: 'What payment methods do you accept?', a: 'UPI, Credit/Debit Cards, Net Banking, Wallets, and Cash on Delivery (for select pincodes).' },
  { q: 'How are the hampers packaged?', a: 'All hampers ship in premium sturdy boxes with tissue lining, silica pouches, and a personalised gift card. Nothing breaks in transit.' },
];

export const TIMELINE = [
  { year: '1994', title: 'Foundation', text: 'Sukhmal Dry Fruits Korner opens its first shop in the bustling lanes of Old Delhi.' },
  { year: '2005', title: 'Online Beginnings', text: 'Expanded operations with the first online listings for wholesale buyers.' },
  { year: '2012', title: 'Direct Sourcing', text: 'Built direct farmer relationships in Kashmir, Iran, and California for the freshest arrivals.' },
  { year: '2018', title: 'Gifting Segment', text: 'Launched premium curated gift hampers for corporate and wedding clients.' },
  { year: '2022', title: '10,000+ Happy Homes', text: 'Crossed 10,000 direct-to-home customers across 400+ Indian cities.' },
  { year: '2025', title: 'D2C E-commerce', text: 'Launch of the flagship D2C e-commerce experience with AI-powered gifting.' },
];

export const CERTS = [
  { code: 'FSSAI',  desc: 'Licensed Food Business' },
  { code: 'ISO 22000', desc: 'Food safety certified' },
  { code: 'HACCP', desc: 'Hazard Analysis compliant' },
  { code: 'GMP',   desc: 'Good Manufacturing Practices' },
];

export const BLOG_POSTS = [
  { slug: 'health-benefits-of-almonds', title: '7 Proven Health Benefits of Eating Almonds Daily', excerpt: 'From heart health to glowing skin — the surprising science of the humble almond.', image: img('photo-1508061253366-f7da158b6d46'), date: '2025-01-14', tags: ['Health', 'Nuts'] },
  { slug: 'ultimate-diwali-gift-guide', title: 'The Ultimate Diwali Gift Hamper Guide 2025', excerpt: 'Whether you’re gifting family, colleagues, or clients — here’s how to pick the perfect hamper.', image: img('photo-1608797178974-15b35a64ede9'), date: '2025-01-08', tags: ['Gifting', 'Diwali'] },
  { slug: 'medjool-vs-ajwa-dates', title: 'Medjool vs Ajwa Dates: Which One Is Right for You?', excerpt: 'A side-by-side comparison of the world’s two most-loved dates.', image: img('photo-1601050690117-64faf7a0f9b6'), date: '2024-12-27', tags: ['Dates'] },
  { slug: 'how-we-source', title: 'How We Source Our Kashmiri Walnuts', excerpt: 'Behind the scenes: our 30-year relationship with valley farmers.', image: img('photo-1599050751795-6cdaafbc2319'), date: '2024-12-12', tags: ['Sourcing'] },
];

export const STORES = [
  { name: 'Sukhmal Flagship — Chandni Chowk', address: '145, Katra Neel, Chandni Chowk, New Delhi – 110006', phone: '+91 98765 43210', hours: 'Mon–Sat: 10:00 AM – 8:00 PM', map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.0!2d77.2299!3d28.6562!2m3!1f0!2f0!3f0' },
  { name: 'Sukhmal Gurugram',                  address: 'DLF Cyber Hub, Level 2, Shop 34, Gurugram – 122002',      phone: '+91 98765 43211', hours: 'Mon–Sun: 11:00 AM – 9:00 PM', map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3506.0!2d77.0888!3d28.4949' },
  { name: 'Sukhmal Mumbai',                    address: 'Palladium Mall, Ground Floor, Lower Parel, Mumbai – 400013', phone: '+91 98765 43212', hours: 'Mon–Sun: 11:00 AM – 9:00 PM', map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.0!2d72.8291!3d18.9946' },
];

export const POLICIES = {
  'shipping-delivery': {
    title: 'Shipping & Delivery Policy',
    sections: [
      { h: 'Delivery Timeline', p: 'Metro cities: 2–4 business days. Tier-2 cities: 3–5 business days. Remote areas: 5–7 business days. All orders are dispatched within 24 hours of confirmation.' },
      { h: 'Free Shipping', p: 'Orders above ₹799 qualify for free shipping across India. Below that, a flat ₹79 delivery fee applies.' },
      { h: 'Delivery Partners', p: 'We ship via Blue Dart, Delhivery, and Ecom Express. Tracking numbers are shared over email and SMS.' },
      { h: 'Same-day Delivery', p: 'Available in Delhi NCR, Mumbai, Gurugram for orders placed before 2:00 PM — select at checkout when serviceable.' },
      { h: 'Undelivered Orders', p: 'If a package is returned to us due to incorrect address or no availability, we’ll contact you to reship (cost extra). Perishable items are non-returnable once delivered.' },
    ]
  },
  'returns-refunds': {
    title: 'Returns & Refunds Policy',
    sections: [
      { h: 'Return Window', p: '7 days from the date of delivery. Only unopened / sealed products are eligible.' },
      { h: 'Damaged Products', p: 'If your order arrives damaged, please email a photo to support@sukhmal.in within 48 hours. We’ll replace or refund immediately.' },
      { h: 'Refund Timeline', p: 'Refunds are processed within 5–7 business days back to the original payment method.' },
      { h: 'Non-returnable', p: 'Personalised hampers, opened food items, and any products marked \u201cFinal Sale\u201d are not eligible for returns.' },
    ]
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    sections: [
      { h: 'Data We Collect', p: 'Only what’s necessary to serve your order: name, email, phone, shipping address, and payment status. We never store card numbers — those are handled by Razorpay (PCI-DSS compliant).' },
      { h: 'How We Use Your Data', p: 'To fulfil orders, notify you about shipments, personalise gift recommendations (when opted in), and improve our service. We never sell your data to any third party.' },
      { h: 'Cookies', p: 'We use minimal analytics cookies. You can opt out anytime from Settings.' },
      { h: 'Your Rights', p: 'You can request deletion of your data, export a copy, or unsubscribe from marketing at any time by emailing privacy@sukhmal.in.' },
    ]
  },
  'terms-conditions': {
    title: 'Terms & Conditions',
    sections: [
      { h: 'Pricing', p: 'All prices are in INR (₹) and inclusive of 5% GST unless stated otherwise. Prices are subject to change without notice.' },
      { h: 'Order Acceptance', p: 'Placing an order is an offer to buy. We reserve the right to accept or decline any order at our discretion.' },
      { h: 'Payment', p: 'Payments are processed via Razorpay. Orders are confirmed ONLY after payment is captured server-side (webhook confirmed).' },
      { h: 'Governing Law', p: 'These terms are governed by the laws of India. Any disputes will be resolved in the courts of Delhi.' },
    ]
  }
};

// Static metadata for Home/Festival pages (real products/hampers come from /api/catalog/*)

/** Circular “Shop by Category” tiles — keep in sync with homeBrand.js */
export { SHOP_CATEGORY_TILES, INSTAGRAM_POSTS } from './homeBrand';

/** Home scroller tiles; `tag` matches hamper tags for Festival page filtering */
export const FESTIVALS_META = [
  { key: 'diwali',    name: 'Diwali Gifts',    tag: 'Diwali',    hue: '#E8A11A', copy: 'Light up celebrations with our signature Diwali hampers.', image: '/products/kaju-320-n-1.jpg', to: '/festival-collections#diwali' },
  { key: 'wedding',   name: 'Wedding Gifts',   tag: 'Wedding',   hue: '#BDAA7E', copy: 'Elegant hampers for the wedding season.', image: '/products/anjeer-jumbo-1.jpg', to: '/wedding-gifts' },
  { key: 'birthday',  name: 'Birthday Gifts',  tag: 'Birthday',  hue: '#B4587A', copy: 'Sweet surprises packed with premium nuts.', image: '/products/badam-cf-1.jpg', to: '/gift-hampers' },
  { key: 'corporate', name: 'Corporate Gifts', tag: 'Corporate', hue: '#3E2715', copy: 'Branded hampers for every occasion.', image: '/products/walnut-premium-1.jpg', to: '/corporate-gifts' },
  { key: 'rakhi',     name: 'Rakhi Gifts',     tag: 'Rakhi',     hue: '#B4587A', copy: 'Sisterly love, sweetened with premium dry fruits.', image: '/products/pista-irani-1.jpg', to: '/festival-collections#rakhi' },
  { key: 'eid',       name: 'Eid Gifts',       tag: 'Eid',       hue: '#4E8C4E', copy: 'Elegant Ajwa & Medjool hampers for the holy month.', image: '/products/medjoul-dates-1.jpg', to: '/festival-collections#eid' },
];

export const HERO_TRUST = [
  { key: 'natural', label: '100% Natural', sub: 'No Preservatives' },
  { key: 'handpicked', label: 'Handpicked Quality', sub: 'Finest from Around the World' },
  { key: 'packaging', label: 'Premium Packaging', sub: 'Made for Gifting' },
  { key: 'delivery', label: 'Express Delivery', sub: 'Across India' },
];

export const WHY_CHOOSE = [
  { key: 'trust', label: '30+ Years of Trust', sub: 'Since 1994' },
  { key: 'natural', label: '100% Natural', sub: 'No preservatives' },
  { key: 'quality', label: 'Premium Quality', sub: 'Grade-A only' },
  { key: 'hygiene', label: 'Hygienically Packed', sub: 'Vacuum-sealed' },
  { key: 'delivery', label: 'Fast & Express Delivery', sub: 'Pan-India' },
  { key: 'love', label: 'Customer Satisfaction', sub: '50,000+ happy homes' },
];

export const TESTIMONIALS = [
  { name: 'Priya Sharma', city: 'Mumbai',    rating: 5, verified: true, text: 'The Royal Gold Hamper I sent to my mother-in-law for Diwali was the highlight of our gift exchange. Everyone kept asking where I ordered from!', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { name: 'Arjun Mehta',  city: 'Bengaluru', rating: 5, verified: true, text: 'We have been ordering corporate hampers from Sukhmal for 3 years. The consistency, packaging, and delivery timing are always spot-on.', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { name: 'Nikita Verma', city: 'Delhi',     rating: 5, verified: true, text: 'Freshness like I have never seen. The Medjool dates were plump and syrupy — like they were picked yesterday.', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { name: 'Rakesh Iyer',  city: 'Chennai',   rating: 4, verified: true, text: 'Loved the Build-Your-Own hamper feature. Curated exactly what my father likes and it arrived beautifully packed.', avatar: 'https://randomuser.me/api/portraits/men/54.jpg' },
  { name: 'Sanya Kapoor', city: 'Pune',      rating: 5, verified: true, text: 'Beautiful gifting for my daughter wedding welcome. Guests loved the personal card touch. Highly recommend!', avatar: 'https://randomuser.me/api/portraits/women/25.jpg' },
];

export {
  AI_PREVIEW_IMG,
  BYOH_BANNER_IMG,
  WEDDING_PROMO_IMG,
  CORP_PROMO_IMG,
  HERO_IMG,
} from './homeBrand';
