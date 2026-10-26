# Popcorn Platform — Engineering Rules

Website + admin platform for Popcorn Group: **Nakaya** and **em. café** (Elahieh, Agha Bozorgi Sq., Tehran) and **Izakaya** (Mika Mall, Kish).
Full spec: `docs/project-plan.md`. Decisions: `docs/adr/`. Read both before any change.

## Stack

Next.js App Router · TypeScript strict · Tailwind · Drizzle · PostgreSQL · Redis/BullMQ · next-intl · Zod · Better Auth · Vitest · Playwright · Docker (self-hosted in Iran)

## Domain facts (do not re-decide)

- 3 brands (`brands`): nakaya, em-cafe, izakaya. 2 branches: Elahieh (nakaya + em-cafe, separate menus), Kish (izakaya).
- Staff (`staff_users`, password + RBAC) and customers (`customers`, SMS OTP) are separate entities.
- Orders are mostly entered by waiters. QR mode per branch/table: `menu_only` | `order`; both have "call waiter".
- No hard-coded tax/service/fees. `charge_rules` scoped to branch → category → item_group → item (most specific wins); manual `order_charges` need `orders:add_charge` + audit log. Kish is a free zone — never assume Tehran rates.
- Booking requires a registered customer with personal info; deposit is toggleable per branch; SMS confirmation always.
- Payment PSP: Saman Kish (SEP) behind `PaymentGateway` adapter.
- Sync: Sepidz (web ordering) and Rahkaran (finance) via separate adapters + outbox. Source of truth TBD — do not build sync before ADR 0011 is accepted.
- Existing logos/brand identities are kept. Headline font: Peyda (licensed); body: Vazirmatn; Latin display: Shippori Mincho. All self-hosted.

## Non-negotiables

- No `any`, no `@ts-ignore`, no `eslint-disable` without an ADR link.
- Money is BIGINT in IRR. Never float. Display in Toman via `formatToman()`.
- Time is `timestamptz` UTC. Display via `formatJalali()` in Asia/Tehran.
- Every user-facing string goes through next-intl (fa + en). No hard-coded text.
- Every Server Action: Zod parse → `requirePermission()` → service call → audit log.
- Modules never import another module's `server/` internals; use its public service.
- `domain/` is pure TypeScript: no Next.js, no DB, no I/O.
- Only design tokens for color, spacing, radius, font. No raw hex in components.
- Soft delete (`deleted_at`) for business entities; never hard-delete orders, bookings, payments.
- Functions ≤ 40 lines, files ≤ 300 lines; extract otherwise.
- No N+1: list queries use joins or batched loaders; check with EXPLAIN.
- Booking overlap is enforced by a PostgreSQL `EXCLUDE USING gist` constraint, not only app code.

## Layout

```
src/app/[locale]/(site)        public site
src/app/[locale]/(admin)/admin admin panel
src/app/t/[qrToken]            table QR
src/modules/<name>/{domain,server,ui,schema.ts}
src/shared/{ui,lib,auth,i18n,config}
```

Dependency rule: `app` → `modules/*/server` → `modules/*/domain`.

## Workflow

1. Read the story in `docs/stories/` and related ADRs.
2. Plan mode first for any change touching more than 2 files (use the `architect` agent).
3. Write domain tests first. Then implement. Then E2E (`qa-engineer`).
4. Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm e2e`
5. `security-reviewer` and `code-reviewer` run in a fresh session and write `docs/scorecards/<phase>/<pr>.md`.
6. Score < 98 → fix the listed deductions; do not argue the score.
7. New decision → new ADR in `docs/adr/` from `0000-template.md`.
8. Conventional Commits; one concern per commit.

## Definition of Done

CI green · coverage ≥ 90% in `domain` · axe 0 violations · Lighthouse ≥ 95 (mobile, public pages) · code-reviewer score ≥ 98 · security-reviewer: 0 High/Critical · CHANGELOG updated.
