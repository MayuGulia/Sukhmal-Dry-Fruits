import { verifiedImg } from './verifiedImages';

export const CATEGORIES = [
  { slug: 'dry-fruits',   name: 'Dry Fruits',   tagline: 'Sun-dried premium selections',        image: verifiedImg('dry-fruits') },
  { slug: 'nuts',         name: 'Nuts',         tagline: 'Crunchy, hand-picked wholesomeness', image: verifiedImg('nuts') },
  { slug: 'seeds',        name: 'Seeds',        tagline: 'Nutrient-packed daily essentials',    image: verifiedImg('seeds') },
  { slug: 'dates',        name: 'Dates',        tagline: 'Nature’s candy — rich & syrupy', image: verifiedImg('dates') },
  { slug: 'berries',      name: 'Berries',      tagline: 'Antioxidant-rich sweet-tart bites',   image: verifiedImg('berries') },
  { slug: 'gift-hampers', name: 'Gift Hampers', tagline: 'Curated for every celebration',       image: verifiedImg('gift-hampers') },
];

const pImg = (slug, n = 3) => Array.from({ length: n }).map((_, i) => verifiedImg(slug + i));

export const PRODUCTS = [
  { id: 'p_almonds_premium', slug: 'california-almonds-premium', name: 'California Almonds', category: 'nuts', tagline: 'Premium Grade A', price: 449, mrp: 599, rating: 4.8, reviews: 1284, bestseller: true, natural: true, images: pImg('almonds'), variants: [{ w: '250g', price: 449 }, { w: '500g', price: 849 }, { w: '1kg', price: 1599 }, { w: '2kg', price: 2999 }] },
  { id: 'p_cashews', slug: 'kaju-w320-cashews', name: 'W320 Cashews', category: 'nuts', tagline: 'Whole & Crunchy', price: 549, mrp: 699, rating: 4.9, reviews: 942, bestseller: true, images: pImg('cashews'), variants: [{ w: '250g', price: 549 }, { w: '500g', price: 999 }, { w: '1kg', price: 1899 }, { w: '2kg', price: 3499 }] },
  { id: 'p_pistachios', slug: 'roasted-salted-pistachios', name: 'Roasted Salted Pistachios', category: 'nuts', tagline: 'Iranian premium', price: 699, mrp: 899, rating: 4.7, reviews: 611, images: pImg('pistachios'), variants: [{ w: '250g', price: 699 }, { w: '500g', price: 1299 }, { w: '1kg', price: 2399 }] },
  { id: 'p_walnuts', slug: 'kashmiri-walnut-kernels', name: 'Kashmiri Walnut Kernels', category: 'nuts', tagline: 'Light amber, brain-food', price: 599, mrp: 799, rating: 4.6, reviews: 384, images: pImg('walnuts'), variants: [{ w: '250g', price: 599 }, { w: '500g', price: 1149 }, { w: '1kg', price: 2199 }] },
  { id: 'p_raisins', slug: 'green-seedless-raisins', name: 'Green Seedless Raisins', category: 'dry-fruits', tagline: 'Sun-dried Afghan', price: 299, mrp: 399, rating: 4.7, reviews: 872, natural: true, images: pImg('raisins'), variants: [{ w: '250g', price: 299 }, { w: '500g', price: 549 }, { w: '1kg', price: 999 }] },
  { id: 'p_medjool', slug: 'medjool-dates', name: 'Medjool Dates', category: 'dates', tagline: 'Jordanian, king of dates', price: 799, mrp: 999, rating: 4.9, reviews: 508, bestseller: true, images: pImg('medjool'), variants: [{ w: '250g', price: 799 }, { w: '500g', price: 1499 }, { w: '1kg', price: 2799 }] },
  { id: 'p_ajwa', slug: 'ajwa-dates-saudi', name: 'Ajwa Dates', category: 'dates', tagline: 'Sacred, from Al-Madinah', price: 1299, mrp: 1599, rating: 4.9, reviews: 214, images: pImg('ajwa'), variants: [{ w: '250g', price: 1299 }, { w: '500g', price: 2399 }] },
  { id: 'p_figs', slug: 'anjeer-turkish-figs', name: 'Anjeer (Turkish Figs)', category: 'dry-fruits', tagline: 'Chewy, honey-sweet', price: 549, mrp: 699, rating: 4.6, reviews: 431, images: pImg('anjeer'), variants: [{ w: '250g', price: 549 }, { w: '500g', price: 999 }, { w: '1kg', price: 1899 }] },
  { id: 'p_apricots', slug: 'dried-apricots-jumbo', name: 'Jumbo Dried Apricots', category: 'dry-fruits', tagline: 'Turkish premium', price: 449, mrp: 599, rating: 4.5, reviews: 262, images: pImg('apricots'), variants: [{ w: '250g', price: 449 }, { w: '500g', price: 849 }] },
  { id: 'p_chia', slug: 'chia-seeds-black', name: 'Chia Seeds', category: 'seeds', tagline: 'Omega-3 powerhouse', price: 249, mrp: 349, rating: 4.7, reviews: 611, natural: true, images: pImg('chia'), variants: [{ w: '250g', price: 249 }, { w: '500g', price: 449 }, { w: '1kg', price: 799 }] },
  { id: 'p_pumpkin', slug: 'pumpkin-seeds-roasted', name: 'Roasted Pumpkin Seeds', category: 'seeds', tagline: 'Magnesium-rich crunch', price: 249, mrp: 329, rating: 4.6, reviews: 288, images: pImg('pumpkin'), variants: [{ w: '250g', price: 249 }, { w: '500g', price: 449 }] },
  { id: 'p_cranberries', slug: 'dried-cranberries', name: 'Dried Cranberries', category: 'berries', tagline: 'Sweet-tart & juicy', price: 349, mrp: 449, rating: 4.7, reviews: 372, images: pImg('cranberries'), variants: [{ w: '250g', price: 349 }, { w: '500g', price: 649 }] },
  { id: 'p_blueberries', slug: 'dried-blueberries', name: 'Dried Blueberries', category: 'berries', tagline: 'Antioxidant burst', price: 599, mrp: 749, rating: 4.6, reviews: 214, images: pImg('blueberries'), variants: [{ w: '250g', price: 599 }, { w: '500g', price: 1099 }] },
];

