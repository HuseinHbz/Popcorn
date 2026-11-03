/**
 * Fails on files the secret scans cannot read (ADR 0016). For every blob any commit on any
 * ref ever added, under every path it was added at (merges included):
 * - binary content (a NUL byte in the first 8,000 bytes, git's own test) is allowed only for
 *   an expected binary format, and must start with that format's signature. Git shows other
 *   binary files to the history scan as "Binary files differ", and gitleaks cannot match
 *   UTF-16 text, so a text file disguised this way would never be scanned;
 * - a text file on gitleaks' default path allowlist (.github/ci-tools/gitleaks-skipped-paths.txt)
 *   must be one of the expected ones.
 * Paths are read with `-z`, so names git would quote (non-ASCII, quotes) are checked as they
 * are. Security reviews round 6 (J1, J5) and round 7 (K1, K2).
 * Usage: node scripts/check-scan-coverage.ts
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** A blob a change added at a path, and the regular-file blob git diffs it against. */
export type Change = { blob: string; path: string; previous?: string };

/** Text files gitleaks skips by name on purpose: its own rules, the lockfile, the site icon. */
export const EXPECTED_SKIPPED = new Set([
  '.github/ci-tools/gitleaks.toml',
  'pnpm-lock.yaml',
  'src/app/icon.svg',
]);

const bytes = (...values: number[]): Buffer => Buffer.from(values);
const starts = (content: Buffer, prefix: Buffer, at = 0): boolean =>
  content.subarray(at, at + prefix.length).equals(prefix);

/** The binary formats the repository may hold, each recognised by its signature. */
export const SIGNATURES: Record<string, (content: Buffer) => boolean> = {
  woff2: (content) => starts(content, Buffer.from('wOF2')),
  png: (content) => starts(content, bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)),
  jpg: (content) => starts(content, bytes(0xff, 0xd8, 0xff)),
  jpeg: (content) => starts(content, bytes(0xff, 0xd8, 0xff)),
  gif: (content) =>
    starts(content, Buffer.from('GIF87a')) || starts(content, Buffer.from('GIF89a')),
  webp: (content) =>
    starts(content, Buffer.from('RIFF')) && starts(content, Buffer.from('WEBP'), 8),
  avif: (content) => /^ftypavi[fs]$/.test(content.subarray(4, 12).toString('latin1')),
  ico: (content) => starts(content, bytes(0x00, 0x00, 0x01, 0x00)),
};

const HEADER = /^\n*:(\d{6}) (\d{6}) ([0-9a-f]+) ([0-9a-f]+) ([A-Z])\d*$/;

/**
 * Parses `git log --raw -z --no-abbrev --format=` output into the blobs each change added,
 * with their paths, and the previous blob when it was a regular file (git diffs the pair as
 * binary if either side is). Deletions add nothing; submodule entries are commits, not blobs.
 */
export function parseRawLog(output: string): Change[] {
  const tokens = output.split('\0');
  const changes = new Map<string, Change>();
  for (let index = 0; index < tokens.length - 1; index += 1) {
    const header = HEADER.exec(tokens[index] ?? '');
    if (!header) continue;
    const [, oldMode = '', mode, oldBlob = '', blob = '', status] = header;
    const path = tokens[index + 1] ?? '';
    index += 1;
    if (status === 'D' || mode === '160000') continue;
    const previous = oldMode.startsWith('10') && /[^0]/.test(oldBlob) ? oldBlob : undefined;
    changes.set(`${String(previous)}\0${blob}\0${path}`, {
      blob,
      path,
      ...(previous && { previous }),
    });
  }
  return [...changes.values()];
}

