# Scorecard — Phase 0 / Platform foundation (round 8)

- Reviewer: code-reviewer (fresh session, round 8; did not write this code)
- Date: 2026-10-29
- Verdict: **Approved — 98.5 / 100** (gate ≥ 98). All mandatory gates are green on this
  reviewer's evidence. No round-8 security review existed when this scorecard was written; its
  gate verdict governs the security gate if it differs. The merge still needs the product owner to
  add the `main` ruleset (N3) first. The fixes listed below are still owed; a score above the
  gate does not make any of them optional.
- Scope: the whole branch against GitHub's `main` (`049877d`; this clone's `origin/main` is
  stale at its parent `b681347`), HEAD `1898889`: 155 non-merge commits and one merge. Focus:
  `git log 32b3887..1898889`, 14 commits: seven code commits (`8b7f8ed`, `03dc9e8`, `989ed21`,
  `0619973`, `740b9f3`, `7bf42b1`, `7c86861`) and seven documentation commits (`0dcb06f`,
  `68072b9`, `9f46fe6`, `5aab6f4`, `d179c1b`, `e4ac3d4`, `1898889`). `.claude/*` and
  `docs/phases/*` belong to the maintainer and were read, not scored.
- Inputs read: `CLAUDE.md`, `docs/project-plan.md` §3 and §8, `docs/phases/phase-00.md`,
  `.claude/commands/review.md`, `.claude/agents/code-reviewer.md`,
  `docs/stories/platform-foundation.md`, ADRs 0013–0018 and the ADR index,
  `docs/security/risk-register.md`, `foundation-round-7.md`, `foundation-round-7-response.md`,
  the "Corrections after round 7" in `foundation-round-6-response.md`, and
  `security-foundation-round-7.md`. Every claim in the round-7 response and in the 14 commit
  bodies was checked here wherever it could be reproduced, including the negative controls.

## Evidence collected by this reviewer at `1898889`

