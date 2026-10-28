# Security review — Phase 0 / platform foundation, round 6

- Reviewer: security-reviewer (fresh session, round 6)
- Date: 2026-10-28
- Scope: the whole branch against `origin/main` (`chore/phase-0-foundation`, HEAD `a2d5e28`), focused on `git log fe5b81c..a2d5e28` (15 commits, 30 files):
  - `defaults.run.shell: bash` and the rewritten telemetry check (`.github/workflows/ci.yml:22-27`, `:247-263`);
  - gitleaks with `--ignore-gitleaks-allow`, Semgrep with `--disable-nosem`, and `.git/info/attributes` (`ci.yml:101-105`, `.github/ci-tools/compose.yaml:7-55`);
  - the tree scan from `git archive HEAD` (service `gitleaks-tree`, `ci.yml:108-117`);
  - the guard step and its scorecard allowlist (`ci.yml:82-100`);
  - `.github/CODEOWNERS`;
  - the raw-HTML sink bans and the `as`/`satisfies`/`!` wrappers (`eslint.config.mjs:10-15`, `:123-135`);
  - trimmed service passwords and the 8-distinct-character rule (`src/shared/config/env.ts:54-69`);
  - the English 404's home link (`src/shared/ui/not-found/index.tsx:14-15`);
  - the new risk-register rows, ADRs 0013–0018, README and CHANGELOG.
- Baseline: [`security-foundation-round-5.md`](security-foundation-round-5.md) (at `fe5b81c`: Pass; N3 Medium · H1, H2, N5, N6 Low · H3–H7, F7, F10 Info), the author's [`foundation-round-5-response.md`](foundation-round-5-response.md) and the "Corrections after round 5" section of [`foundation-round-4-response.md`](foundation-round-4-response.md). Every status below was re-measured, not taken from the response.
- Standard: OWASP ASVS 5.0.0 Level 2, only the parts that apply to what exists. There is still no auth, session, upload, OTP, QR token, route handler or server action in `src/`, so the plan §7 controls for those are not yet testable.
- Context read: `CLAUDE.md`, `docs/project-plan.md` §3 and §7, `docs/phases/phase-00.md`, ADRs 0013–0018, the risk register, `.github/CODEOWNERS`, `.gitleaksignore`, `.github/ci-tools/`, `.github/workflows/ci.yml`, the five earlier security reviews and the two responses.

## Method

Read-only: no tracked file was changed except this report. My server (port 3661), my compose projects (`secr6`, `secr6t`, `secr6g`, with their volumes and networks), the local test image, the scratch clones, the probe files and the tools I built were removed. The Docker daemon was not running when I started; I started it and left it running with no containers.

- Read every file changed in `fe5b81c..a2d5e28`.
- `pnpm lint` exit 0 · `pnpm test` 150/150 · `pnpm build` (route table `ƒ /_not-found`, `● /fa`, `● /en`). Local Node 22.22.0; CI uses 22.23.4.
- `pnpm audit --audit-level=high`: 3 High, all ignored (R-001…R-003), exit 0. `pnpm audit --prod`: all zero, exit 0.
- Secret scanning: ghcr.io still refuses the pinned image's blobs (403), so I built gitleaks v8.30.1 from source with `go install` (module checksums verified by the Go checksum database), and a static build of the same version wrapped in a local image so that the compose service `gitleaks-tree` itself could be run through an override file outside the repo. I read the source for the history `git log` arguments, the directory walker and the built-in configuration. Each case below ran in its own scratch clone of `a2d5e28`: the guard step extracted verbatim from `ci.yml` and run with `bash --noprofile --norc -eo pipefail`, `.git/info/attributes` written exactly as CI writes it, the history scan with the CI arguments, and the tree scan of `git archive HEAD`. Each case plants one random `ghp_`-shaped token generated at run time (never printed, never written outside the clone).
- Semgrep: the pinned image (`1.182.1`, cached by digest) with CI's flags and local rules; the registry packs are still unreachable (semgrep.dev refused by the proxy), so for rule coverage I fetched single rules from the public `semgrep-rules` repository. I could not confirm which of them the packs include.
- `parseEnv` called directly for 9 production cases (H6).
- `next start` on 127.0.0.1:3661: 7 paths × 5 values of `X-NEXT-INTL-LOCALE`, home-link target and response headers (H7, the English 404).
- Lint and `tsc` on one probe file with 20 raw-HTML shapes (J6).
- Docker 29.9.2: compose project `secr6` with an image override outside the repo (cached `postgres:17.6-alpine`, `redis:7.4-alpine`; SeaweedFS from the pinned digest), the `services` steps run verbatim (in the two S3 steps, which hard-code port 8333, only the port changed); project `secr6t` with telemetry switched on (J4).
- GitHub API: run `40619185963` for `a2d5e28` (event `push`; all 6 jobs and every step `success`), repository settings, merge methods, branches, branch protection, rulesets and CODEOWNERS errors.

