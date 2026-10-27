# Security review — Phase 0 / platform foundation

- Reviewer: security-reviewer (fresh session)
- Date: 2026-10-26
- Scope: `git diff b681347..HEAD` on `chore/phase-0-foundation` (HEAD `d6d7799`): `next.config.ts`, `src/proxy.ts`, i18n + hello page, `compose.yaml`, `.env.example`, `.gitignore`, `.npmrc`, `.github/workflows/ci.yml`, Husky hooks, `package.json` / `pnpm-lock.yaml`
- Standard: OWASP ASVS 5.0.0, Level 2 (only the parts that apply to what exists)
- Context read: `CLAUDE.md`, `docs/project-plan.md` §7, `docs/stories/platform-foundation.md` (nonce CSP is out of scope until Phase 2), ADR 0008, ADR 0013, ADR 0014
- Method: read-only. I read the code and config. I ran `pnpm audit` and `pnpm audit --prod`, and rendered `docker compose config` with throwaway env values. I checked the matcher regex and the next-intl redirect logic in memory. I inspected the existing `.next/routes-manifest.json` and prerendered HTML (I did not rebuild), and resolved action tags with `git ls-remote`. I did not build, run E2E, or start containers.

**Gate verdict: Pass** — 0 Critical · 0 High · 2 Medium · 8 Low · 8 Info

## Findings

| ID  | Severity | Location                                                        | Title                                                                                    |
| --- | -------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| M1  | Medium   | `package.json:37`, `pnpm-lock.yaml`, `.github/workflows/ci.yml` | Known High advisories in dev-only `@lhci/cli` tree; no audit gate or documented decision |
| M2  | Medium   | `.github/workflows/ci.yml:22,25,26,42,54-56,64,72,84`           | GitHub Actions pinned by mutable major tag (incl. third-party `pnpm/action-setup`)       |
| L1  | Low      | `next.config.ts:13`                                             | CSP `script-src 'unsafe-inline'` (accepted deferral to Phase 2)                          |
| L2  | Low      | `next.config.ts:19`                                             | CSP `base-uri 'self'` instead of `'none'`                                                |
| L3  | Low      | `e2e/hello.spec.ts:41-48`, `.github/workflows/ci.yml:88-91`     | Security-header and service-auth assertions do not cover AC7 / AC10 claims               |
| L4  | Low      | `src/proxy.ts:9`                                                | Proxy matcher excludes more paths than intended (`api*`, any path with a dot)            |
| L5  | Low      | `.github/workflows/ci.yml:22,54,84`                             | `actions/checkout` persists the job token in `.git/config`                               |
| L6  | Low      | `.env.example:18`, `compose.yaml:11`                            | App `DATABASE_URL` uses the Postgres superuser                                           |
| L7  | Low      | `compose.yaml:7,25,49`                                          | Images pinned by tag, not digest; `postgres:17.6` is behind later security releases      |
| L8  | Low      | repo-wide                                                       | No automated dependency updates, secret scanning or release-age guard                    |
| I1  | Info     | `compose.yaml:27-33,40,45`                                      | Redis password in process argv / healthcheck argv                                        |
| I2  | Info     | `compose.yaml:48-56`                                            | SeaweedFS internal APIs unauthenticated on the compose network; single admin identity    |
| I3  | Info     | `next.config.ts:24-31`                                          | Optional hardening headers not set (COOP/CORP, CSP reporting, wider Permissions-Policy)  |
| I4  | Info     | `next.config.ts:30`                                             | HSTS `includeSubDomains` needs a domain inventory before go-live                         |
| I5  | Info     | `src/proxy.ts`                                                  | Open-redirect probe: none found; redirects use the request `Host`                        |
| I6  | Info     | `package.json:44`                                               | ESLint 9.39.5 is flagged as unsupported upstream                                         |
| I7  | Info     | `lighthouserc.json:7`                                           | Lighthouse runs Chrome with `--no-sandbox`                                               |
| I8  | Info     | `playwright.config.ts:17`, `.github/workflows/ci.yml:42-77`     | CI artifacts will hold session material once E2E logs in                                 |

