import { describe, expect, it } from 'vitest';

import { blockingAdvisories, parsePackageManager } from '../scripts/check-package-manager';

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
  it('keeps High and Critical only', () => {
    expect(
      blockingAdvisories([
        { severity: 'moderate' },
        { severity: 'high', title: 'path traversal' },
        { severity: 'critical' },
        { severity: 'low' },
      ]),
    ).toEqual([{ severity: 'high', title: 'path traversal' }, { severity: 'critical' }]);
  });
});