## Gate verdict

**Pass**: 0 Critical · 0 High.

- **Round 5:** H1 is fixed for every reported shape; H4, H5, H6 and H7 are fixed; F7 is fixed. H2 is **partially fixed** (the tree scan works today, but has the residuals J1–J3). **H3 is not fixed: the shell change made the new check fail open again** (J4). F10, N5 and N6 are owner actions, recorded in the register.
- **N3 (no branch protection on `main`) stays open as a Medium.** `GET …/branches/main` says `"protected": false`; `…/rulesets` and `…/rules/branches/main` return `[]`; all three merge methods are still allowed. GitHub's `main` is still `049877d`, the base of this branch, so nothing has been merged yet. As round 5 said: if this branch merges before the ruleset exists, the next review rates N3 High.
- **New:** 3 Low (J1–J3) and 4 Info (J4–J7). The three Lows are the G1 class again: a secret reaching this public repository while every CI job is green. Each closes with a few lines of CI configuration, all verified below.

## Status of round-5 findings

| ID  | R5 sev.  | Status                                     | Evidence (file:line)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | -------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1  | Low      | **Fixed** (reported shapes); residual J1   | `compose.yaml:20,35` (`--ignore-gitleaks-allow` in both gitleaks services), `:50` (`--disable-nosem`): the pinned Semgrep reported a line carrying its short inline marker. `ci.yml:105`: a nested `*.ts binary` then deleted is reported by the history scan; a root macro setting `-diff` and `export-ignore` is reported by both scans. The guard (`ci.yml:87-100`) fails on the gitleaks marker in upper case, on Semgrep's short marker with and without a space, on a marker in a new scorecard, and on a nested `.semgrepignore` or a root `.gitleaks.toml`. Residual: `info/attributes` neutralises only `diff` and `export-ignore` (J1). |
| H2  | Low      | **Partially fixed**; residuals J1, J2, J3  | `ci.yml:112-117`: the tree scan runs and scans 776,382 bytes locally, matching CI's "about 776 KB"; HEAD's tree is clean. The round-4 quote is replaced by a description. `risk-register.md:39` now asks for merge commits and squash merges but not rebase merges, which is correct. Residuals: a secret that a merge commit adds and a later commit deletes is in neither scan (J2); the tree scan passes when it scans nothing (J3); one attribute line hides a file from it (J1).                                                                                                                                                             |
| H3  | Info     | **Not fixed (regressed)**; see J4          | `ci.yml:252-255` is now an `if`, but `ci.yml:25-27` adds `pipefail`, and with `grep -q` on the right of the pipe the condition is false whenever `docker compose logs` is cut off: the step passed 23 of 30 runs with telemetry on. The response's "the step now fails on the log check" does not hold.                                                                                                                                                                                                                                                                                                                                           |
| H4  | Info     | **Fixed**; residual J7                     | `CODEOWNERS:17-51` lists every path round 5 named; `GET …/codeowners/errors?ref=chore/phase-0-foundation` returns `[]`. `CODEOWNERS:1-5` and ADR 0016:79-84 now say that, with one maintainer, the owner reading the diff is the control.                                                                                                                                                                                                                                                                                                                                                                                                         |
| H5  | Info     | **Fixed** (listed shapes); residual J6     | `eslint.config.mjs:126-135`; `tests/fixtures/src/shared/ui/unsafe-code.tsx:8-16` (six new lines at `:11-16`) are each reported and the three look-alikes at `:19-21` are not (`tests/lint-rules.test.ts:173-177`, green).                                                                                                                                                                                                                                                                                                                                                                                                                         |
| H6  | Info     | **Fixed** (Phase-0 part); rest scheduled   | `env.ts:55-69`. Direct calls: a 16-character DSN password with 7 distinct characters is rejected and one with 8 accepted; four encoded spaces on each side of 12 characters give "shorter than 16"; a password only in the query string gives "has no password". A dotless remote S3 host and plain `redis://` to a remote host are still accepted, as recorded for Phase 2 in `risk-register.md:32`.                                                                                                                                                                                                                                             |
| H7  | Info     | **Fixed** (recorded)                       | `risk-register.md:36`, ADR 0018:72-76. Re-measured: on skipped paths the header picks only `fa` or `en`; `../en` and `en/../../x` fall back to Persian; the home link is exactly `/fa` or `/en` and follows the page's language; nothing is reflected; every 404 is `no-store` and carries the CSP, HSTS and frame headers.                                                                                                                                                                                                                                                                                                                       |
| G1  | Low (R4) | **Fixed in the repository**; new residuals | Steps 1, 2, 3 and 5 are done. Step 4 is an owner setting: `secret_scanning_non_provider_patterns` (and validity checks) are still `disabled`, now recorded in `risk-register.md:38`. New residuals of the same class: J1, J2, J3, J5.                                                                                                                                                                                                                                                                                                                                                                                                             |
| N3  | Medium   | **Open (owner action, before merge)**      | As in the gate verdict. The register row (`risk-register.md:39`) is complete; it is the repository settings that are missing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| N5  | Low      | **Partially fixed** (unchanged)            | Same evidence as F10.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| N6  | Low      | **Open (owner decision), recorded**        | `visibility: public`; `risk-register.md:40`. The only tracked fonts are the OFL Vazirmatn and Shippori Mincho subsets; no Peyda file.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| F7  | Info     | **Fixed**                                  | `risk-register.md:37` dates the move off Node 22 (by 2027-01-30; end of life 2027-04-30). The `::warning::` on a passing scheduled run still notifies nobody (minor, unchanged).                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| F10 | Info     | **Open (owner, after merge)**, recorded    | `dependabot_security_updates: disabled`, `secret_scanning_non_provider_patterns: disabled`; `risk-register.md:38`. GitHub's `main` still has no `.github/`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

