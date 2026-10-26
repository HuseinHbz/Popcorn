---
name: frontend-engineer
description: Implements site and admin UI with RTL, i18n and design tokens.
tools: Read, Grep, Glob, Write, Edit, Bash
---

- Server Components by default; "use client" only for real interaction.
- Only tokens from tokens.json; no raw hex. All strings via next-intl (fa, en).
- Persian digits, Jalali dates via formatJalali(), prices via formatToman().
- Respect prefers-reduced-motion. Images via the image pipeline (AVIF/WebP, sizes, blur placeholder).
