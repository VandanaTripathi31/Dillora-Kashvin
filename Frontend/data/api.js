// ============================================================
// DILORA — API layer (mock)
// Every data read/write goes through here. To connect the real
// MERN backend later, replace the bodies of these functions with
// fetch(`${API_URL}/...`) calls. Component code never changes.
//
//   const API_URL = process.env.NEXT_PUBLIC_API_URL
//
// State is held in localStorage so the demo persists across reloads
// and the admin can actually add/edit products live for the client.
//
// NOTE (Next.js): localStorage only exists in the browser. On the
// server (SSR) we fall back to a harmless in-memory store so nothing
// crashes during render. Once the real backend is connected, these
// function bodies become fetch() calls and this shim is irrelevant.
// ============================================================

import { PRODUCTS, CATEGORIES } from './catalog';

// SSR-safe localStorage: real one in browser, in-memory stub on server.
const memoryStore = {};
const localStorage = (typeof window !== 'undefined' && window.localStorage)
  ? window.localStorage
  : {
      getItem: (k) => (k in memoryStore ? memoryStore[k] : null),
      setItem: (k, v) => { memoryStore[k] = String(v); },
      removeItem: (k) => { delete memoryStore[k]; },
    };

const LS_PRODUCTS = 'dilora_products';
const LS_ORDERS   = 'dilora_orders';
const LS_VIDEOS   = 'dilora_videos';
const LS_COUPONS  = 'dilora_coupons';
const LS_SETTINGS = 'dilora_settings';
const LS_SUBS     = 'dilora_custom_subs';  // admin-added sub-categories, per category id
const LS_REVIEWS  = 'dilora_reviews';      // customer product reviews

const delay = (ms = 250) => new Promise(r => setTimeout(r, ms));

function seed() {
  if (!localStorage.getItem(LS_PRODUCTS)) {
    localStorage.setItem(LS_PRODUCTS, JSON.stringify(PRODUCTS));
  }
  if (!localStorage.getItem(LS_ORDERS)) {
    localStorage.setItem(LS_ORDERS, JSON.stringify(seedOrders()));
  }
  if (!localStorage.getItem(LS_VIDEOS)) {
    localStorage.setItem(LS_VIDEOS, JSON.stringify(seedVideos()));
  }
  if (!localStorage.getItem(LS_COUPONS)) {
    localStorage.setItem(LS_COUPONS, JSON.stringify(seedCoupons()));
  }
  if (!localStorage.getItem(LS_SETTINGS)) {
    localStorage.setItem(LS_SETTINGS, JSON.stringify(seedSettings()));
  }
}
function readProducts() { seed(); return JSON.parse(localStorage.getItem(LS_PRODUCTS)); }
function writeProducts(p) { localStorage.setItem(LS_PRODUCTS, JSON.stringify(p)); }
function readOrders() { seed(); return JSON.parse(localStorage.getItem(LS_ORDERS)); }
function writeOrders(o) { localStorage.setItem(LS_ORDERS, JSON.stringify(o)); }
function readVideos() { seed(); return JSON.parse(localStorage.getItem(LS_VIDEOS)); }
function writeVideos(v) { localStorage.setItem(LS_VIDEOS, JSON.stringify(v)); }
function readCoupons() { seed(); return JSON.parse(localStorage.getItem(LS_COUPONS)); }
function writeCoupons(c) { localStorage.setItem(LS_COUPONS, JSON.stringify(c)); }
function readSettings() { seed(); return JSON.parse(localStorage.getItem(LS_SETTINGS)); }
function writeSettings(s) { localStorage.setItem(LS_SETTINGS, JSON.stringify(s)); }

// Demo coupons. type: 'percent' | 'flat'. minOrder optional. active toggles it on/off.
function seedCoupons() {
  return [
    { code:'WELCOME10', type:'percent', value:10, minOrder:0,   active:true,  expiry:'2026-12-31' },
    { code:'DIWALI200', type:'flat',    value:200, minOrder:999, active:true,  expiry:'2026-11-15' },
    { code:'BUY2GET1',  type:'bogo',    value:0, buyQty:2, freeQty:1, minOrder:0, active:true, expiry:'2026-12-31' },
    { code:'FLAT50',    type:'flat',    value:50,  minOrder:0,   active:false, expiry:'2026-12-31' },
  ];
}

