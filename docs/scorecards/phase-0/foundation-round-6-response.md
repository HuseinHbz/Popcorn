# Response to Phase 0 reviews, round 6 (code 98.00/100, security Pass)

- Scorecards: [`foundation-round-6.md`](foundation-round-6.md) (code review, at `cca6266`) and
  [`security-foundation-round-6.md`](security-foundation-round-6.md) (security review, Gate Pass:
  0 Critical, 0 High).
- The code score reaches the gate, but both reviews list fixes as owed. Per CLAUDE.md workflow
  step 6 they are fixed, not argued, and so are the notes, except the two listed below. Every
  fix was measured or proven before it was committed; each commit body gives its negative
  control. Three claims in the round-5 response, and the round-4 response's correction, were
  wrong; both files now end with the correction (`f3acf1b`).
- The pinned gitleaks image (its blob host) and the Semgrep packs (semgrep.dev) cannot be
  fetched here. Their mechanics were proven offline, and the scanners themselves ran in CI at
  `6e3b476`: the history scan read 129 commits, 1.80 MB with merge diffs (1.22 MB before); the
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
| T7-r6  | The telemetry log check missed telemetry     | The log is captured before `grep`, and so is the output in the four positive checks; the workflow comment names the idiom. With telemetry on: 37 of 40 runs missed before, 0 of 40 after. All seven services steps pass against the stack | `4cbe189`            |
| A6     | `pipefail` changed the production audit gate | `--audit-level=high`, so pnpm's status means what `jq` checks (exit logic read in pnpm's source; `jq` still counts ignored advisories). Every other pipe re-read under the new shell                                                      | `541350c`            |
| T11    | The tree scan passed with no tree            | The rules are read from inside the tree, with a CI positive control (no mount, empty mount); then a canary that must be the only finding (J3)                                                                                             | `b0deb6a`, `feb60f3` |
| T10    | The `document.write` selector never matched  | `/^write(?:ln)?$/` and a fixture line; with the old regex only that line goes unreported                                                                                                                                                  | `0f1c7f4`            |
| D7-r6  | Untrue statements                            | Responses corrected (`f3acf1b`); compose comment (`b0deb6a`); ADR 0015 depth and sinks, 0016 ci.yml exemption, 0018 wording (`36f6de3`); ADR 0013 and 0014 headers (`310517c`); CHANGELOG (`d5c7a37`)                                     | see Fix              |
| D1, D2 | History                                      | **Open:** the owner's approval for a force-push, or a written waiver                                                                                                                                                                      | —                    |

ADR points: 0015's single depth figure holds because every rule now follows branches and
TypeScript wrappers two levels deep (`36615cf`, five fixture lines that lint clean under the
previous config); its raw-HTML list is fixture-proven line by line (`0f1c7f4`, `9ba554e`).
0016's Risk names the tree scan's cost and the known gaps (`36f6de3`).

Notes acted on:

- `ci.yml:97-99`: `git grep` failures other than "no match" now fail the check (`1f1a7b8`).
- Lint residuals: `srcdoc`, `setHTMLUnsafe`, `parseHTMLUnsafe`, computed and template members,
  `Object.assign` (`0f1c7f4`); two-level token and button-value branches (`36615cf`).
- `.gitleaksignore` wording (`87d0362`); `eslint.config.mjs` comments (`36615cf`).
- `money.ts`, `date.ts` and the home page's toggle read the locale list (`7cb360f`).
- `{ pnpm: null }` fails the advisory parser (`aa1a76e`, test first).
- The Lighthouse medians are published as annotations, readable through the checks API
  (`ff6832e`).

Not acted on: `numberOfRuns` stays at 5 (CI medians at `cca6266` were 98 and 96); it rises,
odd, if the gate starts to flake, and a red job is never re-run until green. The commitlint
warning on `7402e7c` is in the history (D1/D2); new bodies avoid such lines.

## Security review findings

| #   | Severity | Fix                                                                                                                                                                                                                                                                                           | Commit                                     |
| --- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| J1  | Low      | `* !working-tree-encoding` in the attributes override (an attributed file now exports as UTF-8); the guard fails on any binary file without a binary format's extension (a committed UTF-16 file fails it). README, CHANGELOG and ADR 0016 say what is enforced                               | `50a4c62`, `36f6de3`, `d5c7a37`            |
| J2  | Low      | `--log-opts=--full-history --all -m --diff-filter=uxdb`; checked with git (both tokens appear, neither did before) and in CI (merge diffs read, history clean)                                                                                                                                | `80c0d91`                                  |
| J3  | Low      | `package.json` must be in the export; a canary generated at run time must be the only finding in the JSON report; CI reported exactly the canary                                                                                                                                              | `b0deb6a`, `feb60f3`                       |
| J4  | Info     | The configuration must hold exactly `-master.telemetry=false` among the telemetry flags (a later override fails); the log is captured before `grep`                                                                                                                                           | `79b117b`, `4cbe189`                       |
| J5  | Info     | gitleaks: a copy of v8.30.1's path allowlist, and the guard fails on a text file it matches except the three expected ones; each of the review's five names fails; a test ties the copy to the image version. Semgrep: the exported tree with a pinned ignore file, and a scanned-files check | `3c4a827`, `6e3b476`, `36f6de3`, `e46ae6b` |
| J6  | Info     | Any string or static template naming a sink is banned (types excepted), plus wrapped assignments, `setAttribute('on…')` and `write` on another document; one fixture line per shape                                                                                                           | `0f1c7f4`, `9ba554e`                       |
| J7  | Info     | A catch-all line, with the missing paths named                                                                                                                                                                                                                                                | `f6e9590`                                  |

Notes for the code reviewer, acted on: the production audit (A6, `541350c`), the
distinct-character rule in `.env.example` (`250d920`), the S3 port and bucket read from `.env`
in CI (`c0078c6`). The register tracks the scanning blind spots that remain (`e46ae6b`).
