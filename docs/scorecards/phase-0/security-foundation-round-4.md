# Security review — Phase 0 / platform foundation, round 4

- Reviewer: security-reviewer (fresh session, round 4)
- Date: 2026-10-27
- Scope: the whole branch against `origin/main` (`chore/phase-0-foundation`, HEAD `26e1971`), focused on `git log a457aee..26e1971`:
  - the stricter production environment rules (`src/shared/config/env.ts`, `.env.example`);
  - pnpm pinned by tarball sha512 and installed with Corepack (`package.json:7`, `.github/workflows/ci.yml`);
  - Moderate-level gating for the package manager (`scripts/check-package-manager.ts`);
  - Node end-of-life checking (`scripts/check-node-version.ts`);
  - SeaweedFS flags and network isolation (`docker-compose.dev.yml`) and the new CI `services` checks;
  - `.gitleaksignore` and gitleaks running from `/repo` (`.github/ci-tools/compose.yaml`);
  - `global-not-found.tsx`, `dynamicParams = false` and the experimental flag (ADR 0018);
  - the new lint bans (`eval`, `new Function`, `javascript:` URLs, `dangerouslySetInnerHTML`, purity selectors);
  - the new and changed risk-register rows, ADRs 0013–0018.
- Baseline: [`security-foundation-round-3.md`](security-foundation-round-3.md) (at `a457aee`: Pass; N3 Medium open · 2 Low · 9 Info) and the author's [`foundation-round-3-response.md`](foundation-round-3-response.md). Every status below was re-measured, not taken from the response.
- Standard: OWASP ASVS 5.0.0 Level 2, only the parts that apply to what exists (no auth, sessions, uploads, OTP, QR tokens or server actions exist yet; `grep "use server"` and `route.ts` find nothing in `src/`).
- Context read: `CLAUDE.md`, `docs/project-plan.md` §3 and §7, `docs/phases/phase-00.md`, `docs/stories/platform-foundation.md`, ADRs 0013–0018, the risk register, the three earlier security reviews and the round-3 response.

## Method

Read-only: no tracked file was changed except this report. Probe files, the scratch clones, my servers (ports 3601–3606) and my compose project (`secr4`) were removed.

- Read every file changed in `a457aee..26e1971`.
- Audits and advisories:
  - `pnpm audit --audit-level=high`: 3 High, all ignored (R-001…R-003), exit 0. `pnpm audit --prod`: no known vulnerabilities. CI's production gate pipeline: `true`. No Moderate anywhere. No lockfile change since round 3.
  - npm bulk advisory API for `next` 16.4.3, `next-intl` 4.14.9, `react`/`react-dom` 19.3.1, `zod` 4.6.7 and `pnpm` 10.34.9: `{}`. Each runtime package is its `latest`.
- Package manager: the registry's `dist.integrity` for `pnpm@10.34.9`, converted to hex, equals the `+sha512.f49b5a8e…62fd32` in `package.json:7`. In a scratch directory, Corepack 0.34.0 with that field printed `10.34.9`; with the last hex digit changed it failed with `Mismatch hashes` (exit 1). `node scripts/check-package-manager.ts pnpm@10.28.0` lists 23 advisories (High and Moderate) and exits 1; the pinned version exits 0.
- Node: nodejs.org lists 22.23.4 (2026-10-20, `security: true`) as the newest 22.x; nodejs/Release `schedule.json` gives v22 `end: 2027-04-30`. All three freshness scripts exit 0.
- Built the app at HEAD and ran `next start` on my own loopback ports:
  - no environment at all → exit 1, 7 variable names, no values;
  - `APP_ENV=production` with the `.env.example` values → exit 1, four problems named;
  - every value valid but `APP_ENV` unset → exit 1, `APP_ENV: invalid_value`;
  - 400 requests racing an invalid-env start-up: 0 answered (all `000`);
  - headers, status, caching and body on 25 paths (two requests each), open-redirect shapes, `Host`/`X-Forwarded-Host`, `RSC: 1`, and URL reflection into the global 404.
