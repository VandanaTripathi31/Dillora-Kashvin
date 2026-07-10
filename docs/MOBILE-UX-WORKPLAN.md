# Dillora — Mobile & Desktop UX Work Plan

**Goal:** make the storefront industrial-grade and smooth on **any device** — primarily
mid-range Android phones on 4G, but polished on desktop too. Fix the "half loads /
bursts out / nav fails" problems and reach best-in-market perceived quality.

**Stack:** Next.js 16 + React 19 (Vercel) · Node/Express + MongoDB (Render free tier) ·
Cloudinary · Razorpay. Live: `dillora-kashvin.vercel.app` · API `dillora-kashvin-1.onrender.com/api`.

---

## Working rules (the pattern we follow)

1. **One task at a time, in phase order.** No skipping ahead, no fixing things outside the
   current task. If we spot something new, we log it under "Backlog / newly found" — we do
   not fix it on the spot.
2. **Every task has a Definition of Done** (below). A task is not "done" until it's
   **verified** by the stated method, not just written.
3. **Verify before moving on.** Prefer real-browser/preview verification; when the backend
   isn't available, verify the specific mechanism (CSS rules, error paths) and note the gap.
4. **Commit at the end of each task** (or a small group) so there's always a safe checkpoint.
5. **Low-risk first.** Within a phase, do the safe, isolated changes before architectural ones.
6. Keep changes consistent with the surrounding code style. No unrelated refactors.

**Status legend:** ✅ done+verified · 🟡 in progress · ⏳ todo · 🔵 external/user action · ⏭️ deferred

---

## Phase 0 — Launch-critical: stability + core mobile UX
*Everything that makes the site look broken or feel cheap. Must land before go-live.*

| # | Task | Status | Files |
|---|------|--------|-------|
| 0.1 | Nav bar → CSS-driven (drop `isMobile` JS gating) | ✅ | `components/Header.jsx` |
| 0.2 | Global touch baseline (`touch-action`, tap-highlight, `:active` press) | ✅ | `styles/index.css` |
| 0.3 | Quick-add button reachable on touch (hover-reveal only on desktop) | ✅ | `components/UI.jsx` |
| 0.4 | Fetch resilience (timeout + GET-only retry) + error/"Try again" UI | ✅ | `data/api.js`, `lib/useAsync.js`, `components/UI.jsx`, `app/(storefront)/page.jsx`, `context/SettingsContext.jsx`, `components/Reels.jsx`, `components/FestiveBanner.jsx` |
| 0.5 | Keep Render warm — cron-job.org ping `/api/health` every 10 min | 🔵 | external (no code) |
| 0.6 | Batch 24 per-card rating calls → 1 request (~37→~10 requests) | ✅ | backend: new `GET /reviews/summary?ids=` (aggregation) + route before `/:productId`; frontend: `data/api.js` tick-coalesced batcher |
| 0.7 | Happy-path verification (products render through `<Loader>`) | ✅ | verified vs local backend: 29 cards, ratings via 3 batched reqs, 0 errors |
| 0.8 | Commit Phase 0 checkpoint | ⏳ | git |

**Phase 0 exit criteria:** on a real phone, first load shows content (or a clear retry) within
a few seconds even after backend idle; nav is correct instantly; taps feel responsive; no
infinite spinners; no console errors.

---

## Phase 1 — Perceived speed (loading UX)
*Make it always feel fast, never blank/janky.*

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Skeleton loaders matching final content (grid, PDP, cart) replace spinners | ✅ | grid skeleton on home + category + subcategory; **PDP skeleton + reliability (error/retry + 404 "not found")** on product page; reliability also extended to category/subcategory pages. Cart is localStorage-instant → no skeleton needed. Verified all paths + prod build green |
| 1.2 | Image loading: LQIP blur-up, `priority` on LCP/hero, correct `sizes`, `aspect-ratio` | ✅ | homepage hero (3 blobs, main=priority) + 2.8MB craft PNG → next/image (1600px→~309px, AVIF/WebP, blur-up); `priority` prop on ProductCard applied to first 4 cards on category/subcategory (LCP); PDP main image already had priority. Verified optimized + layout intact + build green. Remaining low-value plain `<img>` → backlog |
| 1.3 | Instant/tactile cart feedback | ✅ | **Reframed:** cart & wishlist are localStorage → already instant, so React 19 `useOptimistic` (async-only) does NOT apply. PDP "Add to cart" already toasts + stays (good). Delivered: **cart/wishlist badge "pop" animation** on count change (verified `badgePop` applies, count updates, respects reduced-motion). **RESOLVED** (owner chose toast+stay): quick-add now adds + shows "Added to cart" toast + badge pop and keeps the shopper on the page (consistent with PDP). Verified: stays on page, badge increments, toast renders, build green. Heart-pop micro-anim → Phase 2 |
| 1.4 | Server-render + streaming `<Suspense>` for home/category/product | ⏳ | biggest smoothness jump; architectural — do carefully |
| 1.5 | Lighten Search payload (was all 108 / 53 KB) | ✅ | new backend `GET /products/search-index` (6 fields only, ~20 KB vs 53 KB) + session-cached `getSearchIndex()`; Search.jsx uses it (client-side search UX unchanged). Verified: "charm" → 8 results, hit search-index endpoint, build green. NOTE: backend-first deploy (new endpoint) |

---

