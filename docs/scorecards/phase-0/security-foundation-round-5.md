# Security review — Phase 0 / platform foundation, round 5

- Reviewer: security-reviewer (fresh session, round 5)
- Date: 2026-10-28
- Scope: the whole branch against `origin/main` (`chore/phase-0-foundation`, HEAD `fe5b81c`), focused on `git log 26e1971..fe5b81c` (21 commits, 40 files):
  - the pinned gitleaks configuration and the CI guard against in-repo suppressions (`.github/ci-tools/`, `.github/workflows/ci.yml:75-86`);
  - the second `.gitleaksignore` entry and `tests/gitleaksignore.test.ts`;
  - `.github/CODEOWNERS`;
  - the stricter production environment rules (`src/shared/config/env.ts`, `.env.example`);
  - the raw-HTML lint bans (`eslint.config.mjs:119-126`);
  - the object-store isolation and telemetry checks (`ci.yml:216-229`);
  - strict advisory parsing and the positive controls on known-bad pins (`ci.yml:116-123`, `scripts/check-package-manager.ts`);
  - `src/app/global-not-found.tsx` (locale from the `X-NEXT-INTL-LOCALE` request header) and the removal of the `[locale]` catch-all;
  - the changed ADRs 0013–0018, risk register, README and CHANGELOG.
- Baseline: [`security-foundation-round-4.md`](security-foundation-round-4.md) (at `26e1971`: Pass; N3 Medium · G1, N5, N6 Low · G2–G6, F7, F10 Info) and the author's [`foundation-round-4-response.md`](foundation-round-4-response.md). Every status below was re-measured, not taken from the response.
- Standard: OWASP ASVS 5.0.0 Level 2, only the parts that apply to what exists. There is still no auth, session, upload, OTP, QR token, route handler or server action in `src/`, so the plan §7 controls for those are not yet testable.
- Context read: `CLAUDE.md`, `docs/project-plan.md` §3 and §7, `docs/phases/phase-00.md`, ADRs 0013–0018, the risk register, `.github/CODEOWNERS`, `.gitleaksignore`, `.github/ci-tools/`, the four earlier security reviews and the round-4 response.

## Method

Read-only: no tracked file was changed except this report. My server (port 3651), my compose projects (`secr5`, `secr5t`, volumes and networks included), the scratch clones, the probe files and the tools I built were removed. The Docker daemon was not running when I started; I started it and left it running with no containers, because the other reviewer may need it.

- Read every file changed in `26e1971..fe5b81c`.
- `pnpm lint` exit 0 · `pnpm test` 149/149 · `pnpm build` (route table: `ƒ /_not-found`, `● /fa`, `● /en`). Local Node is 22.22.0; CI uses 22.23.4.
- Audits and advisories (lockfile and `package.json` unchanged since round 4):
  - `pnpm audit --audit-level=high`: 3 High, all ignored (R-001…R-003), exit 0. `pnpm audit --prod`: all zero; CI's `jq -e` gate: `true`. No Moderate.
  - npm bulk advisory API for `next` 16.4.3, `next-intl` 4.14.9, `react`/`react-dom` 19.3.1, `zod` 4.6.7, `pnpm` 10.34.9: `{}`. Each runtime package is its `latest`; nodejs.org lists 22.23.4 (2026-10-20, security) as the newest 22.x.
  - The three freshness scripts exit 0; the positive-control step (`ci.yml:118-123`, run verbatim) exits 0.
