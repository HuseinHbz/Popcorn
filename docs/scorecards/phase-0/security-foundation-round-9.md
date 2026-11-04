# Security review — Phase 0 / platform foundation, round 9

- Reviewer: security-reviewer (fresh session, round 9, closing `/review` of Phase 0)
- Date: 2026-11-04
- Scope: the whole branch against GitHub's `main` (`chore/phase-0-foundation`, HEAD `b3325eb`; GitHub's `main` is still `049877d`, 171 commits behind), focused on `git log 1898889..b3325eb` (14 commits, 27 files):
  - `scripts/check-scan-coverage.ts`: each change judged against its previous regular-file blob (text after binary), `Object.hasOwn` for signatures, `su`/`isu` patterns, escaped `::error::` messages, explicit `--root` and `--diff-merges=separate`; the CI step now requires the summary line;
  - the tree scan committing the export as a one-commit repository (attributes override, `add -A --force`) and scanning it in git mode, the canary at `.ci-canary`, named pre-scan errors;
  - `eslint/unsafe-syntax.mjs` (moved selectors) with `<Script>` children, `createElement('script')` and `execCommand` as a string;
  - the Node freshness check accepting and dropping prereleases;
  - Lighthouse at 7 runs; ADR 0015/0016, CHANGELOG, CODEOWNERS (`/eslint/`) and response updates.
- Baseline: [`security-foundation-round-8.md`](security-foundation-round-8.md) (at `1898889`: Pass; N3 Medium · P1 Low · P2–P5 Info), the author's [`foundation-round-8-response.md`](foundation-round-8-response.md) and the "Corrections after round 8" at the end of [`foundation-round-6-response.md`](foundation-round-6-response.md) and [`foundation-round-7-response.md`](foundation-round-7-response.md). Every status below was re-measured, not taken from the response.
- Standard: OWASP ASVS 5.0.0 Level 2, only the parts that apply to what exists. No file under `src/`, `docker/`, the compose file, `.env.example`, `next.config.ts`, `package.json`, `pnpm-workspace.yaml`, `.nvmrc` or the lockfile changed in this range; `src/` still has no auth, session, upload, OTP, QR token, route handler or server action, so the plan §7 controls for those are not yet testable.
- Context read: `CLAUDE.md`, `docs/project-plan.md` §3 and the security rows, `docs/phases/phase-00.md`, ADRs 0013–0018, the risk register, `.github/CODEOWNERS`, `.gitleaksignore`, `.github/ci-tools/`, `.github/workflows/ci.yml`, `scripts/check-scan-coverage.ts`, `eslint/unsafe-syntax.mjs`, the eight earlier security reviews and the responses.

## Method

Read-only: no tracked file was changed except this report. My probe clones, probe files, the binary and image I built and the Docker daemon I started were removed or stopped afterwards; no container, network or volume of compose project `secr9` remains, and no generated value was left on disk.

- Read every file changed in `1898889..b3325eb`, and the gitleaks v8.30.1 sources for git mode (`sources/git.go`) and its `Dockerfile`, and eslint-plugin-react 7.37.5's `no-danger`.
- `pnpm lint` exit 0 · `pnpm typecheck` exit 0 · `pnpm test` 172/172 (20 files) · `pnpm format:check` clean. Local Node 22.22.0; CI uses 22.23.4.
- Every CI step I ran was extracted from `ci.yml` with a YAML parser and run as Actions runs it, `bash --noprofile --norc -eo pipefail <file>`, in a scratch clone of `b3325eb` whose refs match a push checkout (`origin/main` = `049877d`, the branch at `b3325eb`; 173 commits), with an empty global and no system git configuration, as on a runner.
- gitleaks: the pinned image could not be pulled (its blob host answered 403). I built v8.30.1 from the module in the local Go cache, static, and put it, as the official `Dockerfile` does, into an Alpine image with `git` (2.52.0, taken from the cached pinned Semgrep image) and `safe.directory '*'`. Every secrets-job step ran verbatim through a `docker` wrapper that adds an override file outside the repository swapping only the image, and project name `secr9`. Each probe plants a random `ghp_`-shaped value generated at run time, never printed and never written outside the probe clone.
- Semgrep: the pinned image (cached by digest) through the same kind of wrapper; semgrep.dev is unreachable, so the override replaces only the `--config` list with a local `eval($X)` rule.
- Lint on probe files under `src/`, and on a temporary copy of the selector list, restored and removed afterwards (`git status` clean).
- GitHub API (2026-11-04): run `41710963646` (`b3325eb`, `push`) green on all six jobs; runs `41710112281` (`7ab9118`) and `41710662107` (`3d79dbc`) cancelled by the next push, the first with the secrets job green and the freshness job failed on the prerelease, as the response says; repository settings, branches, rulesets, pull requests, the tree of `main`, CODEOWNERS errors.

