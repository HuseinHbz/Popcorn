# Story: Platform foundation (Phase 0)

- Phase: 0 — Kickoff and infrastructure
- Plan reference: `docs/project-plan.md` §8 (Phase 0)

## Story

As the product owner,
I want a repository with an enforced toolchain, local services and a CI pipeline,
so that every later phase starts from green gates instead of setting them up ad hoc.

## Acceptance criteria

| #    | Given / When / Then                                                                                                                                                                                                                                                                                         | Verified by                                                                                                     |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| AC1  | Given a visitor opens `/`, then they are redirected to `/fa`.                                                                                                                                                                                                                                               | `e2e/hello.spec.ts` — root redirect                                                                             |
| AC2  | Given `/fa`, then `<html lang="fa" dir="rtl">`; given `/en`, then `lang="en" dir="ltr"`.                                                                                                                                                                                                                    | `e2e/hello.spec.ts` — language and direction; `src/shared/i18n/routing.test.ts`                                 |
| AC3  | Given either locale, when the language link is used, then the URL, `lang`, `dir` and heading of the other locale are shown.                                                                                                                                                                                 | `e2e/hello.spec.ts` — switches to the other language                                                            |
| AC4  | Every user-facing string comes from next-intl; fa and en catalogues have identical, non-empty keys.                                                                                                                                                                                                         | `src/shared/i18n/messages.test.ts`                                                                              |
| AC5  | Both pages have 0 axe violations (WCAG 2.2 AA tags) on desktop and mobile viewports.                                                                                                                                                                                                                        | `e2e/hello.spec.ts` — axe                                                                                       |
| AC6  | Lighthouse (mobile, median of 5) ≥ 95 performance, 100 accessibility, ≥ 95 best practices and SEO on `/fa` and `/en`.                                                                                                                                                                                       | `lighthouserc.json` in CI; scores in the job summary                                                            |
| AC7  | Responses carry CSP (`default-src`, `object-src`, `base-uri`, `frame-ancestors` locked; no `unsafe-eval`), `X-Frame-Options: DENY`, `nosniff`, HSTS, Referrer-Policy, Permissions-Policy, COOP and CORP, and no `X-Powered-By`.                                                                             | `e2e/hello.spec.ts` — security headers                                                                          |
| AC8  | Lint fails on: `any`; `@ts-ignore`; inline `eslint-disable`; raw colours (hex or colour functions) in TS/TSX or in CSS outside `@theme`; functions > 40 lines; files > 300 lines; cross-module imports other than `server/index.ts`; packages, Node built-ins or I/O globals in `domain/` and `shared/lib`. | `tests/lint-rules.test.ts`, `tests/check-raw-colors.test.ts`                                                    |
| AC9  | Non-conventional commit messages are rejected by the commit-msg hook and in CI, for every commit a push adds.                                                                                                                                                                                               | `tests/commitlint.test.ts`; `.husky/commit-msg`; CI `quality` job                                               |
| AC10 | `docker compose up --wait` starts Postgres (with `btree_gist`), Redis and S3 storage. Every port binds to 127.0.0.1. Postgres and Redis reject wrong or missing passwords, S3 rejects anonymous access, and the app's database role is not a superuser and cannot create objects.                           | CI `services` job                                                                                               |
| AC11 | CI runs lint, format, typecheck, unit tests with coverage, build, E2E and Lighthouse on every push.                                                                                                                                                                                                         | `.github/workflows/ci.yml`                                                                                      |
| AC12 | The locale proxy runs for every page path (including slugs with dots) and skips API routes, Next internals, `/t/*` and static files.                                                                                                                                                                        | `src/proxy.test.ts`; `e2e/hello.spec.ts` — locale proxy                                                         |
| AC13 | CI fails on: High/Critical dependency advisories not in the risk register; any High/Critical in production dependencies; an accepted risk past its review date; a Node security release newer than `.nvmrc`; Semgrep findings; secrets in Git history. CI also runs weekly.                                 | CI `quality`, `freshness`, `sast` and `secrets` jobs; `tests/check-*.test.ts`; `docs/security/risk-register.md` |
| AC14 | Body text renders in self-hosted Vazirmatn: both subsets load and come before any fallback face.                                                                                                                                                                                                            | `e2e/hello.spec.ts` — renders text in self-hosted Vazirmatn                                                     |

## Out of scope

- Nonce-based CSP without `'unsafe-inline'` — needs the dynamic-rendering trade-off; decided with auth in Phase 2 and tracked in `docs/security/risk-register.md`.
- Design tokens pipeline (`tokens.json` → Tailwind), Peyda and Shippori Mincho — Phase 1.
- `formatToman()` / `formatJalali()`, env validation, Zod, database schema — Phase 2, where they are first used.
- Production Dockerfile, Nginx and deployment — Phase 5.

## Open questions

Blocking items for closing Phase 0 are the business questions in plan §11 (SEP Terminal ID, Sepidz/Rahkaran API access, deposit policy, loyalty rules, initial `charge_rules`, vector logos, Peyda licence scope).