- Secret scanning: ghcr.io is still unreachable from here, so I built gitleaks v8.30.1 from source (`go install`, module checksums verified by the Go checksum database) and read its source for the inline-allow, ignore-file and `git log` handling. Scanned HEAD's history with the pinned configuration, without the ignore file, the HEAD tree alone (`git archive` + `gitleaks dir`), and a simulated squash merge onto `origin/main`. In scratch clones I planted a random `ghp_`-shaped token generated at run time (never written to disk outside the clone, never printed) in ten shapes (H1, H2) and ran the guard step extracted verbatim from `ci.yml`.
- Semgrep: the registry packs are still refused (semgrep.dev 403), so I installed Semgrep 1.182.1 (the pinned version) from PyPI and tested the suppression mechanics with a local rule (H1). The rule packs themselves were not run; I relied on the green CI job.
- `parseEnv` called directly for 23 production cases (H6); `next start` with `APP_ENV=production` and the `.env.example` values.
- `next start` on 127.0.0.1:3651: 15 paths × with and without a forged `X-NEXT-INTL-LOCALE`, header variants, `RSC: 1`, 300 unique 404s (cache-file count and timing), 4 `x-middleware-subrequest` bypass variants (H7).
- Lint: one probe file in `src/shared/ui/` with ten raw-HTML shapes, plus a `tsc` check for one of them (H5).
- Docker 29.9.2, compose project `secr5` with an override outside the repo (cached `postgres:17.6-alpine` and `redis:7.4-alpine`; SeaweedFS from the pinned digest). Ran the object-store step verbatim, then a second project `secr5t` with telemetry switched on (H3); probed the filer, master and IAM ports from the host (G2).
- GitHub API: run `40567716618` for `fe5b81c` (event `push`; all 6 jobs and every step `success`), repository settings, merge methods, branch protection, rulesets, CODEOWNERS errors. Job logs are still not downloadable (blob storage 403).

## Gate verdict

**Pass**: 0 Critical · 0 High.

- **Round 4:** G2, G4 (as reported), G5 and G6 are fixed and verified. G1 and G3 are **partially fixed**: the reported shapes are closed, but measured residuals remain (H1, H2, H3). F7 keeps its minor residual. N5 is unchanged; F10 and N6 are owner actions.
- **N3 (no branch protection on `main`) stays open as a Medium.** `GET …/branches/main` says `"protected": false`; `…/rulesets` and `…/rules/branches/main` return `[]`. The register's deadline is "before the first merge" and this branch is that merge. If it merges first, the next review rates N3 High.
- **New:** 2 Low (H1, H2) and 5 Info (H3–H7). Both Lows are the G1 class (a secret reaching a public repository with CI green) and can be closed with a few lines of CI configuration and one scorecard redaction.

## Status of round-4 findings

| ID  | R4 sev. | Status                                    | Evidence (file:line)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | ------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | Low     | **Partially fixed**; residuals H1, H2, H4 | Step 1 done: `compose.yaml:14-15` passes `--config` to the pinned `gitleaks.toml` (built-in rules only); gitleaks then never reads a root `.gitleaks.toml` (`cmd/root.go`: `--config` wins). Step 2 done in part: the guard (`ci.yml:75-84`) catches a root `.gitleaks.toml`/`.semgrepignore` and an inline marker outside `docs/scorecards`, and `tests/gitleaksignore.test.ts` fails on an entry without a reason or without a commit-bound fingerprint (both negative cases run). Step 3: CODEOWNERS exists, not yet enforced (H4). Step 4: `secret_scanning_non_provider_patterns` still `disabled`. Step 5: no re-point note; instead a new commit-bound entry now breaks a squash merge (H2). |
| G2  | Info    | **Fixed**                                 | ADR 0013:66-73 now states that the host reaches the filer, and the README (`:13`) requires Docker Engine ≥ 28 on Linux. Re-measured: from the host, the filer (8888) and master (9333) answer 200 on the container IP, as the ADR now says. The register row (`risk-register.md:31`) carries "unreachable from the host and the network" for Phase 5.                                                                                                                                                                                                                                                                                                                                               |
| G3  | Info    | **Partially fixed**; residual H3          | The isolation half is now sound: a positive control from inside the object store (`ci.yml:223`) and, from both Redis and Postgres, a required `bad address` (`:225-229`), re-run against a live stack: pass. The runtime telemetry half (`:221`) can never fail the step (H3).                                                                                                                                                                                                                                                                                                                                                                                                                      |
| G4  | Info    | **Fixed** (reported shapes); residual H5  | `eslint.config.mjs:122-126` in both `no-restricted-syntax` lists (`:280`, `:298`); the three fixture lines are each reported (`tests/fixtures/src/shared/ui/unsafe-code.tsx:8-10`, `tests/lint-rules.test.ts:173-177`). A string-literal key is also caught.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| G5  | Info    | **Fixed** (recorded for Phase 5)          | `risk-register.md:27`: Nginx adds the headers with `always` and drops `x-nextjs-*`. Re-measured: `/fa/` still answers 308 with only `location` and `refresh`, as expected until Phase 5.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| G6  | Info    | **Fixed** as recommended; residual H6     | `env.ts:38-72`: values decoded before the placeholder match, `change.me` matched, DSN passwords ≥ 16 characters measured after decoding, the S3 secret trimmed, https for a non-local S3 endpoint. `.env.example:24` and `risk-register.md:32` put `APP_ENV=production` in the deploy unit. Real start-up with `APP_ENV=production` and the example values: exit 1, six problems, no value printed.                                                                                                                                                                                                                                                                                                 |
| F7  | Info    | **Fixed**; minor residual unchanged       | No dated register row for "Node 24 before 2027-01-30"; ADR 0014:97 keeps the revisit trigger. The `::warning::` on a passing scheduled run still notifies nobody.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| F10 | Info    | **Open (owner, after merge)**             | `dependabot_security_updates: disabled`, `secret_scanning_non_provider_patterns: disabled`; `origin/main` still has no `.github/`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| N3  | Medium  | **Open (owner action, before merge)**     | As above. Add `allowed_merge_methods` to the ruleset (H2) and, once a second maintainer exists, code-owner review (H4).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| N5  | Low     | **Partially fixed** (unchanged)           | Same evidence as F10.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| N6  | Low     | **Open (owner decision), recorded**       | `visibility: public`; `risk-register.md:37`. No licensed font file is tracked.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

