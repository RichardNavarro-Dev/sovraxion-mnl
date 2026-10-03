# SOVRAXION MNL — Full-Stack Streetwear Store

React 18 + Vite + Tailwind CSS + Framer Motion + Zustand on the frontend, Node.js + Express 5 + MongoDB/Mongoose on the backend.

## Quick start

```bash
npm run install:all
cp server/.env.example server/.env    # then edit values
npm run build                         # builds client/dist (served by Express)
npm start                             # http://localhost:5000
```

Development with hot reload: `npm run dev:server` and `npm run dev:client` (Vite on :5173 proxies `/api` and `/uploads` to :5000).

If `MONGODB_URI` is empty, the server boots an embedded MongoDB (mongodb-memory-server) that persists to `server/.data/mongo` — handy for local runs. Use MongoDB Atlas (or any replica set / standalone) in production.

On first boot the server automatically seeds the catalog, the hidden freebie product (Puzzled Keychain) and the single owner account from `OWNER_EMAIL` / `OWNER_PASSWORD`.

## Owner / admin access

- There is exactly one admin: the account whose email equals `OWNER_EMAIL`. Every boot re-asserts this and demotes any other `admin` record.
- Registration can never create an admin (the `role` field is ignored; the owner email is reserved).
- `requireAdmin` checks both `role === 'admin'` **and** `email === OWNER_EMAIL`.
- `/admin` (frontend) shows a 403 for everyone else; all `/api/admin/*`, `POST/PUT/DELETE /api/products` and receipt files are protected server-side.

## Automation

| Flow | Where |
| --- | --- |
| Tiered discount + freebie engine (shared logic, recomputed server-side) | `server/src/utils/discounts.js`, `client/src/lib/discounts.js` |
| Atomic stock deduction with rollback on failure | `server/src/services/inventory.js` |
| Automatic restock on rejection / cancellation | `server/src/controllers/adminController.js` |
| Duplicate GCash/Maya reference blocking (unique index) | `server/src/models/Order.js` |
| Price-change guard (`expectedTotal`) | `server/src/controllers/orderController.js` |

## Security

- bcrypt (12 salt rounds) password hashing, account lockout after 5 failed logins.
- JWT in `httpOnly` + `secure` + `sameSite` cookie (`sovx_session`). `ALLOW_BEARER_FALLBACK` exists only for sandboxed previews that block cookies; keep it `false` in production.
- `helmet` (CSP, HSTS, etc.), strict `cors` allow-list, custom `X-Sovx-Client` header CSRF guard.
- `express-rate-limit` on `/api/auth/login`, `/api/auth/register`, checkout and the whole API.
- NoSQL-injection scrubbing of `$`/`.` keys, strict type checks, HTML stripping via `sanitize-html`.
- Receipt uploads: 5 MB limit, MIME allow-list **and** magic-byte verification, random filenames, stored outside the public folder, streamed only to the owner.

## API

| Method | Route | Access |
| --- | --- | --- |
| POST | `/api/auth/register` | public (rate-limited) |
| POST | `/api/auth/login` | public (rate-limited) |
| POST | `/api/auth/logout` | any |
| GET | `/api/auth/me` | signed-in |
| GET | `/api/products` | public (`category`, `collection`, `sale`, `search`, `sort`, `inStock`) |
| GET | `/api/products/:idOrSlug` | public |
| POST | `/api/products` | owner |
| PUT / DELETE | `/api/products/:id` | owner |
| POST | `/api/products/upload-image` | owner |
| POST | `/api/orders` | signed-in (multipart: `order` JSON + `receipt` image) |
| GET | `/api/orders/mine` | signed-in |
| GET | `/api/admin/stats` · `/orders` · `/orders/:id` · `/customers` · `/products` | owner |
| PATCH | `/api/admin/orders/:id/verify` · `/reject` · `/status` | owner |
| GET | `/api/admin/receipts/:filename` | owner |
| GET | `/api/config/store` | public (merchant details + tiers) |

Merchant account: **SOVRAXION MNL · 09636688618** (GCash & Maya).
