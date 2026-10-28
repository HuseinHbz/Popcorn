# Scorecard — Phase 0 / Platform foundation (round 7)

- Reviewer: code-reviewer (fresh session, round 7; did not write this code)
- Date: 2026-10-28
- Verdict: **Approved — 98.25 / 100** (gate ≥ 98). All mandatory gates are green, including the
  round-7 security review's Pass (0 Critical, 0 High). The merge still needs the product owner to
  add the `main` ruleset (N3) first. The fixes listed below are still owed; a score above the gate does not
  make any of them optional.
- Scope: the whole branch against `origin/main` (HEAD `a3d1e29`, 142 non-merge commits and one
  merge), focused on `git log a2d5e28..a3d1e29`: 20 fix commits (`15d1478`…`4aa7833`), the
  round-6 scorecards (`7b8e3f9`), the ADR amendments and scores (`3145280`, `d838bbe`), README and
  CHANGELOG (`2d31f1a`), the register (`f1378d5`), the corrections of the round-4 and round-5
  responses (`01d443a`) and the round-6 response (`a3d1e29`). `.claude/commands/*` and
  `docs/phases/*` belong to the maintainer and were read, not scored.
- Inputs read: `CLAUDE.md`, `docs/project-plan.md` §3 and §8, `docs/phases/phase-00.md`,
  `.claude/commands/review.md`, `.claude/agents/code-reviewer.md`,
  `docs/stories/platform-foundation.md`, ADRs 0013–0018 and the ADR index,
  `docs/security/risk-register.md`, `foundation-round-6.md`, `foundation-round-6-response.md`, the
  corrections at the end of `foundation-round-4-response.md` and `foundation-round-5-response.md`,
  and `security-foundation-round-6.md`. The round-7 security review appeared at the end of this
  review: its gate verdict was read, and its K4 was reproduced here independently and is scored
  (T14); its other findings were not re-scored here. Every claim in the round-6 response and in the 27 commit bodies of the
  range was checked here wherever it could be reproduced, including the negative controls.

## Evidence collected by this reviewer at `a3d1e29`