Round-1 carry-forwards are unchanged: L1 (`'unsafe-inline'` in `script-src`, `next.config.ts:14`, Phase 2; becomes High if Phase 2 closes without a nonce CSP), L6 (migration role, Phase 2), I4 (HSTS inventory, Phase 5).

## New findings

| ID  | Severity | Location                                                                                                                                              | Title                                                                                                               |
| --- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| H1  | Low      | `.github/workflows/ci.yml:75-84`; `.github/ci-tools/compose.yaml:14-15,22-31`; `.gitattributes`; `README.md:47-48`; ADR 0016:61-64; `CHANGELOG.md:17` | Four repository-controlled ways still switch a scanner off, and none trips the new guard                            |
| H2  | Low      | `.github/ci-tools/compose.yaml:14-15`; `.gitleaksignore:8-10`; `docs/scorecards/phase-0/security-foundation-round-4.md:85`                            | gitleaks reads commit diffs only: a merge commit hides a secret, and a squash or rebase merge turns `main` red      |
| H3  | Info     | `.github/workflows/ci.yml:221`; no `defaults.run.shell` in `ci.yml`                                                                                   | The runtime telemetry assertion can never fail its step; CI steps run without `pipefail`                            |
| H4  | Info     | `.github/CODEOWNERS:4-11`; ADR 0016:66-69                                                                                                             | CODEOWNERS misses several control files and routes nothing while the owner is the PR author                         |
| H5  | Info     | `eslint.config.mjs:122-126`; `CHANGELOG.md:14`                                                                                                        | `srcDoc` outside JSX, a template-literal key and DOM HTML sinks still lint clean                                    |
| H6  | Info     | `src/shared/config/env.ts:9,47-54,66-72`                                                                                                              | Residual production heuristics: low-entropy secrets, any dotless host, plaintext database and Redis to remote hosts |
| H7  | Info     | `src/app/global-not-found.tsx:17-20`; `src/proxy.ts:11-13`                                                                                            | `X-NEXT-INTL-LOCALE` is client-controlled on the paths the proxy skips (safe today; rules for later)                |

### H1 — Four repository-controlled ways still switch a scanner off (Low)

