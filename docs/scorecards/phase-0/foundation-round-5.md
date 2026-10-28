# Scorecard — Phase 0 / Platform foundation (round 5)

- Reviewer: code-reviewer (fresh session, round 5; did not write this code)
- Date: 2026-10-28
- Verdict: **Changes requested — 97.75 / 100** (gate ≥ 98)
- Scope: the whole branch against `origin/main` (merge base `b681347`, HEAD `fe5b81c`, 100 non-merge
  commits), focused on `git log 26e1971..fe5b81c`: 16 fix and documentation commits
  (`69d1c48`…`9f13a52`), the round-4 scorecards, response and ADR scores (`6ef68e1`, `1d1ee9a`,
  `e859a27`), and two CI commits (`859d5fa`, `fe5b81c`). `.claude/commands/*` and `docs/phases/*`
  belong to the maintainer and were read, not scored.
- Inputs read: `CLAUDE.md`, `docs/project-plan.md` §3 and §8, `docs/phases/phase-00.md`,
  `.claude/commands/review.md`, `docs/stories/platform-foundation.md`, ADRs 0013–0018,
  `docs/security/risk-register.md`, `foundation-round-4.md`, `foundation-round-4-response.md`,
  `security-foundation-round-4.md`. `security-foundation-round-5.md` appeared after this reviewer's
  findings were collected and was read only for its gate verdict and findings table. Every
  round-4 fix claim, and every measurement quoted in a commit body that could be reproduced here, was
  checked here rather than taken on the author's word.

## Evidence collected by this reviewer at `fe5b81c`