export const HAMPERS = [
  { id: 'h_royal_gold', slug: 'royal-gold-hamper', name: 'Royal Gold Hamper', tier: 'Luxury', weight: '1.2 kg', price: 2499, mrp: 2999, image: verifiedImg('royal-gold'), tags: ['Wedding', 'Luxury'], contents: ['Californian Almonds 250g', 'Kashmiri Walnuts 200g', 'Medjool Dates 250g', 'Roasted Cashews 250g', 'Dried Apricots 150g', 'Gift Card + Wooden Basket'] },
  { id: 'h_diwali_delight', slug: 'diwali-delight-hamper', name: 'Diwali Delight Hamper', tier: 'Premium', weight: '900 g', price: 1799, mrp: 2199, image: verifiedImg('diwali'), tags: ['Festival', 'Diwali'], contents: ['Almonds 200g', 'Cashews 200g', 'Pistachios 150g', 'Raisins 200g', 'Anjeer 150g', 'Diyas + Gift Card'] },
  { id: 'h_wedding_classic', slug: 'wedding-classic-hamper', name: 'Wedding Classic Hamper', tier: 'Deluxe', weight: '1.5 kg', price: 3499, mrp: 3999, image: verifiedImg('wedding-c'), tags: ['Wedding'], contents: ['Almonds 300g', 'Cashews 300g', 'Pistachios 250g', 'Walnuts 250g', 'Medjool Dates 200g', 'Wooden Box + Ribbon'] },
  { id: 'h_corporate_elite', slug: 'corporate-elite-hamper', name: 'Corporate Elite Hamper', tier: 'Premium', weight: '800 g', price: 1499, mrp: 1899, image: verifiedImg('corp-elite'), tags: ['Corporate'], contents: ['Almonds 200g', 'Cashews 200g', 'Pistachios 100g', 'Cranberries 100g', 'Branded Box'] },
  { id: 'h_birthday_bliss', slug: 'birthday-bliss-hamper', name: 'Birthday Bliss Hamper', tier: 'Premium', weight: '700 g', price: 1299, mrp: 1599, image: verifiedImg('birthday'), tags: ['Birthday'], contents: ['Almonds 150g', 'Cashews 150g', 'Chocolate-covered Dates', 'Personalized Card'] },
  { id: 'h_rakhi_special', slug: 'rakhi-special-hamper', name: 'Rakhi Special Hamper', tier: 'Deluxe', weight: '1 kg', price: 1999, mrp: 2499, image: verifiedImg('rakhi'), tags: ['Festival', 'Rakhi'], contents: ['Almonds 200g', 'Cashews 200g', 'Pistachios 150g', 'Anjeer 150g', 'Rakhi + Roli-Chawal', 'Gift Card'] },
  { id: 'h_eid_mubarak', slug: 'eid-mubarak-hamper', name: 'Eid Mubarak Hamper', tier: 'Premium', weight: '900 g', price: 1899, mrp: 2299, image: verifiedImg('eid'), tags: ['Festival', 'Eid'], contents: ['Ajwa Dates 200g', 'Almonds 200g', 'Pistachios 150g', 'Anjeer 150g', 'Gift Card'] },
  { id: 'h_christmas_cheer', slug: 'christmas-cheer-hamper', name: 'Christmas Cheer Hamper', tier: 'Deluxe', weight: '1.1 kg', price: 2299, mrp: 2799, image: verifiedImg('christmas'), tags: ['Festival', 'Christmas'], contents: ['Assorted Nuts Tin', 'Dried Cranberries', 'Chocolate Almonds', 'Xmas Card'] },
  { id: 'h_new_year_glow', slug: 'new-year-glow-hamper', name: 'New Year Glow Hamper', tier: 'Premium', weight: '1 kg', price: 1799, mrp: 2199, image: verifiedImg('new-year'), tags: ['Festival', 'New Year'], contents: ['Almonds 250g', 'Cashews 200g', 'Dates 200g', 'Berries 150g', 'Gift Card'] },
];