### M1 — Known High advisories in the dev toolchain, with no audit gate and no documented decision (Medium)

- **Evidence:** `pnpm audit` reports 9 hits: 6 high, 1 moderate and 2 low. The 6 high hits come from 5 distinct advisories, and every one sits under the devDependency `@lhci/cli@0.15.1`:
  - `tmp` 0.0.33 / 0.1.0: GHSA-ph9p-34f9-6g65 (high) and GHSA-52f5-9888-hmc6 (low).
  - `extract-zip` 2.0.1: GHSA-jmr9-qjv8-65gv and GHSA-7pqw-9j4j-h8q3 (high, no patched release).
  - `basic-ftp` 5.3.1: GHSA-c475-qrg2-pj4r (high).
  - `zod` 3.25.76 via `chromium-bidi`: GHSA-mrhx-c7xc-m3w5 (high).
  - `uuid` 8.3.2: GHSA-w5hq-g745-h8pq (moderate).
- **Production exposure:** none. `pnpm audit --prod` returns **No known vulnerabilities found**. The direct `zod@4.6.7` is already patched (≥ 4.6.6).
- **Exploitability is low.** None of these code paths gets attacker-controlled input:
  - `extract-zip` only runs when Puppeteer downloads a browser.
  - `basic-ftp` only runs for `ftp://` PAC URLs.
  - `tmp` only matters if an attacker controls the prefix or postfix.
  - `chromium-bidi` only parses messages from the local browser.

  The impact would be limited to a CI runner holding a `contents: read` token.

- **Why it is still Medium:**
  - CI has no `pnpm audit` step, so the next advisory in a runtime dependency would merge silently.
  - Nothing records why these advisories are accepted, or until when.
  - ASVS 5.0 V15.1.1 (documented remediation time frames) and V15.2.1 (components within those time frames) are therefore not met.
- **Fix:**
  1. Add a blocking CI step: `pnpm audit --prod --audit-level=high`. Add a scheduled, non-blocking full `pnpm audit`.
  2. Try `pnpm.overrides` where `pnpm lhci` still passes: `tmp` → `^0.2.6`, `uuid` → `^11.1.1`, `basic-ftp` → `^6.2.1`. Each override crosses a major version of a transitive dependency, so verify each one.
  3. `extract-zip` has no fix, and `chromium-bidi` needs zod 3. Record a time-boxed risk acceptance for them, for example in `docs/security/exceptions.md` or a short ADR, with the reachability argument above and a review date.

### M2 — Actions pinned by mutable tag (Medium)

- **Evidence:** `ci.yml` pins every action to a moving major tag:
  - `actions/checkout@v7` (`ci.yml:22,54,84`)
  - `pnpm/action-setup@v6` (`:25,55`)
  - `actions/setup-node@v7` (`:26,56`)
  - `actions/upload-artifact@v7` (`:42,64,72`)

  `pnpm/action-setup` is a third-party action and supplies the package-manager binary that installs and builds everything. If someone retags it, as in the March 2025 `tj-actions/changed-files` compromise, the workflow runs that code without any change in this repo.

- **Current impact is bounded:**
  - Top-level `permissions: contents: read`.
  - No repository secrets are used.
  - No deploy job yet.

  This becomes High once Phase 5 adds a deploy job with secrets.

- **Fix:** pin each action to a full commit SHA with a version comment, and let Dependabot or Renovate bump them (see L8). On 2026-10-26 the major tags resolve as follows. Pin to the specific release commit and verify it on each release page:
  - `actions/checkout` v7: `3d3c42e5aac5ba805825da76410c181273ba90b1`
  - `actions/setup-node` v7: `949feb2413d6458794dcd2491c4babbbce0c15c1`
  - `actions/upload-artifact` v7: `cf430e030ddbb5b0abf93d22962f4752f3646cd9`
  - `pnpm/action-setup` v6: commit `0977fd99725f1db4007ccb2928dbb4e90d06cc86`

