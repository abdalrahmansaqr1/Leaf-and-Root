# API contracts (v1)

Base path `/api/v1`. The authoritative, machine-readable contract is the OpenAPI document served at
`/api/docs-json` (UI at `/api/docs`); this page is the human summary. Request bodies are JSON.

## Conventions

- Success: `{ "data": { ... } }` (204 has no body).
- Error: `{ "error": { "code": "STRING", "message": "text", "details": [...]? } }`.
- Auth: browsers use the `leaf_root_session` HttpOnly cookie; native clients send
  `Authorization: Bearer <token>` (obtain it by sending `X-Auth-Transport: bearer` to register/login).
- Timestamps are ISO-8601 UTC. IDs are UUIDs.

`User` (public): `{ id, email, name, createdAt, updatedAt }`. `role` and `passwordHash` never appear.

| Status | `code` | When |
|---|---|---|
| 400 | `BAD_REQUEST` | Malformed JSON |
| 401 | `UNAUTHORIZED` | Missing/invalid/expired session, or wrong login credentials |
| 403 | `FORBIDDEN` | Blocked cross-site request (CSRF) |
| 404 | `NOT_FOUND` | Unknown route |
| 409 | `EMAIL_IN_USE` | Registering an existing email |
| 422 | `VALIDATION_ERROR` | Body fails validation; `details` holds Zod issues |
| 429 | `RATE_LIMITED` | Throttled |
| 503 | `DATABASE_UNAVAILABLE` | Health check cannot reach PostgreSQL |
| 500 | `INTERNAL_ERROR` | Unexpected; generic message |

## Endpoints

### `GET /health` — public
`200 { "data": { "status": "ok", "database": "up" } }` · `503` when the DB is unreachable.

Register and login share three 15-minute windows: 5 per email+IP, `AUTH_RATE_LIMIT_IP` (default 20) per
IP, and `AUTH_RATE_LIMIT_ACCOUNT` (default 30) per email. Exceeding any returns `429 RATE_LIMITED`.
See [02-security-review.md](02-security-review.md).

### `POST /auth/register` — public, rate-limited (see above)
Body: `{ "email": string (valid, ≤254), "password": string (10–128), "name": string (2–80, trimmed) }`.
Unknown fields → 422. Email is lower-cased.
- `201 { data: { user } }` + `Set-Cookie: leaf_root_session=…; HttpOnly; SameSite=Lax; Expires=…`
- With `X-Auth-Transport: bearer`: `201 { data: { user, token, expiresAt } }`, no cookie.
- `409 EMAIL_IN_USE` · `422` · `429`

### `POST /auth/login` — public, rate-limited (see above)
Body: `{ "email", "password" }`.
- `200` same shapes as register (cookie or bearer).
- `401` identical body for unknown email and wrong password · `422` · `429`

### `GET /auth/me` — authenticated
`200 { data: { user } }` · `401`.

### `POST /auth/logout` — idempotent
Deletes the presented session and clears the cookie. `204` always (also without credentials).

### `GET /users/me` — authenticated
`200 { data: { user } }` · `401`.

### `PATCH /users/me` — authenticated
Body: `{ "name": string (2–80) }` — **the only editable field**. `email`, `password`, `role`, `id`, or
any other field → `422`; empty body → `422`. `200 { data: { user } }` · `401`.

## Compatibility notes for clients

- The web app calls these through the Vite proxy (`/api` → `localhost:3001`), same-origin, so cookies just work.
- Cross-origin browsers need their origin in `CORS_ALLOWED_ORIGINS` and `credentials: "include"`.
- Mobile: store the bearer token in the OS secure store; send `X-Auth-Transport: bearer` only on register/login.
- The legacy unversioned `/api/auth/*` routes no longer exist (the only in-repo caller, `AuthPages.tsx`, was updated).
- Not yet in the API: `/api/photo-submissions` (called by `PlantCareAiPage.tsx`; still prototype-only).
