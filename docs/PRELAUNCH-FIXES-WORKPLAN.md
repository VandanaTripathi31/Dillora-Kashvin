# Dillora — Pre-Launch Fixes Work Plan

Fixes for the gaps found in the deep completeness audit (see memory
`prelaunch-completeness-audit-2026-07`). Scope chosen by the owner: 🔴 #1,2,4,5,6
plus SEO, stock display, email capture, admin analytics, admin password reset,
team-management UI. (🔴 #3 — business address / Contact page / privacy — is NOT
in this batch; it needs the owner's real address.)

**Working rules:** one phase at a time, low-risk first, verify each task, commit
per task/small group, keep this file's statuses current. Legend: ✅ done ·
🟡 in progress · ⏳ todo · 🔵 needs owner input.

---

## Phase 1 — Trust & honesty  (🔴 launch-critical · quick, no input)
| # | Task | Status |
|---|------|--------|
| 1.1 | Remove the "Demo sign-in …" text shown to customers (`account/page.jsx`) | ✅ |
| 1.2 | Replace fabricated stats with honest copy (hero: "Handmade to order in India"; stats band: 100+ designs / 5 collections / 100% handmade / free shipping) | ✅ verified live, committed 5493790 |

## Phase 2 — Don't lose orders  (🔴 launch-critical)
| # | Task | Status |
|---|------|--------|
| 2.1 | Email the owner on every new order — COD (`orderController.createOrder`) + online (`paymentController.finalizeOrder`) via existing `notifyOps` | ⏳ |
| 2.2 | Guest order retrieval — public "track by Order ID + phone" lookup (backend endpoint + storefront UI on `order/[id]` / a track page) | ⏳ |
| 2.3 | Stock / "Sold out" display on PDP + product card; disable add-to-cart when a tracked item is out of stock (resolve the stock===0 made-to-order ambiguity) | ⏳ |

## Phase 3 — Measure & capture  (🔴 analytics · 🟠 email)
| # | Task | Status |
|---|------|--------|
| 3.1 | Install GA4 + ecommerce events (view_item / add_to_cart / begin_checkout / purchase / search) | 🔵 needs GA4 Measurement ID |
| 3.2 | Email capture / newsletter — field in footer + welcome popup; backend to store subscribers | ⏳ |

## Phase 4 — Found on Google  (🟠 · biggest job)
| # | Task | Status |
|---|------|--------|
| 4.1 | Server-render product + category + subcategory + policy pages with per-page `generateMetadata` (unique title/description, product-image OG, canonical) | ⏳ |
| 4.2 | Product + BreadcrumbList JSON-LD (feed real rating summary into AggregateRating) | ⏳ |
| 4.3 | Sitemap from the live DB (not the static catalog) | ⏳ |

## Phase 5 — Run the shop  (🟠 admin tools)
| # | Task | Status |
|---|------|--------|
| 5.1 | Fix revenue/analytics accuracy — exclude Cancelled + uncollected-COD; add date ranges (`dashboard (dash)/page.jsx`) | ⏳ |
| 5.2 | Admin password change/reset (backend endpoint + Settings UI) | ⏳ |
| 5.3 | Team-management UI — add/remove admins, assign owner/manager/staff roles (wire existing `register`/`listAdmins`) | ⏳ |

---

## Owner inputs still needed
- **GA4 Measurement ID** (`G-XXXXXXXXXX`) for 3.1.
- Decision on Phase 1.2 copy (default: honest "new store" framing).
- (Separate, not in this batch) real **business address** + Contact page + expanded Privacy for Razorpay/legal.

## Progress log
- 2026-07-10 — Plan created from the completeness audit; phase-by-phase execution starting at Phase 1.
