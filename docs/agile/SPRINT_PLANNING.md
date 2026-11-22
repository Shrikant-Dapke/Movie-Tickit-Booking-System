# Sprint Planning — Sprint 1 (Rebuild)

**Sprint goal:** Deliver a working CineBook prototype covering the complete customer and admin workflows from the assigned problem statement, with verified concurrency safety and jury evidence.

**Duration:** one delivery sprint (2026-11-22). This is the sprint actually executed for the rebuild; earlier topic work is not represented here because no prior sprint artefacts were supplied.

**Team capacity:** to be confirmed — member names and individual ownership are not yet provided and must be recorded in `SPRINT_PROGRESS.md` before the jury.

## Selected sprint backlog

| Story | Points | Reason for selection |
|---|---:|---|
| US-01 Authentication & RBAC | 5 | Blocks every booking flow |
| US-02 Movie discovery | 8 | Entry point of customer journey |
| US-03 Theatres & shows | 5 | Required to reach seat selection |
| US-04 Seat selection | 13 | Explicitly "one of the most important features" |
| US-05 Concurrency-safe holds | 13 | Explicit double-booking prohibition |
| US-06 Booking | 8 | Core problem statement workflow |
| US-07 Simulated payment | 5 | Required checkout step |
| US-08 Digital ticket | 5 | Required deliverable |
| US-09 Customer dashboard | 5 | Required feature |
| US-10 Admin overview | 5 | Required feature |
| US-11–14 Admin CRUD | 34 | Required feature set |
| US-15 UI/UX | 13 | Required; jury weighs working, polished app |
| US-16–17 Validation & tests | 21 | Jury mandates validation and ≥5 test cases |
| US-18 Promo codes | 5 | Small enhancement, already feasible |
| US-19 Hold expiry | 5 | Part of concurrency correctness |
| **Committed total** | **137 pts** | |

## Sprint definition

- **Daily coordination:** short sync (tool/format to be confirmed by the team).
- **Branching:** work committed to `main` in logical milestones; history preserved from the prior implementation.
- **Review:** each milestone verified by typecheck, build and executed tests before commit.
- **Retrospective:** capture challenges and resolutions in `FINAL_DELIVERY_REPORT.md` (jury demonstration item 6).

## Dependencies and risks

| Risk | Mitigation |
|---|---|
| MongoDB transactions require a replica set | `MongoMemoryReplSet` in tests; documented single-node replica-set setup for the jury demo |
| Two customers booking one seat | Unique `{show, seat}` index + conditional upserts + transaction + 409 conflicts |
| Free tier / no payment credentials | Simulated gateway clearly labelled in UI, API and docs |
| External poster/trailer URLs offline | Placeholder poster handling in UI; seeded data uses public sample URLs |
| Missing team/individual data | Explicitly marked "to be supplied"; no names fabricated |
