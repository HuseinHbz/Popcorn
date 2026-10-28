# Response to Phase 0 reviews, round 7 (code 98.25/100, security Pass)

- Scorecards: [`foundation-round-7.md`](foundation-round-7.md) (code review, at `a3d1e29`) and
  [`security-foundation-round-7.md`](security-foundation-round-7.md) (security review, Gate Pass:
  0 Critical, 0 High).
- Both gates were met at `a3d1e29`. The deductions and findings are fixed anyway, not argued
  (CLAUDE.md workflow step 6), and each fix carries its negative control in the commit body. The
  round-6 response's J1/J5 and T11/J3 rows claimed more than the checks enforced; it now ends
  with the correction (`b8919d9`).
- CI was green at `1105e1f` with the hardened tree scan and with Semgrep's registry packs reading
  files of any size: their report holds no error, so the new errors check passes.
- **Still open, owner decisions only:**
  - D1 and D2 (history rewrite). A squash merge does not fix them.
  - N3: the `main` ruleset, before the first merge (rated High if the branch merges without it).
  - N6: repository visibility.
  - After the merge: the GitHub settings (G1, F10).
  - Accepting ADR 0013, or amending `phase-00.md`, which still names MinIO.

## Code review deductions

| #      | Deduction                                           | Fix                                                                                                                                                                                                                                 | Commit                          |
| ------ | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| T12    | Non-ASCII names escaped the skipped-name check      | `scripts/check-scan-coverage.ts` reads paths with `-z`, so no name is quoted; a Persian-named text `.svg` fails (see K1, K2)                                                                                                        | `99a0a61`                       |
| T13    | A committed `.ci-canary` was never scanned          | The tree may hold no `.ci-canary` (file or link) and no symbolic link; the exported `.gitleaksignore` is removed (K3)                                                                                                               | `bccdaab`                       |
| T14    | Non-TypeScript files under `src/` skipped the rules | The rules cover every JS/TS extension (`.js` and `.mjs` fixtures, unreported under the previous config); a test rejects any such file under `src/`; Next.js routes only `.ts`/`.tsx`, and a probe `page.js` is no longer built (K4) | `ea9c834`, `e4669af`, `55dbfeb` |
| D7-r7  | Untrue statements                                   | ADR 0016 and 0015 (`90f01ce`), README and CHANGELOG (`b73da59`), the register (`ee5dd2d`), the round-6 response (`b8919d9`). The `097d425` body stays as history; the round-6 response now corrects its claim                       | see Fix                         |
| D1, D2 | History                                             | **Open:** the owner's approval for a force-push, or a written waiver                                                                                                                                                                | —                               |

Required fixes without rubric points: the four selectors for ADR 0015 are in `a4066cd`, with more
(K5); the ADR scores are in `3769a58`.

## Security review findings

| #   | Severity | Fix                                                                                                                                                                                                                                                                                                                                                                                                                                  | Commit                          |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| K1  | Low      | Every blob any commit on any ref added, under every path, merges included, is checked: binary content must be an expected format, and a text file gitleaks skips by name must be expected. A UTF-16 file, a text `.svg` and a text `.pdf`, each added then deleted, and a UTF-16 file added by a merge then deleted, all fail; the repository passes (619 paths of 618 blobs, 0.2 s)                                                 | `99a0a61`                       |
| K2  | Info     | Names read with `-z` (a Persian-named `.svg` fails); every binary file needs its format's signature (UTF-16 text named `.png` fails; ttf and otf are no longer accepted, none exists)                                                                                                                                                                                                                                                | `99a0a61`                       |
| K3  | Info     | The exported `.gitleaksignore` is removed; a committed `.ci-canary`, a `.ci-canary` link (dangling too) and any other link each fail the step. Checks on separate lines; the workflow comment warns about `&&`                                                                                                                                                                                                                       | `bccdaab`                       |
| K4  | Low      | See T14                                                                                                                                                                                                                                                                                                                                                                                                                              | `ea9c834`, `e4669af`, `55dbfeb` |
| K5  | Info     | Any reference to a parsing sink (`.call`, `.apply`, `.bind`, destructuring), `execCommand`, writes through patterns and loops, `on…` names as templates and through the NS and `createAttribute` APIs, JSX `<script>`/`<style>` children, `javascript:` templates. Fourteen fixture lines, unreported under the previous config; three look-alikes. The HTML `Blob` stays a review item, and Trusted Types joins the Phase 2 CSP row | `a4066cd`, `ee5dd2d`            |
| K6  | Info     | `--max-target-bytes=0`, and the report's errors must be empty (a 2.3 MB file is skipped without the flag; with it, its timeout fails the check); CI confirmed no errors at HEAD                                                                                                                                                                                                                                                      | `1105e1f`                       |
| K7  | Info     | ADR 0016, ADR 0015, README, CHANGELOG and the register say what each check covers; the known gaps now include a secret inside an expected binary file and gitleaks' allowlist regex that drops any secret containing "false"                                                                                                                                                                                                         | `90f01ce`, `b73da59`, `ee5dd2d` |

Notes for the code reviewer: the `&&` warning is in the workflow comment (`bccdaab`). The S3 steps
source `.env` as shell, which suits the placeholder values it holds; a value with shell syntax in
it would need quoting there, and Phase 2 moves secrets out of `.env` (register). The `/fa` run at
80 is one of five; the gate reads the median, and `numberOfRuns` rises if it starts to flake.
