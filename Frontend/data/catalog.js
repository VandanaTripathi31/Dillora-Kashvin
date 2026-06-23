// ============================================================
// DILORA — Catalog seed data
// This mirrors the MongoDB "products" + "categories" shape.
// When the real backend is ready, the API module (api.js) swaps
// these arrays for fetch() calls — components don't change.
// ============================================================

// ---- Option presets (reused across products) ----------------
export const PHONE_BRANDS = {
  Apple: ['iPhone 16 Pro Max','iPhone 16 Pro','iPhone 16','iPhone 15 Pro Max','iPhone 15 Pro','iPhone 15','iPhone 14 Pro Max','iPhone 14 Pro','iPhone 14','iPhone 13','iPhone 12','iPhone 11','iPhone SE'],
  Samsung: ['Galaxy S24 Ultra','Galaxy S24','Galaxy S23','Galaxy A55','Galaxy A35','Galaxy M34','Galaxy F15'],
  OnePlus: ['OnePlus 12','OnePlus 11','OnePlus Nord 4','OnePlus Nord CE 4','OnePlus Nord CE 3 Lite'],
  Xiaomi: ['Redmi Note 13 Pro','Redmi Note 13','Redmi 13C','Mi 11X','Poco X6 Pro'],
  Vivo: ['Vivo V30','Vivo V29','Vivo Y200','Vivo T3'],
  Oppo: ['Oppo Reno 12','Oppo Reno 11','Oppo A79','Oppo F25'],
  Realme: ['Realme 12 Pro','Realme 11','Realme Narzo 70','Realme C67'],
  Motorola: ['Moto Edge 50','Moto G84','Moto G54'],
};

export const TSHIRT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

// ---- Categories (with sub-categories) -----------------------
// `optionType` tells the product page which selectors to render.
export const CATEGORIES = [
  {
    id: 'mobile-covers',
    name: 'Mobile Covers',
    tagline: 'Designed for your phone, made to order',
    subs: [
      { id: 'silicon-printed', name: 'Silicon Printed Case' },
      { id: 'resin-cover',     name: 'Resin Cover' },
      { id: 'crochet-cover',   name: 'Crochet Cover' },
    ],
  },
  {
    id: 'mobile-charms',
    name: 'Mobile Charms',
    tagline: 'The little finishing touch',
    subs: [
      { id: 'beads',          name: 'Beads' },
      { id: 'crochet-charm',  name: 'Crochet' },
    ],
  },
  {
    id: 'crochet',
    name: 'Crochet',
    tagline: 'Handmade with love, stitch by stitch',
    subs: [
      { id: 'fruits',     name: 'Fruits' },
      { id: 'flower',     name: 'Flower' },
      { id: 'evil-eye',   name: 'Evil Eye' },
      { id: 'spiderman',  name: 'Spiderman' },
    ],
  },
  {
    id: 'resin-art',
    name: 'Resin Art',
    tagline: 'Poured, set and polished by hand',
    subs: [
      { id: 'wall-watch',     name: 'Wall Watch' },
      { id: 'puja-plates',    name: 'Puja Plates' },
      { id: 'bookmarks',      name: 'Bookmarks' },
      { id: 'flower-frame',   name: 'Pressed Flower Frame' },
      { id: 'name-plate',     name: 'Name Plate' },
      { id: 'wall-hanging',   name: 'Wall Hanging' },
    ],
  },
  {
    id: 'tshirts',
    name: 'Oversize T-Shirts',
    tagline: 'Relaxed fits in soft cotton',
    subs: [
      { id: 'his', name: 'His' },
      { id: 'her', name: 'Her' },
    ],
  },
];

