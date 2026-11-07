# ADR 0019: Runtime brand identity — logos and brand colours set in the admin panel

- Status: Proposed
- Date: 2026-11-04
- Score: not yet reviewed
- Amended: 2026-11-07, for the owner decisions of 2026-11-04 and 2026-11-05 (A1–A5, at the end).
  Points 1, 2, 3, 4, 5, 6 and 8 below are the amended text.
- Related: ADR 0005 (RBAC), ADR 0012 and 0017 (fonts), ADR 0013 (object storage), plan §4

## Context

The product owner wants each brand's logo and colours changeable from the admin panel, without a
deploy, and with a contrast check. The plan (§4) had assumed brand colours would be derived from
the logo files and fixed in `tokens.json`, which blocked PR 1.1.

The current logos were received on 2026-11-04 as raster files (kept for reference in
`docs/brand/source/`):

| Brand    | File                              | Size      | Colours        |
| -------- | --------------------------------- | --------- | -------------- |
| Nakaya   | `nakaya-logo-white-on-black.jpg`  | 1080×1080 | white on black |
| Izakaya  | `izakaya-logo-white-on-black.png` | 447×447   | white on black |
| em. café | `em-cafe-logo-black-on-white.png` | 447×447   | black on white |

A pixel scan found 0% chromatic pixels in all three. The logos are strictly monochrome, so **no brand
colour can be derived from them**: any accent colour is a design choice, not a brand fact. This also
means each logo needs only a light and a dark variant and works on the neutral `ink`/`washi` palette.

## Options considered

- **Brand colours fixed in `tokens.json`** — simplest, but every change needs a deploy, and it
  blocked Phase 1 until colours were known.
- **Whole palette editable in the admin** — maximum freedom, but a few edits can break contrast and
  the restrained look; every component would have to be tested against arbitrary palettes.
- **Chosen:** structural tokens and neutrals stay in code; a small, validated set of brand values is
  editable at runtime.

## Decision

1. **In code (`tokens.json`, not editable):** neutrals (`ink`, `washi`, `stone`, `ash`), status
   colours, type scale, spacing (multiples of 8), radius, motion, z-index, and the accent
   derivation steps. Form-control borders are neutral: `stone` on the light theme (6.14:1 on
   `washi`) and `ash` on the dark theme (6.17:1 on `ink`), never `kin` or an accent (A2).
2. **Per identity, in `brand_settings` (editable, permission `brand:update`):** the identities are
   the group (`/fa`, `/en` and every 404) and the three brands.
   - `default_theme` (`light` or `dark`): the theme the identity's pages render in (A1).
   - `logo`: one SVG mark per identity, for both themes, plus an optional second variant only if
     a mark needs one; the group has none yet (A5). `favicon`, `og_image`.
   - `accent_light` (used on the light theme, checked against `washi`) and `accent_dark` (used on
     the dark theme, checked against `ink`). One colour cannot serve both: the plan's `shu` is
     5.81:1 on `washi` but 2.81:1 on `ink`, and `kin` is 7.45:1 on `ink` but 2.20:1 on `washi`.
   - every value has a code default, so the site renders with no row in the table
3. **Derived, never stored:** hover, pressed, subtle and on-accent are computed in OKLCH by one
   pure function, `deriveAccentFamily` (`src/modules/brand/domain/accent.ts`), from the accent and
   the theme's context (its neutrals and the steps, from `tokens.json`). hover and pressed move
   0.06 and 0.12 in lightness away from the theme background, keeping hue; subtle is the
   background moved the same way (0.04 light, 0.06 dark) with at most 0.03 of the accent's
   chroma; on-accent is whichever of `ink` and `washi` contrasts more with the accent.
4. **Delivery (A1, A4):** each route's root layout sets `data-theme` (the identity's
   `default_theme`) and, on brand pages, `data-brand` on `<html>` at build time, and links
   `/theme/<identity>.css` in `<head>`. That static stylesheet holds only the accent family for
   both themes, built only from `accepted` checks; any other value falls back to the code default.
   There is no inline `<style>` and no nonce, so the CSP does not change. Components use only
   semantic variable names. No client-side fetch, so no flash of default colours. Public pages
   ignore `prefers-color-scheme` and v1 has no visitor toggle; the admin is dark (PR 1.4). Values
   are cached and revalidated with `revalidateTag('brand:<slug>')` on save (PR 3.6).