Round-1 carry-forwards are unchanged: L1 (`'unsafe-inline'` in `script-src`, `next.config.ts:14`, Phase 2; becomes High if Phase 2 closes without a nonce CSP), L6 (migration role, Phase 2), I4 (HSTS inventory, Phase 5).

## New findings

| ID  | Severity | Location                                                                                                     | Title                                                                                                                       |
| --- | -------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| J1  | Low      | `.github/workflows/ci.yml:105`; `.gitattributes`; README.md:47-49; ADR 0016:63-72; CHANGELOG.md:17           | One `.gitattributes` line still hides a file from the tree scan; with J2, a secret at HEAD passes every gate                |
| J2  | Low      | `.github/ci-tools/compose.yaml:15-22` (no `--log-opts`); gitleaks `sources/git.go:93-94`; ADR 0016:59-62     | The history scan still skips merge commits and type changes, so a secret added that way and later deleted is never reported |
| J3  | Low      | `.github/workflows/ci.yml:112-117`; `.github/ci-tools/compose.yaml:24-25`; gitleaks `sources/files.go:65-72` | The tree scan passes when the tree is missing or unreadable, though the comment and the response say it fails               |
| J4  | Info     | `.github/workflows/ci.yml:25-27,249-255`                                                                     | The telemetry checks fail open again: `grep -q` under `pipefail`, and the config check accepts a later override             |
| J5  | Info     | `.github/ci-tools/gitleaks.toml:6-7` (`useDefault`); `compose.yaml:39-55`                                    | Both scanners skip paths by name: gitleaks' built-in allowlist and Semgrep's built-in ignore list                           |
| J6  | Info     | `eslint.config.mjs:126-135`                                                                                  | Further raw-HTML shapes lint clean                                                                                          |
| J7  | Info     | `.github/CODEOWNERS:17-51`                                                                                   | CODEOWNERS still misses `.claude/`, `.npmrc` and several files that prove the controls                                      |

