# Connectivity, Authentication & Data Fix Report — 2026-11-22

## 1. Actual root causes of the `Network Error`

1. **The backend was not listening on port 5000.** A `tsx watch src/server.ts` process existed, but `start()` called `process.exit(1)` as soon as `mongoose.connect()` failed. MongoDB was **not running at all** (no `mongod.exe` process, port 27017 closed), so the API kept dying and restarting.
   - Measured: `curl http://127.0.0.1:5000/api/health` → HTTP `000` (connection refused); frontend on `:5173` → HTTP 200.
2. **The API never loaded `.env`.** `dotenv/config` was imported by the seed script but not by the API entry point, so `env.ts` used its defaults — notably `mongodb://127.0.0.1:27017/cinebook` **without** `?replicaSet=rs0`. Booking transactions would have failed even after MongoDB was started.
3. **The frontend had no fallback path when `VITE_API_URL` was missing.** A fresh clone without `client/.env` used the absolute default, and the Vite dev server had no `/api` proxy.
4. **`npm run dev` used `&`**, which is not a cross-platform parallel process runner — a common source of "only one side started" on Windows.
5. **The database was empty.** The `cinebook` database contained zero documents because seed had never completed (MongoDB was down).

## 2. Fixes applied

| File | Fix |
|---|---|
| `server/src/server.ts` | Retry DB connection every 3 s with clear logs instead of exiting; log health and DB URLs. |
| `server/src/config/env.ts` | Added `import 'dotenv/config'` so `.env` is actually loaded by the API. |
| `server/src/app.ts` | `/api/health` now pings MongoDB and reports `database.connected`, `state`, `name`, `host`, `latencyMs`; returns **503** when DB is down. |
| `client/src/pages/AuthPage.tsx` | Registration errors now use `Registration failed`; login uses `Sign in failed`; network failures explain the API is unreachable. |
| `client/src/api/client.ts` | Network errors (status 0) produce an actionable message; default API base is `/api` (dev proxy) with `VITE_API_URL` override. |
| `client/vite.config.ts` | Dev proxy for `/api` and `/uploads` → `http://127.0.0.1:5000`. |
| `package.json` | `dev` uses `concurrently`; added `npm run health`. |
| `server/.env`, `client/.env` | Created locally (gitignored) with the replica-set URI, strong local JWT secret and API URL. |

MongoDB was started as a single-node replica set (`rs0`, PRIMARY) and the seed was run once.

## 3. Verification results

### API (real MongoDB, executed)
```
GET  /api/health          → 200 {"status":"ok","database":{"connected":true,"state":"connected","name":"cinebook","host":"127.0.0.1","latencyMs":5}}
POST /api/auth/register   → 201 token=true role=customer
POST /api/auth/login      → 200 token=true
GET  /api/auth/me         → 200 correct user
POST admin login          → 200 role=admin
GET  /api/admin/overview  → 403 for customer; 200 for admin
Invalid registration      → 400 with field-level messages
```

### Full booking workflow (real MongoDB + transactions, executed)
```
MOVIES 8 | SHOWS 26 | SEATS 100 available
HOLD 201 | BOOKING 201 CB3C2E058FE2 total=396 (promo applied)
PAY 200 confirmed simulated=true | TICKET 200 QR data:image/png + HTML
HISTORY 1 | ADMIN OVERVIEW bookings=1 revenue=396
```

### Automated + build checks (executed)
`npm run typecheck` ✅ · `npm test` **17/17 passed** · `npm run build` ✅

### Browser walkthrough (real Chrome, executed)
- Homepage: 8 seeded movies from MongoDB, featured/trending/now-showing/upcoming sections.
- Movie details: 26 real showtime links.
- Seat selection: 100 seats rendered from the `seats` collection.
- **Registration from the UI created a new user and signed them in** (header showed the new name, token persisted).
- Admin dashboard: 5 customers, 8 movies, 3 theatres, 198 shows, 1 booking, ₹396 revenue.
- Admin Movies/Theatres/Screens/Shows/Bookings pages all rendered real records.
- Browser console: **no errors**.

## 4. Actual seeded database counts

```
users 5 | movies 8 | theatres 3 | screens 9 | seats 900 |
shows 198 | seatholds 2 | bookings 1 | payments 1 | promos 2
```
> The seat-state collection is named `seatholds` (Mongoose pluralisation of `SeatHold`), not `seatlocks`.

## 5. Exact commands to start the complete application

```powershell
mkdir C:\cinebook-data
& 'C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe' --dbpath C:\cinebook-data --replSet rs0 --bind_ip 127.0.0.1 --port 27017
# second terminal, once:
& 'C:\Users\dapke\AppData\Local\Programs\mongosh\mongosh.exe' --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27017"}]})'
# third terminal:
copy server\.env.example server\.env
copy client\.env.example client\.env
npm install
npm run seed
npm run dev
npm run health
```

## 6. Deployment requirements

- Frontend and backend are deployed separately — see `docs/DEPLOYMENT.md`.
- `VITE_API_URL` must be set **at frontend build time** for production, or `/api` and `/uploads` reverse-proxied to the backend.
- Backend requires `NODE_ENV=production`, `MONGODB_URI` pointing to a replica set, a strong secret `JWT_SECRET`, and `CLIENT_ORIGIN`.
- GitHub source alone does not run a backend or database: a MongoDB instance and a Node process are both required.
- No secrets are committed; `.env` files are gitignored.

## 7. Remaining notes

- The local `server/.env` and `client/.env` created during this fix are intentionally **not committed**.
- Fix commit `89a4cb7` was pushed to `origin/main`; the remote branch now contains all fixes.