| Check                                       | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Environment                                 | Own clone. `cp .env.example .env` (gitignored, not committed). `pnpm install --frozen-lockfile --offline`: up to date. Local Node 22.22.0 is below `engines >=22.23.4`; pnpm only warns (ADR 0014).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm verify`                               | **exit 0**: typegen + ESLint (`--max-warnings=0`) + CSS colour check, Prettier, `tsc`, Vitest **18 files / 149 tests**, coverage 100 % (statements 74/74, branches 29/29, functions 19/19, lines 66/66), `next build`: `/fa`, `/en` still `●` (SSG); `/_not-found` is now `ƒ` (rendered per request); the `[locale]/[...rest]` route is gone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `CI=1 PORT=3500 pnpm e2e`                   | **71 passed, 1 skipped** (72 tests; env validation runs on the desktop project only); no retry used.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| GitHub CI run 40567716618 (`fe5b81c`, push) | **6/6 jobs success**, attempt 1; Playwright annotation "71 passed, 1 skipped"; steps "Lighthouse CI (mobile)" and "Lighthouse scores to job summary" success. Job logs and artifacts redirect to a blob host this reviewer's proxy refuses (403), and the check-run output carries no summary, so **the CI medians could not be read**. Run 40567034221 (`e859a27`): only "Scan full history" failed, as stated.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm lhci`, sample 1 (Chromium 1243)       | Pass. `/fa` **98** (85–98), `/en` **97** (94–98); a11y/BP/SEO 100 in all 10 runs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm lhci`, sample 2                       | Pass. `/fa` **98** (91–98), `/en` **97** (94–97); a11y/BP/SEO 100.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Lighthouse metrics (20 runs)                | The author's `/en` FCP figure reproduces: `/en` simulated FCP 1,062–1,081 ms, `/fa` 763–797 ms; `/fa` fetches 4 font files, `/en` 5. The weighted FCP contribution is 9.9–10.0 of 10 on `/en`, so the late Shippori request costs at most 0.1 points. The spread comes from TBT on `/fa` (328–427 ms in the low runs) and from simulated LCP on `/en` (2,198–2,871 ms).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 404 responses (own server, port 3501)       | `/fa/x`, `/en/x`, `/t/x`, `/api/x`, `/fa/x.js`, `/en/menu/em.cafe`, `/fa/a/b/c`, `/api`, `/robots.txt`, `/x.png`: 404, `private, no-cache, no-store`, served HTML with `<html lang dir>`, the localized `<title>` and `<h1>` (**A4/T6 fixed**). `RSC: 1` on `/en/x`: 404, `no-store`. A client-sent locale header on a proxy-skipped path switches that 404 to English, as ADR 0018 states; on `/fa/x` the proxy overrides it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **404 home link**                           | **`/en/no-such-page` and `/en/menu/em.cafe` serve `<a href="/fa">Back to the home page</a>`**, with and without JavaScript; clicking it opens the Persian home page.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Same check on the round-4 build             | Built `26e1971` in a scratch clone (port 3502): the four multi-segment 404s serve `<html id="__next_error__">` with no `<h1>`, so the new raw-HTML E2E check fails there, as `3e876b9` claims. After hydration, `/en/x`'s link was `/en`. **The `/fa` link on `/en` 404s is a regression of `3e876b9`.** In the same scratch clone, adding `locale={locale}` to the 404's `Link` gives `/en` on `/en/x` and `/fa` elsewhere, and `/fa`, `/en` stay `●`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Lint probes (temporary files, deleted)      | Caught now: `<p>{ok ? 'Yes' : 'No'}</p>`, `{n > 1 ? 'many' : 'one'}`, `<option>{…}</option>`, a conditional submit `value`, `color: ok ? 'crimson' : 'gray'`, `marginTop: ok ? -8 : 8`, `fill={ok ? 'red' : 'blue'}`. **Not caught: any literal under a TypeScript wrapper**: `{ color: 'red' as const }`, `{ backgroundColor: 'white' satisfies string }`, `style={{ padding: 8 as const }}`, `aria-label={'Close' as const}`, `<p>{'Hello' as const}</p>` (react/jsx-no-literals misses it too), `value={'Send' as const}`, `<p>{(ok ? 'Yes' : 'No') as string}</p>`. Also not caught, beyond the documented depth: three-level text branches, two-level colour, spacing and button-value branches, `type={'submit'}`, `{'Yes'.toUpperCase()}`, `{['Yes', 'No'][i]}`. In the scratch clone, adding `TSAsExpression, TSSatisfiesExpression, TSNonNullExpression` to `BRANCH` catches all seven wrapper probes, flags none of the allowed shapes, and leaves `tests/lint-rules.test.ts` green (51/51). |
| Freshness (TS1)                             | All three checks exit 0 live. The CI positive-control step, run as Actions runs it (`bash -e`), exits 0: Node 22.22.1 fails with "newer security releases", `pnpm@10.28.0` fails with `high:` lines. `parseAdvisories` throws on wrapped, re-keyed, upper-case and unknown severities (unit-tested).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Telemetry assertion (`ci.yml:221`)          | **Inert.** A step body whose log contains the telemetry line, with `! … \| grep -qi telemetry` followed by more commands, exits **0** under both `bash -e` (Actions' default for `run:`) and `bash -eo pipefail`. Bash's `set -e` ignores a pipeline negated with `!` unless it is the last command. The author's negative control (the override in the scratchpad replaces the whole `command`) failed on the `jq` config check at `:218-219`, not on this line. The idiom `… \| grep -qi telemetry && exit 1` fails the step in the same harness and passes without the line.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Secrets guard + gitleaks (scratch clone)    | Used the gitleaks source build the security reviewer left in the shared scratchpad (its version string is unset), with the pinned `--config`. Baseline: "no leaks found". **One commit adding a generated GitHub-token-shaped string plus an inline gitleaks allow comment under `docs/scorecards/` passes both the guard (exit 0) and the full-history scan ("no leaks found").** The same commit under `docs/notes/` fails the guard. Without the comment, gitleaks finds the token. A cutoff (`git log --all … ^fe5b81c -- docs/scorecards`) is empty today and catches the probe.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Env rules (G6, `c90dce9` claims)            | Called `parseEnv` with production values. Rejected, as claimed: `change.me`, `%63hange-me`, a 1-character DB password, a 32-space S3 secret, `http://` to a remote or private-IP S3 host. Accepted: `http://objectstore:8333` (as designed), but also a double-encoded placeholder, `change--me`, `change+me` and full-width letters, although AC17 says "any spelling or encoding".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Audits                                      | `pnpm audit --audit-level=high`: exit 0, 3 High, all ignored (R-001…R-003). `pnpm audit --prod --json`: 0 info/low/moderate/high/critical.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Repository settings                         | `GET …/branches/main`: `"protected": false`; `…/rulesets`: 0 (N3 still open, owner action before merge).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Not reproduced here                         | The Compose `services` checks (no Docker daemon in this VM; CI job green); Semgrep (CI job green).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Commits                                     | All 21 commits in the range are Conventional; commitlint is green in CI. `6f730d9` (G2, G5 and G6 in one docs commit) and `014ea81` (Corepack advice plus the endpoint list) each join two documentation corrections; noted, not escalated. The pre-round-3 multi-concern commits and the plan reformat inside `c2d2e84` remain.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