### J1 — One `.gitattributes` line still hides a file from the tree scan (Low)

- **Evidence.** One run-time token per case, harness as in Method.

  | Case                                                                                              | Guard | History scan     | Tree scan        |
  | ------------------------------------------------------------------------------------------------- | ----- | ---------------- | ---------------- |
  | Control: token in `src/`                                                                          | pass  | `leaks found: 1` | `leaks found: 1` |
  | `.gitattributes` line giving that file `working-tree-encoding=UTF-16LE-BOM`, ordinary commit      | pass  | `leaks found: 1` | `no leaks found` |
  | Same line, the file added by a merge commit                                                       | pass  | `no leaks found` | `no leaks found` |
  | Same line, the file turned from a symlink into a regular file in a linear history (a type change) | pass  | `no leaks found` | `no leaks found` |
  | A file committed in UTF-16, no attribute at all                                                   | pass  | `no leaks found` | `no leaks found` |
  - `git archive` applies `working-tree-encoding` from the archived tree, so the exported file is UTF-16 and gitleaks' regexes never match it; the blob itself stays UTF-8, so the history scan still sees an ordinary commit. `.git/info/attributes` (`ci.yml:105`) unsets only `diff` and `export-ignore`.
  - Git treats a UTF-16 blob as binary (NUL bytes), so `git log -p` prints "Binary files differ", and gitleaks reads the UTF-16 bytes as they are. Windows PowerShell 5.1 writes UTF-16 by default with `>`, so this one can happen by accident.
  - The docs promise more: "`.gitattributes` overridden" (README.md:48), "inline markers, `.gitattributes` and scanner config files cannot weaken them" (CHANGELOG.md:17), "cannot weaken them by any means the security reviews have found" (ADR 0016:63).

- **Impact.** Same class as G1 and round-5 H1: a credential can reach this public repository with every job green. Low: the attribute shape needs intent, GitHub push protection still blocks provider-format tokens, and no production secret exists yet.
- **Fix** (both verified: every case above is then reported or rejected, and `a2d5e28` stays clean):
  1. `ci.yml:105`: `printf '* !diff\n* !export-ignore\n* !working-tree-encoding\n' > .git/info/attributes`.
  2. In the guard step, reject any tracked file that git sees as binary unless its extension is expected: `bad=$(git ls-files --eol | awk -F'\t' '$1 ~ /^i\/-text/ {print $2}' | grep -vE '\.(woff2|png|jpe?g)$' || true)`, then fail if `bad` is not empty. Today the list is exactly the five fonts.
  3. Make README, CHANGELOG and ADR 0016 name what is enforced, not "cannot weaken".

### J2 — The history scan still skips merge commits and type changes (Low)

- **Evidence.**
  - gitleaks runs `git log -p -U0 --full-history --all --diff-filter=tuxdb` (`sources/git.go:93-94`). Without `-m`, a merge commit prints no diff; the lower-case `t` drops type changes (symlink to file, `git log --raw` shows status `T`).

    | Case                                                                            | Guard | History scan     | Tree scan        |
    | ------------------------------------------------------------------------------- | ----- | ---------------- | ---------------- |
    | Token in a file that turns from a symlink into a file, deleted one commit later | pass  | `no leaks found` | `no leaks found` |
    | Token added by a merge commit's resolution, deleted one commit later            | pass  | `no leaks found` | `no leaks found` |

  - The tree scan added for H2 sees only what is still at HEAD. ADR 0016:59-62 says it "also covers what a merge commit adds", which is true only until the next commit removes it, and removing a secret in a public repository does not un-publish it.
  - This branch already contains one merge commit (`49528ae`, `origin/main` merged in, with a conflict resolution in `CLAUDE.md` and `README.md`). I scanned its diffs against both parents separately: clean.
- **Impact.** A secret that enters through a merge resolution or a type change and is then deleted (the usual reaction) is never reported, so nobody is prompted to rotate it. Low, for the same reasons as J1.
- **Fix** (verified): pass the log options explicitly in `compose.yaml:15-22`: `--log-opts=--full-history --all -m --diff-filter=uxdb` (gitleaks splits the value on spaces). Both cases are then reported (2 and 1 findings); `a2d5e28`'s history stays `no leaks found` (117 commits, the merge included), and the commit-bound `.gitleaksignore` entries keep matching.