export const FESTIVALS = [
  { key: 'diwali',    name: 'Diwali',    hue: '#E8A11A', copy: 'Light up celebrations with our signature Diwali hampers.', hero: verifiedImg('diwali-hero') },
  { key: 'rakhi',     name: 'Rakhi',     hue: '#B4587A', copy: 'Sisterly love, sweetened with premium dry fruits.',        hero: verifiedImg('rakhi-hero') },
  { key: 'eid',       name: 'Eid',       hue: '#4E8C4E', copy: 'Elegant Ajwa & Medjool hampers for the holy month.',        hero: verifiedImg('eid-hero') },
  { key: 'christmas', name: 'Christmas', hue: '#8C1F28', copy: 'Warm, spiced gifting for the festive season.',                hero: verifiedImg('christmas-hero') },
  { key: 'new-year',  name: 'New Year',  hue: '#3E2715', copy: 'Ring in the new year with premium indulgence.',              hero: verifiedImg('new-year-hero') },
];

export const TESTIMONIALS = [
  { name: 'Priya Sharma', city: 'Mumbai',    rating: 5, verified: true, text: 'The Royal Gold Hamper I sent to my mother-in-law for Diwali was the highlight of our gift exchange. Everyone kept asking where I ordered from!', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { name: 'Arjun Mehta',  city: 'Bengaluru', rating: 5, verified: true, text: 'We’ve been ordering corporate hampers from Sukhmal for 3 years. The consistency, packaging, and delivery timing are always spot-on.',                     avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { name: 'Nikita Verma', city: 'Delhi',     rating: 5, verified: true, text: 'Freshness like I’ve never seen. The Medjool dates were plump and syrupy — like they were picked yesterday.',                                        avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { name: 'Rakesh Iyer',  city: 'Chennai',   rating: 4, verified: true, text: 'Loved the Build-Your-Own hamper feature. Curated exactly what my father likes and it arrived beautifully packed.',                                            avatar: 'https://randomuser.me/api/portraits/men/54.jpg' },
  { name: 'Sanya Kapoor', city: 'Pune',      rating: 5, verified: true, text: 'Beautiful gifting for my daughter’s wedding welcome. Guests loved the personal card touch. Highly recommend!',                                        avatar: 'https://randomuser.me/api/portraits/women/25.jpg' },
];

export const INSTAGRAM_POSTS = Array.from({ length: 6 }).map((_, i) => verifiedImg('ig-' + i));
