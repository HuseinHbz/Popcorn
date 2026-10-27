# Security review — Phase 0 / platform foundation, round 3

- Reviewer: security-reviewer (fresh session, round 3)
- Date: 2026-10-27
- Scope: the whole branch against `origin/main` (`chore/phase-0-foundation`, HEAD `a457aee`), focused on `git log 5403203..a457aee`:
  - toolchain pins and the CI `freshness` job (`scripts/check-node-version.ts`, `check-package-manager.ts`, `check-risk-register.ts`);
  - `strictDepBuilds` and `minimumReleaseAge`;
  - Zod environment validation (`src/shared/config/env.ts`, `src/instrumentation.ts`, `src/instrumentation-node.ts`) and `.env.example`;
  - `docker-compose.dev.yml` and `docker/postgres/init/02-app-role.sh`;
  - the CI `services` job, including the signed S3 round trip;
  - the localized 404 (`src/app/[locale]/[...rest]`, `not-found.tsx`, `layout.tsx`);
  - security headers, the purity lint rules, `.github/workflows/ci.yml`, `.github/ci-tools/compose.yaml` and `.github/dependabot.yml`;
  - ADRs 0013–0017 and `docs/security/risk-register.md`.
- Baseline: [`security-foundation-round-2.md`](security-foundation-round-2.md) (at `5403203`: Pass; 3 Medium · 4 Low · 6 Info)
- Standard: OWASP ASVS 5.0.0 Level 2, only the parts that apply to what exists
- Context read: `CLAUDE.md`, `docs/project-plan.md` §3 and §7, `docs/phases/phase-00.md`, `docs/stories/platform-foundation.md`, ADRs 0013–0017, the risk register, rounds 1 and 2.

## Method

Read-only: no tracked file was changed except this report. Probe files and containers were removed.

- Read every changed file.
- Audits:
  - `pnpm audit --audit-level=high`: 3 High, all ignored (R-001…R-003), exit 0.
  - `pnpm audit --prod`: no known vulnerabilities.
  - CI's production gate pipeline (`pnpm audit --prod --json | jq -e …`): `true`.
  - `pnpm audit --json` shows `advisories: {}` but `metadata.vulnerabilities.high: 3`, so ignored advisories still count in the metadata. The production gate therefore honours no exception.
- Advisories (npm bulk advisory API, the source `pnpm audit` uses):
  - `pnpm@10.34.9`: none. `pnpm@10.28.0`: 11 High and 12 Moderate, so the new check would have failed the old pin.
  - `next` 16.4.3, `next-intl` 4.14.9, `react`/`react-dom` 19.3.1, `zod` 4.6.7: none. Each is its package's `latest`.
- nodejs.org `dist/index.json`: 22.23.4 (2026-10-20, `security: true`) is the newest 22.x.
- `pnpm config get`: `strictDepBuilds` true, `minimumReleaseAge` 1440. In a scratch copy with `@parcel/watcher` removed from the ignore list, `pnpm install --frozen-lockfile --offline` failed with `ERR_PNPM_IGNORED_BUILDS` (exit 1).
- Built the app and ran `next start` on my own loopback ports (3995–3997):
  - invalid `DATABASE_URL` → exit 1, variable name only;
  - `APP_ENV=production` with the `.env.example` values → exit 1, three keys named;
  - 60 requests racing the start-up of an invalid-env server got no response;
  - headers and status on 15 paths.
- Called `parseEnv` directly for edge cases.
- Docker:
  - Rendered `docker compose config` with `.env.example`.
  - Docker Hub rate-limited every pull (429), so the full stack was not started locally.
  - Ran the locally cached `chrislusf/seaweedfs:4.51` (same digest, `f7a49e3f…`) with the compose command. Probed S3 authentication, the internal ports from a sibling container, and the hardening flags proposed in F2.
  - Ran `redis:7.4-alpine` with the compose start-up command.
