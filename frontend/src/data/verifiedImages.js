// Reliable topic-tagged image URLs. Uses loremflickr which redirects to a Flickr image
// matching the given keywords — much more topic-relevant than random Unsplash IDs.
// Backup: static verified Unsplash IDs for hero and key hamper visuals (confirmed food).

const STATIC_FOOD = [
  'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=800&auto=format&fit=crop', // almonds (confirmed)
  'https://images.unsplash.com/photo-1587049633312-d628ae50a8ae?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1508737027454-e6454ef45afd?w=800&auto=format&fit=crop',
];

const KEYWORDS = {
  'almonds': 'almonds,nuts,food',
  'cashews': 'cashews,nuts,food',
  'pistachios': 'pistachios,nuts,food',
  'walnuts': 'walnuts,nuts,food',
  'raisins': 'raisins,dried,fruit',
  'medjool': 'medjool,dates,dried',
  'ajwa': 'ajwa,dates,dried',
  'anjeer': 'fig,dried,fruit',
  'apricots': 'apricot,dried,fruit',
  'chia': 'chia,seeds,food',
  'pumpkin': 'pumpkin,seeds,food',
  'cranberries': 'cranberries,dried,fruit',
  'blueberries': 'blueberries,dried,fruit',
  'dry-fruits': 'driedfruit,mix,food',
  'nuts': 'mixednuts,food,nuts',
  'seeds': 'seeds,healthy,food',
  'dates': 'dates,fruit,food',
  'berries': 'berries,dried,fruit',
  'gift-hampers': 'gift,hamper,basket,fruit',
  'royal-gold': 'gift,basket,luxury,fruit',
  'diwali': 'diwali,gift,indian',
  'wedding-c': 'wedding,gift,basket',
  'corp-elite': 'gift,corporate,fruit',
  'birthday': 'birthday,gift,basket',
  'rakhi': 'rakhi,indian,festival',
  'eid': 'eid,dates,gift',
  'christmas': 'christmas,gift,basket',
  'new-year': 'newyear,gift,basket',
  'hero-main': 'driedfruit,nuts,gift,basket',
  'diwali-hero': 'diwali,lantern,indian',
  'rakhi-hero': 'rakhi,festival,indian',
  'eid-hero': 'eid,mubarak,dates',
  'christmas-hero': 'christmas,gift,decoration',
  'new-year-hero': 'newyear,celebration',
  'wedding-promo': 'wedding,decoration,gift',
  'corp-promo': 'corporate,gift,office',
  'build-hamper-promo': 'gift,basket,fruit,ribbon',
};

const LOCAL = {
  'royal-gold': '/brand/hamper-royal-gold.png',
  diwali: '/brand/hamper-diwali-delight.png',
  'wedding-c': '/brand/hamper-wedding-classic.png',
  'corp-elite': '/brand/hamper-corporate-elite.png',
  birthday: '/brand/hamper-birthday-bliss.png',
  rakhi: '/brand/hamper-rakhi-special.png',
  eid: '/brand/hamper-eid-mubarak.png',
  christmas: '/brand/hamper-christmas-cheer.png',
  'new-year': '/brand/hamper-new-year-glow.png',
  'gift-hampers': '/brand/hamper-royal-gold.png',
  'hero-main': '/brand/hero-luxury-hamper-v2.png',
  'diwali-hero': '/brand/festival-diwali-banner.png',
  'rakhi-hero': '/brand/festival-rakhi-banner.png',
  'eid-hero': '/brand/festival-eid-banner.png',
  'christmas-hero': '/brand/festival-christmas-banner.png',
  'new-year-hero': '/brand/festival-newyear-banner.png',
  'wedding-promo': '/brand/wedding-gifts-banner.png',
  'corp-promo': '/brand/corporate-gifts-banner.png',
  'build-hamper-promo': '/brand/byoh-lifestyle.png',
};

const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

// Local brand photos first. Remote loremflickr is a last-resort fallback only.
export function verifiedImg(keyOrIndex, w = 800) {
  const key = String(keyOrIndex);
  if (LOCAL[key]) return LOCAL[key];
  const kw = KEYWORDS[key] || 'driedfruit,nuts,food';
  const nonce = hash(key) % 1000;
  return `https://loremflickr.com/${w}/${w}/${kw}?lock=${nonce}`;
}

export { STATIC_FOOD };