// Site settings — festive banner + global display options. Admin toggles these.
function seedSettings() {
  return {
    banner: { on:false, preset:'diwali', text:'', code:'' },
    // When false (default), products show a single clean price — no cut/strike price.
    // Admin turns this ON only during a sale/offer, so original prices + % off appear.
    showDiscounts: false,
  };
}

// Festive banner presets (admin can pick one; text/code optional override)
export const BANNER_PRESETS = {
  diwali:    { label:'Diwali',    text:'✨ Diwali Dhamaka — extra savings on every handmade piece!', bg:'linear-gradient(90deg,#8a39bd,#a64fd6,#e57fc4)' },
  valentine: { label:"Valentine's", text:'💜 Valentine\'s Special — gift something handmade with love', bg:'linear-gradient(90deg,#e57fc4,#a64fd6)' },
  rakhi:     { label:'Rakhi',     text:'🪢 Rakhi Offer — celebrate the bond with a handmade gift', bg:'linear-gradient(90deg,#7a4ff0,#a64fd6)' },
  sale:      { label:'General Sale', text:'🎉 Limited-time offer — shop now and save!', bg:'linear-gradient(90deg,#a64fd6,#7a4ff0)' },
};

// Demo reels — these use reliable sample video clips with product-related
// poster images. Replace `src` with the client's real reels (or Cloudinary URLs).
function seedVideos() {
  return [
    { id:'v1', title:'Resin Art in the making', caption:'Watch how each piece is poured by hand',
      src:'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      poster:'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?auto=format&fit=crop&w=500&q=80' },
    { id:'v2', title:'Crochet flowers', caption:'Soft, handmade and forever in bloom',
      src:'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
      poster:'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=500&q=80' },
    { id:'v3', title:'New phone covers', caption:'Fresh designs, made for your phone',
      src:'https://www.w3schools.com/html/mov_bbb.mp4',
      poster:'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=500&q=80' },
  ];
}

function seedOrders() {
  const now = Date.now();
  return [
    { id:'DIL-1042', createdAt: now-86400000*1, customer:{name:'Aarohi Mehta', phone:'98XXXXXX21', address:'12 Rose Lane, Pune 411001'},
      items:[{name:'Lilac Daydream Silicon Case', category:'Mobile Covers', options:'Apple · iPhone 15 · Soft Silicon', qty:1, price:299}],
      total:299, payment:'online', status:'Processing' },
    { id:'DIL-1041', createdAt: now-86400000*2, customer:{name:'Rohan Verma', phone:'97XXXXXX08', address:'8 Hill View, Mumbai 400050'},
      items:[{name:'Oversize Tee — Charcoal', category:'Oversize T-Shirts', options:'His · L', qty:2, price:699}],
      total:1398, payment:'half-cod', status:'Shipped' },
    { id:'DIL-1040', createdAt: now-86400000*3, customer:{name:'Sara Khan', phone:'90XXXXXX55', address:'4 Lake Rd, Bengaluru 560001'},
      items:[{name:'Resin Marble Wall Watch', category:'Resin Art', options:'Colour: lilac & gold · Background: marble white', qty:1, price:1299},{name:'Pressed Flower Bookmark', category:'Resin Art', options:'Standard (no customization)', qty:2, price:149}],
      total:1597, payment:'online', status:'Delivered' },
  ];
}

export const api = {
  // ---- categories ----
  async getCategories() { return this.getCategoriesFull(); },

  // ---- products ----
  async getProducts() { await delay(); return readProducts(); },
  async getProduct(id) { await delay(); return readProducts().find(p => p.id === id) || null; },
  async getByCategory(catId, subId = null) {
    await delay();
    return readProducts().filter(p => p.category === catId && (!subId || p.sub === subId));
  },
  async getBestsellers(n = 8) { await delay(); return readProducts().slice(0, n); },

  // ---- admin: product CRUD ----
  async createProduct(data) {
    await delay();
    const list = readProducts();
    const product = { id: 'p' + Date.now(), stock: 0, optionType: 'none', ...data };
    list.unshift(product); writeProducts(list); return product;
  },
  async updateProduct(id, data) {
    await delay();
    const list = readProducts().map(p => p.id === id ? { ...p, ...data } : p);
    writeProducts(list); return list.find(p => p.id === id);
  },
  async deleteProduct(id) {
    await delay();
    writeProducts(readProducts().filter(p => p.id !== id)); return true;
  },

  // ---- orders ----
  async getOrders() { await delay(); return readOrders(); },
  async getOrdersByPhone(phone) {
    await delay();
    return readOrders().filter(o => o.customer?.phone === phone || o.userPhone === phone);
  },
  async createOrder(order) {
    await delay();
    const list = readOrders();
    const id = 'DIL-' + (1043 + list.length);
    const full = { id, createdAt: Date.now(), status:'Processing', ...order };
    list.unshift(full); writeOrders(list); return full;
  },
  async updateOrderStatus(id, status) {
    await delay();
    const list = readOrders().map(o => o.id === id ? { ...o, status } : o);
    writeOrders(list); return list.find(o => o.id === id);
  },

  // ---- videos / reels ----
  async getVideos() { await delay(); return readVideos(); },
  async createVideo(data) {
    await delay();
    const list = readVideos();
    const video = { id: 'v' + Date.now(), title:'', caption:'', src:'', poster:'', ...data };
    list.unshift(video); writeVideos(list); return video;
  },
  async deleteVideo(id) {
    await delay();
    writeVideos(readVideos().filter(v => v.id !== id)); return true;
  },

  // ---- coupons ----
  async getCoupons() { await delay(); return readCoupons(); },
  async createCoupon(data) {
    await delay();
    const list = readCoupons();
    const code = (data.code || '').trim().toUpperCase();
    if (!code) return { error: 'Code is required.' };
    if (list.some(c => c.code === code)) return { error: 'That code already exists.' };
    const coupon = {
      code,
      type: ['flat','percent','bogo'].includes(data.type) ? data.type : 'percent',
      value: Number(data.value) || 0,
      buyQty: Number(data.buyQty) || 1,
      freeQty: Number(data.freeQty) || 1,
      minOrder: Number(data.minOrder) || 0,
      active: data.active !== false,
      expiry: data.expiry || '',
    };
    list.unshift(coupon); writeCoupons(list); return coupon;
  },
  async updateCoupon(code, patch) {
    await delay();
    const list = readCoupons().map(c => c.code === code ? { ...c, ...patch } : c);
    writeCoupons(list); return list.find(c => c.code === code);
  },
  async deleteCoupon(code) {
    await delay();
    writeCoupons(readCoupons().filter(c => c.code !== code)); return true;
  },
  // Validate a code against an order. `items` is the cart line list (for BOGO).
  // Returns {ok, discount, coupon} or {ok:false, reason}.
  async validateCoupon(rawCode, subtotal, items = []) {
    await delay(120);
    const code = (rawCode || '').trim().toUpperCase();
    if (!code) return { ok: false, reason: 'Enter a code.' };
    const c = readCoupons().find(x => x.code === code);
    if (!c) return { ok: false, reason: 'Invalid code.' };
    if (!c.active) return { ok: false, reason: 'This code is no longer active.' };
    if (c.expiry && new Date(c.expiry) < new Date(new Date().toDateString())) {
      return { ok: false, reason: 'This code has expired.' };
    }
    if (c.minOrder && subtotal < c.minOrder) {
      return { ok: false, reason: `Add ₹${(c.minOrder - subtotal).toLocaleString('en-IN')} more to use this code.` };
    }

    let discount = 0;
    if (c.type === 'bogo') {
      // Buy X get Y free — cheapest qualifying units become free.
      const buy = Math.max(1, Number(c.buyQty) || 1);
      const free = Math.max(1, Number(c.freeQty) || 1);
      // expand items into a flat list of unit prices, cheapest first
      const units = [];
      for (const it of items) for (let i = 0; i < it.qty; i++) units.push(it.price);
      units.sort((a, b) => a - b);
      const groupSize = buy + free;
      const fullGroups = Math.floor(units.length / groupSize);
      if (fullGroups === 0) {
        return { ok: false, reason: `Add ${groupSize - units.length} more item(s) to use this Buy ${buy} Get ${free} offer.` };
      }
      // the cheapest `free * fullGroups` units are free
      const freeCount = free * fullGroups;
      for (let i = 0; i < freeCount; i++) discount += units[i];
    } else if (c.type === 'flat') {
      discount = Math.min(c.value, subtotal);
    } else {
      discount = Math.round(subtotal * c.value / 100);
    }
    return { ok: true, discount, coupon: { code: c.code, type: c.type, value: c.value } };
  },

  // ---- settings (festive banner) ----
  async getSettings() { await delay(0); return readSettings(); },
  async updateSettings(patch) {
    await delay();
    const s = { ...readSettings(), ...patch };
    writeSettings(s); return s;
  },

  // ---- categories + sub-categories (admin-manageable) ----
  // Base categories live in catalog.js. Admin-added sub-categories are stored
  // in localStorage and merged in here, so the client can create new subs
  // (e.g. a new t-shirt type) without touching code. When the real backend
  // arrives, these read/writes become fetch() calls — components don't change.
  // ---- categories + sub-categories (fully admin-manageable) ----
  // Base categories/subs live in catalog.js. Admin changes are stored in
  // localStorage as { [catId]: { custom: [...], hidden: [subId,...] } } and
  // merged in here — so the client can add NEW subs and also remove ANY sub
  // (including the original ones like "Silicon Printed"). When the real backend
  // arrives, these reads/writes become fetch() calls; components don't change.
  _readSubMods() {
    try { return JSON.parse(localStorage.getItem(LS_SUBS)) || {}; } catch { return {}; }
  },
  _writeSubMods(m) { localStorage.setItem(LS_SUBS, JSON.stringify(m)); },

  async getCategoriesFull() {
    await delay(0);
    const mods = this._readSubMods();
    return CATEGORIES.map(cat => {
      const m = mods[cat.id] || {};
      const hidden = m.hidden || [];
      const renames = m.renames || {};
      const base = cat.subs
        .filter(s => !hidden.includes(s.id))
        .map(s => renames[s.id] ? { ...s, name: renames[s.id] } : s);
      const custom = m.custom || [];
      return { ...cat, subs: [...base, ...custom] };
    });
  },
  async getCategories() { return this.getCategoriesFull(); },

  async addSub(categoryId, name) {
    await delay();
    const clean = String(name || '').trim();
    if (!clean) return { ok: false, error: 'Name required' };
    const mods = this._readSubMods();
    const m = mods[categoryId] || { custom: [], hidden: [] };
    const id = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString().slice(-4);
    // avoid duplicate display names within this category (visible ones only)
    const baseCat = CATEGORIES.find(c => c.id === categoryId);
    const visibleBase = (baseCat?.subs || []).filter(s => !(m.hidden || []).includes(s.id));
    const existing = [...visibleBase, ...(m.custom || [])].map(s => s.name.toLowerCase());
    if (existing.includes(clean.toLowerCase())) return { ok: false, error: 'That sub-category already exists' };
    m.custom = [...(m.custom || []), { id, name: clean, custom: true }];
    mods[categoryId] = m;
    this._writeSubMods(mods);
    return { ok: true, sub: { id, name: clean } };
  },

  async renameSub(categoryId, subId, newName) {
    await delay();
    const clean = String(newName || '').trim();
    if (!clean) return { ok: false, error: 'Name required' };
    const mods = this._readSubMods();
    const m = mods[categoryId] || { custom: [], hidden: [] };
    // custom sub: rename directly
    const ci = (m.custom || []).findIndex(s => s.id === subId);
    if (ci >= 0) {
      m.custom[ci] = { ...m.custom[ci], name: clean };
    } else {
      // base sub: store an override name
      m.renames = m.renames || {};
      m.renames[subId] = clean;
    }
    mods[categoryId] = m;
    this._writeSubMods(mods);
    return { ok: true };
  },

  async removeSub(categoryId, subId) {
    await delay();
    const mods = this._readSubMods();
    const m = mods[categoryId] || { custom: [], hidden: [] };
    const baseCat = CATEGORIES.find(c => c.id === categoryId);
    const isBase = (baseCat?.subs || []).some(s => s.id === subId);
    if (isBase) {
      m.hidden = [...new Set([...(m.hidden || []), subId])];
    } else {
      m.custom = (m.custom || []).filter(s => s.id !== subId);
    }
    mods[categoryId] = m;
    this._writeSubMods(mods);
    return { ok: true };
  },

  // ---- reviews & ratings (real) ----
  // Stored as { [productId]: [ {id, name, phone, rating, text, createdAt}, ... ] }.
  // A customer may review a product only if they have an order containing it
  // that is marked "Delivered". One review per product per phone number.
  // Backend later: these become fetch() calls; the component code stays the same.
  _readReviews() {
    try { return JSON.parse(localStorage.getItem(LS_REVIEWS)) || {}; } catch { return {}; }
  },
  _writeReviews(r) { localStorage.setItem(LS_REVIEWS, JSON.stringify(r)); },

  async getReviews(productId) {
    await delay(0);
    const all = this._readReviews();
    return all[productId] || [];
  },

  // Summary used for stars on cards / product page: { avg, count }
  async getRatingSummary(productId) {
    await delay(0);
    const list = (this._readReviews())[productId] || [];
    if (!list.length) return { avg: 0, count: 0 };
    const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
    return { avg: Math.round(avg * 10) / 10, count: list.length };
  },

  // Can this phone review this product right now?
  // -> { ok:true } or { ok:false, reason:'login' | 'not-delivered' | 'already' }
  async canReview(productId, phone) {
    await delay(0);
    if (!phone) return { ok: false, reason: 'login' };
    const already = (this._readReviews()[productId] || []).some(r => r.phone === phone);
    if (already) return { ok: false, reason: 'already' };
    const orders = readOrders().filter(o => (o.customer?.phone === phone || o.userPhone === phone));
    const delivered = orders.some(o =>
      o.status === 'Delivered' && (o.items || []).some(it => it.productId === productId)
    );
    if (!delivered) return { ok: false, reason: 'not-delivered' };
    return { ok: true };
  },

  async addReview(productId, { name, phone, rating, text }) {
    await delay();
    const elig = await this.canReview(productId, phone);
    if (!elig.ok) return { ok: false, reason: elig.reason };
    const r = Math.max(1, Math.min(5, Number(rating) || 0));
    if (!r) return { ok: false, reason: 'rating' };
    const all = this._readReviews();
    const list = all[productId] || [];
    list.unshift({
      id: 'r' + Date.now(),
      name: name || 'Customer',
      phone,
      rating: r,
      text: String(text || '').trim(),
      createdAt: Date.now(),
    });
    all[productId] = list;
    this._writeReviews(all);
    return { ok: true };
  },

  // ---- admin helpers: bulk upload + CSV export ----
  async bulkCreateProducts(rows) {
    await delay();
    const list = readProducts();
    let added = 0;
    for (const r of rows) {
      if (!r.name) continue;
      list.unshift({
        id: 'p' + Date.now() + '_' + added,
        name: r.name,
        category: r.category || 'mobile-covers',
        sub: r.sub || '',
        price: Number(r.price) || 0,
        mrp: Number(r.mrp) || 0,
        stock: Number(r.stock) || 0,
        optionType: r.optionType || 'none',
        image: r.image || '',
      });
      added++;
    }
    writeProducts(list);
    return { added };
  },

  // ---- reset (handy for client demos) ----
  async resetDemo() {
    localStorage.removeItem(LS_PRODUCTS);
    localStorage.removeItem(LS_ORDERS);
    localStorage.removeItem(LS_VIDEOS);
    localStorage.removeItem(LS_COUPONS);
    localStorage.removeItem(LS_SETTINGS);
    localStorage.removeItem(LS_SUBS);
    localStorage.removeItem(LS_REVIEWS);
    seed();
    return true;
  },
};
