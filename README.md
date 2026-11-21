# Leaf & Root

Leaf & Root is a graduation-project web app for plant identification, care guidance, routines, community, and a small marketplace.

The current repository is a React frontend prototype exported from Figma Make. Its pages and interactions demonstrate the intended product, but authentication, persistence, plant analysis, commerce, notifications, sensors, and the photo-submission API are not connected to production services yet.

## Stack

- React 19 and React Router 8
- TypeScript and Vite 8
- Tailwind CSS 4
- pnpm 10 on Node.js 22

## Run locally

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Vite serves the app at `http://localhost:8443` by default.

## Quality checks

```bash
pnpm check
```

This runs the TypeScript check and a production build. There is no automated test suite yet.

## Project map

- `src/main.tsx` mounts the React application.
- `src/App.tsx` defines the client-side routes.
- `src/pages/` contains page-level experiences.
- `src/components/` contains shared UI and homepage sections.
- `src/data/` contains the prototype's static content.
- `.figma/` contains the Figma Make runtime configuration.

## Contribution workflow

The canonical repository is [`yasminekamel219-maker/Leaf-and-Root`](https://github.com/yasminekamel219-maker/Leaf-and-Root).

Contributors without direct write access work from a fork. This project uses one long-lived `development` branch for active work:

1. Sync `development` with `upstream/main` before starting the next change.
2. Keep the next pull request focused and commit it to `development`.
3. Open a pull request from the fork's `development` branch to `upstream/main`.
4. After merge, sync the same branch again instead of creating another branch.

Do not commit secrets, generated builds, dependencies, or local agent/plugin state.
