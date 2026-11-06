# Response to Phase 0 reviews, round 8 (code 98.5/100, security Pass)

- Scorecards: [`foundation-round-8.md`](foundation-round-8.md) (code review, at `1898889`) and
  [`security-foundation-round-8.md`](security-foundation-round-8.md) (security review, Gate Pass:
  0 Critical, 0 High).
- Both gates were met at `1898889`, as at `32b3887`. The deductions and findings are fixed
  anyway, not argued (CLAUDE.md workflow step 6), each with its negative control in the commit
  body. Untrue rows in the round-6 and round-7 responses are corrected at their ends
  (`b332a63`).
- The git-mode tree scan ran green in CI at `7ab9118`, with the canary as its only finding. The
  same run's freshness job failed because nodejs.org began listing a prerelease
  (`v27.0.0-alpha.0.0.0`), which the parser rejected; fixed in `3d79dbc`, with no Node change.
- **Still open, owner decisions only:**
  - D1 and D2 (history rewrite). A squash merge does not fix them.
  - N3: the `main` ruleset, before the first merge (rated High if the branch merges without it).
  - N6: repository visibility.
  - After the merge: the GitHub settings (G1, F10).
  - Accepting ADR 0013, or amending `phase-00.md`, which still names MinIO.

## Code review deductions

| #      | Deduction                                                      | Fix                                                                                                                                                                                                         | Commit    |
| ------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| T15    | `*.constructor` passed as a signed format; Unicode folding     | Own keys only (`Object.hasOwn`); patterns compiled with `su`/`isu`. In a scratch clone, binary `notes.constructor` and a text `logo.ſvg` pass the previous script and fail this one                         | `f4b0723` |
| T16    | Text sniffed as an application format skipped by the tree scan | The tree scan runs in git mode, which reads every text file whole, so no signature list is needed in the coverage check (see P2)                                                                            | `b94f620` |
| D7-r8  | Untrue statements                                              | ADR 0016 and 0015 (`aa78d6e`), the script's header (`feffc43`), CHANGELOG (`09919c1`), the responses (`b332a63`). README, the register row and `ci.yml`'s comment are true as written once the fixes landed | see Fix   |
| D1, D2 | History                                                        | **Open:** the owner's approval for a force-push, or a written waiver                                                                                                                                        | —         |

Required fixes without rubric points: ADR 0015 now states, as measured, that a `.cts` file fails
to parse and a `.cjs` file stops ESLint ("could not find plugin react"), so both fail lint
(`aa78d6e`); the ADR scores are in `9b6fb85`.

Notes acted on: the Lighthouse median now comes from 7 runs (`7ab9118`); the raw-HTML selectors
moved to `eslint/unsafe-syntax.mjs` before the config reached its line limit (`3a6c7ac`,
identical selector lists); `--root` and `--diff-merges=separate` are explicit (`9ac9fb1`); the
CI step requires the script's summary line (`7560323`); the tree step's checks name what they
found, and the redundant link test is gone (`b94f620`). Not acted on: reading only each blob's
first bytes (memory is cheap at today's 640 or so blobs; revisit when photos land in Git), and the
unreachable `?? routing.defaultLocale` fallback (harmless).

## Security review findings

| #   | Severity | Fix                                                                                                                                                                                                                                                                                                                 | Commit                          |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| P1  | Low      | The coverage check keeps each change's previous regular-file blob and fails on text after binary content. Text over a `.webp` left at HEAD, and text over an `.ico` then restored, pass the previous script and fail this one. `--text` on the history scan was not taken: it would read every future image as text | `9ac9fb1`                       |
| P2  | Info     | The export is committed as a one-commit repository (attributes override, `add -A --force`) and scanned in git mode; the canary is `.ci-canary`. Locally, all 224 exported files reach the root diff and a `-diff` attribute hides nothing; in CI the canary was the only finding                                    | `b94f620`                       |
| P3  | Info     | See T15; `::error::` messages escape `%`, CR and LF                                                                                                                                                                                                                                                                 | `f4b0723`                       |
| P4  | Info     | `<Script>` children, `createElement('script')` (DOM and React) and `execCommand` as a string; four fixture lines, unreported under the previous selectors; look-alikes clean                                                                                                                                        | `0b697f3`                       |
| P5  | Info     | See D7-r8                                                                                                                                                                                                                                                                                                           | `aa78d6e`, `feffc43`, `09919c1` |

Note for the code reviewer, acted on: `--diff-merges=separate` makes the parser independent of a
runner's `log.diffMerges` (`9ac9fb1`).

## Corrections after round 9

Two rows above claimed more than the checks enforced, as the round-9 reviews showed:

- P1 row: the coverage check pairs a change with its own path's previous blob, but the history
  scan detected renames, so text renamed from an accepted image was diffed as binary and read
  by neither (code review T17, security review Q1). Fixed in `b4064cf`: the history scan runs
  with `--no-renames`.
- T16 and P2 rows: git mode closed directory mode's skips, but `export-subst` and `ident` still
  rewrote the export, and the scan repository's conversions changed two fonts' bytes, so the
  scanned tree was not exactly HEAD's (code review T18, security review Q2). Fixed in
  `41a7503`: every such attribute is unset on both sides, and the tree step fails unless the
  scanned blob ids are HEAD's.
