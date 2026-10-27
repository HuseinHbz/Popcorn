# ADR 0015: Enforce the engineering rules with tooling, proven by tests

- Status: Proposed
- Date: 2026-10-27
- Score: pending independent review (rubric: docs/project-plan.md §3)
- Related: ADR 0001 (module boundaries), CLAUDE.md "Non-negotiables", ADR 0014 (toolchain)

## Context

CLAUDE.md lists non-negotiables that review alone keeps missing. Plan §3 calls self-review
unreliable, and the Phase 0 reviews proved it. Each of these passed review at least once:

- a file-level `eslint-disable` turned every rule off;
- relative imports reached another module's internals;
- `Date.now()` and `globalThis.fetch` appeared in "pure" code;
- `text-[red]` and hard-coded JSX text slipped through.

Constraints:

- **Module boundaries:** `app → modules/*/server → modules/*/domain`. Only a module's public
  `server/index.ts` may be imported by others, and `domain/` stays pure.
- **Tokens only** for colour, spacing, radius and font.
- **All user-facing text** goes through next-intl.
- **Size limits:** functions ≤ 40 lines, files ≤ 300.
- **Every rule must be proven to fire**, not merely configured.

## Options considered

| Option                                                                                                     | Pros                                                                                  | Cons                                                                                               |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| A. Code review only                                                                                        | No setup                                                                              | What plan §3 calls unreliable; misses recur                                                        |
| B. ESLint `no-restricted-imports` path patterns                                                            | Built in                                                                              | Cannot tell "my module" from "another module"; relative paths bypassed it (found in review)        |
| C. `import/no-restricted-paths`                                                                            | Already a dependency via `eslint-config-next`                                         | Zones are path pairs; "same module" needs one zone per module pair and is not captured generically |
| D. dependency-cruiser                                                                                      | Powerful graph rules, own CI step                                                     | A second rule engine and config language; errors arrive outside the editor's ESLint integration    |
| E. TypeScript project references per module                                                                | Compiler-enforced                                                                     | Ten-plus `tsconfig` projects, slower builds, and still no purity or token rules                    |
| **F. `eslint-plugin-boundaries` + `noInlineConfig` + syntax rules + a CSS check, each proven by fixtures** | One engine, in-editor feedback, captures "same module", checks packages and built-ins | A plugin dependency; regex-based syntax rules can misfire                                          |

## Decision

Option F. Every rule below has a fixture in `tests/fixtures/src`, and `tests/lint-rules.test.ts`
asserts it fires.

- **No inline disables:**
  - `linterOptions.noInlineConfig` ignores and reports inline `eslint-disable`.
  - An exception is an override in `eslint.config.mjs` next to its ADR link. This is stricter
    than CLAUDE.md's "no `eslint-disable` without an ADR link" and implements it.
- **Boundaries:** `eslint-plugin-boundaries` with `checkAllOrigins` and `checkUnknownLocals`.
  - Imports resolve to files, so relative paths and aliases are judged alike.
  - Same-module internals are allowed. Another module is reachable only through `server/index.ts`.
  - `app` never imports `domain`.
  - `domain/` and `shared/lib` import no package and no Node built-in.
- **Pure code:** in `domain/` and `shared/lib`, I/O and ambient globals (`fetch`, `process`,
  `globalThis`, `console`, `crypto`, timers, …), `Date.now()`, `new Date()` and `Math.random()`
  are banned. The clock and randomness are passed in.
- **Tokens:**
  - In TS/TSX, hex and colour-function literals, every Tailwind arbitrary value
    (`text-[red]`, `w-[13px]`) and inline colour values in style objects are banned.
  - In CSS, `scripts/check-raw-colors.ts` bans hex, colour functions and the 148 named colours
    outside `@theme`.
  - SVG files are brand artwork and exempt.
- **i18n:** `react/jsx-no-literals` (props ignored), plus a ban on literal `alt`, `title`,
  `placeholder`, `label` and `aria-*` text.
- **Size and types:** `max-lines-per-function: 40`, `max-lines: 300`, no `any`, no `@ts-ignore`.

## Consequences

- **Cost:** the lint fixture test adds about 6 s. Writing a new rule means writing its fixture.
- **Risk:**
  - The syntax rules are regex-based. A legitimate string that looks like a colour or an
    arbitrary value (for example a URL fragment `#abc`) fails lint, and the fix is a
    config-file override with an ADR link.
  - Banning all arbitrary values means a genuinely new design value must first become a theme
    token. That is intended (CLAUDE.md), but it adds a step.
- **Reversibility:** high. Each rule is a config entry, and removing one is a one-line diff
  whose fixture test then fails visibly.
- **Iran fit:** everything runs offline from the lockfile, with no network service involved.

## Revisit when

- `eslint-plugin-boundaries` cannot express a boundary we need (for example module-to-module
  events in Phase 6), or
- false positives from the syntax rules need more than three config overrides, the sign that a
  regex should become a proper rule.
