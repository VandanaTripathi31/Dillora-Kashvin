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

// Session cache for the lightweight search index (see getSearchIndex).
let _searchIndexPromise = null;

// Rating summaries are read by every product card. Rather than one request per
// card (a 24-request fan-out on the homepage), calls made in the same tick are
// coalesced into a single batched request: GET /reviews/summary?ids=a,b,c.
let _ratingQueue = new Map();   // productId -> { resolve, reject } awaiting this tick
let _ratingScheduled = false;

function _flushRatingQueue() {
  const queue = _ratingQueue;
  _ratingQueue = new Map();
  _ratingScheduled = false;
  const ids = [...queue.keys()];
  if (!ids.length) return;

  // Chunk so a very large grid can't blow the query-string length limit.
  const CHUNK = 60;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    req(`/reviews/summary?ids=${encodeURIComponent(chunk.join(','))}`)
      .then((map) => {
        const m = map || {};
        for (const id of chunk) queue.get(id).resolve(m[id] || { avg: 0, count: 0 });
      })
      .catch((err) => {
        for (const id of chunk) {
          _ratingCache.delete(id); // don't cache failures — allow a later retry
          queue.get(id).reject(err);
        }
      });
  }
}

// ---------- resilience config ----------
// Mobile networks drop packets and the backend (Render) can cold-start, so no
// request may hang forever. Each attempt is capped by a timeout; idempotent GETs
// are retried a few times with exponential backoff. Mutations (POST/PUT/DELETE)
// are NEVER auto-retried — retrying createOrder / verifyPayment could double a
// charge or an order — they only get the timeout so the UI can fail cleanly.
const REQUEST_TIMEOUT_MS = 15000;   // per attempt
const GET_MAX_RETRIES = 2;          // extra tries for GET only (3 attempts total)
const RETRYABLE_STATUS = new Set([429, 502, 503, 504]); // transient / cold-start / gateway

const _delay = (ms) => new Promise((r) => setTimeout(r, ms));
const _backoff = (attempt) => Math.min(2000, 400 * 2 ** (attempt - 1)); // 400, 800, 1600ms

// ---------- fetch helper ----------
async function req(path, { method = 'GET', body, timeout = REQUEST_TIMEOUT_MS, retries } = {}) {
  if (!API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not set — cannot reach the backend.');
  }

  const isGet = method === 'GET';
  const maxAttempts = 1 + (retries ?? (isGet ? GET_MAX_RETRIES : 0));
  let lastErr;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // AbortController enforces the per-attempt timeout so a stalled request can
    // never hang the UI indefinitely.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(API_URL + path, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        // Retry transient server errors, but only for idempotent GETs.
        if (isGet && RETRYABLE_STATUS.has(res.status) && attempt < maxAttempts) {
          lastErr = new Error(`API ${method} ${path} -> ${res.status}`);
          await _delay(_backoff(attempt));
          continue;
        }
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
    } catch (err) {
      clearTimeout(timer);

      const isTimeout = err?.name === 'AbortError';
      // A fetch network failure surfaces as a TypeError (no response received).
      const isNetwork = err?.name === 'TypeError';

      // Retry idempotent GETs on timeout / network drop; otherwise surface it.
      if (isGet && (isTimeout || isNetwork) && attempt < maxAttempts) {
        lastErr = err;
        await _delay(_backoff(attempt));
        continue;
      }
      if (isTimeout) {
        const e = new Error('The request took too long. Please check your connection and try again.');
        e.status = 0;
        e.code = 'timeout';
        throw e;
      }
      if (isNetwork) {
        const e = new Error('Could not reach the server. Please check your connection and try again.');
        e.status = 0;
        e.code = 'network';
        throw e;
      }
      throw err;
    }
  }

  // Exhausted retries (last failure was a transient/network error).
  throw lastErr || new Error(`API ${method} ${path} failed after ${maxAttempts} attempts`);
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
  // Lightweight list (id/name/image/category/sub/price) for the search box.
  // Cached for the session so re-opening search never refetches.
  getSearchIndex() {
    if (!_searchIndexPromise) {
      _searchIndexPromise = req('/products/search-index').catch((e) => {
        _searchIndexPromise = null; // allow a retry after a failure
        throw e;
      });
    }
    return _searchIndexPromise;
  },
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
    // Enqueue this id; every id requested in the same tick ships in one request.
    const p = new Promise((resolve, reject) => {
      _ratingQueue.set(productId, { resolve, reject });
    });
    _ratingCache.set(productId, p);
    if (!_ratingScheduled) {
      _ratingScheduled = true;
      Promise.resolve().then(_flushRatingQueue);
    }
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
