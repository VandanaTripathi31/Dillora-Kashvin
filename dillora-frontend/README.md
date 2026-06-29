# Dillora by Kashvin — Next.js version

React (Vite) se Next.js mein migrate kiya hua frontend. Build tested, sab routes chal rahe hain.

## Chalane ke liye

```bash
cd dilora-next
npm install
npm run dev      # http://localhost:3000  (admin: /admin)
```

Production build test karne ke liye:
```bash
npm run build
npm run start
```

Windows pe npm error aaye to Command Prompt use karo, PowerShell nahi.

## Kya badla (React → Next.js)

- **Routing**: `react-router-dom` hata diya. Ab Next.js file-based routing hai.
  - `/c/:catId` → `app/(storefront)/c/[catId]/page.jsx`
  - `/product/:id` → `app/(storefront)/product/[id]/page.jsx`
  - admin → `app/admin/...`
- **App.jsx** ki jagah ab `app/layout.jsx` (providers + fonts) aur `app/(storefront)/layout.jsx` (Header/Footer/banner).
- **`Link to=`** → `Link href=` (next/link)
- **`useNavigate()`** → `useRouter()` (next/navigation)
- **`useParams()`** → next/navigation se aata hai, use same hai.
- Saare interactive components ke top pe `'use client'` laga hai.
- Fonts ab `next/font/google` se (Fraunces + Inter) — fast load.
- **`@/`** alias = project root (jsconfig.json mein).

## Data layer (api.js)

`data/api.js` abhi bhi localStorage use karta hai (demo data). Server pe crash na ho isliye ek SSR-safe shim laga hai. Backend ready hone par sirf is file ke functions ko `fetch(process.env.NEXT_PUBLIC_API_URL + '/...')` mein badalna hai — components nahi.

## Abhi baaki (next steps)

- Images abhi `<img>` tags se hain. Baad mein `next/image` mein badal ke aur fast kar sakte hain (zaroori nahi, par recommended).
- Backend connect (Phase 3), Cloudinary photos (Phase 4), Razorpay + OTP (Phase 5), deploy (Phase 6) — roadmap PDF ke hisaab se.

## Folder map

```
app/
  layout.jsx                  → root: providers, fonts, global CSS
  (storefront)/
    layout.jsx                → header, footer, banner, page-fade
    page.jsx                  → home (/)
    c/[catId]/page.jsx        → category
    c/[catId]/[subId]/page.jsx
    product/[id]/page.jsx
    cart, checkout, account, wishlist
    order/[id], page/[slug]
  admin/
    layout.jsx                → admin sidebar
    page.jsx                  → dashboard
    products, orders, videos, coupons
components/   → Header, Footer, UI, etc. (all 'use client')
context/     → Cart, Auth, Wishlist
data/        → api.js, catalog.js
styles/      → index.css, app.css
public/      → logo, favicon
```
