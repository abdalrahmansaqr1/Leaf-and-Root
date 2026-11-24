# Leaf & Root

Leaf & Root is a graduation-project web app for plant identification, care guidance, routines, community, and a small marketplace.

The repository contains the Figma Make React frontend and the first backend vertical slice. Registration and login now use a real API, PostgreSQL persistence, password hashing, and server-side sessions. Plant data, analysis, commerce, notifications, sensors, and the photo-submission flow remain prototype-only.

## Stack

- React 19 and React Router 8
- TypeScript and Vite 8
- Tailwind CSS 4
- NestJS 12 and Prisma 7
- PostgreSQL 17
- pnpm 10 on Node.js 22

## Run locally

```bash
pnpm install --frozen-lockfile
docker compose up -d postgres
Copy-Item server/.env.example server/.env
pnpm --dir server db:deploy
pnpm --dir server prisma:generate
```

Run the API and web app in separate terminals:

```bash
pnpm dev:api
pnpm dev
```

Vite serves the app at `http://localhost:8443` and proxies `/api` to the Nest API at `http://localhost:3001`.

## Quality checks

```bash
pnpm check
```

This generates the Prisma client, runs backend unit tests, checks both TypeScript projects, and builds the web and API applications. With PostgreSQL running, also run the API integration suite:

```bash
pnpm --dir server test:e2e
```

## Project map

- `src/main.tsx` mounts the React application.
- `src/App.tsx` defines the client-side routes.
- `src/pages/` contains page-level experiences.
- `src/components/` contains shared UI and homepage sections.
- `src/data/` contains the prototype's static content.
- `server/src/` contains the Nest API and its tests.
- `server/prisma/` contains the database schema and migrations.
- `server/README.md` and `server/docs/` document the API (`/api/v1`, Swagger at `/api/docs`), architecture, and pending decisions.
- `compose.yaml` runs the local PostgreSQL service.
- `.figma/` contains the Figma Make runtime configuration.

## Contribution workflow

The canonical repository is [`yasminekamel219-maker/Leaf-and-Root`](https://github.com/yasminekamel219-maker/Leaf-and-Root).

Contributors without direct write access work from a fork. This project uses one long-lived `development` branch for active work:

1. Sync `development` with `upstream/main` before starting the next change.
2. Keep the next pull request focused and commit it to `development`.
3. Open a pull request from the fork's `development` branch to `upstream/main`.
4. After merge, sync the same branch again instead of creating another branch.

Do not commit secrets, generated builds, dependencies, or local agent/plugin state.
