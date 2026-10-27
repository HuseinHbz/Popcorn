/**
 * Prints Lighthouse CI scores per URL as a Markdown table: the median across runs
 * and the min–max range, so the numbers behind the CI gate are visible.
 * Usage: node scripts/lighthouse-summary.ts >> "$GITHUB_STEP_SUMMARY"
 */
import { readFileSync } from 'node:fs';

type ManifestEntry = { url: string; summary: Record<string, number> };

const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'] as const;

function median(sorted: number[]): number {
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[middle] ?? 0)
    : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

function cell(scores: number[]): string {
  const sorted = scores.map((score) => Math.round(score * 100)).sort((a, b) => a - b);
  const [min, max] = [sorted[0] ?? 0, sorted[sorted.length - 1] ?? 0];
  return min === max ? `${min}` : `${median(sorted)} (${min}–${max})`;
}

export function lighthouseTable(manifest: ManifestEntry[]): string {
  const urls = [...new Set(manifest.map((entry) => entry.url))];
  const rows = urls.map((url) => {
    const runs = manifest.filter((entry) => entry.url === url);
    const cells = CATEGORIES.map((category) => cell(runs.map((run) => run.summary[category] ?? 0)));
    return `| ${new URL(url).pathname} | ${String(runs.length)} | ${cells.join(' | ')} |`;
  });
  return [
    '### Lighthouse (mobile): median (min–max) across runs',
    '',
    `| Page | Runs | ${CATEGORIES.join(' | ')} |`,
    `| --- | --- | ${CATEGORIES.map(() => '---').join(' | ')} |`,
    ...rows,
  ].join('\n');
}

if (import.meta.filename === process.argv[1]) {
  const manifest = JSON.parse(
    readFileSync('.lighthouseci/manifest.json', 'utf8'),
  ) as ManifestEntry[];
  console.log(lighthouseTable(manifest));
}
