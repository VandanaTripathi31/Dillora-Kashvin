# Dillora — Backend API

Node.js + Express + MongoDB REST API for the Dillora storefront and admin dashboard.

## Stack
- **Express 5** (ESM)
- **MongoDB / Mongoose**
- **JWT** auth (bcrypt password hashing)
- **Cloudinary** for image/video storage
- **Multer** for uploads

## Folder structure
```
backend/
├── config/          dbConnection, cloudinary, multer
├── controllers/     request handlers (one per resource)
├── middleware/      auth, error, upload
├── models/          Admin, Category, Product, Order, Video, Coupon, Setting, Review
├── routes/          REST routes (one per resource)
├── services/        business logic (coupon eval, id generation)
├── utils/           generateToken, responseHandler, validators
├── seed/            seed.js, seedData.js, migrateImages.js
├── uploads/         (empty — uploads stream straight to Cloudinary)
├── server.js
└── .env             (never committed)
```

## Setup
1. `cp .env.example .env` and fill in real values (Mongo URI, JWT secret, Cloudinary, default admin).
   > If your Mongo password contains special characters (`@ : / ?`), URL-encode them (`@` → `%40`).
2. `npm install`
3. `npm run seed` — loads the catalog from `../Frontend/data/catalog.js`, seeds coupons/reels/settings/demo orders, and creates the default admin.
4. `npm run migrate:images` — (optional) moves local product photos to Cloudinary and rewrites URLs.
5. `npm run dev` — starts the API on `http://localhost:5000`.

## API overview
Base URL: `/api`

| Resource   | Endpoints |
|------------|-----------|
| Auth       | `POST /auth/login`, `GET /auth/me`, `POST /auth/register` |
| Categories | `GET /categories`, `POST /categories`, `PUT/DELETE /categories/:id`, `POST /categories/:id/subs`, `PUT/DELETE /categories/:id/subs/:subId` |
| Products   | `GET /products`, `GET /products/:id`, `GET /products/category/:catId?sub=`, `GET /products/bestsellers?n=`, `POST /products`, `POST /products/bulk`, `PUT/DELETE /products/:id` |
| Orders     | `POST /orders`, `GET /orders/by-phone/:phone`, `GET /orders`, `PUT /orders/:id/status` |
| Videos     | `GET /videos`, `POST /videos`, `DELETE /videos/:id` |
| Coupons    | `POST /coupons/validate`, `GET/POST /coupons`, `PUT/DELETE /coupons/:code` |
| Settings   | `GET /settings`, `PUT /settings` |
| Reviews    | `GET /reviews/:productId`, `.../summary`, `.../can?phone=`, `POST /reviews/:productId` |
| Media      | `POST /upload`, `POST /upload/video` |

Writes (POST/PUT/DELETE on admin resources) require `Authorization: Bearer <token>`.
Reads are public (the storefront consumes them); return shapes are intentionally identical
to the storefront's original `data/api.js`, so the frontend needs no component changes —
only `NEXT_PUBLIC_API_URL` pointed at this server.
