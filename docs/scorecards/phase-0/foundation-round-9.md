# Scorecard — Phase 0 / Platform foundation (round 9)

- Reviewer: code-reviewer (fresh session, round 9; did not write this code)
- Date: 2026-11-04
- Verdict: **Approved — 98.5 / 100** (gate ≥ 98). All mandatory gates are green on this
  reviewer's evidence, and `security-foundation-round-9.md` (written alongside this scorecard)
  reports Gate Pass: 0 Critical, 0 High. The merge still needs the product owner to add the
  `main` ruleset (N3) first. The fixes below are still owed; a score above the gate does
  not make any of them optional.
- Scope: the whole branch against GitHub's `main` (`049877d`, an ancestor of HEAD), HEAD
  `b3325eb`: 170 non-merge commits and one merge. Focus: `git log 1898889..b3325eb`, 15 commits:
  eight code commits (`9ac9fb1`, `f4b0723`, `b94f620`, `7560323`, `3a6c7ac`, `0b697f3`,
  `7ab9118`, `3d79dbc`) and seven documentation commits (`bb8bab5`, `feffc43`, `aa78d6e`,
  `9b6fb85`, `b332a63`, `09919c1`, `b3325eb`). `.claude/*` and `docs/phases/*` belong to the
  maintainer and were read, not scored.
- Inputs read: `CLAUDE.md`, `docs/project-plan.md` §3 and §8, `docs/phases/phase-00.md`,
  `.claude/commands/review.md`, `docs/stories/platform-foundation.md`, ADRs 0013–0018 and the
  ADR index, `docs/security/risk-register.md`, `foundation-round-8.md`,
  `foundation-round-8-response.md`, the "Corrections after round 8" at the end of
  `foundation-round-6-response.md` and `foundation-round-7-response.md`, and
  `security-foundation-round-8.md`. Every claim in the response and in the 15 commit bodies was
  checked here where it could be reproduced, including the negative controls.

## Evidence collected by this reviewer at `b3325eb`