| Check                                 | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Environment                           | Own clone at `a3d1e29`; `cp .env.example .env` (gitignored, not committed); `pnpm install --frozen-lockfile --offline`: up to date. Local Node 22.22.0 is below `engines >=22.23.4`; pnpm only warns (ADR 0014). The Docker daemon stopped while this review was running; this reviewer restarted it and left it running, as it was found at the start.                                                                                                                                                                                 |
| `pnpm verify`                         | **exit 0**: typegen, ESLint (`--max-warnings=0`) and the CSS colour check, Prettier, `tsc`, Vitest **18 files / 153 tests** (150 + the null advisory list, the gitleaks-version test and the notices test), coverage 100 % (statements 81/81, branches 33/33, functions 20/20, lines 71/71), `next build`: `ƒ /_not-found`, `● /fa`, `● /en`.                                                                                                                                                                                           |
| `CI=1 PORT=3500 pnpm e2e`             | **71 passed, 1 skipped** (72 tests); no retry used.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| GitHub CI run 40670345287 (`a3d1e29`) | Event `push`, attempt 1, **6/6 jobs success**; every step success (the failure-only Playwright upload skipped). Check-run annotations, read through the plain API: **"Lighthouse /fa (5 runs)": performance 98 (80–99)**, **"Lighthouse /en (5 runs)": performance 97 (95–98)**, accessibility, best practices and SEO 100 on both; Playwright "71 passed, 1 skipped". The job logs are still served from a blob host this reviewer's proxy refuses.                                                                                    |
| Telemetry log check (T7-r6)           | Own compose project (`coder7`), the pinned SeaweedFS digest, cached Postgres and Redis images, ports moved in a scratch clone's `.env`, overrides outside the repository. With `-master.telemetry=true` appended: telemetry at line 11 of 140; the config check fails first (`false`, exit 1). Without the config check, the committed log check caught telemetry in **40/40** runs; the previous `… \| grep -qi` caught it in 7/40. With the committed configuration all ten steps 02–11 pass when run as Actions runs them.           |
| Production audit (A6)                 | Both audit steps exit 0 when run as Actions runs them. In the pinned pnpm 10.34.9 (`corepack/v1/pnpm/10.34.9/dist/pnpm.cjs:149546-149553`), `--json` exits 1 only for non-ignored advisories at or above `--audit-level`, while `metadata.vulnerabilities`, which `jq` reads, keeps the ignored ones. `pnpm audit --prod --json`: 0 at every severity. Full audit: 3 High, all ignored (R-001…R-003).                                                                                                                                   |
| Secrets job (T11, J1, J2, J3, J5)     | Local image built from the cached gitleaks binary, whose build info records module `v8.30.1` with the published hash; the image was swapped in only in scratch clones. Steps 01, 02, 04 and 05 pass when run as Actions runs them. The tree report holds exactly one finding, `github-pat` in `/tree/.ci-canary`. History with the CI log options: 144 commits, 1.94 MB, no leaks (1.37 MB without `-m`). `gitleaks-skipped-paths.txt` equals v8.30.1's `[allowlist] paths` (25/25, read from the module source).                       |
| Secret-scan negative controls         | One token generated at run time per case, never printed; the clones were deleted afterwards. See the table below.                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Semgrep (J5)                          | Pinned image, offline, with one local `eval` rule in place of the packs: the step's export and ignore file give 82 files scanned, 11 under `tests/`, none under `tests/fixtures/`, and the `jq` check passes. Without the ignore file: 71 files, none under `tests/`, `jq` fails. Empty tree: exit 2, no report. Tracked files under `.gitignore` patterns (`src/dist/…`, a new `.gitignore` line) are still scanned in the export.                                                                                                     |
| Lint negative controls                | The old `/^writeln?$/` fails 2 tests in `tests/lint-rules.test.ts`, as `444faf9` says. Dropping the second level from `branches` fails 4 tests (`7cba218`). With `63169e9`'s parent config, exactly lines 27–32 of `unsafe-code.tsx` go unreported, as its body says. `7cba218`'s selector counts are 32 and 39 (28 and 35 before).                                                                                                                                                                                                     |
| Lint probes (scratch files, deleted)  | Lint-clean, and accepted by `tsc`: `node.insertAdjacentHTML.call(…)`, `Range.prototype.createContextualFragment.call(…)`, `parser.parseFromString.bind(parser)`, `node.setHTMLUnsafe.call(…)`, `[node.innerHTML] = [html]`, `({ x: node.outerHTML } = { x: html })`, `node.setAttributeNS(null, 'onclick', …)`, and `setAttribute` with a template-literal `onclick`. `document.write.call(…)` is caught only by `no-deprecated`. The four selectors in fix 5 catch all eight; `pnpm lint` and the 51 lint tests still pass with them.  |
| Lint scope by extension (security K4) | Probe files, deleted: a `.js` file in `src/modules/orders/domain/` that assigns `innerHTML`, uses `color: 'red'` and calls `Date.now()`, and a `.mts` file in `src/shared/ui/` that assigns `innerHTML`: **`eslint --max-warnings=0` reports nothing** for either; the `.ts` control is reported. `eslint --print-config` for the `.mts` file: `no-restricted-syntax` and `boundaries/dependencies` unset. `next.config.ts` sets no `pageExtensions`. A test that rejects such files passes at HEAD and fails on a stray `.js` (fix 3). |
| `ci.yml` pipes                        | Every remaining pipe was re-read: `jq`, `tar`, `tee`, `awk` and `curl --data-binary @-` read their whole input. `git grep` with an unbalanced pattern now fails the step, and a pattern with no match passes (`c9cb1e1`).                                                                                                                                                                                                                                                                                                               |
| CODEOWNERS                            | Catch-all first; every named path exists; `GET …/codeowners/errors?ref=chore/phase-0-foundation`: `[]`.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Repository settings                   | `GET …/branches/main`: `"protected": false`, `main` still at `049877d`; `…/rulesets`: 0; visibility public; no pull request yet (N3, N6: owner actions).                                                                                                                                                                                                                                                                                                                                                                                |
| Commits                               | All 27 commits in the range are Conventional; `commitlint --from a2d5e28`: 0 problems, 0 warnings. On the whole branch, 2 warnings remain in history (`97f373f`, `86a4095`; `footer-leading-blank`). D1 and D2 unchanged.                                                                                                                                                                                                                                                                                                               |
| Not reproduced here                   | The Semgrep registry packs (unreachable; the CI job is green); Lighthouse locally (the CI medians were readable, so this loaded VM was not used).                                                                                                                                                                                                                                                                                                                                                                                       |

