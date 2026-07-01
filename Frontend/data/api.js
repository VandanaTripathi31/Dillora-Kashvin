// ============================================================
// DILORA — API layer (Phase 3: connected to the real backend)
// Every read/write goes through here. Each function now calls the
// Node/Express + MongoDB backend via fetch(). Function NAMES and
// RETURN SHAPES are identical to before, so no component changes.
//
//   Set the backend URL in .env.local:
//     NEXT_PUBLIC_API_URL=http://localhost:5000/api
//
// SAFETY FALLBACK: if NEXT_PUBLIC_API_URL is not set, or a request
// fails (backend off), we fall back to the old localStorage behaviour
// so the site keeps working. Once the backend is always running and
// deployed, the fallback simply never triggers.
// ============================================================

import { PRODUCTS, CATEGORIES } from './catalog';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const USE_BACKEND = !!API_URL;

// ---------- fetch helper ----------
async function req(path, { method = 'GET', body } = {}) {
  const res = await fetch(API_URL + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${method} ${path} -> ${res.status}`);
  return res.json();
}

// Try the backend; if it fails, run the localStorage fallback instead.
async function withFallback(backendFn, localFn) {
  if (!USE_BACKEND) return localFn();
  try { return await backendFn(); }
  catch (e) {
    if (typeof console !== 'undefined') console.warn('[api] backend unavailable, using local data:', e.message);
    return localFn();
  }
}

// ============================================================
// LOCALSTORAGE FALLBACK (same as before) — used only if backend is off
// ============================================================
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
const LS_SUBS     = 'dilora_custom_subs';
const LS_REVIEWS  = 'dilora_reviews';
const LS_SEEDVER  = 'dilora_seed_v';

// Bump this whenever the seed catalog/videos change so returning visitors
// (who have the old data cached in localStorage) get the new data instead
// of the stale one. Only the catalog-derived keys are reset.
const SEED_VERSION = 'v2-real-photos';

function seed() {
  if (localStorage.getItem(LS_SEEDVER) !== SEED_VERSION) {
    [LS_PRODUCTS, LS_VIDEOS, LS_SUBS].forEach(k => localStorage.removeItem(k));
    localStorage.setItem(LS_SEEDVER, SEED_VERSION);
  }
  if (!localStorage.getItem(LS_PRODUCTS)) localStorage.setItem(LS_PRODUCTS, JSON.stringify(PRODUCTS));
  if (!localStorage.getItem(LS_ORDERS)) localStorage.setItem(LS_ORDERS, JSON.stringify(seedOrders()));
  if (!localStorage.getItem(LS_VIDEOS)) localStorage.setItem(LS_VIDEOS, JSON.stringify(seedVideos()));
  if (!localStorage.getItem(LS_COUPONS)) localStorage.setItem(LS_COUPONS, JSON.stringify(seedCoupons()));
  if (!localStorage.getItem(LS_SETTINGS)) localStorage.setItem(LS_SETTINGS, JSON.stringify(seedSettings()));
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

function seedCoupons() {
  return [
    { code:'WELCOME10', type:'percent', value:10, minOrder:0,   active:true,  expiry:'2026-12-31' },
    { code:'DIWALI200', type:'flat',    value:200, minOrder:999, active:true,  expiry:'2026-11-15' },
    { code:'BUY2GET1',  type:'bogo',    value:0, buyQty:2, freeQty:1, minOrder:0, active:true, expiry:'2026-12-31' },
    { code:'FLAT50',    type:'flat',    value:50,  minOrder:0,   active:false, expiry:'2026-12-31' },
  ];
}
function seedSettings() {
  return { banner: { on:false, preset:'diwali', text:'', code:'' }, showDiscounts: false };
}

export const BANNER_PRESETS = {
  diwali:    { label:'Diwali',    text:'✨ Diwali Dhamaka — extra savings on every handmade piece!', bg:'linear-gradient(90deg,#8a39bd,#a64fd6,#e57fc4)' },
  valentine: { label:"Valentine's", text:'💜 Valentine\'s Special — gift something handmade with love', bg:'linear-gradient(90deg,#e57fc4,#a64fd6)' },
  rakhi:     { label:'Rakhi',     text:'🪢 Rakhi Offer — celebrate the bond with a handmade gift', bg:'linear-gradient(90deg,#7a4ff0,#a64fd6)' },
  sale:      { label:'General Sale', text:'🎉 Limited-time offer — shop now and save!', bg:'linear-gradient(90deg,#a64fd6,#7a4ff0)' },
};

function seedVideos() {
  return [
    { id:'v1', title:'Resin Art in the making', caption:'Watch how each piece is poured by hand',
      src:'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      poster:'https://images.unsplash.com/photo-1578500351865-d6c3706f46bc?auto=format&fit=crop&w=500&q=80' },
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

// localStorage versions of category/review helpers (fallback only)
function localSubMods() { try { return JSON.parse(localStorage.getItem(LS_SUBS)) || {}; } catch { return {}; } }
function writeSubMods(m) { localStorage.setItem(LS_SUBS, JSON.stringify(m)); }
function localCategoriesFull() {
  const mods = localSubMods();
  return CATEGORIES.map(cat => {
    const m = mods[cat.id] || {};
    const hidden = m.hidden || [], renames = m.renames || {};
    const base = cat.subs.filter(s => !hidden.includes(s.id)).map(s => renames[s.id] ? { ...s, name: renames[s.id] } : s);
    return { ...cat, subs: [...base, ...(m.custom || [])] };
  });
}
function localReviews() { try { return JSON.parse(localStorage.getItem(LS_REVIEWS)) || {}; } catch { return {}; } }
function writeReviews(r) { localStorage.setItem(LS_REVIEWS, JSON.stringify(r)); }

// ============================================================
// THE API — backend first, localStorage fallback
// ============================================================
export const api = {
  // ---- categories ----
  async getCategories() { return this.getCategoriesFull(); },
  async getCategoriesFull() {
    return withFallback(
      () => req('/categories'),
      () => localCategoriesFull()
    );
  },
  async addSub(categoryId, name) {
    return withFallback(
      () => req(`/categories/${categoryId}/subs`, { method:'POST', body:{ name } }),
      () => localAddSub(categoryId, name)
    );
  },
  async renameSub(categoryId, subId, newName) {
    return withFallback(
      () => req(`/categories/${categoryId}/subs/${subId}`, { method:'PUT', body:{ name:newName } }),
      () => localRenameSub(categoryId, subId, newName)
    );
  },
  async removeSub(categoryId, subId) {
    return withFallback(
      () => req(`/categories/${categoryId}/subs/${subId}`, { method:'DELETE' }),
      () => localRemoveSub(categoryId, subId)
    );
  },

  // ---- products ----
  async getProducts() {
    return withFallback(() => req('/products'), () => readProducts());
  },
  async getProduct(id) {
    return withFallback(() => req(`/products/${id}`), () => readProducts().find(p => p.id === id) || null);
  },
  async getByCategory(catId, subId = null) {
    return withFallback(
      () => req(`/products/category/${catId}${subId ? `?sub=${encodeURIComponent(subId)}` : ''}`),
      () => readProducts().filter(p => p.category === catId && (!subId || p.sub === subId))
    );
  },
  async getBestsellers(n = 8) {
    return withFallback(() => req(`/products/bestsellers?n=${n}`), () => readProducts().slice(0, n));
  },
  async createProduct(data) {
    return withFallback(
      () => req('/products', { method:'POST', body:data }),
      () => { const list = readProducts(); const product = { id:'p'+Date.now(), stock:0, optionType:'none', ...data }; list.unshift(product); writeProducts(list); return product; }
    );
  },
  async updateProduct(id, data) {
    return withFallback(
      () => req(`/products/${id}`, { method:'PUT', body:data }),
      () => { const list = readProducts().map(p => p.id === id ? { ...p, ...data } : p); writeProducts(list); return list.find(p => p.id === id); }
    );
  },
  async deleteProduct(id) {
    return withFallback(
      () => req(`/products/${id}`, { method:'DELETE' }),
      () => { writeProducts(readProducts().filter(p => p.id !== id)); return true; }
    );
  },
  async bulkCreateProducts(rows) {
    return withFallback(
      async () => { const r = await req('/products/bulk', { method:'POST', body:{ items:rows } }); return { added: r.count ?? 0 }; },
      () => localBulk(rows)
    );
  },

  // ---- orders ----
  async getOrders() {
    return withFallback(() => req('/orders'), () => readOrders());
  },
  async getOrdersByPhone(phone) {
    return withFallback(
      () => req(`/orders/by-phone/${encodeURIComponent(phone)}`),
      () => readOrders().filter(o => o.customer?.phone === phone || o.userPhone === phone)
    );
  },
  async createOrder(order) {
    return withFallback(
      () => req('/orders', { method:'POST', body:order }),
      () => { const list = readOrders(); const id = 'DIL-'+(1043+list.length); const full = { id, createdAt:Date.now(), status:'Processing', ...order }; list.unshift(full); writeOrders(list); return full; }
    );
  },
  async updateOrderStatus(id, status) {
    return withFallback(
      () => req(`/orders/${id}/status`, { method:'PUT', body:{ status } }),
      () => { const list = readOrders().map(o => o.id === id ? { ...o, status } : o); writeOrders(list); return list.find(o => o.id === id); }
    );
  },

  // ---- videos ----
  async getVideos() {
    return withFallback(() => req('/videos'), () => readVideos());
  },
  async createVideo(data) {
    return withFallback(
      () => req('/videos', { method:'POST', body:data }),
      () => { const list = readVideos(); const video = { id:'v'+Date.now(), title:'', caption:'', src:'', poster:'', ...data }; list.unshift(video); writeVideos(list); return video; }
    );
  },
  async deleteVideo(id) {
    return withFallback(
      () => req(`/videos/${id}`, { method:'DELETE' }),
      () => { writeVideos(readVideos().filter(v => v.id !== id)); return true; }
    );
  },

  // ---- coupons ----
  async getCoupons() {
    return withFallback(() => req('/coupons'), () => readCoupons());
  },
  async createCoupon(data) {
    return withFallback(
      async () => {
        const code = (data.code || '').trim().toUpperCase();
        if (!code) return { error: 'Code is required.' };
        return req('/coupons', { method:'POST', body:{ ...data, code } });
      },
      () => localCreateCoupon(data)
    );
  },
  async updateCoupon(code, patch) {
    return withFallback(
      () => req(`/coupons/${encodeURIComponent(code)}`, { method:'PUT', body:patch }),
      () => { const list = readCoupons().map(c => c.code === code ? { ...c, ...patch } : c); writeCoupons(list); return list.find(c => c.code === code); }
    );
  },
  async deleteCoupon(code) {
    return withFallback(
      () => req(`/coupons/${encodeURIComponent(code)}`, { method:'DELETE' }),
      () => { writeCoupons(readCoupons().filter(c => c.code !== code)); return true; }
    );
  },
  async validateCoupon(rawCode, subtotal, items = []) {
    const code = (rawCode || '').trim().toUpperCase();
    if (!code) return { ok: false, reason: 'Enter a code.' };
    return withFallback(
      async () => {
        const r = await req('/coupons/validate', { method:'POST', body:{ code, subtotal, items } });
        if (!r.ok) return { ok:false, reason: r.error || 'Invalid code.' };
        return r;
      },
      () => localValidateCoupon(code, subtotal, items)
    );
  },

  // ---- settings ----
  async getSettings() {
    return withFallback(() => req('/settings'), () => readSettings());
  },
  async updateSettings(patch) {
    return withFallback(
      () => req('/settings', { method:'PUT', body:patch }),
      () => { const s = { ...readSettings(), ...patch }; writeSettings(s); return s; }
    );
  },

  // ---- reviews ----
  async getReviews(productId) {
    return withFallback(() => req(`/reviews/${productId}`), () => (localReviews()[productId] || []));
  },
  async getRatingSummary(productId) {
    return withFallback(
      () => req(`/reviews/${productId}/summary`),
      () => { const list = localReviews()[productId] || []; if (!list.length) return { avg:0, count:0 }; const avg = list.reduce((s,r)=>s+r.rating,0)/list.length; return { avg: Math.round(avg*10)/10, count:list.length }; }
    );
  },
  async canReview(productId, phone) {
    return withFallback(
      () => req(`/reviews/${productId}/can?phone=${encodeURIComponent(phone || '')}`),
      () => localCanReview(productId, phone)
    );
  },
  async addReview(productId, { name, phone, rating, text }) {
    return withFallback(
      () => req(`/reviews/${productId}`, { method:'POST', body:{ name, phone, rating, text } }),
      () => localAddReview(productId, { name, phone, rating, text })
    );
  },

  // ---- reset (local demo only) ----
  async resetDemo() {
    [LS_PRODUCTS, LS_ORDERS, LS_VIDEOS, LS_COUPONS, LS_SETTINGS, LS_SUBS, LS_REVIEWS].forEach(k => localStorage.removeItem(k));
    seed();
    return true;
  },
};

// ============================================================
// Local fallback implementations (only run when backend is off)
// ============================================================
function localAddSub(categoryId, name) {
  const clean = String(name || '').trim();
  if (!clean) return { ok:false, error:'Name required' };
  const mods = localSubMods(); const m = mods[categoryId] || { custom:[], hidden:[] };
  const id = clean.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') + '-' + Date.now().toString().slice(-4);
  const baseCat = CATEGORIES.find(c => c.id === categoryId);
  const visibleBase = (baseCat?.subs || []).filter(s => !(m.hidden || []).includes(s.id));
  const existing = [...visibleBase, ...(m.custom || [])].map(s => s.name.toLowerCase());
  if (existing.includes(clean.toLowerCase())) return { ok:false, error:'That sub-category already exists' };
  m.custom = [...(m.custom || []), { id, name:clean, custom:true }]; mods[categoryId] = m; writeSubMods(mods);
  return { ok:true, sub:{ id, name:clean } };
}
function localRenameSub(categoryId, subId, newName) {
  const clean = String(newName || '').trim(); if (!clean) return { ok:false, error:'Name required' };
  const mods = localSubMods(); const m = mods[categoryId] || { custom:[], hidden:[] };
  const ci = (m.custom || []).findIndex(s => s.id === subId);
  if (ci >= 0) m.custom[ci] = { ...m.custom[ci], name:clean };
  else { m.renames = m.renames || {}; m.renames[subId] = clean; }
  mods[categoryId] = m; writeSubMods(mods); return { ok:true };
}
function localRemoveSub(categoryId, subId) {
  const mods = localSubMods(); const m = mods[categoryId] || { custom:[], hidden:[] };
  const baseCat = CATEGORIES.find(c => c.id === categoryId);
  if ((baseCat?.subs || []).some(s => s.id === subId)) m.hidden = [...new Set([...(m.hidden || []), subId])];
  else m.custom = (m.custom || []).filter(s => s.id !== subId);
  mods[categoryId] = m; writeSubMods(mods); return { ok:true };
}
function localBulk(rows) {
  const list = readProducts(); let added = 0;
  for (const r of rows) { if (!r.name) continue; list.unshift({ id:'p'+Date.now()+'_'+added, name:r.name, category:r.category||'mobile-covers', sub:r.sub||'', price:Number(r.price)||0, mrp:Number(r.mrp)||0, stock:Number(r.stock)||0, optionType:r.optionType||'none', image:r.image||'' }); added++; }
  writeProducts(list); return { added };
}
function localCreateCoupon(data) {
  const list = readCoupons(); const code = (data.code||'').trim().toUpperCase();
  if (!code) return { error:'Code is required.' };
  if (list.some(c => c.code === code)) return { error:'That code already exists.' };
  const coupon = { code, type:['flat','percent','bogo'].includes(data.type)?data.type:'percent', value:Number(data.value)||0, buyQty:Number(data.buyQty)||1, freeQty:Number(data.freeQty)||1, minOrder:Number(data.minOrder)||0, active:data.active!==false, expiry:data.expiry||'' };
  list.unshift(coupon); writeCoupons(list); return coupon;
}
function localValidateCoupon(code, subtotal, items) {
  const c = readCoupons().find(x => x.code === code);
  if (!c) return { ok:false, reason:'Invalid code.' };
  if (!c.active) return { ok:false, reason:'This code is no longer active.' };
  if (c.expiry && new Date(c.expiry) < new Date(new Date().toDateString())) return { ok:false, reason:'This code has expired.' };
  if (c.minOrder && subtotal < c.minOrder) return { ok:false, reason:`Add ₹${(c.minOrder-subtotal).toLocaleString('en-IN')} more to use this code.` };
  let discount = 0;
  if (c.type === 'bogo') {
    const buy = Math.max(1, Number(c.buyQty)||1), free = Math.max(1, Number(c.freeQty)||1);
    const units = []; for (const it of items) for (let i=0;i<it.qty;i++) units.push(it.price);
    units.sort((a,b)=>a-b); const groupSize = buy+free; const fullGroups = Math.floor(units.length/groupSize);
    if (fullGroups === 0) return { ok:false, reason:`Add ${groupSize-units.length} more item(s) to use this Buy ${buy} Get ${free} offer.` };
    for (let i=0;i<free*fullGroups;i++) discount += units[i];
  } else if (c.type === 'flat') discount = Math.min(c.value, subtotal);
  else discount = Math.round(subtotal*c.value/100);
  return { ok:true, discount, coupon:{ code:c.code, type:c.type, value:c.value } };
}
function localCanReview(productId, phone) {
  if (!phone) return { ok:false, reason:'login' };
  if ((localReviews()[productId] || []).some(r => r.phone === phone)) return { ok:false, reason:'already' };
  const orders = readOrders().filter(o => (o.customer?.phone === phone || o.userPhone === phone));
  const delivered = orders.some(o => o.status === 'Delivered' && (o.items || []).some(it => it.productId === productId));
  return delivered ? { ok:true } : { ok:false, reason:'not-delivered' };
}
function localAddReview(productId, { name, phone, rating, text }) {
  const elig = localCanReview(productId, phone); if (!elig.ok) return { ok:false, reason:elig.reason };
  const r = Math.max(1, Math.min(5, Number(rating)||0)); if (!r) return { ok:false, reason:'rating' };
  const all = localReviews(); const list = all[productId] || [];
  list.unshift({ id:'r'+Date.now(), name:name||'Customer', phone, rating:r, text:String(text||'').trim(), createdAt:Date.now() });
  all[productId] = list; writeReviews(all); return { ok:true };
}