- **Evidence.** Scratch clone at `fe5b81c`, gitleaks v8.30.1 with the pinned configuration, the guard step extracted verbatim from `ci.yml:76-84` and run with `bash -e` (how Actions runs it, see H3). One random `ghp_`-shaped token, generated at run time, in each case:

  | Case                                                                          | Guard          | gitleaks         |
  | ----------------------------------------------------------------------------- | -------------- | ---------------- |
  | Control: token in `src/`, nothing else                                        | pass           | `leaks found: 1` |
  | Token plus the gitleaks inline marker in `src/`                               | **fails** (ok) | `no leaks found` |
  | Token plus the inline marker in a new file under `docs/scorecards/`           | pass           | `no leaks found` |
  | Token in `src/` plus a root `.gitattributes` line marking that path `-diff`   | pass           | `no leaks found` |
  | Token in `src/` plus a nested `src/.gitattributes` marking `*.ts` as `binary` | pass           | `no leaks found` |
  - The gitleaks inline check is a plain, case-sensitive substring test on the finding's line (`detect/detect.go:510`), with no path exception, so the guard's `':!docs/scorecards'` exclusion (`ci.yml:83`) leaves a fully working suppression in exactly the directory that agents write to every round, and where a quoted value already turned CI red once.
  - `git log -p` takes attributes from the working tree for every commit it prints. A file marked `-diff` or `binary` appears as "Binary files differ" in the whole history, so one `.gitattributes` line at HEAD blinds the history scan for any path. `.gitattributes` exists (`* text=auto eol=lf` plus three binary extensions), is not checked by the guard, and is not in CODEOWNERS.
  - Semgrep 1.182.1, local rule on `eval(...)`, four files: plain is reported; a trailing short-form inline marker (`// nosem`) suppresses it; the full marker in upper case suppresses it; a directory with a nested `.semgrepignore` containing `*` is excluded. The guard passed with all three in place (its regex is case-sensitive, matches only the long marker, and checks `.semgrepignore` only at the root). Without the suppressions all four files are reported.
  - The docs promise more than this: "which the repository cannot switch off" (`README.md:47`), "The scanned code cannot switch them off" (ADR 0016:61), "no inline suppressions" (`CHANGELOG.md:17`), and "the only exceptions are the fingerprints in .gitleaksignore" (`gitleaks.toml:1-3`).

- **Impact.** Same class as G1, in a public repository: a credential can be committed with CI green in the same push. Low, because exploitation needs push rights and a deliberate (or careless) suppression, GitHub push protection still blocks provider-format tokens, and no production secret exists yet.
- **Fix.** Disable the mechanisms in the pinned commands rather than grepping for them:
  1. `compose.yaml:15`: add `'--ignore-gitleaks-allow'`. Verified: the scorecard case is then reported, and HEAD's history still gives `no leaks found`.
  2. `compose.yaml:22-31`: add `--disable-nosem`. Verified: both inline forms are then reported.
  3. In the `secrets` job, before the scan: `printf '* !diff\n' > .git/info/attributes`. `info/attributes` outranks every in-tree `.gitattributes`, and `!diff` returns each path to content-based detection: the fonts stay binary, a text file can no longer be hidden. Verified: the nested `binary` case is then reported; HEAD's history stays clean.
  4. Replace the root-only file test with any depth: `test -z "$(git ls-files -- '*.gitleaks.toml' '*.semgrepignore')"` (verified to match nested files).
  5. Keep the marker grep as defence in depth, case-insensitive (`git log -i`) and including the short Semgrep form. The scorecard exclusion can then stay, because neither scanner honours a marker anywhere.
  6. Add `/.gitattributes` to CODEOWNERS (H4) and make README, ADR 0016, CHANGELOG and `gitleaks.toml` describe what is actually enforced.

### H2 — gitleaks reads commit diffs only (Low)

- **Evidence.**
  - gitleaks' history mode runs `git log -p -U0 --full-history --all --diff-filter=tuxdb` (`sources/git.go:93-94`), without `-m` or `--cc`, so a merge commit contributes no diff. Scratch clone: a merge commit whose resolution adds a file containing the run-time token. The guard passed and gitleaks reported `no leaks found`, with the token in the HEAD tree.
  - The HEAD tree alone (`git archive HEAD` + `gitleaks dir`, pinned configuration) gives `leaks found: 1`: the made-up test value quoted at `docs/scorecards/phase-0/security-foundation-round-4.md:85`. In history mode only the commit-bound entry `.gitleaksignore:10` (commit `6ef68e1`) hides it.
  - Simulated squash merge onto `origin/main` (`b681347`), feature ref removed: `leaks found: 1`, bound to the squash commit's SHA, which no entry matches. A rebase merge rewrites the SHAs too; only a merge commit keeps the entry valid. The repository allows all three methods, and the round-4 response names a squash merge as one of the owner's options.
