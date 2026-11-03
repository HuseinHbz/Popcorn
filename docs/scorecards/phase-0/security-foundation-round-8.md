# Security review — Phase 0 / platform foundation, round 8

- Reviewer: security-reviewer (fresh session, round 8)
- Date: 2026-10-29
- Scope: the whole branch against `origin/main` (`chore/phase-0-foundation`, HEAD `1898889`; GitHub's `main` is still `049877d`), focused on `git log 32b3887..1898889` (14 commits, 25 files):
  - `scripts/check-scan-coverage.ts` and its CI step (a new `setup-node` in the secrets job), which replace the HEAD-only binary and skipped-name checks;
  - the tree-scan step removing the exported `.gitleaksignore` and rejecting a committed `.ci-canary` and any symbolic link;
  - Semgrep with `--max-target-bytes=0` and the empty-errors check;
  - the lint rules for every JS/TS extension under `src/`, `tests/source-extensions.test.ts`, `pageExtensions: ['tsx', 'ts']`;
  - the extra raw-HTML and script selectors;
  - the ADR 0015/0016, README, CHANGELOG and register updates.
- Baseline: [`security-foundation-round-7.md`](security-foundation-round-7.md) (at `32b3887`: Pass; N3 Medium · K1, K4 Low · K2, K3, K5–K7 Info), the author's [`foundation-round-7-response.md`](foundation-round-7-response.md) and the "Corrections after round 7" at the end of [`foundation-round-6-response.md`](foundation-round-6-response.md). Every status below was re-measured, not taken from the response.
- Standard: OWASP ASVS 5.0.0 Level 2, only the parts that apply to what exists. No file under `src/`, `docker/`, the compose file, `.env.example`, `package.json` or the lockfile changed in this range; `src/` still has no auth, session, upload, OTP, QR token, route handler or server action, so the plan §7 controls for those are not yet testable.
- Context read: `CLAUDE.md`, `docs/project-plan.md` §3 and §7, `docs/phases/phase-00.md`, ADRs 0013–0018, the risk register, `.github/CODEOWNERS`, `.gitleaksignore`, `.github/ci-tools/`, `.github/workflows/ci.yml`, `scripts/check-scan-coverage.ts` and its test, the seven earlier security reviews and the responses.

## Method

Read-only: no tracked file was changed except this report. My scratch clones, probe files, the tools I built, the local image, the module-cache toolchain I fetched and the Docker daemon I had to restart after a pause were removed or stopped; no container, network or volume of compose project `secr8` remains.

- Read every file changed in `32b3887..1898889`, and the gitleaks v8.30.1 sources for directory and git scanning (`sources/file.go`, `sources/files.go`, `sources/git.go`, `sources/common.go`) with the `mholt/archives` v0.1.2 and `h2non/filetype` v1.1.3 code they call.
- `pnpm lint` exit 0 · `pnpm typecheck` exit 0 · `pnpm test` 165/165 (20 files) · `next build` clean. Local Node 22.22.0; CI uses 22.23.4.
- Every CI step I ran was extracted verbatim from `ci.yml` with a YAML parser and run as Actions runs it, `bash --noprofile --norc -eo pipefail <file>`, in a scratch clone of `1898889` whose refs match a push checkout (`origin/main` = `049877d`, the branch at `1898889`; 158 commits).
- gitleaks: the pinned image could not be pulled (its blob host answered 403). I built v8.30.1 from the module in the local Go cache (its `h1:` hash matches `sum.golang.org`) with go1.24.11, the version its `go.mod` requires, static, and wrapped it in a `FROM scratch` image. The tree-scan steps ran verbatim through a `docker` wrapper that adds an override file outside the repository swapping only the image; the history scan ran on the host with the service's exact arguments (the image has no `git`). Each case plants a random `ghp_`-shaped token generated at run time, never printed and never written outside the scratch clone.
- Semgrep: the pinned image (cached by digest) through the same wrapper; semgrep.dev is unreachable, so the override replaces only the `--config` list with a local `eval($X)` rule.
- Lint, `tsc`, the unit tests and `next build` on probe files under `src/`, removed afterwards.
- GitHub API: runs `40739432145` (`1898889`) and `40738788494` (`7c86861`), both `push`, all six jobs `success`; repository settings, branches, branch protection, rulesets and CODEOWNERS errors.

## Gate verdict

**Pass**: 0 Critical · 0 High.

- **Round 7:** K4 and K6 are fixed. K1, K2, K3 and K5 are fixed for every reported shape, with new residuals (P1–P4). K7 is fixed for its list; the new residuals make some statements untrue again (P5). F10, G1 step 4, N5 and N6 are owner actions, recorded.
- **N3 (no branch protection on `main`) stays open as a Medium.** `GET …/branches/main`: `"protected": false`; `…/rulesets` and `…/rules/branches/main`: `[]`; merge commits, squash and rebase are all allowed. Nothing has been merged. As in rounds 5–7: if this branch merges before the ruleset exists, the next review rates N3 High.
- **New:** 1 Low (P1) and 4 Info (P2–P5). P1 is the K1 class again: the new history-wide check judges each blob alone, but git decides "binary" per pair, so a text revision of an accepted image is never read by the history scan. Combined with P2 (directory-mode skips in the tree scan), a token stayed **at HEAD** with every step green and no exception entry (case E1). Each fix is a few lines and was verified below.

## Status of round-7 findings

| ID  | R7 sev.  | Status                                        | Evidence (file:line)                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | -------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| K1  | Low      | **Fixed** (reported shapes); residual P1      | `ci.yml:116-117`, `scripts/check-scan-coverage.ts:119-142`. Each fails the step: a UTF-16 file added then deleted ("binary content in a file that is not an expected format"), a text `.svg` and a text `.pdf` added then deleted ("a text file that gitleaks skips by its name"), and a UTF-16 file added by a merge then deleted (the merge's diffs against both parents are read: 641 paths against 639). `1898889` passes: "Checked 638 paths of 637 blobs".                        |
| K2  | Info     | **Fixed**; residual P3                        | `scripts/check-scan-coverage.ts:30-42`, `:122-131`. A text `public/<Persian name>.svg` and a text `docs/menu "draft".pdf` fail (names read with `-z`); UTF-16 text named `src/app/menu.png` fails ("no png signature").                                                                                                                                                                                                                                                                 |
| K3  | Info     | **Fixed**; residual P2                        | `ci.yml:137-141`. Each now fails the tree step: a global `/tree/src/x.ts:github-pat:1` entry with a token in `src/x.ts` (the token is reported), a committed `.ci-canary`, a tracked symlink, a dangling `.ci-canary` link. The checks are on separate lines, and `ci.yml:30-31` warns about `!` and `&&`.                                                                                                                                                                              |
| K4  | Low      | **Fixed**                                     | `eslint.config.mjs:165`, `:300`, `:323-328`; `tests/source-extensions.test.ts`; `next.config.ts:44`. A client `page.js` assigning `window.location.hash` to `innerHTML` with literal text: lint reports `no-restricted-syntax` and `react/jsx-no-literals`; an `.mts` file assigning `innerHTML`: `no-restricted-syntax`; the extension test fails on both; `next build` with that `page.js` and a `page.TSX` beside it routes neither (only `/fa`, `/en`, `/icon.svg`, `/_not-found`). |
| K5  | Info     | **Fixed** (listed shapes); residual P4        | `eslint.config.mjs:144-155`; fixture `tests/fixtures/src/shared/ui/unsafe-code.tsx:34-47`, three new look-alikes at `:58-60`; `tests/lint-rules.test.ts` green (40 reports). The HTML `Blob` stays a review item (ADR 0015) and Trusted Types is in the CSP row (`risk-register.md:26`).                                                                                                                                                                                                |
| K6  | Info     | **Fixed**                                     | `compose.yaml:62`, `ci.yml:183`. A 3.2 MB `src/p/big.ts` ending in `eval(x)`: the report holds a `Timeout` error for it and the step fails. A 349 kB single-line file and a plain file, each with `eval(x)`: both reported. `1898889`: 85 files scanned, `errors: []`.                                                                                                                                                                                                                  |
| K7  | Info     | **Fixed** (round-7 list); new instances in P5 | ADR 0016:58-89 and :118-130, ADR 0015:43-47 and :80-96, README.md:46-52, CHANGELOG.md:17 and `risk-register.md:41` describe the round-7 fixes and the new known gaps (an expected binary's metadata, the gitleaks allowlist regex).                                                                                                                                                                                                                                                     |
| G1  | Low (R4) | **Fixed in the repository**; owner step open  | `secret_scanning_non_provider_patterns` and validity checks are still `disabled` (`risk-register.md:38`).                                                                                                                                                                                                                                                                                                                                                                               |
| N3  | Medium   | **Open (owner action, before merge)**         | As in the gate verdict; the register row (`risk-register.md:39`) is complete, the repository settings are missing.                                                                                                                                                                                                                                                                                                                                                                      |
| N5  | Low      | **Partially fixed** (unchanged)               | Weekly schedule at `ci.yml:8-9`; `dependabot_security_updates: disabled`; GitHub's `main` still has no `.github/` (F10).                                                                                                                                                                                                                                                                                                                                                                |
| N6  | Low      | **Open (owner decision), recorded**           | `visibility: public`; `risk-register.md:40`.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| F10 | Info     | **Open (owner, after merge)**, recorded       | Settings as in N5 and G1.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

Round-1 carry-forwards are unchanged: L1 (`'unsafe-inline'` in `script-src`, `next.config.ts:14`, Phase 2; becomes High if Phase 2 closes without a nonce CSP), L6 (migration role, Phase 2), I4 (HSTS inventory, Phase 5).

## New findings

| ID  | Severity | Location                                                                                                                          | Title                                                                                                     |
| --- | -------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| P1  | Low      | `scripts/check-scan-coverage.ts:44`, `:50-63`, `:90-103`                                                                          | A text revision of an accepted image is diffed as binary, so the history scan never reads it              |
| P2  | Info     | `.github/ci-tools/compose.yaml:33-46`; `ci.yml:128-148`; gitleaks `sources/file.go:53-75`, `:192-204`, `sources/files.go:124-127` | The tree scan's directory mode still skips files by name, content type, directory name and chunk boundary |
| P3  | Info     | `scripts/check-scan-coverage.ts:83-88`, `:140`                                                                                    | The skipped-name check's regular expressions match differently from gitleaks' Go patterns                 |
| P4  | Info     | `eslint.config.mjs:122-126`, `:153`                                                                                               | `next/script` children and a DOM-created script element lint clean                                        |
| P5  | Info     | ADR 0016:63-68, :82-89, :120-122; README.md:49-50; CHANGELOG.md:17; `risk-register.md:41`; ADR 0015:80-81                         | The documents again promise more than the checks enforce                                                  |

### P1 — A text revision of an accepted image is diffed as binary (Low)

- **Evidence.** One run-time token per case; the whole secrets job as in Method.

  | Case                                                                                                       | Coverage step | History scan                      | Tree step                 |
  | ---------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------- | ------------------------- |
  | A1: a real ICO at `src/app/favicon.ico`; next commit, the same path holds text with a token; then restored | pass          | `no leaks found`, 158 commits     | pass                      |
  | A2: as A1, then the file deleted                                                                           | pass          | `no leaks found`, 158 commits     | pass                      |
  | E1: a real WebP at `public/images/nakaya.brand.webp`; next commit, text with a token, **left at HEAD**     | pass          | `no leaks found`, 158 commits     | pass (P2)                 |
  | E0: as E1, named `nakaya.webp`                                                                             | pass          | `no leaks found`                  | **fail**, the file listed |
  | A0 (control): the same text at a new `.ico` path, then deleted                                             | pass          | **`leaks found: 1`**, 159 commits | pass                      |
  - `git log --stat` shows the text revision as `Bin 92 -> 51 bytes`: git prints a pair as "Binary files differ" when either side is binary, so the history scan skips it (the clone has 161 commits; the three are not even counted).
  - The check reads only each change's new blob (`HEADER` at `:44` captures it alone; `:56-60`) and judges it on its own (`:90-103`). A text revision after a `.woff2`, `.png`, `.jpg`, `.jpeg` or `.gif` already fails the name rule; after a `.webp`, `.avif` or `.ico` (accepted at `:38-41`, not on gitleaks' path allowlist) nothing fails.

- **Impact.** The round-6 J2 and round-7 K1 class: a credential that enters this public repository this way and is then removed is never reported, so nobody is prompted to rotate it; with a name P2 skips (E1), it stays at HEAD with every job green and no exception entry. Low: it needs an image at that path first and text written over it, GitHub push protection still blocks provider-format tokens, and no production secret exists yet.
- **Fix** (verified on a scratch copy of the script: A1, A2, E1 and E0 fail with "text after binary content"; `1898889`, A0 and the P2 probe tree pass).
  - In `parseRawLog`, capture the old mode and old blob as well (`/^\n*:(\d{6}) (\d{6}) ([0-9a-f]+) ([0-9a-f]+) ([A-Z])\d*$/`), keep the old blob for a change whose old mode is a regular file (`10…`) and whose old blob is not all zeros, and read those blobs in the same `cat-file --batch`.
  - In `problems`, report `<path>: text after binary content, which git diffs as binary` when the old blob is binary and the new one is not.
  - A unit test with such a pair, one for a merge (`-m` lists a pair per parent), and the README/ADR wording (P5).
  - Verified alternative or addition: `--text` in the history scan's `--log-opts` (`compose.yaml:21`) makes git print every pair as text. A1 and E1 are then reported, and `1898889` stays at 158 commits with no finding (the five fonts raise nothing). It does not close the image-metadata gap: a real PNG with a token in a `tEXt` chunk stayed unreported.

### P2 — The tree scan's directory mode still skips files (Info)

- **Evidence.**
  - Directory scan with the pinned configuration of 23 files, each holding a token: **3 reported**. Unreported:
    - any base name that merely _contains_ `.br`, `.tar`, `.zip`, `.gz`, `.7z`, `.rar`, `.xz`, `.zst`, `.bz2`, `.sz` or `.lz4`: `menu.brand.ts`, `app.browser.ts`, `build.target.ts`, `postal.zipcode.ts`, `x.rare.ts`, `data.tar.json`, `notes.gz.md`, … (`sources/file.go:53-75` asks `archives.Identify` with no stream, which matches by `strings.Contains` on the lower-cased base name, e.g. `mholt/archives` `brotli.go:28`, `tar.go:50`, `zip.go:87`; at max archive depth 0 the file is skipped);
    - text that starts like an "application" type: `{\rtf` (an RTF document is plain text), `%PDF`, `MZ`, `%!` (`sources/file.go:192-204`);
    - every file under a directory whose name is on the path allowlist, e.g. `logo.svg/secret.ts`, `go.mod/secret.ts` (`sources/files.go:124-127` skips the whole directory; the coverage check, like history mode, tests file paths only);
    - a match across the first chunk boundary: 100 kB chunks extended by at most 25 kB to a blank line (`sources/file.go:21`, `sources/common.go:16`); a token at byte 124,980 of a file with no blank line there is missed, the same token at byte 1,000 or 200,000 is found.
  - The same files plus a second chunk-boundary file, 24 in all, committed to a fresh repository and scanned with `gitleaks git`: **24 of 24 reported**. History mode reads text diffs whole and treats only binary diffs as archives (`sources/git.go:327-334`), so the history scan reports all of them.
  - End to end, x1: `src/modules/branches/domain/nakaya.brand.ts` with a token, then a commit-bound `.gitleaksignore` entry with a reason: guard, coverage, history (`no leaks found`) and tree step all pass, and the token stays at HEAD. x0, the same as `nakaya.ts`: the tree step fails with the file listed.
- **Impact.** ADR 0016 says the tree scan exists so that "neither an exception nor the new commit ids of a squash or rebase merge can leave a secret-like value in the tree"; these skips let an excepted value stay. `*.brand.ts` and `*.browser.ts` are ordinary names in a project with three brands. Info, like K3: alone each needs an exception entry the owner reads in the diff; combined with P1 (E1) none is needed.
- **Fix** (verified on the host with the built binary: `1898889` reports only the canary, E1 reports its file, a tree with seven of the probes above plus a force-added `dist/` file reports all eight; the current step reported only the `dist/` file). Scan the tree in git mode. After the existing checks and the canary in `ci.yml:137-145`:

  ```bash
  git -C "$tree" init -q
  printf '* !diff\n* !working-tree-encoding\n* !filter\n* !text\n' > "$tree/.git/info/attributes"
  git -C "$tree" add -A --force
  git -C "$tree" -c user.name=ci -c user.email=ci@example.invalid commit -qm tree
  ```

  then in `compose.yaml:35-37` run `git` on `/tree` instead of `dir`, and in `ci.yml:148` compare `.File` with `.ci-canary` (git mode reports relative paths). `--force` is needed because the export holds the repository's `.gitignore`; the attributes line keeps an exported `.gitattributes` from hiding or re-encoding a file, as `ci.yml:123` does for the history. The official image has `git` and sets `safe.directory`, and "The tree scan fails without a tree" keeps working (the configuration is still read from `/tree`).

### P3 — The skipped-name check matches differently from gitleaks (Info)

- **Evidence.** Each a text file with a token at HEAD, the whole secrets job: guard, coverage, history (`no leaks found`) and tree step all pass, and the token stays.
  - B1: `public/menu.<U+017F>vg` (LATIN SMALL LETTER LONG S for the `s`);
  - B2: `docs/x/server.soc<U+212A>et` (KELVIN SIGN for the `k`);
  - B3: `node_modules/a<CR>b/index.ts`, force-added.
  - Go's `regexp` (the engine gitleaks uses) matches all three against the pinned patterns, and also `node_modules/a<U+2028>b/index.ts`. The JavaScript `RegExp` built at `scripts/check-scan-coverage.ts:87` matches none: `i` without `u` does not fold U+017F to `s` or U+212A to `k`, and JavaScript's `.` stops at CR, U+2028 and U+2029, where Go's stops only at LF.
- **Impact.** The K2 class: a chosen file name defeats the guard. Info: the names are crafted.
- **Fix** (verified: all 25 patterns compile; B1–B3 fail; `1898889` passes). Build the patterns with flags `su`, plus `i` for a `(?i)` line. `u` gives Unicode case folding; `s` lets `.` cross every line terminator, which over-reports only for an LF in a name, failing closed. While there: the `::error::` line at `:140` prints the path as it is, so a name with a newline starts a second workflow command line; escape `%`, CR and LF as `%25`, `%0D`, `%0A`, as GitHub documents for workflow commands (only a failing run is affected).

### P4 — `next/script` children and a DOM-created script element lint clean (Info)

- **Evidence.** One probe file under `src/shared/ui/`; `tsc` accepts it, and no line is reported except the `execCommand` one, by the incidental `no-deprecated`:
  - `<Script id="…">{code}</Script>` with `next/script`: Next.js 16.4.3 writes the children to a new script element's `textContent` and appends it (`node_modules/next/dist/client/script.js:114`), so the code runs under today's `'unsafe-inline'` (L1). The selector at `eslint.config.mjs:153` and ADR 0015:96 cover only lower-case `<script>` and `<style>`; `next/script` is the documented Next.js way to write the inline analytics snippet round 7 named as the likely innocent shape;
  - `document.createElement('script')` followed by `.textContent =`, `.text =` or `.src =`;
  - React's `createElement('script', null, code)`;
  - `document['execCommand']('insertHTML', false, html)`: `execCommand` is in `HTML_CALL` (`:125-126`) but not in `HTML_SINK` (`:122-123`), so the string form passes.
- **Impact.** As K5: each must be written, and review is still a control. The `next/script` form is the one most likely to be written innocently.
- **Fix** (verified on the probe: all six lines reported; `document.createElement('div')` and `<Script src="/a.js" />` stay clean). Add to `UNSAFE_SYNTAX`, each with a fixture line:
  - `Script` to the name list at `:153`: `/^(?:script|style|Script)$/`;
  - `CallExpression:matches([callee.name='createElement'], [callee.property.name=/^createElement(?:NS)?$/]) > Literal.arguments[value=/^script$/i]`;
  - `execCommand` and `insertHTML` to `HTML_SINK`.

  Trusted Types (Phase 2) also covers these (script text and `src` take `TrustedScript` and `TrustedScriptURL`); as `script.js:111-114` shows, Next.js' own runtime assigns script `textContent` and `innerHTML`, so the Phase 2 policy needs a check that the framework still runs under it.

### P5 — The documents promise more than the checks enforce (Info)

- **Evidence.**
  - ADR 0016:63-68 and :120-122 ("with no exceptions"; "a value that looks like a secret cannot stay in the tree as text"): P2, and E1.
  - ADR 0016:82-89 ("with names as they are … must be one of three expected files"): P3.
  - README.md:49-50 ("unreadable or name-skipped files rejected anywhere in the history") and CHANGELOG.md:17 ("every file in the history checked to be one the scans can read"): P1, P3.
  - `risk-register.md:41` and ADR 0016:123-130 (known gaps): P1 and P2 are missing.
  - ADR 0015:80-81 (script execution "banned in every source file") and :96: P4.
- **Fix.** After P1–P4 land, state what each check covers; until then, list the residuals in ADR 0016's known gaps and the register row.

## Verified controls (no finding)

- **CI:** runs `40739432145` (`1898889`) and `40738788494` (`7c86861`), both `push`, green on all six jobs; the secrets job lists the new "Every file in the history is one the scans can read" step. Top-level `contents: read`, no `pull_request_target`, action SHAs and image digests unchanged, `persist-credentials: false` everywhere. The new `setup-node` uses the same pinned SHA, no cache. The coverage script runs with Node built-ins only (no install in that job), and `scripts/` is owned in CODEOWNERS (`:28`); `GET …/codeowners/errors` returns `[]`. I re-read every new pipeline and list under `-eo pipefail`: each fails closed, including the separate `test` lines and `links=$(find …)`.
- **Secret scanning at `1898889`:** coverage "Checked 638 paths of 637 blobs"; history 158 commits, `no leaks found`; tree step: exactly the canary (about 1.01 MB scanned); "The tree scan fails without a tree" passes. `.gitleaksignore` still holds only the two commit-bound entries with reasons, and the skipped-path copy is unchanged.
- **Semgrep:** errors are now fatal and files of any size are read (K6); the ignore file still skips only `tests/fixtures/`.
- **Lint and routing:** K4 as above; `tests/lint-rules.test.ts` (green) proves the fourteen new fixture lines and the three new look-alikes.
- **Audits and freshness:** both audit steps verbatim exit 0 (`3 high (3 ignored)`; production `true`); the four freshness steps exit 0, including both positive controls.
- **Services:** the compose file, `docker/` and `.env.example` are unchanged since round 6; the CI services job is green at `1898889`. Not re-run locally this round.

## Notes outside security scope (for the code reviewer)

- `parseRawLog` relies on git's configured merge format: with `log.diffMerges=combined` in a runner's git configuration, merges come out as `::` lines that `HEADER` does not match and are skipped without a message (the K1 merge case then passes). Pass `--diff-merges=separate` explicitly and fail on any non-empty token that is neither a header nor the path after one. Not reachable from the repository.
- `tests/source-extensions.test.ts:7` is case-sensitive; a `page.TSX` is neither linted nor routed (checked above), so this is harmless today.

## Carry-forward checklist

- **Before merge (owner):** the N3 ruleset, verified with the API, including `allowed_merge_methods` (merge and squash, no rebase).
- **Cheap, before merge:** P1 (pair check, or `--text`), P2 (tree scan in git mode), and P5's corrections for whatever lands.
- **Any time before Phase 2:** P3, P4.
- **After merge (owner):** F10 and N5 — confirm a scheduled run and the first Dependabot PRs; enable Dependabot security updates and non-provider secret patterns (G1 step 4).
- **Phase 2:** nonce CSP covering `/t/*` (L1), with `require-trusted-types-for 'script'` (K5, P4) checked against the Next.js runtime; migration role (L6), immutable-record revokes, env split, E2E artifact hygiene; the H6 host and TLS rules.
- **Phase 3:** CMS slug validation; absolute URLs from a configured origin.
- **Phase 4:** the `/t/*` locale from the route, never from the header (H7).
- **Phase 5:** SeaweedFS JWT signing and internal ports unreachable from the host (G2); Redis ACLs and secret files; Nginx `Host` pinning, headers with `always`, dropping `x-nextjs-*`, clearing the inbound locale header; HSTS domain inventory; `APP_ENV` in the deploy unit; Node base image by digest; Node 24 before 2027-01-30 (F7).