## Mandatory gates (any red = score 0)

- [x] **CI green (lint, typecheck, test, build):** run 40567716618 at `fe5b81c`, 6/6 jobs, attempt
      1; reproduced locally (`pnpm verify` exit 0, E2E 71 passed + 1 skipped).
- [x] **0 High/Critical security findings,** on this reviewer's evidence: production audit 0/0, the
      three dev-only Highs register-gated, Semgrep and gitleaks green at HEAD. The secret-scan
      bypass found here (T9) is Low-class. N3 (no ruleset on `main`) is still a Medium for the
      owner; the security review notes it becomes High if the branch merges without it. The round-5
      security review gives **Pass (0 Critical, 0 High)** and independently reports the same
      scorecard exemption (H1, Low) and the inert telemetry line (H3, Info).
- [x] **axe: 0 violations:** E2E on `/fa`, `/en` and seven 404 shapes, desktop and mobile, locally and
      in CI; Lighthouse accessibility 100 in all 20 local runs; this reviewer's axe run on `/en/x` is
      clean. The round-4 caveat is resolved: the served 404 HTML now carries `lang`, `dir` and `<h1>`.
- [x] **Lighthouse ≥ 95 mobile (DoD and the phase-00 gate):** the median assertion passed in CI at
      `fe5b81c`, and in both local samples (`/fa` 98/98, `/en` 97/97). The CI medians themselves
      could not be read from this network.

## Code rubric

