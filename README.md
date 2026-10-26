# Popcorn Platform

پلتفرم وب و پنل مدیریت مجموعه **Popcorn Group** — رستوران‌های **ناکایا** و **ام کافه** (الهیه، میدان آقابزرگی، تهران) و **Izakaya** (میکا مال، کیش).

Website and admin platform for Popcorn Group's restaurants: public bilingual site, online table booking with deposit, waiter + QR ordering, customer club with behavior analytics, and full admin panel. Built with Claude Code.

## Status

Phase 0 — planning. No application code yet. Start with `claude` then `/phase 00`.

## Documents

| Document | Path |
| --- | --- |
| Full project plan (fa) — team, scoring, design, architecture, data model, RBAC, phases, risks | [`docs/project-plan.md`](docs/project-plan.md) |
| Engineering rules for Claude Code | [`CLAUDE.md`](CLAUDE.md) |
| Architecture Decision Records | [`docs/adr/`](docs/adr/) |
| Claude Code subagents (team roles) | [`.claude/agents/`](.claude/agents/) |
| Scorecard template (≥ 98/100 gate) | [`docs/scorecards/TEMPLATE.md`](docs/scorecards/TEMPLATE.md) |
| User stories | [`docs/stories/`](docs/stories/) |
| Execution phases for Claude Code (`/phase NN`, `/review`) | [`docs/phases/`](docs/phases/) |

## Releases

| Release | Scope | Target |
| --- | --- | --- |
| Release 1 | Public site, menus (3 brands), booking with deposit + SMS | end of week 9 |
| Release 2 | Waiter/QR ordering, payments (SEP), customer club + analytics, blog, Sepidz/Rahkaran sync | end of week 16 |

## Open items before Phase 0 closes

See section 11 of the plan. Blocking: Sepidz and Rahkaran API docs + test access, SEP Terminal ID, deposit amount and refund policy, loyalty rules, initial `charge_rules` values, vector logo files.