### L1 — CSP allows inline scripts (Low; accepted deferral)

- **Evidence:** `next.config.ts:13` sets `script-src 'self' 'unsafe-inline'`. The prerendered `/fa` HTML has inline bootstrap scripts (`<script id="_R_">` and flight data), so the policy cannot block injected inline script. ASVS 5.0 V3.4.3 (L2) is therefore not met yet.
- **Why it is only Low now:**
  - The story moves nonce CSP to Phase 2.
  - No untrusted data is rendered.
  - There are no `dangerouslySetInnerHTML` or other sinks in `src/`.
- **Condition:** this must be closed before any staff-, CMS- or customer-supplied content is rendered. That covers Phase 2 admin and Phase 3 CMS, and Phase 8 Tiptap at the latest. If Phase 2 closes without it, it becomes High.
- **Phase 2 note:** a nonce generated in `src/proxy.ts` will **not** reach routes excluded by the matcher (see L4). That includes the public HTML page `/t/[qrToken]`. Either include `/t/` in nonce generation, or keep the static `next.config.ts` policy as a guaranteed baseline on every route. Nonce CSP also requires dynamic rendering of the pages that use it.
- **Fix:** deliver the nonce-based `script-src 'self' 'nonce-…' 'strict-dynamic'` in Phase 2 as planned. Keep `object-src 'none'`.

### L2 — `base-uri 'self'` (Low)

- **Evidence:** `next.config.ts:19`. ASVS 5.0 V3.4.3 sets `object-src 'none'` and `base-uri 'none'` as the minimum global policy. Next.js does not use `<base>`.
- **Fix:** change it to `"base-uri 'none'"`.

### L3 — Security assertions do not cover what AC7 and AC10 claim (Low)

- **AC7 evidence:** AC7 says responses carry CSP, XFO, `nosniff`, **HSTS** and no `X-Powered-By`. `e2e/hello.spec.ts:41-48` never asserts HSTS. It also misses:
  - `Referrer-Policy` and `Permissions-Policy`.
  - The security-relevant CSP directives: it only checks `frame-ancestors`.

  A regression that drops HSTS, adds `'unsafe-eval'` in production or removes `object-src 'none'` would pass CI.

- **AC10 evidence:** AC10 says all services are password-protected. The CI `services` job (`ci.yml:88-91`) only proves that S3 rejects anonymous access. It does not check Redis or Postgres.
- **Fix for the E2E test:** assert `strict-transport-security` contains `max-age=63072000` and `includeSubDomains`. Assert the CSP contains `object-src 'none'` and the `base-uri` value. Assert it does not contain `'unsafe-eval'` (E2E runs against `next start`). Assert `referrer-policy` and `permissions-policy`.
- **Fix for the `services` job:** add `docker compose exec -T redis redis-cli ping | grep -q NOAUTH`. Add a Postgres TCP password check, for example `PGPASSWORD=wrong psql -h 127.0.0.1 -U popcorn -c 'select 1'` must fail.

### L4 — Proxy matcher exclusions are broader than the comment says (Low)

- **Evidence:** `src/proxy.ts:9`: `/((?!api|_next|_vercel|t/|.*\\..*).*)`. In memory, these paths **skip** the proxy:
  - `/apiary` and `/api-docs`: `api` has no trailing `/`.
  - `/fa/menu/em.cafe`, `/fa/blog/v1.2-release` and `/fa/admin/users.json`: any path containing a dot.

  These paths **run** it: `/t` (no slash), `/tables` and `/fa/api`.

- **Impact today:** none, because the proxy only does locale routing and `CLAUDE.md` puts authorization in the service layer.
- **Why it matters later:** the over-broad exclusion is a trap for Phase 2. Anything gated in the proxy, such as an `/admin` login redirect, the CSP nonce (L1) or rate limiting, would silently not apply to dotted or `api*` paths.
- **Fix:**
  - Tighten the matcher to `'/((?!api/|_next/|_vercel/|t/|[^/]+\\.[a-z0-9]+$).*)'`, or equivalent, so that only real file extensions on the last segment are skipped. Add matcher unit tests for the cases above.
  - In Phase 2, keep the proxy out of the authorization path. `requirePermission()` in services stays the only gate.