| Criterion                  | Weight  | Score     | Evidence / deductions                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------- | ------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type safety                | 10      | 10        | `tsc` 0; ESLint `strictTypeChecked` 0; no `any`, `@ts-*` or non-null assertion. TS1-r4 fixed: the advisory parser accepts only the package's own key and the five npm severities; CI's positive controls prove both freshness checks still fail.                                                                                                                                   |
| Lint & format              | 10      | 9.75      | ESLint and Prettier clean. L1-r4 and T3-r4 fixed for every listed shape, each with fixture lines. **−0.25 L1-r5:** a TypeScript wrapper (`as`, `as const`, `satisfies`) around a literal passes every token rule and every text rule, `jsx-no-literals` included.                                                                                                                  |
| Tests                      | 20      | 19.25     | 149 unit tests at 100 %, 72 E2E, fixtures asserted line by line; the new raw-HTML 404 check fails on the round-4 code and passes now (measured); LH thresholds pinned. **−0.25 T8** (the 404's only link is untested and regressed), **−0.25 T7-r5** (the runtime telemetry assertion cannot fail), **−0.25 T9** (the inline-suppression guard exempts all of `docs/scorecards/`). |
| Security                   | 20      | 20        | No High/Critical (rubric condition). G1 largely closed: pinned gitleaks config, root config files banned, inline markers caught outside scorecards, reasons tested. G4 and G6 fixed and verified. The T9 hole is scored under Tests, following round 4's handling of Lows; the security review rates it Low (its H1).                                                              |
| Architecture & readability | 20      | 19.75     | One server-rendered 404 for every unknown path; `Document` and the 404 body take the locale explicitly; `/fa`, `/en` stay SSG; functions ≤ 40 lines, files ≤ 300. **−0.25 A5:** the 404 tree has two locale sources, and its `Link` follows the wrong one.                                                                                                                         |
| Performance                | 10      | 10        | Median assertion green in CI; two local samples pass with `/fa` 98 and `/en` 97; fonts 4/5 per page; the `/en` FCP cost is ≤ 0.1 points. The 404 is now rendered per request (noted).                                                                                                                                                                                              |
| Documentation              | 10      | 9.0       | CHANGELOG, story, register, README, ADRs and the response are current; round-4 D6 corrected. **−0.5 D1** (plan reformat in `c2d2e84`), **−0.25 D2** (old multi-concern commits), **−0.25 D7** (new statements that are not true).                                                                                                                                                  |
| **Total**                  | **100** | **97.75** | Below 98: changes requested.                                                                                                                                                                                                                                                                                                                                                       |

### Deductions in detail

- **A5 (−0.25) and T8 (−0.25): the English 404 sends the visitor to the Persian home page.**
  - `3e876b9` moved every 404 to `src/app/global-not-found.tsx`, which reads the locale from the
    proxy's header and passes it to `Document` and `NotFoundContent`. But
    `src/shared/ui/not-found/index.tsx:14` renders `<Link href="/">` with no `locale`.
  - next-intl's server `Link` then asks the request config (`src/shared/i18n/request.ts`), which
    finds no `[locale]` root parameter in the global 404 and falls back to `fa`.
  - Measured: `/en/no-such-page` and `/en/menu/em.cafe` serve `href="/fa"`, with and without
    JavaScript, and the click lands on `/fa`. At `26e1971` the same link was `/en` after hydration,
    so this is a regression of the round-4 fix.
  - `e2e/not-found.spec.ts:18-37` asserts `lang`, `dir`, `<title>` and `<h1>`, never the link, so
    the suite stayed green.
  - The architectural cause: any component in the 404 tree that resolves the locale implicitly
    (`getLocale()`, `getTranslations('…')`, `Link`) gets Persian, whatever the page's `lang`.
- **T7-r5 (−0.25): the runtime telemetry assertion cannot fail.**
  - `.github/workflows/ci.yml:221` is `! docker compose logs objectstore 2>&1 | grep -qi telemetry`,
    followed by more commands. Under `set -e`, bash does not exit on a pipeline whose status is
    inverted with `!`, so this line can fail the step only when it is the step's last command.
  - Measured with a log that contains the telemetry line: step exit 0 under `bash -e` and
    `bash -eo pipefail`.
  - `e5714ba`'s body says the step "fails if the logs mention telemetry", and the round-4 response
    (T7 row) says it "fails with telemetry on". The negative control failed only because its
    override also removed the flag that the `jq` check at `:218-219` reads. That config check is
    real, so telemetry is still asserted off; the added runtime check is not.
  - The round-4 scorecard suggested this same line; fix 2 below corrects that suggestion.
- **T9 (−0.25): the inline-suppression guard has a directory-sized hole.**
  - `.github/workflows/ci.yml:83` skips `docs/scorecards` entirely, so that the quoted markers in
    old scorecards pass. gitleaks honours an inline allow comment in any file, and
    `.github/CODEOWNERS:4-11` does not cover `docs/scorecards/`.
  - Measured with the pinned gitleaks and config: one commit adding a token-shaped string plus the
    allow comment under `docs/scorecards/` passes the guard and the full-history scan. Under any
    other path, the guard fails.
  - Scorecards are where agents paste evidence, and this repository is public. The exemption is wider
    than its reason, which concerns only commits that already exist.
- **L1-r5 (−0.25): TypeScript wrappers bypass the token and text rules.**
  - `eslint.config.mjs:11` (`BRANCH`), `:33` (`VALUE`), `:35-36` (`SIZE_VALUE`) and `:83` (`TEXT`)
    match a `Literal` directly under the property, attribute or expression container. A
    `TSAsExpression` or `TSSatisfiesExpression` in between hides it from every selector, and
    `react/jsx-no-literals` misses `{'Hello' as const}` as well.
  - `'red' as const` is the ordinary TypeScript idiom for a literal-typed property. AC4 ("cannot be
    literals") and AC8 are unproven for it.
  - ADR 0015's own rule: "each new shape found becomes a selector with a fixture line".
- **D1 (−0.5) and D2 (−0.25): unchanged.**
  - `c2d2e84 build: …` still carries the 356-line Prettier reformat of the maintainer's
    `docs/project-plan.md`.
  - `d0d1e50`, `a701e1f`, `3441445`, `7e101c2`, `5af3007` and `c25ba2d` still mix concerns.
  - No owner approval for a force-push and no written waiver exist. A squash merge, listed in the
    response as a third way out, would put every concern of the branch into one commit on `main`, so
    it does not satisfy "one concern per commit" either.
- **D7 (−0.25): new statements that are not true.**
  - `foundation-round-4-response.md:19` and `e5714ba`: the telemetry claim (T7-r5).
  - `README.md:47-48` ("which the repository cannot switch off … no inline suppressions"),
    `CHANGELOG.md:17`, ADR 0016:61-64 ("an inline suppression comment in any commit") and
    `foundation-round-4-response.md:36` (G1): false for `docs/scorecards/` (T9).
  - `next.config.ts:42-43` still describes `global-not-found.tsx` as the 404 "for single-segment
    paths outside the locales"; it now answers every unknown path. `e2e/not-found.spec.ts:10` says the
    same of the last three cases only.
  - AC17 (`docs/stories/platform-foundation.md:32`), `CHANGELOG.md:11` and `env.ts:3` promise
    placeholders rejected "in any spelling or encoding". Measured as accepted: a double-encoded
    placeholder, `change--me`, `change+me` and full-width letters. The rule is a reasonable
    heuristic; the sentence is absolute.
  - `docs/adr/README.md:24`: "its 'Revisit when' lists what is needed to reach 98". For ADRs
    0013–0018 the "Revisit when" sections list decision triggers; what each needs to reach 98 is in
    the scorecards.

## Round-4 fixes: verification

| #          | Claimed fix                                                        | Verified?                  | Evidence                                                                                                                                                                                                             |
| ---------- | ------------------------------------------------------------------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A4 + T6    | No catch-all; every 404 server-rendered via `global-not-found.tsx` | **Yes, with a regression** | Served HTML complete on 10 shapes; the new E2E check fails on `26e1971` (measured) and passes now; `/fa`, `/en` still SSG. The home link is now `/fa` on `/en` 404s (A5/T8).                                         |
| T3-r4      | Branch selectors for JSX children and button values                | Yes                        | `eslint.config.mjs:94-97`; fixture `literal-text-bypasses.tsx:12-15`; probes caught. Residual: TS wrappers (L1-r5).                                                                                                  |
| L1-r4      | Branches, SVG template literals, negatives                         | Yes                        | `eslint.config.mjs:35-36,50-73`; fixture `token-bypasses.tsx:16-20`. Residual: TS wrappers (L1-r5).                                                                                                                  |
| TS1-r4     | Reshaped answers fail; positive controls                           | Yes                        | `check-package-manager.ts:28-38`; tests `:55-58`; `ci.yml:118-123` exits 0 locally and would fail if either check stopped catching.                                                                                  |
| T7         | LH thresholds; isolation proof; runtime telemetry                  | **Partly**                 | `lighthouse-config.test.ts:34-42` pins all four. Isolation: positive control plus `bad address` from redis and postgres (`ci.yml:222-229`, green in CI; not reproduced here). Runtime telemetry check inert (T7-r5). |
| D6         | Corepack, host exposure, ADR 0018                                  | Yes                        | `README.md:22-25`, ADR 0014:82-84 (`COREPACK_NPM_REGISTRY`); ADR 0013:66-73 and register row 31; ADR 0018 Context.                                                                                                   |
| D1/D2      | History                                                            | No (owner)                 | Unchanged; no waiver recorded.                                                                                                                                                                                       |
| ADR items  | 0013–0018 per round-4 fix 7                                        | Mostly                     | See the ADR table. 0015 still omits the clock residual; 0016 overstates the guard; 0018 has a new unstated risk.                                                                                                     |
| Note       | `fonts/index.ts` comment split                                     | Yes                        | `src/shared/ui/fonts/index.ts:12-18`.                                                                                                                                                                                |
| G1         | Pinned config, banned files and markers, CODEOWNERS                | **Partly**                 | Pinned `--config` and root-file ban verified; markers outside scorecards caught; `.gitleaksignore` reasons tested (`gitleaksignore.test.ts`). `docs/scorecards/` bypass (T9).                                        |
| G2, G5, G6 | Docs and env rules                                                 | Yes                        | ADR 0013, README Docker ≥ 28, register rows 27, 31, 32; env rules as measured above.                                                                                                                                 |
| G4         | `createElement`, spread, `srcDoc`                                  | Yes                        | `eslint.config.mjs:122-126`; fixture `unsafe-code.tsx:8-10`.                                                                                                                                                         |

Commit-body measurements: `3e876b9` (fails on the previous code, `/fa` `/en` static) verified;
`c90dce9` (five accepted cases now rejected) verified; `563ed4e` (positive controls) verified;
`e7c0e5b` ("both negative cases … fail") true outside `docs/scorecards/` only; `e5714ba` ("fails
with telemetry switched on") true of the step, false of the line it added. The author's local
Lighthouse figures quoted in the brief (`/en` FCP about 1,080 ms against about 780 ms on `/fa`;
variance driven by TBT) reproduce; the experiment without Shippori was not repeated, because the
per-metric weights show FCP cannot move the score by more than 0.1 here.

## Phase-00 deliverables (`docs/phases/phase-00.md`, PRs 0.1–0.4)

| PR  | Deliverable                                                                | Status                    | Evidence                                                            |
| --- | -------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| 0.1 | Next.js App Router, strict TS + `noUncheckedIndexedAccess`, pnpm, `.nvmrc` | Done                      | `tsconfig.json`, `package.json:7-9`, `.nvmrc`                       |
| 0.1 | Strict ESLint + `eslint-plugin-boundaries`                                 | Done (L1-r5 residual)     | `eslint.config.mjs`; boundary fixtures                              |
| 0.1 | Prettier, Husky + lint-staged, Commitlint                                  | Done                      | `.husky/*`, configs; CI commitlint                                  |
| 0.1 | `pnpm verify`; module folders with `index.ts`                              | Done                      | `package.json:23`; ten modules                                      |
| 0.2 | Compose: Postgres (`btree_gist`), Redis, MinIO                             | Done, with deviation      | SeaweedFS (ADR 0013, owner acceptance pending); CI `services` green |
| 0.2 | `env.ts` validation; `.env.example` placeholders only                      | Done                      | Measured above                                                      |
| 0.3 | next-intl `fa`/`en`, `[locale]`, `dir`/`lang`                              | Done (A5 on the 404 link) | E2E; probes above                                                   |
| 0.3 | Self-hosted WOFF2 subsets; Peyda slot; formatters at 100 %                 | Done                      | Coverage 100 %; fonts 4/5 per page                                  |
| 0.4 | Actions: cached install, verify, Playwright fa/en, LHCI                    | Done                      | `ci.yml:125-176`                                                    |
| 0.4 | Vitest 90 % threshold on `domain`; axe in Playwright                       | Done                      | `vitest.config.mts`; `hello.spec.ts`, `not-found.spec.ts`           |
| —   | **Phase gate:** green pipeline, bilingual RTL hello page, Lighthouse ≥ 95  | **Met**                   | CI green; median assertion green; local samples pass                |

MinIO → SeaweedFS is unchanged: `docs/phases/phase-00.md:15` still names MinIO, so PR 0.2 must not
be ticked until the owner accepts ADR 0013 or amends the phase file.

## ADR scores (rubric: problem 20 · alternatives 20 · trade-offs 25 · Iran fit 20 · revisit 15)

| ADR                         | Problem | Alternatives | Trade-offs | Iran fit | Revisit | Total   | Reasons for every point lost                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------- | ------- | ------------ | ---------- | -------- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0013 SeaweedFS for local S3 | 20      | 19           | 25         | 20       | 15      | **99**  | −1 alternatives (unchanged): option D is rejected without being tried (`:39`). Both round-4 trade-off points are fixed: the presigned-URL gap is stated with its Phase 3 owner (`:79-82`), and host access is stated correctly (`:68-71`).                                                                                                                                                                                                                                                                                                                                                                               |
| 0014 Toolchain baseline     | 20      | 20           | 25         | 20       | 15      | **100** | All three round-4 points fixed: the outage dependency (`:74-78`), the complete mirror list including the LHCI Chrome and the freshness endpoints (`:85-88`), and the Corepack registry (`:82-84`, matches Corepack's source).                                                                                                                                                                                                                                                                                                                                                                                            |
| 0015 Rule enforcement       | 20      | 20           | 24         | 20       | 15      | **99**  | Round-4 −2 mostly fixed (false-negative Risk bullet, revisit trigger). −1 trade-offs: the Risk (`:89-94`) frames false negatives as data flow only, but syntactic shapes also pass: TypeScript wrappers (L1-r5), branches deeper than the selectors (one level for tokens and button values, two for text), `type={'submit'}`, method calls on literals. The clock residual round 4 asked to record (`format(d)` with `d` possibly undefined, `:55-56`) is still not named.                                                                                                                                              |
| 0016 Supply-chain controls  | 20      | 20           | 24         | 20       | 15      | **99**  | Round-4 point fixed: the suppression trade-off is stated and reasons are tested. −1 trade-offs (new): `:61-64` says CI fails on an inline suppression "in any commit", but `docs/scorecards/` is exempt and a marked secret there passes (T9). `:66-67` names CODEOWNERS as the mitigation, while the register (row 36) records that code-owner review cannot be required with one maintainer; today the mitigation is the owner reading the diff.                                                                                                                                                                       |
| 0017 Font delivery          | 20      | 20           | 25         | 20       | 15      | **100** | Round-4 point fixed (`:65-67`). Measured here: the late Shippori request adds about 300 ms of simulated FCP on `/en` but at most 0.1 performance points. Recording that number is optional.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 0018 Not-found handling     | 20      | 20           | 23         | 20       | 15      | **98**  | Context and options fixed (the old error document is confirmed on `26e1971`; option F added). −1 trade-offs: the decision rests on `X-NEXT-INTL-LOCALE` (`global-not-found.tsx:18`), an unexported next-intl internal (`next-intl/dist/esm/*/shared/constants.js`); a rename in an upgrade would silently make every 404 Persian. Only the experimental flag is listed as a risk (`:65`). −1 trade-offs: the tree has two locale sources, and anything that resolves the locale implicitly gets Persian. The Decision (`:54-55`) presents the explicit prop as sufficient, and the 404's own link proves otherwise (A5). |

0013, 0015, 0016 and 0018 are at 98 or above but should take the corrections above; 0014 and 0017 are
at 100. All six still say "Amended after round 4; re-score pending" (`docs/adr/0013…0018:5`,
`docs/adr/README.md:17-22`).

## Required fixes, in order (file:line → fix)

1. **A5 + T8, the 404 link:**
   - `src/shared/ui/not-found/index.tsx:14`: `<Link href="/" locale={locale} className="…">`
     (verified in a scratch build: `/en/x` → `/en`, the rest → `/fa`, `/fa` and `/en` stay `●`).
   - `e2e/not-found.spec.ts`:
     - in the raw-HTML test after `:25`, add ``expect(html).toMatch(new RegExp(`<a [^>]*href="/${lang}"`));``;
     - in the browser test after `:36`, add
       ``await expect(page.getByRole('main').getByRole('link')).toHaveAttribute('href', `/${lang}`);``.
   - ADR 0018:54-55: say that everything rendered inside the global 404 must receive the locale
     explicitly, because implicit lookups resolve to `fa` there.
2. **T7-r5** `.github/workflows/ci.yml:221`:
   - replace the line with `docker compose logs objectstore 2>&1 | grep -qi telemetry && exit 1`;
   - prove it on its own: run the step body without `:218-219` against a stack started with
     telemetry on, under `bash -e`. It must fail, and it must pass with the committed compose file;
   - correct the claim in the round-5 response.
3. **T9** `.github/workflows/ci.yml:81-84` and `.github/CODEOWNERS`:
   - keep `':!docs/scorecards'` for the existing history only, and add
     `found+=$(git log --all -E -G"$marker" --format='%h %s' ^fe5b81c -- docs/scorecards)` (empty
     today; it catches the probe). Re-point the cutoff if D1/D2 rewrite history;
   - add `/docs/scorecards/  @HuseinHbz` to `.github/CODEOWNERS`;
   - scorecards from now on must spell the markers split, as `ci.yml:82` does. This one contains
     neither marker.
4. **L1-r5** `eslint.config.mjs:10-11`:
   - `const BRANCH = ':matches(ConditionalExpression, LogicalExpression, TSAsExpression, TSSatisfiesExpression, TSNonNullExpression)';`
     and update its JSDoc ("…or under `as`, `satisfies` or `!`");
   - add fixture lines, each `// expect: no-restricted-syntax`:
     - after `tests/fixtures/src/shared/ui/token-bypasses.tsx:20`:
       `export const asConst = { color: 'red' as const };` and
       `export const Satisfied = () => <p style={{ padding: 8 satisfies number }} />;`;
     - after `tests/fixtures/src/shared/ui/literal-text-bypasses.tsx:15`:
       `export const AsConstChild = () => <p>{'Hello' as const}</p>;` and
       `export const AsConstLabel = () => <p aria-label={'Close' as const} />;`;
   - update the counts at `tests/lint-rules.test.ts:140` (20 → 22) and `:151` (17 → 19).
5. **D7:**
   - `next.config.ts:42-43`: "the one 404 for every unmatched path (ADR 0018)";
   - `e2e/not-found.spec.ts:10`: drop "Single segments … : the global 404";
   - AC17 (`platform-foundation.md:32`), `CHANGELOG.md:11`, `env.ts:3`: "common spellings
     (change-me, change_me, change.me, changeme, any case), also percent-encoded once";
   - `README.md:47-48`, `CHANGELOG.md:17`, ADR 0016:61-64: true once fix 3 lands; otherwise name
     the `docs/scorecards/` exemption;
   - `docs/adr/README.md:24`: "the latest scorecard lists what each ADR needs to reach 98".
6. **ADRs:**
   - write the scores above into `docs/adr/0013…0018:5` and `docs/adr/README.md:17-22`;
   - 0015: extend the Risk bullet (`:89-94`) with the syntactic misses listed in the ADR table and the
     `format(maybeUndefined)` clock residual;
   - 0016: per D7, and replace the CODEOWNERS sentence at `:66-67` with "with one maintainer,
     CODEOWNERS only documents ownership (register, branch protection); the owner reviews the
     diff";
   - 0018: add both trade-offs from the ADR table to Consequences, and "next-intl renames its locale
     header" to Revisit when;
   - 0017 (optional): the `/en` simulated-FCP figure.
7. **D1 + D2:** the product owner either approves a force-push to this branch (move the
   `docs/project-plan.md` hunk out of `c2d2e84`; split `d0d1e50`, `a701e1f`, `3441445`, `7e101c2`,
   `5af3007`, `c25ba2d`), or records a written waiver. Either one removes these deductions; a
   squash merge does not.
8. **Product owner, outside the diff:**
   - add the `main` ruleset before merging (N3; still `protected: false` and no rulesets today);
   - accept ADR 0013 or amend `docs/phases/phase-00.md:15`;
   - decide repository visibility;
   - answer the plan §11 questions that keep ADRs 0010 and 0011 `Proposed`.

## Notes (not deducted)

- **Lighthouse margin.** Both local samples pass with `/fa` 98 and `/en` 97. Individual runs still drop
  to 85–92 on `/fa` (TBT 328–427 ms) and 94 on `/en` (simulated LCP up to 2,871 ms), so the median of
  5 is what keeps the gate stable. As in round 4: never re-run a red Lighthouse job until it turns
  green; raise `numberOfRuns` (odd) if CI starts flaking.
- `scripts/check-package-manager.ts:32`: `{ pnpm: null }` is still read as "no advisories" (`?? []`),
  although the JSDoc at `:21-22` says any other shape fails. The npm API never answers that way. If
  you touch the file, return `[]` only when the key is absent, and require an array otherwise.
- The global 404 is now rendered per request (`ƒ /_not-found`). That is cheap, but it belongs in the
  Phase 5 rate limits.
- A proxy-skipped path under a locale (`/en/logo.png`) gets the Persian 404, as ADR 0018 and
  `global-not-found.tsx:14-15` state.
- The lint residuals beyond fix 4 (deeper branches, `type={'submit'}`, `{'Yes'.toUpperCase()}`,
  `{['Yes', 'No'][i]}`) are rare; recording them in ADR 0015 (fix 6) is enough for Phase 0.
- Round-4 notes that still stand: `money.ts:22` and `date.ts:22` default to the literal `'fa'`, and
  `(site)/page.tsx:21` hard-codes the locale toggle; an `otherLocaleOf()` in `shared/lib/locale.ts`
  would remove both.
- The CI log line added in `fe5b81c` cannot be read without a GitHub session that can reach the blob
  host. Annotations are served by the plain API (this reviewer read Playwright's that way), so also
  printing the two median rows as a `::notice title=Lighthouse::…` annotation would make the CI
  medians quotable by any reviewer.