5. **Contrast check (A3):** `checkAccent` (`src/modules/brand/domain/check.ts`) runs before every
   save (through `checkAccentFor`, PR 3.6) and when the stylesheet is built. A failing value
   blocks the save. Every rule asks for 4.5:1 (WCAG 1.4.3, normal-size text), so the accent may
   colour links:
   - `--accent`, `--accent-hover` and `--accent-pressed` on the theme background;
   - `--on-accent` on each of those three;
   - primary and secondary text on `--accent-subtle`.

   Pass or fail uses the unrounded ratio; messages round down, so a failure never reads 4.50.
   Anything but an opaque `#rrggbb` is `invalid`. A `rejected` value carries every failing rule
   with its measured and required ratio, and the nearest passing colour: same hue and chroma
   (chroma lowered only where sRGB requires), as an OKLCH lightness and a `#rrggbb`.

6. **Logo upload safety (A5):** the logo is an SVG mark that passes the path-only allowlist in
   `parseMark` (`src/modules/brand/domain/mark.ts`, the owner's allowlist of 2026-11-05): one
   `<svg>` with only `xmlns`, `viewBox`, `fill="currentColor"` and `fill-rule="evenodd"`, and one
   or more `<path>` with only `d` and an optional `fill-rule="evenodd"`. Anything else is rejected.
   The mark is rendered inline and coloured with the theme's text colour, so one file serves both
   themes. Uploads are MIME sniffed and size capped. The 512 px minimum applies to raster uploads
   only.
7. **Change control:** preview before publish, version history with one-click rollback, every change
   in `audit_logs`.
8. **Provisional defaults until the owner picks accents:** every identity, the group included,
   starts with `accent_light` = the plan's `shu` `#A8322A` (5.81:1 on `washi`) and `accent_dark` =
   `kin` `#B8A07A` (7.45:1 on `ink`), marked `provisional` in `tokens.json`. Both on-accent texts
   pass 4.5:1 (`washi` on `shu` 5.81:1, `ink` on `kin` 7.45:1). `default_theme` starts dark for the
   group, Nakaya and Izakaya, and light for em. café.

## Consequences

- Phase 1 is unblocked: PR 1.1 builds tokens with neutrals and provisional brand defaults; PR 1.2 to
  1.4 use semantic variables only.
- New admin PR 3.6 (brand settings page) and a `brand` module with `domain`, `server` and `ui`.
- The contrast tests in PR 1.1 run on the defaults; the same domain function guards admin saves and
  builds the stylesheet, so one implementation covers all three.
- Each page makes one extra same-origin request for its identity's stylesheet (under 1 KB); the
  Lighthouse gate measures it on one page of each identity.
- The raster files received stay in `docs/brand/source/` as references. The code defaults are
  traced SVG marks (PR 1.1e), provisional until the owner approves them. Vector originals are still
  wanted for print (QR stands, receipts), but no longer block anything.

## Revisit when

- The owner wants more than the two editable accents per brand, or per-branch theming.
- A brand adopts a coloured logo (then `accent` defaults should come from it).
- The per-identity stylesheet measurably hurts LCP or caching (Lighthouse < 95).

## Amendments

Owner decisions of 2026-11-04 (A1–A4) and 2026-11-05 (A5), recorded in PR 1.1b.

- **A1, theme per identity.** Was: not covered; the Phase 0 pages were light. Now:
  `default_theme` is an identity setting (point 2), set as `data-theme` at build time (point 4).
  Why: em. café's identity is light, while Nakaya, Izakaya and the group are dark.
- **A2, neutral control borders.** Was: not covered; plan §4 drew gold (`kin`) lines. Now: `stone`
  on light and `ash` on dark (point 1). Why: `kin` is 2.20:1 on `washi`, below the 3:1 non-text
  minimum.
- **A3, a 4.5:1 floor.** Was: the accent on its background ≥ 3:1. Now: every rule ≥ 4.5:1
  (point 5). Why: at 3:1 the accent could not colour normal-size links.
- **A4, a per-identity stylesheet.** Was: an inline `<style>` with the CSP nonce. Now:
  `/theme/<identity>.css` (point 4). Why: pages stay statically prerendered and the CSP stays
  unchanged until the nonce work in Phase 2.
- **A5, one SVG mark.** Was: `logo_on_light` and `logo_on_dark`, as PNG, WebP or SVG of at least
  512 px. Now: one `logo` SVG mark per identity, path-only and coloured by the theme's text colour
  (points 2 and 6). Why: the logos are monochrome, so one traced mark serves both themes.
