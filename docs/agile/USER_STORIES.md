# CineBook — User Stories & Acceptance Criteria

Format: *As a <role>, I want <goal> so that <benefit>.*

---

### US-01 — Authentication (Must, 5 pts)
As a **visitor**, I want to register and log in so that I can book and track tickets.
- **AC1** Register with name, valid email and 8+ char password returns a JWT and customer role.
- **AC2** Passwords are stored as bcrypt hashes; the hash is never returned by any API.
- **AC3** Login with wrong credentials returns 401; duplicate email returns 409.
- **AC4** Token persists across reloads and `/auth/me` restores the session.
- **AC5** Logout clears the client session; protected routes require a token (401 without).

### US-02 — Movie discovery (Must, 8 pts)
As a **customer**, I want to browse, search and filter movies so that I can decide what to watch.
- **AC1** Homepage shows featured, trending, now-showing and upcoming sections.
- **AC2** Search matches title, genre and cast (case-insensitive, regex-safe).
- **AC3** Genre, language and format filters narrow results.
- **AC4** Details show title, description, duration, release date, language, rating, certificate, cast, poster and trailer.
- **AC5** Loading skeletons, empty results and API errors are handled with retry.

### US-03 — Theatres & shows (Must, 5 pts)
As a **customer**, I want to see theatres and showtimes near me so that I can pick a convenient show.
- **AC1** Theatres can be filtered by city.
- **AC2** Shows can be filtered by movie, theatre, city, date and format.
- **AC3** Each show exposes theatre, screen, time, format and category pricing.
- **AC4** Cancelled shows are excluded from public results.

### US-04 — Interactive seat selection (Must, 13 pts)
As a **customer**, I want a visual seat map so that I can choose my seats confidently.
- **AC1** Seats are grouped by row/category with Regular/Premium/Recliner pricing.
- **AC2** States available, selected, held, booked and own-held are visually distinct with a legend.
- **AC3** A maximum of 8 seats can be selected; the limit is enforced client and server side.
- **AC4** Price updates dynamically from server-provided category prices — the client never invents prices.
- **AC5** Availability refreshes on an interval and on demand.

### US-05 — Concurrency-safe holds (Must, 13 pts)
As the **system**, I must never sell the same seat twice.
- **AC1** A unique `{show, seat}` index guarantees one authoritative state per seat.
- **AC2** Concurrent hold requests for one seat yield exactly one 201 and one 409.
- **AC3** Holds expire after 5 minutes via conditional updates + a partial TTL index.
- **AC4** Expired holds can be re-held by another customer.
- **AC5** Confirmed booking transitions are performed inside a MongoDB transaction (replica-set memory server in tests).

### US-06 — Booking (Must, 8 pts)
As a **customer**, I want to review and confirm my booking so that I have a guaranteed reservation.
- **AC1** Checkout requires active holds for every selected seat (409 otherwise).
- **AC2** Amount, discount and total are recomputed by the server from show pricing; client values are ignored.
- **AC3** A unique booking code (e.g. `CB1A2B3C4D5`) is generated.
- **AC4** Booking history lists bookings newest first with populated movie/theatre/screen.
- **AC5** Duplicate/multiple bookings for the same held seat are impossible.

### US-07 — Simulated payment (Must, 5 pts)
As a **customer**, I want a payment step so that I can complete checkout — and understand it is a demo.
- **AC1** Payment method selection: card, UPI, net banking.
- **AC2** "Simulated payment — no real money is charged" is visible on the checkout UI.
- **AC3** Success confirms the booking and records a `simulated: true` payment.
- **AC4** Failure returns 402, marks the booking failed and releases the held seats; the user can retry.

### US-08 — Digital ticket (Must, 5 pts)
As a **customer**, I want a digital ticket so that I can present it at the venue.
- **AC1** Ticket contains booking ID, movie, theatre, screen, date/time, seats, price, status and QR code.
- **AC2** Print button uses a print stylesheet.
- **AC3** Download produces a standalone HTML ticket file.
- **AC4** Tickets are only available for confirmed bookings and only to their owner/admin.

### US-09 — Customer dashboard (Must, 5 pts)
As a **customer**, I want one place for my profile and tickets so that I can manage my bookings.
- **AC1** Profile information is displayed and editable (name, phone).
- **AC2** Upcoming and previous bookings are separated by show date.
- **AC3** Each booking links to its ticket and shows status.

### US-10–14 — Admin (Must, 36 pts total)
As an **admin**, I want protected management screens so that I can run the cinema.
- **AC1** All `/admin/*` APIs require a valid admin JWT; customers get 403.
- **AC2** Overview shows customers, movies, theatres, shows, confirmed bookings, revenue, recent bookings and status stats.
- **AC3** Movies, theatres, screens (with layout/categories/pricing) and shows support create, update and delete.
- **AC4** Screens with scheduled shows cannot have their layout changed or be deleted (409).
- **AC5** Bookings can be listed, searched, filtered and have their status viewed/updated.

### US-15 — UI/UX (Must, 13 pts)
As a **customer/admin**, I want a premium, responsive interface so that the app feels trustworthy.
- **AC1** Dark cinematic theme with red accent, consistent type scale and spacing.
- **AC2** Responsive on desktop, tablet and mobile; seat map scrolls on small screens.
- **AC3** Loading skeletons, empty states, error states with retry, toasts and confirmation dialogs exist.
- **AC4** Controls are keyboard accessible with visible focus and labels.

### US-16–17 — Quality (Must, 21 pts total)
As the **team**, we want validation and automated evidence so that the jury can verify correctness.
- **AC1** Zod validation on all API inputs; central error envelope.
- **AC2** 15 automated tests executed, covering positive, negative, boundary and exceptional cases.
- **AC3** Frontend and backend build/typecheck cleanly.

### US-18 — Promo codes (Should, 5 pts)
As a **customer**, I want to apply a promo code so that I pay less.
- **AC1** Valid codes apply a server-computed capped discount.
- **AC2** Invalid, expired or below-minimum codes are rejected with a clear message.
