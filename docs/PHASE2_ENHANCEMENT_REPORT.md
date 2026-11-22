# Phase 2 — Realistic Demo Data & Visual Enhancement Report

**Date:** 2026-11-22
**Scope:** Data quality, seed safety and presentation only. Authentication, booking, seat locking, payment and concurrency code paths were **not** changed.

## 1. What changed

### Movie catalogue
- Expanded to **25 real films** with title, overview, synopsis, director, cast, genre, language, duration, release date, certificate, rating, popularity, `2D/3D/IMAX` formats, status, poster, wide backdrop and trailer.
- All **50 poster/backdrop URLs were verified** against TMDB's CDN (HTTP 200, `image/jpeg`) before inclusion. 22 trailers use real YouTube embed keys extracted from TMDB; 3 films without a TMDB trailer key have no trailer URL rather than a broken embed.
- One legacy movie record is retained because a **genuine booking** by the real user references it. The public `/api/movies` endpoint deduplicates by title and prefers the richer seeded record, so no duplicate appears in the UI.

### Theatres / screens / seats
- **10 theatres** across Pune, Mumbai, Bengaluru, Hyderabad and Chennai, covering both chains (PVR, INOX, Cinépolis) and independent properties, each with chain, area, full address, phone and amenities.
- **23 screens** with `2D`, `3D` and `IMAX` formats, 8–10 rows × 10 seats, and tier-dependent Regular/Premium/Recliner pricing.

### Shows
- **~533 future shows** across morning (09:30), afternoon (14:15) and evening (19:45) slots on dates from yesterday to +7 days.
- Past shows are excluded from the public `/api/shows` list (verified: `expired = 0`).
- Prices vary by seat category, screen format and theatre tier.

### Demo customers and bookings
- 4 demo users: `admin@`, `customer@`, `priya@`, `arjun@cinebook.demo`.
- 5 labelled demo bookings: confirmed upcoming, completed (past show), cancelled, failed simulated payment, and a second confirmed booking. All are marked `seeded: true` and `seedKey` and shown with a **"Demo record"** badge in admin screens.
- Only confirmed bookings own `SeatHold` documents with `status: booked`; cancelled and failed bookings hold no seats. No double-booked seats were created.
- Genuine user accounts and bookings were preserved untouched.

### Promotions
- 6 offers: percent (`CINEBOOK10`, `FIRSTSHOW20`, `STUDENT15`), fixed-value (`WEEKEND100`, `BLOCKBUSTER200`), min amounts, max caps, expiry dates, active flag and `maxUses/usedCount`.
- One expired and one usage-exhausted code are included to demonstrate validation.
- A single `evaluatePromo()` service is used by both `/api/promo/validate` and the booking engine; client values are never trusted.

## 2. Actual database counts (after seed)

```
users 5 | movies 26 (25 seeded unique + 1 legacy referenced by a genuine booking)
theatres 11 | screens 24 | seats 2190 | shows 534
bookings 6 (5 demo + 1 genuine) | payments 6 | promos 6
```
Public API shows **25 unique movies** (dedupe prefers the seeded record).

The seed was executed three times; counts were **identical** after runs 2 and 3 — no duplicates.

## 3. Files changed / added

**Backend**
`server/src/seed/seed.ts` (rewritten), `server/src/seed/seed-reset.ts` (new), `server/src/services/promo.service.ts` (new), `server/src/services/booking.service.ts`, `server/src/modules/promo/promo.routes.ts`, `server/src/modules/movies/movies.routes.ts`, `server/src/modules/admin/admin.routes.ts`, `server/src/lib/validators.ts`, models: `Movie`, `Theatre`, `Screen`, `Seat`, `Show`, `SeatHold`, `Booking`, `Payment`, `Promo`, `User`, `package.json` (both), root `package.json`.

**Frontend (presentation only)**
`client/src/types/api.ts`, `components/PosterImage.tsx`, `components/MovieCard.tsx`, `index.css`, `pages/HomePage.tsx`, `pages/MovieDetailsPage.tsx`, `lib/utils.ts`, `pages/Admin/{AdminOverviewPage,AdminMoviesPage,AdminTheatresPage,AdminShowsPage,AdminBookingsPage}.tsx`.

**Docs**
`README.md`, `docs/PHASE2_ENHANCEMENT_REPORT.md`, `docs/evidence/admin-overview.jpeg`.

## 4. Browser verification evidence

Real Chrome, `http://localhost:5173`, with no console errors:

- **Homepage:** hero uses the wide Dune backdrop; sections rendered: `Featured films`, `Popular this week`, `Now showing`, `Trending now`, `Action movies`, `Drama movies`, `Adventure movies`, `Upcoming`. 72 images loaded, **0 broken**.
- **Movie details:** director, synopsis, 23 real showtime links, correct poster/backdrop, 0 broken images. Release dates correctly formatted (e.g. `1 Mar 2024`).
- **Seat selection:** 100 seats from the `seats` collection, category pricing, legend, IMAX format shown.
- **Admin overview:** Customers 4, Movies 26, Theatres 11, Shows 534, Bookings 4, Revenue ₹4,790; recent bookings show customer names and "Demo record" badges. Screenshot: `docs/evidence/admin-overview.jpeg`.
- **Admin movies:** 25 thumbnails, 0 broken. **Admin shows:** 533 rows with poster thumbnails, 0 broken. **Admin bookings:** 6 records with customer names and movie thumbnails.

A date-formatting bug (raw ISO dates in rails) was found in the screenshot and fixed in `client/src/lib/utils.ts`.

## 5. API verification (executed)

```
GET /api/health          200 database.connected=true
GET /api/movies          200 25 movies, 25 unique titles, director/synopsis/popularity present
GET /api/theatres        200 11 theatres, 5 cities, chain + area present
GET /api/shows           200 533 shows, times 09:30/14:15/17:15/19:45, expired=0
POST /api/promo/validate CINEBOOK10 200 discount=100 | WEEKEND100 200 discount=100
                         STUDENT15 200 discount=150 | BLOCKBUSTER200 400 usage limit
                         SUMMER50 400 inactive | NOPE 400 invalid
GET /api/admin/overview  200 revenue ₹4,790, byStatus {confirmed:4,cancelled:1,failed:1}
GET /api/admin/bookings  200 6 bookings, customer populated
```

## 6. Automated verification (executed)

```
npm run typecheck  ✅ both workspaces
npm test           ✅ 17/17 passed (TC-16 covers promo rules; TC-17 covers the customer dashboard summary)
npm run build      ✅ Vite build succeeded (543 kB JS / 159 kB gzip, 48 kB CSS)
```

## 7. Commands

```bash
npm run seed          # safe, repeatable, upserts only
npm run seed:reset    # removes only demo/test data, preserves genuine users & bookings
npm run seed          # repopulate after a reset
```

## 8. Notes

- The seed never deletes real accounts or bookings; `seed:reset` removes only demo-marked/test-email records and catalogue not referenced by genuine bookings.
- Uploaded posters remain in `server/uploads` and are not committed.
- The 500 kB Vite chunk advisory is pre-existing and non-fatal.
