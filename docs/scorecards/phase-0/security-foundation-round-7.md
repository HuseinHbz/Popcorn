# Security review — Phase 0 / platform foundation, round 7

- Reviewer: security-reviewer (fresh session, round 7)
- Date: 2026-10-28
- Scope: the whole branch against `origin/main` (`chore/phase-0-foundation`, HEAD `a3d1e29`), focused on `git log a2d5e28..a3d1e29` (27 commits, 35 files):
  - the services steps (output captured before `grep`, exactly one telemetry flag, S3 port and bucket from `.env`);
  - the production audit with `--audit-level=high`;
  - the guard's binary-file check, the gitleaks skipped-path check (`.github/ci-tools/gitleaks-skipped-paths.txt` and its version test) and the `git grep` exit handling;
  - `.git/info/attributes` with `* !working-tree-encoding`;
  - the history scan's `--log-opts` (`-m`, `--diff-filter=uxdb`);
  - the tree scan's in-tree rules, canary and JSON report, and the "fails without a tree" control;
  - Semgrep on the exported tree with `.github/ci-tools/semgrepignore` and a scanned-files check;
  - the raw-HTML lint changes; CODEOWNERS with a catch-all; `scripts/check-package-manager.ts`; the Lighthouse annotations.
- Baseline: [`security-foundation-round-6.md`](security-foundation-round-6.md) (at `a2d5e28`: Pass; N3 Medium · J1–J3 Low · J4–J7 Info), the author's [`foundation-round-6-response.md`](foundation-round-6-response.md) and the corrections at the end of [`foundation-round-4-response.md`](foundation-round-4-response.md) and [`foundation-round-5-response.md`](foundation-round-5-response.md). Every status below was re-measured, not taken from the response.
- Standard: OWASP ASVS 5.0.0 Level 2, only the parts that apply to what exists. `src/` still has no auth, session, upload, OTP, QR token, route handler or server action, so the plan §7 controls for those are not yet testable.
- Context read: `CLAUDE.md`, `docs/project-plan.md` §3 and §7, `docs/phases/phase-00.md`, ADRs 0013–0018, the risk register, `.github/CODEOWNERS`, `.gitleaksignore`, `.github/ci-tools/`, `.github/workflows/ci.yml`, the six earlier security reviews and the responses.

## Method

Read-only: no tracked file was changed except this report. My server (port 3671, stopped by its own port), my compose projects (`secr7`, `secr7s`, with their containers, volumes and networks), the local image, the scratch clones, the probe files and the tools I built were removed.

- Read every file changed in `a2d5e28..a3d1e29`, and the gitleaks v8.30.1 sources for `.gitleaksignore` loading, fingerprints and the default configuration.
- `pnpm lint` exit 0 · `pnpm test` 153/153 · `pnpm build` and `next typegen && tsc` clean. Local Node 22.22.0; CI uses 22.23.4.
- Every CI step I ran was extracted verbatim from `ci.yml` with a YAML parser and run as Actions runs it, `bash --noprofile --norc -eo pipefail <file>`.
- Both audit steps and the four freshness steps, verbatim: all exit 0 (`3 high (3 ignored)`; production `true`). pnpm 10.34.9's audit code read: with `--json` the exit status counts only non-ignored advisories at or above the level, and `metadata.vulnerabilities` keeps the ignored ones, so the production `jq` check still fails on an accepted risk in a production dependency.
- Secret scanning: ghcr.io and the job logs (blob host) were unreachable. I built gitleaks v8.30.1 from the module in the local Go cache (its `h1:` hash matches `sum.golang.org`), static, and wrapped it in a local image. The two tree-scan steps ran verbatim: a `docker` wrapper on `PATH` added an override file outside the repo that only swaps the image. The history scan ran on the host with the service's exact arguments (my image has no `git`). Each case ran in its own scratch clone of `a3d1e29`, the guard step first, then `.git/info/attributes` exactly as CI writes it. Each case plants a random `ghp_`-shaped token or a random 32-character S3-style secret generated at run time (never printed, never written outside the clone).
- Semgrep: the pinned image (cached by digest) through the same wrapper. The registry packs are still unreachable (semgrep.dev refused), so the override replaces only the `--config` list with a local `eval($X)` rule; targeting, the ignore file and the scanned-files check are what was tested.
- Services: compose project `secr7s` (cached `postgres:17.6-alpine` and `redis:7.4-alpine` through an override outside the repo; SeaweedFS from the pinned digest); steps 1–12 verbatim; two telemetry negative controls.
- Lint and `tsc` on probe files under `src/`; `next build` and `next start` for a `.js` page (K4).
- GitHub API: run `40670345287` for `a3d1e29` (event `push`; all 6 jobs `success`), the build job's annotations, repository settings, merge methods, branches, branch protection, rulesets and CODEOWNERS errors.

