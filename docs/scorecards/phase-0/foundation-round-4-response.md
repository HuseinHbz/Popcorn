# Response to Phase 0 reviews, round 4 (code 97.5/100, security Pass)

- Scorecards: [`foundation-round-4.md`](foundation-round-4.md) (code review, at `26e1971`) and
  [`security-foundation-round-4.md`](security-foundation-round-4.md) (security review, Gate Pass:
  0 Critical, 0 High).
- Per CLAUDE.md workflow step 6, the deductions are fixed, not argued. Every fix was measured or
  proven before it was committed; the commit bodies give the evidence.
- Still open, because only the product owner can decide them: D1 and D2 (history rewrite), N3
  (branch protection before the first merge), N6 (repository visibility), F10 (Dependabot
  security updates after the merge), GitHub's non-provider secret patterns, and accepting
  ADR 0013 or amending `phase-00.md`, which still names MinIO.

## Code review deductions

| #       | Deduction                                                               | Fix                                                                                                                                                                                                                                                                     | Commit               |
| ------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| A4 + T6 | 404s under a locale existed only after JavaScript ran                   | No catch-all; every unknown path reaches `global-not-found.tsx`, which takes the locale from the proxy's next-intl header. A new E2E check reads the raw server HTML: it fails on the previous code for the four multi-segment cases and passes now; ADR 0018 rewritten | `3e876b9`            |
| T3-r4   | Literal text in branches of JSX children and button values              | Branch selectors for JSX children and button `value`; `t()` inside a branch stays allowed                                                                                                                                                                               | `58a47c3`            |
| T7      | Lighthouse BP/SEO thresholds unpinned; isolation check proved little    | The config test pins all four thresholds; the isolation step probes the filer from inside, requires `bad address` from redis and postgres, and reads the logs for telemetry (fails with telemetry on)                                                                   | `e84d17c`, `e5714ba` |
| TS1-r4  | Reshaped advisory answers and unknown severities counted as clean       | Only the package's own key and the five npm severities are accepted; CI positive controls run both freshness checks on known-bad pins and require their findings                                                                                                        | `563ed4e`            |
| L1-r4   | Colour and spacing values in branches, SVG template literals, negatives | Branch selectors for colour and spacing values, template literals in SVG colour attributes, negated spacing literals                                                                                                                                                    | `c57262b`            |
| D6      | Untrue statements                                                       | Corepack mirror (`COREPACK_NPM_REGISTRY`) in README and ADR 0014 (`014ea81`); ADR 0013 "never from the host" (`6f730d9`); ADR 0018 (`3e876b9`)                                                                                                                          | see Fix              |
| D1, D2  | History                                                                 | **Open:** need the owner's approval for a force-push, a written waiver, or a squash merge                                                                                                                                                                               | —                    |

ADR points: 0013 presigned URLs and host exposure (`bd834c0`, `6f730d9`); 0014 foreign endpoints,
mirror list and Corepack (`014ea81`); 0015 false negatives and a revisit trigger (`bd834c0`); 0016
written reasons enforced by `tests/gitleaksignore.test.ts` and in-repo exceptions acknowledged
(`002ea3e`, with the scanner pinning in `e7c0e5b`); 0017 the `/en` font swap (`bd834c0`); 0018 the
problem statement and the missing alternative (`3e876b9`). The joined comment paragraphs in
`fonts/index.ts` are split (`442e21d`).

## Security review findings

| #   | Severity | Fix                                                                                                                                                                                                                                    | Commit               |
| --- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| G1  | Low      | gitleaks runs with a pinned configuration (built-in rules only); CI fails on a `.gitleaks.toml`, a `.semgrepignore`, or an inline suppression in any commit (both negative cases run locally and fail); CODEOWNERS covers the controls | `e7c0e5b`, `86a4095` |
| G2  | Info     | ADR 0013 and the register state the host's access on Linux (checked: filer, master and volume ports answer); README requires Docker Engine 28 or later                                                                                 | `6f730d9`            |
| G3  | Info     | See T7                                                                                                                                                                                                                                 | `e5714ba`            |
| G4  | Info     | `dangerouslySetInnerHTML` as a `createElement` or spread property and `<iframe srcDoc>` are banned, each proven by a fixture line                                                                                                      | `69d1c48`            |
| G5  | Info     | Phase 5 rule in the register: Nginx adds the headers with `always` (Next sends none on its 308 trailing-slash redirect, checked) and drops `x-nextjs-*`                                                                                | `6f730d9`            |
| G6  | Info     | Values decoded before the placeholder match, `change.me` matched, service passwords of 16+ characters, the S3 secret measured trimmed, https required for a non-local S3 endpoint; `APP_ENV` from the deploy unit (register)           | `c90dce9`, `6f730d9` |

While verifying G3 locally, the harness first ran the steps inside a subshell on the left of `&&`,
where bash ignores `set -e`, so a negative control passed that should have failed. The harness now
runs each step as Actions does (`bash -eo pipefail <file>`); every service step was re-run that
way: all pass as committed, and the isolation step fails with telemetry switched on.

## Corrections after round 5

Two statements above were not true, as the round-5 reviews showed:

- T7 and the last paragraph: the runtime telemetry check could not fail. It was a negated
  pipeline before the step's last command, so bash ignored `set -e` for it. The negative control
  failed on the configuration check, not on the log check. Fixed in `97f373f`, which also runs
  every step with `pipefail`. With telemetry on and the configuration check removed, the step
  now fails on the log check.
- G1: "an inline suppression in any commit" excluded `docs/scorecards/`, and gitleaks honoured
  markers there. Fixed in `ff9ea59` and `41fd08f`: neither scanner honours a marker anywhere, and
  only the two security reviews that report on markers may quote one.

## Correction after round 6

The first correction above was itself wrong: after `97f373f` the log check still missed
telemetry in most runs, because `pipefail` turned the closed pipe into a failed condition. See
the corrections at the end of `foundation-round-5-response.md`.
