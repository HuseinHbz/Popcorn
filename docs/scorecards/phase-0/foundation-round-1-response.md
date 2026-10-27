# Response to Phase 0 code review, round 1 (76/100)

- Round 1 scorecard: [`foundation-round-1.md`](foundation-round-1.md). The reviewer session hit a
  usage limit before writing the ADR scores and the "Required fixes" list. Every deduction in the
  rubric table is addressed below.
- Security review: [`security-foundation.md`](security-foundation.md), Gate Pass. Its two Mediums and
  L2–L5 and L7 were fixed in `d0d1e50`…`dbe483c`. L1 (nonce CSP) is a tracked deferral to Phase 2.
  L6 and L8 were only partly fixed then (see the round-2 security review); their remaining parts are
  fixed or tracked as deferred controls in `docs/security/risk-register.md`.
- Per CLAUDE.md workflow step 6, the deductions are fixed, not argued. The one exception (D-16) is
  a history rewrite that needs the product owner's approval.

| #    | Deduction (round 1)                                                   | Fix                                                                                                                                                                         | Commit                          |
| ---- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| D-1  | File-level `eslint-disable` silently turns rules off                  | `noInlineConfig`: inline disables are ignored and reported; proven by fixture                                                                                               | `b39028f`                       |
| D-2  | Colour rule misses `rgb()`/`hsl()`/`oklch()`, CSS and SVG             | Colour functions banned in TS. `scripts/check-raw-colors.ts` checks CSS outside `@theme`. SVG is brand artwork, exempt (ADR 0014)                                           | `b39028f`                       |
| D-3  | AC7 does not assert HSTS, Referrer-Policy, Permissions-Policy         | Every header asserted, plus COOP, CORP, `base-uri`, `object-src`, no `unsafe-eval`                                                                                          | `d0d1e50`                       |
| D-4  | AC3 only asserts "lang changed"                                       | Asserts target URL, `lang`, `dir` and heading                                                                                                                               | `c3bff97`                       |
| D-5  | AC8/AC9: config is not verification                                   | `tests/lint-rules.test.ts` (14 cases on fixtures), `tests/commitlint.test.ts` (7 cases)                                                                                     | `b39028f`, `c3bff97`            |
| D-6  | CI commitlint on `main` checks only `--last`                          | Checks the pushed range `before..HEAD`                                                                                                                                      | `3441445`                       |
| D-7  | AC10: Redis auth and loopback binding unchecked                       | CI asserts Redis `NOAUTH`, Postgres wrong-password refusal over the network, non-superuser app role, every port on 127.0.0.1                                                | `5da71dc`, `dbe483c`, `3441445` |
| D-8  | Nothing asserts Vazirmatn is applied                                  | E2E asserts both faces load and lead the stack                                                                                                                              | `c3bff97`                       |
| D-9  | `pnpm audit` High findings, no acceptance                             | Overrides fix 4. Three without a patch are in `docs/security/risk-register.md` with expiry. CI audit gate                                                                   | `0048af0`, `5da71dc`            |
| D-10 | No audit or Semgrep in CI; tag-pinned actions; no Dependabot          | Audit gate, Semgrep job, SHA-pinned actions, Dependabot (npm, actions, compose)                                                                                             | `5da71dc`, `3441445`            |
| D-11 | Arial fallback renders Persian in Arial                               | `adjustFontFallback: false`; stack lists both subsets first; E2E guards it                                                                                                  | `a3b4d28`                       |
| D-12 | Module boundary bypassable with relative paths                        | `eslint-plugin-boundaries` resolves imports to files; fixtures prove relative bypass fails                                                                                  | `b39028f`                       |
| D-13 | Domain purity misses bare built-ins, globals, `next-intl`, barrels    | Domain may import no package or built-in (`checkAllOrigins`); I/O globals banned                                                                                            | `b39028f`                       |
| D-14 | `engines` says 22.12 but `lint-staged` needs 22.22.1; `.nvmrc` floats | `engines >=22.22.1`, `.nvmrc` `22.22.1`                                                                                                                                     | `a701e1f`                       |
| D-15 | `zod`, `server-only` unused; fonts read from `node_modules`           | Both removed. Fonts vendored with OFL licence                                                                                                                               | `a701e1f`, `a3b4d28`            |
| D-16 | `docs/project-plan.md` reformat inside `build:` commit `c2d2e84`      | **Open.** Fixing it rewrites pushed history (force-push). Awaiting the product owner's decision; a squash merge also removes it                                             | —                               |
| D-17 | Lighthouse ≥ 95 not demonstrated at HEAD                              | Found and fixed a real cause: the variable font cost about 270 ms of layout on `/fa`. Static weights give 0.95–0.99. CI writes median and range per page to the job summary | `a3b4d28`, `3441445`            |
| D-18 | CHANGELOG has no Phase 0 entry                                        | Entry written (an earlier scripted edit had silently missed)                                                                                                                | `c84a613`                       |
| D-19 | ADR 0013/0014 marked Accepted with pending score                      | Both `Proposed`, rewritten against the ADR rubric                                                                                                                           | `c84a613`                       |
| D-20 | Build evidence predates the last layout edit                          | Fresh build, E2E (26/26) and Lighthouse at HEAD, locally and in CI                                                                                                          | —                               |

## Also found while fixing

- The story's AC10 to AC13 edits in `5d0dcdd` never reached the file: the same silent-miss bug as
  D-18. The story was rewritten in `c84a613`, and later edits assert that every replacement applied.
- lint-staged passed ignored fixtures to ESLint, which then failed on "file ignored" warnings.
  Fixed with `--no-warn-ignored` (`b39028f`).
