/**
 * Prints Lighthouse CI scores per URL as a Markdown table: the median across runs
 * and the min–max range, so the numbers behind the CI gate are visible. A second table gives
 * each URL's median FCP, LCP, TBT and CLS, read from the run reports the manifest names. With
 * --notices it prints one GitHub Actions notice per URL instead, scores and metrics together:
 * the checks API serves those as annotations, readable without the browser session the log
 * and summary need.
 * If Lighthouse CI wrote no manifest (a run hit a Lighthouse runtime error, so collection
 * stopped), it says so instead of crashing; the Lighthouse CI step already carries the failure.
 * Usage: node scripts/lighthouse-summary.ts [--notices]
 */
import { existsSync, readFileSync } from 'node:fs';

const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'] as const;

/** The metrics behind the performance score, by their names in a Lighthouse report. */
const METRICS = [
  { name: 'FCP', audit: 'first-contentful-paint', unit: 'ms' },
  { name: 'LCP', audit: 'largest-contentful-paint', unit: 'ms' },
  { name: 'TBT', audit: 'total-blocking-time', unit: 'ms' },
  { name: 'CLS', audit: 'cumulative-layout-shift', unit: '' },
] as const;
type Metric = (typeof METRICS)[number]['name'];
export type Metrics = Partial<Record<Metric, number>>;

/** A manifest row; `metrics` is filled in from the run's report when it can be read. */
export type ManifestEntry = { url: string; summary: Record<string, number>; metrics?: Metrics };

type Report = { audits?: Record<string, { numericValue?: number } | undefined> };

/** A run report's metric values; a metric the report lacks is left out. */
export function reportMetrics(report: Report): Metrics {
  const metrics: Metrics = {};
  for (const { name, audit } of METRICS) {
    const value = report.audits?.[audit]?.numericValue;
    if (typeof value === 'number') metrics[name] = value;
  }
  return metrics;
}

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

/** The median of the runs that have the metric, or n/a when none has it. */
function metricCell(runs: ManifestEntry[], name: Metric, unit: string): string {
  const values = runs.flatMap((run) =>
    run.metrics?.[name] === undefined ? [] : [run.metrics[name]],
  );
  if (values.length === 0) return 'n/a';
  const value = median(values.sort((a, b) => a - b));
  return unit === 'ms' ? `${String(Math.round(value))} ms` : value.toFixed(3);
}

type PageScores = { path: string; runs: number; cells: string[]; metrics: string[] };

function pageScores(manifest: ManifestEntry[]): PageScores[] {
  const urls = [...new Set(manifest.map((entry) => entry.url))];
  return urls.map((url) => {
    const runs = manifest.filter((entry) => entry.url === url);
    return {
      path: new URL(url).pathname,
      runs: runs.length,
      cells: CATEGORIES.map((category) => cell(runs.map((run) => run.summary[category] ?? 0))),
      metrics: METRICS.map(({ name, unit }) => metricCell(runs, name, unit)),
    };
  });
}

export function lighthouseTable(manifest: ManifestEntry[]): string {
  const pages = pageScores(manifest);
  const names = METRICS.map(({ name }) => name);
  return [
    '### Lighthouse (mobile): median (min–max) across runs',
    '',
    `| Page | Runs | ${CATEGORIES.join(' | ')} |`,
    `| --- | --- | ${CATEGORIES.map(() => '---').join(' | ')} |`,
    ...pages.map(({ path, runs, cells }) => `| ${path} | ${String(runs)} | ${cells.join(' | ')} |`),
    '',
    '### Lighthouse metrics (mobile): median across runs',
    '',
    `| Page | ${names.join(' | ')} |`,
    `| --- | ${names.map(() => '---').join(' | ')} |`,
    ...pages.map(({ path, metrics }) => `| ${path} | ${metrics.join(' | ')} |`),
  ].join('\n');
}

export function lighthouseNotices(manifest: ManifestEntry[]): string {
  return pageScores(manifest)
    .map(({ path, runs, cells, metrics }) => {
      const scores = CATEGORIES.map((category, index) => `${category} ${cells[index] ?? ''}`);
      const values = METRICS.map(({ name }, index) => `${name} ${metrics[index] ?? ''}`);
      return `::notice title=Lighthouse ${path} (${String(runs)} runs)::${scores.join(', ')}; median ${values.join(', ')}`;
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

/** Adds each run's metrics from the report the manifest names, when that report exists. */
function withMetrics(entry: ManifestEntry & { jsonPath?: string }): ManifestEntry {
  if (entry.jsonPath === undefined || !existsSync(entry.jsonPath)) return entry;
  return {
    ...entry,
    metrics: reportMetrics(JSON.parse(readFileSync(entry.jsonPath, 'utf8')) as Report),
  };
}

if (import.meta.filename === process.argv[1]) {
  const file = '.lighthouseci/manifest.json';
  const manifest = existsSync(file)
    ? (JSON.parse(readFileSync(file, 'utf8')) as ManifestEntry[]).map(withMetrics)
    : undefined;
  console.log(lighthouseSummary(manifest, process.argv.includes('--notices')));
}