- **Impact.**
  - A real secret that enters through a merge commit is never scanned, for example a config conflict resolved with a real value. With N3 open, such a commit can be pushed straight to `main`.
  - The first push to `main` after a squash or rebase merge turns the secret-scan gate red. The quick fix would be another ignore entry made under time pressure, which is the G1 scenario. The value itself is fake (verified in round 4).
- **Fix.**
  1. Add a tree scan to the `secrets` job, with no exceptions: `git archive HEAD | tar -x -C "$RUNNER_TEMP/tree"`, mounted read-only, then `gitleaks dir /tree --config …/gitleaks.toml --ignore-gitleaks-allow --redact`. Commit-bound fingerprints do not apply in that mode, so the tree must be clean outright. That covers merge commits, squash and rebase merges and any later history rewrite.
  2. Replace the quoted value at `security-foundation-round-4.md:85` with a description, as this report does. Keep `.gitleaksignore:8-10` while the branch history exists, and delete both entries if history is rewritten.
  3. Owner: fix the merge method in the N3 ruleset (`allowed_merge_methods`).

### H3 — The runtime telemetry assertion can never fail its step (Info)

- **Evidence.**
  - `ci.yml:221` is `! docker compose logs objectstore 2>&1 | grep -qi telemetry`, and it is not the step's last command. Bash ignores `set -e` for a pipeline negated with `!`, so a match only sets `$?` and the next command resets it.
  - Proven twice:
    - With a stand-in `docker` that prints a valid config, the real SeaweedFS telemetry log line and successful probes, the step exits 0, both under `bash -e` and under `bash --noprofile --norc -eo pipefail`.
    - Against a real stack started with `-master.telemetry=true` (project `secr5t`): weed logged "Reporting anonymous cluster statistics to https://telemetry.seaweedfs.com/…", and the step failed at the `jq` check of the command string (`:218-219`), before it reached the log check. So the response's "fails with telemetry on" comes from the config string, not from the runtime check. With telemetry off, as committed, the log has no line matching `telemetry`, so a working check would not fail falsely.
  - The workflow sets no `defaults.run.shell`. GitHub runs such steps with `bash -e {0}`; only `shell: bash` adds `--noprofile --norc -o pipefail`. The response's harness assumes `pipefail`. I checked each pipeline: no verdict changes today (`:64` and `:189` fail closed through `jq -e`; the rest end in the deciding command), but `:168` (`… | tee`) masks a failing summary script. I could not read a job log to show the shell line (blob storage 403); this is GitHub's documented default.
- **Impact.** Development only: telemetry is enforced by the command-string check. The runtime check exists to catch a flag that is still present but no longer works, for example after an image update, and today it cannot do that.
- **Fix.** Replace `:221` with `if docker compose logs objectstore 2>&1 | grep -qi telemetry; then echo '::error::object-store telemetry is on'; exit 1; fi`, and add `defaults: { run: { shell: bash } }` at the top of `ci.yml` so that CI and the local harness run the same shell.

### H4 — CODEOWNERS gaps, and no routing while the owner is the author (Info)

- **Evidence.**
  - `CODEOWNERS:4-11` is valid (`GET …/codeowners/errors?ref=chore/phase-0-foundation` gives `[]`), but it does not cover:
    - `/.gitattributes` (H1);
    - `/pnpm-lock.yaml`, which holds the resolved tarball and integrity of every dependency;
    - `/scripts/`, the freshness and risk-register gates CI runs;
    - `/src/instrumentation.ts` and `/src/instrumentation-node.ts`: removing the call skips environment validation entirely;
    - `/src/proxy.ts`;
    - `/docker-compose.dev.yml` and `/docker/`: isolation, loopback ports, the least-privilege role;
    - `/.env.example` and `/.nvmrc`;
    - `/tests/gitleaksignore.test.ts`, `/tests/lint-rules.test.ts` and `/tests/fixtures/`, which prove the rules work;
    - `/lighthouserc.json` and `/CLAUDE.md`.
  - 100 of the branch's 101 commits are authored by the agent. With one maintainer, the owner is also the PR author, and GitHub never requests review from a PR's author, so today the file routes nothing. The register says the same (`risk-register.md:36`), but ADR 0016:66-69 ("CODEOWNERS routes it to the owner") reads as a current control.
