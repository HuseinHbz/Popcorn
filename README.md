# Popcorn Platform

پلتفرم وب و پنل مدیریت مجموعه **Popcorn Group** — رستوران‌های **ناکایا** و **ام کافه** (الهیه، میدان آقابزرگی، تهران) و **Izakaya** (میکا مال، کیش).

Website and admin platform for Popcorn Group's restaurants: public bilingual site, online table booking with deposit, waiter + QR ordering, customer club with behavior analytics, and full admin panel. Built with Claude Code.

## Status

Phase 0 — foundation: toolchain, local services, CI and a bilingual RTL hello page (in review). Work runs phase by phase: `claude`, then `/phase NN` ([`docs/phases/`](docs/phases/)); see [`docs/phases/phase-00.md`](docs/phases/phase-00.md) and [`docs/stories/platform-foundation.md`](docs/stories/platform-foundation.md).

## Local setup

Requirements: Node 22.23.4 (`.nvmrc`), pnpm 10.34.9 via `corepack enable`, Docker with Compose v2.

```bash
pnpm install                 # also installs Git hooks (Husky)
cp .env.example .env         # replace every "change-me"; the app refuses to start on an invalid env
docker compose up -d --wait  # Postgres 17 (+btree_gist), Redis 7, S3 storage (SeaweedFS)
pnpm dev                     # http://127.0.0.1:3000 → /fa (loopback only)
```

Behind restricted networks, point pnpm at a local npm mirror (`pnpm config set registry <mirror>`)
and Docker at a registry mirror (`registry-mirrors` in `/etc/docker/daemon.json`) — see ADR 0008.

| Command                            | What it checks                                                                                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm verify`                      | Everything below except E2E and Lighthouse: lint, format, typecheck, unit tests with coverage, production build. Run it before pushing.                       |
| `pnpm lint`                        | ESLint (`strictTypeChecked`, Next core-web-vitals, module boundaries, purity, token and i18n rules) with 0 warnings, plus the CSS raw-colour check (ADR 0015) |
| `pnpm format:check`                | Prettier                                                                                                                                                      |
| `pnpm typecheck`                   | `next typegen` + `tsc --noEmit` (strict, `noUncheckedIndexedAccess`)                                                                                          |
| `pnpm test` / `pnpm test:coverage` | Vitest: unit tests in `src/`, rule and tooling tests in `tests/`; ≥ 90% coverage on `domain/`, `shared/lib` and `shared/config`                               |
| `pnpm build && pnpm e2e`           | Production build; Playwright E2E + axe on desktop and mobile, including 404 pages and env validation                                                          |
| `pnpm lhci`                        | Lighthouse CI (mobile, 5 runs) on `/fa` and `/en`, after `pnpm build`                                                                                         |

| Service    | Address (127.0.0.1 only)                        |
| ---------- | ----------------------------------------------- |
| PostgreSQL | `127.0.0.1:5432`                                |
| Redis      | `127.0.0.1:6379`                                |
| S3 API     | `http://127.0.0.1:8333`, bucket `popcorn-media` |

CI (`.github/workflows/ci.yml`) runs on every push and weekly. It runs `pnpm verify`, E2E and Lighthouse, plus these gates:

- Conventional Commit checks;
- dependency audits (accepted risks only through the risk register);
- Semgrep and gitleaks;
- Compose service and auth checks, including an S3 round trip;
- Node and pnpm freshness (ADR 0016).

## Documents

| Document                                                                                      | Path                                                               |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Full project plan (fa) — team, scoring, design, architecture, data model, RBAC, phases, risks | [`docs/project-plan.md`](docs/project-plan.md)                     |
| Engineering rules for Claude Code                                                             | [`CLAUDE.md`](CLAUDE.md)                                           |
| Architecture Decision Records                                                                 | [`docs/adr/`](docs/adr/)                                           |
| Claude Code subagents (team roles)                                                            | [`.claude/agents/`](.claude/agents/)                               |
| Scorecard template (≥ 98/100 gate)                                                            | [`docs/scorecards/TEMPLATE.md`](docs/scorecards/TEMPLATE.md)       |
| User stories                                                                                  | [`docs/stories/`](docs/stories/)                                   |
| Security risk register (accepted risks, deferred controls)                                    | [`docs/security/risk-register.md`](docs/security/risk-register.md) |
| Execution phases for Claude Code (`/phase NN`, `/review`)                                     | [`docs/phases/`](docs/phases/)                                     |

## Releases

| Release   | Scope                                                                                     | Target         |
| --------- | ----------------------------------------------------------------------------------------- | -------------- |
| Release 1 | Public site, menus (3 brands), booking with deposit + SMS                                 | end of week 9  |
| Release 2 | Waiter/QR ordering, payments (SEP), customer club + analytics, blog, Sepidz/Rahkaran sync | end of week 16 |

## Open items before Phase 0 closes

See section 11 of the plan. Blocking: Sepidz and Rahkaran API docs + test access, SEP Terminal ID, deposit amount and refund policy, loyalty rules, initial `charge_rules` values, vector logo files.