### L5 — Checkout persists credentials (Low)

- **Evidence:** `ci.yml:22,54,84` use `actions/checkout` defaults. The job's `GITHUB_TOKEN` is written into `.git/config` and stays readable by every later step, including `next build`, Playwright, LHCI and the dependency code they load. The token is read-only, and the artifact paths (`coverage/`, `playwright-report/`, `.lighthouseci/`) do not include `.git`, so exposure is small.
- **Fix:** add `persist-credentials: false` to all three checkouts. `fetch-depth: 0` already fetches `origin/main` at checkout time, so commitlint does not need the stored token.

### L6 — App connects as the Postgres superuser (Low; fix before the app connects in Phase 2)

- **Evidence:** `compose.yaml:11` `POSTGRES_USER` creates a **superuser**, and `.env.example:18` points the application's `DATABASE_URL` at that same account. This conflicts with ASVS 5.0 V13.2.2 (backend accounts with least privilege). An SQL injection or compromised dependency in the app would get superuser rights, including `COPY … PROGRAM`.
- **Fix:**
  1. Add a role-creation script in `docker/postgres/init/` that creates a non-superuser `popcorn_app`. Grant it DML on the app schema only.
  2. Add a separate migration role.
  3. Point `DATABASE_URL` at `popcorn_app`. Keep the superuser for bootstrap only.
  4. Mirror this in the Phase 5 production compose.

### L7 — Container images by tag; Postgres image is stale (Low)

- **Pinning evidence:** `compose.yaml:7` `postgres:17.6-alpine`, `:25` `redis:7.4-alpine`, `:49` `chrislusf/seaweedfs:4.51` are all tags, not digests. The locally cached `seaweedfs:4.51` image is dated 2026-10-26 and `redis:7.4-alpine` resolves to 7.4.12 built today, which shows the tags move.
- **Staleness evidence:** the `postgres:17.6-alpine` image was built 2025-10-15. 17.6 (Aug 2025) predates later 17.x security releases, for example 17.7 (Nov 2025: CVE-2025-12817, CVE-2025-12818).
- **Impact:** local development only, bound to loopback.
- **Fix:**
  - Pin the images as `image: postgres:17.x-alpine@sha256:…`, using the current 17.x patch.
  - Let Renovate or Dependabot (`docker` ecosystem) bump them.
  - Decide on one strategy for all three images: digest plus bot.

### L8 — No automated updates, secret scanning or release-age guard (Low)

- **Evidence:**
  - There is no `.github/dependabot.yml` or Renovate config for `npm`, `github-actions` or `docker`.
  - There is no secret scanning in pre-commit or CI (for example gitleaks).
  - There is no `minimumReleaseAge` guard against freshly published malicious package versions. Exact pins plus `--frozen-lockfile` help, but each explicit upgrade still trusts whatever version is newest that day.
- **Fix:**
  1. Add Dependabot or Renovate for the three ecosystems.
  2. Add a gitleaks step to the `quality` job, and optionally to `.husky/pre-commit`.
  3. In pnpm settings, set `minimumReleaseAge` (for example 1440 minutes) and `strictDepBuilds: true`.
  4. Enable GitHub secret scanning, push protection and branch protection on `main`. These are repository settings and cannot be verified from the tree.

### Informational