- **Fix.** Add the paths above. Reword ADR 0016: until a second maintainer exists, the control is the owner reading the diff of these paths before merging.

### H5 — Remaining raw-HTML shapes lint clean (Info)

- **Evidence.** A probe file in `src/shared/ui/` (deleted afterwards). These produced no error:
  - `createElement('iframe', { srcDoc: html })`;
  - `<iframe {...{ srcDoc: html }} />`;
  - a computed template-literal key spelling `dangerouslySetInnerHTML` in a `createElement` props object;
  - ref callbacks assigning `innerHTML` or `outerHTML`;
  - `insertAdjacentHTML`;
  - `document.createRange().createContextualFragment(html)`.

  `document.write` is reported only incidentally, by `@typescript-eslint/no-deprecated`. A string-literal key is caught. A lowercase `srcdoc` JSX attribute is rejected by `tsc` (TS2322). Semgrep's React pack may cover the DOM sinks, but the registry was unreachable, so I could not verify it.

- **Impact.** Low today: each shape must be written on purpose, and Semgrep is a second net. But the CSP still allows inline scripts (L1), and `CHANGELOG.md:14` says "`dangerouslySetInnerHTML` in any form".
- **Fix.** Add these selectors to `UNSAFE_SYNTAX`, each proven by a fixture line:
  - `Property:matches([key.name='srcDoc'], [key.value='srcDoc'])`;
  - `Property[computed=true][key.type='TemplateLiteral']`;
  - `AssignmentExpression > MemberExpression.left[property.name=/^(?:innerHTML|outerHTML)$/]`;
  - `CallExpression[callee.property.name=/^(?:insertAdjacentHTML|createContextualFragment|write|writeln)$/]`.

  Change the CHANGELOG wording to what the fixtures prove.

### H6 — Residual production heuristics (Info)

- **Evidence** (`parseEnv` called directly, `APP_ENV=production`, values built at run time).
  - Rejected:
    - a percent-encoded or dotted placeholder;
    - a 15-character DSN password, including one that is 16 raw characters only because of a percent-escape;
    - 32 spaces as the S3 secret;
    - plain http to a domain name, to `10.0.0.5`, to `localhost.` with a trailing dot, to an IPv4-mapped IPv6 address and to `0.0.0.0`.
  - Accepted:
    - 16 identical characters, or 16 encoded spaces, as a DSN password (it is not trimmed, unlike the S3 secret);
    - 32 identical characters as the S3 secret;
    - plain http to any dotless host (`storage`, `ai`), because `LOCAL_HOST` (`env.ts:9`) accepts any single label, which DNS search domains or a dotless public TLD can resolve off the machine;
    - `redis://` and a Postgres URL without `sslmode` to a remote domain.
  - The decimal form of 127.0.0.1 is normalised to loopback and correctly accepted.
- **Impact.** None today: nothing reads these values until Phase 2.
- **Fix** (Phase 2, with the first consumer):
  - trim DSN passwords like the S3 secret;
  - reject secrets with fewer than about 8 distinct characters;
  - replace "any single label" with the compose service names actually used;
  - for a non-local host, require `rediss:` for `REDIS_URL` and `sslmode=verify-full` for `DATABASE_URL`.

### H7 — `X-NEXT-INTL-LOCALE` is client-controlled on skipped paths (Info)

