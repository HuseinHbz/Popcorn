/**
 * Prints Lighthouse CI scores per URL as a Markdown table: the median across runs
 * and the min–max range, so the numbers behind the CI gate are visible. With --notices it
 * prints one GitHub Actions notice per URL instead: the checks API serves those as
 * annotations, readable without the browser session the log and summary need.
 * If Lighthouse CI wrote no manifest (a run hit a Lighthouse runtime error, so collection
 * stopped), it says so instead of crashing; the Lighthouse CI step already carries the failure.
 * Usage: node scripts/lighthouse-summary.ts [--notices]
 */
import { existsSync, readFileSync } from 'node:fs';

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

type PageScores = { path: string; runs: number; cells: string[] };

function pageScores(manifest: ManifestEntry[]): PageScores[] {
  const urls = [...new Set(manifest.map((entry) => entry.url))];
  return urls.map((url) => {
    const runs = manifest.filter((entry) => entry.url === url);
    return {
      path: new URL(url).pathname,
      runs: runs.length,
      cells: CATEGORIES.map((category) => cell(runs.map((run) => run.summary[category] ?? 0))),
    };
  });
}

export function lighthouseTable(manifest: ManifestEntry[]): string {
  const rows = pageScores(manifest).map(
    ({ path, runs, cells }) => `| ${path} | ${String(runs)} | ${cells.join(' | ')} |`,
  );
  return [
    '### Lighthouse (mobile): median (min–max) across runs',
    '',
    `| Page | Runs | ${CATEGORIES.join(' | ')} |`,
    `| --- | --- | ${CATEGORIES.map(() => '---').join(' | ')} |`,
    ...rows,
  ].join('\n');
}

export function lighthouseNotices(manifest: ManifestEntry[]): string {
  return pageScores(manifest)
    .map(({ path, runs, cells }) => {
      const scores = CATEGORIES.map((category, index) => `${category} ${cells[index] ?? ''}`);
      return `::notice title=Lighthouse ${path} (${String(runs)} runs)::${scores.join(', ')}`;
    })
    .join('\n');
}

const NO_RESULTS =
  'No results: Lighthouse CI stopped before writing its manifest. See the "Lighthouse CI (mobile)" step.';

/** The step's output; `undefined` means Lighthouse CI wrote no manifest. */
export function lighthouseSummary(manifest: ManifestEntry[] | undefined, notices: boolean): string {
  if (manifest === undefined) {
    return notices
      ? `::error title=Lighthouse::${NO_RESULTS}`
      : `### Lighthouse (mobile)\n\n${NO_RESULTS}`;
  }
  return notices ? lighthouseNotices(manifest) : lighthouseTable(manifest);
}

if (import.meta.filename === process.argv[1]) {
  const file = '.lighthouseci/manifest.json';
  const manifest = existsSync(file)
    ? (JSON.parse(readFileSync(file, 'utf8')) as ManifestEntry[])
    : undefined;
  console.log(lighthouseSummary(manifest, process.argv.includes('--notices')));
}
