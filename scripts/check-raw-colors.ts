/**
 * Fails when a stylesheet under src/ uses a raw colour (hex, colour function or CSS
 * named colour) outside a Tailwind `@theme` block, the only token source (CLAUDE.md:
 * "Only design tokens"). TS/TSX files are
 * covered by ESLint; SVG files are brand artwork and are exempt.
 * Usage: node scripts/check-raw-colors.ts
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/g;

/** Declarations whose value can carry a colour, e.g. `color`, `border`, `box-shadow`. */
const COLOR_DECLARATION =
  /(?:^|[;{\s])((?:[a-z-]*-)?(?:color|background|border|outline|fill|stroke|shadow|caret|decoration|column-rule)[a-z-]*)\s*:\s*([^;}]*)/gi;

// The 148 CSS named colours (CSS Color 4), shared with the ESLint token rules.
const NAMED_COLORS = new Set(
  JSON.parse(readFileSync(new URL('named-colors.json', import.meta.url), 'utf8')) as string[],
);

export type RawColor = { line: number; match: string };

/** Blanks out every `@theme { … }` block, keeping line numbers intact. */
function withoutThemeBlocks(css: string): string {
  return css.replace(/@theme\b[^{]*\{[^}]*\}/g, (block) => block.replace(/[^\n]/g, ' '));
}

function namedColorsIn(line: string): string[] {
  return [...line.matchAll(COLOR_DECLARATION)].flatMap((declaration) =>
    (declaration[2] ?? '')
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((word) => NAMED_COLORS.has(word)),
  );
}

/** Returns each raw colour found outside `@theme` blocks, with its 1-based line. */
export function findRawColors(css: string): RawColor[] {
  return withoutThemeBlocks(css)
    .split('\n')
    .flatMap((text, index) => [
      ...[...text.matchAll(RAW_COLOR)].map((match) => ({ line: index + 1, match: match[0] })),
      ...namedColorsIn(text).map((match) => ({ line: index + 1, match })),
    ]);
}

function stylesheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return stylesheets(path);
    return entry.name.endsWith('.css') ? [path] : [];
  });
}

function main(): void {
  const violations = stylesheets('src').flatMap((file) =>
    findRawColors(readFileSync(file, 'utf8')).map(
      ({ line, match }) => `${relative('.', file)}:${line}  raw colour "${match}"; use a token`,
    ),
  );
  for (const violation of violations) console.error(violation);
  if (violations.length > 0) process.exit(1);
}

if (import.meta.filename === process.argv[1]) main();