| Check                     | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Environment               | Own clone at `b3325eb`; `cp .env.example .env` (gitignored, not committed); `pnpm install --frozen-lockfile --offline`: up to date. Local Node 22.22.0 is below `engines >=22.23.4`; pnpm only warns (ADR 0014).                                                                                                                                                                                                                                                                                                                                                                           |
| `pnpm verify`             | **exit 0**: typegen, ESLint (`--max-warnings=0`) and the CSS colour check, Prettier, `tsc`, Vitest **20 files / 172 tests** (165 + 4 in `check-scan-coverage.test.ts` + 3 in `check-node-version.test.ts`), coverage 100 % (statements 81/81, branches 33/33, functions 20/20, lines 71/71), `next build`: `ƒ /_not-found`, `● /fa`, `● /en`, `○ /icon.svg`, `ƒ Proxy`.                                                                                                                                                                                                                    |
| `CI=1 PORT=3500 pnpm e2e` | **71 passed, 1 skipped** (72 tests; the skip is `env-validation.spec.ts`, desktop only by design), exit 0. Port 3500 released afterwards.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| GitHub CI                 | Run 41710963646 (`b3325eb`, push, attempt 1): **6/6 jobs success**. Annotations of the build job: **Lighthouse `/fa` (7 runs) performance 98 (89–99), `/en` (7 runs) 98 (95–100)**, accessibility, best practices and SEO 100 on both; Playwright 71 passed, 1 skipped. Runs 41710112281 (`7ab9118`) and 41710662107 (`3d79dbc`) were cancelled by the next push; in the first, the secrets job (git-mode tree scan) succeeded and freshness failed at the Node step, as the response says.                                                                                                |
| Audits and freshness      | `pnpm audit --audit-level=high`: exit 0, 3 High all ignored (R-001…R-003); production audit `true`; `check-risk-register.ts`, `check-package-manager.ts` and `check-node-version.ts` exit 0 against the live sources; the positive control (`22.22.1`) still fails with "newer security releases". The live `index.json` does list a `v27.0.0-alpha…` prerelease first.                                                                                                                                                                                                                    |
| Secrets job, emulated     | gitleaks v8.30.1 built offline from the module in the local Go cache (copied; only the `go` directive lowered to the local toolchain). A `docker` wrapper on `PATH` runs it with the exact `command`, mounts and working directory of each `compose.yaml` service. Steps 1 and 3–7 were extracted verbatim from `ci.yml` with a YAML parser and run as `bash --noprofile --norc -eo pipefail <file>`, each case in its own scratch clone of `b3325eb`. Each case plants a GitHub-token-shaped value generated at run time, never printed. Clones, the binary and the harness were deleted. |
| Control at `b3325eb`      | Coverage "Checked 711 paths of 672 blobs"; history 173 commits, no leaks; tree step: the canary is the only finding; "The tree scan fails without a tree" passes in git mode. Control with a token in `src/leak.ts`: history `leaks found: 1`, tree step fails (canary + `src/leak.ts`).                                                                                                                                                                                                                                                                                                   |
| Tree export               | 228 tracked files at HEAD; the one-commit repository holds 228 (`.gitleaksignore` removed, canary added), all 228 in the root diff, only the five fonts binary. At `b94f620`: 224 tracked, as its body says.                                                                                                                                                                                                                                                                                                                                                                               |
| Lint                      | `3a6c7ac`: both `no-restricted-syntax` lists (UI file 41, domain file 48 selectors) are byte-identical with their messages before and after. `0b697f3`: under `3a6c7ac`'s selectors, fixture lines 49–52 are unreported; now one finding each (40 → 44); look-alikes at lines 66–67 clean. ADR 0015's `.cjs` (exit 2, "could not find plugin react") and `.cts` (parse error) statements re-measured: true.                                                                                                                                                                                |
| File sizes                | By the lint rule's count: `eslint.config.mjs` about 273 code lines (was 297), `eslint/unsafe-syntax.mjs` 27, `scripts/check-scan-coverage.ts` 128; `ci.yml` 273 lines without comments and blanks.                                                                                                                                                                                                                                                                                                                                                                                         |
| Repository settings       | `GET …/branches/main`: `049877d`, `"protected": false`; rulesets: 0; visibility public; merge commits, squash and rebase all allowed; no pull request (N3, N6: owner actions).                                                                                                                                                                                                                                                                                                                                                                                                             |
| Commits                   | `commitlint --from 1898889 --to b3325eb`: 0 problems, 0 warnings. On the whole branch the 2 old `footer-leading-blank` warnings remain. D1 and D2 unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Not reproduced here       | Semgrep (its configuration is unchanged in this range; sast green in CI at `b3325eb`); Lighthouse locally (the CI annotations were readable).                                                                                                                                                                                                                                                                                                                                                                                                                                              |

### Round-8 fixes: negative controls (secrets job steps run as Actions runs them)

Each row is one scratch clone. "Before" is the coverage step with the previous commit's script
copied over the working tree (uncommitted); "now" is `b3325eb`.

| Case                                                                                              | Coverage before | Coverage now                    | History scan | Tree step now                                                      |
| ------------------------------------------------------------------------------------------------- | --------------- | ------------------------------- | ------------ | ------------------------------------------------------------------ |
| UTF-16 token file `notes.constructor` (T15)                                                       | pass            | **fails** (not expected format) | no leaks     | passes (binary)                                                    |
| Text `src/app/logo.ſvg` (long s); text `docs/menu.xlſx` (T15, P3)                                 | pass            | **fails** (skipped name)        | no leaks     | passes                                                             |
| Text `docs/x/server.soc` + Kelvin sign + `et` (P3)                                                | pass            | **fails**                       | no leaks     | passes                                                             |
| Text `node_modules/a` + CR + `b/index.ts`, force-added (P3)                                       | pass            | **fails**, CR printed as `%0D`  | no leaks     | passes                                                             |
| Real WebP, then text with a token at the same path, left at HEAD (P1 E1)                          | pass            | **fails** (text after binary)   | no leaks     | **fails** (file listed)                                            |
| Real ICO, then text with a token, then the ICO restored (P1 A1)                                   | pass            | **fails**                       | no leaks     | passes (gone from HEAD)                                            |
| Text starting `MZ`, commit-bound exception with a reason (T16)                                    | —               | pass                            | no leaks     | **fails** (file listed)                                            |
| `…/domain/nakaya.brand.ts`; `src/logo.svg/secret.ts`; token near byte 125,000, each excepted (P2) | —               | pass                            | no leaks     | **fails** (each listed)                                            |
| Exported `.gitattributes` line `-diff` on an excepted token file                                  | —               | pass                            | no leaks     | **fails**; without the tree repository's attributes line it passes |
| Committed `.ci-canary`; `.ci-canary` as a dangling link; another link                             | —               | pass                            | —            | fails with its `::error::` message                                 |