- Unit tests: 81/81. Freshness scripts: exit 0.
- Fonts: `SHA256SUMS` 7/7 OK. Shippori Mincho and its licence are byte-identical to `@fontsource/shippori-mincho@5.3.0` from the registry.
- Lint: one probe file under `src/modules/orders/domain/`, deleted afterwards.
- GitHub API: repository settings, branch protection, rulesets, and HEAD run `40511711437` (all 6 jobs `success`).
- Read the pinned `pnpm/action-setup` source and Dependabot's docker-compose file fetcher.
- Could not run locally:
  - Semgrep: the proxy refuses `semgrep.dev` (403).
  - gitleaks: the ghcr.io blob download was refused (403).

  For these I relied on the green CI jobs and a manual history grep for key and token patterns, which found nothing.

## Gate verdict

**Pass**: 0 Critical · 0 High.

- **Round 2:**
  - N1 (Node pin), N2 (pnpm pin) and N4 (path-scoped exceptions) are fixed. N7, N8, N9 and N12 are also fixed.
  - **N3 (no branch protection on `main`) stays open as a Medium.** It is the owner's setting and is correctly recorded. But its recorded deadline is "before the first merge", and this branch is the first merge.
- **New:** 2 Low (F1, F2) and 9 Info (F3–F11).

## Status of round-2 findings

| ID  | R2 sev. | Status                              | Evidence (file:line)                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N1  | Medium  | **Fixed**                           | `.nvmrc:1` is `22.23.4`; `package.json:9` is `>=22.23.4`. nodejs.org lists 22.23.4 as the newest 22.x, and it is a security release. Tracking: `ci.yml:80-96` and `scripts/check-node-version.ts:20-27` (unit-tested). Residual: no end-of-life signal (F7).                                                                                                                                                                                       |
| N2  | Medium  | **Fixed**                           | `package.json:7` is `pnpm@10.34.9`, which has no advisory of any severity and is the `latest-10` dist-tag. Gate: `scripts/check-package-manager.ts`. The API returns 11 High for 10.28.0, so the gate would have caught the old pin. Residual: no integrity pin, and Moderates are not gated (F6).                                                                                                                                                 |
| N3  | Medium  | **Open (owner action), recorded**   | `GET …/branches/main`: `"protected": false`, `enforcement_level: "off"`. `…/rules/branches/main` and `…/rulesets` return `[]`; `…/branches/main/protection` returns 404 "Branch not protected". Recorded at `risk-register.md:32` with the owner and "before the first merge". Two gaps against the round-2 fix: the row omits "require a pull request" and "no bypass actors, including admins". The job list is now six, with `freshness` added. |
| N4  | Low     | **Fixed**                           | `ci.yml:54-55`. It fails closed: an error or empty JSON makes `jq -e` false or exit 4, and ignored advisories still count in `metadata`. The register intro states the rule (`risk-register.md:3-7`). R-003's re-assess trigger fired when `zod` became a production dependency; its text is now stale (F5).                                                                                                                                       |
| N5  | Low     | **Partially fixed**                 | Weekly `schedule` at `ci.yml:7-9`. Register expiry is machine-checked: `check-risk-register.ts:11-18` also fails on a missing or invalid date. Open: `dependabot_security_updates: disabled`. The cron and Dependabot act only from the default branch, which has no `.github/` yet (F10).                                                                                                                                                         |
| N6  | Low     | **Open (owner decision), recorded** | Still `visibility: public`. Recorded at `risk-register.md:33` with the compensating rule: no licensed assets or real data. ADR 0017 keeps Peyda out of Git, `fonts/index.ts:53-58` repeats it, and no Peyda file exists. The history grep is clean. Missing: a rule for session-bearing E2E artifacts once Phase 2 adds login (F11).                                                                                                               |
| N7  | Low     | **Fixed**                           | `package.json:12,14` use `-H 127.0.0.1`. The server reported `Network: http://127.0.0.1:3997`. `playwright.config.ts:4` and `lighthouserc.json:6` use 127.0.0.1.                                                                                                                                                                                                                                                                                   |
| N8  | Info    | **Fixed**                           | `cooldown: default-days: 3` on all four update entries (`dependabot.yml:9-10,24-25,34-35,45-46`).                                                                                                                                                                                                                                                                                                                                                  |
| N9  | Info    | **Fixed**                           | Images digest-pinned in `.github/ci-tools/compose.yaml:8,14`, mounted `:ro` (`:10,17`), and tracked by Dependabot (`dependabot.yml:40-48`). Dependabot's fetcher regex `/(docker-)?compose(-[\w]+)?(?>\.[\w-]+)?\.ya?ml/i` matches both `compose.yaml` and `docker-compose.dev.yml`. Semgrep packs are still fetched at run time; ADR 0016 records vendoring them for self-hosted CI.                                                              |
| N10 | Info    | **Tracked**                         | Revoking UPDATE/DELETE on protected tables is a Phase 2 row (`risk-register.md:29`). Passwords in container environments are not yet recorded (F11).                                                                                                                                                                                                                                                                                               |
| N11 | Info    | **Tracked**                         | `risk-register.md:30`, Phase 3. A related residual is new: F3.                                                                                                                                                                                                                                                                                                                                                                                     |
| N12 | Info    | **Fixed**                           | ADR 0016 now says `minimumReleaseAge` "only delays … it detects nothing", and limits the mirror guarantee to "a version we already locked".                                                                                                                                                                                                                                                                                                        |
| N13 | Info    | **Partially fixed**                 | Round-1 response corrected (`foundation-round-1-response.md:6-9`). `fonts/files/SHA256SUMS` added and verified. The register gained the migration-role, immutable-records, slug, object-storage, branch-protection and visibility rows. Still missing: Redis ACL and secret delivery (I1), Nginx `Host` pinning (I5), E2E artifact hygiene (I8). See F11.                                                                                          |

