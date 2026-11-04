# ADR 0019: Runtime brand identity — logos and brand colours set in the admin panel

- Status: Proposed
- Date: 2026-11-04
- Score: not yet reviewed
- Related: ADR 0005 (RBAC), ADR 0012 and 0017 (fonts), ADR 0013 (object storage), plan §4

## Context

The product owner wants each brand's logo and colours changeable from the admin panel, without a
deploy, and with a contrast check. The plan (§4) had assumed brand colours would be derived from
the logo files and fixed in `tokens.json`, which blocked PR 1.1.

The current logos were received on 2026-11-04 as raster files (kept for reference in
`docs/brand/source/`):

| Brand    | File                                | Size      | Colours                |
| -------- | ----------------------------------- | --------- | ---------------------- |
| Nakaya   | `nakaya-logo-white-on-black.jpg`    | 1080×1080 | white on black         |
| Izakaya  | `izakaya-logo-white-on-black.png`   | 447×447   | white on black         |
| em. café | `em-cafe-logo-black-on-white.png`   | 447×447   | black on white         |

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
   colours, type scale, spacing (multiples of 8), radius, motion, z-index.
2. **Per brand, in `brand_settings` (editable, permission `brand:update`):**
   - `logo_on_light` (dark mark, for light backgrounds), `logo_on_dark` (light mark, for dark
     backgrounds), `favicon`, `og_image`
   - `accent_light` (used on the light theme, checked against `washi`) and `accent_dark` (used on
     the dark theme, checked against `ink`). One colour cannot serve both: the plan's `shu` is 5.81:1
     on `washi` but 2.81:1 on `ink`, and `kin` is 7.45:1 on `ink` but 2.20:1 on `washi`.
   - every value has a code default, so the site renders with no row in the table
3. **Derived, never stored:** hover, pressed, subtle and on-accent text colours are computed from
   each accent in OKLCH by one pure function in `src/modules/brand/domain`.
4. **Delivery:** the server layout resolves the brand and injects its CSS variables (`--accent`,
   `--accent-hover`, `--on-accent`, …) in a `<style>` block with the CSP nonce. Components use only
   semantic variable names. No client-side fetch, so no flash of default colours. Values are cached
   and revalidated with `revalidateTag('brand:<slug>')` on save.
5. **Contrast check on save (server-side, blocks the save):**
   - `accent_light` vs `washi` and `accent_dark` vs `ink`: ≥ 3:1 (UI components, large text,
     WCAG 1.4.11)
   - computed `on-accent` text vs each accent: ≥ 4.5:1
   - a value that fails is rejected with the measured ratio and the nearest passing lightness
6. **Logo upload safety:** SVG, PNG or WebP only, MIME sniffed, size capped. SVG is sanitised
   server-side (no scripts, event handlers, `foreignObject`, external references) and served with
   `Content-Type: image/svg+xml` and `Content-Security-Policy: default-src 'none'`. Raster logos get a
   minimum size (512 px) so they stay sharp.
7. **Change control:** preview before publish, version history with one-click rollback, every change
   in `audit_logs`.
8. **Provisional defaults until the owner picks accents:** all three brands start with
   `accent_light` = the plan's `shu` `#A8322A` (5.81:1 on `washi`) and `accent_dark` = `kin`
   `#B8A07A` (7.45:1 on `ink`), marked `provisional` in `tokens.json`. Both on-accent texts pass
   4.5:1 (`washi` on `shu` 5.81:1, `ink` on `kin` 7.45:1).

## Consequences

- Phase 1 is unblocked: PR 1.1 builds tokens with neutrals and provisional brand defaults; PR 1.2 to
  1.4 use semantic variables only.
- New admin PR 3.6 (brand settings page) and a `brand` module with `domain`, `server` and `ui`.
- The contrast tests in PR 1.1 run on the defaults; the same domain function guards admin saves, so
  one implementation covers both.
- Vector logo files are still wanted for print (QR stands, receipts) and crisp large sizes, but no
  longer block anything. The Izakaya and em. café files received are 447×447, below the 512 px
  minimum in point 6: they are used as code defaults now, and the admin upload will reject files that
  small, so a vector or a larger raster must be supplied before they can be replaced through the admin.

## Revisit when

- The owner wants more than the two editable accents per brand, or per-branch theming.
- A brand adopts a coloured logo (then `accent` defaults should come from it).
- Runtime injection measurably hurts LCP or caching (Lighthouse < 95).
