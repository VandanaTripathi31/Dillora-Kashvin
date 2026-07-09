# Dillora by Kashvin — Monorepo

A handmade-goods store (phone covers, charms, crochet, resin art, oversize tees),
split into three independent, production-ready apps.

```
Dillora-Kashvin/
├── Backend/     Node.js + Express + MongoDB REST API (auth, products, orders, payments, media…)
├── Frontend/    Customer storefront (Next.js, JavaScript, Tailwind) — dynamic, SEO-ready
├── dashboard/   Admin panel (Next.js, JavaScript, Tailwind) — JWT-protected
└── README.md
```

**Live URLs**
- Storefront: https://dillora-kashvin.vercel.app/
- Admin dashboard: https://dillora-kashvin-admin-dashboard.vercel.app/

---

## Architecture at a glance

```
   Customer                Admin
   (Frontend :3000)        (dashboard :3001)
        │                       │
        │  public reads         │  JWT-protected writes
        └───────────┬───────────┘
                    ▼
            Backend REST API (:5000)
          ┌─────────┼───────────────┐
          ▼         ▼               ▼
       MongoDB   Cloudinary       Razorpay
       (data)    (images)         (payments)
```

- **Backend** owns all data. Reads are public (storefront); writes require an admin JWT (dashboard).
- **Frontend** reads everything through the backend API (`Frontend/data/api.js`). No offline fallback — if the database is empty, the store is empty (seed it).
- **dashboard** manages the catalog, orders, media, offers, popups, banners and settings.

---

## ⚠️ One database only (important)

The app must use **exactly one** MongoDB database: **`dillora`**.

Some Atlas connection strings omit the database name (e.g. `…mongodb.net/?ssl=true…`),
which makes MongoDB silently fall back to a database called **`test`**. That is how
data can end up split across `test` and `dillora`. To prevent this, the connection
code (`Backend/config/dbConnection.js`) **pins the database name** via the `dbName`
option, so it is always `dillora` regardless of the URI. On boot you will see:

```
[db] ✅ Connected to MongoDB database: "dillora"
```

If you ever need a different database, set `MONGO_DB_NAME` in the backend env.

---

## Getting started (local)

### 1. Backend
```bash
cd Backend
cp .env.example .env          # fill in Mongo URI, JWT secret, Cloudinary, admin creds
npm install
npm run seed                  # seed catalog + admin login (empty collections only)
npm run seed:brands           # 21 phone brands + models
npm run dev                   # http://localhost:5000
```
> Whitelist your IP in MongoDB Atlas → Network Access first.

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
Default admin from the seed: `admin@dillora.com` / `Dillora@2026` — **change this in production.**

---

## Environment variables

### Backend (`Backend/.env`)
| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGO_URI` | MongoDB Atlas connection string (include `/dillora`) |
| `MONGO_DB_NAME` | Database name — defaults to `dillora`; keep it that way |
| `FRONTEND_URL` | Comma-separated allowed CORS origins (store + admin URLs) |
| `JWT_SECRET` | Long random string for signing admin tokens |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`) |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | First admin created by the seed |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Image storage |
| `RAZORPAY_KEY_ID` / `RAZORPAY_SECRET` | Payments (online + advance) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | Email (invoices, alerts) — optional |
| `SUPPORT_EMAIL` / `ADMIN_ALERT_EMAIL` | Where ops alerts go |

### Frontend (`Frontend/.env.local`)
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base, e.g. `https://api.yourdomain.com/api` |
| `NEXT_PUBLIC_DASHBOARD_URL` | Admin URL (footer "Admin login" link) |

### Dashboard (`dashboard/.env.local`)
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base |
| `NEXT_PUBLIC_STORE_URL` | Storefront URL — **required** so admin product thumbnails (local `/images/…`) resolve; otherwise they 404 |

---

## Deploying to production

**Hosting:** storefront + dashboard on Vercel; backend on any Node host (Render,
Railway, Fly, a VPS…). MongoDB Atlas and Cloudinary are managed services.

### Checklist
1. **Backend host**
   - Set all backend env vars above. **`MONGO_URI` must include `/dillora`** (or set `MONGO_DB_NAME=dillora`).
   - Confirm the boot log says `Connected to MongoDB database: "dillora"`.
   - Atlas → Network Access → allow the host's IP (or `0.0.0.0/0` if the host IP is dynamic).
2. **Storefront (Vercel)** — set `NEXT_PUBLIC_API_URL` to the deployed backend, redeploy.
3. **Dashboard (Vercel)** — set `NEXT_PUBLIC_API_URL` **and** `NEXT_PUBLIC_STORE_URL`, redeploy.
4. **Custom domain** — add it in Vercel → Domains, point your DNS (CNAME) as Vercel instructs; update `FRONTEND_URL` (CORS) on the backend and the two `NEXT_PUBLIC_*` URLs.
5. **Seed** the production database once (`npm run seed` + `npm run seed:brands`) if it's empty.
6. **Razorpay** — switch from test keys (`rzp_test_…`) to **live** keys, and enable the payment methods you want (UPI/cards/net-banking) in the Razorpay dashboard.
7. **Change the admin password** from the seed default.

### What belongs to the client (their own accounts)
| Service | Why | Client provides |
|---|---|---|
| **MongoDB Atlas** | Their store's data | Cluster + `MONGO_URI` |
| **Cloudinary** | Product/banner/popup images | Cloud name + API key + secret |
| **Razorpay** | Collecting payments (their bank) | Live Key ID + Secret (KYC in their name) |
| **Domain** | Their brand URL | Domain registration + DNS access |
| **Email/SMTP** | Invoices & alerts from their address | SMTP host/user/pass (e.g. Zoho, Gmail app password) |

> These must be in the **client's** name — payments settle to their bank, images
> and data live in their accounts. Never ship the developer's keys to production.

---

## Security notes
- Never commit real `.env` files (all three are gitignored).
- **Rotate any secret that was ever committed** to git history (the example Atlas
  password and Cloudinary/Razorpay keys should be treated as compromised and rotated).
- Use a strong, unique `JWT_SECRET`.
- Keep `test` MongoDB unused; do not point any environment at it.

See each app's own `README.md` for app-specific details.
