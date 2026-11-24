# Requirements traceability

Last updated: Session 2 (2026-11-24). **The original SRS and DFD files are not in the repository and have
not been reviewed.** "Source" therefore names where a statement comes from; where it says
"per brief" the product owner stated it in chat and the SRS section/figure is **still to be cited**.

Status values: **Implemented** (code + tests, evidence cited) · **Per brief — not implemented** ·
**Pending decision** · **Out of scope (separate capability)**.

## A. Authentication and account (Session 1)

| Req | Statement | Source | Implementation | Verification | Status |
|---|---|---|---|---|---|
| REQ-AU-01 | Register with name, email, password | Session 1 brief; sign-up form fields | `POST /auth/register` | e2e `auth.e2e-spec.ts` (CI run 45311513292) | Implemented |
| REQ-AU-02 | Login | Session 1 brief | `POST /auth/login` | e2e | Implemented |
| REQ-AU-03 | Logout | Session 1 brief | `POST /auth/logout` | e2e | Implemented |
| REQ-AU-04 | Retrieve current user | Session 1 brief | `GET /auth/me`, `GET /users/me` | e2e | Implemented |
| REQ-AU-05 | View/update basic profile (name only) | Session 1 brief; email change deferred | `PATCH /users/me` | e2e `users.e2e-spec.ts` | Implemented |
| REQ-AU-06 | Users cannot assign privileged roles | Session 1 brief | `role` not exposed or writable | e2e (422 on `role`) | Implemented |
| REQ-AU-07 | Email verification, password reset, OAuth, subscriptions, advanced RBAC | Session 1 brief: explicitly deferred | — | — | Pending decisions D1, D2, D3, D5, D6 |

## B. Plant Management (reviewed in session 2; nothing implemented)

| Req | Statement | Source | Planned endpoint (proposal) | Planned verification | Status |
|---|---|---|---|---|---|
| REQ-PL-01 | Add a plant with basic information | Per brief; SRS citation pending | `POST /plants` | 04-doc §6 tests 1–2, 11 | Per brief — not implemented. Fields `name` (required), `species`/`location`/`notes` (optional) **provisionally accepted** as an engineering assumption; final product-owner confirmation pending. **Next to implement** |
| REQ-PL-02 | View the user's plants | Per brief; SRS citation pending | `GET /plants` | tests 3, 9 | Per brief — not implemented |
| REQ-PL-03 | View plant details | Per brief; SRS citation pending | `GET /plants/:id` | tests 4–6, 9 | Per brief — not implemented |
| REQ-PL-04 | Edit plant information | Per brief; SRS citation pending | `PATCH /plants/:id` | tests 5, 7, 9 | Per brief — not implemented |
| REQ-PL-05 | Delete a plant | Per brief; SRS citation pending | `DELETE /plants/:id` | tests 5, 8, 9 | Per brief — not implemented. **Blocked**: hard vs soft deletion not approved (PM-6) |
| REQ-PL-06 | Users see/modify only their own plants | Engineering proposal (security baseline), consistent with REQ-AU-06 | Scoped queries, uniform 404 | tests 5, 10, 11 | Proposal — needs confirmation |

Frontend-only statements (**not** requirements): "Free for up to 10 plants" (`src/pages/AuthPages.tsx:228`),
sample `PlantSpecimen` fields and values (`src/types/index.ts`, `src/data/siteData.ts`), status/next-action text.

## C. Capabilities the brief lists as separate (not defined by this work)

| Capability | Status |
|---|---|
| AI plant analysis / identification | Out of scope (D14, D12) |
| IoT monitoring, device-to-plant mapping | Out of scope (D14, PM-8) |
| Chatbot | Out of scope |
| Marketplace | Out of scope (D13) |
| Community | Out of scope (D13) |
| Notifications and reminders | Out of scope (D16, PM-7) |
| Care scheduling and history | Undefined in requirements (PM-3, PM-4) |
| Plant photo storage and moderation | Undefined in requirements (PM-5, D12) |
| Species catalogue | Undefined in requirements (PM-2) |
| Deletion retention | Undefined in requirements (PM-6, D7) |

## D. Decision ledger

Open items stay in [assumptions-and-pending-decisions.md](assumptions-and-pending-decisions.md);
the Plant Management items PM-1…PM-8 are reviewed in
[04-plant-management-decision-review.md](04-plant-management-decision-review.md). **Resolved so far:**

| ID | Decision | Resolution | Evidence |
|---|---|---|---|
| D15 | CI runs PostgreSQL integration tests | Resolved on the feature branch (new `api-integration` job) | GitHub Actions run 45311513292, head `799da46`: `check` pass (30/30 unit tests), `API integration tests (PostgreSQL)` pass (51/51 e2e). Earlier failure of `check` (missing `DATABASE_URL` for `prisma generate`) fixed in `14f2ea7`. Fork PR #1 is still an unmerged draft, so **upstream `main`/`development` do not run this job until the work is merged.** |