## Gate verdict

**Pass**: 0 Critical · 0 High.

- **Round 6:** J2, J3, J4 and J7 are fixed. J1, J5 and J6 are fixed for every reported shape, with new residuals (K1, K2, K4, K5). F10, N5 and N6 are owner actions, recorded.
- **N3 (no branch protection on `main`) stays open as a Medium.** `GET …/branches/main`: `"protected": false`; `…/rulesets` and `…/rules/branches/main`: `[]`; merge commits, squash and rebase are all allowed. GitHub's `main` is still `049877d`, the base of this branch, so nothing has been merged. As rounds 5 and 6 said: if this branch merges before the ruleset exists, the next review rates N3 High.
- **New:** 2 Low (K1, K4) and 5 Info (K2, K3, K5–K7). K1 is the round-6 J2 class again: a secret reaches this public repository with every job green and nothing reports it. K4 turns off the whole raw-HTML ban, and every other project lint rule, by file extension. Each fix is a few lines and was verified below.

## Status of round-6 findings

| ID  | R6 sev.  | Status                                              | Evidence (file:line)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | -------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| J1  | Low      | **Fixed** (reported shapes); residuals K1, K2       | `ci.yml:130`. A file given `working-tree-encoding=UTF-16LE-BOM` (UTF-8 blob, UTF-16 work tree) is now reported by both scans, in an ordinary commit (`leaks found: 1`, tree step fails) and when a merge commit adds it (`leaks found: 2`, tree step fails). A UTF-16 file at HEAD fails the guard (`ci.yml:108-113`, "binary content in"). README, CHANGELOG and ADR 0016 no longer say "cannot weaken". Residuals: the guard looks only at HEAD (K1) and trusts the extension (K2).                                                                                   |
| J2  | Low      | **Fixed**                                           | `compose.yaml:21`. A token in a file turned from a symlink into a file and deleted one commit later: `leaks found: 1`. A token added by a merge resolution and deleted one commit later: `leaks found: 2` (one per parent). `a3d1e29`'s history stays `no leaks found` (144 commits, the merge `49528ae` included); the commit-bound `.gitleaksignore` entries still match.                                                                                                                                                                                             |
| J3  | Low      | **Fixed**; residual K3                              | `ci.yml:136-158`, `compose.yaml:28-46`. Unchanged tree: the step passes with exactly one finding, the canary (892,639 bytes scanned). "The tree scan fails without a tree", verbatim: both the unmounted and the empty run fail with "unable to load gitleaks config" (`cmd/root.go:193`), and the step passes. A token in `src/` makes the tree step fail with the token's file listed. Residual: K3.                                                                                                                                                                  |
| J4  | Info     | **Fixed**                                           | `ci.yml:308-320`. The step passes verbatim on the committed stack. With a later `-master.telemetry=true` (override outside the repo), the configuration check fails. With the flag appended by an `entrypoint` wrapper, so the configuration still shows exactly one flag set off, weed logs "Reporting anonymous cluster statistics …" and the step **failed 15 of 15 runs** on the log check.                                                                                                                                                                         |
| J5  | Info     | **Fixed** (HEAD, ASCII names); residuals K1, K2, K6 | gitleaks: the copy holds exactly the 25 path patterns of v8.30.1's `[allowlist]`; `tests/ci-workflow.test.ts:26-35` ties it to the image tag. A text `.svg` with a token at HEAD fails the guard. Semgrep: with the pinned ignore file, files in `tests/`, `build/`, `dist/`, `vendor/`, `out/`, a hidden directory and `e2e/` were all reported, `tests/fixtures/` was skipped, and the step's `jq` check requires `src/proxy.ts` and `tests/lint-rules.test.ts` (with a TypeScript/JavaScript rule, 82 files read at HEAD, 11 under `tests/`). Residuals: K1, K2, K6. |
| J6  | Info     | **Fixed** (listed shapes); residuals K4, K5         | `eslint.config.mjs:128-147`; fixture lines `tests/fixtures/src/shared/ui/unsafe-code.tsx:18-33` cover every shape round 6 listed, the look-alikes at `:37-42` stay clean, and `tests/lint-rules.test.ts` is green.                                                                                                                                                                                                                                                                                                                                                      |
| J7  | Info     | **Fixed**                                           | `CODEOWNERS:6` (`*`), with the round-6 paths named at `:12-56`; `GET …/codeowners/errors?ref=chore/phase-0-foundation` returns `[]`.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| G1  | Low (R4) | **Fixed in the repository**; new residuals          | Step 4 is an owner setting: `secret_scanning_non_provider_patterns` and validity checks are still `disabled` (`risk-register.md:38`). Residuals of the same class: K1, K2, K3.                                                                                                                                                                                                                                                                                                                                                                                          |
| N3  | Medium   | **Open (owner action, before merge)**               | As in the gate verdict. The register row (`risk-register.md:39`) is complete; the repository settings are missing.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| N5  | Low      | **Partially fixed** (unchanged)                     | Weekly schedule at `ci.yml:8-9`; `dependabot_security_updates: disabled`; GitHub's `main` still has no `.github/` (F10).                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| N6  | Low      | **Open (owner decision), recorded**                 | `visibility: public`; `risk-register.md:40`. The only binary files ever committed are the five OFL font subsets (real `wOF2` signatures); no Peyda file anywhere in the history.                                                                                                                                                                                                                                                                                                                                                                                        |
| F10 | Info     | **Open (owner, after merge)**, recorded             | Settings as in N5 and G1; `risk-register.md:38`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

