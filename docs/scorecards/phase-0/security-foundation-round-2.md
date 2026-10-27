# Security review — Phase 0 / platform foundation, round 2

- Reviewer: security-reviewer (fresh session, round 2)
- Date: 2026-10-27
- Scope: `git diff d6d7799..HEAD` on `chore/phase-0-foundation` (HEAD `5403203`): header hardening, proxy matcher, compose app role and digest pins, pnpm overrides / `auditConfig` / `minimumReleaseAge`, CI (SHA pins, `persist-credentials`, audit gate, gitleaks, Semgrep, service auth checks), Dependabot, `docs/security/risk-register.md`, ESLint boundaries config, vendored fonts, `scripts/*.ts`
- Baseline: [`security-foundation.md`](security-foundation.md) (round 1, at `d6d7799`: Pass, 2 Medium · 8 Low · 8 Info)
- Standard: OWASP ASVS 5.0.0 Level 2, only the parts that apply to what exists
- Context read: `CLAUDE.md`, `docs/project-plan.md` §7, `docs/stories/platform-foundation.md`, `docs/security/risk-register.md`, ADR 0013, ADR 0014, round-1 response
- Method (read-only; no file changed except this report, no state-changing git):
  - Read every changed file; ran `pnpm audit`, `pnpm audit --prod`, and `pnpm audit --json` on a scratch copy of the manifest **without** `auditConfig` to see what the ignore list hides.
  - Rendered `docker compose --env-file … config` with `.env.example` values (no containers started).
  - Resolved each pinned action tag with `git ls-remote` against the official repos, and each image tag with `docker buildx imagetools inspect` (registry only, no pull); listed Docker Hub tags for staleness.
  - Compiled the proxy matcher with Next.js's own `getMiddlewareMatchers` (`next/dist/build/analysis/get-page-static-info.js`) and probed 22 paths.
  - Downloaded `@fontsource/vazirmatn@5.3.0` into a scratch directory and compared SHA-256 of the four vendored WOFF2 files and the licence.
  - Read repository settings and the HEAD CI run (`40458148493`, all 5 jobs and every step `success`) via the GitHub API. Job logs were not retrievable through the proxy.
  - Checked the pinned toolchain against nodejs.org release metadata and the npm bulk-advisory API (the same source `pnpm audit` uses).

**Gate verdict: Pass** — 0 Critical · 0 High. New in this round: 3 Medium · 4 Low · 6 Info. Both round-1 Mediums are fixed. The three new Mediums (N1–N3) are cheap; fix them before merge.

## Status of round-1 findings