// helper to build product image urls (Unsplash demo photos)
const img = (id, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

// ---- Products ------------------------------------------------
// optionType: 'phone' | 'size' | 'none'
// material:  array of {name, price} (covers only)
let _id = 0;
const uid = () => `p${++_id}`;

export const PRODUCTS = [
  // ----- Mobile Covers : Silicon Printed -----
  { id: uid(), category:'mobile-covers', sub:'silicon-printed', name:'Lilac Daydream Silicon Case', price:299, mrp:449, stock:40, optionType:'phone',
    materials:[{name:'Soft Silicon',price:299},{name:'Slim Matte',price:279}], image: img('photo-1601784551446-20c9e07cdbdb'), gallery:[img('photo-1601784551446-20c9e07cdbdb'),img('photo-1556656793-08538906a9f8')] },
  { id: uid(), category:'mobile-covers', sub:'silicon-printed', name:'Blush Hearts Silicon Case', price:299, mrp:449, stock:35, optionType:'phone',
    materials:[{name:'Soft Silicon',price:299},{name:'Slim Matte',price:279}], image: img('photo-1592890288564-76628a30a657') },
  { id: uid(), category:'mobile-covers', sub:'silicon-printed', name:'Pastel Cloud Silicon Case', price:299, mrp:449, stock:28, optionType:'phone',
    materials:[{name:'Soft Silicon',price:299},{name:'Slim Matte',price:279}], image: img('photo-1511707171634-5f897ff02aa9') },
  // ----- Mobile Covers : Resin -----
  { id: uid(), category:'mobile-covers', sub:'resin-cover', name:'Pressed Petal Resin Cover', price:549, mrp:699, stock:18, optionType:'phone',
    materials:[{name:'Resin on Clear',price:549}], image: img('photo-1574755393849-623942496936') },
  { id: uid(), category:'mobile-covers', sub:'resin-cover', name:'Ocean Wave Resin Cover', price:549, mrp:699, stock:12, optionType:'phone',
    materials:[{name:'Resin on Clear',price:549}], image: img('photo-1609081219090-a6d81d3085bf') },
  // ----- Mobile Covers : Crochet -----
  { id: uid(), category:'mobile-covers', sub:'crochet-cover', name:'Handmade Crochet Phone Sleeve', price:399, mrp:599, stock:20, optionType:'phone',
    materials:[{name:'Wool Crochet Sleeve',price:399}], image: img('photo-1631125915902-d8abe9225ff2') },

  // ----- Mobile Charms : Beads -----
  { id: uid(), category:'mobile-charms', sub:'beads', name:'Beaded Daisy Phone Charm', price:149, mrp:249, stock:50, optionType:'none', image: img('photo-1611652022419-a9419f74343d') },
  { id: uid(), category:'mobile-charms', sub:'beads', name:'Pearl Drop Bead Charm', price:129, mrp:199, stock:60, optionType:'none', image: img('photo-1535632787350-4e68ef0ac584') },
  // ----- Mobile Charms : Crochet -----
  { id: uid(), category:'mobile-charms', sub:'crochet-charm', name:'Crochet Flower Charm', price:120, mrp:200, stock:45, optionType:'none', image: img('photo-1617038260897-41a1f14a8ca0') },
  { id: uid(), category:'mobile-charms', sub:'crochet-charm', name:'Tiny Crochet Bear Charm', price:140, mrp:220, stock:30, optionType:'none', image: img('photo-1559563458-527698bf5295') },

  // ----- T-Shirts : His -----
  { id: uid(), category:'tshirts', sub:'his', name:'Oversize Tee — Stone', price:699, mrp:999, stock:25, optionType:'size', sizes:TSHIRT_SIZES, image: img('photo-1521572163474-6864f9cf17ab') },
  { id: uid(), category:'tshirts', sub:'his', name:'Oversize Tee — Charcoal', price:699, mrp:999, stock:22, optionType:'size', sizes:TSHIRT_SIZES, image: img('photo-1583743814966-8936f5b7be1a') },
  // ----- T-Shirts : Her -----
  { id: uid(), category:'tshirts', sub:'her', name:'Oversize Tee — Lilac', price:699, mrp:999, stock:30, optionType:'size', sizes:TSHIRT_SIZES, image: img('photo-1576566588028-4147f3842f27') },
  { id: uid(), category:'tshirts', sub:'her', name:'Oversize Tee — Blush', price:699, mrp:999, stock:27, optionType:'size', sizes:TSHIRT_SIZES, image: img('photo-1503342217505-b0a15ec3261c') },

  // ----- Crochet -----
  { id: uid(), category:'crochet', sub:'fruits', name:'Crochet Strawberry', price:249, mrp:399, stock:15, optionType:'none', image: img('photo-1587049352846-4a222e784d38') },
  { id: uid(), category:'crochet', sub:'flower', name:'Crochet Tulip Bouquet', price:349, mrp:549, stock:12, optionType:'none', image: img('photo-1606041008023-472dfb5e530f') },
  { id: uid(), category:'crochet', sub:'evil-eye', name:'Crochet Evil Eye Hanging', price:199, mrp:299, stock:20, optionType:'none', image: img('photo-1620656798579-1984d9e87df7') },
  { id: uid(), category:'crochet', sub:'spiderman', name:'Crochet Spiderman Plushie', price:449, mrp:699, stock:8, optionType:'none', image: img('photo-1608889175123-8ee362201f81') },

  // ----- Resin Art -----
  { id: uid(), category:'resin-art', sub:'wall-watch', name:'Resin Marble Wall Watch', price:1299, mrp:1799, stock:6, optionType:'resin', image: img('photo-1563861826100-9cb868fdbe1c') },
  { id: uid(), category:'resin-art', sub:'puja-plates', name:'Resin Puja Plate Set', price:899, mrp:1299, stock:10, optionType:'resin', image: img('photo-1604608672516-f1b9b1d37076') },
  { id: uid(), category:'resin-art', sub:'bookmarks', name:'Pressed Flower Bookmark', price:149, mrp:249, stock:40, optionType:'resin', image: img('photo-1544716278-ca5e3f4abd8c') },
  { id: uid(), category:'resin-art', sub:'flower-frame', name:'Pressed Flower Frame', price:799, mrp:1199, stock:9, optionType:'resin', image: img('photo-1513519245088-0e12902e35ca') },
  { id: uid(), category:'resin-art', sub:'name-plate', name:'Personalised Resin Name Plate', price:699, mrp:999, stock:14, optionType:'resin', image: img('photo-1545239351-1141bd82e8a6') },
  { id: uid(), category:'resin-art', sub:'wall-hanging', name:'Resin Geode Wall Hanging', price:1099, mrp:1599, stock:5, optionType:'resin', image: img('photo-1502082553048-f009c37129b9') },
];

export const findCategory = (id) => CATEGORIES.find(c => c.id === id);

// Secondary "detail/lifestyle" image per category — used for card hover-swap,
// product galleries and zoom when a product has no explicit gallery of its own.
const CAT_ALT = {
  'mobile-covers': img('photo-1556656793-08538906a9f8'),
  'mobile-charms': img('photo-1535632787350-4e68ef0ac584'),
  'tshirts':       img('photo-1503342217505-b0a15ec3261c'),
  'crochet':       img('photo-1620656798579-1984d9e87df7'),
  'resin-art':     img('photo-1513519245088-0e12902e35ca'),
};

// Build a 2-image gallery for any product (its own gallery wins if present).
export function galleryFor(product) {
  if (product.gallery && product.gallery.length) return product.gallery;
  const alt = CAT_ALT[product.category] || product.image;
  return alt === product.image ? [product.image] : [product.image, alt];
}

// Stable "newness" ordering — later in the array = newer (for "newest" sort).
export function withMeta(products) {
  const n = products.length;
  return products.map((p, i) => ({ ...p, _order: n - i }));
}
