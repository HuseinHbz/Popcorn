/**
 * Fails when Node.js has published a security release in the pinned major line
 * that is newer than `.nvmrc` (Dependabot does not track `.nvmrc`).
 * Usage: node scripts/check-node-version.ts
 */
import { readFileSync } from 'node:fs';

export type NodeRelease = { version: string; security: boolean };

function parse(version: string): [number, number, number] {
  const [major = 0, minor = 0, patch = 0] = version.replace(/^v/, '').split('.').map(Number);
  return [major, minor, patch];
}

function isNewer(a: [number, number, number], b: [number, number, number]): boolean {
  return a[1] > b[1] || (a[1] === b[1] && a[2] > b[2]);
}

/** Security releases in the same major line as `pinned` that are newer than it. */
export function missingSecurityReleases(pinned: string, releases: NodeRelease[]): string[] {
  const current = parse(pinned);
  return releases
    .filter((release) => release.security)
    .map((release) => parse(release.version))
    .filter((version) => version[0] === current[0] && isNewer(version, current))
    .map((version) => version.join('.'));
}

async function main(): Promise<void> {
  const pinned = readFileSync('.nvmrc', 'utf8').trim();
  const response = await fetch('https://nodejs.org/dist/index.json');
  if (!response.ok) throw new Error(`nodejs.org returned ${String(response.status)}`);
  const missing = missingSecurityReleases(pinned, (await response.json()) as NodeRelease[]);
  if (missing.length === 0) return;
  console.error(`.nvmrc pins Node ${pinned}; newer security releases: ${missing.join(', ')}`);
  process.exit(1);
}

if (import.meta.filename === process.argv[1]) await main();
