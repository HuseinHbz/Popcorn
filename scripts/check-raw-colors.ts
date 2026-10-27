/**
 * Fails when a stylesheet under src/ uses a raw colour outside a Tailwind `@theme`
 * block, the only token source (CLAUDE.md: "Only design tokens"). TS/TSX files are
 * covered by ESLint; SVG files are brand artwork and are exempt.
 * Usage: node scripts/check-raw-colors.ts
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/g;

export type RawColor = { line: number; match: string };

/** Blanks out every `@theme { … }` block, keeping line numbers intact. */
function withoutThemeBlocks(css: string): string {
  return css.replace(/@theme\b[^{]*\{[^}]*\}/g, (block) => block.replace(/[^\n]/g, ' '));
}

/** Returns each raw colour found outside `@theme` blocks, with its 1-based line. */
export function findRawColors(css: string): RawColor[] {
  const found: RawColor[] = [];
  withoutThemeBlocks(css)
    .split('\n')
    .forEach((text, index) => {
      for (const match of text.matchAll(RAW_COLOR))
        found.push({ line: index + 1, match: match[0] });
    });
  return found;
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