### Round-1 items carried through round 2

| ID  | Status                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1  | **Accepted (tracked deferral).** Still `'unsafe-inline'` at `next.config.ts:14`, recorded at `risk-register.md:26` with the Phase 2 deadline and the `/t/*` caveat. The round-1 escalation still applies: if Phase 2 closes without a nonce CSP, this becomes High.                                                                                                                                                                    |
| L6  | **Tracked.** The separate migration role is a Phase 2 row (`risk-register.md:28`), earlier than round 2 required.                                                                                                                                                                                                                                                                                                                      |
| L8  | **Mostly fixed.** `strictDepBuilds: true` (`pnpm-workspace.yaml:6`) is proven to fail the install. Open: N3 (branch protection) and Dependabot security updates (F10).                                                                                                                                                                                                                                                                 |
| I1  | **argv part fixed.** `docker-compose.dev.yml:34-40,50-52`. In the container, `ps` shows only `redis-server *:6379`, run as `redis`. `/tmp/redis.conf` is `0600 redis:redis`. `redis-cli ping` without the password answers `NOAUTH`, and a password with a space makes the server refuse to start (fails closed). Open: the password is still in the container environment (`docker inspect`), and the ACL user is not recorded (F11). |
| I2  | **Tracked** (`risk-register.md:31`, Phase 5). It understates the bypass; see F2.                                                                                                                                                                                                                                                                                                                                                       |
| I3  | **Improved.** `Permissions-Policy` now also denies `payment`, `usb` and `browsing-topics` (`next.config.ts:30-33`), asserted at `e2e/hello.spec.ts:83-85`. Revisit `payment=()` only if the Phase 4 SEP flow embeds the gateway; a redirect flow is unaffected.                                                                                                                                                                        |
| I4  | **Accepted** (`risk-register.md:27`).                                                                                                                                                                                                                                                                                                                                                                                                  |
| I5  | **Not recorded:** Nginx `server_name` / `default_server` (F11).                                                                                                                                                                                                                                                                                                                                                                        |
| I6  | **Accepted:** ADR 0014's Consequences and Revisit sections.                                                                                                                                                                                                                                                                                                                                                                            |
| I7  | Unchanged and acceptable (`lighthouserc.json:8`; localhost URLs only).                                                                                                                                                                                                                                                                                                                                                                 |
| I8  | **Open (Phase 2):** `playwright.config.ts:12` keeps traces on failure, uploaded by `ci.yml:123-128` in a public repository (F11).                                                                                                                                                                                                                                                                                                      |

## New findings

