// ============================================================
// Dillora Dashboard — API service
// Talks to the backend REST API with the admin JWT attached.
// Method names + return shapes mirror the storefront's data/api.js so the
// ported admin pages work unchanged.
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'dillora_admin_token';

export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
};
export const setToken = (t) => {
  if (typeof window === 'undefined') return;
  if (t) window.localStorage.setItem(TOKEN_KEY, t);
  else window.localStorage.removeItem(TOKEN_KEY);
};

async function req(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(API_URL + path, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // Surface error-shaped payloads to the UI instead of throwing so forms
    // can show a message (matches the storefront's behaviour).
    if (data && (data.error || data.ok === false)) return data;
    throw new Error((data && data.error) || `API ${method} ${path} -> ${res.status}`);
  }
  return data;
}

// Banner presets — mirrored from the storefront so the Offers page renders identically.
export const BANNER_PRESETS = {
  diwali:    { label: 'Diwali',       text: '✨ Diwali Dhamaka — extra savings on every handmade piece!', bg: 'linear-gradient(90deg,#8a39bd,#a64fd6,#e57fc4)' },
  valentine: { label: "Valentine's",  text: "💜 Valentine's Special — gift something handmade with love", bg: 'linear-gradient(90deg,#e57fc4,#a64fd6)' },
  rakhi:     { label: 'Rakhi',        text: '🪢 Rakhi Offer — celebrate the bond with a handmade gift', bg: 'linear-gradient(90deg,#7a4ff0,#a64fd6)' },
  sale:      { label: 'General Sale', text: '🎉 Limited-time offer — shop now and save!', bg: 'linear-gradient(90deg,#a64fd6,#7a4ff0)' },
};

