# Readiness report — next session: Plant Management

Status: **foundation is ready; requirements are not.** No Plant Management code was written.
The original SRS/DFD documents are not in the repository and were **not** reviewed. Everything below
that describes plants comes from the static frontend prototype (`src/data/siteData.ts`,
`src/components/home`), which shows illustrative sample data and is **not** an approved requirement.

## Ready (verified, see the handoff)

- Authenticated, session-based identity for every request (`SessionAuthGuard`, `@CurrentUser()`), so
  ownership checks (`plant.userId === currentUser.id`) can be built on a proven base.
- Prisma + migration workflow; isolated integration-test database; CI runs those tests against PostgreSQL
  (green on the fork: 30 unit, 51 e2e).
- Conventions to reuse: `/api/v1`, `{data}` / `{error}` envelopes, Zod `parseBody`, OpenAPI helpers,
  rate limiting, redacted logging.

## What the prototype suggests (NOT confirmed requirements)

The home-page example collection shows per plant: name, status text (e.g. "Needs water", "Optimal"),
location label, light level, a watering interval ("Every 7 days") and a next-task hint. Marketing copy
mentions "save the plant, record its location, and organize upcoming care tasks" and "Free for up to 10
plants" (sign-up page). Care guidance, identification and health triage are AI-driven and out of scope.

## Open decisions to settle before designing the model

Existing pending items stay open: D5 (roles), D7 (account deletion/data retention), D12 (photo submission),
D13 (plant data model, care tasks), D14 (AI/IoT), plus the rest of D1–D16 unchanged.

New questions for the product owner (proposed IDs, not yet in the decision list):

| # | Question | Why it matters |
|---|---|---|
| P1 | Is the "10 plants free" limit a real rule, and what happens at the limit? | Enforcement and error contract |
| P2 | Plant identity: free-text name only, or linked to a species catalogue? Who owns the catalogue? | Schema shape; catalogue is a separate feature |
| P3 | Care tasks: user-defined schedules only, or generated from guidance? Recurrence rules? Time zones? | Core of the data model |
| P4 | Is care history (completed tasks) required, and for how long is it kept? | Storage and retention (ties to D7) |
| P5 | Photos per plant: stored? where? size/type limits? privacy? | Depends on D12 and storage choice |
| P6 | Deleting a plant: soft or hard delete; what happens to its tasks and history? | Referential design |
| P7 | Notifications/reminders in scope? | Needs a scheduler and delivery channel (D16) |
| P8 | Sensor data linkage (IoT) in this phase? | Device identity differs from user sessions (D14) |

## Proposed scope for the session (provisional, needs approval)

1. Confirm the answers to P1–P4 and P6, or record explicit provisional assumptions in
   `assumptions-and-pending-decisions.md` in the same Confirmed / Provisional / Pending format.
2. `Plant` model owned by a user (+ migration), CRUD under `/api/v1/plants` with owner-only access
   (404 for other users' plants rather than 403, to avoid leaking existence — provisional).
3. Care tasks and history only if P3/P4 are answered; otherwise defer.
4. Tests first for ownership (user A cannot read, change or delete user B's plant), validation, pagination,
   and the plant limit if P1 is confirmed.

## Risks to watch

- Building a species/care-guidance catalogue by guesswork would invent requirements.
- In-memory rate limiting and absent `trust proxy` (D11) matter more once data is user-specific.
- The frontend still uses static data; wiring it is frontend work and out of backend scope unless asked.
- `POST /api/photo-submissions` is called by the frontend but not implemented (D12).