### J3 — The tree scan passes when it scans nothing (Low)

- **Evidence.**
  - `compose.yaml:24-25`: "without that mount /tree does not exist and the scan fails"; the round-5 response (H2 row): "A run without the tree mount fails".
  - The compose service `gitleaks-tree` run from `a2d5e28` (image replaced by a static build of the same version, through an override outside the repo): with the `-v` mount, 776,382 bytes scanned; **without it**, gitleaks logs a warning (`lstat /tree: no such file or directory`), "scanned ~0 bytes", "no leaks found", **exit 0**. The directory walker logs and skips any path it cannot stat, and skips an unreadable directory (`sources/files.go:65-72`).
  - My own harness hit this by accident: a relative tree path that did not exist from the scanner's working directory gave a clean result.
- **Impact.** A typo in the mount, a changed `RUNNER_TEMP` layout, an image update that changes the user, or an empty export turns the tree scan into a no-op that reports success; the merge, squash and rebase coverage of H2 then silently disappears. Today the scan works (the byte counts match).
- **Fix.** Make the step prove what it scanned, in the style of the freshness positive controls:
  1. Before the scan: `test -s "$RUNNER_TEMP/tree/package.json"`.
  2. Write a canary generated at run time into the exported tree (for example `printf 'token = "ghp_%s"\n' "$(head -c 300 /dev/urandom | tr -dc 'A-Za-z0-9' | head -c 36)" > "$RUNNER_TEMP/tree/.ci-canary"`), run the scan with a JSON report on a writable mount (`--report-format json --report-path /report/tree.json`), require exit 1, and require with `jq` that the report holds exactly one finding, in `/tree/.ci-canary`. A missing or empty mount, or a real leak, then fails the step.
  3. Correct the comment at `compose.yaml:24-25`.

### J4 — The telemetry checks fail open again (Info)

- **Evidence.**
  - Stand-in `docker` that prints the SeaweedFS telemetry line followed by 2,000 log lines: the step's `if` block (`ci.yml:252-255`) passes 5/5 under `bash --noprofile --norc -eo pipefail` and fails 5/5 under the old `bash -e`. `grep -q` exits at the first match, the writer is killed by the closed pipe, `pipefail` makes the whole condition non-zero, and the `if` takes the false branch.
  - Real stack (`secr6t`): the committed command plus a later `-master.telemetry=true` in an override outside the repo. weed logged "Reporting anonymous cluster statistics to …telemetry.seaweedfs.com… every 24h" at line 9 of 143, with about 14 KB after it. The step, run verbatim under the Actions shell, **exited 0 in 23 of 30 runs**; `docker compose logs` exited 255 in 27 of 30.
  - The configuration check (`ci.yml:249-250`) only asks whether `-master.telemetry=false` appears somewhere in the command, so a later flag that turns telemetry back on passes it. The runtime check exists for exactly that kind of change, and it is the one that now fails open.
- **Impact.** Development only (ADR 0008: no telemetry abroad). The two other `| grep -q` steps (`ci.yml:223`, `:245-246`) read a single output line, so they cannot be cut off; they can only fail closed.
- **Fix** (verified: fails 30/30 with telemetry on, passes on the committed compose):
  - Configuration: `jq -e '[.services.objectstore.command[] | select(test("^--?master\\.telemetry"))] == ["-master.telemetry=false"]'`.
  - Runtime: `logs=$(docker compose logs objectstore 2>&1)`, then `if grep -qi telemetry <<<"$logs"; then …; exit 1; fi`.
  - Add to the comment at `ci.yml:22-24`: under `pipefail`, never put `grep -q` (or `head`) on the right of a pipe whose result is a condition.

### J5 — Both scanners skip paths by name (Info)

