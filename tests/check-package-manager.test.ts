import { describe, expect, it } from 'vitest';

import {
  blockingAdvisories,
  parseAdvisories,
  parsePackageManager,
} from '../scripts/check-package-manager';

describe('parsePackageManager', () => {
  it('reads the name and version, ignoring a hash suffix', () => {
    expect(parsePackageManager('pnpm@10.34.9')).toEqual({ name: 'pnpm', version: '10.34.9' });
    expect(parsePackageManager('pnpm@10.34.9+sha512.abc')).toEqual({
      name: 'pnpm',
      version: '10.34.9',
    });
  });

  it('rejects a missing or malformed field', () => {
    expect(() => parsePackageManager('')).toThrow('Unrecognised packageManager');
    expect(() => parsePackageManager('pnpm@latest')).toThrow('Unrecognised packageManager');
  });
});

describe('blockingAdvisories', () => {
  it('keeps Moderate, High and Critical', () => {
    expect(
      blockingAdvisories([
        { severity: 'moderate' },
        { severity: 'high', title: 'path traversal' },
        { severity: 'critical' },
        { severity: 'low' },
      ]),
    ).toEqual([
      { severity: 'moderate' },
      { severity: 'high', title: 'path traversal' },
      { severity: 'critical' },
    ]);
  });
});

describe('parseAdvisories', () => {
  it('reads the advisories of the package, and none from an empty answer', () => {
    const advisory = { id: 1, severity: 'high', title: 'path traversal', url: 'https://x' };
    expect(parseAdvisories({ pnpm: [advisory] }, 'pnpm')).toEqual([
      { severity: 'high', title: 'path traversal', url: 'https://x' },
    ]);
    expect(parseAdvisories({}, 'pnpm')).toEqual([]);
  });

  it.each([
    ['null', null],
    ['a list', []],
    ['a non-list entry', { pnpm: 'error' }],
    ['an advisory without severity', { pnpm: [{ title: 'x' }] }],
    ['an upper-case severity', { pnpm: [{ severity: 'HIGH' }] }],
    ['an unknown severity', { pnpm: [{ severity: 'severe' }] }],
    ['a wrapped answer', { data: { pnpm: [{ severity: 'high' }] } }],
    ['a re-keyed answer', { 'pnpm@10.28.0': [{ severity: 'high' }] }],
    ['a null advisory', { pnpm: [null] }],
  ])('fails on %s', (_, data) => {
    expect(() => parseAdvisories(data, 'pnpm')).toThrow('npm advisory API');
  });
});
