# ADR 0018: Not-found handling — localized 404s that are never cached

- Status: Proposed
- Date: 2026-10-27
- Score: pending independent review (rubric: docs/project-plan.md §3)
- Related: ADR 0014 (Next.js 16 conventions), story platform-foundation AC19

## Context

Every page lives under the `[locale]` segment, and the locale proxy (`src/proxy.ts`) skips API
routes, Next internals, `/t/*` and paths that look like static files. An unknown path therefore
reaches Next.js in one of three shapes:

- **Under a locale** (`/fa/x`): the catch-all page calls `notFound()`; the `[locale]` layout and
  `not-found.tsx` render a localized 404. Rendered on demand, `Cache-Control: no-store`.
- **Several segments outside a locale** (`/t/x`, `/api/x`): the same route, with `t` or `api`
  as the locale parameter; the document falls back to Persian. Also `no-store`.
- **One segment outside a locale** (`/api`, `/robots.txt`, `/x.png`): it matches the
  pre-rendered home page `/[locale]` with an unknown parameter. With the default
  `dynamicParams = true`, Next generates that page on demand, the page answers `notFound()`, and
  the 404 is stored in the incremental cache and sent with `s-maxage=31536000`
  (security review round 3, F3; measured: `x-nextjs-cache: HIT` on the second request).

A year-long 404 outlives the route added later (`robots.txt` and `sitemap.xml` arrive in Phase 5)
in any cache in front of the app, and every distinct path takes a slot in the (size-bounded)
incremental cache.

Constraints: every 404 must stay localized, set `lang`/`dir` and pass axe (AC19, the DoD); `/fa`
and `/en` must stay statically pre-rendered (Lighthouse ≥ 95); no second copy of the 404 page.

## Options considered

| Option                                                                      | Pros                                                                        | Cons                                                                                                  |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| A. Keep `dynamicParams = true`                                              | No change                                                                   | The year-long cached 404 above                                                                        |
| B. `dynamicParams = false` alone                                            | Unknown parameters are rejected, not generated or cached                    | Next serves its built-in English 404: no `lang`, no `dir`, axe `html-has-lang` fails (measured)       |
| C. `force-dynamic` on the home page                                         | No cached 404                                                               | `/fa` and `/en` lose static pre-rendering, which the Lighthouse gate depends on                       |
| D. Route handlers for `/api` and each file name                             | Stable APIs only                                                            | Has to enumerate every single-segment shape (`/x.png`, `/x.txt`, …); misses the next one              |
| **E. `dynamicParams = false` + `global-not-found.tsx` (experimental flag)** | Unknown parameters never render or cache; one localized 404 for all of them | Depends on `experimental.globalNotFound`, which could change or be removed in a Next.js minor release |

## Decision

Option E:

- `src/app/[locale]/(site)/page.tsx` exports `dynamicParams = false`, so only `fa` and `en` exist.
- `src/app/global-not-found.tsx` (enabled by `experimental.globalNotFound` in `next.config.ts`)
  renders the 404 for every path no route matches.
- The document shell (`src/shared/ui/document`) and the 404 body (`src/shared/ui/not-found`) are
  shared by the `[locale]` layout, `[locale]/not-found.tsx` and the global 404, so there is one
  page in two places, not two pages.
- `e2e/not-found.spec.ts` covers all three shapes, in both viewports: status 404, localized
  heading, `lang`/`dir`, 0 axe violations and `Cache-Control` containing `no-store`.

## Consequences

- **Cost:** one experimental flag and two small shared components.
- **Risk:** the flag may change between Next.js releases. If it breaks, the E2E cases for `/api`,
  `/robots.txt` and `/no-such-image.png` fail in CI, so an upgrade cannot silently regress.
- **Reversibility:** high. Removing the flag, the file and the `dynamicParams` line restores
  option A.
- **Iran fit:** no effect; everything is served by the app.

## Revisit when

- `globalNotFound` becomes stable or is removed upstream (drop the flag, or move to its successor),
  or
- Phase 5 adds `robots.txt`, `sitemap.xml` or other root files: they are routes of their own and
  take precedence over the global 404, which the E2E list must then stop expecting.
