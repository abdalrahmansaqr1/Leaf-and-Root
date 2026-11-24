# Session 1 handoff — backend foundation & authentication

Date: 2026-11-24 · Branch `feature/backend-foundation-auth` (cut from `development`) ·
**Pushed to the owner's fork only** (`abdalrahmansaqr1/Leaf-and-Root`, a fork of
`yasminekamel219-maker/Leaf-and-Root`). Nothing pushed to upstream, merged or deployed.
A **draft PR inside the fork** (`feature/backend-foundation-auth` → fork `development`, PR #1) exists only
because the workflow runs on `pull_request`/pushes to main+development, not on feature-branch pushes.
It must not be merged.

## CI evidence (GitHub Actions on the fork, run 45311142969, head `14f2ea7`)

| Job | Result | Detail |
|---|---|---|
| `check` (`pnpm check`: generate, unit, typecheck web+api, build web+api) | **pass** (21 s) | 30/30 unit tests; frontend (Vite) build passed |
| `API integration tests (PostgreSQL)` | **pass** (46 s) | 51/51 e2e tests, 4 files, isolated `leaf_and_root_test` DB, migrations applied from scratch |

History: the first run (head `25550bb`) **failed** in `check`: `prisma generate` needs `DATABASE_URL` (locally
supplied by the gitignored `server/.env`). The Postgres job passed on that run. Fix `14f2ea7` sets a
placeholder `DATABASE_URL` on the database-free job; no test was changed, skipped or weakened. The remote
branch head equals the local head (`14f2ea7d683b6ccfa1744b54a83885d9e01ec3e6`, checked with `git ls-remote`).
GitHub Actions is enabled on the fork (`allowed_actions: all`).

## Commits (local)

| SHA | Content |
|---|---|
| `fbcc681` | Checkpoint: backend foundation + authentication, tests, docs (62 files) |
| `336c209` | CI Postgres job; auth rate-limit redesign; scrypt upgrade with rehash-on-login; malformed-cookie 500 fix |
| `25550bb` | This handoff, security review doc, timing fix, doc updates |
| `14f2ea7` | CI fix: placeholder `DATABASE_URL` for the `check` job |
| tip of the branch (`git log -1`) | Handoff update with CI results |

`development` itself was not modified. Not committed on purpose: `.claude/launch.json` (local tool state).
Pre-existing uncommitted work (`server/` baseline, `compose.yaml`, `pnpm-workspace.yaml`, `vite.config.ts`
proxy, original `AuthPages.tsx` wiring) was included in `fbcc681` because the foundation builds on it.

## What was implemented

Extended the existing `server/` app (see `01-repository-assessment.md` for why not `backend/`):

- **Foundation:** validated env; `/api/v1`; `GET /health` with a real DB probe; error envelope (incl. JSON 404
  outside the prefix); pino logging with redaction; CORS allowlist; security headers + CSRF; Swagger/OpenAPI;
  isolated test-database harness; `.env.example`.
- **Auth:** register, login, logout, `GET /auth/me`; cookie sessions (web) and bearer transport (native).
- **Users:** `GET` and `PATCH /users/me` (name only). Internal `role` never exposed or writable.
- **Follow-up:** CI PostgreSQL job; three-window auth rate limiting; scrypt N=2^16,r=8,p=2 with transparent
  upgrade of old hashes; malformed-cookie fix. Details in [02-security-review.md](02-security-review.md).
- **Frontend:** one line, `AuthPages.tsx` → `/api/v1/auth/*`.

## Verification (actually run, 2026-11-24, Windows, Node 24, PostgreSQL 17 in Docker)

| Check | Result |
|---|---|
| `tsc --noEmit` (server) | clean |
| Unit tests `pnpm --dir server test` | **30 / 30** (7 files) |
| Integration tests `pnpm --dir server test:e2e` (isolated `leaf_and_root_test`) | **51 / 51** (4 files) |
| `pnpm check` (generate, unit, typecheck web+api, build web+api) | exit 0 |
| CI simulation: e2e against a brand-new database name (`ci_sim` → `ci_sim_test`, all migrations from scratch) | 43 / 43 at that time (before the hardening tests were added) |
| New tests were red before the fix | malformed-cookie unit test failed with `URIError` before the fix |

CI has now run on GitHub (see the CI evidence section above). The `api-integration` job uses a disposable
`postgres:postgres` service credential.

### Real-browser verification (React frontend on :8443 → Vite proxy → API :3001, manual run in the in-app browser)

Note: the app uses `HashRouter`, so pages are `/#/signup` and `/#/login`.

| Scenario | Observed |
|---|---|
| Sign up through the form | `POST /api/v1/auth/register` → 201 |
| Sign up with an existing email | UI shows "An account already exists for this email" (409) |
| Login, wrong password | UI shows generic "Invalid email or password" |
| Login, correct password | UI shows the "Welcome back!" state |
| Session cookie | Not visible to `document.cookie` (HttpOnly); `/auth/me` and `/users/me` → 200 with it |
| Persistence | `/auth/me` still 200 after an incidental full-page reload by the dev server |
| No credentials | `/auth/me` with `credentials: omit` → 401 |
| `PATCH /users/me` name | 200, name changed; `{role:"ADMIN"}` → 422 (unknown key) |
| Logout | 204; `/auth/me` afterwards → 401; second logout → 204 (idempotent) |
| Cross-origin read (page → API origin directly) | Blocked by the browser (CORS off in the default `.env`) |
| Allowlist (second API instance, `CORS_ALLOWED_ORIGINS=http://localhost:8443`, curl) | Allowed origin gets `Access-Control-Allow-Origin` + credentials; `https://evil.example` gets none |
| CSRF (curl with `Sec-Fetch-Site: cross-site`) | Non-allowlisted origin → 403; allowlisted origin → 204 |
| Security headers | CSP, HSTS, `nosniff`, `Referrer-Policy`, `X-Frame-Options` present |

Not covered: the "account created" success card after sign-up (the dev server reloaded the page and cleared
it during the first run; I did not repeat it); a `Secure` cookie over real HTTPS (only set when
`NODE_ENV=production`); mobile/bearer flow in a real client; cross-browser; an automated browser E2E suite
(this run was manual and is not repeatable by CI).

## Security review outcome (summary; full detail in 02-security-review.md)

- scrypt was below OWASP minimum equivalents → raised, existing accounts keep working (rehash on next login).
- Rate limit could be bypassed by rotating emails → per-IP and per-account windows added.
- Cookie with bad percent-encoding caused a 500 → fixed (test written first, observed failing).
- Legacy-hash timing difference introduced by the upgrade → padded to equal work (reasoned, not measured statistically).
- Register still reveals existing emails (409) → documented, D9 open.

## Known limitations and remaining risks

- argon2id not adopted (D10); ~64 MiB per concurrent hash, not load-tested.
- Rate-limit counters are in memory and per process; `trust proxy` not configured (D11).
- Per-account window permits a limited lock-out of a victim's login by an attacker.
- Sessions are absolute-lifetime; no refresh/rotation or "revoke other sessions" (D8).
- Swagger UI needs a relaxed CSP; keep it off in production unless intended.
- Dev database contains test users from manual checks (`smoke-…@example.com`, `browser-check-1@example.com`).
- The e2e config raises `AUTH_RATE_LIMIT_IP/ACCOUNT` to 1000 so the suite can create many accounts from one
  address; the per-pair limit (5) is unchanged and the dedicated hardening spec tests the real windows with small values.
- Original SRS/DFD documents are **not** in the repository and were **not** reviewed; requirements stay as
  classified in `assumptions-and-pending-decisions.md` (D1–D16 unresolved, unchanged).

## Recommended next session

1. Owner decides how to land this work (the draft fork PR #1 is only a CI vehicle; no merge was done).
   Consider adding `feature/**` to the workflow's push triggers.
2. Decide D1/D2/D5/D9 with the product owner (email verification, reset, roles, enumeration policy).
3. Provide the SRS/DFD so requirements can be reconciled; then start the plant-care core
   (plants collection with ownership checks, care tasks and history). **Plant Management was not started.**
4. Before any deployment: D10/D11 (hashing, proxy, shared rate-limit store, HTTPS/`Secure` cookie test).
