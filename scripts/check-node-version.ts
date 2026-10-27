/**
 * Fails when Node.js has published a security release in the pinned major line
 * that is newer than `.nvmrc` (Dependabot does not track `.nvmrc`), or when that line
 * has reached end of life and gets no more security releases at all. Warns 90 days ahead.
 * Usage: node scripts/check-node-version.ts [version]
 */
import { readFileSync } from 'node:fs';

export type NodeRelease = { version: string; security: boolean };

/** Shape of nodejs/Release `schedule.json`, read defensively: every field is checked. */
type Schedule = Record<string, { end?: unknown } | null | undefined>;

const EOL_WARNING_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

function parse(version: string): [number, number, number] {
  const [major = 0, minor = 0, patch = 0] = version.replace(/^v/, '').split('.').map(Number);
  return [major, minor, patch];
}

function isNewer(a: [number, number, number], b: [number, number, number]): boolean {
  return a[1] > b[1] || (a[1] === b[1] && a[2] > b[2]);
}

/** Validates nodejs.org's `index.json`: a changed or empty answer fails instead of passing. */
export function parseReleases(data: unknown): NodeRelease[] {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('nodejs.org index.json: expected a non-empty array');
  }
  return data.map((entry: unknown, index) => {
    const { version, security } = (entry ?? {}) as Record<string, unknown>;
    if (typeof version !== 'string' || !/^v\d+\.\d+\.\d+$/.test(version)) {
      throw new Error(`nodejs.org index.json: entry ${String(index)} has no valid version`);
    }
    if (typeof security !== 'boolean') {
      throw new Error(`nodejs.org index.json: ${version} has no security flag`);
    }
    return { version, security };
  });
}

/** Security releases in the same major line as `pinned` that are newer than it. */
export function missingSecurityReleases(pinned: string, releases: NodeRelease[]): string[] {
  if (!releases.some((release) => release.version === `v${pinned}`)) {
    throw new Error(`Node ${pinned} is not in the release list; the pin or the data is wrong`);
  }
  const current = parse(pinned);
  return releases
    .filter((release) => release.security)
    .map((release) => parse(release.version))
    .filter((version) => version[0] === current[0] && isNewer(version, current))
    .map((version) => version.join('.'));
}

/** Reads the end-of-life date of the major line of `pinned` from the Release schedule. */
export function endOfLife(pinned: string, schedule: unknown): string {
  const line = `v${String(parse(pinned)[0])}`;
  const lines = (typeof schedule === 'object' && schedule !== null ? schedule : {}) as Schedule;
  const end = lines[line]?.end;
  if (typeof end !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    throw new Error(`Node release schedule: no end-of-life date for ${line}`);
  }
  return end;
}

/** `ended` after the end-of-life date, `ending` within the warning window before it. */
export function supportStatus(end: string, today: Date): 'supported' | 'ending' | 'ended' {
  const daysLeft = (Date.parse(`${end}T00:00:00Z`) - today.getTime()) / DAY_MS;
  if (daysLeft < 0) return 'ended';
  return daysLeft <= EOL_WARNING_DAYS ? 'ending' : 'supported';
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} returned ${String(response.status)}`);
  return response.json();
}

/** Checks the version in `.nvmrc`, or the version given as an argument. */
async function main(): Promise<void> {
  const pinned = process.argv[2] ?? readFileSync('.nvmrc', 'utf8').trim();
  const releases = parseReleases(await fetchJson('https://nodejs.org/dist/index.json'));
  const missing = missingSecurityReleases(pinned, releases);
  const schedule = 'https://raw.githubusercontent.com/nodejs/Release/main/schedule.json';
  const end = endOfLife(pinned, await fetchJson(schedule));
  const status = supportStatus(end, new Date());
  if (status === 'ending') {
    console.log(`::warning::Node ${pinned} reaches end of life on ${end}; plan the upgrade.`);
  }
  if (missing.length === 0 && status !== 'ended') return;
  if (missing.length > 0) {
    console.error(`.nvmrc pins Node ${pinned}; newer security releases: ${missing.join(', ')}`);
  }
  if (status === 'ended') console.error(`Node ${pinned} reached end of life on ${end}.`);
  process.exit(1);
}

if (import.meta.filename === process.argv[1]) await main();
