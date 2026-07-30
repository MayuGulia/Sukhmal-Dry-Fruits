// Static metadata not stored in DB (festivals, testimonials, IG grid). Real product/hamper data comes from /api/catalog/*.
export const FESTIVALS_META = [
  { key: 'diwali',    name: 'Diwali',    hue: '#E8A11A', copy: 'Light up celebrations with our signature Diwali hampers.' },
  { key: 'rakhi',     name: 'Rakhi',     hue: '#B4587A', copy: 'Sisterly love, sweetened with premium dry fruits.' },
  { key: 'eid',       name: 'Eid',       hue: '#4E8C4E', copy: 'Elegant Ajwa & Medjool hampers for the holy month.' },
  { key: 'christmas', name: 'Christmas', hue: '#8C1F28', copy: 'Warm, spiced gifting for the festive season.' },
  { key: 'new-year',  name: 'New Year',  hue: '#3E2715', copy: 'Ring in the new year with premium indulgence.' },
];

export const TESTIMONIALS = [
  { name: 'Priya Sharma', city: 'Mumbai',    rating: 5, verified: true, text: 'The Royal Gold Hamper I sent to my mother-in-law for Diwali was the highlight of our gift exchange. Everyone kept asking where I ordered from!', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { name: 'Arjun Mehta',  city: 'Bengaluru', rating: 5, verified: true, text: 'We’ve been ordering corporate hampers from Sukhmal for 3 years. The consistency, packaging, and delivery timing are always spot-on.', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { name: 'Nikita Verma', city: 'Delhi',     rating: 5, verified: true, text: 'Freshness like I’ve never seen. The Medjool dates were plump and syrupy — like they were picked yesterday.', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { name: 'Rakesh Iyer',  city: 'Chennai',   rating: 4, verified: true, text: 'Loved the Build-Your-Own hamper feature. Curated exactly what my father likes and it arrived beautifully packed.', avatar: 'https://randomuser.me/api/portraits/men/54.jpg' },
  { name: 'Sanya Kapoor', city: 'Pune',      rating: 5, verified: true, text: 'Beautiful gifting for my daughter’s wedding welcome. Guests loved the personal card touch. Highly recommend!', avatar: 'https://randomuser.me/api/portraits/women/25.jpg' },
];

export const INSTAGRAM_POSTS = Array.from({ length: 6 }).map((_, i) => `https://loremflickr.com/600/600/driedfruit,nuts,gift?lock=${300 + i * 17}`);

// Content that stays static (FAQs, timeline, blog, stores, policies) — re-exported from mockContent
export { FAQS, TIMELINE, CERTS, BLOG_POSTS, STORES, POLICIES } from './mockContent';
