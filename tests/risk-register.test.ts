import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/**
 * The CI audit gate ignores exactly the advisories the risk register accepts: a GHSA
 * in package.json without a register entry would silently weaken the gate (AC13).
 */
const register = readFileSync(
  new URL('../docs/security/risk-register.md', import.meta.url),
  'utf8',
);
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  pnpm?: { auditConfig?: { ignoreGhsas?: string[] } };
};

const acceptedInRegister = [
  ...register.matchAll(/^\|\s*R-\d+\s*\|\s*(GHSA-[a-z0-9-]+)\s*\|/gm),
].map((match) => match[1]);

describe('risk register', () => {
  it('lists exactly the advisories the audit gate ignores', () => {
    const ignored = manifest.pnpm?.auditConfig?.ignoreGhsas ?? [];
    expect([...ignored].sort()).toEqual([...acceptedInRegister].sort());
  });

  it('accepts each advisory once', () => {
    expect(new Set(acceptedInRegister).size).toBe(acceptedInRegister.length);
  });
});