- Called `parseEnv` directly for 14 production edge cases (G6).
- Docker: the daemon was not running in this VM, so I started `dockerd` (left running for the other reviewer; no containers of mine remain). Docker Hub still answered 429 for the pinned Postgres and Redis digests, so a temporary override outside the repo used the cached `postgres:17.6-alpine` and `redis:7.4-alpine`; SeaweedFS ran from the pinned digest `f7a49e3f…`. Under `COMPOSE_PROJECT_NAME=secr4` I re-ran every CI `services` check by hand, listed the object store's listeners, read its start-up log, and probed its internal APIs from Redis, from Postgres and from the host.
- Secret scanning: ghcr.io still refuses the gitleaks blob (403), so I built gitleaks v8.30.1 with `go install` (module checksums verified by the Go sum database). Scanned the branch from the repository root (as CI does), from an empty directory, and in scratch clones with the ignore file removed, with a planted fake token plus a root `.gitleaks.toml`, and with an inline `gitleaks:allow` (G1). A history grep for key, token and private-key patterns found nothing; no `.pem`/`.key`/Peyda file is tracked.
- Lint: one probe file under `src/shared/ui/` with eleven XSS-sink variants (deleted afterwards). `pnpm lint` exit 0; `pnpm test` 140/140 in 17 files.
- GitHub API: run `40559602653` for `26e1971` (all 6 jobs and every step `success`; artifacts `coverage` and `lighthouse`, 14-day expiry), repository settings, branch protection, rulesets. Job logs are not downloadable from this network (blob storage 403).
- Could not run: Semgrep (semgrep.dev and github.com are refused by the proxy, 403). I relied on the green CI job.

## Gate verdict

**Pass**: 0 Critical · 0 High.

- **Round 3:** F1, F2, F3, F5, F6, F7, F8, F9 and F11 are fixed (verified); F4 is tracked; F10 is an owner action after merge.
- **N3 (no branch protection on `main`) stays open as a Medium.** The register row is now complete, but `GET …/branches/main` still says `"protected": false`, and `…/rulesets` and `…/rules/branches/main` return `[]`. Its deadline is "before the first merge", and this branch is that merge. Merging before the ruleset exists breaks the register's own deadline; the next review would then rate it High.
- **New:** 1 Low (G1) and 5 Info (G2–G6).

## Status of round-3 findings

