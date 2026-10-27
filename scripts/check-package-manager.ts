/**
 * Fails when the pinned package manager (`packageManager` in package.json) has a High or
 * Critical advisory. `pnpm audit` does not audit pnpm itself, and Dependabot does not
 * track the field (ADR 0014). Uses the npm registry's bulk advisory API, as `npm audit` does.
 * Usage: node scripts/check-package-manager.ts
 */
import { readFileSync } from 'node:fs';

export type Advisory = { severity: string; title?: string; url?: string };

/** Splits `pnpm@10.34.9+sha512.…` into its name and version. */
export function parsePackageManager(field: string): { name: string; version: string } {
  const match = /^([a-z0-9-]+)@(\d+\.\d+\.\d+)/.exec(field);
  if (!match?.[1] || !match[2]) throw new Error(`Unrecognised packageManager: "${field}"`);
  return { name: match[1], version: match[2] };
}

/** Advisories that block: High or Critical. */
export function blockingAdvisories(advisories: Advisory[]): Advisory[] {
  return advisories.filter(({ severity }) => severity === 'high' || severity === 'critical');
}

async function main(): Promise<void> {
  const manifest = JSON.parse(readFileSync('package.json', 'utf8')) as { packageManager?: string };
  const { name, version } = parsePackageManager(manifest.packageManager ?? '');
  const response = await fetch('https://registry.npmjs.org/-/npm/v1/security/advisories/bulk', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ [name]: [version] }),
  });
  if (!response.ok) throw new Error(`npm advisory API returned ${String(response.status)}`);
  const result = (await response.json()) as Record<string, Advisory[] | undefined>;
  const blocking = blockingAdvisories(result[name] ?? []);
  if (blocking.length === 0) return;
  for (const { severity, title, url } of blocking) {
    console.error(`${name}@${version}: ${severity}: ${title ?? ''} ${url ?? ''}`);
  }
  process.exit(1);
}

if (import.meta.filename === process.argv[1]) await main();
