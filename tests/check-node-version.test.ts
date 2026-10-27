import { describe, expect, it } from 'vitest';

import { missingSecurityReleases, parseReleases } from '../scripts/check-node-version';

const releases = [
  { version: 'v24.11.0', security: true },
  { version: 'v22.23.4', security: true },
  { version: 'v22.23.3', security: false },
  { version: 'v22.23.2', security: true },
  { version: 'v22.22.1', security: false },
];

describe('missingSecurityReleases', () => {
  it('lists newer security releases in the same major line only', () => {
    expect(missingSecurityReleases('22.22.1', releases)).toEqual(['22.23.4', '22.23.2']);
  });

  it('is empty when the pin is the latest security release', () => {
    expect(missingSecurityReleases('22.23.4', releases)).toEqual([]);
  });

  it('ignores newer non-security releases', () => {
    expect(missingSecurityReleases('22.23.2', releases)).toEqual(['22.23.4']);
  });

  it('fails when the pinned version is not in the list', () => {
    expect(() => missingSecurityReleases('22.99.0', releases)).toThrow('not in the release list');
  });
});

describe('parseReleases', () => {
  it('keeps the version and security flag of each release', () => {
    expect(parseReleases([{ version: 'v22.23.4', security: true, lts: 'Jod' }])).toEqual([
      { version: 'v22.23.4', security: true },
    ]);
  });

  it.each([
    ['an empty list', []],
    ['an object', { releases: [] }],
    ['a release without a security flag', [{ version: 'v22.23.4' }]],
    ['a malformed version', [{ version: '22.23', security: true }]],
    ['a null entry', [null]],
  ])('fails on %s', (_, data) => {
    expect(() => parseReleases(data)).toThrow('nodejs.org index.json');
  });
});