| ID  | R1 sev. | Status                          | Evidence (file:line)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | ------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | Medium  | **Fixed**                       | Blocking gate `ci.yml:48-49` (`pnpm audit --audit-level=high`). Overrides `package.json:63-68`, in lockfile `pnpm-lock.yaml:7-11` (`tmp` 0.2.7, `basic-ftp` 6.2.3, `uuid` 11.1.1). Ignore list `package.json:69-75` = exactly R-001…R-003 in `risk-register.md:9-11` (owner, reason, review-by 2027-01-31). Re-run: 3 High, all ignored; without the ignore list the only hits are those three GHSAs, all under `@lhci/cli`; `--prod` clean. Residuals: N4 (ignores not path-scoped), N5 (no detection between pushes). The package manager itself is outside this gate: N2.                                  |
| M2  | Medium  | **Fixed**                       | Full SHAs at `ci.yml:25,29,30,54,66,78,94,97,98,106,117,129`. `git ls-remote` confirms each is the release commit of the tag in its comment: checkout `v7.0.1`, setup-node `v7.1.0`, upload-artifact `v7.0.2`, pnpm/action-setup `v6.0.10` (annotated tag, peeled). Dependabot `github-actions` at `dependabot.yml:16-21`. Scanner images are digest-pinned (`ci.yml:71,84`), and the digests equal the registry's current tag digests.                                                                                                                                                                       |
| L1  | Low     | **Accepted (tracked deferral)** | Still `'unsafe-inline'` at `next.config.ts:14`. Recorded with a Phase 2 deadline and the `/t/*` caveat at `risk-register.md:24`, and in the comment at `next.config.ts:6-11`. Round-1 escalation still applies: if Phase 2 closes without the nonce CSP, it becomes High.                                                                                                                                                                                                                                                                                                                                     |
| L2  | Low     | **Fixed**                       | `next.config.ts:20` `base-uri 'none'`; asserted at `e2e/hello.spec.ts:85`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| L3  | Low     | **Fixed**                       | `e2e/hello.spec.ts:69-91` asserts XFO, nosniff, exact HSTS, Referrer-Policy, Permissions-Policy, COOP, CORP, no `X-Powered-By`, CSP `default-src`/`object-src`/`base-uri`/`frame-ancestors`, and no `unsafe-eval`. Services: loopback binding `ci.yml:134-135`, Postgres wrong password over the compose network `:141-144`, app role not superuser and no `CREATE` `:145-150`, Redis `NOAUTH` `:151-152`. All steps green at HEAD. Nit, no ID: the "missing password" case of AC10 is not exercised; wrong-password refusal proves `scram-sha-256` is enforced for host connections, which is the substance. |
| L4  | Low     | **Fixed**                       | `src/proxy.ts:11-13`. Compiled with Next's own matcher builder: `/apiary`, `/fa/menu/em.cafe`, `/fa/admin/users.json`, `/fa/api/x` run the proxy; `/api`, `/api/x`, `/t/abc`, `/_next/static/*`, `/.well-known/security.txt` skip it. Real-server proof at `e2e/hello.spec.ts:93-105`; unit test `src/proxy.test.ts:13-31` (equivalent to Next's regex for these paths: Next tests it case-sensitively, `middleware-route-matcher.js`). Residual edge: N11.                                                                                                                                                   |
| L5  | Low     | **Fixed**                       | `persist-credentials: false` on all five checkouts: `ci.yml:28,69,80,96,131`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| L6  | Low     | **Partially fixed**             | App path fixed: `docker/postgres/init/02-app-role.sh:10-21` (`NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`, DML only, `CREATE` on `public` revoked; psql variables are quoted with `:"…"`/`:'…'`, so no injection), `.env.example:8-10,21`, `compose.yaml:14-16`, CI proof `ci.yml:145-150`. **Open:** round-1 fix steps 2–3 (separate non-superuser migration role; superuser only for bootstrap). `MIGRATION_DATABASE_URL` is the superuser (`.env.example:8,22`), and this is not in the risk register. Must close in the Phase 5 production compose. See also N10.                      |
| L7  | Low     | **Fixed**                       | `compose.yaml:8,29,54` pin `tag@sha256`. `imagetools inspect` shows each digest is the current registry digest of its tag. `17.11-alpine` is the newest 17.x on Docker Hub; `7.4.12` is the newest 7.4.x. Dependabot `docker-compose` at `dependabot.yml:23-29`.                                                                                                                                                                                                                                                                                                                                              |
| L8  | Low     | **Partially fixed**             | Done: Dependabot for npm, actions and compose (`dependabot.yml`); gitleaks over full history (`ci.yml:61-71`); `minimumReleaseAge: 1440` (`pnpm-workspace.yaml:3`, effective: `pnpm config get minimumReleaseAge` → 1440). GitHub API shows secret scanning and push protection **enabled**. Not done: branch protection on `main` (now N3, Medium), `strictDepBuilds`, Dependabot security updates (disabled, N5).                                                                                                                                                                                           |
| I1  | Info    | **Partially fixed**             | Healthcheck now authenticates via `REDISCLI_AUTH` (`compose.yaml:44,48-50`). `--requirepass <secret>` is still in the server argv (`compose.yaml:36-37`). The Phase 5 ACL user and `redis.conf` are not recorded in the register (N13).                                                                                                                                                                                                                                                                                                                                                                       |
| I2  | Info    | **Open (Phase 5)**              | ADR 0013 was rewritten but does not mention filer/volume authentication (JWT signing) or a bucket-scoped app identity. The app still gets the single admin identity (`compose.yaml:58-59`). Not in the register (N13).                                                                                                                                                                                                                                                                                                                                                                                        |
| I3  | Info    | **Partially fixed**             | COOP and CORP added (`next.config.ts:32-33`) and asserted. `Permissions-Policy` is unchanged (`:30`). CSP reporting waits for GlitchTip. Note: CORP `same-origin` will also block cross-site embedding of public media. If Phase 3 media must be embeddable (email, partners), relax CORP on that path only.                                                                                                                                                                                                                                                                                                  |
| I4  | Info    | **Accepted (tracked)**          | `risk-register.md:25`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| I5  | Info    | Unchanged (no defect)           | Proxy logic is unchanged apart from the matcher. The Phase 5 Nginx `server_name` / `default_server` requirement still stands and is not in the register (N13).                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| I6  | Info    | **Accepted**                    | ADR 0014:93-94 (risk) and :105 (revisit trigger). ESLint is still 9.39.5.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| I7  | Info    | Unchanged (acceptable)          | `lighthouserc.json:8` `--no-sandbox`; URLs are localhost only (`:6`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| I8  | Info    | **Open (Phase 2), amplified**   | `playwright.config.ts:12` `retain-on-failure`; artifacts at `ci.yml:54-59,106-122`. The repository is **public** (N6), so every artifact and log is world-readable.                                                                                                                                                                                                                                                                                                                                                                                                                                           |

## New findings

| ID  | Severity | Location                                                                       | Title                                                                                                 |
| --- | -------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| N1  | Medium   | `.nvmrc:1`, `package.json:9`, `ci.yml:32,100`                                  | Node pinned to 22.22.1, behind four security releases (regression introduced in `a701e1f`)            |
| N2  | Medium   | `package.json:7`, `ci.yml:29,97`                                               | pnpm 10.28.0 has 11 High and 12 Moderate advisories; the package manager is outside every gate        |
| N3  | Medium   | GitHub repo settings (`main`)                                                  | No branch protection or ruleset on `main`, so the CI security gates are advisory                      |
| N4  | Low      | `package.json:69-75`, `risk-register.md:11`                                    | Audit exceptions are global, not scoped to the dev-only path that justifies them                      |
| N5  | Low      | `ci.yml:3-7`, repo settings, `risk-register.md:3-4`                            | No advisory detection between pushes; register expiry not machine-enforced                            |
| N6  | Low      | GitHub repo settings                                                           | Repository is public: artifacts and logs are world-readable, and a licensed font must not be vendored |
| N7  | Low      | `package.json:12,14`                                                           | `next dev` / `next start` listen on 0.0.0.0, unlike the loopback-only service policy                  |
| N8  | Info     | `dependabot.yml:4-29`                                                          | Dependabot has no `cooldown`; the release-age policy does not cover Dependabot or images              |
| N9  | Info     | `ci.yml:71,83-87`                                                              | Scanner images in `run:` are not tracked by Dependabot and mount the workspace read-write             |
| N10 | Info     | `02-app-role.sh:12,18-19`, `compose.yaml:16`                                   | App role gets UPDATE/DELETE on every future table; app password stays in the container env            |
| N11 | Info     | `src/proxy.ts:12`                                                              | A page slug ending in a static-file extension skips locale routing                                    |
| N12 | Info     | `docs/adr/0014-toolchain-baseline.md:99-101`                                   | ADR overstates what `minimumReleaseAge` and digests protect against when using a mirror               |
| N13 | Info     | `foundation-round-1-response.md:6-7`, `risk-register.md:20-25`, `fonts/files/` | Governance records: overstated fix claim, missing deferred controls, no recorded font hashes          |

### N1 — Node runtime pinned behind four security releases (Medium)

- **Evidence:** at `d6d7799`, `.nvmrc` was `22`, and `actions/setup-node` resolved it to a current 22.x. Commit `a701e1f` (fix for code-review D-14) set it to exactly `22.22.1` (`.nvmrc:1`). That is the minimum `lint-staged` needs, not the latest patch. Both CI jobs install this version (`ci.yml:32,100`), and `engines` allows it (`package.json:9`).
- **What it misses:** per nodejs.org release metadata, 22.22.1 (2026-03-04) has been followed by four security releases:
  - 22.22.2 (2026-03-24): CVE-2026-21710, `http` `headersDistinct`/`trailersDistinct` null prototype, **High**; CVE-2026-21637, TLS `SNICallback`, **High**; plus 3 Medium and 2 Low.
  - 22.23.0 (2026-06-17): 11 CVEs.
  - 22.23.2 (2026-07-28): 10 CVEs.
  - 22.23.4 (2026-10-20): `http` agent data guard, TLS non-canonical IP, DNS null bytes, brotli, and more.
- **Why Medium:**
  - This is the application's own runtime. Its HTTP stack is reachable beyond loopback on developer machines, because `next dev`/`next start` listen on 0.0.0.0 (N7).
  - Nothing will bump it: Dependabot does not read `.nvmrc`, and `pnpm audit` does not see the runtime.
  - ADR 0014:43-46 records it as the baseline, so the Phase 5 production image is likely to inherit it.
  - No production system exists yet, which keeps it below High.
- **Fix:**
  1. Set `.nvmrc` to `22.23.4`, and raise `engines.node` to `>=22.23.4`.
  2. Add a tracking mechanism: Renovate's `nvm` manager, or a CI step that fails when nodejs.org lists a newer 22.x release with `security: true`.
  3. In Phase 5, build from `node:22.x-alpine@sha256:…` under the Dependabot `docker` ecosystem.

### N2 — pnpm 10.28.0 carries known High advisories, and nothing checks the package manager (Medium)

- **Evidence:** `package.json:7` sets `"packageManager": "pnpm@10.28.0"`. `pnpm/action-setup` (`ci.yml:29,97`) installs exactly that version, and so do developer machines (`pnpm --version` → 10.28.0). The npm bulk-advisory API returns 11 High and 12 Moderate advisories for `pnpm@10.28.0`. The ones relevant to this repository's default `isolated` linker:
  - GHSA-hwx4-2j3j-g496 (High, < 10.34.0): a transitive dependency's alias can path-traverse and override project paths through symlink replacement.
  - GHSA-vq4v-j7r6-jq4m (High, < 10.34.5): a tarball dependency's manifest `name` escapes `node_modules`, allowing arbitrary file write.
  - GHSA-c59q-g84q-2gj5 (High, < 10.34.5): an unvalidated `depPath` name in `lockfileToDepGraph` allows path traversal.
  - GHSA-q6j5-fjx5-2mc3 and GHSA-54hh-g5mx-jqcp (Moderate): the lockfile integrity check can be bypassed. This undermines round 1's "every package has a `sha512`" control.
  - GHSA-cjhr-43r9-cfmw (Moderate): user-level npm credentials are sent to a repository-selected registry.

  The fixed release, 10.34.5, has existed since 2026-07-10; the latest is 10.34.9. `pnpm audit` does not audit the package manager, so the M1 gate cannot see any of this.

- **Why Medium, not High:**
  - Exploitation needs a malicious package, mirror or lockfile.
  - In this repository, a malicious dependency would also execute at lint, test or build time, and a malicious PR already controls root lifecycle scripts. The incremental risk is install-time code execution and bypassable integrity and build-script controls.
  - CI holds no secrets.
- **When it becomes High:** once any job that runs `pnpm install` holds secrets (a Phase 5 deploy), or when installs routinely go through the domestic npm mirror that README and ADR 0008 recommend. Pre-existing at `d6d7799`; not reported in round 1.
- **Fix:**
  1. Set `"packageManager": "pnpm@10.34.9"`. Any version ≥ 10.34.5 fixes every advisory listed above; 10.34.9 is older than 24 hours, so it also satisfies the project's own release-age policy.
  2. Re-run `pnpm install --frozen-lockfile` and the full CI.
  3. Add a CI check that queries the advisory API for the pinned pnpm and Node versions, or let Renovate track `packageManager`.
  4. Record both toolchain pins in ADR 0014 with that tracking rule.

### N3 — `main` is unprotected, so the security gates do not block anything (Medium)

- **Evidence:** `GET /repos/HuseinHbz/popcorn/branches/main` returns `"protected": false` with `required_status_checks.enforcement_level: "off"`. `GET /repos/…/rules/branches/main` returns `[]`.
- **Impact:** the audit gate, gitleaks, Semgrep, tests and commitlint (AC9, AC13, the DoD's "CI green") all report a status, but nothing requires it.
  - A red PR can be merged, or code can be pushed straight to `main`.
  - Force-pushes to `main` are allowed. The round-1 response, D-16, is waiting on exactly that decision.
  - In an agent-driven workflow, this setting is what makes the M1/M2/L8 fixes binding.
- **Fix:** add a ruleset on `main`:
  1. Require a pull request.
  2. Require all five CI jobs as status checks (`quality`, `secrets`, `sast`, `build`, `services`, selected by their check names).
  3. Block force-push and deletion.
  4. Allow no bypass actors, including admins.
  5. Optionally, require signed commits.

### N4 — Audit exceptions are not path-scoped (Low)

- **Evidence:** `pnpm.auditConfig.ignoreGhsas` (`package.json:69-75`) suppresses GHSA-mrhx-c7xc-m3w5 for **every** `zod < 4.6.6` in the graph, and the `extract-zip` GHSAs for every `extract-zip`. The register justifies them per path: dev-only, chromium-bidi, and "the app has no direct `zod` dependency yet" (`risk-register.md:11`).
- **Why it matters soon:** CLAUDE.md requires a Zod parse in every Server Action, so Phase 2 adds `zod` to production dependencies. A vulnerable `zod` on a production path, direct or transitive, would then pass the gate silently.
- **Verified:** with the ignores, `pnpm audit --json` returns `advisories: {}` but still reports `metadata.vulnerabilities.high: 3`. The metadata count includes ignored advisories.
- **Fix:**
  - Add a second blocking step that honours no exceptions on production paths: `pnpm audit --prod --json | jq -e '.metadata.vulnerabilities | (.high + .critical) == 0'`. It currently passes.
  - Add a register rule: an ignored GHSA must never appear under `--prod`.
  - Add a trigger to R-003: re-assess when `zod` is added.

### N5 — No detection between pushes (Low)

- **Evidence:** CI triggers only on push, PR and manual dispatch (`ci.yml:3-7`), with no `schedule`. The repository API shows `dependabot_security_updates: disabled`. Version updates run weekly. The register's "expired entry fails review" (`risk-register.md:3-4`) relies on a person noticing.
- **Impact:** a new High advisory against a locked runtime dependency surfaces only on the next push, or in the weekly PR. That falls short of the "documented remediation time frames" goal in round-1 M1 (ASVS V15.1.1/V15.2.1).
- **Fix:**
  - Add a nightly `schedule` workflow that runs the audit (including N4's production check) and gitleaks.
  - Enable Dependabot alerts and security updates.
  - Add a CI step that fails when any `Review by` date in the register is in the past.

### N6 — Public repository (Low)

- **Evidence:** the repository API shows `visibility: public`, `license: null`, `allow_forking: true`. No decision is recorded.
- **Impact:**
  - Artifacts and logs are readable by anyone. From Phase 2, E2E traces will contain session material (I8).
  - CLAUDE.md lists Peyda as **licensed**. This round established vendoring fonts into `src/shared/ui/fonts/files/`, and doing the same with Peyda in Phase 1 would publish it.
  - The internal plan and security design are public.
  - Nothing secret is exposed today: a history grep and the HEAD gitleaks run are clean.
- **Fix:** make the repository private, or record an ADR that accepts public visibility with compensating rules:
  - No licensed binaries in Git: fetch them at build time from private storage.
  - No session-bearing artifacts.
  - Test-only accounts.
  - Artifact retention of 1–3 days.

### N7 — App servers bind to all interfaces (Low)

- **Evidence:** `package.json:12,14` run `next dev` and `next start` without `-H`. Next.js defaults to `0.0.0.0` (`node_modules/next/dist/bin/next:203,229`). This contradicts the loopback-only policy that `compose.yaml:2` and the README apply to every service. The dev build also ships a CSP with `'unsafe-eval'` (`next.config.ts:14`) and runs on the N1 runtime.
- **Impact:** on shared Wi-Fi, anyone on the network can reach a developer's server. From Phase 2 that includes pages backed by the local database.
- **Fix:** use `"dev": "next dev -H 127.0.0.1"`, with an opt-in `dev:lan` script for testing on a phone. Playwright and LHCI use `localhost` and are unaffected.

### Informational

- **N8 — Dependabot is not aligned with the release-age policy (`dependabot.yml:4-29`).**
  - `minimumReleaseAge` is enforced only where pnpm resolves. Dependabot runs its own updater and may propose a version published minutes earlier.
  - Images are not covered either: SeaweedFS `4.51` was pinned about one day after publication.
  - Fix: add `cooldown: { default-days: 1 }` (consider 3–7 for majors) to all three ecosystems.
- **N9 — Scanner images (`ci.yml:71,83-87`).**
  - The gitleaks and Semgrep images are digest-pinned and currently the latest releases (gitleaks v8.30.1, Semgrep 1.182.1). They sit in `run:` lines, which no Dependabot ecosystem parses, so they will age silently.
  - Both mount `$PWD` read-write.
  - Semgrep rule packs are fetched unpinned at runtime; ADR 0014:94-96 already records this.
  - Fix: track the images with a Renovate regex manager, or a dated review row in the register. Add `:ro` to both mounts.
- **N10 — App role scope (`docker/postgres/init/02-app-role.sh:18-19`).**
  - Default privileges grant `UPDATE, DELETE` on every future table. CLAUDE.md forbids hard-deleting orders, bookings and payments, and an audit log should be append-only.
  - Fix: in the Phase 2 migrations, `REVOKE DELETE` on `orders`/`bookings`/`payments`, and `UPDATE, DELETE` on the audit-log table, from `popcorn_app`. Assert this in an integration test.
  - Same class as I1: `APP_DB_PASSWORD` stays in the postgres container environment (`compose.yaml:16`) and appears in psql argv during init (`:12`). This is development only; Phase 5 should use Docker secrets or `_FILE` variables.
- **N11 — Matcher residual (`src/proxy.ts:12`).**
  - Verified with Next's compiler: a page whose last segment ends in one of the 16 listed extensions skips the proxy, for example `/fa/blog/notes.js` or `/fa/x.map`. AC12 ("every page path") overstates slightly.
  - Fix: Phase 3 CMS slug validation must reject a trailing static-file extension. The proxy must never become an authorisation gate.
- **N12 — ADR 0014:99-101 overstates mirror protection.**
  - `minimumReleaseAge` trusts the publish `time` that the (possibly poisoned) mirror serves. For new resolutions, the `integrity` hash also comes from that mirror. Only packages already locked are protected, by `sha512` plus `--frozen-lockfile`.
  - Fix: correct the ADR. Allow only a pull-through mirror of `registry.npmjs.org`. Review `resolution`/`integrity` changes in lockfile diffs. Resolve updates on GitHub-hosted runners against the public registry.
- **N13 — Governance records.**
  - `foundation-round-1-response.md:6-7` says round-1's "Medium and Low findings were fixed". In fact L1 is deferred, L6 and L8 are partial, and several Info items are open.
  - The register's deferred-controls table (`risk-register.md:20-25`) lacks the Phase 5 carry-forwards: the migration role (L6), the Redis ACL and conf file (I1), SeaweedFS internal authentication and a scoped identity (I2), Nginx `Host` pinning (I5), and artifact hygiene (I8/N6). It also lacks the N1/N2 toolchain-tracking rule.
  - The vendored fonts are byte-identical to `@fontsource/vazirmatn@5.3.0` (SHA-256 `e31830d3…`, `aa79f941…`, `a650d62e…`, `a1d13d1c…`; licence identical). But no source or hash is recorded in the repository, so a future swap cannot be verified.
  - Fix: correct the response note, add the register rows, and add a `files/SOURCES.md` with package, version and SHA-256.

## Verified controls (no finding)

- **Headers:** they still apply to `/:path*` (`next.config.ts:39`). The production CSP has no `unsafe-eval`. COOP and CORP are `same-origin`. `X-Powered-By` is off.
- **CI hygiene:**
  - Top-level `permissions: contents: read`; no job overrides it.
  - No `pull_request_target`.
  - `github.event.before` reaches the shell only through `env` (`ci.yml:36-37`); there is no `${{ }}` in `run:`.
  - `--frozen-lockfile` everywhere.
  - Semgrep runs with `--metrics=off --error`.
  - gitleaks scans full history with `--redact`.
  - The negated wrong-password step fails correctly if `psql` succeeds, because it is the last command, and the following step proves the network path works.
- **Postgres role script:**
  - Fails closed: `set -eu` and `ON_ERROR_STOP=1`.
  - The role name is quoted as an identifier and the password as a literal.
  - `ALTER DEFAULT PRIVILEGES` (no `FOR ROLE`) applies to objects created by `POSTGRES_USER`, which is the role `MIGRATION_DATABASE_URL` uses. The grants therefore line up.
- **Lint as a security control:**
  - `noInlineConfig` (`eslint.config.mjs:105`) stops silent rule disabling.
  - Boundaries resolve to files, so a relative import cannot bypass them.
  - Semgrep `p/react` covers `dangerouslySetInnerHTML`; `src/` has no sinks today.
- **Scripts:** `scripts/check-raw-colors.ts` and `scripts/lighthouse-summary.ts` only read local files and write to stdout. `tests/commitlint.test.ts` spawns a fixed binary with no shell. There is no injection surface.
- **Secrets:**
  - `.env*` is ignored except `.env.example`, which holds placeholders only.
  - A history grep for key and token patterns found nothing.
  - GitHub secret scanning and push protection are enabled.
- **Dependencies:**
  - `onlyBuiltDependencies: []`, with every known builder listed explicitly as ignored (`package.json:57-62`).
  - `next` 16.4.3 is the latest 16.x. The advisory API returns nothing for `next`, `next-intl`, `react` or `react-dom` at their pinned versions.

## Carry-forward checklist

- **Before merge (recommended; all cheap):** N1 (`.nvmrc` → 22.23.4), N2 (`packageManager` → pnpm ≥ 10.34.5), N3 (ruleset on `main`), N4 (production audit step with no exceptions).
- **Phase 1:** N6 decision before any licensed font enters Git.
- **Phase 2:**
  - Nonce CSP covering `/t/*` (L1).
  - Revoke DELETE/UPDATE on protected tables (N10).
  - Artifact hygiene for logged-in E2E (I8, N6).
  - Re-assess R-003 when `zod` is added (N4).
- **Phase 3:** CMS slug validation (N11).
- **Phase 5:**
  - Non-superuser migration role (L6).
  - Redis ACL and conf file (I1).
  - SeaweedFS internal authentication and scoped identity (I2).
  - Nginx `Host` pinning (I5).
  - HSTS domain inventory (I4).
  - Node base image pinned by digest (N1).
  - All of the above recorded in the risk register (N13).
