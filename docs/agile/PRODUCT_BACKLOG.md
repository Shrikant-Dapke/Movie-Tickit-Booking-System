# CineBook — Product Backlog

**Product owner:** project team (to be confirmed)
**Last refined:** 2026-11-22
**Source:** `docs/requirements/PROJECT_BRIEF.md`
**Prioritisation:** MoSCoW + relative business value (1 = highest). Order = current priority order.

| Rank | ID | User story / feature | Theme | Value | Priority | Estimate (pts) | Status |
|---:|---|---|---|---:|---|---:|---|
| 1 | US-01 | Register, log in, stay signed in and sign out | Authentication | 10 | Must | 5 | Done |
| 2 | US-02 | Browse movies with poster, details, trailer and search/filters | Discovery | 10 | Must | 8 | Done |
| 3 | US-03 | View theatres, screens, showtimes and city/format filters | Discovery | 9 | Must | 5 | Done |
| 4 | US-04 | Select seats with categories, live availability and price summary | Core booking | 10 | Must | 13 | Done |
| 5 | US-05 | Hold seats safely; never let two customers book one seat | Reliability | 10 | Must | 13 | Done |
| 6 | US-06 | Complete booking: review, confirm, unique ID, history | Core booking | 10 | Must | 8 | Done |
| 7 | US-07 | Simulated payment with success/failure paths (labelled) | Core booking | 9 | Must | 5 | Done |
| 8 | US-08 | Digital ticket with QR, print and download | Core booking | 8 | Must | 5 | Done |
| 9 | US-09 | Customer dashboard: profile, upcoming/past bookings | Customer | 7 | Must | 5 | Done |
| 10 | US-10 | Protected admin dashboard with overview metrics | Admin | 9 | Must | 5 | Done |
| 11 | US-11 | Admin movie CRUD (incl. poster URL, availability) | Admin | 8 | Must | 8 | Done |
| 12 | US-12 | Admin theatre + screen CRUD with seat layout & pricing | Admin | 8 | Must | 13 | Done |
| 13 | US-13 | Admin show CRUD (assign movie/theatre/screen, date/time, price) | Admin | 8 | Must | 8 | Done |
| 14 | US-14 | Admin booking management: list, search, filter, status | Admin | 7 | Must | 5 | Done |
| 15 | US-15 | Premium responsive dark UI, skeletons, empty/error states, toasts | UX | 8 | Must | 13 | Done |
| 16 | US-16 | Backend validation, RBAC, secure hashing, central error handling | Quality | 9 | Must | 8 | Done |
| 17 | US-17 | Automated tests: auth, discovery, seats, concurrency, payment, admin | Quality | 9 | Must | 13 | Done |
| 18 | US-18 | Promo code validation and discount | Enhancement | 4 | Should | 5 | Done |
| 19 | US-19 | Seat-hold auto-expiry + abandoned checkout cleanup | Reliability | 8 | Must | 5 | Done |
| 20 | US-20 | Deployment/seed documentation and jury demo script | Delivery | 7 | Must | 3 | Planned |

**Done** means the Definition of Done in `DEFINITION_OF_DONE.md` was satisfied and the story was verified in the running application or in executed tests.

### Deferred / out of scope for the jury prototype
- Real payment gateway integration (explicitly a labelled simulation in the brief).
- Email/SMS notifications.
- OAuth/Google sign-in.
- Multi-language UI.
- Seat-level QR scanning enforcement at theatre entry.
