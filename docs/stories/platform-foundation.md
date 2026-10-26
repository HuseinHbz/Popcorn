# Story: Platform foundation (Phase 0)

- Phase: 0 — Kickoff and infrastructure
- Plan reference: `docs/project-plan.md` §8 (Phase 0)

## Story

As the product owner,
I want a repository with an enforced toolchain, local services and a CI pipeline,
so that every later phase starts from green gates instead of setting them up ad hoc.

## Acceptance criteria

| #    | Given / When / Then                                                                                                                  | Verified by                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| AC1  | Given a visitor opens `/`, then they are redirected to `/fa`.                                                                        | `e2e/hello.spec.ts` — root redirect                             |
| AC2  | Given `/fa`, then `<html lang="fa" dir="rtl">`; given `/en`, then `lang="en" dir="ltr"`.                                             | `e2e/hello.spec.ts` — language and direction; `routing.test.ts` |
| AC3  | Given either locale, when the language link is used, then the other locale renders.                                                  | `e2e/hello.spec.ts` — switch language                           |
| AC4  | Every user-facing string comes from next-intl; fa and en catalogues have identical, non-empty keys.                                  | `messages.test.ts`                                              |
| AC5  | Both pages have 0 axe violations (WCAG 2.2 AA tags) on desktop and mobile viewports.                                                 | `e2e/hello.spec.ts` — axe                                       |
| AC6  | Lighthouse (mobile) ≥ 95 performance, 100 accessibility, ≥ 95 best practices and SEO.                                                | `lighthouserc.json` in CI                                       |
| AC7  | Responses carry CSP, `X-Frame-Options: DENY`, `nosniff`, HSTS, and no `X-Powered-By`.                                                | `e2e/hello.spec.ts` — security headers                          |
| AC8  | `any`, `@ts-ignore`, raw hex colours in `src/`, functions > 40 lines and files > 300 lines fail lint.                                | `eslint.config.mjs`                                             |
| AC9  | Non-conventional commit messages are rejected locally (Husky) and in CI.                                                             | `.husky/commit-msg`, CI `quality` job                           |
| AC10 | `docker compose up --wait` starts Postgres (with `btree_gist`), Redis and S3 storage, all password-protected and bound to 127.0.0.1. | CI `services` job                                               |
| AC11 | CI runs lint, format, typecheck, unit tests with coverage, build, E2E and Lighthouse on every push.                                  | `.github/workflows/ci.yml`                                      |

## Out of scope

- Nonce-based CSP without `'unsafe-inline'` — needs dynamic rendering trade-off; decided with auth in Phase 2.
- Design tokens pipeline (`tokens.json` → Tailwind), Peyda and Shippori Mincho — Phase 1.
- `formatToman()` / `formatJalali()`, env validation, database schema — Phase 2, where they are first used.
- Production Dockerfile, Nginx and deployment — Phase 5.

## Open questions

Blocking items for closing Phase 0 are the business questions in plan §11 (SEP Terminal ID, Sepidz/Rahkaran API access, deposit policy, loyalty rules, initial `charge_rules`, vector logos, Peyda licence scope).