- **I1 — Redis password in argv (`compose.yaml:27-33,40,45`).** `--requirepass <secret>` appears in the container `Cmd` (`docker inspect`). The healthcheck passes `-a "$REDIS_PASSWORD"` on the command line. This is acceptable for local development. For Phase 5, use a mounted `redis.conf` or ACL file and `REDISCLI_AUTH` for the healthcheck. Use a dedicated ACL user without `CONFIG`, `DEBUG` or `MODULE`.
- **I2 — SeaweedFS `weed mini` (`compose.yaml:48-56`).** The image exposes 8080 (volume), 8888 (filer), 9333 (master), the 18xxx gRPC ports and 7333. Only 8333 (the S3 gateway) is published, on loopback, and only the S3 gateway enforces credentials. Unless JWT signing is configured in `security.toml`, filer and volume HTTP are open to anything on the compose network. The app will also use the single admin S3 identity. For Phase 5 production storage (ADR 0013 revisit): enable JWT signing, or network-isolate the internal ports. Use a bucket-scoped identity for the app. Keep résumés private behind presigned URLs, as plan §7 requires.
- **I3 — Optional headers (`next.config.ts:24-31`).** Consider:
  - `Cross-Origin-Opener-Policy: same-origin` (ASVS L3 V3.4.8).
  - `Cross-Origin-Resource-Policy: same-origin`.
  - CSP `report-to` pointing at GlitchTip when it exists (L3).
  - A wider `Permissions-Policy`, for example `payment=(), usb=(), browsing-topics=()`.

  Note that the Phase 6 SEP flow will need the SEP origin in `form-action`.

