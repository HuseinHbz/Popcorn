import { describe, expect, it } from 'vitest';

import {
  isBinary,
  parseBatch,
  parsePatterns,
  parseRawLog,
  problems,
  SIGNATURES,
  workflowMessage,
} from '../scripts/check-scan-coverage';

const OLD = '0'.repeat(40);
const A = 'a'.repeat(40);
const B = 'b'.repeat(40);
const C = 'c'.repeat(40);
const raw = (mode: string, blob: string, status: string, path: string): string =>
  `:100644 ${mode} ${OLD} ${blob} ${status}\0${path}\0`;

describe('parseRawLog', () => {
  it('lists each added blob once per path, merges and non-ASCII names included', () => {
    const log = [
      raw('100644', A, 'A', 'src/a.ts'),
      `\n${raw('100644', A, 'M', 'src/a.ts')}`,
      raw('100644', B, 'T', 'docs/منو.svg'),
      raw('000000', OLD, 'D', 'gone.ts'),
      raw('160000', C, 'A', 'vendor/module'),
    ].join('');
    expect(parseRawLog(log)).toEqual([
      { blob: A, path: 'src/a.ts' },
      { blob: B, path: 'docs/منو.svg' },
    ]);
  });

  it('keeps the previous blob of a regular file, which git diffs against the new one', () => {
    const log = [
      `:100644 100644 ${C} ${A} M\0public/a.webp\0`,
      `:120000 100644 ${C} ${B} T\0link\0`,
      `:000000 100644 ${OLD} ${A} A\0new.ts\0`,
    ].join('');
    expect(parseRawLog(log)).toEqual([
      { blob: A, path: 'public/a.webp', previous: C },
      { blob: B, path: 'link' },
      { blob: A, path: 'new.ts' },
    ]);
  });
});

describe('parseBatch', () => {
  it('reads each object, binary content included', () => {
    const output = Buffer.concat([Buffer.from(`${A} blob 3\nab\0\n${B} blob 0\n\n`)]);
    const contents = parseBatch(output);
    expect(contents.get(A)).toEqual(Buffer.from('ab\0'));
    expect(contents.get(B)).toEqual(Buffer.alloc(0));
  });

  it('fails on a missing object', () => {
    expect(() => parseBatch(Buffer.from(`${A} missing\n`))).toThrow('missing');
  });
});

describe('isBinary and SIGNATURES', () => {
  const utf16 = Buffer.from('﻿token = "x"', 'utf16le');

  it('reads UTF-16 text as binary, as git does', () => {
    expect(isBinary(utf16)).toBe(true);
    expect(isBinary(Buffer.from('plain text'))).toBe(false);
  });

  it('recognises each expected format and rejects text disguised as one', () => {
    const samples: Record<string, Buffer> = {
      woff2: Buffer.from('wOF2\0\0'),
      png: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]),
      jpg: Buffer.from([0xff, 0xd8, 0xff, 0]),
      jpeg: Buffer.from([0xff, 0xd8, 0xff, 0]),
      gif: Buffer.from('GIF89a\0'),
      webp: Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')]),
      avif: Buffer.concat([Buffer.alloc(4), Buffer.from('ftypavif')]),
      ico: Buffer.from([0, 0, 1, 0]),
    };
    for (const [extension, sample] of Object.entries(samples)) {
      expect(SIGNATURES[extension]?.(sample), extension).toBe(true);
      expect(SIGNATURES[extension]?.(utf16), extension).toBe(false);
    }
  });
});

describe('parsePatterns', () => {
  it('reads Go patterns, with (?i) as a flag, and skips comments', () => {
    const patterns = parsePatterns('# a comment\n\ngitleaks\\.toml\n(?i)\\.svg$\n');
    expect(patterns.map(String)).toEqual(['/gitleaks\\.toml/su', '/\\.svg$/isu']);
  });

  it('matches as Go does: Unicode case folding, and . across every line terminator', () => {
    const [svg, socket, modules] = parsePatterns(
      '(?i)\\.svg$\n(?i)\\.socket$\n(?:^|/)node_modules(?:/.*)?$\n',
    );
    expect(svg?.test('public/menu.\u017fvg')).toBe(true);
    expect(socket?.test('docs/server.soc\u212aet')).toBe(true);
    expect(modules?.test('node_modules/a\rb/index.ts')).toBe(true);
  });
});

describe('problems', () => {
  const skipped = parsePatterns('gitleaks\\.toml\n(?i)\\.(?:svg|pdf)$\n');
  const text = Buffer.from('token = "x"');
  const utf16 = Buffer.from('token = "x"', 'utf16le');
  const font = Buffer.from('wOF2\0\0');
  const contents = new Map([
    [A, text],
    [B, utf16],
    [C, font],
  ]);
  const check = (blob: string, path: string): string[] =>
    problems([{ blob, path }], contents, skipped);

  it('accepts ordinary text, expected skipped files and real fonts', () => {
    expect(check(A, 'src/a.ts')).toEqual([]);
    expect(check(A, 'src/app/icon.svg')).toEqual([]);
    expect(check(C, 'src/shared/ui/fonts/files/a.woff2')).toEqual([]);
  });

  it('rejects binary text, text disguised as an image, and skipped text files', () => {
    expect(check(B, 'notes.txt')).toEqual([
      'notes.txt: binary content in a file that is not an expected format',
    ]);
    expect(check(B, 'menu.PNG')).toEqual(['menu.PNG: not a png file (no png signature)']);
    expect(check(B, 'notes.constructor')).toEqual([
      'notes.constructor: binary content in a file that is not an expected format',
    ]);
    expect(check(A, 'src/app/logo.\u017fvg')).toEqual([
      'src/app/logo.\u017fvg: a text file that gitleaks skips by its name',
    ]);
    expect(check(A, 'public/منو.svg')).toEqual([
      'public/منو.svg: a text file that gitleaks skips by its name',
    ]);
    expect(check(A, 'src/x/gitleaks.toml')).toEqual([
      'src/x/gitleaks.toml: a text file that gitleaks skips by its name',
    ]);
  });

  it('rejects text written over binary content, which git diffs as binary', () => {
    const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP\0')]);
    const pair = new Map([
      [A, text],
      [C, webp],
    ]);
    expect(problems([{ blob: A, path: 'public/a.webp', previous: C }], pair, skipped)).toEqual([
      'public/a.webp: text after binary content, which git diffs as binary',
    ]);
    expect(problems([{ blob: C, path: 'public/a.webp', previous: A }], pair, skipped)).toEqual([]);
    expect(problems([{ blob: A, path: 'src/a.ts', previous: A }], pair, skipped)).toEqual([]);
  });

  it('fails when a blob could not be read', () => {
    expect(problems([{ blob: OLD, path: 'x.ts' }], contents, skipped)).toEqual([
      `x.ts: blob ${OLD} not read`,
    ]);
  });
});

describe('workflowMessage', () => {
  it('escapes what would end the message or start another workflow command', () => {
    expect(workflowMessage('a%b\rc\nd')).toBe('a%25b%0Dc%0Ad');
  });
});
