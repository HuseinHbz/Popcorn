# ADR 0014: Toolchain baseline and how the engineering rules are enforced

- Status: Proposed
- Date: 2026-10-27
- Score: pending independent review (rubric: docs/project-plan.md §3)

## Context

ADRs 0001–0003 fix the stack, but not its versions or how the CLAUDE.md non-negotiables are
enforced. Two problems surfaced in Phase 0:

1. **Latest majors do not fit together.** TypeScript 7.0 and ESLint 10 are out, but
   `typescript-eslint` 8.72 supports TypeScript `<6.1`, and `eslint-config-next` 16.4 depends
   on plugins that support ESLint `≤9`. Next.js 16 also changed conventions: `middleware.ts`
   became `proxy.ts`, and next-intl deprecated `setRequestLocale` in favour of `next/root-params`.
2. **Rules enforced by review alone get missed.** "No raw hex", "≤ 40 lines per function",
   "domain is pure" and "never import another module's internals" need machine checks, or every
   review has to re-find them.

Iran constraints (ADR 0008): CI and installs will run behind local npm and Docker mirrors,
foreign services may be unreachable, and supply-chain attacks against npm are a real risk for a
system handling payments.

## Options considered

**Versions**

- **A. Latest of everything** (TypeScript 7, ESLint 10). Rejected: typed lint rules would not run.
- **B. Previous Next.js major (15)** for maturity. Rejected: a new codebase would start on a
  superseded major and need a migration within months.
- **C. Newest versions that work together, pinned exactly.** Chosen.

**Enforcing the rules**

- **A. Code review only.** Cheap, but it is exactly what plan §3 calls unreliable.
- **B. ESLint `no-restricted-imports` path patterns.** Tried first. They cannot tell "my module"
  from "another module", and relative paths bypassed them (found in review).
- **C. `eslint-plugin-boundaries`, plus `noInlineConfig` and small custom checks, with tests
  proving each rule fires.** Chosen.

## Decision

**Versions** (exact pins via `.npmrc` `save-exact`; upgrades are explicit PRs from Dependabot):
Next.js 16.4 · React 19.3 · TypeScript 6.0 · ESLint 9.39 (flat config, `strictTypeChecked`) ·
Tailwind 4.3 · next-intl 4.14 · Vitest 5 · Playwright 1.63 · pnpm 10.28 · Node 22.22.1
(`.nvmrc` exact, `engines >=22.22.1` because `lint-staged` requires it). `engine-strict` stays
off: it applies to every transitive dependency and would block installs over patch versions.
Zod and other runtime libraries are added in the phase that first uses them.

**Next.js 16 conventions:** `src/proxy.ts` handles locale routing. The locale is read through
`next/root-params`. `next typegen` runs before `tsc` and ESLint, so route types exist on a fresh
checkout.

**Fonts:** static 400/700 WOFF2 subsets (Latin and Arabic script) are vendored under
`src/shared/ui/fonts/files` with their OFL licence, and loaded with `next/font/local`
(preloaded). The variable font was measured first. On Lighthouse's throttled mobile profile,
shaping Persian text with it cost about 270 ms of layout, against about 30 ms with static weights,
and dropped `/fa` to 0.79–0.95. Static weights put all 12 runs at 0.95–0.99. A weight is added only
when a design uses it. `adjustFontFallback` is off: Next's generated
`local("Arial")` fallback has no `unicode-range`, so it would render Persian text in Arial
before the Arabic-script subset was tried. An E2E test asserts the font stack and that the faces
load.

**Rule enforcement** (each rule is proven by `tests/lint-rules.test.ts` against fixtures):

- `linterOptions.noInlineConfig`: inline `eslint-disable` is ignored and reported. An exception
  is an override in `eslint.config.mjs` with an ADR link. This is stricter than CLAUDE.md's
  "no `eslint-disable` without an ADR link" and implements it.
- `eslint-plugin-boundaries` with `checkAllOrigins`:
  - Module layers may only import their own module's internals.
  - Other modules are reachable only through `server/index.ts`.
  - `app` never imports `domain` directly.
  - `domain/` and `shared/lib` may import no package and no Node built-in.
  - I/O globals (`fetch`, `process`, `window`, …) are banned in pure code.
- No raw colours: hex and colour functions are banned in TS/TSX by ESLint, and in CSS outside the
  `@theme` token block by `scripts/check-raw-colors.ts`. SVG files are brand artwork and exempt.
- `max-lines-per-function: 40`, `max-lines: 300`, no `any`, no `@ts-ignore`.

**Supply chain:**

- `pnpm audit --audit-level=high` blocks CI. Accepted advisories live in
  `docs/security/risk-register.md`, with an expiry.
- `minimumReleaseAge: 1440` (24 hours) is set in `pnpm-workspace.yaml`. A 3-day window was tried
  first. It also applies to versions already in the lockfile, so it blocked routine dependency
  changes whenever a transitive optional dependency had shipped in the last few days.
- Actions and images are pinned by SHA or digest.
- Gitleaks and Semgrep run in CI.

## Consequences

- **Cost:** about 1 minute of extra CI time (Semgrep, the gitleaks job, lint fixtures). Dependabot
  opens weekly PRs that need review.
- **Risk:** ESLint 9 is end-of-life upstream, so security fixes in the linter itself stop until we
  can move to 10. It runs only on our own code in CI, so exposure is low. Semgrep rule packs are
  fetched from semgrep.dev. That works on GitHub-hosted CI, but a self-hosted CI in Iran (Phase 5)
  must mirror the packs or vendor them into `.semgrep/`.
- **Reversibility:** high. Every choice is configuration. Moving to TypeScript 7 or ESLint 10 is a
  dependency bump plus re-running the rule fixtures.
- **Iran fit:** fonts and every runtime asset are self-hosted. Installs work from a registry mirror
  (`pnpm config set registry`). `minimumReleaseAge` and the pinned digests protect against poisoned
  packages arriving through a mirror.

## Revisit when

- `typescript-eslint` supports TypeScript 7 and `eslint-config-next` supports ESLint 10.
- `eslint-plugin-boundaries` cannot express a boundary we need (e.g. module-to-module events).
- CI moves to self-hosted runners in Iran: mirror Semgrep rules, gitleaks and images there.