| ID  | R3 sev. | Status                               | Evidence (file:line)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | Low     | **Fixed**                            | `env.ts:16` has no default. `productionProblems` (`:36-48`) matches `/change[-_ ]?me/i` (`:4`) in every value, rejects an empty `URL.password` for `DATABASE_URL` and `REDIS_URL` (`:41-43`), and S3 secrets under 32 characters (`:44-46`). Proven on a real server (see Method: three start-ups exit 1, 0 of 400 racing requests answered) and by `env.test.ts`. Residual heuristics: G6.                                                                                                                                                                                                                                        |
| F2  | Low     | **Fixed (development)**; residual G2 | `docker-compose.dev.yml:60-77`. The start-up log has no telemetry line. 11 listeners remain (round 3: 16), two of them (admin, 12535 and 22535) bound to the container's loopback. Redis → `objectstore:8888`: `bad address`; Redis and Postgres → the container IP: timeout. Anonymous S3 GET 403, signed PUT 200. ADR 0013:52-56,65-69 and `risk-register.md:31` record JWT signing for Phase 5. But the host can still read objects through the filer (G2).                                                                                                                                                                     |
| F3  | Info    | **Fixed**                            | `page.tsx:15` (`dynamicParams = false`), `src/app/global-not-found.tsx`, `next.config.ts:44`. `/api`, `/robots.txt`, `/sitemap.xml`, `/favicon.ico`, `/x.webmanifest` and unknown `.png`/`.js`/`.css` names each answer 404 with `private, no-cache, no-store, max-age=0, must-revalidate`, `lang="fa" dir="rtl"` and the Persian `<h1>`. 30 more unique names created no route-cache entry (only the build-time `_not-found` exists). The page is prerendered and reflects nothing from the URL (probed with `</script>` and `onerror` payloads). `e2e/not-found.spec.ts:11-13,22` asserts it. Residual `x-nextjs-*` headers: G5. |
| F4  | Info    | **Tracked**                          | `risk-register.md:32`, Phase 2 (env split) and Phase 5 (per-service secret files).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| F5  | Info    | **Fixed**                            | `risk-register.md:13` now states the app's `zod` is 4.6.7 and that the production gate covers it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| F6  | Info    | **Fixed**                            | `package.json:7` carries the sha512, equal to the registry's integrity. `ci.yml:38-42,118-122` install pnpm through Corepack before `setup-node` caches the store, and Corepack rejects a mismatching hash (reproduced). `check-package-manager.ts:45` blocks Moderate. ADR 0014:46-57 describes the CI path correctly.                                                                                                                                                                                                                                                                                                            |
| F7  | Info    | **Fixed**                            | `check-node-version.ts:57-95` read the v22 `end` date, fail after it and print a `::warning::` within 90 days; unit-tested at the boundaries (`tests/check-node-version.test.ts:72-86`). ADR 0014:87 adds the revisit trigger. Minor residual: the warning is an annotation on a passing scheduled run, which nobody is notified of. A dated row in the accepted-risk table ("move to Node 24 by 2027-01-30") would make `check-risk-register.ts` fail on the date instead.                                                                                                                                                        |
| F8  | Info    | **Fixed**, residual G4               | `eslint.config.mjs:221-225` and the `Date()` selectors (`:87-88`). The probe caught `globalThis.eval`, `(0, eval)`, `Function('…')`, `setTimeout(string)` and `javascript:` in a `Link` `href` (via `no-script-url`). Gaps: G4.                                                                                                                                                                                                                                                                                                                                                                                                    |
| F9  | Info    | **Fixed**                            | `ci.yml:176-212`. Reproduced: both roles with a wrong and an empty password fail with `password authentication failed` / `no password supplied`; `REDISCLI_AUTH=wrong` answers `WRONGPASS`; anonymous S3 PUT and GET answer 403.                                                                                                                                                                                                                                                                                                                                                                                                   |
| F10 | Info    | **Open (owner, after merge)**        | `dependabot_security_updates: disabled`; `origin/main` still has no `.github/`, so the weekly run and Dependabot cannot start yet. Also enable `secret_scanning_non_provider_patterns` (currently `disabled`; see G1).                                                                                                                                                                                                                                                                                                                                                                                                             |
| F11 | Info    | **Fixed**                            | `risk-register.md:31-36`: object-storage JWT signing, app-environment secrets, Redis ACLs, `Host` trust, E2E artifact hygiene, and the full branch-protection ruleset (PR required, the six checks by name, no bypass actors including administrators).                                                                                                                                                                                                                                                                                                                                                                            |
| N3  | Medium  | **Open (owner action), recorded**    | API as above: unprotected, no rulesets, no branch rules. The register row (`risk-register.md:36`) is now complete. Add "require review from Code Owners" once G1's CODEOWNERS file exists.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| N5  | Low     | **Partially fixed**                  | Same evidence as F10.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| N6  | Low     | **Open (owner decision), recorded**  | Still `visibility: public`; `risk-register.md:37`. No licensed asset in Git (`git ls-files` has no Peyda file).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

Round-1 carry-forwards are unchanged: L1 (`'unsafe-inline'`, `next.config.ts:14`, Phase 2, becomes High if Phase 2 closes without a nonce CSP), L6 (migration role, Phase 2), I1/I5/I8 (now in the register), I4 (HSTS inventory, Phase 5).

