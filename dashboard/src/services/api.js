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

  // ---- orders ----
  async getOrders() { return req('/orders'); },
  async updateOrderStatus(id, status) {
    return req(`/orders/${id}/status`, { method: 'PUT', body: { status } });
  },

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

  // ---- settings ----
  async getSettings() { return req('/settings'); },
  async updateSettings(patch) { return req('/settings', { method: 'PUT', body: patch }); },

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
