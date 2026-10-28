# ADR 0014: Toolchain baseline — versions, runtime and Next.js 16 conventions

- Status: Proposed
- Date: 2026-10-27
- Score: 100/100 (code review round 7, at `a3d1e29`, `docs/scorecards/phase-0/foundation-round-7.md`).
- Related: ADR 0001–0003 (stack), ADR 0015 (rule enforcement), ADR 0016 (supply chain), ADR 0017 (fonts)

## Context

ADRs 0001–0003 fix the stack but not versions. In October 2026 the newest majors do not fit
together:

- **TypeScript 7.0 and ESLint 10 are out.** But `typescript-eslint` 8.72 supports TypeScript
  `<6.1`, and `eslint-config-next` 16.4 depends on `eslint-plugin-react`, `-import` and `-jsx-a11y`,
  which declare ESLint `≤9`.
- **Next.js 16 changed conventions.** `middleware.ts` became `proxy.ts`, route types come from
  `next typegen`, and next-intl 4.14 deprecated `setRequestLocale` and `requestLocale` in favour of
  `next/root-params`.
- **Node and pnpm pins drift silently.** Dependabot does not read `.nvmrc` or `packageManager`.
  `pnpm audit` checks neither the runtime nor the package manager. In Phase 0 both pins fell
  behind security releases (Node 22.22.1, four releases behind; pnpm 10.28.0, 11 High advisories)
  without any gate noticing.

Constraints:

- Strict typing and typed lint must actually run (plan §3: type safety and lint are scored).
- Installs must work behind an Iranian npm mirror (ADR 0008).
- Upgrades must be deliberate and reviewable.

## Options considered

| Option                                                                                | Pros                                                  | Cons                                                                                                                              |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **A. Latest of everything** (TypeScript 7, ESLint 10)                                 | Newest features; longest support                      | Typed lint rules cannot run, so the "lint" score is unmeasurable                                                                  |
| **B. Previous Next.js major (15) on older majors**                                    | More community answers                                | A new codebase starts on a superseded major and needs a migration within months                                                   |
| **C. Newest versions that work together, pinned exactly; runtime pins tracked by CI** | Every gate runs; upgrades are explicit diffs          | ESLint 9 is end-of-life upstream; pins need a tracking mechanism                                                                  |
| D. npm or Yarn instead of pnpm                                                        | npm ships with Node, so there is no Corepack download | npm lacks `minimumReleaseAge`, `strictDepBuilds` and a content-addressed store (ADR 0016); Yarn Berry's PnP fights Next's tooling |

## Decision

Option C:

- **Versions:** Next.js 16.4 · React 19.3 · TypeScript 6.0 · ESLint 9.39 (flat config,
  `strictTypeChecked`) · Tailwind 4.3 · next-intl 4.14 · Zod 4.6 · Vitest 5 · Playwright 1.63.
  Exact pins (`.npmrc` `save-exact`); upgrades arrive as Dependabot PRs (ADR 0016).
- **Runtime:** Node 22.23.4 (`.nvmrc` exact, `engines >=22.23.4`) and pnpm 10.34.9
  (`packageManager`, with the tarball's sha512). Both are the latest security releases of their
  lines. Corepack installs pnpm locally and in CI and refuses a tarball whose hash differs
  (checked with a tampered hash: "Mismatch hashes").
  - The CI `freshness` job (every push, and weekly) fails when nodejs.org lists a newer Node
    security release in the pinned major line, or when that line has reached end of life
    (`scripts/check-node-version.ts`, reading nodejs/Release `schedule.json`). It warns 90 days
    before the end of life; Node 22 ends on 2027-04-30.
  - It also fails when the pinned pnpm has a Moderate, High or Critical advisory, checked
    against the npm registry's advisory API (`scripts/check-package-manager.ts`). Moderate counts
    here, unlike the dependency audit, because pnpm's Moderate advisories include
    lockfile-integrity bypasses. The pnpm 10.28.0 pin fails this check (verified).
  - Both checks reject an answer of unexpected shape, and CI runs them against known-bad pins
    (Node 22.22.1, pnpm 10.28.0) as positive controls that must fail for the right reason.
  - `engine-strict` stays off: it applies to every transitive dependency and would block installs
    over a patch version.
- **Next.js 16 conventions:** locale routing lives in `src/proxy.ts`, the locale is read through
  `next/root-params`, and `next typegen` runs before `tsc` and ESLint, so route types exist on a
  fresh checkout.
- Runtime libraries are added in the phase that first uses them. For example, Zod arrived with
  `env.ts`.

## Consequences

- **Cost:** about one upgrade PR a week to review. The `freshness` job adds about 20 s of CI.
- **Risk:**
  - ESLint 9 no longer receives upstream fixes. It runs only on our own code in CI, so exposure
    is low, and moving to 10 is gated on the ecosystem (see Revisit).
  - The `freshness` job runs on every push and depends on three foreign endpoints: nodejs.org
    (`dist/index.json`), raw.githubusercontent.com (nodejs/Release `schedule.json`) and the npm
    registry's advisory API. An outage of any of them turns CI red for a change that did not
    cause it; the job is separate, so the other gates still report, and re-running it is the
    remedy.
- **Reversibility:** high. Every choice is a version number or a config line, and a downgrade is
  one commit.
- **Iran fit:**
  - Installs work from a registry mirror (`pnpm config set registry <mirror>`). Corepack does not
    read pnpm's setting: it downloads pnpm from `COREPACK_NPM_REGISTRY`, which must point at the
    same mirror. The sha512 pin still verifies whatever the mirror serves.
  - These are foreign downloads, fine on GitHub-hosted CI today; a self-hosted CI in Iran must
    mirror or replace each of them (Phase 5 runbook): Node itself (`actions/setup-node`,
    nodejs.org), the Playwright browsers (Microsoft's CDN), the Chrome that Lighthouse CI uses
    (preinstalled on GitHub's runners), and the three endpoints of the `freshness` job above.

## Revisit when

- `typescript-eslint` supports TypeScript 7 **and** `eslint-config-next` supports ESLint 10, or
- an ESLint 9 advisory of High severity has no backport within 30 days, or
- CI moves to self-hosted runners: mirror Node, pnpm and the Playwright browsers first, or
- the Node line moves past 24: Corepack is no longer bundled from Node 25, so install it
  explicitly (`npm install -g corepack`) or choose another verified install, or
- the `freshness` job warns that Node 22 is within 90 days of end of life (from 2027-01-30):
  move to the next LTS line.