| ID  | Severity | Location                                                                               | Title                                                                                                      |
| --- | -------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| F1  | Low      | `src/shared/config/env.ts:10,29-34`; `.env.example:2,21`                               | The production placeholder guard fails open when `APP_ENV` is unset; empty credentials pass in production  |
| F2  | Low      | `docker-compose.dev.yml:58`; `docs/adr/0013-object-storage-seaweedfs.md:61-62,70`      | `weed mini` defaults: telemetry abroad, and unauthenticated filer, WebDAV and IAM that bypass S3 auth      |
| F3  | Info     | `src/proxy.ts:12`; `src/app/[locale]/(site)/page.tsx:12`; `e2e/not-found.spec.ts:4-10` | Single-segment paths that skip the proxy get an unlocalized 404 with `s-maxage=31536000`                   |
| F4  | Info     | `.env.example:5-16,30-31`                                                              | The app process loads the superuser DSN and every compose secret from the shared `.env`                    |
| F5  | Info     | `docs/security/risk-register.md:13`                                                    | R-003's mitigation text is stale now that `zod` is a production dependency                                 |
| F6  | Info     | `package.json:7`; `scripts/check-package-manager.ts:19-21`; ADR 0014:46-47,71          | The package manager has no integrity pin, CI does not install it via Corepack, and Moderates are not gated |
| F7  | Info     | `scripts/check-node-version.ts:20-27`; ADR 0014 "Revisit when"                         | No end-of-life signal for Node 22 (EOL 2027-04-30)                                                         |
| F8  | Info     | `eslint.config.mjs:53-63,138-157,173-183`                                              | Lint misses `eval` and other XSS sinks; the clock ban misses `Date()`                                      |
| F9  | Info     | `.github/workflows/ci.yml:160-181`; story AC10                                         | AC10's "wrong or missing passwords" and anonymous S3 writes are not all exercised                          |
| F10 | Info     | repository settings; `origin/main`                                                     | Scheduled CI and Dependabot are inert until merge; Dependabot security updates are disabled                |
| F11 | Info     | `docs/security/risk-register.md:24-33`                                                 | The register still lacks some Phase 2 and Phase 5 carry-forwards                                           |

### F1 — The production placeholder guard fails open when `APP_ENV` is unset (Low)

- **Evidence:**
  - `src/shared/config/env.ts:10` declares `APP_ENV: z.enum([...]).default('development')`. `placeholderProblems` (`:29-34`) returns early unless `APP_ENV === 'production'`, and it matches only the exact lower-case substring `change-me`.
  - Calling `parseEnv` directly gives these results:
    - The `.env.example` values with `APP_ENV` absent are accepted as `development`.
    - With `APP_ENV=production`, all of these are accepted: `postgres://popcorn_app@db:5432/popcorn` (no password), `redis://redis:6379` (no password), an 8-character `S3_SECRET_KEY`, and the variants `CHANGE-ME` and `change_me_please`.
  - Next.js sets `NODE_ENV=production` for every `next start`, so the deployment must set `APP_ENV` explicitly. A missing variable silently selects the permissive mode.
  - `.env.example:2` and `:21` promise that "in production the app refuses to start while any 'change-me' is left". That holds only if the operator remembered `APP_ENV`.
- **Impact:** a Phase 5 deployment that omits `APP_ENV`, or uses a hand-written env file, starts with placeholder or empty credentials. This does not meet the secure-default expectation for configuration and secrets (ASVS V13). It is Low because no production deployment exists and nothing consumes the values until Phase 2.
- **Fix:**
  1. Drop the default: `APP_ENV: z.enum(['development', 'test', 'production'])`. `.env.example:22` and CI (`ci.yml:113`, `:151`) already set it. Alternatively, default to `'production'`, so the strict mode is the one you get by omission.
  2. Normalize before matching: `value.toLowerCase().replaceAll('_', '-').includes(PLACEHOLDER)`.
  3. In production (`superRefine`), require `new URL(DATABASE_URL).password` and `new URL(REDIS_URL).password` to be non-empty, and `S3_SECRET_KEY` to have at least 32 characters.
  4. Add a unit test for each rule, and extend AC17 to cover a missing `APP_ENV`.

