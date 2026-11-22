# Definition of Done (DoD)

A user story or task is **Done** only when every applicable item below is true.

## Code
- [ ] Implemented against `docs/api/CONTRACT.md`; no placeholder or dead UI controls.
- [ ] TypeScript compiles with `npm run typecheck` (no errors).
- [ ] Input validated with Zod on the server and with a form schema on the client where a form exists.
- [ ] Errors flow through the central error envelope; no unhandled promise rejections.
- [ ] Backend pricing/authority never trusted from the client.

## Verification
- [ ] `npm test` passes (all 16 test cases), including concurrency and expiry scenarios.
- [ ] `npm run build` succeeds for both workspaces.
- [ ] The affected workflow was exercised in the running application or covered by an executed integration test.
- [ ] Any new requirement has a corresponding acceptance criterion and traceability entry.

## Security & data
- [ ] Protected routes enforce authentication and role checks server-side.
- [ ] No secrets committed; `.env.example` updated if a new variable was introduced.
- [ ] Database indexes present for new query patterns; no unbounded queries.

## Documentation & Agile
- [ ] Backlog/status updated, acceptance criteria checked off.
- [ ] Setup/demo instructions updated if behaviour or configuration changed.
- [ ] Change committed to Git with a descriptive message.

> A story is **not** Done because code merely exists. Tests must be executed and results recorded truthfully.