- **Evidence.**
  - `gitleaks.toml:6-7` extends the default configuration, which brings its global path allowlist (`config/gitleaks.toml:22-48` in v8.30.1). A token in any of `src/shared/config/gitleaks.toml`, `docs/notes-on-gitleaks.toml.md`, `src/app/badge.svg`, `src/env/lib/token.ts` or a text file named `docs/sep-onboarding.pdf` gave: guard pass, history `no leaks found`, tree `no leaks found`. The list also covers `node_modules/`, `pnpm-lock.yaml`, `.docx`, `.xlsx`, `.bin` and `bootstrap*.js`. The guard's pattern `*.gitleaks.toml` needs a leading dot, so `gitleaks.toml` in a subdirectory passes it. A local copy of the semgrep-rules GitHub-token rule caught all five (written as an assignment), so Semgrep is a partial net for provider-format tokens only, if `p/secrets` includes that rule.
  - Semgrep 1.182.1 applies a built-in ignore list when the repository has no `.semgrepignore` (which the guard forbids). It skips every `test/`, `tests/`, `vendor/`, `build/` and `dist/` directory at any depth: `eval(x)` placed in each was reported only under `src/p/` and `e2e/`. At HEAD it skips all of `tests/` (11 test files and the fixtures, 36 files), so `--exclude=tests/fixtures` (`compose.yaml:55`) is redundant. A tracked file under a `.gitignore`d path is still scanned.
- **Impact.** A file name chosen on purpose, or a future production directory called `build/`, `dist/` or `vendor/`, is outside one scanner, and the guard passes. The realistic accidental case is narrow (an `.svg` or a document carrying a credential), hence Info.
- **Fix.**
  - In the guard: fail on any tracked path matching gitleaks' default allowlist except an explicit expected list (the five fonts, `src/app/icon.svg`, `pnpm-lock.yaml`, `.github/ci-tools/gitleaks.toml`).
  - Semgrep: scan the exported tree from J3 with a pinned ignore file copied in as its `.semgrepignore` (for example `.github/ci-tools/semgrepignore`, listing only `tests/fixtures/`), so the built-in list no longer applies.
  - ADR 0016: name both lists as known gaps.

### J6 — Further raw-HTML shapes lint clean (Info)

- **Evidence.** One probe file in `src/shared/ui/` of a scratch clone; `tsc` accepts every line. No `no-restricted-syntax` error for:
  - `frame.srcdoc = html` (the DOM property is lower case) and `frame.setAttribute('srcdoc', html)`;
  - `node.setAttribute('onclick', code)`;
  - `Object.assign(node, { innerHTML: html })`, `Reflect.set(node, 'innerHTML', html)`, a `const k = 'innerHTML'` key;
  - `node.setHTMLUnsafe(html)`, `Document.parseHTMLUnsafe(html)`, and `DOMParser` output moved into the page (event-handler attributes then run);
  - `(node.innerHTML as string) = html` and `node.innerHTML! = html` (only incidental type-assertion rules fire);
  - `document.write` on another document (`frame.contentDocument?.write`, `win.document.write`, `window.document.write`), which only `@typescript-eslint/no-deprecated` reports.

  Local copies of the semgrep-rules `insecure-document-method` and `insecure-innerhtml` rules matched only lines the lint already catches.

- **Impact.** Low today: each shape has to be written, and code review remains a control. The CSP still allows inline scripts (L1).
- **Fix** (each with a fixture line), in `UNSAFE_SYNTAX`:
  - extend the assignment selector to `srcdoc` and to a left side wrapped in `TSAsExpression`/`TSNonNullExpression`;
  - `Property:matches([key.name=/^(?:inner|outer)HTML$/], [key.value=/^(?:inner|outer)HTML$/])`;
  - `CallExpression[callee.property.name='setAttribute'][arguments.0.value=/^(?:srcdoc|on)/i]`;
  - `CallExpression[callee.property.name=/^(?:setHTMLUnsafe|parseHTMLUnsafe|parseFromString)$/]`;
  - `CallExpression[callee.property.name=/^writeln?$/][callee.object.property.name=/^(?:document|contentDocument)$/]`.

### J7 — CODEOWNERS gaps (Info)