### F2 — `weed mini` defaults: telemetry abroad, and unauthenticated filer, WebDAV and IAM that bypass S3 authentication (Low)

- **Evidence:** I ran the pinned image (digest `f7a49e3f…`) with the compose command (`docker-compose.dev.yml:58`). Its own log says:
  - `Reporting anonymous cluster statistics to https://telemetry.seaweedfs.com/api/collect every 24h0m0s once 10 GiB are stored`;
  - `IAM gRPC service on filer is UNAUTHENTICATED: anyone who can reach this port can create users and policies`;
  - it also starts WebDAV on `0.0.0.0:7333`, an Iceberg REST catalog on `:8181` and a Lance namespace server on `:9101`.

  I wrote an object through signed S3, then read it from a sibling container on the same Docker network with no credentials, via both:
  - filer HTTP: `http://<ip>:8888/buckets/popcorn-media/ci-probe.txt`;
  - WebDAV: `http://<ip>:7333/buckets/popcorn-media/ci-probe.txt`.

  The S3 gateway itself is sound:
  - anonymous ListBuckets, ListObjects, GET, PUT, DELETE and CreateBucket each answer 403;
  - a wrong secret answers 403;
  - signed PUT and GET answer 200.

  The documentation understates this:
  - ADR 0013:61-62 lists only "master, volume and filer APIs" as unauthenticated.
  - ADR 0013:70 claims "no runtime calls abroad".
  - The register row (`risk-register.md:31`) says the internal ports are "reachable", but not that they bypass S3 authentication entirely or can mint S3 identities.

- **Impact:**
  - Development only: just port 8333 is published, on `127.0.0.1`, as verified in the rendered config.
  - Telemetry is an unplanned outbound call to a foreign service, which is the class of dependency ADR 0008 rules out.
  - The ADR's trade-off misstates the exposure for the data that matters most: private résumé PDFs (plan §7). If Phase 5 reuses `weed mini` or a default cluster, any workload on the network can read every object and create its own S3 admin.
- **Fix:**
  1. Set `command: ['mini', '-dir=/data', '-bucket=${S3_BUCKET:-popcorn-media}', '-master.telemetry=false', '-webdav=false', '-s3.port.iceberg=0', '-s3.port.lance=0']`. Verified on the same image: the telemetry line and ports 7333, 8181 and 9101 are gone; `/healthz` still answers 200 and anonymous access still 403.
  2. Correct ADR 0013:
     - at :70, remove "no runtime calls abroad" or qualify it with the flag;
     - at :61-62, name filer HTTP and WebDAV (they bypass S3 authentication) and the filer IAM gRPC (it creates identities);
     - add the Phase 5 requirement: `security.toml` JWT signing (`jwt.signing.key`, `jwt.filer_signing.key`), and filer, master and volume on a network the app cannot reach.
  3. Update `risk-register.md:31` to the same effect.

### F3 — Single-segment paths that skip the proxy get an unlocalized 404 cached for a year (Info)

- **Evidence:**
  - The matcher (`src/proxy.ts:12`) skips `/api` and any path ending in a static-file extension. `/api`, `/robots.txt` or `/x.png` therefore reach `src/app/[locale]/(site)/page.tsx` with `locale` set to that segment.
  - That route is statically generated (`layout.tsx:10-12`) with the default `dynamicParams`. Its `notFound()` (`page.tsx:12`) is rendered on demand and cached as ISR.
  - Probes of `/api`, `/zz-probe-1.png`, `/zz-probe-2.js` and `/zz-probe-3.css` each returned 404 with:
    - `Cache-Control: s-maxage=31536000`;
    - `x-nextjs-cache: HIT` on a repeat request;
    - a body of `<html id="__next_error__">`, with no `lang`, no `dir` and no `<h1>`.
  - Multi-segment unknown paths (`/t/abc`, `/api/x`, `/fa/no`, `/fa/x.js`) correctly return the localized page with `private, no-cache, no-store`. `e2e/not-found.spec.ts:4-10` tests only multi-segment paths, so AC19's "any unknown path" is overstated.
