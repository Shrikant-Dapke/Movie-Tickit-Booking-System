# Phase 0 — Repository Audit & Requirements Gap Analysis

**Status:** IN PROGRESS — blocked on authoritative project requirements
**Last updated:** 2026-11-22
**Authoritative process document:** `docs/jury/End Semester Jury Instructions.pdf` (user-supplied, 3 pages, MIT School of Computing, Pune — Agile Software Development Final Jury)
**Extracted text:** `docs/jury/END_SEMESTER_JURY_INSTRUCTIONS.extracted.txt`

---

## 1. What was inspected

| Source | Result |
|---|---|
| Local working tree (initial state) | Empty except a 106-byte `package-lock.json` with no packages |
| Local Git history | `main` had **no commits**; remote-tracking ref `origin/main` existed |
| `git fetch origin` + `git log origin/main` | 20 commits: scaffold → models → API → React app → design system → docs |
| `git ls-remote --heads --tags origin` | **One branch** (`main`), **zero tags** |
| GitHub API tree (`main`, recursive) | 20 files; only `.gitignore`, two READMEs, two `.env.example`, and the client/server app files |
| Full text of all 20 files at `origin/main` | Read and analysed (see §3) |
| User-supplied End Semester Jury Instructions PDF | Read and analysed in full (see §2) |

**Conclusion:** No project requirement specification, problem statement, rubric, or marking scheme exists in the repository or on the remote.

---

## 2. What the Jury Instructions PDF actually defines

This document is authoritative for **process, deliverables and evaluation expectations**. It is **not** a project requirements document. It never mentions CineBook, movies, theatres, shows, seats, bookings, payments, or any domain feature.

### 2.1 Project implementation expectations (Section 1)
1. Continue the **same problem statement assigned during Jury 1**; do not change the topic.
2. Develop a **working application/prototype** based on that assigned problem statement.
3. Implement the **core features** and demonstrate a **complete end-to-end workflow**.
4. The application must **run properly during the jury**; a PPT or static screenshots alone are insufficient.
5. Use appropriate technologies, programming languages, databases and development tools.
6. Implement **proper input validation** and **basic error handling**.

### 2.2 Functional expectations (Section 2)
1. **All major functionalities mentioned in the assigned problem statement** must be implemented.
2. The application accepts user inputs and generates appropriate outputs.
3. Relevant features *"wherever applicable to your project"*: login, registration, search, data entry, update, delete, booking, tracking, reporting.
4. Use sample/dummy data where real data or external services are unavailable.
5. If any feature is simulated, **clearly state that it is a simulation**.

### 2.3 Testing expectations (Section 3)
- Perform testing before the final jury.
- Prepare and demonstrate **at least five test cases**.
- Include **positive**, **negative**, and **boundary/exceptional** test cases.
- Ensure invalid inputs and errors are handled appropriately.

### 2.4 Agile artefacts (Section 4) — mandatory
- Product Backlog with prioritised user stories.
- User Stories with acceptance criteria.
- Sprint Planning and Sprint Backlog.
- Definition of Done (DoD).
- Sprint progress and task allocation.
- Evidence of Agile tool usage (Jira/Trello or equivalent).
- GitHub repository with source code and development progress.

### 2.5 Final demonstration (Section 5)
Explain problem statement & solution; explain architecture & technologies; demonstrate the working application with a complete workflow; demonstrate implemented features and test cases; explain Agile methodology/framework and its implementation; explain challenges and how they were resolved; clearly explain each team member's individual contribution.

### 2.6 Individual evaluation (Section 6)
Every member must be prepared to explain the project; each student is evaluated individually; students must demonstrate clear understanding of the features they implemented; all members present and actively participating.

### 2.7 Important instructions (Section 7)
Project complete and tested before jury; source code, database and required files ready; internet/software dependencies checked in advance; do not depend entirely on pre-recorded videos or PPT slides; professional conduct and readiness for evaluator questions.

> Final line of the PDF: the jury will focus on the **working prototype, implementation of core functionalities, testing, Agile practices and individual contribution**; design, documentation or screenshots alone are insufficient.

---

## 3. What the existing repository contains (to be removed in the rebuild)

| File | Summary |
|---|---|
| `package.json` | npm workspaces (`client`, `server`), scripts `dev:client`, `dev:server`, `build`, `seed` |
| `client/` | Vite + React 18 + Tailwind 3 + lucide-react; **single 16.7 KB `App.jsx`** containing all pages, state, API calls and markup |
| `client/src/style.css` | Dark "cinema" design tokens; hand-rolled component classes |
| `server/src/index.js` | **Single 6.3 KB Express file** with all routes, inline auth middleware and business logic |
| `server/src/models.js` | Mongoose models: User, Movie, Show, SeatLock, Booking (no Theatre/Screen entity) |
| `server/src/seed.js` | 6 movies, 72 shows over 3 days, demo admin `admin@cinebook.demo` / `Admin123!` |
| `README.md`, `server/README.md` | Setup notes; explicitly state checkout is a **demo** with no real payments, and list missing production work |

