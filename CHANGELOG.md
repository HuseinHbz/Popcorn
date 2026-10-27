# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/) and Conventional Commits.

## [Unreleased]

### Added

- Phase 0 foundation: Next.js 16 + strict TypeScript app with next-intl (fa default at `/fa`, en at `/en`), RTL-aware layout, bilingual hello page, self-hosted Vazirmatn.
- Enforced engineering rules: ESLint flat config with module boundaries (`eslint-plugin-boundaries`), no inline disables, raw-colour bans in TS and CSS, function and file length limits; each rule proven by fixture tests.
- Tooling: pnpm with exact pins and a 24-hour minimum release age, Prettier, Husky + lint-staged + commitlint, Vitest with 90% coverage thresholds, Playwright + axe, Lighthouse CI.
- Local services via Docker Compose: Postgres 17 (`btree_gist`, least-privilege `popcorn_app` role), Redis 7, SeaweedFS S3, all digest-pinned and bound to 127.0.0.1.
- CI: quality (commitlint, audit, lint, format, typecheck, tests), Semgrep SAST, gitleaks, build + E2E + Lighthouse, Compose service and auth checks; actions pinned by SHA; Dependabot.
- Security headers: CSP baseline, HSTS, frame denial, nosniff, Referrer-Policy, Permissions-Policy, COOP, CORP.
- Docs: story `platform-foundation`, ADR 0013 (SeaweedFS for local S3), ADR 0014 (toolchain and rule enforcement), security risk register, Phase 0 scorecards.

### Changed

- ADR 0008 amended by ADR 0013 (MinIO community images are discontinued).

### Earlier

- Project plan, CLAUDE.md engineering rules, ADRs 0001–0012, Claude Code subagents, scorecard template.
