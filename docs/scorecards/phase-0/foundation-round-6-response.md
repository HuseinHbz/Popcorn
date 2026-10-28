# Response to Phase 0 reviews, round 6 (code 98.00/100, security Pass)

- Scorecards: [`foundation-round-6.md`](foundation-round-6.md) (code review, at `a2d5e28`) and
  [`security-foundation-round-6.md`](security-foundation-round-6.md) (security review, Gate Pass:
  0 Critical, 0 High).
- The code score reaches the gate, but both reviews list fixes as owed. Per CLAUDE.md workflow
  step 6 they are fixed, not argued, and so are the notes, except the two listed below. Every
  fix was measured or proven before it was committed; each commit body gives its negative
  control. Three claims in the round-5 response, and the round-4 response's correction, were
  wrong; both files now end with the correction (`01d443a`).
- The pinned gitleaks image (its blob host) and the Semgrep packs (semgrep.dev) cannot be
  fetched here. Their mechanics were proven offline, and the scanners themselves ran in CI at
  `3e7b5c2`: the history scan read 129 commits, 1.80 MB with merge diffs (1.22 MB before); the
  tree scan reported exactly one finding, the canary; Semgrep read `tests/`.
- **Still open, owner decisions only:**
  - D1 and D2 (history rewrite). A squash merge does not fix them.
  - N3: the `main` ruleset, before the first merge.
  - N6: repository visibility.
  - After the merge: the GitHub settings (G1, F10).
  - Accepting ADR 0013, or amending `phase-00.md`, which still names MinIO.

## Code review deductions

| #      | Deduction                                    | Fix                                                                                                                                                                                                                                       | Commit               |
| ------ | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| T7-r6  | The telemetry log check missed telemetry     | The log is captured before `grep`, and so is the output in the four positive checks; the workflow comment names the idiom. With telemetry on: 37 of 40 runs missed before, 0 of 40 after. All seven services steps pass against the stack | `15d1478`            |
| A6     | `pipefail` changed the production audit gate | `--audit-level=high`, so pnpm's status means what `jq` checks (exit logic read in pnpm's source; `jq` still counts ignored advisories). Every other pipe re-read under the new shell                                                      | `275b403`            |
| T11    | The tree scan passed with no tree            | The rules are read from inside the tree, with a CI positive control (no mount, empty mount); then a canary that must be the only finding (J3)                                                                                             | `687f69a`, `f2791c5` |
| T10    | The `document.write` selector never matched  | `/^write(?:ln)?$/` and a fixture line; with the old regex only that line goes unreported                                                                                                                                                  | `444faf9`            |
| D7-r6  | Untrue statements                            | Responses corrected (`01d443a`); compose comment (`687f69a`); ADR 0015 depth and sinks, 0016 ci.yml exemption, 0018 wording (`3145280`); ADR 0013 and 0014 headers (`d838bbe`); CHANGELOG (`2d31f1a`)                                     | see Fix              |
| D1, D2 | History                                      | **Open:** the owner's approval for a force-push, or a written waiver                                                                                                                                                                      | —                    |

ADR points: 0015's single depth figure holds because every rule now follows branches and
TypeScript wrappers two levels deep (`7cba218`, five fixture lines that lint clean under the
previous config); its raw-HTML list is fixture-proven line by line (`444faf9`, `63169e9`).
0016's Risk names the tree scan's cost and the known gaps (`3145280`).

Notes acted on:

- `ci.yml:97-99`: `git grep` failures other than "no match" now fail the check (`c9cb1e1`).
- Lint residuals: `srcdoc`, `setHTMLUnsafe`, `parseHTMLUnsafe`, computed and template members,
  `Object.assign` (`444faf9`); two-level token and button-value branches (`7cba218`).
- `.gitleaksignore` wording (`4aa7833`); `eslint.config.mjs` comments (`7cba218`).
- `money.ts`, `date.ts` and the home page's toggle read the locale list (`ba7a431`).
- `{ pnpm: null }` fails the advisory parser (`77c2960`, test first).
- The Lighthouse medians are published as annotations, readable through the checks API
  (`a01964b`).

Not acted on: `numberOfRuns` stays at 5 (CI medians at `a2d5e28` were 98 and 96); it rises,
odd, if the gate starts to flake, and a red job is never re-run until green. The commitlint
warning on `97f373f` is in the history (D1/D2); new bodies avoid such lines.

## Security review findings

| #   | Severity | Fix                                                                                                                                                                                                                                                                                           | Commit                                     |
| --- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| J1  | Low      | `* !working-tree-encoding` in the attributes override (an attributed file now exports as UTF-8); the guard fails on any binary file without a binary format's extension (a committed UTF-16 file fails it). README, CHANGELOG and ADR 0016 say what is enforced                               | `9dd30c4`, `3145280`, `2d31f1a`            |
| J2  | Low      | `--log-opts=--full-history --all -m --diff-filter=uxdb`; checked with git (both tokens appear, neither did before) and in CI (merge diffs read, history clean)                                                                                                                                | `1b784fe`                                  |
| J3  | Low      | `package.json` must be in the export; a canary generated at run time must be the only finding in the JSON report; CI reported exactly the canary                                                                                                                                              | `687f69a`, `f2791c5`                       |
| J4  | Info     | The configuration must hold exactly `-master.telemetry=false` among the telemetry flags (a later override fails); the log is captured before `grep`                                                                                                                                           | `acf3507`, `15d1478`                       |
| J5  | Info     | gitleaks: a copy of v8.30.1's path allowlist, and the guard fails on a text file it matches except the three expected ones; each of the review's five names fails; a test ties the copy to the image version. Semgrep: the exported tree with a pinned ignore file, and a scanned-files check | `097d425`, `3e7b5c2`, `3145280`, `f1378d5` |
| J6  | Info     | Any string or static template naming a sink is banned (types excepted), plus wrapped assignments, `setAttribute('on…')` and `write` on another document; one fixture line per shape                                                                                                           | `444faf9`, `63169e9`                       |
| J7  | Info     | A catch-all line, with the missing paths named                                                                                                                                                                                                                                                | `dc8d1c0`                                  |

Notes for the code reviewer, acted on: the production audit (A6, `275b403`), the
distinct-character rule in `.env.example` (`a8ffbfb`), the S3 port and bucket read from `.env`
in CI (`7f80522`). The register tracks the scanning blind spots that remain (`f1378d5`).

## Corrections after round 7

Two rows above claimed more than the checks enforced, as the round-7 reviews showed:

- J1 and J5 rows: the binary and skipped-name checks read only HEAD's index, with git's quoted
  paths. A UTF-16 file, a text `.svg` or a text `.pdf` added and deleted in a later commit, a
  non-ASCII or quoted name, and UTF-16 text named `.png` all passed. Fixed in `99a0a61`: every
  blob in the history is checked, names are read unquoted, and binary formats need their
  signature.
- T11 and J3 rows: the tree scan still had three exceptions: the exported `.gitleaksignore`, a
  committed `.ci-canary` that the canary overwrote, and symbolic links, which gitleaks does not
  follow. Fixed in `bccdaab`.