- **Impact:**
  - No confidentiality issue.
  - A Phase 5 shared cache (Nginx `proxy_cache`, a CDN) that honours `s-maxage` would keep a 404 for a year at URLs that later become real (`/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`).
  - Each unique name also takes an in-memory ISR entry, bounded by Next's LRU.
  - `x-nextjs-*` headers fingerprint the framework.
- **Fix:**
  1. Make an unknown first segment answer 404 without ISR caching, for example `export const dynamicParams = false` on the `(site)` page, or send single-segment paths to the dynamic catch-all.
  2. Add `/api` and `/robots.txt` to `e2e/not-found.spec.ts`, with a `cache-control` assertion.
  3. Phase 5 Nginx: do not cache 4xx for long (`proxy_cache_valid 404 1m`), and strip `x-nextjs-*`.
  4. Note this under the N11 register row.

### F4 — The app process loads the superuser DSN from the shared `.env` (Info)

- **Evidence:**
  - `.env.example` keeps compose secrets (`:5-16`) and the migration DSN (`:30-31`) in the same file the app uses.
  - Next.js loads every key of `.env` into `process.env`. Running `@next/env`'s `loadEnvConfig` on the repository yields `POSTGRES_PASSWORD`, `MIGRATION_DATABASE_URL`, `APP_DB_PASSWORD` and `REDIS_PASSWORD` in the server environment.
  - `.env.example:30` says "not read by the app". No code reads them, but they are in the process environment.
- **Impact:** the least-privilege `popcorn_app` role limits what the app's queries can do. But any server-side code execution or environment-disclosure bug hands over the superuser credential, which defeats the purpose of the role. Development only today.
- **Fix:**
  - When migrations arrive (Phase 2): keep compose and migration variables out of the file Next loads. For example, use `docker/.env.compose` through `env_file:` or `--env-file`, and a migration-only file read by the migrate script.
  - Phase 5: per-service environments or Docker secrets.
  - Add a register row.

### F5 — R-003's mitigation text is stale (Info)

- **Evidence:** `risk-register.md:13` says "The app has no direct `zod` dependency yet." But `package.json:31` has `zod` 4.6.7 in `dependencies` (commit `f75c7c2`). Round 2's trigger "re-assess R-003 when `zod` is added" has fired.
- **Assessment:** there is no exposure:
  - 4.6.7 is at or above the fixed 4.6.6;
  - the vulnerable 3.25.76 is reachable only through `@lhci/cli`;
  - the no-exception production gate (`ci.yml:54-55`) fails if any High reaches production.
- **Fix:** rewrite the mitigation: "The app's direct `zod` is 4.6.7 (patched). The production audit gate honours no exception, so it fails if a vulnerable `zod` reaches production dependencies."

### F6 — Package-manager integrity and gate scope (Info)

- **Evidence:**
  - `package.json:7` is `pnpm@10.34.9` with no `+sha512.…` suffix.
  - CI does not use Corepack. The pinned `pnpm/action-setup` (`ci.yml:33,106`) bootstraps pnpm from its own committed lockfile, then runs `pnpm self-update <version>` after stripping any `+hash` (`src/install-pnpm/run.ts` at `0977fd9`). It runs with its working directory outside the repository, so the target binary is trusted from registry metadata and the repository's `minimumReleaseAge` does not apply.
  - ADR 0014:46-47 and :71 say pnpm is "installed via Corepack".
  - `check-package-manager.ts:19-21` blocks only High and Critical. Round 2 showed that Moderate lockfile-integrity bypasses (GHSA-q6j5-fjx5-2mc3, GHSA-54hh-g5mx-jqcp) undermine this repository's own controls. 10.34.9 has none today.
- **Fix:**
  1. Run `corepack use pnpm@10.34.9` to record the hash, so Corepack verifies it on developer machines.
  2. Correct ADR 0014 to describe the CI path.
  3. Consider failing on Moderate for the package manager alone. It is one package, and its integrity-class advisories disable other controls.

### F7 — No end-of-life signal for Node 22 (Info)

- **Evidence:**
  - Node 22 ("Jod") reaches end of life on 2027-04-30.
  - `check-node-version.ts:20-27` reports only newer security releases in the pinned major line. After end of life there are none, so the check passes forever.
  - ADR 0014's "Revisit when" has no end-of-life trigger.
