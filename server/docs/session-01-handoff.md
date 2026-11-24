# Progress log and session handoffs

Canonical record of what each session did, the evidence, the Git state, and what the next session
should do. (The file name is historical; it covers all sessions so far.) Topic documents hold the
details: [architecture](architecture.md), [API contracts](api-contracts.md),
[security review](02-security-review.md), [decisions](assumptions-and-pending-decisions.md),
[traceability](requirements-traceability.md), [Plant Management review](04-plant-management-decision-review.md).

## Current state (2026-11-24)

| Item | State |
|---|---|
| Implemented backend | Health, authentication (register, login, logout, `GET /auth/me`), user profile name (`GET`/`PATCH /users/me`). No other endpoints. |
| Frontend | Static prototype; only login and sign-up call the API (`/api/v1/auth/*`). |
| Plant Management | Reviewed, **not started**. Create/list/view/edit can proceed; delete is blocked on PM-6. |
| CI | Green on the fork's draft PR (evidence below) |
| Requirements sources | Original SRS/DFD, Flutter, AI and IoT specs are **unavailable** and were **not** reviewed |

## Git state

| Ref | State |
|---|---|
| `development` | Untouched (local and on the fork, `a680f32`) |
| `feature/backend-foundation-auth` | Pushed to the owner's fork only (`abdalrahmansaqr1/Leaf-and-Root`, a fork of `yasminekamel219-maker/Leaf-and-Root`). Head at last verification: `799da46`, equal local and remote |
| Draft PR #1 on the fork | `feature/backend-foundation-auth` → fork `development`. Open, **draft, not merged**; opened only because CI triggers on `pull_request`, not on feature-branch pushes |
| `docs/session-2-plant-requirements` | **Local only.** Holds the session-2 and documentation-session changes; see the session 3 entry for its commit status |

Nothing was pushed to `upstream`, merged or deployed.

Commits on the feature branch: `fbcc681` (foundation + authentication), `336c209` (CI job, rate limits,
scrypt upgrade, cookie fix), `25550bb` (timing fix, security review, handoff), `14f2ea7` (CI placeholder
`DATABASE_URL`), `799da46` (CI results and an early Plant Management readiness report, since replaced by
[04-plant-management-decision-review.md](04-plant-management-decision-review.md)). Not committed on purpose: `.claude/launch.json`
(local tool state).

## Session 1 — Backend foundation and authentication

Extended the existing `server/` app (see [01-repository-assessment.md](01-repository-assessment.md) for why
not `backend/`): validated env, `/api/v1`, health with a database probe, error envelope, pino logging with
redaction, CORS allowlist, security headers + CSRF, Swagger, isolated test-database harness, register/login/
logout/me, cookie and bearer sessions, `GET`/`PATCH /users/me`, `UserRole` migration. Follow-ups: PostgreSQL
CI job, three-window auth rate limiting, scrypt N=2^16 with rehash-on-login, malformed-cookie fix, timing
padding for legacy hashes. Frontend change: one line in `AuthPages.tsx`.

### Verification evidence

| Check | Result | Where |
|---|---|---|
| `tsc --noEmit` (server) | clean | local, 2026-11-24 |
| Unit tests | **30 / 30** (7 files) | local; CI run 45311513292 |
| Integration tests (isolated `leaf_and_root_test`) | **51 / 51** (4 files) | local; CI run 45311513292 |
| `pnpm check` | exit 0 | local and on a fresh clone; CI `check` job |
| Fresh-clone setup (install, `db:deploy`, `prisma:generate`, unit, e2e, `pnpm check`, `dev:api`, `dev`, Vite proxy, Swagger, `start`) | all worked | local, documentation session |
| `db:deploy` on a brand-new database | `All migrations have been successfully applied.` (2 migrations) | local scratch database, since dropped |
| Malformed-cookie test red before the fix | failed with `URIError` | local |

### CI evidence (GitHub Actions on the fork, draft PR #1)

| Run | Head | `check` | `API integration tests (PostgreSQL)` |
|---|---|---|---|
| 45310842815 | `25550bb` | **failed**: `prisma generate` needs `DATABASE_URL` (locally supplied by the ignored `server/.env`) | pass |
| 45311142969 | `14f2ea7` | pass | pass |
| 45311513292 | `799da46` | pass (30 unit tests, frontend and API builds) | pass (51 tests) |