Round-1 carry-forwards are unchanged: L1 (`'unsafe-inline'` in `script-src`, `next.config.ts:14`, Phase 2; becomes High if Phase 2 closes without a nonce CSP), L6 (migration role, Phase 2), I4 (HSTS inventory, Phase 5). `next.config.ts`, `src/proxy.ts`, `src/shared/config/`, the compose file, the lockfile and `package.json` are unchanged since round 6.

## New findings

| ID  | Severity | Location                                                                                                  | Title                                                                                                               |
| --- | -------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| K1  | Low      | `.github/workflows/ci.yml:108-124`                                                                        | The binary and skipped-name checks look only at HEAD, so such a file added and then deleted is never reported       |
| K2  | Info     | `.github/workflows/ci.yml:111-116`                                                                        | The name check misses paths git quotes, and the binary check trusts the extension                                   |
| K3  | Info     | `.github/workflows/ci.yml:136-148`; gitleaks `cmd/root.go:317-321`, `detect/detect.go:712-733`            | The tree scan's "no exceptions" has three side doors                                                                |
| K4  | Low      | `eslint.config.mjs:284`, `:307-312`                                                                       | `.js`, `.mjs`, `.cjs`, `.mts` and `.cts` files under `src/` skip every project lint rule, the raw-HTML ban included |
| K5  | Info     | `eslint.config.mjs:128-147`                                                                               | Further raw-HTML and script-execution shapes lint clean                                                             |
| K6  | Info     | `.github/ci-tools/compose.yaml:51-65`; `ci.yml:178-181`                                                   | Semgrep silently skips files over 1 MB and files that time out                                                      |
| K7  | Info     | ADR 0016:62-66, :79-84, :113-119; `risk-register.md:41`; README.md:47-51; CHANGELOG.md:17; ADR 0015:75-84 | The documents promise more than the checks enforce, and the known-gap list is incomplete                            |

### K1 — The binary and skipped-name checks look only at HEAD (Low)

- **Evidence.** One run-time token per case, harness as in Method.

  | Case                                              | Guard                         | History scan     | Tree step |
  | ------------------------------------------------- | ----------------------------- | ---------------- | --------- |
  | UTF-16 text file at HEAD                          | fail ("binary content in")    | `no leaks found` | pass      |
  | Same file, deleted one commit later               | **pass**                      | `no leaks found` | pass      |
  | Text `.svg` with a token at HEAD                  | fail ("skips this text file") | `no leaks found` | pass      |
  | Same `.svg`, deleted one commit later             | **pass**                      | `no leaks found` | pass      |
  | Text file named `*.pdf`, deleted one commit later | **pass**                      | `no leaks found` | pass      |
  - `ci.yml:111` and `:116` read `git ls-files`, the index of HEAD. The marker check just above (`:98`) reads `git log --all`, so the guard already knows how to look at the history; these two checks do not.
  - Git prints a UTF-16 blob as "Binary files differ", so the history scan never sees its text (the commit is not even counted: 144 commits scanned, against 145 for a text commit); gitleaks skips the `.svg` and `.pdf` by path in both scans.

