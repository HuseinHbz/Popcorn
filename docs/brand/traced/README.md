# Traced brand marks (provisional)

Single-colour SVG marks traced from the raster logos in `../source/` on 2026-11-05. Each file is one
`<svg>` with `fill="currentColor"` and `fill-rule="evenodd"` and only `<path d>` children, so one
file serves both themes: the mark takes the theme's text colour (`ink` on light, `washi` on dark).

| Brand    | File               | Traced from                              | viewBox   |
| -------- | ------------------ | ---------------------------------------- | --------- |
| Nakaya   | `nakaya-mark.svg`  | `nakaya-logo-white-on-black.jpg` (1080²) | 781 × 364 |
| Izakaya  | `izakaya-mark.svg` | `izakaya-logo-white-on-black.png` (447²) | 382 × 102 |
| em. café | `em-cafe-mark.svg` | `em-cafe-logo-black-on-white.png` (447²) | 250 × 134 |

## Method

Greyscale → mark isolated by luminance (inverted for white-on-black sources) → trimmed to the mark
with a 3 px margin → 8× Lanczos upscale of the anti-aliased edges → threshold at 50% → potrace
(`turdsize 40`, `alphamax 1.0`, `opttolerance 0.4`) → coordinates scaled back to source pixels.

## Limits

- Sharp at header and hero sizes. At large magnification the Izakaya strokes show slight
  unevenness, because its source is 447 px. Not for print.
- Replace with the restaurant's original vector files when they arrive (admin upload, PR 3.6).
- Visual approval by the product owner is required before PR 1.1e is reviewed.
