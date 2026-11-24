# Architecture

## Shape: modular monolith

One deployable NestJS app. Each business area is a Nest module with its own controller, service and
schemas; modules talk through exported services, never through each other's tables.

```
AppModule
├─ LoggerModule (nestjs-pino)     structured, redacted logs
├─ ThrottlerModule + AuthThrottlerGuard   global rate limit
├─ PrismaModule (global)          the only database access point
├─ AuthModule                     register · login · logout · me · SessionAuthGuard
├─ UsersModule  ──imports──▶ AuthModule   profile read/update
└─ HealthController               liveness + DB probe
```

Future areas (plants, care tasks, marketplace, …) become new modules that import `AuthModule` for
`SessionAuthGuard` / `@CurrentUser()` and use `PrismaService`.

## Request pipeline

`security headers + CSRF (Fetch Metadata)` → `CORS (allowlist)` → `body parser` → `throttler` →
`SessionAuthGuard` (protected routes) → controller → Zod `parseBody` → service → Prisma →
`ApiExceptionFilter` shapes every error. A final fallback returns the same JSON envelope for paths
outside `/api/v1` (Nest only mounts its 404 handler under the global prefix).

## Authentication and session strategy

**Chosen:** server-side opaque sessions stored in PostgreSQL.

- On register/login the server creates 32 random bytes (`base64url`) and stores only its
  **SHA-256 hash** in `Session.tokenHash` with `expiresAt` (default 30 days, absolute).
- **Web:** token is delivered as an `HttpOnly; SameSite=Lax` cookie (`Secure` in production). JS cannot read it.
- **Flutter/native:** send `X-Auth-Transport: bearer` on register/login to receive the same token in the
  JSON body, then send `Authorization: Bearer <token>`. No cookie is set in that mode.
- `SessionAuthGuard` accepts either transport. `Authorization` wins over a stale cookie.
- **Logout** deletes the session row, so the token is dead immediately. Other devices' sessions survive.
- **Expiry** is enforced in the lookup query (`expiresAt > now`); expired rows for a user are swept on that user's next login.

### Trade-offs (why not JWT)

| | Opaque DB session (chosen) | Stateless JWT |
|---|---|---|
| Real logout / revocation | Immediate | Needs a deny-list or short TTL + refresh rotation |
| Per-request cost | One indexed DB lookup | None |
| Leaked token | Revoke by deleting the row | Valid until expiry |
| Complexity | Low | Refresh flow, key rotation, token storage rules |
| Scale-out | Shared DB (already required) | Easier cross-service verification |

At this stage "actual logout invalidation" and simplicity outweigh the per-request lookup. If a
separate service later needs to verify identity without the DB, introduce short-lived JWTs minted
from a session at that point (see pending decisions).

Known costs: the bearer token is long-lived (30 days) and lives in device storage (use the platform
secure store); there is no refresh/rotation and no "list/revoke my other sessions" endpoint yet.

## Passwords

Node `crypto.scrypt` (N=16384, r=8, p=1, 16-byte random salt, 64-byte key), stored as
`scrypt$N$r$p$salt$key`, verified with `timingSafeEqual`. Login runs a dummy hash for unknown emails
so response time does not reveal which emails exist. **Limitation:** N=16384 is below the current
OWASP scrypt guidance (N=2^17); migrating to argon2id (or raising cost) with rehash-on-login is
recorded as pending.

## Security controls

- Strict Zod schemas (`.strict()`): unknown fields (e.g. `role`) are rejected with 422.
- `role` is stored but never selectable by clients (`publicUserSelect` omits it) nor writable via the API.
- Rate limits: 5 attempts / 15 min per `email|ip` on register and login; 100 req/min per IP globally; health exempt.
- Security headers (Nest `useSecurityHeaders`, helmet-8 defaults); CSP is relaxed for Swagger only while Swagger is enabled.
- CSRF: Fetch-Metadata check on state-changing requests; allowlisted CORS origins are trusted; non-browser clients unaffected.
- CORS: explicit allowlist, credentials on, no wildcard (rejected at config validation).
- Logging: request/response serializers keep method, path (no query string) and status only; redaction of `authorization`, `cookie`, `set-cookie`, `password*`, `token*` at root and one level down.
- Errors: one envelope `{ "error": { "code", "message", "details?" } }`; 5xx messages are generic and the stack goes to the log only.

## Data model

```
User(id uuid pk, email unique ≤254, passwordHash, name ≤80, role USER|ADMIN default USER, createdAt, updatedAt)
Session(id uuid pk, tokenHash char(64) unique, userId → User cascade, expiresAt, createdAt)   idx: userId, expiresAt
```

Emails are lower-cased and trimmed before storage, so uniqueness is case-insensitive.

## Testing strategy

Unit tests (no DB): password hashing, token hashing, Zod schemas, env validation, log redaction,
token extraction, test-database safety. Integration tests (real PostgreSQL, isolated `*_test`
database, real HTTP via `fetch` against a listening app): every endpoint, persistence assertions by
querying Prisma directly, expiry by rewriting `expiresAt`, logout invalidation, throttling, CORS, CSRF,
OpenAPI contents.
