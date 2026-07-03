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

  // ---- products ----
  async getProducts() { return req('/products'); },
  async getProduct(id) { return req(`/products/${id}`); },
  async getByCategory(catId, subId = null) {
    return req(`/products/category/${catId}${subId ? `?sub=${encodeURIComponent(subId)}` : ''}`);
  },
  async getBestsellers(n = 8) { return req(`/products/bestsellers?n=${n}`); },
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
  async getRatingSummary(productId) { return req(`/reviews/${productId}/summary`); },
  async canReview(productId, phone) {
    return req(`/reviews/${productId}/can?phone=${encodeURIComponent(phone || '')}`);
  },
  async addReview(productId, { name, phone, rating, text }) {
    return req(`/reviews/${productId}`, { method:'POST', body:{ name, phone, rating, text } });
  },
};
