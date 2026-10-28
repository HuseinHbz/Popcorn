# Scorecard — Phase 0 / Platform foundation (round 6)

- Reviewer: code-reviewer (fresh session, round 6; did not write this code)
- Date: 2026-10-28
- Verdict: **Approved — 98.00 / 100** (gate ≥ 98), subject to the mandatory gates below: the
  round-6 security review's own verdict, and the product owner adding the `main` ruleset (N3)
  before the merge. The required fixes listed below are still owed; none of them is optional
  because the score clears the gate.
- Scope: the whole branch against `origin/main` (merge base `b681347`, HEAD `a2d5e28`, 115
  non-merge commits), focused on `git log fe5b81c..a2d5e28`: 11 fix and documentation commits
  (`97f373f`…`ad64dc0`), the round-5 scorecards (`9214bea`), the correction of the round-4
  response (`82dc1b3`), the round-5 response (`e0defa2`) and the ADR scores (`a2d5e28`).
  `.claude/commands/*` and `docs/phases/*` belong to the maintainer and were read, not scored.
- Inputs read: `CLAUDE.md`, `docs/project-plan.md` §3 and §8, `docs/phases/phase-00.md`,
  `.claude/commands/review.md`, `docs/stories/platform-foundation.md`, ADRs 0013–0018,
  `docs/security/risk-register.md`, `foundation-round-5.md`, `foundation-round-5-response.md`,
  the "Corrections after round 5" section of `foundation-round-4-response.md`, and
  `security-foundation-round-5.md`. The round-6 security review did not exist when this
  scorecard was written. Every claim in the round-5 response, and every measurement or negative
  control quoted in a commit body that could be reproduced here, was checked here.

## Evidence collected by this reviewer at `a2d5e28`