## New findings

| ID  | Severity | Location                                                                                             | Title                                                                                                    |
| --- | -------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| G1  | Low      | `.github/ci-tools/compose.yaml:7-13`; `.gitleaksignore:1-6`; ADR 0016:71-73; no `.github/CODEOWNERS` | Secret-scan suppression is controlled by the code being scanned, and nothing gates a change to it        |
| G2  | Info     | ADR 0013:66-68; `docker-compose.dev.yml:75-77`; `README.md:13`                                       | The object store's unauthenticated filer is still readable from the host, contrary to ADR 0013           |
| G3  | Info     | `.github/workflows/ci.yml:197-201`                                                                   | The isolation and telemetry checks pass on any `wget` failure and do not test runtime behaviour          |
| G4  | Info     | `eslint.config.mjs:221-225,249,263`                                                                  | `dangerouslySetInnerHTML` via `createElement` or a spread, and `<iframe srcDoc>`, lint clean             |
| G5  | Info     | `next.config.ts:45`; `docs/security/risk-register.md:27`                                             | Trailing-slash 308 redirects carry no security headers; `x-nextjs-*` headers fingerprint the framework   |
| G6  | Info     | `.env.example:23`; `src/shared/config/env.ts:4,36-48`                                                | Production rules are heuristics; a production host that copies `.env.example` starts in development mode |

### G1 — Secret-scan suppression is controlled by the code being scanned (Low)

- **Evidence** (gitleaks v8.30.1, the pinned version, built from source):
  - The single entry in `.gitleaksignore:6` suppresses exactly one finding, and it is a fake value: a made-up 32-character `S3_SECRET_KEY` test value [quoted value removed after review so the tree scan stays clean; security review round 5, H2] at `4e14993:src/shared/config/env.test.ts:18`. The test now builds its value at run time (`env.test.ts`, `'x'.repeat(32)`). The full history scan from the repository root reports "no leaks found"; a clone without the ignore file reports exactly this one finding.
  - gitleaks also loads `.gitleaksignore` from the root of the scanned source: a scan of the repository from an empty directory also reports "no leaks found". The `working_dir: /repo` change (`compose.yaml:9-10`) is harmless, but its comment is incomplete.
  - In a scratch clone with a planted fake `ghp_…` token, the scan reports "leaks found: 2". Adding a root `.gitleaks.toml` (`[extend] useDefault = true` plus `[allowlist] paths = ['''.*''']`) turns it into "no leaks found". A trailing `// gitleaks:allow` comment does the same for one line. Semgrep likewise honours `.semgrepignore` and `nosemgrep` comments by design (not run here).
  - None of these files or markers exists today (`git grep` finds no `gitleaks:allow`, `nosemgrep` or `nosec`). But nothing would notice one being added: there is no `CODEOWNERS`, no ruleset (N3), and ADR 0016:71-73 ("handled with the tool's own allowlist and a written reason, never by disabling the scan") is enforced by nothing but review.
  - GitHub push protection is on, but `secret_scanning_non_provider_patterns` is `disabled`. A generic S3, Postgres or Redis secret (the kind this project holds) is therefore caught only by gitleaks.
  - The fingerprint is bound to commit `4e14993`. The round-3 response leaves a history rewrite (D1/D2) or a squash merge open. A squash merge removes the literal from `main`, which is fine. A rewrite or a rebase merge changes the SHA, and gitleaks then fails until someone edits the ignore file under time pressure, which is exactly the moment a real secret can be waved through.