## Phase 2 — Motion & transition polish
*Premium, 60fps motion on both mobile and desktop.*

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Native View Transitions API for routes + `<Link>` prefetch | ⏳ | cheaper than JS libs on low-end Android; prefetch is required |
| 2.2 | ScrollProgress → rAF write (stop per-frame React re-render) | ✅ | rewritten with ref + rAF, no state; verified bar tracks scroll, 0 re-renders. Commit dcc47a1 |
| 2.3 | Gate hover behind `@media (hover:hover)` | ✅ | `future.hoverOnlyWhenSupported: true` in tailwind.config → ALL Tailwind hover utilities now compile inside `@media (hover:hover)` (verified 13/13 transform-hover rules gated). Desktop unaffected. `will-change` was a non-issue (`.product-card` CSS is dead/unused). transition-all + plain-CSS `:hover` + dead .product-card CSS → backlog (low value) |
| 2.4 | Tokenized easing/duration | ✅ | **Already satisfied** — `--ease` (index.css) + `ease-brand` (tailwind) token exists and is used consistently (58 uses vs 7 plain `ease`); durations sensible per interaction. No change needed. |
| 2.5 | Reduce heavy always-on hero animations on mobile | ✅ | `@media (max-width:720px)`: stop the float animation on the `blur(70px)` mesh blobs + `blur(26px)` halo (moving a big blur layer is costly on phone GPUs; still blurred, just static) + halve sparkles. Desktop unchanged. Verified mobile off / desktop on, 0 errors |
| 2.6 | Sticky add-to-cart bar + bottom-sheet variant picker on PDP | ⏳ | ~8–15% mobile conversion lift; `.stickybar` scaffold exists |

---

## Phase 3 — Cross-device hardening + verify
*Make it robust on notched phones, tablets, tiny screens; measure before/after.*

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | `viewport-fit=cover` + full safe-area-inset audit | ⏳ | enables the sticky-bar safe padding; needs edge-element audit |
| 3.2 | `100vh` → `100svh`/`dvh` (mobile toolbar cutoff) | ⏳ | drawer height, not-found, admin |
| 3.3 | Horizontal-overflow sweep (decorative blobs, full-bleed rows) | ⏳ | #1 mobile bug class |
| 3.4 | `overscroll-behavior: contain` on carousels/drawers | ⏳ | stop scroll-chaining / pull-to-refresh |
| 3.5 | Real-device test matrix (≤360px Android, iPhone, tablet, desktop) + Lighthouse before/after | ⏳ | PSI needs API key or on-device run |

---

## Definition of Done (per task)
- [ ] Change implemented, consistent with surrounding code.
- [ ] Verified by the stated method (preview browser / CSS-rule / error-path / device).
- [ ] No new console errors or unhandled rejections.
- [ ] Status updated to ✅ in this file (+ note in Progress log).
- [ ] Committed (alone or with its small group).

---

## ⚠️ Deployment order (important — because of 0.6)
The batched frontend calls `GET /reviews/summary`, which only exists after the **backend** is
deployed. **Deploy the backend (Render) BEFORE the frontend (Vercel).** If the frontend ships
first, that endpoint 404s and product ratings show "New" until the backend is live (degrades
gracefully, but ratings vanish in the meantime).

## Progress log
- **2026-07-09** — Phase 0.1–0.4 done + verified in preview (nav CSS-driven at 420/1200px + drawer;
  touch baseline computed-style check; quick-add CSS mechanism; reliability trio: 6 sections show
  error+retry with 0 infinite spinners / 0 unhandled rejections, retry re-fires). Local backend was
  down, so 0.4 happy-path (0.7) still to verify. Cron ping (0.5) instructions handed to user.
- **2026-07-10** — 0.6 rating-batching done: backend `GET /reviews/summary?ids=` (aggregation) +
  route ordered before `/:productId`; frontend tick-coalesced batcher in `data/api.js` (Rating
  component unchanged). 0.7 happy-path verified with local backend running: 29 product cards render
  through `<Loader>`, all card ratings served by **3 batched requests** (0 per-card requests),
  0 console errors, 0 stuck spinners. Only 0.5 (cron, user action) and 0.8 (commit) remain in Phase 0.

## Backlog / newly found (do NOT fix mid-task — triage here)
- Duplicate `getSettings` call: `SettingsContext` **and** `FestiveBanner` both fetch settings → dedup (fold into Phase 1 or 2).
- Duplicate `.reveal` CSS rule (app.css ~416 and ~876) — minor cleanup.
- ~~Product page reliability + PDP skeleton~~ — DONE in 1.1 (error/retry + 404 "not found" + PDP skeleton; secondary fetches already/now catch).
- Other pages to audit for the same infinite-spinner pattern: `account`, `order/[id]`, `wishlist`, `checkout`, `page/[slug]` (most read local/context data, but confirm). Small reliability sweep — schedule as a Phase 1 tail task or Phase 3 hardening.
- Remaining plain `<img>` (lower LCP value) to optionally convert to next/image: `about/page.jsx`, `AdBanners.jsx`, `AdminHero.jsx` (LCP when admin hero enabled — worth doing), `ContentPopup`, `Search.jsx` thumbs, `cart` thumbs (88px, small). Review images already `loading=lazy`. AdminHero is the notable one.
- Dead CSS: the entire `.product-card` / `.product-card__*` rule set in app.css (lines ~102-109, 422-436, 492-494, 626-629, 801-833, 1044-1064) is unused (current ProductCard is Tailwind-based) — safe to delete in a cleanup pass. Also duplicate `.reveal` rule.
- Minor: a few `transition-all` (footer/header/pills/page chips) could be scoped to specific props; low value now that hover is gated. Plain-CSS `:hover` states (.dlr-ic, .btn) not media-gated, but most navigate away on tap so sticky-hover is moot.