- **Impact:** the Phase 5 production image is likely to ship close to that date.
- **Fix:** add an end-of-life check, for example: read nodejs/Release `schedule.json` and fail within 90 days of `end`. Alternatively, add an ADR 0014 revisit trigger and a register row: "move to Node 24 LTS before 2027-02-01".

### F8 — Lint misses `eval` and other XSS sinks; the clock ban misses `Date()` (Info)

- **Evidence:**
  - `eslint --print-config` shows `no-eval`, `react/no-danger` and `react/jsx-no-script-url` unset.
  - A probe file in `src/modules/orders/domain/` (deleted) produced no error for `eval(s)`, `Date()`, `Intl.DateTimeFormat().resolvedOptions().timeZone` or `queueMicrotask(cb)`.
  - The same probe did catch `Function('…')()` (`@typescript-eslint/no-implied-eval`) and `import('node:fs')` (boundaries).
  - Relevant config: `eslint.config.mjs:53-63` (pure syntax), `:138-157` (impure globals), `:173-183` (rules).
- **Impact:**
  - The only gate on `eval` and `dangerouslySetInnerHTML` is Semgrep. It runs in CI only, and its rule packs come from semgrep.dev; ADR 0016 notes they must be replaced for Iran-hosted CI, and they were unreachable from this network.
  - The purity gaps are a correctness issue, not a security one.
- **Fix:**
  - Add `'no-eval': 'error'`, `'react/no-danger': 'error'` and `'react/jsx-no-script-url': 'error'` project-wide.
  - Add `CallExpression[callee.name='Date']` to `PURE_SYNTAX`.
  - Give each rule a fixture in `tests/lint-rules.test.ts`.

### F9 — Not every AC10 case is exercised (Info)

- **Evidence:** the `services` job (`ci.yml:160-181`) tests a wrong Postgres password, a missing Redis password, and anonymous S3 reads. It does not test a missing Postgres password, a wrong Redis password, or an anonymous S3 PUT. AC10 claims "wrong or missing passwords".
- I verified locally that an anonymous PUT and a wrong-secret request each answer 403, and that a wrong Redis password is the same code path as a missing one.
- **Fix:** add three one-line steps:
  - `! … psql -h postgres -U popcorn_app -w …` (no password);
  - `redis-cli -a wrong ping | grep -q WRONGPASS`;
  - an anonymous `curl -X PUT` that must answer 403.

### F10 — Scheduled CI and Dependabot are inert until merge (Info)

- **Evidence:**
  - `origin/main` has no `.github/` and no `package.json`.
  - GitHub runs `schedule` workflows and Dependabot only from the default branch, so the weekly freshness run and every Dependabot update start only after this branch merges.
  - The repository API shows `dependabot_security_updates: disabled`.
- **Assessment:** expected for a first merge.
- **Fix:** after the merge, confirm one scheduled run and the first Dependabot PRs. Enable Dependabot alerts and security updates.

### F11 — The register still lacks some carry-forwards (Info)

- **Missing rows:**
  - **Secret delivery (I1, N10):** `REDISCLI_AUTH`, `APP_DB_PASSWORD` and `POSTGRES_PASSWORD` are in container environments, visible in `docker inspect`. Phase 5: Docker secrets or `_FILE` variables, and a Redis ACL user for the app.
  - **Nginx:** `server_name` and `default_server` must pin `Host` (I5).
  - **E2E artifacts:** session-bearing artifacts once Phase 2 adds login (I8, N6). Use test-only accounts, or no traces on authenticated specs, and 1–3 day retention.
  - **Env split:** F4.
  - **SeaweedFS JWT signing and network isolation:** F2.
- **N3 row (`:32`):** add "require a pull request" and "no bypass actors, including admins". List the six check names:
  - `Commit messages · dependency audit`
  - `Secret scan (gitleaks)`
  - `Static analysis (Semgrep)`
  - `Supply-chain freshness`
  - `Verify (lint · format · typecheck · tests · build) · E2E (axe) · Lighthouse`
  - `Docker Compose services`

## Verified controls (no finding)

