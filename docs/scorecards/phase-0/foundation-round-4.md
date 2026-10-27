# Scorecard — Phase 0 / Platform foundation (round 4)

- Reviewer: code-reviewer (fresh session, round 4; did not write this code)
- Date: 2026-10-27
- Verdict: **Changes requested — 97.5 / 100** (gate ≥ 98)
- Scope: the whole branch against `origin/main` (merge base `b681347`, HEAD `26e1971`, 79 non-merge
  commits), focused on `git log a457aee..26e1971`: 21 fix commits (`a5e5e6c`…`f6eb43b`) and 4
  documentation commits (round-3 scorecards, response, ADR scores, CHANGELOG). `.claude/commands/*`
  and `docs/phases/*` belong to the maintainer and were read, not scored.
- Inputs read: `CLAUDE.md`, `docs/project-plan.md` §3 and §8, `docs/phases/phase-00.md`,
  `.claude/commands/review.md`, `docs/stories/platform-foundation.md`, ADRs 0013–0018,
  `docs/security/risk-register.md`, `foundation-round-3.md`, `foundation-round-3-response.md`,
  `security-foundation-round-3.md`. `security-foundation-round-4.md` was read only for its gate verdict
  and findings table, after this reviewer's own findings were collected; the one item used from it
  (G2) was re-measured below. Every round-3 fix claim and every measurement quoted in a commit body
  was checked here, not taken on the author's word.

## Evidence collected by this reviewer at `26e1971`