- "Before" scripts: `1898889`'s for every row it applies to; `9ac9fb1`'s for the `f4b0723` rows
  (it still passes them) and `f4b0723`'s for the `9ac9fb1` rows (it fails them). So each commit
  closes exactly the cases its body names.
- `--root` and `--diff-merges=separate`: with `log.showRoot=false` and `log.diffMerges=combined`
  in the clone's configuration, `1898889`'s script drops to "628 paths of 627 blobs" (the root
  commit's files and the merge diffs vanish); `b3325eb`'s stays at 711 of 672.
- `7560323`: with `scripts/check-scan-coverage.ts` replaced by a symbolic link to a copy, a plain
  `node scripts/check-scan-coverage.ts` exits 0 with no output (main() skipped); the CI step
  fails on its summary-line check.
- `3d79dbc`: the new parser test fails against `0b697f3`'s parser and passes now.

### New residuals found in this round

| Case                                                                                                                                                                                              | Coverage | History scan          | Tree step                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------- | ------------------------------------------------------------------------- |
| **R1**: a WebP header line followed by 200 text lines at `public/images/menu.webp`; next commit `git mv` to `src/menu-items.ts`, header dropped, a token line added; then deleted                 | **pass** | **no leaks**          | passes                                                                    |
| R1 left at HEAD                                                                                                                                                                                   | pass     | no leaks              | fails                                                                     |
| R1 with `--no-renames` added to the history scan's `--log-opts`                                                                                                                                   | pass     | **leaks found: 1**    | —                                                                         |
| Clean `b3325eb` with that same `--log-opts`                                                                                                                                                       | pass     | no leaks, 173 commits | passes                                                                    |
| **R2**: `src/version.ts` whose first line is a `$Id: …$` keyword holding a token, with `src/version.ts ident` in `.gitattributes` and a commit-bound exception with a reason                      | pass     | no leaks              | **passes: the value stays in HEAD's blob**                                |
| R2 without the exception                                                                                                                                                                          | pass     | leaks found: 1        | passes                                                                    |
| R2 without the `ident` line (control)                                                                                                                                                             | pass     | no leaks              | fails                                                                     |
| **R3**: `src/build-info.ts` starting with an `export-subst` placeholder that expands to a NUL byte (format code `%x00`), then a token, excepted as R2                                             | pass     | no leaks              | **passes**                                                                |
| **R1 + R2 combined**: the renamed file's first line is the `$Id: …$` keyword with the token, staged before `src/menu-items.ts ident` is added to `.gitattributes`; **no `.gitleaksignore` entry** | pass     | no leaks              | **passes: the value stays in HEAD's blob**                                |
| R2 and R3 with `* !ident` and `* !export-subst` added at `ci.yml:127`, and `* !ident` at `ci.yml:155`                                                                                             | pass     | no leaks              | **fails** (each listed); clean HEAD passes; the P2 brand case still fails |

- R1: `git log -p` with gitleaks' own options prints the pair as a rename (similarity 99 %)
  from `public/images/menu.webp`, then "Binary files … differ"; the token never appears in the
  output. The coverage check runs `git log --no-renames` (`scripts/check-scan-coverage.ts:158`),
  so it sees a deletion and an unrelated text addition and passes. gitleaks' history scan
  (`compose.yaml:21`) runs with git's default rename detection, so the pair it actually diffs is
  binary-to-text: the round-8 P1 class at a new path.
- R2: `git archive` (tree step, `ci.yml:136`) applies the exported `.gitattributes`; `ident` is
  not unset at `ci.yml:127`, so the archive writes the blob id over the keyword's contents, and the
  one-commit repository's `git add` (not unset at `ci.yml:155`) collapses it to an empty keyword.
  HEAD's blob, and therefore the public repository, still holds the value.
- R3: `export-subst` is not unset at `ci.yml:127` either; the exported file gets a NUL in its
  first line, so the one-commit repository diffs it as binary and the git-mode scan skips it.
- Both R2 and R3 also apply to Semgrep's export (`ci.yml:185-186`, the same `git archive`).
- All three need intent: R1 a crafted image renamed to source; R2 and R3 an attributes line and,
  alone, an exception. Combined, R1 hides the value from the history scan and R2 from the tree
  scan, so no exception is needed: a value stays at HEAD with every step green, behind a crafted
  image and one attributes line that show in the diff. This is the round-8 P1 (E1) class; the
  round-9 security review measured the same combination (its Q1/Q2, case C1). The fixes below
  close each half, so the combination too.

## Mandatory gates (any red = score 0)

- [x] **CI green (lint, typecheck, test, build):** run 41710963646 at `b3325eb`, 6/6 jobs,
      attempt 1; reproduced locally (`pnpm verify` exit 0; E2E 71 passed, 1 skipped).
- [x] **0 High/Critical security findings,** on this reviewer's evidence: production audit 0 at
      High and Critical, the three dev-only Highs gated by the register, Semgrep and both gitleaks
      scans green in CI, history and tree clean here. R1–R3 are Low/Info-class scanner-gate gaps:
      each needs a deliberately built file, and an attributes line or an exception the owner sees
      in the diff. **N3 (no ruleset on `main`) is still open as a Medium**, rated High by the
      security reviews if this branch merges without it. The round-9 security review agrees:
      Pass, 0 Critical, 0 High (Q1 Low, Q2–Q5 Info, N3 Medium).
- [x] **axe: 0 violations:** E2E on `/fa`, `/en` and the 404 shapes, desktop and mobile, locally
      and in CI; Lighthouse accessibility 100 in the CI run.
- [x] **Lighthouse ≥ 95 mobile (DoD and the phase-00 gate):** CI medians of 7 at `b3325eb` are 98
      and 98 (see the notes on the `/fa` spread).

## Code rubric

| Criterion                  | Weight  | Score    | Evidence / deductions                                                                                                                                                                                                                                                                                                       |
| -------------------------- | ------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type safety                | 10      | 10       | `tsc` 0; ESLint `strictTypeChecked` 0; no `any`, `@ts-*` or non-null assertion added. The `Object.hasOwn` guard removes the prototype-key bug that the `Record` type hid; `Change.previous` is optional and every read is guarded.                                                                                          |
| Lint & format              | 10      | 10       | ESLint and Prettier clean. The selector move is behaviour-neutral (identical lists, measured); the four new shapes each have a fixture line that was unreported before.                                                                                                                                                     |
| Tests                      | 20      | 19.5     | 172 unit tests at 100 %, 72 E2E; T15, T16 and the P1/P3 cases fixed, with negative controls that hold (measured above). **−0.25 T17** (R1: text renamed from binary content is read by neither the coverage check nor the history scan), **−0.25 T18** (R2/R3: `ident` and `export-subst` hide a value from the tree scan). |
| Security                   | 20      | 20       | No High/Critical (the rubric's condition). Git-mode tree scan, text-after-binary and Go-compatible name matching, escaped workflow messages, explicit `--root`/`--diff-merges`, the summary-line assertion, more script-execution selectors. The scanner-gate gaps are scored under Tests, as in rounds 4–8.                |
| Architecture & readability | 20      | 20       | The selector list moved to its own module before the config hit `max-lines` (CODEOWNERS updated); `parseRawLog`, `problem` and `problems` stay small and pure; functions ≤ 40 and files ≤ 300 by the lint rule's count.                                                                                                     |
| Performance                | 10      | 10       | CI medians 98 and 98 over 7 runs, assertion green; no change to the public pages' output. The coverage check still reads every blob into memory (note).                                                                                                                                                                     |
| Documentation              | 10      | 9.0      | Response, corrections, ADRs, README, CHANGELOG, story AC6 and the script header updated; the round-8 D7 items are corrected. **−0.5 D1** (plan reformat in `c2d2e84`), **−0.25 D2** (old multi-concern commits), **−0.25 D7-r9** (statements that R1–R3 make untrue).                                                       |
| **Total**                  | **100** | **98.5** | At the gate: approved, with the fixes below still owed.                                                                                                                                                                                                                                                                     |

### Deductions in detail

- **T17 (−0.25): the coverage check and the history scan pair changes differently.**
  - `scripts/check-scan-coverage.ts:158` passes `--no-renames`, so its "text after binary" rule
    (`:8-9`, `:118-120`) sees only same-path pairs. The history scan it models,
    `.github/ci-tools/compose.yaml:21`, runs `git log -p` with git's default rename detection, so
    a binary file renamed to a similar text file is diffed as binary and the text is never read.
  - Measured (R1): a token added in such a rename and deleted one commit later passes all four
    steps. At HEAD the tree scan catches it, so only the "added and later removed, never
    reported" class (round 7 K1, round 8 P1) remains. It needs a crafted image (mostly text behind
    a real signature), hence −0.25.
- **T18 (−0.25): two export-time attributes are not overridden.**
  - `ci.yml:127` unsets `diff`, `export-ignore` and `working-tree-encoding` for `git archive`, and
    `ci.yml:155` unsets `diff`, `working-tree-encoding`, `filter` and `text` for the one-commit
    repository. Neither unsets `ident`; `:127` does not unset `export-subst`.
  - Measured (R2, R3): with one `.gitattributes` line and a commit-bound `.gitleaksignore` entry
    with a reason (accepted by `tests/gitleaksignore.test.ts`), a token stays in HEAD's blob with
    every step green: `ident` rewrites it out of the export, and an `export-subst` placeholder
    turns the exported file binary. Both also blind Semgrep's export (`ci.yml:185`). Alone this is
    the round-7 T13 and round-8 T16 class (an exception and an attributes line that show in the
    diff); combined with T17, no exception is needed (measured above). Each is scored once.
- **D1 (−0.5) and D2 (−0.25): unchanged.**
  - `c2d2e84 build: …` still carries the Prettier reformat of the maintainer's
    `docs/project-plan.md`.
  - `d0d1e50`, `a701e1f`, `3441445`, `7e101c2`, `5af3007` and `c25ba2d` still mix concerns, and
    `ff9ea59` still fails its own CI gate.
  - Fixing either needs a history rewrite, which the product owner has not approved; no written
    waiver exists. A squash merge does not satisfy "one concern per commit".
- **D7-r9 (−0.25): statements that R1–R3 make untrue.**
  - R2/R3: ADR 0016:83-85 (the attributes file "outranks every `.gitattributes`, so no line there
    can hide a file from either scan"); ADR 0016:127-129 ("a value that looks like a secret cannot
    stay in the tree as text"); `ci.yml:122-126` and `:152-153` ("keep an exported .gitattributes
    from hiding or re-encoding a file"); README.md:48-49 and CHANGELOG.md:17 ("`.gitattributes`
    overridden"); the `b94f620` body ("so an exported .gitattributes cannot hide or re-encode a
    file").
  - R1: README.md:49-50 ("unreadable … files rejected anywhere in the history") and CHANGELOG.md:17
    ("every file in the history checked to be one the scans can read").
  - The known gaps at ADR 0016:130-137 and `risk-register.md:41` list neither.
  - Everything else claimed in the range was reproduced; one stale count is in the notes.

## Round-8 fixes: verification

| #               | Claimed fix                                                                    | Verified?           | Evidence                                                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------ | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T15, P3         | Own keys only; patterns with `su`/`isu`; escaped `::error::` text              | **Yes**             | `scripts/check-scan-coverage.ts:97-108`, `:124`; every T15/P3 case fails now and passed before; 4 new unit tests.                                                                   |
| P1              | Previous regular-file blob kept; text after binary fails                       | **Yes** (new T17)   | `:48`, `:65`, `:117-120`; E1 and A1 fail now and passed before; residual: renames (R1).                                                                                             |
| T16, P2         | Tree scanned in git mode on a one-commit repository                            | **Yes** (new T18)   | `ci.yml:154-160`, `compose.yaml:35-37`; the `MZ`, brand-name, skipped-directory and chunk-boundary cases fail; 228 of 228 files in the root diff; residual: `ident`/`export-subst`. |
| Notes           | `--root`, `--diff-merges=separate`; summary-line check; tree-step messages     | **Yes**             | `:155-157`, `ci.yml:118-121`, `:137-144`; negative controls above.                                                                                                                  |
| P4              | `<Script>` bodies, script elements made in code, `execCommand` as a string     | **Yes** (note)      | `eslint/unsafe-syntax.mjs:13`, `:45-46`; fixture lines 49–52; three further look-alikes in the notes.                                                                               |
| `eslint.config` | Selectors moved to `eslint/unsafe-syntax.mjs`                                  | **Yes**             | Identical lists (41/48) with messages; config now about 273 code lines; `/eslint/` in CODEOWNERS.                                                                                   |
| Lighthouse      | Median of 7                                                                    | **Yes**             | `lighthouserc.json:7`; odd-count test; README.md:35, CHANGELOG.md:17, story AC6; CI green with 7 runs at `b3325eb`.                                                                 |
| Freshness       | Prereleases accepted and left out                                              | **Yes**             | `scripts/check-node-version.ts:31-48`; new test fails on the old parser; live index passes; positive control fails.                                                                 |
| D7-r8, ADR 0015 | ADRs, header, CHANGELOG, responses corrected; `.cts`/`.cjs` stated as measured | **Yes** (new D7-r9) | The round-8 list is corrected; the round-6 and round-7 corrections are accurate.                                                                                                    |
| Fix 5           | ADR scores                                                                     | **Yes**             | `docs/adr/0013…0018:5`, `docs/adr/README.md:17-22`; 0015 and 0016 marked "re-score pending".                                                                                        |
| D1, D2, N3, N6  | History; owner settings                                                        | No (owner)          | Unchanged; no waiver; `main` unprotected, 0 rulesets.                                                                                                                               |

Commit-body measurements:

- Verified here: `9ac9fb1` (both cases, the two tests), `f4b0723` (both names, the Unicode tests,
  the escaping), `b94f620` (224 files at that commit, the `-diff` case, the canary message, the
  positive control), `7560323`, `3a6c7ac` (identical lists), `0b697f3` (four lines, 44, look-alikes
  clean), `7ab9118`, `3d79dbc` (test, live index, positive control), and the response's CI
  statements about runs 41710112281 and 41710963646.
- Not true as written: `9ac9fb1`'s "On this repository: 676 changes of 637 blobs" is the count of
  its parent `1898889` with the new script (measured: 676 of 637); at `9ac9fb1` it is 678 of 639,
  at HEAD 711 of 672. `b94f620`'s attributes sentence (T18).

## Phase-00 deliverables (`docs/phases/phase-00.md`, PRs 0.1–0.4)

| PR  | Deliverable                                                                | Status               | Evidence                                                            |
| --- | -------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------- |
| 0.1 | Next.js App Router, strict TS + `noUncheckedIndexedAccess`, pnpm, `.nvmrc` | Done                 | `tsconfig.json`, `package.json`, `.nvmrc`                           |
| 0.1 | Strict ESLint + `eslint-plugin-boundaries`                                 | Done                 | `eslint.config.mjs`, `eslint/unsafe-syntax.mjs`; boundary fixtures  |
| 0.1 | Prettier, Husky + lint-staged, Commitlint                                  | Done                 | `.husky/*`, configs; CI commitlint                                  |
| 0.1 | `pnpm verify`; module folders with `index.ts`                              | Done                 | `package.json`; ten modules                                         |
| 0.2 | Compose: Postgres (`btree_gist`), Redis, MinIO                             | Done, with deviation | SeaweedFS (ADR 0013, owner acceptance pending); CI `services` green |
| 0.2 | `env.ts` validation; `.env.example` placeholders only                      | Done                 | Unchanged in this range                                             |
| 0.3 | next-intl `fa`/`en`, `[locale]`, `dir`/`lang`                              | Done                 | E2E                                                                 |
| 0.3 | Self-hosted WOFF2 subsets; Peyda slot; formatters at 100 %                 | Done                 | Coverage 100 %; the five fonts pass the signature check             |
| 0.4 | Actions: cached install, verify, Playwright fa/en, LHCI                    | Done                 | `ci.yml`                                                            |
| 0.4 | Vitest 90 % threshold on `domain`; axe in Playwright                       | Done                 | `vitest.config.mts`; `hello.spec.ts`, `not-found.spec.ts`           |
| —   | **Phase gate:** green pipeline, bilingual RTL hello page, Lighthouse ≥ 95  | **Met (CI)**         | CI green; medians 98 and 98 at `b3325eb`                            |

`docs/phases/phase-00.md:16` still names MinIO, so PR 0.2 must not be ticked until the owner
accepts ADR 0013 or amends the phase file. This reviewer ticked nothing.

## ADR scores (rubric: problem 20 · alternatives 20 · trade-offs 25 · Iran fit 20 · revisit 15)

| ADR                         | Problem | Alternatives | Trade-offs | Iran fit | Revisit | Total   | Reasons for every point lost                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------- | ------- | ------------ | ---------- | -------- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0013 SeaweedFS for local S3 | 20      | 19           | 25         | 20       | 15      | **99**  | Unchanged except the header. −1 alternatives: option D is rejected without being tried (`:39`).                                                                                                                                                                                                                                                                                                                     |
| 0014 Toolchain baseline     | 20      | 20           | 25         | 20       | 15      | **100** | Unchanged except the header.                                                                                                                                                                                                                                                                                                                                                                                        |
| 0015 Rule enforcement       | 20      | 20           | 25         | 20       | 15      | **100** | The round-8 point is fixed: `:43-51` states, as re-measured here, that a `.cts` file fails to parse and a `.cjs` file stops ESLint, and what adding a CommonJS file would take. The new shapes are listed (`:100-106`). The three look-alikes in the notes fall under the stated false negatives (`:122-127`, "shapes not yet listed"), so no point is lost.                                                        |
| 0016 Supply-chain controls  | 20      | 20           | 23         | 20       | 15      | **98**  | Both round-8 points are fixed (`:63-72`, `:86-96`). −1 trade-offs (new): "no line there can hide a file from either scan" (`:83-85`) and "cannot stay in the tree as text" (`:127-129`) do not hold for `ident` and `export-subst` (T18). −1 trade-offs (new): the coverage check models git's pairing at the same path only, while the history scan pairs renames (T17); the known gaps (`:130-137`) list neither. |
| 0017 Font delivery          | 20      | 20           | 25         | 20       | 15      | **100** | Unchanged except the header. Its CI medians are quoted at `5e34f03` (99 on both); at `b3325eb` they are 98 and 98.                                                                                                                                                                                                                                                                                                  |
| 0018 Not-found handling     | 20      | 20           | 25         | 20       | 15      | **100** | Unchanged except the header.                                                                                                                                                                                                                                                                                                                                                                                        |

## Required fixes, in order (file:line → fix)

1. **T18** `.github/workflows/ci.yml:127`, `:155` and `:185`:
   - `:127`: `printf '* !diff\n* !export-ignore\n* !working-tree-encoding\n* !ident\n* !export-subst\n' > .git/info/attributes`;
   - `:155`: add `* !ident\n` to the one-commit repository's attributes (`git add` would
     otherwise collapse the keyword);
   - `:185` (Semgrep's export): `printf '* !export-ignore\n* !working-tree-encoding\n* !ident\n* !export-subst\n' > .git/info/attributes`;
   - extend the comments at `:122-126` and `:149-153` to name `ident` and `export-subst`.
   - Verified here: R2 and R3 then fail the tree step with their files listed, the clean HEAD
     passes with only the canary, and the brand-name P2 case still fails. Prove it in the commit
     body.
2. **T17** `.github/ci-tools/compose.yaml:21`:
   - `--log-opts=--full-history --all -m --no-renames --diff-filter=uxdb`, so the history scan
     pairs changes as the coverage check does (`scripts/check-scan-coverage.ts:158`); state it in
     the comment at `compose.yaml:11-14` and in the script's header (`:8-9`);
   - add a test that fails when `compose.yaml`'s `--log-opts` lose `--no-renames` (beside the
     existing version test), since the coverage check's contract depends on it.
   - Verified here: R1 then reports `leaks found: 1`, and the clean branch stays at 173 commits
     with no leaks (no renamed file holds an excepted value).
3. **D7-r9**, after fixes 1 and 2:
   - check that ADR 0016:83-85 and :127-129, README.md:47-50, CHANGELOG.md:17, `risk-register.md:41`
     and `ci.yml:122-126`, `:149-153` are then true as written; add to ADR 0016's known gaps
     whatever is not fixed;
   - add "Corrections after round 9" to `foundation-round-8-response.md` (the T16/P2 rows: git mode
     closed directory mode's skips, but two attributes still rewrote the export; the `9ac9fb1`
     count is the parent's).
4. **ADR 0015, no rubric points** (`eslint/unsafe-syntax.mjs:45-46`): three look-alikes lint
   clean (measured): `import NextScript from 'next/script'` with `<NextScript>{code}</NextScript>`,
   `createElement(Script, { id }, code)`, and ``document.createElement(`script`)``. Verified on a
   scratch copy (all three reported; `createElement('div')`, ``createElement(`div`)`` and
   `<Script src="/analytics.js" />` clean; the 53 lint tests still pass):
   - `:46`: replace `> Literal.arguments[value=/^script$/i]` with
     `> :matches(Literal[value=/^script$/i], TemplateLiteral[expressions.length=0][quasis.0.value.raw=/^script$/i]).arguments`;
   - add `"CallExpression:matches([callee.name='createElement'], [callee.property.name='createElement']) > Identifier.arguments:first-child[name='Script']"`;
   - add `"ImportDeclaration[source.value='next/script'] > :matches(ImportDefaultSpecifier, ImportSpecifier, ImportNamespaceSpecifier)[local.name!='Script']"`
     (the JSX selector matches by name, so the import must keep it);
   - one fixture line each, and the count at `tests/lint-rules.test.ts:176`.
5. **ADRs:** write the scores above into `docs/adr/0015…0016:5` and `docs/adr/README.md:19-20`.
6. **D1 + D2:** the product owner either approves a force-push to this branch (move the
   `docs/project-plan.md` hunk out of `c2d2e84`; split `d0d1e50`, `a701e1f`, `3441445`,
   `7e101c2`, `5af3007`, `c25ba2d`; fold `41fd08f`'s pattern change into `ff9ea59` so no commit
   fails its own gate), or records a written waiver. Either removes these deductions; a squash
   merge does not.
7. **Product owner, outside the diff:**
   - add the `main` ruleset before merging (N3; still `protected: false`, 0 rulesets), with merge
     commits and squash merges allowed and rebase merges not (register row);
   - accept ADR 0013 or amend `docs/phases/phase-00.md:16`;
   - decide repository visibility (N6);
   - answer the plan §11 questions that keep ADRs 0010 and 0011 `Proposed`.

## Notes (not deducted)

- **Lighthouse spread.** With 7 runs, `/fa` ranged 89–99 at `b3325eb` (median 98). Four runs
  below 95 would now be needed to turn CI red, so the gate is robust to one bad run; keep reading
  the medians, never re-run a red job until it turns green, and look at the low run before Phase 1
  adds weight to the page.
- The tree step prints `$links` raw (`ci.yml:144`): a link name with a newline starts a second
  workflow command. Harmless (the step fails anyway), but the script now escapes its own
  messages; the same `%25`/`%0D`/`%0A` escaping (or `printf %q`) would be consistent.
- When the coverage script fails, `output=$(node …)` (`ci.yml:119`) aborts the step before
  `echo`, so the "Checked …" line is lost from the log (the `::error::` lines still show, on
  stderr). `output=$(node scripts/check-scan-coverage.ts) || { echo "$output"; exit 1; }` keeps
  it.
- A value stored with Git LFS is outside every scan: the pointer is ordinary text and the object
  never enters a git blob. No `filter=lfs` exists today; decide before Phase 1/3 puts photos in the
  repository (the "text after binary" rule would also fail an in-place migration to LFS, which
  fails closed).
- The coverage check reads every blob of every ref into memory (fail-closed at 1 GiB); revisit
  when photos land in Git, as the response says.
- `7ab9118` and `3d79dbc` have no completed build job (cancelled by the next push); the 7-run
  Lighthouse configuration ran to completion only at `b3325eb`, green.
- Two older commits carry a commitlint `footer-leading-blank` warning (`7402e7c`, `7821a5d`).
- `routing.locales.find(…) ?? routing.defaultLocale` (`(site)/page.tsx:21-22`): the fallback is
  unreachable with two locales; harmless.
