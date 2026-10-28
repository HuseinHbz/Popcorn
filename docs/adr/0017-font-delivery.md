# ADR 0017: Font delivery — vendored static subsets, no metric fallback, Peyda slot

- Status: Proposed
- Date: 2026-10-27
- Score: 100/100 (code review round 5, at `fe5b81c`, `docs/scorecards/phase-0/foundation-round-5.md`). Amended after round 5; re-score pending.
- Implements: ADR 0012 (Peyda headlines, Vazirmatn body, Shippori Mincho Latin display)

## Context

ADR 0012 chose the faces but not how they are delivered. Three facts from Phase 0 shape the
delivery:

- **Performance.** The DoD requires Lighthouse ≥ 95 on throttled mobile. With the variable
  Vazirmatn, shaping Persian text cost about 270 ms of layout and `/fa` scored 0.79–0.95.
  With static 400/700 files, layout was about 30 ms and all 12 runs scored 0.95–0.99.
- **Correctness.** `next/font` adds a size-adjusted fallback, `local("Arial")`, with no
  `unicode-range`. Placed between the Latin and Arabic-script subsets, it rendered Persian in
  Arial wherever Arial has Arabic glyphs (Windows).
- **Licensing.** Peyda is commercial, and this repository is **public**. Its files cannot be
  committed.

Google Fonts is not an option, because it is unreliable from Iran (ADR 0008).

## Options considered

| Option                                                                   | Pros                                                                                      | Cons                                                                               |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| A. `@fontsource` CSS import from `node_modules`                          | Zero setup                                                                                | No preload; no build-time control of the fallback; ties the build to pnpm's layout |
| B. Variable font via `next/font/local`                                   | One file, every weight                                                                    | Measured ~270 ms layout on `/fa` and Lighthouse below 95                           |
| **C. Vendored static subsets via `next/font/local`, no metric fallback** | Measured 0.95–0.99; files and licences live in the repo with checksums; build-independent | Each new weight is a deliberate addition (~20 KB each)                             |
| D. System fonts only                                                     | Fastest                                                                                   | Breaks the brand (ADR 0012)                                                        |

## Decision

Option C:

- **Vazirmatn** 400/700, Latin and Arabic-script subsets, as separate families so the browser
  picks per glyph. Both are preloaded.
- **Shippori Mincho** 400, Latin subset only, not preloaded.
- **`unicode-range` on every face**, copied from `@fontsource` 5.3.0 `unicode.json`, so a browser
  downloads a face only for text it covers. The Arabic range also lists U+0020 and U+00A0, whose
  glyphs that file contains: CSS takes line metrics from the first face whose range covers the
  space, and without them a Persian heading downloaded Shippori without rendering any of it.
- **Heading order by locale:** English headings lead with Shippori Mincho, then the Persian slot.
  Persian headings lead with the Persian slot, so Shippori is fetched only for Latin letters in
  them. Measured: `/fa` requests 4 font files (Vazirmatn only), `/en` requests 5.
- Files and OFL licences are vendored in `src/shared/ui/fonts/files`, byte-identical to
  `@fontsource` 5.3.0, with SHA-256 checksums in `SHA256SUMS`.
- `adjustFontFallback: false`. The body stack lists both Vazirmatn subsets before any system
  face.
- **Peyda slot:** the `--font-heading-fa` CSS variable points at Vazirmatn until Peyda's web
  licence is confirmed. Adding Peyda means one `localFont` declaration and one line of CSS.
  Its files must come from a private source (the deploy host) while the repository is public.
  Its `unicode-range` must include the space (or be omitted); the E2E font test fails otherwise.
- An E2E test asserts the stacks per locale, that both Vazirmatn subsets load on every page, and
  that Shippori loads on `/en` but not on `/fa`.

## Consequences

- **Cost:** about 100 KB of WOFF2 in the repository. Persian pages preload about 75 KB of fonts.
- **Risk:**
  - A future design needing more weights adds bytes. Each addition is measured against the
    Lighthouse gate in CI.
  - Without metric adjustment, a font swap can shift layout. The measured CLS was ≤ 0.002.
  - On `/en` the heading's Shippori Mincho is not preloaded, so the heading first renders in the
    fallback and swaps when the face arrives. The round-4 code review measured no LCP cost: the
    fonts are not on the LCP path. Lighthouse's simulation does count the request toward FCP:
    about 1,070 ms on `/en` against 780 ms on `/fa` (measured; without Shippori in the stack,
    `/en` fell to about 770 ms), worth at most 0.1 points (round-5 review). CI medians at
    `fe5b81c`: 99 on both pages.
- **Reversibility:** high. Switching to a variable font or another face is a font-module and
  CSS change, and the E2E font test pins the expectation.
- **Iran fit:** no runtime font request leaves the server, and files are not fetched at build
  time either.

## Revisit when

- the design system (Phase 1) needs three or more weights of one family (re-measure the
  variable font), or
- Peyda's licence and files arrive, or
- Lighthouse mobile median drops below 95 on any public page because of fonts.