- **Environment validation:**
  - Errors carry only variable names and Zod issue codes (`env.ts:41`, `:33`). `instrumentation-node.ts:12-13` prints the message and exits 1.
  - Unit test `env.test.ts` "never echoes variable values".
  - On a real server, `DATABASE_URL=mysql://u:leaked-secret-xyz@…` exited 1, printed `DATABASE_URL: invalid_format`, and the output had 0 occurrences of the secret.
  - No request was answered before the exit. Next awaits `register()` (`instrumentation.ts:6-10`) before it serves.
  - The Node-only check sits behind `NEXT_RUNTIME`. `src/` reads no other `process.env` and has no `NEXT_PUBLIC_*` variable.
- **Compose:**
  - All three published ports bind to `127.0.0.1` in the rendered config, and CI asserts it (`ci.yml:153-154`).
  - Secrets are required through `:?`.
  - `02-app-role.sh` fails closed (`set -eu`, `ON_ERROR_STOP=1`) and quotes the role name (`:"…"`) and password (`:'…'`).
  - The S3 bucket name reaches `weed` as a single exec-form argument, so a crafted value cannot inject a flag.
- **CI:**
  - Top-level `contents: read`; no job overrides it, and there is no `pull_request_target`.
  - Action SHAs are unchanged from round 2 and reused by the new job. All six checkouts set `persist-credentials: false`.
  - The only `${{ }}` reaching a script is `github.event.before`, passed via `env` (`ci.yml:40-41`).
  - The S3 step sources the job's own copy of `.env.example`, so its credentials are placeholders.
  - The freshness scripts call fixed HTTPS hosts and fail closed on a non-2xx response, an invalid review date or a malformed `packageManager`.
  - HEAD run `40511711437`: all six jobs `success`.
- **Headers:** unchanged apart from the Permissions-Policy addition. They are present on 200, 307 and 404 responses, including `/t/*`, `/api/*` and `/_next/*`. Production has no `unsafe-eval`, and `X-Powered-By` is absent.
- **Localized 404:**
  - The arbitrary first segment is validated with `hasLocale` before it is used for `lang`/`dir` (`layout.tsx:23`) or to pick a message catalogue (`request.ts:11`, a fixed `Record` lookup).
  - The 404 page reflects nothing from the URL.
  - Future static `api` and `t` routes take precedence over the dynamic `[locale]` segment.
- **Supply chain:**
  - `strictDepBuilds` is proven to fail the install, and `minimumReleaseAge` is effective.
  - The only lockfile change since round 2 is `zod` 4.6.7.
  - The vendored fonts match the recorded checksums and the upstream packages.
- **Secrets:**
  - A history grep for key, token and private-key patterns found nothing.
  - GitHub secret scanning and push protection are enabled.
  - `.env*` is ignored except `.env.example`.

## Carry-forward checklist

- **Before merge:**
  - N3: the owner enables a ruleset on `main` that requires a PR and the six checks, blocks force-push and deletion, and has no bypass actors. Confirm it with the API before merging.
  - F1 and F2: cheap.
  - F5: register text.
- **Phase 1:** N6 decision before any Peyda file exists.
- **Phase 2:**
  - Nonce CSP covering `/t/*` (L1).
  - Migration role (L6).
  - Immutable-records revokes (N10).
  - Env split (F4).
  - Fix and test the single-segment 404s (F3).
  - Security lint rules (F8).
  - E2E artifact hygiene (I8).
- **Phase 3:** CMS slug validation (N11).
- **Phase 5:**
  - SeaweedFS JWT signing and network isolation (F2).
  - Redis ACL and secret delivery (I1).
  - Nginx `Host` pinning and 4xx cache policy (I5, F3).
  - HSTS domain inventory (I4).
  - Node base image by digest, and a Node 24 plan (N1, F7).
  - All of the above in the register (F11).

## Note on the review environment

Another session was running Lighthouse CI from this same checkout while this review rebuilt `.next` (`pnpm build` at HEAD, about 13:27 UTC). The code was identical, but a server started before a rebuild can serve mismatched chunks. If that session's local Lighthouse numbers from around then look anomalous, re-run them. The HEAD CI run is the authoritative measurement.
