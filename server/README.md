# Leaf & Root API

NestJS 12 · Prisma 7 · PostgreSQL 17 · REST under `/api/v1` · OpenAPI at `/api/docs`.

> The brief suggested `backend/`; the repository already had a wired-up `server/` app, so this
> session extended it. See [docs/01-repository-assessment.md](docs/01-repository-assessment.md).

## Run locally

Prerequisites: Node 22+, pnpm 10, Docker.

```powershell
pnpm install --frozen-lockfile            # from the repository root
docker compose up -d postgres             # from the repository root; PostgreSQL on localhost:5434
Copy-Item server/.env.example server/.env
pnpm --dir server db:deploy               # apply migrations
pnpm --dir server prisma:generate         # generate the Prisma client
pnpm dev:api                              # API on http://localhost:3001
pnpm dev                                  # web on http://localhost:8443, proxies /api to the API
```

Useful URLs: `GET /api/v1/health` · Swagger UI `/api/docs` · OpenAPI JSON `/api/docs-json`.

## Configuration

Validated at boot by [`src/config/env.ts`](src/config/env.ts). The app refuses to start with a clear
message (key names only, never values) if anything is invalid. See [`.env.example`](.env.example).

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | required | PostgreSQL connection string |
| `API_PORT` | `3001` | Listen port |
| `NODE_ENV` | `development` | `production` enables `Secure` cookies and disables Swagger by default |
| `LOG_LEVEL` | `info` | pino level |
| `SESSION_TTL_DAYS` | `30` | Session lifetime |
| `CORS_ALLOWED_ORIGINS` | empty (CORS off) | Comma-separated origins; no wildcards |
| `SWAGGER_ENABLED` | on outside production | Serve `/api/docs` |
| `TEST_DATABASE_URL` | `<DATABASE_URL db>_test` | Isolated integration-test database |

## Database and migrations

```powershell
pnpm --dir server db:migrate     # create + apply a new migration in development (prisma migrate dev)
pnpm --dir server db:deploy      # apply committed migrations (prisma migrate deploy)
```

Migrations live in [`prisma/migrations`](prisma/migrations): `init` (User, Session) and
`add_user_role` (`UserRole` enum + `User.role`, default `USER`). Never run `db:migrate` against a
shared or production database.

## Tests

```powershell
pnpm --dir server test        # unit tests, no database needed
pnpm --dir server test:e2e    # integration tests against PostgreSQL (docker compose up -d postgres first)
pnpm check                    # root: generate, unit, typecheck (web + api), build (web + api)
```

`test:e2e` uses a separate database. It is created and migrated automatically, and the harness
refuses any database that is not local or whose name does not end in `_test`
([`src/test/test-database.ts`](src/test/test-database.ts)). Your development data is never touched.

## Layout

```
src/
  config/      env validation
  logging/     pino options + redaction
  common/      error filter, Zod body parsing, OpenAPI helpers
  prisma/      PrismaService (global)
  auth/        register / login / logout / me, scrypt, session tokens, SessionAuthGuard
  users/       GET/PATCH /users/me
  test/        test database + HTTP helpers
prisma/        schema + migrations
docs/          architecture, API contracts, assumptions, handoff
```

## More

[architecture](docs/architecture.md) · [API contracts](docs/api-contracts.md) ·
[assumptions & pending decisions](docs/assumptions-and-pending-decisions.md) ·
[session 1 handoff](docs/session-01-handoff.md)