| Check                                       | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Environment                                 | Own clone. `cp .env.example .env` (gitignored, not committed). `pnpm install --frozen-lockfile --offline`: up to date. Local Node 22.22.0 is below `engines >=22.23.4`; pnpm only warns (ADR 0014).                                                                                                                                                                                                                                                                                                                                            |
| `pnpm verify`                               | **exit 0**: `next typegen` + ESLint (`--max-warnings=0`) + CSS colour check, Prettier, `tsc`, Vitest 17 files / 140 tests, coverage 100 % (statements 59/59, branches 21/21, functions 17/17, lines 52/52), `next build` (`/fa`, `/en` SSG; `/[locale]/[...rest]` dynamic; experiment `globalNotFound` on).                                                                                                                                                                                                                                    |
| `CI=1 PORT=3500 pnpm e2e`                   | **57 passed, 1 skipped** (env validation runs on the desktop project only).                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| GitHub CI run 40559602653 (`26e1971`, push) | **6/6 jobs success**, attempt 1; the LHCI step passed under the new `median` assertion. Artifacts `lighthouse` 3.07 MB, `coverage` 126 KB. Logs and artifacts are served from a blob host this reviewer's proxy refuses, so the CI medians themselves were not read. Earlier runs: `a1f23d0` (40558086136) gitleaks **failure** as stated, LHCI step success; `f6eb43b` (40558658603) cancelled by the next push before E2E/LHCI ran.                                                                                                          |
| LHCI aggregation (P2)                       | `@lhci/utils` 0.15.1 `src/assertions.js:56-61`: `"median"` takes the true median of all runs. The fix does what it says.                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm lhci` sample 1 (Chromium 1243)        | `/fa` **93** (77–97) ✘, `/en` 95 (90–96). LHCI exited 1 on `/fa`. a11y/BP/SEO 100. The host is noisy (Lighthouse benchmarkIndex 1139–2001 across runs).                                                                                                                                                                                                                                                                                                                                                                                        |
| `pnpm lhci` sample 2                        | `/fa` 95 (94–98), `/en` **94** (94–97) ✘. LHCI exited 1 on `/en`. a11y/BP/SEO 100.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Fonts (20 LHCI runs, P3)                    | `/fa` requests 4 font files in all 10 runs (Vazirmatn only), `/en` 5, as claimed. The `unicode-range` strings equal `@fontsource` 5.3.0 `unicode.json` (`latin`, `arabic`) plus `U+0020,U+00A0` on the Arabic face. Decoding both `vazirmatn-arabic-*.woff2` cmaps: U+0020 → glyph 25, U+00A0 → glyph 24, so the added range is backed by glyphs. Observed LCP equals observed FCP on both pages; Lantern adds 1.2–2.4 s of simulated render delay from JavaScript (React/Next ≈ 117 KB transferred, a 288 ms hydration task), not from fonts. |
| Env refusal (AC17)                          | `next start` with `APP_ENV` unset (no `.env`): exit 1, `APP_ENV: invalid_value`. `APP_ENV=production` with the example values: exit 1, four problems named. Production with `REDIS_URL=redis://cache:6379`: exit 1, `REDIS_URL: has no password`. 400 requests fired during a bad-env start-up: 0 answered.                                                                                                                                                                                                                                    |
| Freshness scripts (TS1)                     | All three exit 0 live (nodejs.org, `raw.githubusercontent.com` `schedule.json`, npm advisory API). `node scripts/check-package-manager.ts pnpm@10.28.0`: **exit 1**, 11 High + 12 Moderate. Calling `parseAdvisories` directly: `{ advisories: { pnpm: [{ severity: 'high' }] } }`, `{ 'pnpm@10.28.0': [ … ] }` and `{ pnpm: [{ severity: 'HIGH' }] }` all yield no blocking advisory (TS1-r4).                                                                                                                                                |
| pnpm integrity (F6)                         | The `packageManager` sha512 equals the registry's `dist.integrity` (base64 → hex). Corepack with a tampered hash: `Mismatch hashes`; with the real one: `10.34.9`. Corepack reads only `COREPACK_NPM_REGISTRY` (Node 22 `corepack.cjs:21949`), not pnpm's `registry` setting (D6).                                                                                                                                                                                                                                                             |
| 404 responses (own server, port 3501)       | `/api`, `/robots.txt`, `/sitemap.xml`, `/x.png`, `/x.js`, `/favicon.ico`: 404, `private, no-cache, no-store`, served HTML `<html lang="fa" dir="rtl">` with the `<h1>` (F3 fixed). **`/fa/x`, `/en/x`, `/t/x`, `/api/x`, `/fa/x.js`: 404 and `no-store`, but the served HTML is Next's `<html id="__next_error__">` shell: no `lang`, no `dir`, no `<h1>`, and a body of `<div hidden>` only.** The same holds at `a457aee` (built separately), so it predates round 3.                                                                        |
| 404 in a browser                            | JavaScript disabled: `/fa/x`, `/en/x`, `/t/x` are blank, `lang=""`, and `<title>` is the site title. App chunks blocked (server HTML only): axe reports **`html-has-lang`** on `/fa/x` and `/en/x`; `/api` has 0 violations. Normal browser after hydration: 0 violations everywhere (what the E2E measures).                                                                                                                                                                                                                                  |
| Object store (pinned digest, own project)   | No telemetry line; WebDAV, Iceberg and Lance gone; 11 listeners (claim: 16 → 11); filer IAM still logs `UNAUTHENTICATED`. Positive control: from the `objectstore` network the filer answers; from another network, `bad address`. **From the Docker host, the container IP answers: filer `:8888` 200, master `:9333` 200** (ADR 0013:68 says "never from the host"). S3: anonymous PUT/GET/list 403, wrong secret 403, signed PUT/GET 200; presigned query-string PUT/GET 200, tampered signature 403.                                       |
| Postgres / Redis (AC10)                     | Not reproduced: Docker Hub answered 429 for the pinned images. CI steps 8 ("wrong or missing password, for both roles", asserting the error text) and 10 (Redis missing and wrong password) are green in run 40559602653.                                                                                                                                                                                                                                                                                                                      |
| Lint probes (temporary fixtures, deleted)   | Not caught: `<p>{ok ? 'Yes' : 'No'}</p>`; `<input type="submit" value={ok ? 'Send' : 'Save'} />`; `style={{ color: ok ? 'crimson' : 'gray' }}`; `style={{ backgroundColor: ok && 'black' }}`; ``<circle fill={`red`} />``; ``<path stroke={`black`} />``; `style={{ marginTop: -8 }}`; `style={{ padding: ok ? 8 : 16 }}`; in `domain/`, `new Intl.DateTimeFormat('fa').format(d)` with `d?: Date`. Caught as expected: three-level `aria-label` branches at two levels (as documented), `borderColor: 'transparent'`.                         |
| Audits                                      | `pnpm audit --audit-level=high`: exit 0, 3 High, all ignored (R-001…R-003). `pnpm audit --prod --json`: 0 info/low/moderate/high/critical.                                                                                                                                                                                                                                                                                                                                                                                                     |
| Commits                                     | Each of the 21 fix commits touches one concern (file lists checked). The pre-round-3 multi-concern commits and the plan reformat inside `c2d2e84` remain.                                                                                                                                                                                                                                                                                                                                                                                      |
| Security gate                               | `security-foundation-round-4.md`: **Pass**, 0 Critical, 0 High. N3 (no ruleset on `main`) stays an open Medium for the owner; G1 Low, G2–G6 Info.                                                                                                                                                                                                                                                                                                                                                                                              |

## Mandatory gates (any red = score 0)

- [x] **CI green (lint, typecheck, test, build):** run 40559602653 at `26e1971`, 6/6 jobs; reproduced
      locally (`pnpm verify` exit 0, E2E 57 passed + 1 skipped).