### Key defects in the existing implementation (design inputs for the rebuild)
- **Non-atomic seat reservation:** hold endpoint reads availability then inserts `SeatLock` documents — a check-then-act race; two users can both pass the check. No MongoDB transactions.
- **No Zod/validation layer**; ad-hoc `if (!name || ...)` checks.
- **No TypeScript** on either client or server (TS is listed as a client dep but not used).
- **No tests of any kind.**
- **No Theatre or Screen entities** — theatre/screen are free-text strings on `Show`.
- **Weak admin CRUD** — create/delete movie and create show only; no update, no booking administration.
- **Security:** hardcoded fallback JWT secret (`dev-secret-change-me`), no rate limiting, no input sanitisation, regex search unescaped.
- **No Agile artefacts** in the repository (backlog, user stories, sprints, DoD).
- **No evidence of a real Agile tool** or of task allocation.

---

## 4. Decisions already locked

| Decision | Value | Rationale |
|---|---|---|
| Backend test runtime | **`mongodb-memory-server`** | User-selected; portable, no external dependency for CI/tests |
| Real MongoDB path | Documented for jury demonstration | User-selected; demo uses a real local MongoDB instance |
| Git history | Preserved; rebuild committed as new logical milestones | Master instruction |
| Authoritative jury PDF | Preserved verbatim under `docs/jury/` | Master instruction: never delete authoritative requirement docs |

---

## 5. Project-specific information still missing (BLOCKERS)

The jury PDF cannot supply these. They must come from the user's **original Jury 1 problem statement / project specification**. Nothing in this list will be guessed.

| # | Missing information | Why it is required | Impact if guessed |
|---|---|---|---|
| 1 | **The original assigned problem statement (Jury 1), verbatim** | PDF §2.1 "Continue the same problem statement assigned during Jury 1" and §2.2.1 "All major functionalities mentioned in your assigned problem statement must be implemented." It is the source of truth for the feature set. | Requirements would be invented; jury could mark core functionalities as missing. |
| 2 | **Any Jury 1 rubric / marking scheme / evaluation criteria** | Needed to know which features carry weight and what "complete" means for this project. | Wrong prioritisation; pass criteria unknown. |
| 3 | **Exact actor/role list and permissions** (e.g. customer, admin, theatre owner, super-admin) | Determines auth model, RBAC, and which screens are required. | Could build wrong roles or omit a required one. |
| 4 | **Prescribed feature list and scope boundaries** — especially payment (simulate vs. sandbox), notifications/email, seat-lock rules, cancellation/refunds, reporting/tracking outputs | PDF §2.2.4–5 allow sample data and require simulations to be labelled, but do not say *which* features are simulated. | Would either over-build or claim a simulation is real. |
| 5 | **Any mandated data model / fields / domain constraints** (movie, theatre, screen, show, seat, booking entities; pricing rules; seat layout rules) | Determines schema design, indexes and validation rules. | Schema could conflict with the assigned specification. |
| 6 | **Whether MERN is mandated or merely "appropriate technology"** | The master brief says MERN; PDF §1.5 says only "appropriate technologies". MERN is planned, but the origin of the constraint should be recorded. | Minor: affects how the architecture choice is justified in the demo. |
| 7 | **Existing Jury 1 Agile artefacts** (product backlog, user stories, sprint plan, prior sprint history) | PDF §4 requires these artefacts; continuing real artefacts is stronger than fabricating history. | Agile evidence could be inconsistent with earlier submissions. |
| 8 | **Team composition: member count, names, and intended per-member ownership areas** | Required by PDF §4 (task allocation) and §5.7 / §6 (individual contribution and individual evaluation). | Cannot truthfully document individual contributions. |
| 9 | **Which Agile tool was actually used** (Jira / Trello / GitHub Projects / equivalent) and whether an account/board exists | PDF §4 explicitly requires "evidence of Agile tool usage". | Cannot claim tool usage that did not happen. |
| 10 | **Any prescribed demo dataset or domain-specific examples** | PDF §2.2.4 permits dummy data; the assigned problem statement may specify expected examples. | Demo may not match evaluator expectations. |

### Provisional (NOT authoritative) input
The master instruction supplied by the user contains a detailed feature brief (customer auth, movie catalogue/search, theatre/showtime/seat selection, seat holds with expiry, double-booking prevention, booking history, admin CRUD, concurrency tests, premium UI). This is recorded as **provisional user guidance**, not as the jury's project requirement. It will be reconciled against the Jury 1 problem statement as soon as that document is provided.

---

## 6. What will happen next

1. **BLOCKED:** Do not finalise `IMPLEMENTATION_PLAN.md` or its requirement-to-implementation traceability matrix.
2. **BLOCKED:** Do not delete the existing application code or start the rebuild.
3. **Awaiting from user:** the original Jury 1 problem statement / project specification (items 1–3 and 7–9 above are the minimum needed; item 8 is needed before Agile artefacts can be completed).
4. On receipt: convert every requirement into testable acceptance criteria → register them in the traceability matrix → write and execute the plan → report actual test results only.

---

## 7. Artefact index

- `docs/jury/End Semester Jury Instructions.pdf` — authoritative jury process document (preserved verbatim)
- `docs/jury/END_SEMESTER_JURY_INSTRUCTIONS.extracted.txt` — raw text extraction for searchability
- `docs/audit/PHASE0_AUDIT.md` — this document
