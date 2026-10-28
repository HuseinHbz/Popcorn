# ADR 0018: Not-found handling — one server-rendered 404 that is never cached

- Status: Proposed
- Date: 2026-10-27
- Score: 100/100 (code review round 7, at `a3d1e29`, `docs/scorecards/phase-0/foundation-round-7.md`).
- Related: ADR 0014 (Next.js 16 conventions), story platform-foundation AC19

## Context

Every page lives under the `[locale]` segment, and the locale proxy (`src/proxy.ts`) skips API
routes, Next internals, `/t/*` and paths that look like static files. Before this decision an
unknown path reached Next.js in one of two ways, both defective:

- **Under a route** (`/fa/x`, `/en/x`, and `/t/x` or `/api/x`, where `t` or `api` became the
  locale parameter): a catch-all page called `notFound()`. Next.js 16 does not render
  `[locale]/not-found.tsx` on the server in that case; it answers with its error document
  (`<html id="__next_error__">`, no `lang`, no `dir`, no `<h1>`, the site title) and the
  localized page appears only after JavaScript runs. Without JavaScript the page was blank,
  and the server HTML failed axe `html-has-lang` (code review round 4; measured, and present
  since the catch-all was added). The browser-based E2E passed, so it was missed for two rounds.
- **One segment outside a locale** (`/api`, `/robots.txt`, `/x.png`): it matched the
  pre-rendered home page `/[locale]` with an unknown parameter, was generated on demand, and the
  404 was stored in the incremental cache and sent with `s-maxage=31536000` (security review
  round 3, F3; measured: `x-nextjs-cache: HIT` on the second request). A year-long 404 outlives
  a route added later (`robots.txt` and `sitemap.xml` arrive in Phase 5) in any cache in front
  of the app.

Constraints: every 404 must be complete in the server's HTML, localized, with `lang`/`dir`, and
pass axe (AC19, the DoD); `/fa` and `/en` must stay statically pre-rendered (Lighthouse ≥ 95);
one 404 page, not several copies.

## Options considered

| Option                                                                                | Pros                                                                 | Cons                                                                                                                |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| A. Keep the catch-all and `dynamicParams = true`                                      | No change                                                            | Both defects above                                                                                                  |
| B. `dynamicParams = false` alone                                                      | Unknown home-page parameters are rejected, not cached                | Next serves its built-in English 404 for them: no `lang`, no `dir` (measured); the catch-all defect remains         |
| C. `force-dynamic` on the home page                                                   | No cached 404                                                        | `/fa` and `/en` lose static pre-rendering; the catch-all defect remains                                             |
| D. Keep the catch-all and fix its rendering                                           | Locale from the route parameter                                      | Tried: with `notFound()` in `generateMetadata`, and with a synchronous `not-found.tsx`, the error document remained |
| E. Read the locale in `request.ts` from the proxy's header                            | One place for the locale                                             | `headers()` there makes every page dynamic, `/fa` and `/en` included (measured by the code reviewer)                |
| **F. No catch-all; `dynamicParams = false`; `global-not-found.tsx` picks the locale** | Every unknown path gets one server-rendered, localized, uncached 404 | Depends on `experimental.globalNotFound`, which could change in a Next.js minor release                             |

## Decision

Option F:

- No route matches an unknown path: there is no catch-all under `[locale]`, and the home page
  exports `dynamicParams = false`, so only `fa` and `en` exist.
- `src/app/global-not-found.tsx` (enabled by `experimental.globalNotFound` in `next.config.ts`)
  answers every unmatched path, with its own document. It takes the locale from the
  `X-NEXT-INTL-LOCALE` header that the locale proxy sets on every request it handles, so `/en/x`
  is English; paths the proxy skips, and any value that is not a locale, get Persian. A client
  can send that header on a skipped path; the worst outcome is the English 404.
- The document shell (`src/shared/ui/document`) and the 404 body (`src/shared/ui/not-found`) take
  the locale explicitly and are shared with the `[locale]` layout.
- `e2e/not-found.spec.ts` checks every shape (`/fa/x`, `/en/x`, `/t/x`, `/api/x`, `/api`,
  `/robots.txt`, a missing image), on both viewports: the raw server HTML has `lang`, `dir`, the
  localized `<title>` and `<h1>`; in the browser, status 404, 0 axe violations and
  `Cache-Control: no-store`. The raw-HTML check fails on the previous code (measured).

## Consequences

- **Cost:** one experimental flag, one header read per 404 (the 404 is rendered per request).
- **Risk:**
  - The flag may change between Next.js releases; the E2E cases fail in CI if it breaks.
  - A page that calls `notFound()` itself (for example, a menu item that does not exist, Phase 3)
    is not covered: Next.js renders that through the same error document as option D. The first
    such page must be handled and tested the same way, before it ships.
  - The locale comes from next-intl's request header, which next-intl does not export as an API.
    If it is renamed, `/en/x` silently turns Persian; the E2E `/en` case (`lang`, heading, home
    link) fails in CI when that happens.
  - The 404 has its own locale source, apart from the `[locale]` segment the pages use, so
    anything rendered inside it must receive the locale explicitly. A link without it pointed to
    `/fa` on the English 404, in the served HTML and after hydration (code review rounds 5 and
    6); the E2E now checks the home link's target in every case. The header only selects
    between the two locales and must never be read for anything else (security review round 5,
    H7).
- **Reversibility:** high. Restoring a catch-all and removing the flag and the file restores the
  previous behaviour.
- **Iran fit:** no effect; everything is served by the app.

## Revisit when

- the first page calls `notFound()` (Phase 3): decide how it renders on the server, or
- `globalNotFound` becomes stable or is removed upstream (drop the flag, or move to its successor),
  or
- Phase 5 adds `robots.txt`, `sitemap.xml` or other root files: they are routes of their own and
  take precedence, and the E2E list must stop expecting a 404 for them, or
- next-intl renames or stops setting its locale header (upgrade notes; the E2E `/en` case).