## Gate verdict

**Pass**: 0 Critical · 0 High.

- **Round 8:** P1, P2, P3 and P4 are fixed for every reported shape; each has a new residual (Q1–Q3). P5 is fixed for its list, and the new residuals make some statements untrue again (Q4). G1 step 4, N5, N6 and F10 are owner actions, unchanged.
- **N3 (no branch protection on `main`) stays open as a Medium.** `GET …/branches/main`: `"protected": false`; `…/rulesets` and `…/rules/branches/main`: `[]`; merge commits, squash and rebase are all allowed; no pull request exists and nothing has been merged. This Pass is conditional on the ruleset existing before the first merge: if the branch merges without it, N3 is High and the gate is retroactively Fail.
- **New:** 1 Low (Q1) and 4 Info (Q2–Q5). Q1 is the P1 class again through a second way git pairs blobs: the history scan detects renames, the coverage check does not. Combined with Q2 (attributes that change bytes on export), a `ghp_`-shaped value stayed **at HEAD** in a plain `.ts` file with every step green and **no exception entry** (case C1). Each fix is one line or two and was verified below.

## Status of round-8 findings

| ID  | R8 sev.  | Status                                       | Evidence (file:line)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | -------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | Low      | **Fixed** (same path); residual Q1           | `scripts/check-scan-coverage.ts:48`, `:61-70`, `:118-120`. Each fails the coverage step with "text after binary content, which git diffs as binary": A1 (real ICO at `src/app/favicon.ico`, text with a value, ICO restored), E1 (real WebP at `public/images/nakaya.brand.webp`, text left at HEAD), and a merge whose side branch wrote text over a WebP (the diff against the binary parent is read). `b3325eb` passes: "Checked 711 paths of 672 blobs".                                             |
| P2  | Info     | **Fixed**; residual Q2                       | `ci.yml:149-160`, `compose.yaml:33-46`. All 227 exported files reach the scan repository's root diff (5 fonts as binary). A tree with every round-8 probe — `menu.brand.ts`, `app.browser.ts`, `build.target.ts`, `data.tar.json`, `notes.gz.md`, text starting `{\rtf`, `%PDF`, `MZ`, files under `logo.svg/` and `go.mod/`, a value at byte 124,980 of a line with no blank line, a force-added `dist/` file — reports all 12 plus the canary. `b3325eb`: exactly the canary, 1 commit, about 1.36 MB. |
| P3  | Info     | **Fixed**                                    | `scripts/check-scan-coverage.ts:97-108`, `:172`. Text files at `public/menu.<U+017F>vg`, `docs/x/server.soc<U+212A>et`, `node_modules/a<CR>b/index.ts`, `node_modules/c<U+2028>d/index.ts` and `docs/notes<LF>x.svg` each fail; the CR and LF print as `%0D` and `%0A`, so no second workflow command starts. The only letters whose Go fold orbit leaves ASCII (s, k) fold the same way under `iu`.                                                                                                     |
| P4  | Info     | **Fixed** (listed shapes); residual Q3       | `eslint/unsafe-syntax.mjs:13`, `:45-46`; fixture `tests/fixtures/src/shared/ui/unsafe-code.tsx:49-52`, look-alikes `:66-67`; `tests/lint-rules.test.ts` green (44 reports). On a probe file, `<Script id="…">{code}</Script>` and `document.createElement('script')` with `.text =` are reported.                                                                                                                                                                                                        |
| P5  | Info     | **Fixed** (round-8 list); new instances, Q4  | ADR 0016:63-72 and :86-96, ADR 0015:43-51 and :100-106, CHANGELOG.md:17 describe the round-8 fixes.                                                                                                                                                                                                                                                                                                                                                                                                      |
| G1  | Low (R4) | **Fixed in the repository**; owner step open | `secret_scanning_non_provider_patterns` and `secret_scanning_validity_checks` are still `disabled` (`risk-register.md:38`).                                                                                                                                                                                                                                                                                                                                                                              |
| N3  | Medium   | **Open (owner action, before merge)**        | As in the gate verdict; the register row (`risk-register.md:39`) is complete, the repository settings are missing.                                                                                                                                                                                                                                                                                                                                                                                       |
| N5  | Low      | **Partially fixed** (unchanged)              | Weekly schedule at `ci.yml:8-9`; `dependabot_security_updates: disabled`; GitHub's `main` holds only `.claude`, `.gitignore`, `CHANGELOG.md`, `CLAUDE.md`, `README.md` and `docs` (no `.github/`), and the API lists 0 scheduled runs.                                                                                                                                                                                                                                                                   |
| N6  | Low      | **Open (owner decision), recorded**          | `visibility: public`; `risk-register.md:40`.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| F10 | Info     | **Open (owner, after merge)**, recorded      | Settings as in N5 and G1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

