import { describe, expect, it } from 'vitest';

import {
  endOfLife,
  missingSecurityReleases,
  parseReleases,
  supportStatus,
} from '../scripts/check-node-version';

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

describe('endOfLife', () => {
  const schedule = { v22: { start: '2024-04-24', end: '2027-04-30' }, v24: { end: '2028-04-30' } };

  it('reads the end of life of the pinned major line', () => {
    expect(endOfLife('22.23.4', schedule)).toBe('2027-04-30');
  });

  it.each([
    ['a missing line', { v24: { end: '2028-04-30' } }],
    ['a line without an end', { v22: { start: '2024-04-24' } }],
    ['a malformed date', { v22: { end: 'April 2027' } }],
    ['a non-object answer', 'not json'],
    ['null', null],
  ])('fails on %s', (_, data) => {
    expect(() => endOfLife('22.23.4', data)).toThrow('no end-of-life date for v22');
  });
});

describe('supportStatus', () => {
  const end = '2027-04-30';

  it('is supported more than 90 days before the end', () => {
    expect(supportStatus(end, new Date('2027-01-29T00:00:00Z'))).toBe('supported');
  });

  it('is ending within 90 days of the end, including the last day', () => {
    expect(supportStatus(end, new Date('2027-01-30T00:00:00Z'))).toBe('ending');
    expect(supportStatus(end, new Date('2027-04-30T00:00:00Z'))).toBe('ending');
  });

  it('has ended after the end date', () => {
    expect(supportStatus(end, new Date('2027-04-30T00:00:01Z'))).toBe('ended');
  });
});
