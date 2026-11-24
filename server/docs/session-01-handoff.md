# Session 1 handoff — backend foundation & authentication

Date: 2026-11-24 · Branch `development` · **Nothing committed, pushed or deployed.**

## What was implemented

Extended the existing `server/` app (see the assessment for why not `backend/`):

- **Foundation:** validated env config; `/api/v1` prefix; `GET /health` with a real DB probe; consistent
  error envelope (incl. JSON 404 outside the prefix); pino logging with redaction; CORS allowlist;
  security headers + CSRF; auth rate limits; Swagger/OpenAPI; isolated test database harness; `.env.example`.
- **Auth:** register, login, logout, `GET /auth/me`; cookie sessions for web and bearer transport for native clients.
- **Users:** `GET` and `PATCH /users/me` (name only).
- **Data:** migration `add_user_role` (`UserRole` enum, `User.role` default `USER`).
- **Frontend (one line):** `src/pages/AuthPages.tsx` now calls `/api/v1/auth/*`.

## Files

Created: `server/src/config/{env.ts,env.spec.ts}` · `server/src/logging/{logger.config.ts,logger.config.spec.ts}` ·
`server/src/auth/{session-auth.guard.ts,session-auth.guard.spec.ts}` ·
`server/src/users/{users.module.ts,users.controller.ts,users.service.ts,users.schemas.ts,users.e2e-spec.ts}` ·
`server/src/common/openapi.ts` · `server/src/swagger.ts` · `server/src/app.e2e-spec.ts` ·
`server/src/test/{test-database.ts,test-database.spec.ts,global-setup.ts,http.ts}` ·
`server/prisma/migrations/20261123225325_add_user_role/` · `server/README.md` · `server/docs/*` (5 files).

Modified: `server/prisma/schema.prisma` · `server/src/{create-app,main,app.module,health.controller}.ts` ·
`server/src/prisma/prisma.service.ts` · `server/src/common/api-exception.filter.ts` ·
`server/src/auth/{auth.controller,auth.service,auth.module,auth.e2e-spec}.ts` ·
`server/{.env.example,vitest.e2e.config.ts,tsconfig.build.json,package.json}` ·
`src/pages/AuthPages.tsx` · `pnpm-lock.yaml` · root `README.md`.
New dependencies: `@nestjs/swagger`, `nestjs-pino`, `pino`, `pino-http`, dev `@types/pg`.

Pre-existing uncommitted work in the tree (not mine): `server/` baseline, `compose.yaml`, `pnpm-workspace.yaml`,
`vite.config.ts` proxy, the original `AuthPages.tsx` API wiring.

## How to run

See [../README.md](../README.md). Short form: `docker compose up -d postgres`, copy `server/.env.example`
to `server/.env`, `pnpm --dir server db:deploy`, `pnpm dev:api`.

## Verification (actual results, run 2026-11-24 on Windows, Node 24, PostgreSQL 17 in Docker)

| Check | Result |
|---|---|
| `tsc --noEmit` (server) | clean |
| Unit tests `pnpm --dir server test` | **26 passed / 26** (7 files) |
| Integration tests `pnpm --dir server test:e2e` (isolated `leaf_and_root_test`) | **43 passed / 43** (3 files) |
| `pnpm check` (generate, unit, typecheck web + api, build web + api) | passed |
| Migrations | `prisma migrate status`: 2 migrations, "Database schema is up to date"; both applied to a freshly created test DB by the harness |
| Real server start (`node dist/main.js`) + curl | health 200 `database: up`; register 201 with HttpOnly cookie; `/users/me` unauthenticated 401; `/api/docs` 200 |
| Swagger UI in a browser | renders all 6 endpoints, no console errors |
| Log scan after real requests | no password or session token in the log |

Integration coverage maps to the brief: registration success/duplicate/invalid, password hashing and
verification, valid/invalid login, unauthorized access, profile read/update and ownership, logout
invalidation, expiry, bearer transport, throttling, CORS, CSRF, OpenAPI contents, DB persistence.

Defects found by the tests and fixed: log redaction missed root-level `password`/`token` keys;
unknown routes outside `/api/v1` returned Express HTML instead of the JSON envelope.

## Security decisions
Opaque hashed sessions, HttpOnly cookies, strict schemas, no client-assignable role, constant-ish-time login,
generic 401, redacted logs, CORS allowlist, CSRF, rate limits, isolated test DB with safety guards. Details in `architecture.md`.

## Known limitations
- scrypt cost (N=16384) is below current OWASP guidance; argon2id migration pending.
- `POST /auth/register` reveals whether an email exists (409).
- Rate limiting keys on the socket IP; behind a proxy this needs `trust proxy` (deployment decision).
- Sessions are absolute-lifetime, no refresh/rotation, no "revoke other sessions".
- CI does not run `test:e2e` (no PostgreSQL service in `.github/workflows/ci.yml`).
- Swagger UI needs a relaxed CSP; keep Swagger disabled in production unless intended.
- The dev database contains one smoke-test user (`smoke-…@example.com`) created by the manual curl check.
- Not tested: behaviour under concurrent load; real browser login through the React pages (only the API and Swagger UI were exercised in a browser).

## Pending requirements
See `assumptions-and-pending-decisions.md` (D1–D16).

## Recommended next session
1. Review + commit this work (with the original baseline) and add a Postgres service to CI so `test:e2e` gates PRs (D15).
2. Browser E2E of the actual login/sign-up pages against the running API.
3. Decide D1/D2/D5 (email verification, password reset, roles) with the product owner.
4. Then the plant-care core per the backlog: plants collection with ownership checks, care tasks + history.