Round-1 carry-forwards are unchanged: L1 (`'unsafe-inline'` in `script-src`, `next.config.ts:14`, Phase 2; becomes High if Phase 2 closes without a nonce CSP), L6 (migration role, `risk-register.md:28`, Phase 2), I4 (HSTS `includeSubDomains` domain inventory, `next.config.ts:34`, `risk-register.md:27`, Phase 5).

## New findings

| ID  | Severity | Location                                                                                                                                                   | Title                                                                                                              |
| --- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Q1  | Low      | `.github/ci-tools/compose.yaml:21`; `scripts/check-scan-coverage.ts:152-163`, `:118-120`; gitleaks `sources/git.go:71-95`                                  | A text file renamed from an accepted image is diffed as binary, so the history scan never reads it                 |
| Q2  | Info     | `.github/workflows/ci.yml:127`, `:136`, `:155`; ADR 0016:83-85                                                                                             | `export-subst` and `ident` change the exported bytes, so the tree scan can miss a value or read rewritten rules    |
| Q3  | Info     | `eslint/unsafe-syntax.mjs:45-46`; `eslint.config.mjs:252`; eslint-plugin-react 7.37.5 `lib/rules/no-danger.js:76-85`                                       | `dangerouslySetInnerHTML` on a component (next/script's documented inline form) and indirect `'script'` lint clean |
| Q4  | Info     | ADR 0016:63-65, :83-85, :127-137; README.md:47-50; CHANGELOG.md:17; `ci.yml:122-126`, `:130-131`, `:149-153`; `risk-register.md:41`; ADR 0015:87, :100-103 | The documents again promise more than the checks enforce                                                           |
| Q5  | Info     | `pnpm-lock.yaml` (`minimatch` 3.1.5 and 10.2.6, dev only)                                                                                                  | A new Moderate advisory in dev tooling that no gate reports and no bot proposes                                    |

### Q1 — A text file renamed from an accepted image is diffed as binary (Low)

- **Evidence.** One run-time value per case; the whole secrets job as in Method.

  | Case                                                                                                                                                                                                                         | Coverage step                           | History scan                  | Tree step          |
  | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------- | ------------------ |
  | R2: a valid PNG at `public/brand-notes.png` whose `tEXt` chunk holds 60 innocuous lines; next commit, `git mv` to `src/shared/lib/brand-notes.ts`, the same lines plus one line with a value (similarity 96 %); then deleted | pass ("Checked 713 paths of 674 blobs") | `no leaks found`, 173 commits | pass               |
  | R0 (control): the same PNG kept, the same text added at the new path, then deleted                                                                                                                                           | pass                                    | **`leaks found: 1`**          | pass               |
  | C1: as R2, left **at HEAD**, with a `$Format:%x00$` placeholder in its first comment and an `export-subst` line for it in `.gitattributes` (Q2)                                                                              | pass                                    | `no leaks found`, 174 commits | pass (canary only) |
  - `git show --stat` prints the rename as `Bin 4278 -> 4274 bytes`: `git log -p` detects renames by default (`diff.renames`), and a pair with a binary side is printed as "Binary files differ", which gitleaks skips (`sources/git.go:327-334`). gitleaks adds no `--no-renames` to `--log-opts` (`sources/git.go:71-95`), and its stderr handler explicitly tolerates rename-limit warnings (`:231-264`), so renames are expected there.
  - The coverage check runs `git log --no-renames` (`scripts/check-scan-coverage.ts:158`), so it sees a deletion of the PNG and an addition of a text file with no previous blob, and judges the addition alone. The round-8 fix (`:118-120`) covers the same path only.
  - In C1 no `.gitleaksignore` entry exists: the value sits at HEAD in a plain TypeScript file with every job green.

- **Impact.** The P1 class (round 6 J2, round 7 K1, round 8 P1): a credential that enters this public repository this way and is then removed is never reported, so nobody is prompted to rotate it; with Q2 (C1) it stays at HEAD with no exception entry. Low, as P1: it needs an image with enough text in it first and a rename to a text file, GitHub push protection still blocks provider-format tokens, and no production secret exists yet. The documented known gap (a value behind an image signature) already allows a value inside a binary file; this one is a text source file, which ADR 0016 says the history scan reads.
- **Fix** (verified: with the option added, R2 and C1 report `leaks found: 1` in the history scan; `b3325eb` stays at 173 commits, `no leaks found`, 2.19 MB read instead of 2.18). Add `--no-renames` to the history scan's options, `compose.yaml:21`:

  ```yaml
  - --log-opts=--full-history --all -m --no-renames --diff-filter=uxdb
  ```

  and say so in the comment above it (`:12-14`). The history scan then pairs exactly as the coverage check does, so the coverage check's "previous blob" rule needs no rename model. A renamed file with an excepted value gets a new finding at the rename commit, which is the intended behaviour of an exception bound to a commit.

### Q2 — `export-subst` and `ident` change the exported bytes (Info)

- **Evidence.** The checkout's attributes (`ci.yml:127`: `!diff`, `!export-ignore`, `!working-tree-encoding`) do not neutralise `export-subst` or `ident`, which `git archive` (`:136`) applies, and the scan repository's attributes (`:155`: `!diff`, `!working-tree-encoding`, `!filter`, `!text`) do not neutralise `ident`, which `git add` applies.
  - S1: `src/shared/lib/stamp.ts` with `// Build stamp: $Format:%x00$` and a value, an `export-subst` line for it, and a commit-bound `.gitleaksignore` entry with a reason. Guard, coverage, history (`no leaks found`) and tree step all pass; the value stays at HEAD. The export holds a NUL byte, git calls the file binary, and gitleaks skips it. S0 (control, no attribute line): the tree step fails with the file listed.
  - I1: a value inside `$Id: … $` in `src/shared/lib/ident.ts`, committed before an `ident` line is added, plus an exception entry: every step passes. At export `$Id: … $` becomes `$Id: <blob id> $`; with only the checkout side neutralised, `git add` in the scan repository still collapses it to `$Id$` and the step passes (measured), so both sides need the line. Every working copy shows the expanded form, while GitHub serves the blob with the value.
  - R1: a comment line in the pinned configuration, `# Build: $Format:%n[allowlist]%npaths = ['''^src/''']%n$`, with an `export-subst` line for `.github/ci-tools/gitleaks.toml`: the exported configuration gains an `[allowlist]`, and a value in `src/` is not reported by the tree scan (canary only). The history scan reads the configuration from the checkout and is not affected.
  - At `b3325eb` itself the scan repository does not hold the committed bytes: `* !text` (`:155`) leaves the exported `* text=auto eol=lf` with `eol=lf` alone, which git then applies as forced text, so `git add` rewrites CR LF to LF in two of the five fonts (`shippori-mincho-latin-400-normal.woff2`, `vazirmatn-latin-400-normal.woff2`; "CRLF will be replaced by LF", and their blob ids differ from HEAD's). Harmless today, since they stay binary, but it shows the override is incomplete.
  - Semgrep reads the same kind of export (`ci.yml:185-186`). With the local rule, the `$Format:%x00$` probe was still read and the step failed (2 results, 1 error), so the NUL does not hide code from it; the `ident` and secrets-pack cases were not measured (the packs are unreachable).
- **Impact.** ADR 0016:83-85 says no `.gitattributes` line can hide a file from either scan; these do, for the tree scan. Alone each needs an exception entry the owner reads in the diff, as P2 and K3 did: Info. Combined with Q1 none is needed (C1).
- **Fix** (verified: S1, I1, R1 and C1 each fail the tree step with the file listed; `b3325eb` passes with the canary as the only finding, and its scan repository then holds exactly HEAD's blob ids).
  - `ci.yml:127`: `printf '* !diff\n* !export-ignore\n* !export-subst\n* !ident\n* !filter\n* !text\n* !eol\n* !crlf\n* !working-tree-encoding\n' > .git/info/attributes` (the history scan diffs blobs, so the conversion attributes do not change it).
  - `ci.yml:155`: `printf '* !diff\n* !working-tree-encoding\n* !filter\n* !text\n* !eol\n* !crlf\n* !ident\n' > "$tree/.git/info/attributes"`. With the checkout side alone, I1 still passed.
  - `ci.yml:185`: the same additions, so Semgrep reads the committed bytes too.
  - A check that proves it, before the gitleaks call at `:158` (verified: it passes at `b3325eb` with both lines above, and with today's attributes it fails S1 and I1 naming the file, and `b3325eb` on the two fonts):

    ```bash
    # The scan repository must hold the committed bytes: same paths, modes and blob ids as HEAD.
    committed=$(git ls-tree -r HEAD | grep -v $'\t.gitleaksignore$')
    scanned=$(git -C "$tree" ls-tree -r HEAD | grep -v $'\t.ci-canary$')
    if [ "$committed" != "$scanned" ]; then echo '::error::the exported tree differs from HEAD'; exit 1; fi
    ```

### Q3 — `dangerouslySetInnerHTML` on a component and indirect `'script'` lint clean (Info)

- **Evidence.** One probe file under `src/shared/ui/`; `tsc` accepts it. Not reported by `no-restricted-syntax` or `react/no-danger` (two lines only by the incidental `no-deprecated`):
  - `<Script id="a2" dangerouslySetInnerHTML={{ __html: code }} />` with `next/script`: this is the second inline form the Next.js documentation shows, next to children. `react/no-danger` checks only DOM elements unless `customComponentNames` is set (`no-danger.js:76-85`), and no selector names the JSX attribute;
  - `next/script` imported under another name (`<NextScript id="a1">{code}</NextScript>`), since the selector matches the name `Script` (`eslint/unsafe-syntax.mjs:45`);
  - the string `script` reaching `createElement` other than as a direct literal argument (`:46`): a template literal, a variable, `document['createElement']('script')`, `document.createElement.call(document, 'script')`, an aliased React `createElement` (`h('script', null, code)`), `jsx('script', { children: code })` from `react/jsx-runtime`, and `<Tag>{code}</Tag>` with `const Tag = 'script'`.
- **Impact.** As P4 and K5: each must be written, review is still a control, and Trusted Types (Phase 2) is the structural answer. The `dangerouslySetInnerHTML` form on `<Script>` is the one most likely to be written innocently, for the inline analytics snippet round 7 named.
- **Fix** (verified on the probe: all nine lines reported, the aliased import on its import line; `eslint --max-warnings=0 .` on the whole repository exits 0 with them, so no real code is affected; the fixture's expected lists need the extra reports). Add to `UNSAFE_SYNTAX`, each with a fixture line:
  - `"JSXAttribute[name.name='dangerouslySetInnerHTML']"` (every element, components included; or `react/no-danger` with `customComponentNames: ['*']`, not measured);
  - `'Literal:not(TSLiteralType > Literal)[value=/^script$/i]'` and `'TemplateLiteral[expressions.length=0] > TemplateElement[value.raw=/^script$/i]'`, the "string that is exactly a sink's name" rule applied to `script`;
  - `"ImportDeclaration[source.value='next/script'] > :matches(ImportNamespaceSpecifier, ImportDefaultSpecifier[local.name!='Script'], ImportSpecifier)"`.

  The JSON-LD exception ADR 0015:108-109 foresees then needs its override for the attribute selector as well.

### Q4 — The documents promise more than the checks enforce (Info)

- **Evidence.**
  - ADR 0016:63-65 ("neither an exception nor … can leave a secret-like value in the tree"), :127-129 ("a value that looks like a secret cannot stay in the tree as text"): Q2, and C1 with no exception at all.
  - ADR 0016:83-85 ("no line there can hide a file from either scan"), `ci.yml:122-126` ("This file outranks every .gitattributes"), `ci.yml:149-153` ("The attributes keep an exported .gitattributes from hiding or re-encoding a file"), `ci.yml:130-131`, README.md:48-49 and CHANGELOG.md:17 ("`.gitattributes` overridden"): Q2.
  - README.md:49-50 ("unreadable or name-skipped files rejected anywhere in the history") and CHANGELOG.md:17 ("every file in the history checked to be one the scans can read, text over binary … included"): Q1.
  - ADR 0016:130-137 and `risk-register.md:41` (known gaps): Q1 and Q2 are missing.
  - ADR 0015:87 ("`dangerouslySetInnerHTML` … as a JSX prop") and :100-103: Q3.
- **Fix.** After Q1–Q3 land, state what each check covers; until then, list the residuals in ADR 0016's known gaps and the register row.

### Q5 — A new Moderate advisory in dev tooling (Info)

- **Evidence.** `pnpm audit`: `GHSA-g3hv-75wg-m249` (minimatch, "potential denial of service via globparts amplification", published 2026-10-30, vulnerable below 11.0.1), installed as 3.1.5 (`@lhci/cli › chrome-launcher › rimraf › glob`) and 10.2.6 (`eslint-config-next › … › @typescript-eslint/typescript-estree`). `pnpm audit --prod`: no known vulnerabilities. Both audit steps pass, by design (`--audit-level=high`).
- **Impact.** Dev only; the patterns are the project's own globs, not input. Nothing proposes the bump while Dependabot does not run (N5, F10).
- **Fix.** None required now. After F10, confirm Dependabot proposes it; if a patched 3.x/10.x line appears, add it to `pnpm.overrides` with `pnpm lhci` and `pnpm lint` re-run, as for `tmp`, `basic-ftp` and `uuid` (`risk-register.md:15-20`).

## Verified controls (no finding)

- **CI:** run `41710963646` (`b3325eb`, `push`) green on all six jobs; the secrets job lists the coverage step after its own `setup-node` and the three scan steps. Top-level `contents: read`, no `pull_request_target`, action SHAs and image digests unchanged, `persist-credentials: false` everywhere. `/eslint/` is now owned in CODEOWNERS (`:25`); `GET …/codeowners/errors?ref=chore/phase-0-foundation` returns `[]`. The new tree-step lines each fail closed under `-eo pipefail`: `git archive` refuses a crafted tree path (a `GIT~1` entry made with `mktree`: "invalid path", `tar` fails), and gitleaks exiting 0 or not writing a report fails the step.
- **Coverage step at `b3325eb`:** "Checked 711 paths of 672 blobs"; the raw log holds 794 change headers and no other token, so the parser skips nothing today; the summary line is required (`ci.yml:121`).
- **Secret scanning at `b3325eb`:** history 173 commits, `no leaks found`; tree step: exactly the canary; "The tree scan fails without a tree" passes. `.gitleaksignore` still holds only the two commit-bound entries with reasons, and the skipped-path copy is unchanged.
- **Semgrep at `b3325eb`** (local rule): 86 files scanned, `errors: []`, both required paths present; the step passes.
- **Lint:** P4's four new fixture lines and two look-alikes (`tests/lint-rules.test.ts`, 44 reports).
- **Freshness and audits:** the four freshness steps exit 0, including both positive controls; prereleases are dropped only after the whole entry validates, and a list with only prereleases, or a malformed one, fails (`scripts/check-node-version.ts:31-48`, tests). Both audit steps exit 0 (`3 high (3 ignored)`, Q5's Moderate; production clean).
- **Services:** the compose file, `docker/` and `.env.example` are unchanged since round 6; the CI services job is green at `b3325eb`. Not re-run locally this round.

## Notes outside security scope (for the code reviewer)

- `parseRawLog` still skips any token that is neither a header nor the path after one (`scripts/check-scan-coverage.ts:59-60`); with `--diff-merges=separate` explicit, none occurs today (measured above).
- In the two cancelled runs, "Lighthouse scores to job summary" reports `failure` after `lhci` was cancelled (`if: always()` with no report to read); harmless, but it makes a cancelled run look like a failed one.

## Carry-forward checklist

- **Before merge (owner):** the N3 ruleset, verified with the API, including `allowed_merge_methods` (merge and squash, no rebase).
- **Cheap, before merge:** Q1 (`--no-renames`), Q2 (the attribute lines and the blob-id check), and Q4's corrections for whatever lands.
- **Any time before Phase 2:** Q3.
- **After merge (owner):** F10 and N5 — confirm a scheduled run and the first Dependabot PRs (Q5 among them); enable Dependabot security updates and non-provider secret patterns (G1 step 4).
- **Phase 2:** nonce CSP covering `/t/*` (L1), with `require-trusted-types-for 'script'` (K5, P4, Q3) checked against the Next.js runtime; migration role (L6), immutable-record revokes, env split, E2E artifact hygiene; the H6 host and TLS rules.
- **Phase 3:** CMS slug validation; absolute URLs from a configured origin.
- **Phase 4:** the `/t/*` locale from the route, never from the header (H7).
- **Phase 5:** SeaweedFS JWT signing and internal ports unreachable from the host (G2); Redis ACLs and secret files; Nginx `Host` pinning, headers with `always`, dropping `x-nextjs-*`, clearing the inbound locale header; HSTS domain inventory (I4); `APP_ENV` in the deploy unit; Node base image by digest; Node 24 before 2027-01-30 (F7).
