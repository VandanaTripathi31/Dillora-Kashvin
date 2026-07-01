# Dillora by Kashvin — Monorepo

A handmade-goods store, split into three independent, production-ready apps:

```
Dillora-Kashvin/
├── Backend/     Node.js + Express + MongoDB REST API (auth, products, orders, media…)
├── Frontend/    Customer storefront (Next.js, JavaScript, Tailwind) — dynamic, SEO-ready
├── dashboard/   Admin panel (Next.js, JavaScript, Tailwind) — JWT-protected
└── README.md
```

## Architecture at a glance

```
   Customer                Admin
   (Frontend :3000)        (dashboard :3001)
        │                       │
        │  public reads         │  JWT-protected writes
        └───────────┬───────────┘
                    ▼
            Backend REST API (:5000)
                    │
                    ▼
                MongoDB   +   Cloudinary (media)
```

- **Backend** owns all data. Reads are public (storefront), writes require an admin JWT (dashboard).
- **Frontend** reads everything through a backend-first API layer with a safe offline fallback, so the site works even if the backend is briefly down.
- **dashboard** manages catalog, orders, media, offers and settings.

## Getting started

### 1. Backend
```bash
cd Backend
cp .env.example .env          # fill in Mongo URI, JWT secret, Cloudinary, admin creds
npm install
npm run seed                  # seed catalog (82 products) + admin login
npm run dev                   # http://localhost:5000
```
> Whitelist your IP in MongoDB Atlas → Network Access first.
> Optional: `npm run migrate:images` moves all product photos to Cloudinary.

### 2. Frontend (storefront)
```bash
cd Frontend
npm install
# .env.local:  NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev                   # http://localhost:3000
```

### 3. Dashboard (admin)
```bash
cd dashboard
npm install
# .env.local:  NEXT_PUBLIC_API_URL=http://localhost:5000/api
#              NEXT_PUBLIC_STORE_URL=http://localhost:3000
npm run dev                   # http://localhost:3001  → /login
```
Default admin (from the seed): `admin@dillora.com` / `Dillora@2026` — **change this**.

## Security notes
- Never commit real `.env` files (all three are gitignored).
- Rotate any secrets that were previously committed to git history.

See each app's own `README.md` for details.