### Secret-scan negative controls (secrets job steps run as Actions runs them)

| Case                                                                                        | Guard                             | History scan     | Tree step                                      |
| ------------------------------------------------------------------------------------------- | --------------------------------- | ---------------- | ---------------------------------------------- |
| Control: token in `src/leak.ts`                                                             | pass                              | `leaks found: 1` | fails (canary + `src/leak.ts`)                 |
| UTF-16 text file, no attribute                                                              | **fails** ("binary content")      | no leaks         | passes                                         |
| `src/app/badge.svg`, text, token in a comment                                               | **fails** ("skips … by its name") | no leaks         | passes                                         |
| `src/shared/config/gitleaks.toml` with a token                                              | **fails**                         | no leaks         | passes                                         |
| `.gitattributes` `working-tree-encoding=UTF-16LE-BOM` on a `.ts` file                       | pass                              | `leaks found: 1` | **fails** (exported as UTF-8)                  |
| Token added in a merge resolution, deleted one commit later                                 | pass                              | `leaks found: 2` | passes (not at HEAD)                           |
| Symlink turned into a file with a token, deleted one commit later                           | pass                              | `leaks found: 1` | passes (not at HEAD)                           |
| Persian-named `.ts` file with a token                                                       | pass                              | `leaks found: 1` | **fails**                                      |
| **Persian-named text `.svg` with a token (`src/app/` + a Persian name + `.svg`)**           | **pass**                          | **no leaks**     | **passes**: the secret passes every gate (T12) |
| **Committed `.ci-canary` with a token, exempted in history by a fingerprint with a reason** | **pass**                          | **no leaks**     | **passes**: the canary overwrites it (T13)     |

The last two rows are new defects. The Persian-named case fails the guard once `core.quotePath` is
off (fix 1). The `.ci-canary` case fails the tree step once the step refuses an existing file
(fix 2). With either fix, `a3d1e29` itself still passes.

## Mandatory gates (any red = score 0)

- [x] **CI green (lint, typecheck, test, build):** run 40670345287 at `a3d1e29`, 6/6 jobs,
      attempt 1; reproduced locally (`pnpm verify` exit 0; E2E 71 passed, 1 skipped).
- [x] **0 High/Critical security findings,** on this reviewer's evidence: production audit 0 at
      every severity, the three dev-only Highs gated by the register, and Semgrep and both gitleaks
      scans green in CI; history and tree are clean here. The two scanner-gate gaps found below
      (T12, T13) are Low/Info-class: each needs a deliberately chosen file name, and T13 also an
      exception that shows in the diff. **N3 (no ruleset on `main`) is still open as a Medium**, and
      it becomes High if this branch merges without the ruleset. The round-7 security review's
      verdict governs this gate: **Pass, 0 Critical, 0 High** (`security-foundation-round-7.md`,
      read at the end of this review).
- [x] **axe: 0 violations:** E2E on `/fa`, `/en` and seven 404 shapes, desktop and mobile,
      locally and in CI; Lighthouse accessibility 100 in every CI run.
- [x] **Lighthouse ≥ 95 mobile (DoD and the phase-00 gate):** CI medians at `a3d1e29` are 98
      (`/fa`) and 97 (`/en`), read from the annotations `a01964b` added; the median assertion
      step passed.

## Code rubric

