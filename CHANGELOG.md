# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/) and Conventional Commits.

## [Unreleased]

### Added

- Phase 0 foundation: Next.js 16 + strict TypeScript app with next-intl (fa default at `/fa`, en at `/en`), RTL-aware layout, bilingual hello page, one localized, accessible 404 for every unknown path, rendered on the server (complete without JavaScript) and never cached (`global-not-found.tsx`, ADR 0018).
- Module skeleton for the ten plan modules (`domain`, `server`, `ui` entries) and `shared/auth`; `pnpm verify` (lint, format, typecheck, tests with coverage, build).
- `src/shared/config/env.ts`: Zod-validated environment; the server refuses to start on an invalid env and never prints values; `APP_ENV` is required, and production rejects placeholders in any spelling or encoding, short service passwords and S3 secrets, and plain http to a remote S3 endpoint.
- `src/shared/lib`: `toPersianDigits`, `formatToman` (BIGINT Rial → grouped Toman) and `formatJalali` (Persian calendar, Asia/Tehran), at 100% coverage.
- Fonts: self-hosted static Vazirmatn subsets and Shippori Mincho (Latin display) with checksums and `unicode-range`, so Persian pages never download Shippori; a `--font-heading-fa` slot for Peyda (ADR 0017).
- Enforced engineering rules (ADR 0015): module boundaries (`eslint-plugin-boundaries`), pure `domain/` and `shared/lib` (no packages, I/O, clock or randomness), tokens only (no raw or named colours, no Tailwind arbitrary values or properties, no inline spacing, radius or font values, branches included), user-facing text only through next-intl (wrapped, conditional, child and button text included), no `eval` or raw HTML (`dangerouslySetInnerHTML` in any form, `srcDoc`), no inline disables, size limits; every rule proven line by line by fixture tests.
- Tooling: pnpm 10.34.9 pinned by tarball hash and installed with Corepack, exact pins, `strictDepBuilds` and a 24-hour minimum release age; Node 22.23.4; Prettier, Husky + lint-staged + commitlint; Vitest; Playwright + axe; Lighthouse CI.
- Local services via `docker-compose.dev.yml`: Postgres 17 (`btree_gist`, least-privilege `popcorn_app` role), Redis 7 (password kept out of argv), SeaweedFS S3 (telemetry and extra services off, on its own network); all digest-pinned and bound to 127.0.0.1.
- CI (ADR 0016): commit-message and audit gates, `pnpm verify`, E2E, Lighthouse asserted on the median of 5 runs with a score summary, Semgrep and gitleaks (pinned configuration, no inline suppressions, exceptions only with a written reason), Compose auth and isolation checks and an S3 round trip, freshness checks (on every push and weekly) for Node security releases and end of life, pnpm advisories (Moderate and up) and the risk register, with positive controls on known-bad pins; actions and images pinned by SHA/digest; Dependabot with cooldown.
- `.github/CODEOWNERS` for the security and supply-chain controls.
- Security headers: CSP baseline, HSTS, frame denial, nosniff, Referrer-Policy, Permissions-Policy, COOP, CORP.
- Docs: story `platform-foundation`, ADRs 0013–0018 (proposed), security risk register, Phase 0 scorecards and responses.

### Changed

- ADR 0008: amendment proposed in ADR 0013 (MinIO community images are discontinued; local S3 would be SeaweedFS).
- Merged the maintainer's execution phases (`docs/phases/`, `/phase` and `/review` commands).

### Earlier

- Project plan, CLAUDE.md engineering rules, ADRs 0001–0012, Claude Code subagents, scorecard template.