- **Evidence.** Not covered by `CODEOWNERS:17-51`:
  - `/.claude/`: the agent instructions, including this reviewer's own instructions and the `/review` gate definition; an edit there changes what the security gate checks;
  - `/.npmrc`, which pnpm reads alongside `pnpm-workspace.yaml`;
  - the tests that prove the CI and register gates: `tests/ci-workflow.test.ts`, `tests/risk-register.test.ts`, `tests/check-*.test.ts`, `tests/lighthouse-*.test.ts`;
  - `/e2e/` (start-up refusal, 404 proofs), `/vitest.config.mts` (coverage threshold), `/playwright.config.ts` (axe), `/tsconfig.json` (strict flags), `/.husky/`, `/commitlint.config.mjs`;
  - `/src/app/global-not-found.tsx` and `/src/shared/i18n/`, which bound the client-settable locale header (H7);
  - `/docs/adr/`, where ADRs 0013–0018 record the security decisions.
- **Fix.** Add these paths. With one maintainer, a catch-all `* @HuseinHbz` first line is simpler and complete; the specific lines can stay as documentation.

## Verified controls (no finding)

- **CI:** run `40619185963` is green on every job and step. Top-level `contents: read`, no `pull_request_target`, action SHAs and image digests unchanged, `persist-credentials: false` everywhere. With `pipefail`, every other pipeline still decides correctly; `ci.yml:199` (`… | tee`) now fails when the summary script fails.
- **Secret scanning:** neither scanner honours an inline marker; `--config` overrides any in-repo `.gitleaks.toml`; the guard rejects scanner config files at any depth and markers in any case outside the two allowed security reviews; history (116 commits with a diff, 117 in all) and tree are clean; `.gitleaksignore` holds only commit-bound fingerprints with reasons, which the tree scan cannot match.
- **Environment:** error output names variables and Zod codes only; no `NEXT_PUBLIC_*` variable; `instrumentation*.ts` unchanged.
- **404:** server-rendered with `lang`, `dir`, `<title>`, `<h1>` and a home link in the page's language; `no-store`; all security headers; nothing reflected.
- **Compose:** loopback-only published ports; Postgres and Redis auth checks, the least-privilege role and the S3 round trip pass verbatim; the object store is unreachable by name from Redis and Postgres. From the host its filer (8888) and master (9333) still answer 200 on the container IP (G2, Phase 5, as ADR 0013 states).
- **Supply chain:** lockfile and `package.json` unchanged since round 5; both audits as in Method.

## Notes outside security scope (for the code reviewer)

- Under `pipefail`, `ci.yml:71` fails whenever `pnpm audit --prod` itself exits non-zero, which it does for an advisory of any severity (pnpm's default audit level is low), so the step now means "no production advisory at all", not "no High or Critical". Fail-closed, but stricter than its name.
- `.env.example:2-4` lists the production rules without the new 8-distinct-character rule.
- The S3 steps hard-code port 8333 (`ci.yml:265-269`) although `.env` sets `S3_PORT`.
- The working tree of `/home/user/popcorn` had uncommitted changes to `compose.yaml`, `eslint.config.mjs` and the lint fixtures while this review ran; they are not reviewed here.

## Carry-forward checklist

- **Before merge (owner):** the N3 ruleset, verified with the API, including `allowed_merge_methods` (merge and squash, no rebase).
- **Cheap, before merge:** J1 (`!working-tree-encoding`, the binary-extension check), J2 (`--log-opts`), J3 (tree pre-check and canary), J4 (both telemetry checks), and the doc corrections.
- **Any time before Phase 2:** J5, J6, J7.
- **After merge (owner):** F10 and N5 — confirm a scheduled run and the first Dependabot PRs; enable Dependabot security updates and non-provider secret patterns (G1 step 4).
- **Phase 2:** nonce CSP covering `/t/*` (L1); migration role (L6), immutable-record revokes, env split, E2E artifact hygiene; the H6 host and TLS rules.
- **Phase 3:** CMS slug validation; absolute URLs from a configured origin.
- **Phase 4:** the `/t/*` locale from the route, never from the header (H7).
- **Phase 5:** SeaweedFS JWT signing and internal ports unreachable from the host (G2); Redis ACLs and secret files; Nginx `Host` pinning, headers with `always`, dropping `x-nextjs-*`, clearing the inbound locale header; HSTS domain inventory; `APP_ENV` in the deploy unit; Node base image by digest; Node 24 before 2027-01-30 (F7).