- **Impact:** The repository is public. A real credential committed by a maintainer or an agent can be turned green in the same push by a suppression, with no second pair of eyes. Severity is Low because the one current entry is verified fake and exploitation needs push rights. But secret leakage is the control this job exists for, and today a scan with a hidden config file passes it.
- **Fix:**
  1. Pin the scanner configuration outside the scanned root. Add `.github/ci-tools/gitleaks.toml` containing only `[extend]` and `useDefault = true`, and change the command to `['git', '/repo', '--config', '/repo/.github/ci-tools/gitleaks.toml', '--redact', '--verbose']`. Verified: with `--config`, the planted token is found again despite a root `.gitleaks.toml`.
  2. Add a fail-closed step to the `secrets` job, for example `test ! -e .gitleaks.toml && test ! -e .semgrepignore && ! git grep -nE 'gitleaks:allow|nosemgrep' -- ':!tests/fixtures'`. Also make a small script fail when a `.gitleaksignore` entry is not directly preceded by a `#` reason line.
  3. Add `.github/CODEOWNERS` for `/.github/`, `/.gitleaksignore`, `/package.json` (`auditConfig.ignoreGhsas`), `/pnpm-workspace.yaml` (`minimumReleaseAgeExclude`) and `/docs/security/`. Turn on "Require review from Code Owners" in the N3 ruleset.
  4. Owner: enable `secret_scanning_non_provider_patterns`.
  5. Add one line to `.gitleaksignore`: after any history rewrite, re-point or delete the entry (a squash merge removes the literal from `main` entirely).

### G2 — The object store's unauthenticated filer is readable from the host (Info)

- **Evidence:**
  - With the compose stack up, I made a signed S3 PUT of `r4-probe.txt`. Then, from the host, with no credentials:
    - `curl http://172.20.0.2:8888/buckets/popcorn-media/r4-probe.txt` returned the object;
    - `:9333/dir/status` returned the master topology;
    - `:9340/status` returned 200.
  - The S3 gateway itself still answered 403 to anonymous requests. Containers on the default network could not reach any of these ports (Redis: `bad address`; Redis and Postgres by IP: timeout), so the F2 fix holds between containers.
  - On Linux, Docker routes the host to every bridge network. ADR 0013:66-68 says the internal APIs are reachable "only inside the object store's own compose network, never from the host, the internet or the other services". The "never from the host" part is not true for Docker Engine on Linux; it holds on Docker Desktop.
  - Also, on Docker Engine before 28.0, other machines on the same LAN could reach unpublished container ports by routing through the host. 28.0 blocks this by default. I did not test it; the daemon here is 29.9.2.
  - Precision: `-admin.ui=false` still starts the admin server and worker gRPC (`127.0.0.1:12535`, `:22535`), bound to the container's loopback. They are unreachable, but they are running, not "off".
- **Impact:** development only, with test data. Any local process, or a LAN neighbour on an older Docker, can read or overwrite every object and mint S3 identities through the filer IAM gRPC (18888) without credentials. The real risk is the ADR's wording carrying into the Phase 5 decision for résumé storage.
- **Fix:**
  - Correct ADR 0013:66-68 to: "not reachable from the other containers; on a Linux Docker host any local process can reach the container IP, and Docker Engine before 28.0 also accepts direct-routed LAN traffic".
  - Add "Docker Engine ≥ 28 on Linux" to `README.md:13`.
  - Keep the Phase 5 requirement (`risk-register.md:31`: JWT signing for master, volume and filer, and filer IAM), and add "the internal ports bound to an interface no workload or host process outside the storage tier can reach".

### G3 — The isolation and telemetry checks prove less than they read (Info)

- **Evidence:** `ci.yml:197-201`.
  - Telemetry is asserted only as a string in the rendered command. Nothing checks the runtime log.
  - Isolation is `! docker compose exec -T redis wget …`. It passes on any failure: a Redis image without `wget` (a future Dependabot bump to a slimmer image), a timeout, or a crash. It does not check the reason (`bad address`), it does not include Postgres, and there is no positive control showing the probe can succeed at all.
  - Contrast `ci.yml:176-186`, which does assert the reason for the Postgres failures.