/** Parses `git cat-file --batch` output into each object's content. */
export function parseBatch(output: Buffer): Map<string, Buffer> {
  const contents = new Map<string, Buffer>();
  let offset = 0;
  while (offset < output.length) {
    const end = output.indexOf(0x0a, offset);
    const [name = '', type, size] = output.subarray(offset, end).toString('latin1').split(' ');
    if (type === 'missing' || size === undefined) throw new Error(`git cat-file: ${name} missing`);
    const length = Number(size);
    contents.set(name, output.subarray(end + 1, end + 1 + length));
    offset = end + 1 + length + 1;
  }
  return contents;
}

export const isBinary = (content: Buffer): boolean => content.subarray(0, 8000).includes(0);

/**
 * Reads gitleaks' path patterns (Go syntax, a leading `(?i)` for case-insensitive). `u` folds
 * case as Go does (ſ matches s, K matches k) and `s` lets `.` cross every line terminator, as
 * Go's crosses all but LF; for an LF in a name this over-matches, which fails closed.
 */
export function parsePatterns(text: string): RegExp[] {
  return text
    .split('\n')
    .filter((line) => line !== '' && !line.startsWith('#'))
    .map((line) =>
      line.startsWith('(?i)') ? new RegExp(line.slice(4), 'isu') : new RegExp(line, 'su'),
    );
}

/** Escapes a message for a workflow command, so a file name cannot end it or start another. */
export const workflowMessage = (message: string): string =>
  message.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');

function problem(
  change: Change,
  contents: Map<string, Buffer>,
  skipped: RegExp[],
): string | undefined {
  const { path } = change;
  const content = contents.get(change.blob) ?? Buffer.alloc(0);
  const previous = change.previous ? contents.get(change.previous) : undefined;
  if (previous && isBinary(previous) && !isBinary(content)) {
    return `${path}: text after binary content, which git diffs as binary`;
  }
  if (isBinary(content)) {
    const extension = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
    // Own keys only: `constructor` and the other Object.prototype names are not formats.
    const signature = Object.hasOwn(SIGNATURES, extension) ? SIGNATURES[extension] : undefined;
    if (!signature) return `${path}: binary content in a file that is not an expected format`;
    if (!signature(content)) return `${path}: not a ${extension} file (no ${extension} signature)`;
    return undefined;
  }
  if (skipped.some((pattern) => pattern.test(path)) && !EXPECTED_SKIPPED.has(path)) {
    return `${path}: a text file that gitleaks skips by its name`;
  }
  return undefined;
}

/** One message per change the scans cannot read; empty when every file is covered. */
export function problems(
  changes: Change[],
  contents: Map<string, Buffer>,
  skipped: RegExp[],
): string[] {
  return changes.flatMap((change) => {
    const unread = [change.blob, change.previous].find((blob) => blob && !contents.has(blob));
    if (unread) return [`${change.path}: blob ${unread} not read`];
    const message = problem(change, contents, skipped);
    return message ? [message] : [];
  });
}

function main(): void {
  const git = (args: string[], input?: string): Buffer =>
    execFileSync('git', args, { input, maxBuffer: 1 << 30 });
  const log = git([
    'log',
    '--all',
    // Explicit, so a runner's log.diffMerges cannot turn merge diffs into combined ones.
    '--diff-merges=separate',
    '--root',
    '--no-renames',
    '--no-abbrev',
    '--raw',
    '--format=',
    '-z',
  ]);
  const changes = parseRawLog(log.toString('utf8'));
  const blobs = [...new Set(changes.flatMap(({ blob, previous }) => [blob, previous ?? blob]))];
  const contents = parseBatch(git(['cat-file', '--batch'], `${blobs.join('\n')}\n`));
  const skipped = parsePatterns(
    readFileSync('.github/ci-tools/gitleaks-skipped-paths.txt', 'utf8'),
  );
  const found = problems(changes, contents, skipped);
  console.log(`Checked ${String(changes.length)} paths of ${String(blobs.length)} blobs.`);
  for (const message of found) console.error(`::error::${workflowMessage(message)}`);
  if (found.length > 0) process.exit(1);
}

if (import.meta.filename === process.argv[1]) main();