- [x] **0 High/Critical security findings:** security review round 4 Pass (0 Critical, 0 High). On
      this reviewer's evidence: production audit 0/0, the three dev-only Highs register-gated, the
      pnpm pin hash-verified with no advisory, Semgrep and gitleaks green at HEAD.
- [x] **axe: 0 violations, as the project measures it:** E2E in a standard browser, `/fa`, `/en` and
      seven 404 shapes, desktop and mobile, locally and in CI; Lighthouse accessibility 100 in all 20
      local runs. **Caveat:** the HTML served for `/fa/…`, `/en/…`, `/t/…` and `/api/…` 404s has no
      `lang` and fails `html-has-lang` until the client hydrates. The defined gate measures the
      hydrated page, so this is scored as A4 and T6, not as a red gate. The product owner may rule
      otherwise.
- [x] **Lighthouse ≥ 95 mobile (DoD and the phase-00 gate; not one of the template's three):** now
      asserted on the median (P2 fixed) and green in CI at `a1f23d0` and `26e1971`, with no re-runs.
      The margin is thin: on this reviewer's noisy host each sample missed by 1–2 points on one page
      (see Notes).

## Code rubric

| Criterion                  | Weight  | Score    | Evidence / deductions                                                                                                                                                                                                                                                                                                                                 |
| -------------------------- | ------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type safety                | 10      | 9.75     | `tsc` 0; ESLint `strictTypeChecked` 0; no `any`, `@ts-*` or non-null assertion. Both freshness scripts now validate the nodejs.org and Release-schedule answers, and a missing pin fails. **−0.25 TS1-r4** (the advisory answer still fails open on a reshaped top level or an unknown severity).                                                     |
| Lint & format              | 10      | 9.75     | ESLint and Prettier clean locally and in CI. Quoted keys, template literals, shorthands, SVG attributes, arbitrary properties and inline spacing/radius/font literals are now caught, each line asserted by a fixture. **−0.25 L1-r4** (conditional and unary values and templated SVG colours still pass).                                           |
| Tests                      | 20      | 19.25    | 140 unit tests at 100 %, 58 E2E, fixtures asserted line by line (`e3187e1`), service checks assert the failure reason. T4 and T5 fixed. **−0.25 T3-r4** (conditional JSX text passes AC4), **−0.25 T6** (AC19 unproven for the served document), **−0.25 T7** (two new gate checks do not pin what they name).                                        |
| Security                   | 20      | 20       | S4 fixed and proven on a real server; telemetry off and the object store isolated from the other containers; pnpm pinned by hash and installed with Corepack; Moderate gate for the package manager; `eval`/raw-HTML rules. Security review: Pass. N3 (owner) and G1 (Low) are owned by the security review and were not independently verified here. |
| Architecture & readability | 20      | 19.75    | One document shell and one 404 body shared by three entry points; locale list and fallback defined once (A3 fixed); purity rules cover `Date()`, computed access, aliases and argument-less Intl (A1 fixed). Functions ≤ 40 lines, files ≤ 300. **−0.25 A4** (404s under a locale are client-rendered only).                                          |
| Performance                | 10      | 10       | P2 fixed (median assertion, config test, green in CI twice). P3 fixed and measured (4/5 font files, cmap-backed range, fonts off the LCP path). `/fa` and `/en` static. The thin margin is recorded in Notes.                                                                                                                                         |
| Documentation              | 10      | 9.0      | CHANGELOG, story (AC8, AC17, AC19), register (F4 and F11 rows), ADR 0018 and the response are current; round-3 D5 statements corrected. **−0.5 D1** (plan reformat in `c2d2e84`), **−0.25 D2** (old multi-concern commits; none new), **−0.25 D6** (new untrue statements).                                                                           |
| **Total**                  | **100** | **97.5** | Below 98: changes requested.                                                                                                                                                                                                                                                                                                                          |

### Deductions in detail

- **A4 (−0.25) and T6 (−0.25): the 404 under a locale is rendered only in the browser, and the E2E
  cannot see it.** `src/app/[locale]/[...rest]/page.tsx:4-6` calls `notFound()`. The error does not
  stop at `src/app/[locale]/not-found.tsx`: it reaches Next's top-level error recovery
  (`next/dist/server/app-render/app-render.js:2491-2495`), which answers with the
  `<html id="__next_error__">` shell (`:1319-1327`) and leaves the 404 to client hydration. Measured
  for `/fa/x`, `/en/x`, `/t/x` and `/api/x`:
  - the served HTML has no `lang`, no `dir`, no `<h1>`, and a body of `<div hidden>` only;
  - with JavaScript off the page is blank, and with the app chunks blocked axe reports
    `html-has-lang`;
  - `<title>` is the site title, while the global 404 (`/api`) says «صفحه پیدا نشد».

  AC19 (`docs/stories/platform-foundation.md:34`) promises a localized page with correct
  `lang`/`dir`, and ADR 0018:14-17 describes these shapes as server-localized. Both round-3 reviews
  accepted it, because `e2e/not-found.spec.ts:18-27` uses auto-waiting locators that pass once React
  has rendered the page. It predates round 3 (same output at `a457aee`). The new global 404 is
  server-rendered, so today single segments are served better than `/fa/…`.

- **T3-r4 (−0.25): conditional JSX text still bypasses AC4.** The round-3 fix added branch-following
  for attributes only (`eslint.config.mjs:72-73`). `react/jsx-no-literals` with `noStrings` checks a
  literal whose parent is the expression container, so `<p>{ok ? 'Yes' : 'No'}</p>` and
  `<p>{name ?? 'Guest'}</p>` lint clean, as does `<input type="submit" value={ok ? 'Send' : 'Save'} />`
  (`:74-75` have no branch form). This is the most common shape of conditional text in React. The
  claims are wider than the rule: `eslint.config.mjs:57-58` ("JSX text, wrapped or not, is
  covered"), `CHANGELOG.md:14` ("wrapped, conditional and button text included") and ADR 0015:68-71.
- **T7 (−0.25): two new gate checks do not pin what they name.**
  - `tests/lighthouse-config.test.ts:34-38` ("holds the DoD thresholds") checks performance and
    accessibility only. Best practices and SEO could drop to 0.5 and the test would stay green.
    Round-3 fix 1 asked for the AC6 thresholds.
  - `.github/workflows/ci.yml:197-201`:
    - The isolation step passes on any `wget` failure: a missing `wget`, a moved filer port, or a
      stopped filer. It has no positive control and does not assert the reason (`bad address`), the
      standard `1ec24a0` set for Postgres.
    - The telemetry step greps the compose config, not the running service. (Security review G3 makes
      the same point.)
- **TS1-r4 (−0.25): the advisory gate still fails open on a reshaped answer.**
  `scripts/check-package-manager.ts:26` reads `data[name] ?? []`, so any object without a `pnpm` key is
  treated as clean, including a wrapped answer (`{ advisories: { pnpm: […] } }`) and a re-keyed one
  (`{ 'pnpm@10.28.0': […] }`). `:30` accepts any severity string, and `:45` blocks only lower-case
  `moderate|high|critical`, so `HIGH` or a renamed level passes. The JSDoc at `:18-21` ("any other
  shape (… a renamed field) fails instead of passing") is not true for the top level. Round-3 fix 4
  asked for a CI step or test proving the gate fires against `pnpm@10.28.0`. The script accepts the
  argument and fails as it should (measured: exit 1), but CI never runs it, so an API that answers
  `{}` to everything would go unnoticed.
- **L1-r4 (−0.25): token bypasses that remain in TS/TSX.**
  - Colour properties with a conditional or logical value: `color: ok ? 'crimson' : 'gray'`,
    `backgroundColor: ok && 'black'`. `eslint.config.mjs:40-41` matches only a direct `Literal` or
    `TemplateLiteral`, and `:44` excludes colour keys from the named-colour check.
  - SVG colour attributes written as template literals (``fill={`red`}``): `:48` looks for `Literal`
    only.
  - Negative or conditional spacing values: `marginTop: -8`, `padding: ok ? 8 : 16` (`:52`).

  The i18n rules follow `?:` and `??` branches; the token rules do not.

- **D1 (−0.5): unchanged.** `c2d2e84 build: …` still carries the 356-line Prettier reformat of the
  maintainer's `docs/project-plan.md`. A history rewrite needs the product owner's approval, and no
  waiver is recorded either.
- **D2 (−0.25, was −0.5): old multi-concern commits remain; none were added.** `d0d1e50`, `a701e1f`,
  `3441445`, `7e101c2`, `5af3007` and `c25ba2d` are unchanged. All 21 round-3 fix commits are single
  concerns, so the round-3 escalation for recurrence no longer applies.
- **D6 (−0.25): new statements that are not true.**
  - `README.md:22` and ADR 0014:74-75 say a registry mirror set with `pnpm config set registry`
    "covers" pnpm itself, because "Corepack fetches pnpm from the same npm registry". Corepack reads
    only `COREPACK_NPM_REGISTRY`. Since `a1f23d0` every install and CI run starts with a Corepack
    download from `registry.npmjs.org`, so behind an Iranian mirror the documented setup still fails
    at the first `pnpm`.
  - ADR 0013:66-68 says the unauthenticated master, volume, filer and IAM APIs are "never" reachable
    "from the host". On Linux the host reaches them on the container's bridge IP (measured: filer 200,
    master 200).
  - ADR 0018:14-17: see A4.

## Round-3 fixes: verification

| #     | Claimed fix                                                      | Verified?          | Evidence                                                                                                                                                                   |
| ----- | ---------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2    | `median` aggregation + config test                               | Yes                | `lighthouserc.json:12-15`; `@lhci/utils` source; `tests/lighthouse-config.test.ts`. Both local samples now **fail** on a sub-95 median, so the gate bites; CI green twice. |
| P3    | `unicode-range`, Persian slot first on `/fa`, 4/5 font files     | Yes                | `fonts/index.ts:29-35,46-52,69-75`, `globals.css:28,36-38`; ranges equal `@fontsource`; cmap has U+0020/U+00A0; 4/5 files in 20 runs; E2E `hello.spec.ts:61-67`.           |
| S4    | `APP_ENV` required; production rules                             | Yes                | `env.ts:16,36-48`; `env.test.ts`; three real start-ups exit 1; 0 of 400 racing requests answered.                                                                          |
| TS1   | Validate network JSON; prove the gate fires                      | **Partly**         | `check-node-version.ts:27-41,57-65` sound. `check-package-manager.ts:26,30` fail open (TS1-r4); no CI positive control.                                                    |
| T4    | Per-commit concurrency group on `main`                           | Yes                | `ci.yml:15-17`; `tests/ci-workflow.test.ts`.                                                                                                                               |
| T3    | `noStrings`, branches, button values                             | **Partly**         | Attributes and `{'…'}` caught; conditional children and conditional button values pass (T3-r4).                                                                            |
| A1    | Purity bypasses                                                  | Yes                | `eslint.config.mjs:80-95,170-195`; fixture `ambient-bypasses.ts` with the allowed uses marked. The residual needs types (`format(maybeUndefined)`): see Notes.             |
| L1    | Colour and token bypasses                                        | **Partly**         | `eslint.config.mjs:16-55`; `scripts/named-colors.json` shared with the CSS check; residuals in L1-r4.                                                                      |
| A3    | Locales and fallback once                                        | Yes                | `shared/lib/locale.ts:5-9`, `routing.ts:7-8`; `Document` uses `getLocale()`.                                                                                               |
| T5    | AC10 and AC18 clauses                                            | Yes                | `ci.yml:176-196,204-212` (CI green; S3 parts reproduced locally); `money.test.ts:29-33`.                                                                                   |
| D5    | Untrue statements                                                | Yes                | `risk-register.md:13`, ADR 0016:71-73, ADR 0014:50, `ci.yml:12-14`, `eslint.config.mjs:10-15`.                                                                             |
| D1/D2 | History                                                          | No (owner)         | Unchanged; no waiver recorded.                                                                                                                                             |
| F2    | Telemetry and extra services off; own network                    | Yes, with a caveat | Measured as above; the host can still reach the internal APIs (D6, ADR 0013).                                                                                              |
| F3    | Single-segment 404s not cached                                   | Yes                | `dynamicParams = false` + `global-not-found.tsx`; `no-store` and server-rendered for every single segment probed.                                                          |
| F6/F7 | Hash pin + Corepack; Moderate gate; end-of-life check            | Yes                | Hash = registry integrity; tampered hash rejected; `pnpm@10.28.0` exit 1; `supportStatus` tests.                                                                           |
| F8    | `eval`, `new Function`, `javascript:`, `dangerouslySetInnerHTML` | Yes                | `eslint.config.mjs:221-225`; fixture `unsafe-code.tsx`.                                                                                                                    |

## Phase-00 deliverables (`docs/phases/phase-00.md`, PRs 0.1–0.4)

| PR  | Deliverable                                                                                    | Status                     | Evidence                                                                     |
| --- | ---------------------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------- |
| 0.1 | Next.js App Router, React, strict TS + `noUncheckedIndexedAccess`, pnpm, Node LTS via `.nvmrc` | Done                       | `tsconfig.json`, `package.json:7-9`, `.nvmrc`                                |
| 0.1 | Strict ESLint + `eslint-plugin-boundaries`                                                     | Done                       | `eslint.config.mjs:97-168`; boundary fixtures                                |
| 0.1 | Prettier, Husky + lint-staged, Commitlint                                                      | Done                       | `.husky/*`, `lint-staged.config.mjs`, `commitlint.config.mjs`; CI commitlint |
| 0.1 | `pnpm verify` = lint + typecheck + test + build                                                | Done                       | `package.json:23`; `ci.yml:130`                                              |
| 0.1 | Folder structure, empty `index.ts` per module                                                  | Done                       | Ten modules × `domain/server/ui`                                             |
| 0.2 | Compose: Postgres (`btree_gist`), Redis, MinIO                                                 | Done, with deviation       | SeaweedFS (ADR 0013, owner acceptance pending); CI `services` green          |
| 0.2 | `env.ts` validates every variable; the app does not start without it                           | Done                       | Measured above                                                               |
| 0.2 | `.env.example` placeholders only                                                               | Done                       | Production refuses them (measured)                                           |
| 0.3 | next-intl `fa`/`en`, `[locale]`, `dir`/`lang`                                                  | Done (A4 for locale 404s)  | E2E; 404 caveat above                                                        |
| 0.3 | Vazirmatn + Shippori self-hosted WOFF2 subsets; Peyda slot                                     | Done                       | P3 verification                                                              |
| 0.3 | `formatToman`, `formatJalali`, `toPersianDigits` at 100 %                                      | Done                       | Coverage 100 %; > 2^53 in both locales                                       |
| 0.4 | Actions: cached install, verify, Playwright fa/en, LHCI                                        | Done                       | `ci.yml:107-157`                                                             |
| 0.4 | Vitest 90 % threshold on `domain`                                                              | Done                       | `vitest.config.mts:12-24`                                                    |
| 0.4 | axe in Playwright; any violation fails                                                         | Done                       | `hello.spec.ts:70-76`, `not-found.spec.ts:29-35` (post-hydration only; T6)   |
| —   | **Phase gate:** green pipeline on the bilingual RTL hello page and Lighthouse mobile ≥ 95      | **Met in CI**, thin margin | Median assertion green at `a1f23d0` and `26e1971`                            |

MinIO → SeaweedFS is unchanged from round 3. The change is recorded correctly (ADR 0013, ADR 0008
"amendment proposed", the story's out-of-scope list), but `docs/phases/phase-00.md:15` still names
MinIO. PR 0.2 must not be ticked until the owner accepts ADR 0013 or amends the phase file.

Process note, not deducted: the branch delivers PRs 0.1–0.4 at once; ticking all four from one review
is the owner's call.

## ADR scores (rubric: problem 20 · alternatives 20 · trade-offs 25 · Iran fit 20 · revisit 15)

| ADR                         | Problem | Alternatives | Trade-offs | Iran fit | Revisit | Total  | Reasons for every point lost                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------- | ------- | ------------ | ---------- | -------- | ------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0013 SeaweedFS for local S3 | 20      | 19           | 23         | 20       | 15      | **97** | −1 alternatives (unchanged): option D is rejected without being tried (`:39`). −1 trade-offs (unchanged): the Risk mitigation (`:72-73`) relies on CI exercising the real gateway, but the contract's presigned GET/PUT (`:23`, `:58`) is still not exercised; CI signs with a header (`ci.yml:208`). This reviewer's presigned PUT/GET work on 4.51, so the step is cheap. −1 trade-offs (new): the amended security trade-off (`:66-68`) says the unauthenticated APIs are "never" reachable "from the host"; on Linux they are (measured). Iran fit: telemetry-off verified. |
| 0014 Toolchain baseline     | 20      | 20           | 24         | 18       | 15      | **97** | −1 trade-offs (unchanged): every push's CI now depends on three foreign endpoints (nodejs.org, `raw.githubusercontent.com`, the npm advisory API), so an outage fails every push; Consequences (`:66-72`) mention only "about 20 s". −1 Iran fit (unchanged): those endpoints and the runner's Chrome used by LHCI are missing from the self-hosted-CI mirror list (`:76-78`, `:84`); `raw.githubusercontent.com` is new and is often filtered from Iran. −1 Iran fit (new): `:74-75` claims a pnpm registry mirror covers Corepack; it does not (D6).                          |
| 0015 Rule enforcement       | 20      | 20           | 23         | 20       | 15      | **98** | −2 trade-offs: Risk (`:80-85`) still covers only false positives. The false negatives measured this round are not acknowledged: conditional JSX text and button values, conditional/unary colour and spacing values, templated SVG colours, and `format(maybeUndefined)` reading the clock. Meanwhile the Decision (`:57-71`) presents the coverage as complete; "as a branch of `?:`" applies to attributes only.                                                                                                                                                              |
| 0016 Supply-chain controls  | 20      | 20           | 24         | 20       | 15      | **99** | Round-3 point (gitleaks "regex-free") fixed. −1 trade-offs (new): `:71-73` promises suppressions only "with … a written reason, never by disabling the scan", but nothing enforces it. gitleaks honours `.gitleaksignore` (and a `.gitleaks.toml`) from the scanned tree, which is what `f6eb43b` relies on, so a push can suppress its own finding. The only mitigations (review, a ruleset that does not exist yet, no CODEOWNERS) are not stated (security G1).                                                                                                              |
| 0017 Font delivery          | 20      | 20           | 24         | 20       | 15      | **99** | The download half of round 3's −2 is fixed and verified. −1 trade-offs: the `/en` cost of a non-preloaded first face of the LCP heading is still not recorded, although round-3 fix 2 asked to measure it and decide on an `/en` preload. This reviewer measured it as harmless (observed LCP equals FCP; Shippori fetched at about 100–165 ms). One sentence with the measurement closes it.                                                                                                                                                                                   |
| 0018 Not-found handling     | 18      | 19           | 25         | 20       | 15      | **97** | −2 problem: Context (`:14-17`) says the first two shapes render a localized 404, but their served HTML is Next's client-rendered error shell, so the problem is stated correctly for one shape of three (A4). −1 alternatives: no option sends every unknown path to the one server-rendered 404 by dropping the `[locale]` catch-all. This reviewer measured that option: all shapes server-render with `lang`/`dir`/`<h1>`, and `/fa`, `/en` stay SSG. Its real cost is choosing the locale for `/en/…`, which is the trade-off to weigh. No root-layout option either.       |

0013, 0014 and 0018 are below 98 and stay `Proposed` until their fixes land. 0015, 0016 and 0017 are at
98 or above but should take the one-line corrections above. Every file still says "Amended after
round 3; re-score pending" (`docs/adr/0013…0017:5`, `0018:5`, `docs/adr/README.md:17-22`).

## Required fixes, in order (file:line → fix)

1. **A4 + T6, server-render every 404:**
   - `e2e/not-found.spec.ts:18-27`: for every case, also assert the served HTML, which fails today for
     `/fa/…`, `/en/…`, `/t/…` and `/api/…`:
     ``const html = await (await request.get(path)).text(); expect(html).toContain(`<html lang="${lang}" dir="${dir}"`); expect(html).toContain(`>${title}</h1>`);``
     A `test.use({ javaScriptEnabled: false })` block does the same.
   - Then make the test pass without losing SSG on `/fa` and `/en`. A direction this reviewer
     measured: delete `src/app/[locale]/[...rest]/page.tsx` and `src/app/[locale]/not-found.tsx`.
     Every unmatched path then reaches `src/app/global-not-found.tsx` and answers 404, `no-store`,
     with `lang`/`dir`/`<h1>` in the HTML, while the build still lists `/fa` and `/en` as `●`. The
     global 404 must then pick the requested locale for `/en/…`. Resolve it inside
     `global-not-found.tsx` only, for example from the locale next-intl's proxy forwards (the
     `requestLocale` source), and pass it explicitly to `getTranslations` and to `Document` (a
     `locale` prop). Do not do this in `src/shared/i18n/request.ts`: adding `requestLocale` there
     made `/fa` and `/en` dynamic in this reviewer's build. Any other approach is acceptable if the new
     test passes and `/fa`, `/en` stay `●`.
   - Give every 404 the `NotFound` title.
   - Correct ADR 0018 (Context `:14-17`, Options, Decision) and, if the wording changes,
     `platform-foundation.md:34`.
2. **T3-r4** `eslint.config.mjs:69-76`:
   - add `:matches(JSXElement, JSXFragment) > JSXExpressionContainer > ${BRANCH} > ${TEXT}` and the
     same with `${BRANCH} > ${BRANCH} >`;
   - add `${BUTTON_INPUT} > JSXAttribute[name.name='value'] > JSXExpressionContainer > ${BRANCH} > ${TEXT}`;
   - add fixture lines to `tests/fixtures/src/shared/ui/literal-text-bypasses.tsx`:
     `<p>{ok ? 'Yes' : 'No'}</p>` (2 findings), `<p>{name ?? 'Guest'}</p>`, and the conditional submit
     value (2). Keep `{t(ok ? 'yes' : 'no')}` clean;
   - update the count at `tests/lint-rules.test.ts:151`.
3. **L1-r4** `eslint.config.mjs:39-54`:
   - add `Property${keyMatches(COLOR_KEY)} > .value:matches(ConditionalExpression, LogicalExpression) > ${VALUE}`;
   - add `JSXAttribute[name.name=${SVG_COLOR_ATTRIBUTE}] TemplateElement[value.raw=${NAMED_COLOR}]`;
   - add `JSXAttribute[name.name='style'] Property${keyMatches(SIZE_KEY)} > .value:matches(UnaryExpression, ConditionalExpression, LogicalExpression) > Literal`;
   - add one fixture line each to `token-bypasses.tsx` and update the count at
     `tests/lint-rules.test.ts:140`.
4. **TS1-r4** `scripts/check-package-manager.ts:22-38`:
   - throw unless `Object.keys(data)` is empty or exactly `[name]`;
   - throw on a severity outside `info | low | moderate | high | critical`;
   - correct the JSDoc at `:18-21`;
   - add the three reshaped answers above as failure cases at `tests/check-package-manager.test.ts:50-58`;
   - in `.github/workflows/ci.yml` after `:105`, add a positive control:
     `- name: The advisory check still fires (positive control)` /
     `run: '! node scripts/check-package-manager.ts pnpm@10.28.0'`.
5. **T7:**
   - `tests/lighthouse-config.test.ts:34-38`: add
     `expect(min['categories:best-practices']).toBeGreaterThanOrEqual(0.95)` and the same for
     `categories:seo`.
   - `.github/workflows/ci.yml:197-201`:
     - precede the isolation probe with a positive control from inside the object store
       (`docker compose exec -T objectstore wget -qO /dev/null http://127.0.0.1:8888/`);
     - make the probe assert the reason:
       `docker compose exec -T redis wget -q -T 3 -O /dev/null http://objectstore:8888/ 2>&1 | grep -q 'bad address'`;
     - add a runtime telemetry assertion: `! docker compose logs objectstore | grep -q telemetry.seaweedfs.com`.
6. **D6:**
   - `README.md:22` and ADR 0014:74-75: say that Corepack downloads pnpm from
     `COREPACK_NPM_REGISTRY` (default `registry.npmjs.org`), so behind a mirror set both
     `pnpm config set registry <mirror>` and `COREPACK_NPM_REGISTRY=<mirror>`; the sha512 pin still
     verifies the bytes. Add the variable to the self-hosted-CI list.
   - ADR 0013:66-68: "reachable on the object store's compose network and, on Linux, from the host
     through the container's bridge IP; never from the internet or the other services". Add the same
     to `risk-register.md:31`.
7. **ADRs:**
   - write the scores above into `docs/adr/0013…0018:5` and `docs/adr/README.md:17-22`;
   - 0013: add the presigned CI step (or restate the Risk) and the host correction;
   - 0014: add the outage dependency to Consequences, and the three endpoints and the LHCI Chrome to
     the mirror list (`:76-78`, `:84`);
   - 0015: add a "false negatives" Risk bullet (the measured list above, plus "variable indirection is
     out of reach of syntax rules");
   - 0016: add the suppression trade-off and its mitigation (CODEOWNERS on `.gitleaksignore`,
     `.gitleaks.toml`, `.semgrepignore`, plus the N3 ruleset);
   - 0017: add the `/en` LCP measurement;
   - 0018: per fix 1.
8. **D1 + D2:** the product owner either approves a force-push to this branch (move the
   `docs/project-plan.md` hunk out of `c2d2e84`; split `d0d1e50`, `a701e1f`, `3441445`, `7e101c2`,
   `5af3007`, `c25ba2d`), or records a written waiver in the round-4 response. Either one removes these
   deductions.
9. **Product owner, outside the diff:**
   - add the `main` ruleset before merging (security N3, Medium);
   - accept ADR 0013 or amend `docs/phases/phase-00.md:15`;
   - decide repository visibility;
   - answer the plan §11 questions that keep ADRs 0010 and 0011 `Proposed`.

## Notes (not deducted)

- **Lighthouse margin.** On this host the two samples gave `/fa` 93 / `/en` 95 and `/fa` 95 /
  `/en` 94. The author's own sample (`/fa` 96, `/en` 97) and two green CI runs pass. The variable part
  is JavaScript: TBT ran 133–654 ms, and a 288 ms hydration task appeared on a static page. Do not
  re-run a red Lighthouse job until it turns green: that is best-of-N again, the defect P2 removed.
  If CI starts flaking, raise `numberOfRuns` to 7 or 9 (it must stay odd;
  `lighthouse-config.test.ts:15-17` pins that), and track the JavaScript budget from Phase 1.
- `src/shared/ui/fonts/index.ts:18` is a 147-character comment line: two paragraphs were joined in
  `d0cc6ec`. Rewrap it.
- `src/shared/lib/money.ts:22` and `date.ts:22` default to the literal `'fa'` beside
  `DEFAULT_LOCALE`, and `src/app/[locale]/(site)/page.tsx:21` hard-codes the fa↔en toggle (since
  round 1). Consider `otherLocaleOf()` in `shared/lib/locale.ts`.
- `(site)/page.tsx:19`: routing can no longer reach the `hasLocale` guard (`dynamicParams = false`),
  but it still narrows the type. Fine.
- A purity residual that needs type information: `new Intl.DateTimeFormat(…).format(d)` with
  `d?: Date` reads the clock when `d` is undefined. Record it in ADR 0015 as a known false negative.
- The global 404 still emits `x-nextjs-cache` and `x-nextjs-prerender` headers (security G5,
  Phase 5 Nginx).
- Security G1 (Low) was not reproduced here beyond the mechanism `f6eb43b` itself depends on. It is
  owned by the security review.