| Check                                    | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Environment                              | Own clone at `1898889`; `cp .env.example .env` (gitignored, not committed); `pnpm install --frozen-lockfile --offline`: up to date. Local Node 22.22.0 is below `engines >=22.23.4`; pnpm only warns (ADR 0014).                                                                                                                                                                                                                                                                                                                                                             |
| `pnpm verify`                            | **exit 0**: typegen, ESLint (`--max-warnings=0`) and the CSS colour check, Prettier, `tsc`, Vitest **20 files / 165 tests** (153 + 9 in `check-scan-coverage.test.ts` + 1 in `source-extensions.test.ts` + 2 new fixture files), coverage 100 % (statements 81/81, branches 33/33, functions 20/20, lines 71/71), `next build`: `ƒ /_not-found`, `● /fa`, `● /en`, `○ /icon.svg`, `ƒ Proxy`.                                                                                                                                                                                 |
| `CI=1 PORT=3500 pnpm e2e`                | **71 passed, 1 skipped** (72 tests), exit 0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| GitHub CI                                | Run 40739432145 (`1898889`, push, attempt 1): **6/6 jobs success**, no step failed. Annotations: **Lighthouse `/fa` performance 98 (94–98), `/en` 98 (95–98)**, accessibility, best practices and SEO 100 on both; Playwright 71 passed, 1 skipped. Run 40738788494 (`7c86861`, the last code commit): 6/6 success; `/fa` **95 (94–99)**, `/en` 98 (97–98). Run 40737243939 (`03dc9e8`): 6/6 success, so the registry packs' report has an empty `errors` array. Job logs: the blob host is refused by this reviewer's proxy.                                                |
| Audits                                   | Both audit steps exit 0 when run as Actions runs them: production `true` (0 High/Critical); full audit 3 High, all ignored (R-001…R-003). `node scripts/check-risk-register.ts`: exit 0.                                                                                                                                                                                                                                                                                                                                                                                     |
| Secrets job, emulated                    | gitleaks v8.30.1 built offline from the module in the local Go cache (copied; only the `go` directive lowered to the local toolchain for the build). A `docker` wrapper on `PATH` runs it with the exact `command`, mounts and working directory of each `compose.yaml` service. The steps were extracted verbatim from `ci.yml` with a YAML parser and run as `bash --noprofile --norc -eo pipefail <file>`, each case in its own scratch clone of `1898889`. Each case plants one GitHub-token-shaped value generated at run time, never printed. All clones were deleted. |
| Semgrep, emulated                        | Pinned image (cached digest), offline: an override outside the repository replaces only the registry packs with one local `eval` rule (compose project `coder8`; its network removed afterwards). At HEAD the step passes: 85 files scanned, `errors` empty.                                                                                                                                                                                                                                                                                                                 |
| `check-scan-coverage.ts` counts          | At `1898889`: "Checked 638 paths of 637 blobs", 0.2 s, equal to the unique (blob, path) pairs of git's own raw log. At `7c86861`: 622 of 621. The "619 paths of 618 blobs" in the `7c86861` body and the response is the count at its parent `7bf42b1` (measured: 619 of 618).                                                                                                                                                                                                                                                                                               |
| Lint negative controls                   | `plain-script.js` and `impure-script.mjs`: 0 findings under `32b3887`'s config, 2 and 1 now (`989ed21`). `unsafe-code.tsx`: 26 `no-restricted-syntax` findings on lines 8–33 under `989ed21`'s config; 40 now, one on each of lines 8–47 (`7bf42b1`). Round 7's eight lint-clean probes, plus `node.innerHTML \|\|= html` and `node?.insertAdjacentHTML(…)`, are all reported; its three look-alikes stay clean.                                                                                                                                                             |
| Lint by extension (probe files, deleted) | In `src/modules/orders/domain/`, a file assigning `innerHTML`, using `color: 'red'` and calling `Date.now()`: `.js`, `.jsx`, `.mjs` and `.mts` report all three; `.cts` fails to parse (outside the TypeScript project); **`.cjs` crashes ESLint** ("could not find plugin react", exit 2), as it does for a `.cjs` file anywhere in the repository. Each fails closed (note, and ADR 0015 below).                                                                                                                                                                           |
| `source-extensions.test.ts`              | Fails with a stray `src/shared/ui/*` file of each of `.js`, `.jsx`, `.mjs`, `.cjs`, `.mts` and `.cts`; passes with `.ts` and `.tsx`.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pageExtensions` (probe, deleted)        | A `page.js` in `src/app/[locale]/(site)/r8probe/`: not routed at HEAD. With the `pageExtensions` line removed: `/fa/r8probe` and `/en/r8probe` are built. Restored and rebuilt; the route table is as above.                                                                                                                                                                                                                                                                                                                                                                 |
| Repository settings                      | `GET …/branches/main`: `049877d`, `"protected": false`; rulesets: 0; visibility public; merge commits, squash and rebase all allowed; no pull request (N3, N6: owner actions).                                                                                                                                                                                                                                                                                                                                                                                               |
| Commits                                  | All 14 in the range are Conventional: `commitlint --from 32b3887`: 0 problems, 0 warnings. On the whole branch, the 2 old `footer-leading-blank` warnings remain (`7402e7c`, `7821a5d`). D1 and D2 unchanged.                                                                                                                                                                                                                                                                                                                                                                |
| Not reproduced here                      | The Semgrep registry packs (semgrep.dev unreachable; CI green at `03dc9e8` and later); Lighthouse locally (the CI medians were readable).                                                                                                                                                                                                                                                                                                                                                                                                                                    |

### Secret-scan negative controls (secrets job steps run as Actions runs them)

| Case                                                                           | Coverage check (`7c86861`)  | History scan     | Tree step                                         |
| ------------------------------------------------------------------------------ | --------------------------- | ---------------- | ------------------------------------------------- |
| Control: unchanged `1898889`                                                   | pass                        | no leaks         | passes (only the canary)                          |
| Control: token in `src/leak.ts`                                                | pass                        | `leaks found: 1` | fails (canary + `src/leak.ts`)                    |
| UTF-16 file added, deleted one commit later                                    | fails ("binary content")    | no leaks         | passes                                            |
| Text `.svg` added, deleted                                                     | fails ("skips by its name") | no leaks         | passes                                            |
| Text `.pdf` added, deleted                                                     | fails                       | no leaks         | passes                                            |
| Persian-named text `.svg`                                                      | fails                       | no leaks         | passes                                            |
| UTF-16 text named `src/app/menu.png`                                           | fails ("no png signature")  | no leaks         | passes                                            |
| UTF-16 file added in a merge resolution, deleted                               | fails                       | no leaks         | passes                                            |
| Text `docs/menu "draft".pdf`                                                   | fails                       | no leaks         | passes                                            |
| Committed `.ci-canary` with a token                                            | pass                        | `leaks found: 1` | fails at `test ! -e`                              |
| `.ci-canary` as a link; as a dangling link                                     | pass                        | no leaks         | fails at `test ! -e`; at `test ! -L`              |
| A link elsewhere whose target is a token                                       | pass                        | `leaks found: 1` | fails at `test -z "$links"`                       |
| Token in `src/x.ts` and a three-part fingerprint without a commit              | pass                        | no leaks         | fails (the exported `.gitleaksignore` is removed) |
| Plain text file with a token and a commit-bound fingerprint with a reason      | pass                        | no leaks         | fails: the backstop works                         |
| **Same, but the file's first line starts with `MZ`**                           | **pass**                    | **no leaks**     | **passes: the secret stays at HEAD (T16)**        |
| Same `MZ` file without an exception                                            | pass                        | `leaks found: 1` | passes                                            |
| **UTF-16 file named `notes.constructor`** (also when deleted one commit later) | **pass**                    | **no leaks**     | **passes (T15)**                                  |
| **Text `src/app/logo.ſvg` (U+017F, long s), or `docs/menu.xlſx`**              | **pass**                    | **no leaks**     | **passes (T15)**                                  |
| UTF-16 text behind a real PNG signature                                        | pass                        | no leaks         | passes (a documented known gap)                   |

gitleaks' debug log names the two new mechanisms: "skipping file: global allowlist" for
`logo.ſvg`, and "skipping binary file mime_type=application/vnd.microsoft.portable-executable" for
the `MZ` text file. With both fixes 1 and 2 below applied in a scratch copy, every bold row fails
the coverage check, the earlier rows behave as above, and `1898889` passes.

### Semgrep negative control (`03dc9e8`)

| Case                                                                  | Files scanned | `errors`    | Step                     |
| --------------------------------------------------------------------- | ------------- | ----------- | ------------------------ |
| HEAD                                                                  | 85            | 0           | passes                   |
| 3.2 MB `src/p/big.ts` ending in `eval(x)`, `32b3887`'s `compose.yaml` | 82 (not it)   | 0           | passes: silently skipped |
| Same file, HEAD's `compose.yaml` (`--max-target-bytes=0`)             | 86 (with it)  | 1 (timeout) | fails on `.errors == []` |

## Mandatory gates (any red = score 0)

- [x] **CI green (lint, typecheck, test, build):** run 40739432145 at `1898889`, 6/6 jobs,
      attempt 1 (and run 40738788494 at `7c86861`); reproduced locally (`pnpm verify` exit 0;
      E2E 71 passed, 1 skipped).
- [x] **0 High/Critical security findings,** on this reviewer's evidence: production audit 0 at
      High and Critical, the three dev-only Highs gated by the register, Semgrep and both gitleaks
      scans green in CI, history and tree clean here. The two new scanner-gate gaps (T15, T16)
      are Low/Info-class: T15 needs a file name nobody writes by accident, T16 also an exception
      that shows in the diff. **N3 (no ruleset on `main`) is still open as a Medium**, rated High
      by the security reviews if this branch merges without it. No round-8 security review
      existed at the time of writing; its verdict governs this gate.
- [x] **axe: 0 violations:** E2E on `/fa`, `/en` and the 404 shapes, desktop and mobile, locally
      and in CI; Lighthouse accessibility 100 in every CI run.
- [x] **Lighthouse ≥ 95 mobile (DoD and the phase-00 gate):** CI medians at `1898889` are 98 and
      98; at `7c86861` `/fa` was exactly 95 (see the notes).

## Code rubric

| Criterion                  | Weight  | Score    | Evidence / deductions                                                                                                                                                                                                                                                                                                                 |
| -------------------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type safety                | 10      | 10       | `tsc` 0; ESLint `strictTypeChecked` 0; no `any`, `@ts-*` or non-null assertion added. The new script is typed end to end (its `Record` index is the T15 bug, scored under Tests).                                                                                                                                                     |
| Lint & format              | 10      | 10       | ESLint and Prettier clean. The project rules now cover every source extension, proven by `.js` and `.mjs` fixtures and the negative control above; the round-7 shapes are banned with one fixture line each. The `.cjs` crash fails closed (ADR 0015 and notes).                                                                      |
| Tests                      | 20      | 19.5     | 165 unit tests at 100 %, 72 E2E. T12, T13 and T14 fixed, with negative controls that hold (measured). **−0.25 T15** (the coverage check accepts binary content named `*.constructor`, and text names gitleaks skips by Unicode case folding), **−0.25 T16** (the tree scan skips text that gitleaks sniffs as an application format). |
| Security                   | 20      | 20       | No High/Critical (the rubric's condition). History-wide coverage check, tree-scan side doors closed, Semgrep reads every file and fails on errors, lint scope by extension, `pageExtensions`. The scanner-gate gaps are scored under Tests, as in rounds 4–7.                                                                         |
| Architecture & readability | 20      | 20       | The 36-line shell guard became a tested, typed script (`scripts/check-scan-coverage.ts`, functions ≤ 40 lines), as round 7's note suggested; one `SOURCE` constant for all globs. Files ≤ 300 by the lint rule's count (`eslint.config.mjs` 297, `ci.yml` 267 without comments and blanks).                                           |
| Performance                | 10      | 10       | CI medians 98 and 98 at `1898889`, assertion green; no change to the public pages' output. The coverage check costs 0.2 s.                                                                                                                                                                                                            |
| Documentation              | 10      | 9.0      | Response, corrections, ADRs, README, CHANGELOG and register updated; the round-7 D7 items are corrected. **−0.5 D1** (plan reformat in `c2d2e84`), **−0.25 D2** (old multi-concern commits), **−0.25 D7-r8** (new statements that T15 and T16 make untrue).                                                                           |
| **Total**                  | **100** | **98.5** | At the gate: approved, with the fixes below still owed.                                                                                                                                                                                                                                                                               |

### Deductions in detail

- **T15 (−0.25): the coverage check does not model what gitleaks does for two kinds of name.**
  - `scripts/check-scan-coverage.ts:94` looks the extension up with `SIGNATURES[extension]` on a
    plain object, so `constructor` finds the inherited `Object`, and `Object(content)` is a
    truthy Buffer. Binary content named `*.constructor` (or a root file named `constructor`) is
    accepted as a signed format. The `Record<string, …>` type at `:31` hides it.
  - `:87` compiles gitleaks' Go patterns as JavaScript regular expressions with `i` only. Go's
    `(?i)` folds case by Unicode orbits, so `s` also matches U+017F (long s) and `k` matches
    U+212A (Kelvin sign); JavaScript's non-Unicode `i` does not. gitleaks skips `logo.ſvg`,
    `menu.xlſx` and `a.socKet` (Kelvin sign) by its allowlist, and the check calls them ordinary
    text.
  - Measured: a UTF-16 token file named `notes.constructor`, and a text `src/app/logo.ſvg` or
    `docs/menu.xlſx` holding a token, each pass the coverage check, the history scan and the tree
    step, at HEAD and when deleted one commit later. Both need a deliberately chosen name, so the
    pair is scored as one item; the prototype lookup is nevertheless a plain bug, and the
    script's own contract (`:4-9`) and ADR 0016:84-89 say it cannot happen. Whether Semgrep's
    secrets pack would still report a provider-format token there could not be checked offline.
- **T16 (−0.25): the tree scan skips text that gitleaks sniffs as an application format.**
  - gitleaks' directory source (`sources/file.go:192-206` in v8.30.1) skips any file whose first
    chunk `h2non/filetype` v1.1.3 matches as `application/*`, whatever its name and whether or not
    git calls it text. Printable signatures alone: `MZ`, `BZh`, `%PDF`, `%!`, `{\rtf`, `Cr24`,
    `!<arch>`, `LZIP`, `SQLi`, `CWS`, `FWS`, `MSCF`, `ISc(`, and `DICM`, `ustar` and `CD001` at
    offsets 128, 257 and 32769. Measured with the built binary: text files starting "SQLite
    notes", "CWS notes" and "%PDF notes" are skipped as binary; a plain one is reported.
  - The history scan reads such a file (git sees text), so without an exception CI fails. With a
    commit-bound `.gitleaksignore` entry that has a reason (accepted by
    `tests/gitleaksignore.test.ts`), the history scan passes and the tree step passes too: the
    secret stays at HEAD as text with every job green. That is the round-7 T13 class (an
    exception that shows in the diff), and it contradicts ADR 0016:63-68 and :120-122 ("a value
    that looks like a secret cannot stay in the tree as text"). The history holds no text blob
    with any of these signatures today (checked over all 638 paths).
- **D1 (−0.5) and D2 (−0.25): unchanged.**
  - `c2d2e84 build: …` still carries the 356-line Prettier reformat of the maintainer's
    `docs/project-plan.md`.
  - `d0d1e50`, `a701e1f`, `3441445`, `7e101c2`, `5af3007` and `c25ba2d` still mix concerns, and
    `ff9ea59` still fails its own CI gate.
  - Fixing either needs a history rewrite, which the product owner has not approved; no written
    waiver exists. A squash merge does not satisfy "one concern per commit".
- **D7-r8 (−0.25): new statements that are not true.**
  - T15: ADR 0016:82-89 ("Binary content … must be an expected format … and start with that
    format's signature"; a skipped-name text file "must be one of three expected files");
    README.md:49-50 ("unreadable or name-skipped files rejected anywhere in the history");
    CHANGELOG.md:17 ("every file in the history checked to be one the scans can read");
    `risk-register.md:41` ("Other binary formats, and text files gitleaks skips by name, fail CI
    anywhere in the history"); `ci.yml:112-115` ("whatever its name's characters");
    `scripts/check-scan-coverage.ts:4-9`; `foundation-round-7-response.md:37` (K2: "every binary
    file needs its format's signature"); `foundation-round-6-response.md:76-77`.
  - T16: ADR 0016:63-68 and :120-122; the known gaps at ADR 0016:123-130 and
    `risk-register.md:41` do not list it.
  - Everything else claimed in the range was reproduced; the stale count is in the notes.

## Round-7 fixes: verification

| #              | Claimed fix                                                                                        | Verified?           | Evidence                                                                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T12, K1, K2    | `scripts/check-scan-coverage.ts`: every blob of every ref, `-z` paths, signatures                  | **Yes** (new T15)   | `ci.yml:109-117`; all seven review cases fail with the path named, including the merge and the quoted name; 9 unit tests. Residual: T15.                                                    |
| T13, K3        | `.gitleaksignore` removed; no `.ci-canary` (file or link); no symbolic link                        | **Yes** (new T16)   | `ci.yml:134-141`; each side door fails at its own line; a clean export passes and has no `.gitleaksignore`; the repository has never held a symbolic link (raw log: 0 mode-120000 entries). |
| T14, K4        | Globs cover every extension; extension test; `pageExtensions`                                      | **Yes**             | `eslint.config.mjs:165, 300, 323-328, 357`; `tests/source-extensions.test.ts`; `next.config.ts:42-44`; negative controls above. `.cjs` crashes ESLint instead (note).                       |
| K5, fix 5      | Sink references, pattern writes, `on…` names, `<script>`/`<style>` bodies, `javascript:` templates | **Yes**             | `eslint.config.mjs:125-155`; fixture lines 34–47 unreported before, one finding each now; look-alikes `:58-60` clean.                                                                       |
| K6             | `--max-target-bytes=0`; `.errors == []`                                                            | **Yes**             | `compose.yaml:61-62`, `ci.yml:183`; the table above; CI green at `03dc9e8` with the registry packs.                                                                                         |
| D7-r7, K7      | ADRs, README, CHANGELOG, register, round-6 response corrected                                      | **Yes** (new D7-r8) | The round-7 list is all corrected; the corrections now carry the T15/T16 claims.                                                                                                            |
| Fix 6          | ADR scores                                                                                         | **Yes**             | `docs/adr/0013, 0014, 0017, 0018:5` and `README.md:17-22`; 0015 and 0016 marked "re-score pending".                                                                                         |
| `&&` note      | Workflow comment                                                                                   | **Yes**             | `ci.yml:30-31`.                                                                                                                                                                             |
| D1, D2, N3, N6 | History; owner settings                                                                            | No (owner)          | Unchanged; no waiver; `main` unprotected, 0 rulesets.                                                                                                                                       |

Commit-body measurements:

- Verified here: `8b7f8ed` (every case it lists), `03dc9e8` (with a 3.2 MB file instead of
  2.3 MB), `989ed21` (0 findings before, one per marked line now), `0619973` (six extensions,
  not only four), `740b9f3` (route table and probe, with the reverse control), `7bf42b1` (lines
  34–47, total 40), `7c86861` (every listed case, the 9 tests, and that the count matches git's
  raw log).
- Not true as written: `7c86861`'s "619 paths of 618 blobs" is the parent's count (notes), and its
  "fails … on binary content outside the expected formats" (T15).

## Phase-00 deliverables (`docs/phases/phase-00.md`, PRs 0.1–0.4)

| PR  | Deliverable                                                                | Status               | Evidence                                                               |
| --- | -------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------- |
| 0.1 | Next.js App Router, strict TS + `noUncheckedIndexedAccess`, pnpm, `.nvmrc` | Done                 | `tsconfig.json`, `package.json`, `.nvmrc`                              |
| 0.1 | Strict ESLint + `eslint-plugin-boundaries`                                 | Done                 | `eslint.config.mjs`, now for every source extension; boundary fixtures |
| 0.1 | Prettier, Husky + lint-staged, Commitlint                                  | Done                 | `.husky/*`, configs; CI commitlint                                     |
| 0.1 | `pnpm verify`; module folders with `index.ts`                              | Done                 | `package.json`; ten modules                                            |
| 0.2 | Compose: Postgres (`btree_gist`), Redis, MinIO                             | Done, with deviation | SeaweedFS (ADR 0013, owner acceptance pending); CI `services` green    |
| 0.2 | `env.ts` validation; `.env.example` placeholders only                      | Done                 | Unchanged in this range                                                |
| 0.3 | next-intl `fa`/`en`, `[locale]`, `dir`/`lang`                              | Done                 | E2E                                                                    |
| 0.3 | Self-hosted WOFF2 subsets; Peyda slot; formatters at 100 %                 | Done                 | Coverage 100 %; the five fonts pass the signature check                |
| 0.4 | Actions: cached install, verify, Playwright fa/en, LHCI                    | Done                 | `ci.yml`                                                               |
| 0.4 | Vitest 90 % threshold on `domain`; axe in Playwright                       | Done                 | `vitest.config.mts`; `hello.spec.ts`, `not-found.spec.ts`              |
| —   | **Phase gate:** green pipeline, bilingual RTL hello page, Lighthouse ≥ 95  | **Met (CI)**         | CI green; medians 98 and 98 at `1898889`                               |

`docs/phases/phase-00.md:16` still names MinIO, so PR 0.2 must not be ticked until the owner
accepts ADR 0013 or amends the phase file. This reviewer ticked nothing.

## ADR scores (rubric: problem 20 · alternatives 20 · trade-offs 25 · Iran fit 20 · revisit 15)

| ADR                         | Problem | Alternatives | Trade-offs | Iran fit | Revisit | Total   | Reasons for every point lost                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------- | ------- | ------------ | ---------- | -------- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0013 SeaweedFS for local S3 | 20      | 19           | 25         | 20       | 15      | **99**  | Unchanged since round 7 except the header. −1 alternatives: option D is rejected without being tried (`:39`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 0014 Toolchain baseline     | 20      | 20           | 25         | 20       | 15      | **100** | Unchanged except the header.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 0015 Rule enforcement       | 20      | 20           | 24         | 20       | 15      | **99**  | Both round-7 points fixed: the shapes are banned with fixture lines (`:86-96`), and the file types are stated and enforced (`:43-47`). −1 trade-offs (new): `:43-47` says the rules "apply" to `cts` and `cjs`, but a `.cts` file fails to parse and any `.cjs` file anywhere in the repository crashes ESLint before a rule runs (the files-less block at `eslint.config.mjs:269-297` sets `react/*` rules for files whose React plugin `eslint-config-next` never registers). Fail-closed, but the cost (no CommonJS config file can be added without breaking `pnpm lint`) is unstated. |
| 0016 Supply-chain controls  | 20      | 20           | 23         | 20       | 15      | **98**  | Both round-7 points fixed (`:63-68`, `:82-89`). −1 trade-offs (new): the coverage check's contract (`:82-89`) does not hold for an extension that is an `Object.prototype` key or a name gitleaks folds by Unicode case (T15). −1 trade-offs (new): "a value that looks like a secret cannot stay in the tree as text" (`:63-68`, `:120-122`) does not hold for text gitleaks sniffs as an application format (T16); the known gaps (`:123-130`) list neither.                                                                                                                             |
| 0017 Font delivery          | 20      | 20           | 25         | 20       | 15      | **100** | Unchanged except the header. Its CI medians are quoted at `5e34f03` (99 on both); at `1898889` they are 98 and 98.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 0018 Not-found handling     | 20      | 20           | 25         | 20       | 15      | **100** | Unchanged except the header.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

## Required fixes, in order (file:line → fix)

1. **T15** `scripts/check-scan-coverage.ts:94` and `:87`, `tests/check-scan-coverage.test.ts:77`
   and `:100-111`:
   - `:94`: `const signature = Object.hasOwn(SIGNATURES, extension) ? SIGNATURES[extension] : undefined;`
     (or make `SIGNATURES` a `Map`);
   - `:87`: `new RegExp(line.slice(4), 'iu')` and `new RegExp(line, 'u')`, so `(?i)` folds case
     as Go does (all 25 patterns compile with `u`);
   - `:77`: expect `['/gitleaks\\.toml/u', '/\\.svg$/iu']`;
   - in the "rejects …" test, add `check(B, 'notes.constructor')` (binary content in a file that
     is not an expected format) and `check(A, 'src/app/logo.ſvg')` (a text file that
     gitleaks skips by its name).
   - Verified here: the 9 tests, ESLint and `tsc` pass; `1898889` passes; the `.constructor`,
     `.ſvg` and `.xlſx` cases fail; the round-7 cases still fail. Prove it in the commit body.
2. **T16** `scripts/check-scan-coverage.ts:99` (text branch of `problem`):
   - before the skipped-name check, fail on text whose bytes match a signature that
     `h2non/filetype` v1.1.3 (gitleaks v8.30.1's `go.mod`) types as `application/*`:
     ```ts
     export const SNIFFED: ReadonlyArray<readonly [number, string]> = [
       [0, 'MZ'],
       [0, 'BZh'],
       [0, '%PDF'],
       [0, '%!'],
       [0, '{\\rtf'],
       [0, 'Cr24'],
       [0, '!<arch>'],
       [0, 'LZIP'],
       [0, 'SQLi'],
       [0, 'CWS'],
       [0, 'FWS'],
       [0, 'MSCF'],
       [0, 'ISc('],
       [128, 'DICM'],
       [257, 'ustar'],
       [32769, 'CD001'],
     ];
     // in problem(), for text content:
     if (SNIFFED.some(([at, magic]) => starts(content, Buffer.from(magic, 'latin1'), at))) {
       return `${path}: text that gitleaks' directory scan skips as binary`;
     }
     ```
     and either add the NUL-free control-byte signatures too (zip `PK` variants, gzip, 7z,
     zstd, compress, ELF, RPM, Mach-O, NES) or name them in the known gaps;
   - name the library version next to the list, as `gitleaks-skipped-paths.txt` does, and add a
     unit test with a text blob starting "SQLite notes".
   - Verified here: the `MZ` case then fails, `1898889` passes, and no blob in the history
     matches any listed signature.
3. **D7-r8**, after fixes 1 and 2:
   - add "Corrections after round 8" to `foundation-round-7-response.md` (the K2 row, and the K1
     row's count, which is the parent's);
   - check that ADR 0016:63-68, :82-89 and :118-130, README.md:49-50, CHANGELOG.md:17,
     `risk-register.md:41`, `ci.yml:112-115`, `scripts/check-scan-coverage.ts:4-9` and
     `foundation-round-6-response.md:76-77` are then true as written. If a fix is not made,
     rewrite those lines to name the gap instead.
4. **ADR 0015 `:43-47`** (no rubric points): either register the React plugin for `.cjs` (or
   scope the rules block at `eslint.config.mjs:269-297` to the extensions `eslint-config-next`
   covers and add a `.cjs` fixture), or state that a `.cjs` file stops ESLint and a `.cts` file
   fails to parse, so both fail lint outright.
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

- **Lighthouse spread.** `/fa` had a 94 in both of the last two runs, and its median at
  `7c86861` was exactly 95. A run one point lower turns CI red on noise. Raise `numberOfRuns` to
  7 or 9 (odd), as the response promised "if it starts to flake"; never re-run a red job until it
  turns green.
- `eslint.config.mjs` is at 297 of 300 lines by the lint rule's own count: the next selector
  fails `max-lines`. Move `UNSAFE_SYNTAX` (or the token rules) into its own module now.
- `check-scan-coverage.ts` relies on git defaults: with `log.showRoot=false` the root commit's 32
  files vanish from `git log --raw`, and `-m` follows `log.diffMerges`. CI has the defaults; pass
  `--root` and `--diff-merges=separate` explicitly.
- The guard idiom `import.meta.filename === process.argv[1]` (all six scripts) skips `main()`
  silently when a script is run through a symlinked absolute path (measured: exit 0, no output).
  The CI steps use relative paths, so nothing is skipped today; for a security check, either
  assert the "Checked … paths" line in the step or call `main()` unconditionally from a CLI-only
  entry file.
- The coverage check reads every blob of every ref into memory (a 1 GiB buffer, fail-closed when
  exceeded). Cheap now; revisit when photos land in Git (Phase 1/3), for example by reading only
  the first 32,774 bytes of each blob.
- The tree step's six new `test` lines fail without a message; an `::error::` line naming the
  side door would save the next reader a trace. `test ! -L "$tree/.ci-canary"` is already
  covered by `find -type l`.
- `SIGNATURES` repeats the JPEG check for `jpg` and `jpeg`; harmless.
- Two older commits carry a commitlint `footer-leading-blank` warning (`7402e7c`, `7821a5d`).
- `routing.locales.find(…) ?? routing.defaultLocale` (`(site)/page.tsx:21-22`): the fallback is
  unreachable with two locales; harmless.
