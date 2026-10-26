# ADR 0014: Toolchain baseline for Phase 0

- Status: Accepted
- Date: 2026-10-26
- Score: pending independent review (rubric: docs/project-plan.md §3)

## Context

The plan fixes the stack (ADR 0001–0003) but not versions. Several latest majors are incompatible with
each other as of today, and Next.js 16 changed conventions the team must follow.

## Options considered

- Latest of everything: TypeScript 7 and ESLint 10 — rejected: `typescript-eslint` supports
  TypeScript `<6.1` and `eslint-config-next` plugins (`react`, `import`, `jsx-a11y`) support ESLint ≤ 9.
- Older Next.js 15 — rejected: no reason to start a new codebase on the previous major.
- **Chosen:** Next.js 16.4 · React 19.3 · TypeScript 6.0 · ESLint 9.39 (flat config, `strictTypeChecked`)
  · Tailwind 4.3 · next-intl 4.14 · Zod 4 · Vitest 5 · Playwright 1.63 · pnpm 10 · Node 22 LTS.

## Decision

- Exact versions are pinned (`.npmrc` `save-exact`); upgrades are explicit commits.
- Next.js 16 conventions: `src/proxy.ts` (not `middleware.ts`); locale read via `next/root-params`
  (next-intl's `setRequestLocale`/`requestLocale` are deprecated); `next typegen` runs before `tsc`.
- Fonts are self-hosted through `next/font/local` (preloaded, size-adjusted fallback) from OFL npm packages.
- Tailwind's default colour palette is disabled; only brand tokens exist (`src/app/globals.css`).
- Lint enforces CLAUDE.md non-negotiables mechanically: no `any`/`@ts-ignore`, no raw hex in `src/`,
  ≤ 40 lines per function, ≤ 300 lines per file, pure `domain/`, no deep imports of another module's `server/`.

## Consequences

Gates are enforced by tools, not by review memory. Upgrading to TypeScript 7 / ESLint 10 waits on the
lint ecosystem.

## Revisit when

`typescript-eslint` supports TypeScript 7 and `eslint-config-next` supports ESLint 10.