- **Impact.** The round-6 J2 class: a credential that enters this public repository this way and is then deleted (the usual reaction, or a branch cleaned up before merge; the pushed commit stays public, and a pull request's head ref keeps it after a squash merge) is never reported, so nobody is prompted to rotate it. Low: it needs an unusual file (PowerShell 5.1 writes UTF-16 with `>`, so one of the two can happen by accident), GitHub push protection still blocks provider-format tokens, and no production secret exists yet.
- **Fix** (verified: each case above, plus K2's two quoted names, then fails the guard; `a3d1e29` passes). Run both checks over every change in the history, after the existing ones:

  ```bash
  log=$(git -c core.quotePath=false log --all -m --no-renames --numstat --format=)
  if grep -q $'\t"' <<<"$log"; then echo "::error::a path git has to quote (rename it)"; exit 1; fi
  binary=$(awk -F'\t' '$1 == "-" && $3 !~ /\.(woff2?|ttf|otf|png|jpe?g|gif|webp|avif|ico)$/ { print $3 }' <<<"$log" | sort -u)
  if [ -n "$binary" ]; then echo "::error::binary content in the history: $binary"; exit 1; fi
  text=$(awk -F'\t' '$1 != "-" && NF == 3 { print $3 }' <<<"$log" | sort -u)
  ```

  then run the existing skipped-pattern loop (`ci.yml:117-124`) over this `$text`. Today the history holds no binary other than the five fonts and no skipped text path other than the three expected ones, so nothing needs a waiver.

### K2 — The name check misses paths git quotes, and the binary check trusts the extension (Info)

- **Evidence.**
  - `git ls-files --eol` quotes a path with a non-ASCII byte, a double quote, a backslash or a control character (`core.quotePath` is on by default, as on the runner), so `$2` at `ci.yml:116` ends in `"` and no `…$` pattern of the allowlist matches it; gitleaks matches the real name. A text `public/<Persian name>.svg` and a text `docs/menu "draft".pdf`, each with a token at HEAD: guard pass, history `no leaks found`, tree step pass. Persian asset names are plausible in this project. (The binary check fails closed on the same quoting.)
  - `ci.yml:112` accepts any binary file whose name ends in a font or image extension. A UTF-16 text file named `src/app/menu.png` with a token: guard pass, history `no leaks found`, tree step pass (the name is also on gitleaks' allowlist).
- **Impact.** The J5 class: a chosen file name defeats the guard. Info: it needs an unusual name, or a text file disguised as an image.
- **Fix** (verified).
  - Use `git -c core.quotePath=false ls-files --eol` at `ci.yml:111` and `:116` and fail on any line whose path starts with `"` (the K1 snippet does the same for the history).
  - Require the format's signature for every binary file: for each path the awk at `:111` lists, `*.woff2` must start with `wOF2` (`head -c 4`), `*.png` with `89 50 4e 47 0d 0a 1a 0a`, and any other extension fails until its signature is added. The disguised `.png` then fails; the five fonts pass.

### K3 — The tree scan's "no exceptions" has three side doors (Info)

- **Evidence.**
  - `.gitleaksignore` is exported into the tree, and gitleaks loads it from the scanned directory (`cmd/root.go:317-321`). A three-part entry (`file:rule:line`) is a global fingerprint that also applies to a directory scan (`detect/detect.go:712-733`): with `/tree/src/x.ts:github-pat:1` added, the tree step passed with a token in `src/x.ts`. Today only `tests/gitleaksignore.test.ts:6` stops such an entry, in the build job, not in the job that scans.
  - The canary is written over whatever `.ci-canary` the tree holds (`ci.yml:145`). A committed root `.ci-canary` with a token, plus a commit-bound `.gitleaksignore` entry for the history scan (the form the unit test accepts, with a reason): guard pass, history `no leaks found`, tree step pass, and the token stays at HEAD.
  - gitleaks does not follow symbolic links. A tracked symlink whose target text is a token: the history scan reports it (the blob is the target text), the tree step passes; with a commit-bound entry, both pass.
- **Impact.** ADR 0016:113-117 says "the tree scan has no exceptions, so a value that looks like a secret can never stay in the tree as text"; each door above lets one stay. Info: all three need an exception entry that the owner reads in the diff.
- **Fix** (verified: all three then fail the tree step; `a3d1e29` passes). After `test -s "$tree/package.json"` (`ci.yml:141`), on separate lines:

  ```bash
  rm -f "$tree/.gitleaksignore"
  test ! -e "$tree/.ci-canary"
  test ! -L "$tree/.ci-canary"
  links=$(find "$tree" -type l); test -z "$links"
  ```

  Keep the tests on separate lines: my first version joined the two canary tests with `&&`, and under `set -e` a failing left side of `&&` does not stop the step, so it passed a committed `.ci-canary`. The comment at `ci.yml:22-30` should say so next to the `!` rule.

### K4 — Non-TypeScript source files under `src/` skip every project lint rule (Low)

- **Evidence.**
  - The project rules (`no-restricted-syntax` with the raw-HTML, token and i18n lists, `react/jsx-no-literals`, `boundaries/dependencies`) apply only to `src/**/*.{ts,tsx}` (`eslint.config.mjs:284`), and the purity rules only to `.ts`/`.tsx` under `domain/` and `shared/lib` (`:307-312`). `eslint --print-config` for a `.js` or `.mts` file under `src/` shows `no-restricted-syntax`, `react/jsx-no-literals` and `boundaries/dependencies` unset.
  - Proof end to end: `src/app/[locale]/(site)/<probe>/page.js`, a client component that assigns `window.location.hash` to `innerHTML`, with an inline `color: 'red'` and the literal text "Hello world". `eslint --max-warnings=0`: exit 0. `next typegen && tsc --noEmit`: exit 0 (`allowJs: false` only stops TypeScript from reading it). `pnpm build` lists `/fa/<probe>` and `/en/<probe>`; `next start` serves `/fa/<probe>` with 200, the raw colour and the literal text in the HTML. That is a DOM XSS sink on a public page with every check green.
  - A `.js` module with a `.d.ts` beside it, imported from a `.ts` file: lint and `tsc` exit 0. A `.mts` file assigning `innerHTML`: lint exit 0. Only `.jsx` fails closed (a parse error: the typed rules cannot find it in the project).
  - `.mjs`, `.cjs` and `.cts` were not run; they fall outside the same globs. No test or check rejects any of these files; ADR 0015:75 says these constructs are "banned everywhere".
- **Impact.** The security rule from rounds 3–6 (F8, G4, H5, J6) and the CLAUDE.md non-negotiables (tokens, next-intl, module boundaries, pure `domain/`) are off for a whole file by choosing an extension that Next.js builds without complaint. Low: nothing in `src/` uses it today and the owner reads every diff, but unlike J6 this is not a contrived shape — `.js` is the default in most snippets, and an agent or a copy-paste produces it by accident.
- **Fix.**
  1. `eslint.config.mjs:284` and `:307-312`: extend each `files` glob to `{ts,tsx,mts,cts,js,jsx,mjs,cjs}`.
  2. Reject the extensions outright: a test (or a guard line) that fails when `git ls-files src` lists any `.js`, `.jsx`, `.mjs`, `.cjs` or `.cts` file (CLAUDE.md: TypeScript strict).
  3. `next.config.ts`: `pageExtensions: ['tsx', 'ts']`, so a stray `page.js` is never routed.
  4. A fixture line for 1 and a test for 2.

### K5 — Further raw-HTML and script-execution shapes lint clean (Info)

- **Evidence.** One probe file in `src/shared/ui/` of the review clone; `tsc` accepts every line, and none gets a `no-restricted-syntax` error (some get only an incidental `unbound-method` or `no-deprecated`):
  - a sink method called through `.call`, `.apply` or `.bind` (`node.insertAdjacentHTML.call(node, 'beforeend', html)`, `range.createContextualFragment.call(…)`, `Element.prototype.insertAdjacentHTML.apply(…)`), or destructured first (`const { setHTMLUnsafe } = node`);
  - writing a sink through a pattern: `[node.innerHTML] = [html]`, `({ a: node.outerHTML } = { a: html })`, `for (node.innerHTML of [html])`;
  - an event-handler attribute through a template literal (``setAttribute(`onclick`, code)``), `setAttributeNS(null, 'onclick', code)` or `document.createAttribute('onclick')`;
  - `document.execCommand('insertHTML', false, html)` (only `no-deprecated`);
  - `<script>{code}</script>` in JSX: React 19's server renderer writes the string as the script body (it escapes only `</script` and `<!--`; checked with `renderToString`), so it runs on page load under today's `'unsafe-inline'` (L1);
  - `` location.href = `javascript:${code}` `` (`no-script-url` reads only templates without expressions);
  - an HTML `Blob` opened through `URL.createObjectURL`, which runs with the page's origin.
- **Impact.** Same as J6: each shape has to be written, and review remains a control. The JSX `<script>` child is the one most likely to be written innocently (a JSON-LD or analytics snippet).
- **Fix.**
  - Add to `UNSAFE_SYNTAX`, each with a fixture line (verified on a 13-line probe of every shape above except the `Blob`, which stays a review item: all 13 lines are reported, today's `src/` stays clean, the look-alikes at `unsafe-code.tsx:37-42` stay clean; fixture lines 15, 16 and 24–27 get a second `no-restricted-syntax` report, so adjust their expectations):
    - `MemberExpression[computed=false][property.name=/^(?:insertAdjacentHTML|createContextualFragment|parseFromString|setHTMLUnsafe|parseHTMLUnsafe|execCommand)$/]` (any reference, which covers `.call`/`.apply`/`.bind`), and `ObjectPattern > Property` with the same key names;
    - `:matches(ArrayPattern, AssignmentPattern, ForOfStatement, ForInStatement, RestElement) > MemberExpression[property.name=<HTML_PROPERTY>]` and `ObjectPattern > Property > MemberExpression.value[property.name=<HTML_PROPERTY>]`;
    - `CallExpression[callee.property.name=/^(?:setAttribute|setAttributeNS|createAttribute|createAttributeNS)$/]` with a `Literal` argument or a `TemplateElement` matching `/^on/i`;
    - `JSXElement[openingElement.name.name=/^(?:script|style)$/] > JSXExpressionContainer`;
    - `TemplateElement[value.raw=/^\s*javascript:/i]`.
  - Structural fix, with the Phase 2 nonce CSP (L1): add `require-trusted-types-for 'script'`. The browser then rejects a string at every DOM sink whatever its syntax or file extension (K4), and the selector list stops having to grow.

### K6 — Semgrep silently skips files over 1 MB and files that time out (Info)

- **Evidence.** Semgrep's default `--max-target-bytes` is 1,000,000. A 1.97 MB `src/p/big.ts` ending in `eval(x)`: not reported; the summary says "Files larger than 1.0 MB: 1", the JSON report has no skipped list, and the step's `jq` check (`ci.yml:180-181`) passes because it looks only for two named files. With `--max-target-bytes=0` the file is read but the rule timed out on it, which appears only in the report's `errors` array, and the exit status stays driven by findings.
- **Impact.** A large source or generated file is outside SAST with the job green. Info: gitleaks has no such limit, `max-lines: 300` makes a 1 MB hand-written `.ts` file unlikely, and Semgrep is not the only XSS control.
- **Fix.** `compose.yaml`: add `--max-target-bytes=0`. `ci.yml:180`: also require `jq -e '.errors == []'` (first confirm on CI that the registry packs report no error at HEAD; locally I could only run a local rule, which reported none).

### K7 — The documents promise more than the checks enforce (Info)

- **Evidence.**
  - ADR 0016:79-84 ("only files with a binary format's extension may be binary"; "a text file on gitleaks' built-in path allowlist … fails CI"), README.md:47-51 and CHANGELOG.md:17 ("binary or name-skipped text files rejected"): true only at HEAD and for unquoted names (K1, K2).
  - ADR 0016:62-66 and :113-117 ("with no exceptions"; "can never stay in the tree as text"): K3.
  - ADR 0016:118-119 and `risk-register.md:41` (known gaps): missing K1, K2 and K3, and one upstream behaviour: gitleaks v8.30.1's built-in global allowlist regex `(?i)^true|false|null$` binds as three alternatives, so any secret that contains "false" in any case, or starts with "true" or ends with "null", is dropped. Verified with a generic 32-character secret: reported, then `no leaks found` once five of its characters spell that word. Rare for random tokens (about one in a million), trivial on purpose.
  - ADR 0015:75 ("`javascript:` URLs and raw HTML are banned everywhere") and :76-84: not in `.js` files (K4), nor the shapes in K5.
- **Fix.** After K1–K5 land, state what each check covers (HEAD or history, which names, which file types), add the remaining gaps (the gitleaks allowlist regex; Semgrep's size limit if K6 is not taken) to ADR 0016's known gaps and the register row, and say in ADR 0015 which file types the rules cover.

## Verified controls (no finding)

- **CI:** run `40670345287` (`a3d1e29`, push) is green on all six jobs. Top-level `contents: read`, no `pull_request_target`, action SHAs and image digests unchanged, `persist-credentials: false` everywhere. I re-read every pipeline and `&&`/`||` list under `-eo pipefail`: each fails closed, including the `git grep … || [ $? -eq 1 ]` check (status 2 stops the step), the skipped-pattern loop (a `grep -P` error exits the loop and the assignment fails the step), and every `out=$(…)` capture before `grep -q`.
- **Secret scanning:** history (144 commits) and tree clean at `a3d1e29`; neither scanner honours an inline marker; the guard rejects scanner config files and markers as in round 6; `.gitleaksignore` holds only the two commit-bound entries with reasons; the skipped-path copy equals v8.30.1's global list. Its per-rule path allowlists are narrower and not a gap: `generic-api-key`'s `.bb`/`.inc` list applies only together with BitBake `LICENSE`/`SRC` line patterns (a secret in `deploy.inc` was reported), and the GitHub rules skip only one `@octokit` README.
- **Semgrep:** the exported tree is read without `.gitignore` rules (a force-added file under `dist/` and one under `out/` were reported); `.git/info/attributes` neutralises `export-ignore` and `working-tree-encoding` for its export too.
- **Services:** all eleven steps pass verbatim; S3 port and bucket come from `.env`, and a missing value makes `curl` fail closed; the object store is unreachable by name from Redis and Postgres.
- **Package-manager check:** `{ pnpm: null }` now throws (`scripts/check-package-manager.ts:32`); a `__proto__` or prototype name cannot pass (`Object.keys` and the array check). The positive control still catches pnpm 10.28.0.
- **Lighthouse annotations:** only the configured URL's pathname and numeric scores reach the `::notice` line (`scripts/lighthouse-summary.ts:54-61`), so no page content can inject a workflow command. Annotations read through the checks API: `/en` performance 97 (95–98), `/fa` 98 (80–99), other categories 100.
- **CODEOWNERS:** catch-all, no errors.
- **Code changes in `src/`:** the locale-list refactors in `page.tsx`, `date.ts` and `money.ts` change no trust boundary.

## Notes outside security scope (for the code reviewer)

- `ci.yml:22-30` warns about `!` but not about `a && b` where `a` is a check: under `set -e` a failing `a` does not stop the step unless the list is the step's last command. No step has that shape today; K3's fix shows how easily one appears.
- The S3 steps (`ci.yml:331`, `:335`) source `.env` as shell; bash, Docker Compose and Next.js parse `.env` differently (quotes, `$`, spaces). Fine for today's file.
- The `/fa` Lighthouse performance runs ranged 80–99 in run `40670345287` (median 98); the CI annotations also announce the `ubuntu-latest` move to Ubuntu 26.

## Carry-forward checklist

- **Before merge (owner):** the N3 ruleset, verified with the API, including `allowed_merge_methods` (merge and squash, no rebase).
- **Cheap, before merge:** K1 (history-wide binary and name checks), K3 (tree-scan hardening), K4 (lint globs, the extension ban, `pageExtensions`), and K7's corrections for whatever lands.
- **Any time before Phase 2:** K2, K5 (selectors), K6.
- **After merge (owner):** F10 and N5 — confirm a scheduled run and the first Dependabot PRs; enable Dependabot security updates and non-provider secret patterns (G1 step 4).
- **Phase 2:** nonce CSP covering `/t/*` (L1), with `require-trusted-types-for 'script'` (K5); migration role (L6), immutable-record revokes, env split, E2E artifact hygiene; the H6 host and TLS rules.
- **Phase 3:** CMS slug validation; absolute URLs from a configured origin.
- **Phase 4:** the `/t/*` locale from the route, never from the header (H7).
- **Phase 5:** SeaweedFS JWT signing and internal ports unreachable from the host (G2); Redis ACLs and secret files; Nginx `Host` pinning, headers with `always`, dropping `x-nextjs-*`, clearing the inbound locale header; HSTS domain inventory; `APP_ENV` in the deploy unit; Node base image by digest; Node 24 before 2027-01-30 (F7).
