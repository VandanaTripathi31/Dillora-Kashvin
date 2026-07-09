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
| 1.1 | Skeleton loaders matching final content (grid, PDP, cart) replace spinners | ⏳ | skeletons feel ~20–30% faster than spinners |
| 1.2 | Image loading: LQIP blur-up, `priority` on LCP/hero, correct `sizes`, `aspect-ratio` | ⏳ | fixes CLS + LCP; some already via next/image |
| 1.3 | Optimistic UI for add-to-cart / wishlist / qty (React 19 `useOptimistic`) | ⏳ | instant feedback regardless of network |
| 1.4 | Server-render + streaming `<Suspense>` for home/category/product | ⏳ | biggest smoothness jump; architectural — do carefully |
| 1.5 | Paginate `/products` (Search pulls all 108 / 53 KB today) | ⏳ | backend + Search.jsx |

---

## Phase 2 — Motion & transition polish
*Premium, 60fps motion on both mobile and desktop.*

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Native View Transitions API for routes + `<Link>` prefetch | ⏳ | cheaper than JS libs on low-end Android; prefetch is required |
| 2.2 | ScrollProgress → rAF write or CSS scroll-driven (stop per-frame React re-render) | ⏳ | current impl re-renders every scroll event |
| 2.3 | Gate all hover behind `@media (hover:hover)`; scope `transition-all`→transform/opacity; surgical `will-change` | ⏳ | prevents stuck hover on touch; avoids jank |
| 2.4 | Tokenized easing/duration (~250ms ease-out `cubic-bezier(.22,1,.36,1)`) | ⏳ | consistent premium feel |
| 2.5 | Reduce heavy always-on hero animations on mobile (animated blur, many infinite loops) | ⏳ | battery/CPU |
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
