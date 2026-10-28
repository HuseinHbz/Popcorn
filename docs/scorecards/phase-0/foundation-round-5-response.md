# Response to Phase 0 reviews, round 5 (code 97.75/100, security Pass)

- Scorecards: [`foundation-round-5.md`](foundation-round-5.md) (code review, at `5e34f03`) and
  [`security-foundation-round-5.md`](security-foundation-round-5.md) (security review, Gate Pass:
  0 Critical, 0 High).
- Per CLAUDE.md workflow step 6, the deductions are fixed, not argued. Every fix was measured or
  proven before it was committed, and each commit body gives its evidence. Two claims in the
  round-4 response were wrong; they are corrected at the end of that file (`8c78d20`).
- **Still open, owner decisions only:**
  - D1 and D2 (history rewrite). A squash merge does not fix D2.
  - N3: the `main` ruleset, before the first merge.
  - N6: repository visibility.
  - After the merge: the GitHub settings (G1, F10).
  - Accepting ADR 0013, or amending `phase-00.md`, which still names MinIO.

## Code review deductions

| #      | Deduction                                                 | Fix                                                                                                                                                                                                                                                                                    | Commit               |
| ------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| A5, T8 | English 404 linked to the Persian home page               | The link gets the locale explicitly. The E2E checks the link target in the raw HTML and in the browser for every case; the browser check fails on the previous code. ADR 0018 records the header dependency and the second locale source                                               | `c6073e5`            |
| T7-r5  | The runtime telemetry check could not fail                | Explicit `if … exit 1`, and `shell: bash` (`-eo pipefail`) for every step. With telemetry on and the configuration check removed, the step now fails on the log check                                                                                                                  | `7402e7c`            |
| T9     | The marker guard skipped all of `docs/scorecards/`        | The scanners ignore markers everywhere (`ff9ea59`). In the tree, only the two security reviews that report on markers may quote one; a new scorecard quoting one fails. A tree check, rather than a commit cut-off, so a squash merge keeps it valid. CODEOWNERS covers the scorecards | `41fd08f`, `7314fd6` |
| L1-r5  | `as`, `satisfies` and `!` carried literals past the rules | The wrappers count as a branch in every token and text rule; four fixture lines                                                                                                                                                                                                        | `107cca4`            |
| D7     | Untrue statements                                         | Round-4 response corrected (`8c78d20`). Scanner claims now match what is enforced (`ff9ea59`, `41fd08f`). Stale comments fixed in `next.config.ts` and the 404 spec (`c6073e5`). "Any spelling or encoding" corrected (`8ab4215`). ADR index wording fixed (`4b367a1`)                 | see Fix              |
| D1, D2 | History                                                   | **Open:** the owner's approval for a force-push, or a written waiver                                                                                                                                                                                                                   | —                    |

ADR points: 0015 false negatives include syntax shapes and `format(undefined)`; 0017 the `/en` FCP figure with CI medians (`4b367a1`). 0016's scorecard exception and CODEOWNERS wording: `7314fd6`. 0018's trade-offs and revisit trigger: `c6073e5`.

## Security review findings

| #   | Severity | Fix                                                                                                                                                                                                                                                                                                                                                                                                             | Commit               |
| --- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| H1  | Low      | gitleaks runs with `--ignore-gitleaks-allow` and Semgrep with `--disable-nosem`; `.git/info/attributes` (`* !diff`, `* !export-ignore`) overrides every `.gitattributes`; the guard checks scanner config files at any depth and markers case-insensitively. Negative cases (nested `.semgrepignore`, upper-case long marker, short marker, new scorecard quote) all fail the guard                             | `ff9ea59`, `41fd08f` |
| H2  | Low      | A second gitleaks scan of the current tree (`git archive HEAD`), with no exceptions. `export-ignore` is neutralised: checked locally, one attribute line had dropped all of `src/` from the archive. A run without the tree mount fails. The fake value quoted in the round-4 scorecard is replaced by a description. The register asks the ruleset to allow merge commits and squash merges, not rebase merges | `20dc985`            |
| H3  | Info     | See T7-r5                                                                                                                                                                                                                                                                                                                                                                                                       | `7402e7c`            |
| H4  | Info     | CODEOWNERS covers every path listed, and the file and ADR 0016 say that, with one maintainer, the owner reading the diff is the control                                                                                                                                                                                                                                                                         | `7314fd6`            |
| H5  | Info     | Selectors and fixture lines for `srcDoc` props, computed keys spelling the names, `innerHTML`/`outerHTML` assignment, `insertAdjacentHTML`, `createContextualFragment` and `document.write`. Look-alikes stay allowed: a dynamic `data-*` key, a stream `write`, reading `innerHTML`                                                                                                                            | `f2767ab`            |
| H6  | Info     | Service passwords trimmed; every production secret needs 8 distinct characters. The host and TLS rules are recorded for Phase 2                                                                                                                                                                                                                                                                                 | `8ab4215`            |
| H7  | Info     | Register: Nginx clears the inbound header in Phase 5, and nothing else may read it. ADR 0018 says the same                                                                                                                                                                                                                                                                                                      | `3975b5b`, `c6073e5` |

Also recorded: the Node 22 end-of-life deadline (F7) and the owner's GitHub settings (G1, F10), in `3975b5b`.

While fixing H1, the broader marker pattern matched the `--disable-nosem` flag name in `ff9ea59`
itself, so the guard would have failed on its own commit. The pattern now requires the marker to
stand alone (`41fd08f`). The guard passes on the branch, and every negative case above still fails.