- **Evidence.**
  - On a path the proxy handles, it overwrites the header: `/fa/x` with a forged `en` header is still Persian.
  - On a path it skips (`/api`, `/api/x`, `/t/abc`, `/robots.txt`, `/x.png`, `/_next/x`, `/en/x.png`), the client chooses English. Any value other than exactly `fa` or `en` (`EN`, `en, fa`, `en%00`) falls back to Persian.
  - Every 404 carries `private, no-cache, no-store, max-age=0, must-revalidate` and all the security headers, `RSC: 1` included. There is no `Vary` on the header, which `no-store` makes unnecessary. Nothing from the URL or the header is reflected.
  - 300 unique 404s created no file under `.next` (no cache entries) and took about 8 ms each, against about 3 ms for the static `/fa`.
  - Four `x-middleware-subrequest` bypass variants (CVE-2025-29927 shape) still got the proxy's 307.
- **Impact.** None. The worst outcome is the English 404, as ADR 0018 states.
- **Fix** (record; no code now):
  - Phase 5: Nginx clears the inbound header (`proxy_set_header X-NEXT-INTL-LOCALE "";`) and never caches 404s over `no-store`.
  - Register or ADR 0018: the header selects between the two locales and nothing else. Any later reader, such as the `/t/*` QR route in Phase 4, takes the locale from the route or the session.

## Verified controls (no finding)

- **Environment:** error output carries names and Zod codes only; `instrumentation.ts` is unchanged since round 4 (0 of 400 racing requests answered then); no `NEXT_PUBLIC_*` variable.
- **Package manager and runtime:** the hash pin is unchanged and enforced by Corepack. `parseAdvisories` now rejects re-keyed, wrapped and unknown-severity answers (unit-tested). The positive controls make both freshness checks prove that they can fail, for the right reason and not on a network error.
- **CI:**
  - top-level `contents: read`, no `pull_request_target`, action SHAs unchanged, `persist-credentials: false` everywhere, `github.event.before` only through `env`;
  - the new Lighthouse summary step reads only the job's own reports.
- **Secret scanning:**
  - `--config` overrides any in-repo `.gitleaks.toml` (confirmed in the gitleaks source);
  - full history clean with the two fake entries;
  - each entry needs a commit-bound fingerprint and a reason of more than 20 characters (both negative cases fail the test);
  - push protection on.
- **404 handling:** every unknown path is server-rendered with `lang`, `dir`, `<title>` and `<h1>`, `no-store`, all security headers, and no reflection; `/fa` and `/en` stay static.
- **Compose:** loopback-only published ports; the Postgres, Redis and S3 auth checks are unchanged since round 4 and green in CI; the object store is unreachable by name from Redis and Postgres.

## Notes outside security scope (for the code reviewer)

- `/en/x.png` (a missing asset under `/en`) gets the Persian 404, because the proxy skips static-file extensions. This matches ADR 0018's wording but may surprise English visitors.
- `CHANGELOG.md:14` and `:17` and `README.md:47` overstate the lint and scanner guarantees (H1, H5).

## Carry-forward checklist

- **Before merge (owner):**
  - N3 ruleset, verified with the API, including `allowed_merge_methods`;
  - H2 steps 1–2: tree scan, and redact the round-4 quote; otherwise a squash merge turns `main` red.
- **Cheap, any time before Phase 2:**
  - H1: `--ignore-gitleaks-allow`, `--disable-nosem`, `info/attributes`, any-depth file test, doc corrections;
  - H3: the one-line `if` and `defaults.run.shell: bash`;
  - H4: CODEOWNERS paths.
- **After merge (owner):** F10 and N5 — confirm a scheduled run and the first Dependabot PRs; enable Dependabot security updates and non-provider secret patterns (G1 step 4).
- **Phase 2:**
  - nonce CSP covering `/t/*` (L1);
  - migration role (L6), immutable-record revokes, env split (F4), E2E artifact hygiene;
  - H5 selectors and a URL scheme allowlist helper;
  - H6 rules.
- **Phase 3:** CMS slug validation; absolute URLs from a configured origin.
- **Phase 4:** the `/t/*` locale from the route, never from the header (H7).
- **Phase 5:**
  - SeaweedFS JWT signing and internal ports unreachable from the host (G2);
  - Redis ACLs and secret files;
  - Nginx `Host` pinning, headers with `always`, dropping `x-nextjs-*` (G5), and clearing the inbound locale header (H7);
  - HSTS domain inventory;
  - `APP_ENV` in the deploy unit (G6);
  - Node base image by digest; Node 24 before 2027-01-30 (F7).