- **I4 — HSTS (`next.config.ts:30`).** `max-age=63072000; includeSubDomains` meets V3.4.1 (L2 needs subdomains). Before go-live, confirm that every subdomain of the production domain serves HTTPS. Keep `preload` off until then. Browsers ignore HSTS over plain HTTP, so local development is unaffected.
- **I5 — Redirects (`src/proxy.ts`).** I exercised the next-intl middleware in memory with `/`, `/de`, `/FA`, `/%2F%2Fevil.com`, `/%5Cevil.com`, `/%09/evil.com` and `/xx//evil.com`. Every redirect stays on the request origin. Next.js normalizes `//` and `\` with a 308 before the proxy runs (`next/dist/server/base-server.js:575-578`), so protocol-relative paths never reach it. Next 16.4.3 is not affected by the CVE-2025-29927 middleware bypass. The redirect `Location` is built from the request `Host`, so Phase 5 Nginx must use a fixed `server_name` and a catch-all `default_server` that rejects unknown hosts.
- **I6 — ESLint 9.39.5** is marked "no longer supported" in `pnpm-lock.yaml`. It is dev-only, and the choice is documented with a revisit trigger in ADR 0014. Track it under that trigger.
- **I7 — `--no-sandbox` (`lighthouserc.json:7`).** This is acceptable only because LHCI loads the project's own `localhost` build. Never point LHCI at third-party URLs with this flag.
- **I8 — Artifacts (`playwright.config.ts:17` `trace: 'retain-on-failure'`; `ci.yml:42-77`).** There are no secrets today. Once E2E logs in (Phase 2), traces and reports will contain session cookies. Use throwaway test accounts, and keep artifact retention short and repository visibility private.

## Verified controls (no finding)

### Headers

- All headers apply to `/:path*`. That covers `/t/*`, `/api/*`, static assets and error pages.
- `poweredByHeader: false` means no `X-Powered-By`.
- `X-Frame-Options: DENY` plus CSP `frame-ancestors 'none'` (V3.4.6).
- `nosniff` (V3.4.4).
- `Referrer-Policy: strict-origin-when-cross-origin` (V3.4.5). This means a future `/t/<token>` path never leaks cross-origin.
- `object-src 'none'` and `form-action 'self'`.
- The production CSP has **no** `'unsafe-eval'`. I confirmed this in the existing `.next/routes-manifest.json`.
- No CORS headers are set, so the default same-origin applies.

### Third-party origins

- The prerendered `/fa` page loads nothing from third-party origins.
- Fonts are self-hosted via `next/font/local`, which fits ADR 0008 and `font-src 'self'`.

### Input handling

- The locale is validated with `hasLocale` in both `layout.tsx` (`notFound()`) and `request.ts` (fallback to `fa`).
- The message loader is keyed by a typed `AppLocale`, so there is no dynamic-path import.
- There is no `dangerouslySetInnerHTML` and no user input on the hello page.
- `NextIntlClientProvider` ships no catalogue.

### Secrets

- `.env` and `.env.*` are ignored, with only `.env.example` allowed.
- No secret files are tracked or in history.
- `.env.example` uses `change-me` placeholders.
- Compose uses `${VAR:?…}`, so missing secrets fail fast.

### Compose

- The rendered config shows `host_ip: 127.0.0.1` on all three published ports.
- Postgres, Redis and S3 all require credentials.
- CI proves anonymous S3 access returns 403.
- The init SQL is mounted read-only.

### CI

- Top-level `permissions: contents: read`.
- No `pull_request_target`.
- No `${{ github.event.* }}` interpolation in `run:` (the branch name goes through `$GITHUB_REF_NAME`, quoted).
- `pnpm install --frozen-lockfile`.
- Artifacts exclude `.git`.

### Supply chain

- Every one of the 853 lockfile packages has a `sha512` integrity hash and resolves from the registry: no git or tarball sources. This also makes the README's npm-mirror advice safe.
- Exact version pins (`save-exact`).
- pnpm 10 blocks dependency build scripts (`onlyBuiltDependencies: []`).
- `server-only` is installed for later use.

### Hooks

- `.husky/commit-msg` quotes `"$1"`.
- `lint-staged` only runs ESLint and Prettier.

## ASVS 5.0 L2 applicability

| Chapter                               | Status in Phase 0                                                                                    |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| V1 Encoding & Sanitization            | Minimal: React escaping only; no untrusted data rendered                                             |
| V2 Validation & Business Logic        | Only the `[locale]` param exists, and it is validated; otherwise N/A                                 |
| V3 Web Frontend Security              | **Applicable**: headers reviewed; V3.4.3 open (L1, L2), V3.4.1/.4/.5/.6 met                          |
| V4 API & Web Service                  | N/A: no route handlers                                                                               |
| V5 File Handling                      | N/A: no uploads yet (résumé PDF rules in plan §7 apply from Phase 3)                                 |
| V6 Authentication / V7 Session        | N/A: Better Auth, Argon2id, OTP and cookies arrive in Phase 2                                        |
| V8 Authorization                      | N/A: `requirePermission()` from Phase 2; see L4 (proxy must not be an authz layer)                   |
| V9 Tokens / V10 OAuth & OIDC          | N/A                                                                                                  |
| V11 Cryptography                      | N/A: no crypto in code yet                                                                           |
| V12 Secure Communication              | Partial: HSTS set; TLS termination is Phase 5; loopback-only plaintext to dev services is acceptable |
| V13 Configuration                     | **Applicable**: secrets handling met; least-privilege DB account open (L6); no version disclosure    |
| V14 Data Protection                   | N/A: no personal data yet (log masking from Phase 2)                                                 |
| V15 Secure Coding & Architecture      | **Applicable**: dependency hygiene (M1, M2, L7, L8)                                                  |
| V16 Security Logging & Error Handling | N/A: no logging or audit-log code yet                                                                |
| V17 WebRTC                            | N/A                                                                                                  |

## Carry-forward checklist

- Phase 2:
  - Nonce CSP covering `/t/*` (L1).
  - Tighter matcher, and the proxy is not an authz gate (L4).
  - Non-superuser DB role (L6).
  - Header-assertion tests (L3).
  - Test-account hygiene for E2E artifacts (I8).
- Phase 5:
  - SHA-pinned actions before any deploy job with secrets (M2).
  - Redis ACL and config file (I1).
  - SeaweedFS JWT signing and scoped identity (I2).
  - Nginx `Host` pinning (I5).
  - HSTS domain inventory (I4).
- Before merging this phase is not required by the gate. Recommended now, because each is cheap:
  - M1: audit gate plus a recorded risk acceptance.
  - M2: SHA pins.
  - L2: `base-uri 'none'`.
  - L5: `persist-credentials: false`.