The failure was fixed by a placeholder `DATABASE_URL` on the database-free job; no test was changed, skipped
or weakened. The `api-integration` job exists on the feature branch only until it is merged, so upstream
`main`/`development` do not run it yet. GitHub Actions is enabled on the fork. Details of the jobs:
[architecture → CI](architecture.md#ci-github-actions).

### Real-browser verification (manual, in-app browser; React on :8443 → Vite proxy → API :3001)

The app uses `HashRouter`, so pages are `/#/signup` and `/#/login`.

| Scenario | Observed |
|---|---|
| Sign up through the form | `POST /api/v1/auth/register` → 201 |
| Sign up with an existing email | UI shows "An account already exists for this email" (409) |
| Login, wrong password | UI shows the generic "Invalid email or password" |
| Login, correct password | UI shows the "Welcome back!" state |
| Session cookie | Not visible to `document.cookie` (HttpOnly); `/auth/me` and `/users/me` → 200 with it |
| Persistence | `/auth/me` still 200 after an incidental full-page reload by the dev server |
| No credentials | `/auth/me` with `credentials: omit` → 401 |
| `PATCH /users/me` | name changed → 200; `{role:"ADMIN"}` → 422 |
| Logout | 204; `/auth/me` afterwards → 401; second logout → 204 |
| Cross-origin read from the page to the API origin | Blocked by the browser (CORS off in the default `.env`) |
| Allowlist (second API instance with `CORS_ALLOWED_ORIGINS=http://localhost:8443`, curl) | Allowed origin gets `Access-Control-Allow-Origin` + credentials; `https://evil.example` gets none |
| CSRF (curl with `Sec-Fetch-Site: cross-site`) | Non-allowlisted origin → 403; allowlisted origin → 204 |

Not covered: the "account created" card after sign-up (the dev server reloaded the page and cleared it; not
repeated), a `Secure` cookie over real HTTPS, the bearer flow in a real mobile client, other browsers, and
any automated browser test (the run was manual and CI cannot repeat it).

## Session 2 — Plant Management requirements review (docs only)

Reviewed PM-1…PM-8, defined the minimal Plant model and API as **proposals**, added the traceability matrix,
and marked D15 (PostgreSQL integration tests in CI) implemented and verified in CI on the feature branch
(run 45311513292), **not yet merged into `development`**. No code or schema changes. See
[04-plant-management-decision-review.md](04-plant-management-decision-review.md).

## Session 3 — Documentation consolidation (docs only)

Audited and updated all backend and root documentation against the implementation, folded the readiness
report into the Plant Management review (deleting the duplicate file), added CI, ownership, AI/IoT and
deployment sections to [architecture.md](architecture.md), and verified every setup command on a fresh clone.
Changes are on the local branch `docs/session-2-plant-requirements`; the quality-gate results are recorded
in the final report of that session, and the diff must be reviewed before any commit. No push.

## Known limitations and remaining risks

- argon2id not adopted (D10); ~64 MiB per concurrent hash; not load-tested.
- Rate-limit counters are in memory and per process; `trust proxy` not configured (D11).
- The per-account window permits a limited lock-out of a victim's login.
- Registration reveals existing emails (409, D9).
- Sessions are absolute-lifetime; no refresh or "revoke other sessions" (D8).
- Swagger UI needs a relaxed CSP; keep it off in production unless intended.
- Local exposure: `compose.yaml` publishes PostgreSQL on all interfaces and Vite listens on `0.0.0.0`
  ([details](02-security-review.md#3b-local-development-exposure-found-during-the-documentation-audit)).
- The dev database contains test users from manual checks (`smoke-…@example.com`, `browser-check-1@example.com`).
- The e2e config raises `AUTH_RATE_LIMIT_IP/ACCOUNT` to 1000; the hardening spec tests the real windows.
- Requirements sources are unavailable (above); D1–D16 are unresolved, see [decisions](assumptions-and-pending-decisions.md).

## Recommended next implementation task

**Plant CRUD without delete**: `Plant` model + migration (`id`, `userId`, `name` required, `species`,
`location`, `notes` optional, timestamps; **no `deletedAt`**), then `POST/GET /plants`, `GET/PATCH /plants/:id`
with owner-scoped queries and identical 404 for "missing" and "not yours", tests first. Hold
`DELETE /plants/:id` until PM-6 is decided. Scope and rules: [04-plant-management-decision-review.md §8](04-plant-management-decision-review.md#8-implementation-ready-recommendation).

## Handoff for the next Claude Code session

1. **Read first:** this file, then [04-plant-management-decision-review.md](04-plant-management-decision-review.md),
   [assumptions-and-pending-decisions.md](assumptions-and-pending-decisions.md), [architecture.md](architecture.md).
2. **Environment:** follow [server/README.md](../README.md#run-locally). Docker Desktop must be running; if the
   dev database is missing, `docker compose up -d postgres` then `pnpm --dir server db:deploy`.
3. **Git:** decide with the owner how the docs branch and the feature branch land (see the integration plan in
   the session 3 report). Do not push, merge, deploy or touch `development` without explicit approval.
4. **Rules that still apply:** backend only; no unapproved business rules; do not describe unrun tests as
   passing; the SRS/DFD are unavailable, so cite them only when the files are provided; keep AI, IoT, photos,
   scheduling, reminders and marketplace out of the Plant CRUD session.
5. **Conventions to follow:** `/api/v1`, `{data}`/`{error}` envelopes, strict Zod schemas via `parseBody`,
   `SessionAuthGuard` + `@CurrentUser()`, OpenAPI decorators, integration tests against the isolated test DB.
6. **Done means:** `pnpm check` and `pnpm --dir server test:e2e` pass locally, CI green, docs and the
   traceability matrix updated in the same change.
