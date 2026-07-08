// ============================================================
// DILLORA — API layer (backend-only)
// Every read/write goes through here and talks to the Node/Express +
// MongoDB backend via fetch(). There is no local/offline fallback: the
// storefront is fully driven by live backend data.
//
//   Set the backend URL in .env.local:
//     NEXT_PUBLIC_API_URL=http://localhost:5000/api
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Per-page in-memory cache for rating summaries (see getRatingSummary) to avoid
// refetching the same product's rating across multiple cards/sections.
const _ratingCache = new Map();

// ---------- fetch helper ----------
async function req(path, { method = 'GET', body } = {}) {
  if (!API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not set — cannot reach the backend.');
  }
  const res = await fetch(API_URL + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let message = `API ${method} ${path} -> ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch { /* non-JSON error body */ }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  // 204 / empty body safety
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Festive banner presets — pure UI config (not catalog data), kept here so the
// FestiveBanner + dashboard offers page share a single source of truth.
export const BANNER_PRESETS = {
  diwali:    { label:'Diwali',    text:'✨ Diwali Dhamaka — extra savings on every handmade piece!', bg:'linear-gradient(90deg,#8a39bd,#a64fd6,#e57fc4)' },
  valentine: { label:"Valentine's", text:'💜 Valentine\'s Special — gift something handmade with love', bg:'linear-gradient(90deg,#e57fc4,#a64fd6)' },
  rakhi:     { label:'Rakhi',     text:'🪢 Rakhi Offer — celebrate the bond with a handmade gift', bg:'linear-gradient(90deg,#7a4ff0,#a64fd6)' },
  sale:      { label:'General Sale', text:'🎉 Limited-time offer — shop now and save!', bg:'linear-gradient(90deg,#a64fd6,#7a4ff0)' },
};

// ============================================================
// THE API — backend only
// ============================================================
export const api = {
  // ---- categories ----
  async getCategories() { return this.getCategoriesFull(); },
  async getCategoriesFull() { return req('/categories'); },
  async addSub(categoryId, name) {
    return req(`/categories/${categoryId}/subs`, { method:'POST', body:{ name } });
  },
  async renameSub(categoryId, subId, newName) {
    return req(`/categories/${categoryId}/subs/${subId}`, { method:'PUT', body:{ name:newName } });
  },
  async removeSub(categoryId, subId) {
    return req(`/categories/${categoryId}/subs/${subId}`, { method:'DELETE' });
  },

  // ---- phone brands + models (active only) ----
  async getBrands() { return req('/brands'); },

  // ---- shipping & return policy (per category, general fallback) ----
  async getPolicy(category) { return req(`/policy/${encodeURIComponent(category || 'general')}`); },

  // ---- promotional offers (auto-apply) ----
  async evaluateOffers(items) { return req('/offers/evaluate', { method:'POST', body:{ items } }); },
  async getActiveOffers() { return req('/offers/active'); },

  // ---- products ----
  async getProducts() { return req('/products'); },
  async getProduct(id) { return req(`/products/${id}`); },
  async getByCategory(catId, subId = null) {
    return req(`/products/category/${catId}${subId ? `?sub=${encodeURIComponent(subId)}` : ''}`);
  },
  async getBestsellers(n = 8) { return req(`/products/bestsellers?n=${n}`); },
  async getRelated(id, page = 1, limit = 8) { return req(`/products/${id}/related?page=${page}&limit=${limit}`); },
  async createProduct(data) { return req('/products', { method:'POST', body:data }); },
  async updateProduct(id, data) { return req(`/products/${id}`, { method:'PUT', body:data }); },
  async deleteProduct(id) { return req(`/products/${id}`, { method:'DELETE' }); },
  async bulkCreateProducts(rows) {
    const r = await req('/products/bulk', { method:'POST', body:{ items:rows } });
    return { added: r.count ?? 0 };
  },

  // ---- orders ----
  async getOrders() { return req('/orders'); },
  async getOrdersByPhone(phone) { return req(`/orders/by-phone/${encodeURIComponent(phone)}`); },
  async createOrder(order) { return req('/orders', { method:'POST', body:order }); },
  async updateOrderStatus(id, status) {
    return req(`/orders/${id}/status`, { method:'PUT', body:{ status } });
  },
  // Customer requests a cancellation (mobile covers, within 48h). Ownership is
  // verified server-side by matching the phone on the order.
  async requestCancellation(id, phone, reason) {
    return req(`/orders/${id}/cancel`, { method:'POST', body:{ phone, reason } });
  },

  // ---- payments (Razorpay) ----
  // Create a Razorpay order for the given rupee amount. Returns { keyId, orderId, amount, currency }.
  async createPaymentOrder(amount) {
    return req('/payment/order', { method:'POST', body:{ amount } });
  },
  // Verify the payment signature server-side and, on success, persist the order.
  // `payload` = { razorpay_order_id, razorpay_payment_id, razorpay_signature, order }.
  async verifyPayment(payload) {
    return req('/payment/verify', { method:'POST', body:payload });
  },

  // ---- videos ----
  async getVideos() { return req('/videos'); },
  async createVideo(data) { return req('/videos', { method:'POST', body:data }); },
  async deleteVideo(id) { return req(`/videos/${id}`, { method:'DELETE' }); },

  // ---- coupons ----
  async getCoupons() { return req('/coupons'); },
  async createCoupon(data) {
    const code = (data.code || '').trim().toUpperCase();
    if (!code) return { error: 'Code is required.' };
    return req('/coupons', { method:'POST', body:{ ...data, code } });
  },
  async updateCoupon(code, patch) {
    return req(`/coupons/${encodeURIComponent(code)}`, { method:'PUT', body:patch });
  },
  async deleteCoupon(code) {
    return req(`/coupons/${encodeURIComponent(code)}`, { method:'DELETE' });
  },
  async validateCoupon(rawCode, subtotal, items = []) {
    const code = (rawCode || '').trim().toUpperCase();
    if (!code) return { ok: false, reason: 'Enter a code.' };
    const r = await req('/coupons/validate', { method:'POST', body:{ code, subtotal, items } });
    if (!r.ok) return { ok:false, reason: r.error || 'Invalid code.' };
    return r;
  },

  // ---- settings ----
  async getSettings() { return req('/settings'); },
  async updateSettings(patch) { return req('/settings', { method:'PUT', body:patch }); },

  // ---- reviews ----
  async getReviews(productId) { return req(`/reviews/${productId}`); },
  // Rating summaries are read by every product card, and the same product can
  // appear in several sections on one page. Cache the in-flight/resolved promise
  // per product so we hit the API at most once per product per page load.
  getRatingSummary(productId) {
    if (_ratingCache.has(productId)) return _ratingCache.get(productId);
    const p = req(`/reviews/${productId}/summary`).catch((err) => {
      _ratingCache.delete(productId); // don't cache failures
      throw err;
    });
    _ratingCache.set(productId, p);
    return p;
  },
  async canReview(productId, phone) {
    return req(`/reviews/${productId}/can?phone=${encodeURIComponent(phone || '')}`);
  },
  async addReview(productId, { name, phone, email, title, rating, text, images, video }) {
    return req(`/reviews/${productId}`, { method:'POST', body:{ name, phone, email, title, rating, text, images, video } });
  },
  // Gated media upload (verified buyers only). Returns { url }.
  async uploadReviewMedia(productId, phone, file, kind = 'image') {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('phone', phone || '');
    fd.append('kind', kind);
    const res = await fetch(`${API_URL}/reviews/${productId}/upload`, { method:'POST', body: fd });
    if (!res.ok) {
      let m = 'Upload failed.';
      try { const d = await res.json(); if (d?.error) m = d.error; } catch { /* ignore */ }
      throw new Error(m);
    }
    return res.json();
  },

  // ---- feedback (site-wide testimonials) ----
  async getFeedback() { return req('/feedback'); },
  async getFeedbackSummary() { return req('/feedback/summary'); },
  async canSubmitFeedback(phone) { return req(`/feedback/can?phone=${encodeURIComponent(phone || '')}`); },
  async submitFeedback(data) { return req('/feedback', { method:'POST', body:data }); },
};