- **Fix:**
  ```sh
  docker compose exec -T objectstore wget -qO /dev/null http://127.0.0.1:8888/   # probe works
  for svc in redis postgres; do
    out=$(docker compose exec -T "$svc" wget -q -T 3 -O /dev/null http://objectstore:8888/ 2>&1) && exit 1
    grep -q 'bad address' <<<"$out"
  done
  ! docker compose logs objectstore | grep -qi telemetry
  ```

### G4 — Two `dangerouslySetInnerHTML` shapes and `srcDoc` lint clean (Info)

- **Evidence:** a probe in `src/shared/ui/` produced no error for:
  - `createElement('div', { dangerouslySetInnerHTML: { __html: html } })`;
  - `<div {...{ dangerouslySetInnerHTML: { __html: html } }} />`;
  - `<iframe srcDoc="<script>…</script>" />`.

  `react/no-danger` inspects only JSX attributes.

  A dynamic `href={u}` is not lintable either; Phase 2 should route user-supplied URLs through a scheme-allowlist helper.

- **Impact:** low. Each form must be written deliberately, and Semgrep is a second net in CI. But the script CSP is still `'unsafe-inline'` (L1), so markup injection is not yet contained.
- **Fix:** add `{ selector: "Property[key.name='dangerouslySetInnerHTML']", message: … }` and `{ selector: "JSXAttribute[name.name='srcDoc']", message: … }` to both `no-restricted-syntax` lists (`eslint.config.mjs:249` and `:263`). A project-wide entry would be replaced by those blocks, because flat config overrides a rule's whole options array. Add both lines to `tests/fixtures/src/shared/ui/unsafe-code.tsx` with `// expect:` markers.

### G5 — Header-less 308 redirects and framework fingerprint headers (Info)

- **Evidence:**
  - Next's trailing-slash redirect (`/fa/` → `/fa`, `/api/` → `/api`) answers 308 with `Location` and `Refresh` but no CSP, HSTS, `X-Frame-Options` or other header from `next.config.ts:45`. Every 200, 307 and 404 response I probed carries CSP and HSTS.
  - Prerendered responses carry `x-nextjs-cache`, `x-nextjs-prerender` and `x-nextjs-stale-time`.
  - Not new in this round (Next.js behaviour), but not recorded anywhere.
  - No open redirect: `//evil.example/`, `/%5Cevil.example/`, `/\evil.example/` and `/%09/…` all redirect to same-origin paths. `Host: evil.example` still yields a relative `Location: /fa`.
- **Impact:** negligible today; a body-less redirect cannot be framed. HSTS is learned from any other response.
- **Fix (Phase 5):**
  - Nginx sets HSTS and the baseline headers with `add_header … always`, and `proxy_hide_header` drops `x-nextjs-*`.
  - Append both to the HSTS row (`risk-register.md:27`).

### G6 — Production rules are heuristics; copying `.env.example` selects development (Info)

- **Evidence** (direct `parseEnv` calls with `APP_ENV=production`):
  - Rejected: an empty password, `?password=` only, `CHANGE_ME`, and an `APP_ENV` of `Production` or `production `.
  - Accepted:
    - `postgres://app:%63hange-me@db/p` (percent-encoded placeholder);
    - `redis://:change.me@cache:6379`;
    - a 1-character DSN password;
    - an S3 secret of 32 spaces or 32 identical characters;
    - `S3_ENDPOINT=http://storage.example.com` (plaintext to a remote host).
  - `.env.example:23` sets `APP_ENV=development`, and CI deliberately relies on that (`ci.yml:128-129`). So a production host whose `.env` was copied from the example starts with every placeholder accepted. That is an explicit value, not an omission, so it is outside F1's scope.
- **Impact:** none today; nothing consumes these values until Phase 2.
- **Fix (Phase 5 deploy, cheap):**
  - Set `APP_ENV=production` in the deployment unit (compose `environment:` or systemd), never in the env file. Say so in the Phase 5 runbook.
  - In `productionProblems`, match the placeholder against `decodeURIComponent(value)` with `/change[-_ .]?me/i`.
  - Require at least 16 characters for DSN passwords.
  - Require `https:` for an S3 endpoint whose host is not loopback or private.