| Check                                                                                                                | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Environment                                                                                                          | Own clone at `a2d5e28`. `cp .env.example .env` (gitignored, not committed). `pnpm install --frozen-lockfile --offline`: up to date. Local Node 22.22.0 is below `engines >=22.23.4`; pnpm only warns (ADR 0014). The VM is shared with the security reviewer, who was compiling gitleaks and running Semgrep during parts of this review.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `pnpm verify`                                                                                                        | **exit 0**: typegen, ESLint (`--max-warnings=0`) and the CSS colour check, Prettier, `tsc`, Vitest **18 files / 150 tests**, coverage 100 % (statements 81/81, branches 33/33, functions 20/20, lines 71/71), `next build`: `ƒ /_not-found`, `● /fa`, `● /en`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `CI=1 PORT=3500 pnpm e2e`                                                                                            | **71 passed, 1 skipped** (72 tests); no retry used.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| GitHub CI run 40619185963 (`a2d5e28`, push)                                                                          | **6/6 jobs success**, attempt 1; every step success, including "Lighthouse CI (mobile)" (the median assertion) and "Lighthouse scores to job summary". Playwright annotation "71 passed, 1 skipped". The job log is served from a blob host this reviewer's proxy refuses, and the check-run output has no summary, so **the CI medians could not be read**. Only `a2d5e28` was pushed in this round.                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm lhci` (Chromium 1243), three samples                                                                           | All three **fail** locally: `a2d5e28` `/fa` 89 (76–95), `/en` 93 (92–96), during a Go compile on the VM; `a2d5e28` `/fa` 91 (83–97), `/en` 94 (93–96), quieter; control **`fe5b81c`** `/fa` 92 (76–96), `/en` 93 (92–96). Round 5 measured `fe5b81c` at 98/97 locally, and `/fa`, `/en` have no code change since (`git diff fe5b81c..a2d5e28 -- src` touches only the 404 and `env.ts`), so the drop is this VM, not the code. Lighthouse's CPU benchmark index swung from 1,059 to 1,771 within one sample. A11y, best practices and SEO were 100 in all 30 runs.                                                                                                                                                                                                 |
| 404 home link (A5/T8)                                                                                                | Fixed: `src/shared/ui/not-found/index.tsx:15` passes `locale`. Negative control: HEAD rebuilt without `locale={locale}` fails exactly the four `/en` link checks (raw HTML and browser, both viewports), 40 others pass; the served HTML then carries `href="/fa"`. Restored and rebuilt afterwards.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Lint probes (temporary files, deleted)                                                                               | Caught now: `'red' as const`, `'white' satisfies string`, `padding: 8 as const`, `-8 as const`, `aria-label={'Close' as const}`, `title={'Hi' satisfies string}`, `{'Hello' as const}`, `value={'Send' as const}`, `{(ok ? 'Yes' : 'No') as string}`, `'red'!`, `innerHTML +=`, `createContextualFragment`, a template-literal `srcDoc` key. **`document.write(html)` is not caught by the new selector** (only by `@typescript-eslint/no-deprecated`); `document.writeln` is. Also not caught: `('red' as const) satisfies string`, `padding: (ok ? 8 : 16) as number` (no finding at all), `frame.srcdoc = html`, `node.setHTMLUnsafe(html)`, `node['insertAdjacentHTML'](…)`, a template-literal `innerHTML` member, `Object.assign(node, { innerHTML })`.       |
| `document.write` selector                                                                                            | `eslint.config.mjs:134` uses `/^writeln?$/`, which matches `writel` and `writeln`, never `write` (checked with Node). With `/^write(?:ln)?$/` the probe is caught and `src/` stays clean. A fixture line for it fails `tests/lint-rules.test.ts` on the current regex (2 tests) and passes with the fix (51/51).                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Env rules (`c0605d3`)                                                                                                | `parseEnv` with production values: 16-character passwords with 7 distinct characters, 32 × 7-distinct S3 secret, encoded-space padding and a space-padded S3 secret are rejected; 8 distinct characters pass; a double-encoded placeholder and `change--me` pass, as the narrowed AC17 now says.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Secrets guard (`ci.yml:82-100`)                                                                                      | Extracted verbatim, run as `bash --noprofile --norc -eo pipefail` in a scratch clone (markers assembled at run time). Baseline passes. **Fail**, as claimed: an upper-case gitleaks marker, the short Semgrep marker, an upper-case long Semgrep marker without a space, a nested `.semgrepignore`, a nested `.gitleaks.toml`, a new scorecard quoting a marker. **Pass** (defence-in-depth gaps only, since neither scanner honours markers now): a scorecard marker added then removed, a marker in `ci.yml`, a new marker in either exempt security review. `ff9ea59`'s own guard fails on `ff9ea59`, as the response says.                                                                                                                                      |
| Attribute overrides (`ci.yml:105`)                                                                                   | Scratch commit with `src/** export-ignore` plus a nested `* export-ignore`: `git archive HEAD` holds 1 `src/` entry without `.git/info/attributes`, all 71 tracked `src/` files with it. A nested `*.ts binary`: `git log -p` shows "Binary files differ" without the override and the text with it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| gitleaks (v8.30.1 per `go version -m`; the build the security reviewer left in the shared scratchpad, run read-only) | History with the pinned config, `--ignore-gitleaks-allow` and the override: no leaks. Exported tree: no leaks; a run-time-generated GitHub-token-shaped string planted in the exported tree: `leaks found: 1`, exit 1. **`dir` on a missing directory: warning "skipping … no such file or directory", "no leaks found", exit 0; on an empty directory: exit 0.** Same in the v8.30.1 source (`sources/files.go:65-72` returns `nil` on the root's error). With `--config` read from inside the tree, a missing tree exits 1.                                                                                                                                                                                                                                       |
| Telemetry check under `shell: bash`                                                                                  | `ci.yml:252` pipes `docker compose logs` into `grep -qi`; `grep -q` exits on the first match, and under the new `pipefail` the writer's broken-pipe status decides the `if`. The real `docker compose` binary exits 255 when its reader leaves early (0 when read to the end). Stand-in writer, telemetry at line 6: missed in 0/100 runs at 60 lines, 43/100 at 200, 100/100 at 2,000. **Real pinned SeaweedFS image with telemetry on** (own container and compose project, no published ports, removed): 145–165 log lines 20–60 s after start, first telemetry line at line 10; the step's exact `if` missed it in **78/100** runs with `docker logs` and **84/100** with `docker compose logs`. Capturing the log first missed 0/30 and passes on a clean log. |
| Production audit under `shell: bash`                                                                                 | pnpm 10.34.9 (`dist/pnpm.cjs:149547-149553`): with `--json`, `pnpm audit` exits 1 when any non-ignored advisory at or above `auditLevel` exists, default `low`. `ci.yml:71` gives no level, so under `pipefail` one Low or Moderate production advisory now fails the step although its `jq` checks High + Critical only; reproduced with a stand-in (old shell: pass; `shell: bash`: exit 1). `--audit-level=high` keeps today's result (`true`, exit 0).                                                                                                                                                                                                                                                                                                          |
| Audits                                                                                                               | `pnpm audit --json`: 3 High, all ignored (R-001…R-003), exit 0. `pnpm audit --prod --json`: 0 at every severity.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| CODEOWNERS                                                                                                           | Every listed path exists; covers `.gitattributes`, the lockfile, `scripts/`, the lint and gitleaks tests and fixtures, the proxy, start-up validation, both compose sources, `.env.example`, `.nvmrc`, `lighthouserc.json`, `CLAUDE.md` and the scorecards.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Repository settings                                                                                                  | `GET …/branches/main`: `"protected": false`; `…/rulesets`: 0; visibility public (N3, N6: owner actions).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Commits                                                                                                              | All 15 commits in the range are Conventional; `commitlint --from fe5b81c` gives 0 errors and 1 warning (`97f373f`: a body line starting `shell: bash` is parsed as a footer). `ff9ea59` fails its own CI guard until `41fd08f` (disclosed in the response). D1 and D2 unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Not reproduced here                                                                                                  | The full Compose `services` job (the CI job is green; only the object-store telemetry step was reproduced, above); the Semgrep rule packs (CI job green).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

## Mandatory gates (any red = score 0)

- [x] **CI green (lint, typecheck, test, build):** run 40619185963 at `a2d5e28`, 6/6 jobs,
      attempt 1; reproduced locally (`pnpm verify` exit 0; E2E 71 passed, 1 skipped).
- [x] **0 High/Critical security findings,** on this reviewer's evidence: production audit 0 at
      every severity, the three dev-only Highs register-gated, Semgrep and both gitleaks scans
      green in CI, history and tree clean here. The defects found below (a check that misses
      telemetry, a tree scan that passes when misconfigured) are Low/Info-class. **N3 (no ruleset
      on `main`) is still open as a Medium** and becomes High if this branch merges without it.
      The round-6 security review's verdict governs this gate; it was not available when this
      scorecard was written.
- [x] **axe: 0 violations:** E2E on `/fa`, `/en` and seven 404 shapes, desktop and mobile,
      locally and in CI; Lighthouse accessibility 100 in all 30 local runs.
- [x] **Lighthouse ≥ 95 mobile (DoD and the phase-00 gate):** the median assertion step passed in
      CI at `a2d5e28` (the step exits 1 on a failed assertion). The medians themselves could not
      be read here. Locally, both `a2d5e28` and the control `fe5b81c` fail at 91–94 on this
      loaded VM, so the local result says nothing about the code; see the notes.

## Code rubric

| Criterion                  | Weight  | Score     | Evidence / deductions                                                                                                                                                                                                                                                                                                                                  |
| -------------------------- | ------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Type safety                | 10      | 10        | `tsc` 0; ESLint `strictTypeChecked` 0; no `any`, `@ts-*` or non-null assertion in `src/`. The new `weakness()` helper is typed end to end.                                                                                                                                                                                                             |
| Lint & format              | 10      | 10        | ESLint and Prettier clean. L1-r5 fixed: `as`, `satisfies` and `!` around a literal are caught for every listed shape (probes above), with four fixture lines. The residuals (two-level token and button-value branches, a few DOM sinks) were known shapes in round 5 too and are not deducted; ADR 0015 must describe them correctly (D7, ADR table). |
| Tests                      | 20      | 19.25     | 150 unit tests at 100 %, 72 E2E; T8 fixed with a negative control that holds (measured). **−0.25 T7-r6** (the telemetry log check still misses telemetry in 84 of 100 runs), **−0.25 T10** (the `document.write` selector never matches `write`, and has no fixture line), **−0.25 T11** (the tree scan passes when the tree is missing or empty).     |
| Security                   | 20      | 20        | No High/Critical (rubric condition). Scanners now ignore inline markers; attributes overridden; tree scan added; env rules tightened; CODEOWNERS complete. The scanner-gate defects are scored under Tests, as rounds 4 and 5 did with Lows.                                                                                                           |
| Architecture & readability | 20      | 19.75     | A5 fixed: the 404 tree passes the locale explicitly everywhere, recorded in ADR 0018. Functions ≤ 40 lines, files ≤ 300. **−0.25 A6:** `shell: bash` was made the default for every step without checking each pipeline; it changed the meaning of the production audit gate.                                                                          |
| Performance                | 10      | 10        | Median assertion green in CI at `a2d5e28`; `/fa` and `/en` unchanged since `fe5b81c`; the local failures reproduce on `fe5b81c` too, so they measure the VM. Fonts unchanged.                                                                                                                                                                          |
| Documentation              | 10      | 9.0       | CHANGELOG, story (AC17), register (H6, H7, F7, G1/F10 rows), README, CODEOWNERS and ADRs updated; round-4 claims corrected in `82dc1b3`. **−0.5 D1** (plan reformat in `c2d2e84`), **−0.25 D2** (old multi-concern commits), **−0.25 D7-r6** (new statements that are not true, three of them negative controls that do not hold).                     |
| **Total**                  | **100** | **98.00** | At the gate: approved, with the fixes below still owed.                                                                                                                                                                                                                                                                                                |

### Deductions in detail

- **T7-r6 (−0.25): the telemetry log check still misses telemetry most of the time.**
  - `97f373f` replaced the negated pipeline with
    `if docker compose logs objectstore 2>&1 | grep -qi telemetry; then … exit 1; fi`
    (`.github/workflows/ci.yml:252-255`) and, in the same commit, made every step run with
    `pipefail` (`:22-27`).
  - `grep -q` exits at the first match. The telemetry line is line 10 of a 145–165-line log, so
    `docker compose logs` usually still has lines to write, gets a broken pipe and exits 255.
    Under `pipefail` the pipeline's status is then 255, the `if` takes the "no match" branch, and
    the step passes.
  - Measured against the real pinned image with telemetry on: missed in 84/100 runs with
    `docker compose logs`, 78/100 with `docker logs`. The author's single negative control
    happened to land in the minority. Capturing the log first missed 0/30.
  - The check exists to catch a flag that is still set but no longer works after an image update,
    which is exactly when the log length changes. The `jq` config check (`:249-250`) still holds,
    so telemetry is still asserted off by configuration.
- **T10 (−0.25): the `document.write` selector does not match `document.write`, and nothing tests it.**
  - `eslint.config.mjs:134`: `/^writeln?$/` reads as "writel, optionally followed by n". It
    matches `writeln` and never `write`.
  - `tests/fixtures/src/shared/ui/unsafe-code.tsx` has no line for either call, although `b38e0b4`
    says "each now has a selector and a fixture line", the round-5 response (H5 row) lists
    `document.write` among the fixture lines, and ADR 0015:40-41 says every rule has one.
  - `document.write` still fails lint today, but only through `@typescript-eslint/no-deprecated`,
    which is the very situation `b38e0b4` set out to change. The fixture line that ADR 0015
    requires would have caught the regex (verified: it fails on the current config).
- **T11 (−0.25): the tree scan passes when there is no tree.**
  - `.github/ci-tools/compose.yaml:24-25` says "without that mount /tree does not exist and the scan
    fails", and `ab43280` says "a run without the tree mount fails".
  - gitleaks v8.30.1 logs a warning for a missing root, reports "no leaks found" and exits 0
    (measured, and in the source). An empty directory gives the same result, and
    `docker run -v` on a missing host path mounts an empty one.
  - So removing or mis-pointing the mount in `ci.yml:116-117`, or an archive that extracts
    nothing, leaves the gate green while scanning nothing. The claimed negative control does not
    hold.
- **A6 (−0.25): `pipefail` changed what the production audit gate enforces.**
  - `ci.yml:71`: `pnpm audit --prod --json | jq -e '.metadata.vulnerabilities | (.high + .critical) == 0'`.
    With `--json`, pnpm exits 1 for any non-ignored advisory at or above `low`
    (`pnpm.cjs:149547-149553`). Before `97f373f` only `jq`'s status counted; now one Low or
    Moderate advisory in `next`, `react` or `zod` fails the step on every push and on the weekly
    run.
  - ADR 0016:48 still describes this gate as High/Critical only, and `97f373f`'s body says every
    audit step "passes under the new shell", which is true only because there is no production
    advisory today.
  - The same unchecked global default caused T7-r6. Each pipeline needs reading once under the new
    shell, and `ci.yml:22-24` should say which idioms it breaks (early-exit readers, writers that
    exit non-zero on purpose).
- **D1 (−0.5) and D2 (−0.25): unchanged.**
  - `c2d2e84 build: …` still carries the 356-line Prettier reformat of the maintainer's
    `docs/project-plan.md`.
  - `d0d1e50`, `a701e1f`, `3441445`, `7e101c2`, `5af3007` and `c25ba2d` still mix concerns.
    `ff9ea59` is now also a commit that fails its own CI gate.
  - Fixing either needs a history rewrite, and the product owner has not approved a force-push.
    No written waiver exists. A squash merge does not satisfy "one concern per commit".
- **D7-r6 (−0.25): new statements that are not true.**
  - Negative controls that do not hold:
    - telemetry: `97f373f` body, `foundation-round-5-response.md:21` (T7-r5 row) and
      `foundation-round-4-response.md:54-56` say the step "now fails" with telemetry on; it does
      in about 16 of 100 runs (T7-r6);
    - tree scan: `ab43280` body, `foundation-round-5-response.md:34` (H2 row) and
      `.github/ci-tools/compose.yaml:24-25` (T11);
    - fixture lines: `b38e0b4` body, `foundation-round-5-response.md:37` (H5 row) and ADR
      0015:40-41 together with `:77` (T10).
  - ADR 0015:93-95, "branches nested deeper than two levels": token and button-value selectors see
    one level (`eslint.config.mjs:54, 59, 75, 98`). `padding: (ok ? 8 : 16) as number` and
    `('red' as const) satisfies string` lint clean. Round 5 gave the correct figure.
  - ADR 0013:5 and ADR 0014:5 say "Amended after round 5; re-score pending"; neither ADR changed
    after round 5 apart from that line.
  - ADR 0016:69-70: "an inline marker in any commit outside the review scorecards". The history
    check also skips `.github/workflows/ci.yml` (`ci.yml:93`), whose old versions contain the
    markers.
  - ADR 0018:73-74 and `dd81d7d`: the link pointed to `/fa` "after hydration". The served HTML
    already had `href="/fa"` (measured on the negative-control build).

## Round-5 fixes: verification

| #              | Claimed fix                                                      | Verified?                   | Evidence                                                                                                                                                                                                                    |
| -------------- | ---------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A5, T8         | Explicit locale on the 404 link; E2E checks raw HTML and browser | **Yes**                     | `not-found/index.tsx:15`; `e2e/not-found.spec.ts:27, 39`; negative control fails exactly the four `/en` checks.                                                                                                             |
| T7-r5          | `if … exit 1` and `shell: bash`                                  | **No (still mostly inert)** | The check can fail now, but misses telemetry in 84/100 runs under the `pipefail` the same commit added (T7-r6); the change also altered the production audit gate (A6).                                                     |
| T9             | Scanners ignore markers; tree check for scorecards; CODEOWNERS   | **Yes**                     | `compose.yaml:20, 35, 50`; `ci.yml:91-100`; the guard cases above; `CODEOWNERS:41`. Remaining history gaps are defence in depth only.                                                                                       |
| L1-r5          | Wrappers count as a branch                                       | **Yes**                     | `eslint.config.mjs:14-15`; fixtures `token-bypasses.tsx:21-22`, `literal-text-bypasses.tsx:16-17`; probes above.                                                                                                            |
| D7             | Untrue statements corrected                                      | **Mostly**                  | `next.config.ts:42-43`, `e2e/not-found.spec.ts:7, 10`, AC17, `CHANGELOG.md:11`, `env.ts:3-6`, `README.md:47-49`, ADR 0016:59-72, `docs/adr/README.md:24-27` all corrected. New ones in D7-r6.                               |
| H1             | Scanner flags, attributes override, any-depth file test          | **Yes**                     | Measured: guard cases, `export-ignore` and `!diff` overrides, flags in `compose.yaml`.                                                                                                                                      |
| H2             | Tree scan, redaction, merge-method note                          | **Partly**                  | Tree scan works when mounted (planted token found; tree clean) and `export-ignore` is neutralised; redaction at `security-foundation-round-4.md:85`; register row 39. The "fails without the mount" control is false (T11). |
| H4             | CODEOWNERS paths and wording                                     | **Yes**                     | All paths exist; `CODEOWNERS:1-5` and ADR 0016:79-84 say the owner reads the diff.                                                                                                                                          |
| H5             | Raw-HTML selectors with fixture lines                            | **Partly**                  | Five of six new selectors fire with fixture lines; `document.write` neither (T10).                                                                                                                                          |
| H6             | Trimmed passwords, 8 distinct characters                         | **Yes**                     | `env.ts:54-69`; `env.test.ts:126-138`; probes above.                                                                                                                                                                        |
| H7, F7, G1/F10 | Register rows                                                    | **Yes**                     | `risk-register.md:36-38`.                                                                                                                                                                                                   |
| ADR items      | 0015 false negatives, 0016 wording, 0017 FCP, 0018 trade-offs    | **Mostly**                  | See the ADR table. 0015's depth figure is wrong; 0016 omits the tree scan's lack of an exception path.                                                                                                                      |
| D1, D2         | History                                                          | No (owner)                  | Unchanged; no waiver recorded.                                                                                                                                                                                              |

Commit-body measurements: `dd81d7d` (the browser check fails on the previous code) verified;
`d90cb29` (four fixture lines, allowed shapes clean) verified; `c0605d3` verified; `ff9ea59`
(negative cases fail the guard) verified; `41fd08f` (baseline passes, a new scorecard quoting a
marker fails; `ff9ea59` failed its own guard) verified; `ab43280` (`export-ignore` neutralised,
checked locally) verified, but "a run without the tree mount fails" is false; `97f373f` ("the
step now fails") holds in a minority of runs; `b38e0b4` ("each now has a selector and a fixture
line") is false for `document.write`. ADR 0017's `/en` and `/fa` FCP figures reproduce
(1,072–1,097 ms and 772–997 ms here); its CI medians at `fe5b81c` could not be checked.

## Phase-00 deliverables (`docs/phases/phase-00.md`, PRs 0.1–0.4)

| PR  | Deliverable                                                                | Status               | Evidence                                                            |
| --- | -------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------- |
| 0.1 | Next.js App Router, strict TS + `noUncheckedIndexedAccess`, pnpm, `.nvmrc` | Done                 | `tsconfig.json`, `package.json`, `.nvmrc`                           |
| 0.1 | Strict ESLint + `eslint-plugin-boundaries`                                 | Done (T10 residual)  | `eslint.config.mjs`; boundary fixtures                              |
| 0.1 | Prettier, Husky + lint-staged, Commitlint                                  | Done                 | `.husky/*`, configs; CI commitlint                                  |
| 0.1 | `pnpm verify`; module folders with `index.ts`                              | Done                 | `package.json`; ten modules                                         |
| 0.2 | Compose: Postgres (`btree_gist`), Redis, MinIO                             | Done, with deviation | SeaweedFS (ADR 0013, owner acceptance pending); CI `services` green |
| 0.2 | `env.ts` validation; `.env.example` placeholders only                      | Done                 | Measured above                                                      |
| 0.3 | next-intl `fa`/`en`, `[locale]`, `dir`/`lang`                              | Done                 | E2E; the 404 link now follows the page's locale                     |
| 0.3 | Self-hosted WOFF2 subsets; Peyda slot; formatters at 100 %                 | Done                 | Coverage 100 %                                                      |
| 0.4 | Actions: cached install, verify, Playwright fa/en, LHCI                    | Done                 | `ci.yml:156-207`                                                    |
| 0.4 | Vitest 90 % threshold on `domain`; axe in Playwright                       | Done                 | `vitest.config.mts`; `hello.spec.ts`, `not-found.spec.ts`           |
| —   | **Phase gate:** green pipeline, bilingual RTL hello page, Lighthouse ≥ 95  | **Met (CI)**         | CI green, median assertion green; not reproducible on this VM       |

`docs/phases/phase-00.md:15` still names MinIO, so PR 0.2 must not be ticked until the owner
accepts ADR 0013 or amends the phase file. This reviewer ticked nothing.

## ADR scores (rubric: problem 20 · alternatives 20 · trade-offs 25 · Iran fit 20 · revisit 15)

| ADR                         | Problem | Alternatives | Trade-offs | Iran fit | Revisit | Total   | Reasons for every point lost                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------- | ------- | ------------ | ---------- | -------- | ------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0013 SeaweedFS for local S3 | 20      | 19           | 25         | 20       | 15      | **99**  | Unchanged since round 5. −1 alternatives: option D is rejected without being tried (`:39`). Its header wrongly says it was amended after round 5 (D7-r6). Its CI telemetry claim (`:55-56`) still holds through the configuration check.                                                                                                                                                                                                                                                                  |
| 0014 Toolchain baseline     | 20      | 20           | 25         | 20       | 15      | **100** | Unchanged since round 5 (header as for 0013).                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 0015 Rule enforcement       | 20      | 20           | 23         | 20       | 15      | **98**  | Round 5's −1 largely fixed (syntactic misses and the `format(undefined)` clock residual are now named). −1 trade-offs: the Risk (`:93-95`) puts the depth limit at two levels; for tokens and button values it is one, and two-level shapes lint clean (measured). −1 trade-offs: the Decision (`:40-41`, `:77`) presents `document.write` as a fixture-proven ban; the selector misses it and has no fixture, so the "proven by tests" property the ADR rests on does not hold for every rule.           |
| 0016 Supply-chain controls  | 20      | 20           | 24         | 20       | 15      | **99**  | Both round-5 points fixed (no blanket "any commit" claim; CODEOWNERS described as the owner reading the diff). −1 trade-offs (new): the Risk (`:95-97`) says false positives are handled with the tool's allowlist and a reason, but the tree scan (`:60-62`) has no exception path (`.gitleaksignore` entries are commit-bound, and global fingerprints are rejected by `tests/gitleaksignore.test.ts`). Any test value that looks like a secret must be built at run time from now on; state that cost. |
| 0017 Font delivery          | 20      | 20           | 25         | 20       | 15      | **100** | The `/en` FCP figure was added; reproduced here.                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 0018 Not-found handling     | 20      | 20           | 25         | 20       | 15      | **100** | Both round-5 points fixed: the unexported header dependency is a Risk with a revisit trigger, and the second locale source is stated with its rule. "After hydration" (`:74`) is a wording slip (D7-r6), not a missing trade-off.                                                                                                                                                                                                                                                                         |

## Required fixes, in order (file:line → fix)

1. **T7-r6** `.github/workflows/ci.yml:252-255`:
   - replace the `if` with
     ```bash
     logs=$(docker compose logs objectstore 2>&1)
     if grep -qi telemetry <<<"$logs"; then
       echo '::error::object-store telemetry is on'
       exit 1
     fi
     ```
     (measured: 0/30 misses against the real image with telemetry on; passes on a clean log);
   - extend the comment at `:22-24`: under `pipefail`, never pipe into a reader that exits early
     (`grep -q`, `head`); capture into a variable first;
   - prove it against a stack started with telemetry on, at least 20 runs, and correct
     `foundation-round-5-response.md:21` and `foundation-round-4-response.md:54-56`.
2. **A6** `.github/workflows/ci.yml:71`:
   - `pnpm audit --prod --audit-level=high --json | jq -e '.metadata.vulnerabilities | (.high + .critical) == 0'`
     (verified: `true`, exit 0 under `pipefail` today). Then pnpm's own status means the same as the
     `jq` condition, and ADR 0016:48 is true again;
   - read every other pipeline in `ci.yml` once under `shell: bash` and record the result in the
     commit body.
3. **T11** `.github/ci-tools/compose.yaml:24-37`:
   - drop the separate `./gitleaks.toml:/config/gitleaks.toml:ro` volume and pass
     `--config /tree/.github/ci-tools/gitleaks.toml`. The tree is HEAD, so it is the same pinned
     file the history scan reads, and a missing or empty `/tree` then exits 1 (verified with
     v8.30.1);
   - fix the comment at `:24-25` to say why it fails, and prove the negative control by running
     the step without the `-v` mount.
4. **T10** `eslint.config.mjs:134`:
   - `"CallExpression[callee.object.name='document'][callee.property.name=/^write(?:ln)?$/]"`;
   - after `tests/fixtures/src/shared/ui/unsafe-code.tsx:16` add
     `export const written = (html: string): void => { document.write(html); }; // expect: no-restricted-syntax, @typescript-eslint/no-deprecated`;
   - `tests/lint-rules.test.ts:176`: `toHaveLength(9)` → `toHaveLength(10)`.
   - Verified here: the fixture line fails on the current regex (2 tests) and passes with the fix
     (51/51).
5. **D7-r6**, after fixes 1–4:
   - the three negative-control claims: correct the response rows and the round-4 correction
     (fix 1); `compose.yaml:24-25` (fix 3);
   - ADR 0015:93-95: "branches nested deeper than one level for token values and button values,
     and deeper than two for text attributes and JSX children";
   - ADR 0013:5 and ADR 0014:5: "Not amended since round 5";
   - ADR 0016:69-70: "outside the review scorecards and `ci.yml`, whose old versions name the
     markers";
   - ADR 0018:73-74 and the `dd81d7d` wording: "pointed to `/fa` on the English 404, in the
     served HTML and after hydration";
   - `CHANGELOG.md:17`: also name the second gitleaks scan of the current tree and the
     `shell: bash` default.
6. **ADRs:**
   - write the scores above into `docs/adr/0013…0018:5` and `docs/adr/README.md:17-22`;
   - 0015: both trade-off corrections above (depth figure; `document.write` once fix 4 lands);
   - 0016: add to the Risk at `:95-97`: "the tree scan has no exceptions, so a value that looks
     like a secret can never be committed as text; tests build such values at run time".
7. **D1 + D2:** the product owner either approves a force-push to this branch (move the
   `docs/project-plan.md` hunk out of `c2d2e84`; split `d0d1e50`, `a701e1f`, `3441445`, `7e101c2`,
   `5af3007`, `c25ba2d`; fold `41fd08f`'s pattern change into `ff9ea59` so no commit fails its own
   gate), or records a written waiver. Either removes these deductions; a squash merge does not.
8. **Product owner, outside the diff:**
   - add the `main` ruleset before merging (N3; still `protected: false`, 0 rulesets), with merge
     commits and squash merges allowed and rebase merges not (register row 39);
   - accept ADR 0013 or amend `docs/phases/phase-00.md:15`;
   - decide repository visibility (N6);
   - answer the plan §11 questions that keep ADRs 0010 and 0011 `Proposed`.

## Notes (not deducted)

- **Lighthouse margin.** CI passed its median assertion at `a2d5e28`, but on this VM both
  `a2d5e28` and `fe5b81c` now land at 91–94 (TBT up to 1,162 ms, simulated LCP up to 3,052 ms),
  where round 5 measured 98/97 on the same commit. Lighthouse's simulation scales with the
  machine's CPU benchmark, so a slower or busier CI runner can turn this gate red without a code
  change. Never re-run a red job until it turns green; raise `numberOfRuns` (odd) if it starts to
  flake. Printing the two median rows as a `::notice` annotation (served by the plain API) would
  let any reviewer quote the CI medians; still not done.
- `ci.yml:97-99`: `|| true` also hides a `git grep` error (exit 2), so a broken pattern passes.
  Accept only exit 1: `quoted=$(git grep …) || [ $? -eq 1 ]`.
- The history marker check passes a scorecard marker that is added and later removed, a marker
  in `ci.yml`, and a new marker in either exempt security review. This is acceptable because both
  scanners now ignore markers. Keep it described as defence in depth.
- Lint residuals beyond fix 4, for ADR 0015 or the security review: `frame.srcdoc = html` (the
  DOM spelling of the banned `srcDoc`), `setHTMLUnsafe`, `Document.parseHTMLUnsafe`, a
  computed-literal callee (`node['insertAdjacentHTML'](…)`), a template-literal `innerHTML`
  member and `Object.assign(node, { innerHTML })`; two-level token and button-value branches.
- `.gitleaksignore:8-9` says the round-4 scorecard "quotes" the value; since `ab43280` only commit
  `6ef68e1` does.
- `eslint.config.mjs:80-84` still describes the text rules as covering branches only; the
  `BRANCH` JSDoc at `:10-13` is current.
- `97f373f`'s body triggers a commitlint `footer-leading-blank` warning (a line starting
  `shell: bash`). Rephrase such lines in future bodies.
- Round-4/5 notes that still stand (files untouched in this range): `money.ts:22` and
  `date.ts:22` default to the literal `'fa'`, and `(site)/page.tsx:21` hard-codes the locale
  toggle; `scripts/check-package-manager.ts:32` reads `{ pnpm: null }` as no advisories. The
  global 404 is rendered per request and belongs in the Phase 5 rate limits.
