# Dillora — Admin Dashboard

Standalone admin panel for the Dillora store. Next.js (App Router, **JavaScript**, Tailwind CSS v3), talking to the backend REST API with a JWT.

## Features
- **Login** (JWT) with protected routes — unauthenticated visitors are sent to `/login`.
- **Overview** — revenue, orders, low-stock, 7-day trend, top products & categories.
- **Products** — full CRUD, search/sort/filter, CSV export, bulk upload, Cloudinary image upload.
- **Categories** — add/remove sub-categories (reflected on the storefront instantly).
- **Orders** — view, filter by status/product type, update status.
- **Reels** — add/remove promo videos, Cloudinary video + poster upload.
- **Offers** — discount codes (percent/flat/BOGO), festive banner, sale-price toggle.
- **Settings** — account info + store preferences.

## Structure
```
dashboard/
├── src/
│   ├── app/
│   │   ├── (dash)/        protected shell + pages (overview, products, categories, orders, reels, offers, settings)
│   │   └── login/         public login page
│   ├── components/        UI, MediaUpload, AdminToaster, ConfirmRoot, StatusPill
│   ├── services/          api.js (authenticated REST client)
│   ├── context/           AuthContext (JWT session)
│   ├── constants/         catalog.js
│   ├── styles/            app.css, index.css, tailwind.css, dashboard.css
│   ├── hooks/ lib/ utils/ assets/ layouts/   (ready for growth)
├── public/               logo, favicons
└── .env.local            NEXT_PUBLIC_API_URL, NEXT_PUBLIC_STORE_URL
```

## Setup
```bash
npm install
# .env.local
#   NEXT_PUBLIC_API_URL=http://localhost:5000/api
#   NEXT_PUBLIC_STORE_URL=http://localhost:3000
npm run dev        # http://localhost:3001
```
The backend must be running and seeded (`admin@dillora.com` / `Dillora@2026` by default — change it).