## Verified controls (no finding)

- **Environment validation:**
  - Error output carries names and Zod codes only.
  - `instrumentation.ts` awaits the check before serving: 0 of 400 racing requests were answered.
  - No `NEXT_PUBLIC_*` variable; `src/` reads `process.env` only in `instrumentation*.ts`.
- **Package manager and runtime:**
  - The hash pin is correct and enforced by Corepack in both jobs that install.
  - The `freshness` job needs no `node_modules`.
  - Its scripts validate the shape of the remote data, fail closed on non-2xx, and are unit-tested.
- **CI:**
  - Top-level `contents: read`; no `pull_request_target`; action SHAs unchanged; all checkouts set `persist-credentials: false`.
  - `github.event.before` reaches the script only via `env`.
  - The new `concurrency` expression is not interpolated into a script.
  - Run `40559602653` at HEAD: all six jobs and every step `success`.
- **Compose:**
  - Published ports bind to `127.0.0.1` (asserted, `ci.yml:169-170`); secrets are required via `:?`.
  - The `popcorn_app` role is neither superuser nor able to `CREATE` in `public` or in the database.
  - Redis has no password in argv, and both `NOAUTH` and `WRONGPASS` are asserted.
  - Telemetry, WebDAV, Iceberg and Lance are off.
- **404 handling (ADR 0018):**
  - Single-segment 404s are static, `no-store`, localized and non-reflecting.
  - Security headers are present on them.
  - The experimental flag's failure mode is covered by `e2e/not-found.spec.ts:11-13`.
- **Lint:**
  - `noInlineConfig: true` makes an inline `eslint-disable` impossible.
  - The new bans apply project-wide (`.ts`, `.tsx`, `.mjs`, `scripts/`, `e2e/`).
- **Secrets:** gitleaks over the full history is clean (one documented fake), the history grep is clean, and push protection is on.

## Notes outside security scope (for the code reviewer)

- Multi-segment 404s (`/fa/no`, `/t/abc`, `/api/x`) send `<html id="__next_error__">` with no `lang`, no `dir` and no `<h1>` in the server HTML. The localized page appears only after client-side rendering. The E2E suite runs with JavaScript, so AC19 and the CHANGELOG ("localized and accessible 404 pages for every unknown path") hold in a browser with JavaScript, but not for crawlers or no-JS clients. The single-segment global 404 is fully server-rendered. I did not check whether this predates `18c7bba`.

## Carry-forward checklist

- **Before merge (owner):**
  - N3 ruleset, verified with the API before merging. Include code-owner review once G1's CODEOWNERS exists.
  - Choose squash merge, or re-point `.gitleaksignore` after any rewrite (G1).
- **Cheap, any time before Phase 2:**
  - G1 steps 1–3 (pinned gitleaks config, suppression guard, CODEOWNERS).
  - G3 (reasoned isolation checks).
  - G2 doc correction.
- **After merge (owner):** F10 — confirm a scheduled run and the first Dependabot PRs; enable Dependabot security updates and non-provider secret patterns.
- **Phase 2:**
  - Nonce CSP covering `/t/*` (L1).
  - Migration role (L6), immutable-record revokes, env split (F4), E2E artifact hygiene.
  - G4 lint selectors and a URL scheme allowlist helper.
- **Phase 3:** CMS slug validation; absolute URLs from a configured origin.
- **Phase 5:**
  - SeaweedFS JWT signing and host-unreachable internal ports (F2, G2).
  - Redis ACLs and secret files.
  - Nginx `Host` pinning, headers with `always`, and stripping `x-nextjs-*` (G5).
  - HSTS domain inventory.
  - `APP_ENV` set in the deploy unit (G6).
  - Node base image by digest; Node 24 before 2027-01-30 (F7).