| Criterion                  | Weight  | Score     | Evidence / deductions                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------- | ------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type safety                | 10      | 10        | `tsc` 0; ESLint `strictTypeChecked` 0; no `any`, `@ts-*` or non-null assertion in `src/`. `parseAdvisories` and `lighthouseNotices` are typed end to end.                                                                                                                                                                                                                              |
| Lint & format              | 10      | 10        | ESLint and Prettier clean. T10 fixed and proven (negative control above). Every rule now goes two levels deep, as ADR 0015 says. The new lint-clean shapes are method indirection and destructuring, which were never listed; they are not deducted here (the same policy as rounds 5 and 6), but ADR 0015 must name them or ban them (fix 5).                                         |
| Tests                      | 20      | 19.25     | 153 unit tests at 100 %, 72 E2E. T7-r6, T10 and T11 fixed, with negative controls that hold (measured). **−0.25 T12** (the skipped-name guard misses any non-ASCII path, because `git ls-files` quotes it), **−0.25 T13** (the tree-scan canary overwrites a committed `.ci-canary`), **−0.25 T14** (every project lint rule is off for a `.js`, `.mts` or similar file under `src/`). |
| Security                   | 20      | 20        | No High/Critical (the rubric's condition). Merge diffs and type changes are scanned; the attributes override covers `working-tree-encoding`; binary text is rejected; Semgrep reads `tests/`; the telemetry checks fail closed. The scanner-gate gaps are scored under Tests, as in rounds 4–6.                                                                                        |
| Architecture & readability | 20      | 20        | A6 fixed: pnpm's exit status and the `jq` condition now mean the same thing, and the workflow comment (`ci.yml:22-30`) names both pipe idioms. The `branches` helper replaces the hand-written levels. Functions ≤ 40 lines; files ≤ 300 by the lint rule's count (`ci.yml` 268 lines without comments and blanks). Small duplications are in the notes.                               |
| Performance                | 10      | 10        | CI medians 98 and 97 at `a3d1e29`, assertion green; no change to `/fa` or `/en` output beyond the toggle refactor; fonts unchanged.                                                                                                                                                                                                                                                    |
| Documentation              | 10      | 9.0       | Response, corrections, ADRs, README, CHANGELOG, register, `.env.example` and `.gitleaksignore` updated. The round-6 D7 items are all corrected. **−0.5 D1** (plan reformat in `c2d2e84`), **−0.25 D2** (old multi-concern commits), **−0.25 D7-r7** (new statements that T12 and T13 make untrue).                                                                                     |
| **Total**                  | **100** | **98.25** | At the gate: approved, with the fixes below still owed.                                                                                                                                                                                                                                                                                                                                |

### Deductions in detail

- **T12 (−0.25): the skipped-name guard never sees a non-ASCII file name.**
  - `.github/workflows/ci.yml:111` and `:116` read `git ls-files --eol`. With the default
    `core.quotePath`, git prints a non-ASCII path quoted and octal-escaped, for example
    `"src/app/\331\206….svg"`. The extension patterns end in `$`, so they never match the trailing
    quote.
  - gitleaks matches its built-in allowlist against the real path, so it skips the file in both
    scans. Measured: a text `.svg` with a Persian name, holding a token, passes the guard, the
    history scan and the tree step. A Persian-named `.ts` file is still found, so the gap is only
    on the 25 skipped-name patterns.
  - The same quoting makes the binary check fail a Persian-named font or image as "binary content"
    (fail-closed, but a false red).
  - In a Persian-language project, Persian file names are a realistic input. `097d425`'s claim
    "the guard fails on any text file that matches it except the three expected ones" does not
    hold for them. Whether Semgrep's secrets pack would still catch a provider-format token there
    could not be checked offline.
- **T13 (−0.25): the canary destroys a committed file of the same name.**
  - `ci.yml:145` writes the canary with `>` into `$tree/.ci-canary`, a name that `git archive`
    can also produce.
  - Measured: commit `.ci-canary` holding a token, and add a `.gitleaksignore` fingerprint with a
    written reason (it passes `tests/gitleaksignore.test.ts`). The guard passes and the history
    scan honours the exception. The tree step overwrites the committed file with the canary, finds
    exactly the canary and passes. The secret stays at HEAD with every job green.
  - That is exactly what the tree scan exists to prevent: ADR 0016:63-66 says "with no exceptions,
    so neither an exception nor … can leave a secret-like value in the tree". The exception would
    show in the diff, which keeps this Low; but the tree scan is the control for an exception that
    is missed in review.
- **T14 (−0.25): the project lint rules apply only to `.ts` and `.tsx` files.**
  - `eslint.config.mjs:284` scopes the boundaries rule, `no-restricted-syntax` (tokens, i18n,
    raw HTML) and `react/jsx-no-literals` to `src/**/*.{ts,tsx}`; `:307-312` scope the purity
    rules the same way. Next.js builds `.js` and `.mts` sources without complaint, and
    `allowJs: false` only stops `tsc` from reading them.
  - Measured (probe files, deleted): a `.js` file in a module's `domain/` that assigns
    `innerHTML`, uses a raw colour and reads the clock, and a `.mts` file that assigns
    `innerHTML`, both lint clean. `src/` holds only `.ts`/`.tsx` sources today, so nothing is
    broken yet.
  - This is the whole-file version of the gaps scored in rounds 5 and 6, and it needs no
    contrived shape: `.js` is what most snippets are written in. AC8 and AC16 and ADR 0015:74
    ("banned everywhere") do not hold for such a file. Also reported by the round-7 security
    review as K4.
- **D1 (−0.5) and D2 (−0.25): unchanged.**
  - `c2d2e84 build: …` still carries the 356-line Prettier reformat of the maintainer's
    `docs/project-plan.md`.
  - `d0d1e50`, `a701e1f`, `3441445`, `7e101c2`, `5af3007` and `c25ba2d` still mix concerns, and
    `ff9ea59` still fails its own CI gate.
  - Fixing either needs a history rewrite, which the product owner has not approved; no written
    waiver exists. A squash merge does not satisfy "one concern per commit".
- **D7-r7 (−0.25): new statements that are not true.**
  - T12:
    - ADR 0016:81-84 ("a text file on gitleaks' built-in path allowlist … fails CI unless it is
      one of three expected files");
    - README.md:49 and CHANGELOG.md:17 ("name-skipped text files rejected");
    - `foundation-round-6-response.md:61` (J5 row);
    - the `097d425` body;
    - the register's blind-spot row (`risk-register.md:41`), which names only the three expected
      files.
  - T13: ADR 0016:63-66 and :115-117 ("a value that looks like a secret can never stay in the
    tree as text").
  - T14: ADR 0015:74 ("banned everywhere") and :40-41 ("Every rule below has a fixture"), which
    hold only for `.ts` and `.tsx` files.
  - Everything else claimed in the range was reproduced: the numbers in the response, the
    corrections of the round-4 and round-5 responses, and every commit-body measurement checked
    above.

## Round-6 fixes: verification

| #         | Claimed fix                                                                                                                                         | Verified?               | Evidence                                                                                                                                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T7-r6, J4 | Log captured before `grep`; exactly one telemetry flag, set off                                                                                     | **Yes**                 | `ci.yml:310-320`; 40/40 caught against the real image with telemetry on (old idiom 7/40); a later `=true` flag fails the config check; clean stack passes. The four positive checks use the same idiom (`:278-307`). |
| A6        | `--audit-level=high` on the production audit                                                                                                        | **Yes**                 | `ci.yml:77`; pnpm 10.34.9 source read; the step passes under `-eo pipefail`.                                                                                                                                         |
| T11, J3   | Rules read from inside the tree; positive control; canary                                                                                           | **Yes** (residual T13)  | `compose.yaml:33-46`; `ci.yml:136-158`; no mount and an empty mount both fail with "unable to load gitleaks config"; the report holds only the canary. A committed `.ci-canary` defeats it (T13).                    |
| T10       | `/^write(?:ln)?$/` and a fixture line                                                                                                               | **Yes**                 | `eslint.config.mjs:146`; `unsafe-code.tsx:17-18, 32-33`; the old regex fails 2 tests.                                                                                                                                |
| D7-r6     | Untrue statements corrected                                                                                                                         | **Yes**                 | `foundation-round-5-response.md:47-61`, `foundation-round-4-response.md:61-65`, `compose.yaml:28-32`, ADR 0015:63-65 and :100-110, ADR 0016:85-88, ADR 0018:153-158, ADR 0013:5, ADR 0014:5, `CHANGELOG.md:17`.      |
| J1        | `!working-tree-encoding`; binary-text check                                                                                                         | **Yes**                 | `ci.yml:111-113, 130`; UTF-16 file fails the guard; the attributed file exports as UTF-8 and is found.                                                                                                               |
| J2        | `-m` and `--diff-filter=uxdb`                                                                                                                       | **Yes**                 | `compose.yaml:21`; merge case found twice, type change once; branch history clean.                                                                                                                                   |
| J5        | Skipped-name guard; Semgrep on the export with a pinned ignore file                                                                                 | **Partly** (T12)        | The list matches v8.30.1 exactly, and the review's five names fail; non-ASCII names pass (T12). Semgrep now reads `tests/` (measured).                                                                               |
| J6        | Strings naming a sink; wrapped assignments; `on…` attributes; `write` on another document                                                           | **Yes** (listed shapes) | 26 fixture lines, one finding each; other shapes remain (fix 5, notes).                                                                                                                                              |
| J7        | CODEOWNERS catch-all                                                                                                                                | **Yes**                 | `CODEOWNERS:6`; API errors `[]`.                                                                                                                                                                                     |
| Notes     | `git grep` failures; residual shapes; `.gitleaksignore` wording; locale defaults; `{ pnpm: null }`; Lighthouse annotations; `.env.example`; S3 port | **Yes**                 | `c9cb1e1`, `444faf9`, `63169e9`, `7cba218`, `4aa7833`, `ba7a431`, `77c2960` (the test fails on the old code by construction), `a01964b` (annotations read above), `a8ffbfb`, `7f80522`.                              |
| D1, D2    | History                                                                                                                                             | No (owner)              | Unchanged; no waiver recorded.                                                                                                                                                                                       |

Commit-body measurements:

- Verified here:
  - `15d1478`: 37 of 40 missed before, 0 of 40 after (here: 33 of 40 and 0 of 40);
  - `275b403`, `c9cb1e1`, `acf3507`, `9dd30c4` and `1b784fe` (the git behaviour, and gitleaks
    with the CI options);
  - `f2791c5`: a canary-only report passes;
  - `097d425`: the five names fail;
  - `3e7b5c2`: 82 files now (78 at that commit), all of `tests/`; it fails without the ignore
    file, and an empty tree exits 2;
  - `444faf9`, `7cba218` (counts and negative control) and `63169e9`: lines 27–32.
- Not verifiable here: `687f69a` (its control runs only in CI, and it is green there) and the
  response's CI byte counts at `3e7b5c2` (consistent with this reviewer's 1.94 MB at `a3d1e29`).
- Not true as written: `097d425`'s "fails on any text file that matches it" (T12).

## Phase-00 deliverables (`docs/phases/phase-00.md`, PRs 0.1–0.4)

| PR  | Deliverable                                                                | Status               | Evidence                                                            |
| --- | -------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------- |
| 0.1 | Next.js App Router, strict TS + `noUncheckedIndexedAccess`, pnpm, `.nvmrc` | Done                 | `tsconfig.json`, `package.json`, `.nvmrc`                           |
| 0.1 | Strict ESLint + `eslint-plugin-boundaries`                                 | Done                 | `eslint.config.mjs`; boundary fixtures                              |
| 0.1 | Prettier, Husky + lint-staged, Commitlint                                  | Done                 | `.husky/*`, configs; CI commitlint                                  |
| 0.1 | `pnpm verify`; module folders with `index.ts`                              | Done                 | `package.json`; ten modules                                         |
| 0.2 | Compose: Postgres (`btree_gist`), Redis, MinIO                             | Done, with deviation | SeaweedFS (ADR 0013, owner acceptance pending); CI `services` green |
| 0.2 | `env.ts` validation; `.env.example` placeholders only                      | Done                 | Unchanged in this range except the header comment                   |
| 0.3 | next-intl `fa`/`en`, `[locale]`, `dir`/`lang`                              | Done                 | E2E; the toggle now reads the locale list                           |
| 0.3 | Self-hosted WOFF2 subsets; Peyda slot; formatters at 100 %                 | Done                 | Coverage 100 %; defaults from `DEFAULT_LOCALE`                      |
| 0.4 | Actions: cached install, verify, Playwright fa/en, LHCI                    | Done                 | `ci.yml:209-263`                                                    |
| 0.4 | Vitest 90 % threshold on `domain`; axe in Playwright                       | Done                 | `vitest.config.mts`; `hello.spec.ts`, `not-found.spec.ts`           |
| —   | **Phase gate:** green pipeline, bilingual RTL hello page, Lighthouse ≥ 95  | **Met (CI)**         | CI green; medians 98 and 97 (annotations)                           |

`docs/phases/phase-00.md:16` still names MinIO, so PR 0.2 must not be ticked until the owner
accepts ADR 0013 or amends the phase file. This reviewer ticked nothing.

## ADR scores (rubric: problem 20 · alternatives 20 · trade-offs 25 · Iran fit 20 · revisit 15)

| ADR                         | Problem | Alternatives | Trade-offs | Iran fit | Revisit | Total   | Reasons for every point lost                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------- | ------- | ------------ | ---------- | -------- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0013 SeaweedFS for local S3 | 20      | 19           | 25         | 20       | 15      | **99**  | The amendment (`:55-57`: exactly one telemetry flag, and no telemetry line in the log) is accurate, measured above. −1 alternatives, unchanged: option D is rejected without being tried (`:39`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 0014 Toolchain baseline     | 20      | 20           | 25         | 20       | 15      | **100** | Not amended since round 5; the header is now correct.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 0015 Rule enforcement       | 20      | 20           | 23         | 20       | 15      | **98**  | Both round-6 points fixed: one depth figure, proven by negative control, and `document.write` proven by a fixture line. −1 trade-offs (new): the Decision (`:80-84`) states bans on assigning `innerHTML`/`outerHTML`/`srcdoc`, on `on…` attributes through `setAttribute`, and on the listed sink calls. Lint-clean shapes remain for each: destructuring assignment, a template-literal or `setAttributeNS` name, and `.call`/`.bind` on a sink method. The Risk (`:100-110`) names none of them; its "wrappers the selectors do not name" does not describe them. −1 trade-offs (new): the Decision bans these constructs "everywhere" (`:74`), but every project rule is scoped to `.ts`/`.tsx` (`eslint.config.mjs:284, 307-312`), and nothing rejects other source extensions under `src/` (T14). |
| 0016 Supply-chain controls  | 20      | 20           | 23         | 20       | 15      | **98**  | The round-6 point is fixed (`:113-117` states the tree scan's cost). −1 trade-offs: the skipped-name rejection (`:81-84`) does not hold for non-ASCII names (T12), and the Risk's "known gaps" (`:118-119`) does not list them. −1 trade-offs: "no exceptions, so neither an exception nor … can leave a secret-like value in the tree" (`:63-66`, again at `:115-117`) does not hold for a committed `.ci-canary` (T13).                                                                                                                                                                                                                                                                                                                                                                               |
| 0017 Font delivery          | 20      | 20           | 25         | 20       | 15      | **100** | Not amended. Its CI medians are quoted at `fe5b81c` (99 on both); at `a3d1e29` they are 98 and 97, still above the gate.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 0018 Not-found handling     | 20      | 20           | 25         | 20       | 15      | **100** | The amended wording (`:153-158`) matches what round 6 measured.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

## Required fixes, in order (file:line → fix)

1. **T12** `.github/workflows/ci.yml:111` and `:116`:
   - `git ls-files --eol` → `git -c core.quotePath=false ls-files --eol` (both lines);
   - after `:124`, fail on any path git still quotes (control characters, `"` or `\`):
     ```bash
     quoted=$(git -c core.quotePath=false ls-files | grep '^"' || [ $? -eq 1 ])
     if [ -n "$quoted" ]; then echo "::error::file name git has to quote: $quoted"; exit 1; fi
     ```
   - Verified here: with both changes the Persian-named `.svg` fails ("skips this text file by
     its name"); the control, the plain `badge.svg`, the UTF-16 file and the Persian-named `.ts`
     cases behave as before; `a3d1e29` passes.
   - Prove it in the commit body with a non-ASCII-named text `.svg`. Add a sentence to the comment
     at `:114-115` saying why the paths are read unquoted.
2. **T13** `.github/workflows/ci.yml:145`:
   - insert `test ! -e "$tree/.ci-canary"` before the `printf`, so a committed file of that name
     fails the step instead of being overwritten;
   - extend the comment at `:142-144` accordingly.
   - Verified here: the committed-`.ci-canary` case then fails, and `a3d1e29` passes.
3. **T14** `tests/` and `eslint.config.mjs:284, 307-312`:
   - add `tests/source-extensions.test.ts`:
     ```ts
     import { readdirSync } from 'node:fs';

     import { describe, expect, it } from 'vitest';

     describe('src/', () => {
       it('holds no JavaScript or .mts/.cts sources, which the project lint rules do not cover', () => {
         const files = readdirSync('src', { recursive: true, encoding: 'utf8' });
         expect(files.filter((file) => /\.(?:[cm]?jsx?|[cm]ts)$/.test(file))).toEqual([]);
       });
     });
     ```
     (verified here: passes at `a3d1e29`, fails with a stray `src/shared/ui/*.js`);
   - as defence in depth, widen both `files` globs to `{ts,tsx,mts,cts,js,jsx,mjs,cjs}`, and
     consider `pageExtensions: ['tsx', 'ts']` in `next.config.ts` (not measured here; confirm
     that `pnpm build` still lists `/icon.svg`);
   - ADR 0015: state that the rules cover TypeScript sources and that other extensions are
     rejected by the test.
4. **D7-r7**, after fixes 1–3:
   - add "Corrections after round 7" to `foundation-round-6-response.md` (J5 row; and the T11 row,
     whose canary did not cover a committed file of its own name);
   - check that ADR 0016:63-66, :81-84 and :115-119, ADR 0015:40-41 and :74, README.md:49,
     CHANGELOG.md:17 and `risk-register.md:41` are then true as written. If a fix is not made,
     rewrite those lines to name the gap instead.
5. **ADR 0015 (`:80-84`, `:100-110`) and `eslint.config.mjs:143-144`**, either of these:
   - ban the shapes, with one fixture line each in `tests/fixtures/src/shared/ui/unsafe-code.tsx`
     and the count at `tests/lint-rules.test.ts:176` raised to match. Replace the callee-only
     selector at `:143` with `` `MemberExpression[computed=false][property.name=${HTML_CALL}]` ``
     (any reference to a sink method, so `.call`/`.bind`/aliases), and add:
     - `` `:matches(ArrayPattern, ObjectPattern > Property, AssignmentPattern) > MemberExpression[computed=false][property.name=${HTML_PROPERTY}]` ``
     - `"CallExpression[callee.property.name='setAttribute'] > TemplateLiteral.arguments:first-child > TemplateElement[value.raw=/^on/i]"`
     - `"CallExpression[callee.property.name='setAttributeNS'] > :matches(Literal[value=/^on/i], TemplateLiteral[quasis.0.value.raw=/^on/i]).arguments:nth-child(2)"`

     (Verified here: all eight probes reported; `setAttribute('aria-label', 'online')`,
     `setAttributeNS(null, 'title', …)` and `const [first] = [node.innerHTML]` stay clean;
     `pnpm lint` and the 51 lint tests pass.)

   - or add exactly those shapes to the ADR's false negatives at `:106-108`.
6. **ADRs:** write the scores above into `docs/adr/0013…0018:5` and `docs/adr/README.md:17-22`;
   for 0015 and 0016, the corrections of fixes 3–5.
7. **D1 + D2:** the product owner either approves a force-push to this branch (move the
   `docs/project-plan.md` hunk out of `c2d2e84`; split `d0d1e50`, `a701e1f`, `3441445`, `7e101c2`,
   `5af3007`, `c25ba2d`; fold `41fd08f`'s pattern change into `ff9ea59` so no commit fails its own
   gate), or records a written waiver. Either removes these deductions; a squash merge does not.
8. **Product owner, outside the diff:**
   - add the `main` ruleset before merging (N3; still `protected: false`, 0 rulesets), with merge
     commits and squash merges allowed and rebase merges not (register row);
   - accept ADR 0013 or amend `docs/phases/phase-00.md:16`;
   - decide repository visibility (N6);
   - answer the plan §11 questions that keep ADRs 0010 and 0011 `Proposed`.

## Notes (not deducted)

- **Lighthouse spread.** One of the five CI runs on `/fa` scored 80 (median 98). The median
  absorbs two outliers out of five, but keep watching the annotations. If a second low run
  appears, raise `numberOfRuns` (odd). Never re-run a red job until it turns green.
- `eslint.config.mjs` is close to the 300-line limit by the lint rule's own count. The four
  selectors of fix 5 still fit, but the next addition should move `UNSAFE_SYNTAX` (or the token
  rules) into its own module.
- The secrets and sast jobs each carry their own copy of the export recipe (`ci.yml:130, 138-140`
  and `:171-174`), with different attribute lines on purpose. A comment in each pointing to the
  other would keep them from drifting. `git ls-files --eol` also runs twice in the guard
  (`:111`, `:116`); one capture would do.
- The guard step (`ci.yml:89-124`) is about 36 lines of shell that is tested only by running it on
  the branch. Moving it into `scripts/` with a fixture test, as for `check-raw-colors.ts`, would
  have caught T12.
- `document.write.call(document, html)` is caught only by `@typescript-eslint/no-deprecated`,
  as ADR 0015 already says for a document held in a variable.
- Two older commits carry a commitlint `footer-leading-blank` warning (`97f373f`, `86a4095`);
  new bodies avoid it.
- `routing.locales.find(…) ?? routing.defaultLocale` (`(site)/page.tsx:21-22`): the fallback is
  unreachable with two locales; harmless.