export const api = {
  // ---- auth ----
  async login(email, password) {
    return req('/auth/login', { method: 'POST', body: { email, password } });
  },
  async me() {
    return req('/auth/me');
  },
  async getAdmins() { return req('/auth/admins'); },
  async changePassword(currentPassword, newPassword) {
    return req('/auth/password', { method: 'PUT', body: { currentPassword, newPassword } });
  },
  async registerAdmin(data) {
    return req('/auth/register', { method: 'POST', body: data });
  },
  async removeAdmin(id) {
    return req(`/auth/admins/${id}`, { method: 'DELETE' });
  },

  // ---- categories ----
  async getCategories() { return req('/categories'); },
  async addSub(categoryId, name) {
    return req(`/categories/${categoryId}/subs`, { method: 'POST', body: { name } });
  },
  async renameSub(categoryId, subId, newName) {
    return req(`/categories/${categoryId}/subs/${subId}`, { method: 'PUT', body: { name: newName } });
  },
  async removeSub(categoryId, subId) {
    return req(`/categories/${categoryId}/subs/${subId}`, { method: 'DELETE' });
  },

  // ---- phone brands + models ----
  async getAllBrands() { return req('/brands/all'); },
  async createBrand(data) { return req('/brands', { method: 'POST', body: data }); },
  async updateBrand(id, patch) { return req(`/brands/${id}`, { method: 'PUT', body: patch }); },
  async deleteBrand(id) { return req(`/brands/${id}`, { method: 'DELETE' }); },
  async addBrandModel(brandId, data) {
    return req(`/brands/${brandId}/models`, { method: 'POST', body: data });
  },
  async addBrandModelsBulk(brandId, models) {
    return req(`/brands/${brandId}/models/bulk`, { method: 'POST', body: { models } });
  },
  async updateBrandModel(brandId, modelId, patch) {
    return req(`/brands/${brandId}/models/${modelId}`, { method: 'PUT', body: patch });
  },
  async removeBrandModel(brandId, modelId) {
    return req(`/brands/${brandId}/models/${modelId}`, { method: 'DELETE' });
  },

  // ---- shipping & return policies (per category) ----
  async getPolicies() { return req('/policy'); },
  async savePolicy(category, data) { return req(`/policy/${encodeURIComponent(category)}`, { method: 'PUT', body: data }); },
  async deletePolicy(category) { return req(`/policy/${encodeURIComponent(category)}`, { method: 'DELETE' }); },

  // ---- products ----
  async getProducts() { return req('/products'); },
  async getProduct(id) { return req(`/products/${id}`); },
  async createProduct(data) { return req('/products', { method: 'POST', body: data }); },
  async updateProduct(id, data) { return req(`/products/${id}`, { method: 'PUT', body: data }); },
  async deleteProduct(id) { return req(`/products/${id}`, { method: 'DELETE' }); },
  async bulkCreateProducts(rows) {
    const r = await req('/products/bulk', { method: 'POST', body: { items: rows } });
    return { added: r?.count ?? 0 };
  },
  // stock lock (owner/manager) + history
  async lockProduct(id, editorEmail = '') { return req(`/products/${id}/lock`, { method: 'PUT', body: { editorEmail } }); },
  async unlockProduct(id) { return req(`/products/${id}/unlock`, { method: 'PUT' }); },
  async setProductEditor(id, editorEmail) { return req(`/products/${id}/editor`, { method: 'PUT', body: { editorEmail } }); },
  async getStockHistory(id) { return req(`/products/${id}/stock-history`); },

  // ---- orders ----
  async getOrders() { return req('/orders'); },
  async updateOrderStatus(id, status) {
    return req(`/orders/${id}/status`, { method: 'PUT', body: { status } });
  },
  async decideCancellation(id, action) {
    return req(`/orders/${id}/cancellation`, { method: 'PUT', body: { action } });
  },
  async updateRefund(id, refundStatus) {
    return req(`/orders/${id}/refund`, { method: 'PUT', body: { refundStatus } });
  },
  async collectBalance(id) { return req(`/orders/${id}/collect-balance`, { method: 'PUT' }); },

  // ---- videos ----
  async getVideos() { return req('/videos'); },
  async createVideo(data) { return req('/videos', { method: 'POST', body: data }); },
  async deleteVideo(id) { return req(`/videos/${id}`, { method: 'DELETE' }); },

  // ---- coupons ----
  async getCoupons() { return req('/coupons'); },
  async createCoupon(data) { return req('/coupons', { method: 'POST', body: data }); },
  async updateCoupon(code, patch) {
    return req(`/coupons/${encodeURIComponent(code)}`, { method: 'PUT', body: patch });
  },
  async deleteCoupon(code) {
    return req(`/coupons/${encodeURIComponent(code)}`, { method: 'DELETE' });
  },

  // ---- invoices ----
  async getInvoices(params = {}) {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return req(`/invoices${qs ? `?${qs}` : ''}`);
  },
  async getInvoice(orderId) { return req(`/invoices/${orderId}`); },
  async emailInvoice(orderId, email) {
    return req(`/invoices/${orderId}/email`, { method: 'POST', body: email ? { email } : {} });
  },
  // PDF needs the auth header, so fetch as a blob (can't just open the URL).
  async downloadInvoice(orderId) {
    const token = getToken();
    const res = await fetch(`${API_URL}/invoices/${orderId}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Could not download invoice.');
    return res.blob();
  },

  // ---- promotional offers (auto-apply engine, separate from coupons) ----
  async getOffers() { return req('/offers'); },
  async createOffer(data) { return req('/offers', { method: 'POST', body: data }); },
  async updateOffer(id, patch) { return req(`/offers/${id}`, { method: 'PUT', body: patch }); },
  async deleteOffer(id) { return req(`/offers/${id}`, { method: 'DELETE' }); },

  // ---- settings ----
  async getSettings() { return req('/settings'); },
  async updateSettings(patch) { return req('/settings', { method: 'PUT', body: patch }); },

  // ---- product reviews moderation ----
  async getAllReviews() { return req('/reviews/admin/all'); },
  async approveReview(id, approved) { return req(`/reviews/admin/${id}/approve`, { method: 'PUT', body: { approved } }); },
  async replyReview(id, text) { return req(`/reviews/admin/${id}/reply`, { method: 'PUT', body: { text } }); },
  async deleteReview(id) { return req(`/reviews/admin/${id}`, { method: 'DELETE' }); },

  // ---- feedback (site testimonials moderation) ----
  async getAllFeedback() { return req('/feedback/all'); },
  async approveFeedback(id, approved) { return req(`/feedback/${id}/approve`, { method: 'PUT', body: { approved } }); },
  async deleteFeedback(id) { return req(`/feedback/${id}`, { method: 'DELETE' }); },

  // ---- media (Cloudinary) ----
  async uploadImage(file, folder = 'dillora/products') {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    return req('/upload', { method: 'POST', body: fd, isForm: true });
  },
  async uploadVideo(file, folder = 'dillora/videos') {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    return req('/upload/video', { method: 'POST', body: fd, isForm: true });
  },
};
