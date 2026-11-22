# Sprint Progress & Task Allocation — Sprint 1

## Progress board (truthful snapshot, 2026-11-22)

| Story | Points | Status | Evidence |
|---|---:|---|---|
| US-01 Authentication & RBAC | 5 | Done | TC-01, TC-02; `server/src/modules/auth`, `middleware/auth.ts` |
| US-02 Movie discovery | 8 | Done | TC-03; `modules/movies`, client `HomePage`, `MovieDetailsPage` |
| US-03 Theatres & shows | 5 | Done | TC-04, TC-11; `modules/theatres`, `screens`, `shows` |
| US-04 Seat selection | 13 | Done | TC-05, TC-06; `modules/seats`, client `SeatMap`/`SeatSelectionPage` |
| US-05 Concurrency-safe holds | 13 | Done | TC-08, TC-12; `SeatHold` unique index + transactions |
| US-06 Booking | 8 | Done | TC-07, TC-14; `services/booking.service.ts` |
| US-07 Simulated payment | 5 | Done | TC-09; `modules/payments`, checkout UI |
| US-08 Digital ticket | 5 | Done | TC-07; `lib/ticket.ts`, `TicketPage` |
| US-09 Customer dashboard | 5 | Done | TC-10; `DashboardPage` |
| US-10 Admin overview | 5 | Done | TC-02; `modules/admin` |
| US-11 Movie CRUD | 8 | Done | TC-11 |
| US-12 Theatre/Screen CRUD | 13 | Done | TC-11 |
| US-13 Show CRUD | 8 | Done | TC-11 |
| US-14 Booking management | 5 | Done | `GET/PATCH /admin/bookings` |
| US-15 UI/UX | 13 | Done | design system + responsive pages; build verification |
| US-16 Validation/security | 8 | Done | Zod schemas, central error handler, bcrypt, JWT |
| US-17 Automated tests | 13 | Done | **16/16 tests executed and passing** |
| US-18 Promo codes | 5 | Done | `modules/promo`, server-side discount |
| US-19 Hold expiry | 5 | Done | TC-12; TTL + conditional updates |
| US-20 Delivery docs | 3 | In progress | README / FINAL_DELIVERY_REPORT |

**Velocity:** 134 of 137 committed points complete at this checkpoint; remaining: delivery documentation.

## Task allocation — ACTION REQUIRED BEFORE JURY

The assignment brief and jury instructions require each member to explain their individual contribution. Team member names and ownership were **not supplied**, so no names have been invented. The team must complete this table before the demonstration:

| Member name | Owned stories / components | Key contribution to explain |
|---|---|---|
| _(to be filled)_ | _(e.g. US-01, US-16 auth & security)_ | _(architecture decision, challenge solved)_ |
| _(to be filled)_ | _(e.g. US-04, US-05 seat engine)_ | _(atomic locking, transaction design)_ |
| _(to be filled)_ | _(e.g. US-15 frontend design system)_ | _(UI/UX decisions, responsive behaviour)_ |
| _(to be filled)_ | _(e.g. US-17 tests & docs)_ | _(test strategy, evidence, Agile artefacts)_ |

Every member must be able to explain the overall architecture and the features they implemented (jury instruction §6).

## Evidence of Agile tool usage — ACTION REQUIRED BEFORE JURY

This repository is the maintained source of truth for the Agile artefacts (`docs/agile/`). The jury also asks for evidence of a tool such as Jira, Trello or GitHub Projects. Two honest options remain:

1. **GitHub Projects/Issues** — create issues from the backlog table and a project board with To Do / In Progress / Done columns from this document, then point the jury at the board.
2. **Jira/Trello export** — if the team already used one, export or screenshot the board and add it to `docs/agile/evidence/`.

No claim of tool usage is made here until one of these exists. A `.github/ISSUE_TEMPLATE` and a ready-to-import board description are provided in this repository to make option 1 quick.

## Sprint events (recorded)
- **Sprint planning:** selected the backlog above and committed to the rebuild scope.
- **Daily progress:** tracked via Git commits and executed test results (see commit history).
- **Sprint review:** customer and admin workflows demonstrated via integration tests TC-07 and TC-14.
- **Retrospective:** challenges and resolutions documented in `FINAL_DELIVERY_REPORT.md`.
