# CineBook — Movie Ticket Booking System

A complete MERN-stack cinema booking prototype built for the Agile Software Development final jury. Customers can discover movies, pick a show, choose seats, complete a clearly-labelled simulated payment and download/print a QR ticket. Admins manage movies, theatres, screens, shows and bookings from a protected dashboard.

> **Payments are simulated.** No real money is charged and no payment provider is contacted. Every simulated payment record has `simulated: true`.

---

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite 6, Tailwind CSS 3, React Router 6, TanStack Query 5, Axios, React Hook Form + Zod, lucide-react |
| Backend | Node.js 20+, Express 4, TypeScript, Zod, JWT, bcryptjs, Mongoose 8, Helmet, CORS, express-rate-limit |
| Database | MongoDB (single-node replica set required for transactions) |
| Tests | Vitest, Supertest, `mongodb-memory-server` (`MongoMemoryReplSet`) |

## Architecture

```
npm workspaces
├── server/   Express REST API  ──┐
└── client/   React SPA         ──┴──  /api  (JSON envelope: { success, data, message, errors })
```

Backend modules: `auth`, `users`, `movies`, `theatres`, `screens`, `shows`, `seats`, `bookings`, `payments`, `promo`, `admin`.
Shared services: `booking.service.ts` (atomic holds, transaction-confirmed bookings), `ticket.ts` (QR + printable ticket).

**Double-booking prevention:** `SeatHold` has a unique `{show, seat}` index. Hold acquisition uses conditional atomic upserts so exactly one caller can own a seat. Checkout revalidates active holds and transitions `held → booked` inside a MongoDB transaction; any race returns HTTP 409. Abandoned holds expire via a partial TTL index (default 5 minutes).

---

## Local setup

### Prerequisites
- Node.js **20+** and npm
- MongoDB. For the full booking flow (transactions), run it as a **single-node replica set**:

```bash
mkdir -p C:\cinebook-data
mongod --dbpath C:\cinebook-data --replSet rs0 --port 27017
# In a second terminal:
mongosh --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'127.0.0.1:27017'}]})"
```

> Tests need no local MongoDB: they start an in-memory replica set automatically.

### Install and run

```powershell
npm install
copy server\.env.example server\.env
copy client\.env.example client\.env
# Edit server/.env and set a strong JWT_SECRET (32+ random characters)
npm run seed                 # realistic movies, theatres, screens, seats, shows, promo codes, demo users
npm run dev                  # API on :5000, client on :5173 (runs both in parallel)
npm run health               # confirms API + MongoDB connectivity
```

Open **http://localhost:5173**.

If MongoDB runs without a replica set, browsing works but booking will fail because transactions are unavailable. Use the replica-set command above for the jury demonstration. The API now **retries** the DB connection and logs a clear message instead of silently exiting; `GET /api/health` reports `database.connected`.

**No local MongoDB?** `npm --workspace @cinebook/server run demo:memory` starts an in-memory replica set, seeds it and runs the API; run `npm run dev:client` in another terminal.

## Demo credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@cinebook.demo` | `Admin123!` |
| Customer | `customer@cinebook.demo` | `Customer123!` |

Promo codes: `CINEBOOK10` (10% up to ₹150) and `FIRSTSHOW20` (20% up to ₹250 on ₹500+).

Seed data: **25 realistic movies** (24 showing, 1 upcoming) with verified posters/backdrops, directors, cast, synopses and trailers; **10 theatres** across Pune, Mumbai, Bengaluru, Hyderabad and Chennai with 23 screens and 2,090 seats; ~533 future shows across morning/afternoon/evening slots; 4 demo users and 5 labelled demo bookings covering confirmed, completed, cancelled and failed-payment scenarios; 6 promotions including percentage, fixed-value, usage-limited and expired offers.

`npm run seed` is **idempotent** (deterministic IDs + upserts) and preserves real accounts/bookings. To remove only demo data and start clean: `npm run seed:reset && npm run seed`.

## Verification commands

```bash
npm run typecheck     # TypeScript, both workspaces
npm run build         # production builds, both workspaces
npm test              # 17 integration tests (in-memory replica set)
npm run health        # live API + database status
```

See `docs/DEPLOYMENT.md` for exact Windows commands, production deployment of frontend and backend separately, environment variables and security notes.

The test suite covers: registration/login, RBAC denials, movie search/filters, show availability, seat-map states, the 8-seat boundary, complete booking + QR ticket, **two customers racing for one seat**, simulated payment failure, booking history, admin CRUD, expired holds, invalid inputs and the full end-to-end customer workflow.

## Demo script (jury)

1. **Customer:** Register → browse movies → open a movie and play the trailer → filter shows by city/date → choose seats across categories → apply `CINEBOOK10` → select *card* and **success** → view/print/download the QR ticket → check *My Bookings*.
2. **Concurrency:** In two browsers, hold the same seat; one succeeds and the other sees a 409-style conflict message.
3. **Failure path:** Hold a seat, choose **failure** in the simulated gateway → booking marked failed and seat released.
4. **Admin:** Sign in as admin → overview metrics → add/edit a movie, theatre, screen and show → monitor bookings.

## Customer account pages

- `/dashboard` — distinct overview: personalised greeting, real metrics, next upcoming movie, recent activity, quick actions and profile summary.
- `/bookings` — dedicated booking manager: upcoming / past / all tabs with posters, theatre/screen, seats, amounts, booking and payment status, QR tickets, details and cancellation.
- Legacy `/dashboard?tab=bookings` links redirect to `/bookings`.

## API summary

Full contract: `docs/api/CONTRACT.md`.

`GET /api/health` · `POST /api/auth/{register,login,logout}` · `GET /api/auth/me` · `GET/PATCH /api/auth/me`
`GET /api/movies` · `GET /api/movies/:id` · `POST/PATCH/DELETE /api/movies[/:id]` (admin)
`GET /api/theatres` · `GET /api/theatres/:id` · `GET/POST /api/theatres/:id/screens` · `GET/PATCH/DELETE /api/screens/:id`
`GET /api/shows` · `GET /api/shows/:id` · `GET /api/shows/:id/seats` · `POST/DELETE /api/shows/:id/holds` · `POST/PATCH/DELETE /api/shows[/:id]`
`POST /api/promo/validate` · `POST /api/bookings` · `POST /api/bookings/:id/pay` · `GET /api/bookings/mine` · `GET /api/bookings/:id` · `GET /api/bookings/:id/ticket` · `DELETE /api/bookings/:id`
`GET /api/bookings/summary` (customer dashboard metrics)

`GET /api/admin/overview` · `GET/PATCH /api/admin/bookings[/:id]` · `GET /api/admin/users`

## Documentation index

- `IMPLEMENTATION_PLAN.md` — phases and requirement → implementation → test traceability matrix
- `docs/requirements/PROJECT_BRIEF.md` — authoritative project specification (preserved verbatim)
- `docs/jury/` — official jury instructions (preserved) and text extraction
- `docs/audit/PHASE0_AUDIT.md` — repository audit and requirements gap analysis
- `docs/agile/` — product backlog, user stories, sprint planning/backlog, DoD, progress
- `docs/api/CONTRACT.md` — REST API contract
- `FINAL_DELIVERY_REPORT.md` — final verification results and demo information
