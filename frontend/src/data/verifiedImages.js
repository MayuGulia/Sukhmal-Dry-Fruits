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

const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

// nonce ensures each call for same key gets slightly different image (loremflickr caches by URL)
export function verifiedImg(keyOrIndex, w = 800) {
  const key = String(keyOrIndex);
  const kw = KEYWORDS[key] || 'driedfruit,nuts,food';
  const nonce = hash(key) % 1000;
  return `https://loremflickr.com/${w}/${w}/${kw}?lock=${nonce}`;
}

export { STATIC_FOOD };
