# CineBook — Implementation Plan

**Source of truth:** the Jury 1 / project brief supplied by the user (`docs/requirements/PROJECT_BRIEF.md`).
**Evaluation expectations:** `docs/jury/End Semester Jury Instructions.pdf` (process only — no project features).
**Status:** Phase 0 complete; implementation in progress.

> The user instructed: *"Do not spend time producing excessive planning documents. Start implementing."* This plan is deliberately compact. `docs/audit/PHASE0_AUDIT.md` holds the detailed audit.

---

## 1. Architecture

```
CineBook/
├── package.json                npm workspaces: server, client
├── server/                     Express + TypeScript REST API
│   └── src/{config,lib,middleware,models,modules,services,seed,tests}
├── client/                     React + TypeScript + Vite + Tailwind
│   └── src/{api,components,features,hooks,layouts,pages,store,types}
└── docs/{jury,audit,requirements,agile,api}
```

- **Backend:** Express, Mongoose, Zod, JWT (httpOnly-safe bearer), bcryptjs, helmet, CORS, rate limiting, central error envelope `{ success, data, message, errors }`.
- **Concurrency:** `SeatLock` collection with unique `{show, seat}` index; atomic upserts for holds; conditional `held → booked` transition inside a MongoDB transaction; TTL index expires stale holds. Conflicts → HTTP 409. No two bookings can ever own the same seat.
- **Frontend:** React Router pages, TanStack Query for server state + polling seat availability, React Hook Form + Zod for validation, reusable design-system components.
- **Tests:** Vitest + Supertest + `MongoMemoryReplSet` (transaction-capable), plus frontend build/typecheck verification.

---

## 2. Phases

| Phase | Objectives / requirements covered | Files / modules | Acceptance criteria | Tests | Status |
|---|---|---|---|---|---|
| **0 — Audit & requirements** | Inspect repo, identify authoritative docs, separate jury process from project features | `docs/audit/PHASE0_AUDIT.md`, `docs/jury/*`, `docs/requirements/*` | All sources inspected; brief preserved; gaps closed | — | ✅ Done |
| **1 — Foundation** | Workspaces, TS, env config, design tokens | root `package.json`, `server/tsconfig.json`, `client/*config`, Tailwind theme | `npm install`, typecheck, builds succeed | build + typecheck | ✅ Done |
| **2 — Database & API core** | R11 models, R11 REST, central errors, Zod | `server/src/models/*`, `lib/*`, `app.ts` | 10 models with indexes; consistent error envelope | typecheck + integration | ✅ Done |
| **3 — Auth & RBAC** | R1, R12 | `modules/auth`, `middleware/auth` | Register/login/logout, bcrypt, JWT, customer/admin RBAC, profile | TC-01, TC-02 | ✅ Done |
| **4 — Catalogue & discovery** | R2 | `modules/movies`, client catalogue | Search + genre/language/format filters; details with trailer | TC-03 | ✅ Done |
| **5 — Theatres, screens, shows** | R3, R9 | `modules/theatres`, `screens`, `shows` | CRUD + cities + formats + schedule filtering; admin protected | TC-04, TC-11 | ✅ Done |
| **6 — Seats & atomic locking** | R4, R12 | `modules/seats`, `services/booking.service` | Categories/pricing, states, expiry, max limit, double-booking impossible | TC-05, TC-06, TC-08, TC-12 | ✅ Done |
| **7 — Booking + simulated payment** | R5, R6, R7 | `modules/bookings`, `payments`, QR | Summary, codes, simulated pay success/fail, digital ticket with QR, download/print | TC-07, TC-09 | ✅ Done |
| **8 — Dashboards** | R8, R9 | client pages + admin APIs | Customer history/dashboard; admin metrics, CRUD, booking management | TC-10, TC-11 | ✅ Done |
| **9 — UI/UX & responsive** | R10 | design system, all pages | Dark cinematic theme, skeletons, empty/error states, toasts, dialogs, mobile | client typecheck + build | ✅ Done |
| **10 — Tests & fixes** | R13, jury §3 | `server/src/tests/*` | ≥5 named cases: positive, negative, boundary, exceptional, concurrency | 15/15 executed and passing | ✅ Done |
| **11 — Delivery** | R14, jury §4–7 | `README.md`, agile docs, `FINAL_DELIVERY_REPORT.md` | Working demo, seed credentials, docs, commits | final verification | 🔄 In progress |

---

## 3. Requirement → implementation → test traceability

| ID | Requirement (from project brief) | Implementation | Test case |
|---|---|---|---|
| R1 | Customer registration/login/logout, JWT, hashing, RBAC, profile, history | `modules/auth`, `modules/users`, `middleware/auth` | TC-01 register/login, TC-02 unauthorized admin access |
| R2 | Homepage, current/upcoming/featured/trending, search, filters, details, trailer | `modules/movies`, `pages/Home`, `MovieDetails` | TC-03 search + filters |
| R3 | Theatres, locations, shows, city/theatre selection, formats, availability | `modules/theatres`, `shows`, `pages/Shows` | TC-04 show availability |
| R4 | Interactive seats, categories/pricing, states, live refresh, max limit, summary | `modules/seats`, `SeatMap` | TC-05 seat states, TC-06 boundary max seats |
| R5 | Booking flow, unique ID, validation, prevent duplicates | `services/booking.service`, `modules/bookings` | TC-07 booking confirmation, TC-08 double booking |
| R6 | Simulated payment (success/fail), clearly labelled | `modules/payments` | TC-09 failed payment |
| R7 | Digital ticket with QR, download/print | `lib/qr`, `components/Ticket` | TC-10 ticket contents |
| R8 | Customer dashboard: profile, upcoming/previous bookings | `pages/Dashboard` | TC-11 history |
| R9 | Admin: overview metrics + movie/theatre/screen/show/booking CRUD + poster upload | `modules/admin`, `modules/uploads`, admin pages | TC-02, TC-11 admin CRUD, TC-15 poster upload |
| R10 | Premium responsive UI, states, animations, toasts | design system + all pages | build + visual check |
| R11 | MERN, TypeScript, Zod, central errors, 9 models, indexes | whole codebase | typecheck + unit |
| R12 | Atomic ops, transactions, expiry, authz, validation, backend pricing | `services/booking.service`, middleware | TC-08, TC-13 expired hold |
| R13 | Automated auth/discovery/seat/booking/payment/admin/invalid tests | `server/src/tests` | full suite |
| R14 | Complete customer + admin end-to-end workflows | seed + demo | TC-14 E2E customer flow |

> Test cases TC-01…TC-15 are executed with Vitest/Supertest against `MongoMemoryReplSet`; actual results are recorded in `FINAL_DELIVERY_REPORT.md`. No test is reported as passing unless executed.

---

## 4. Risks & decisions

- **Transactions need a replica set.** Tests and demo use a single-node replica set (`MongoMemoryReplSet` in tests; documented `mongod --replSet` for the jury demo). This is why the memory server choice was upgraded from standalone to replica-set.
- **Simulated payments** are explicitly labelled as simulations in UI and API responses; no real gateway credentials are used.
- **Trailer/posters** use external sample URLs (YouTube embeds / TMDB images); the app degrades gracefully offline with placeholder art.
- **Agile artefacts** (backlog, stories, sprint plan, DoD) are required by the jury and will be produced as concise documents from the brief rather than fabricated history.
