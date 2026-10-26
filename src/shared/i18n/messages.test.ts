import { describe, expect, it } from 'vitest';

import { loadMessages } from './messages';
import { routing } from './routing';

/** Flattens a catalogue into `a.b.c → value` pairs. */
function flatten(node: unknown, prefix = ''): Map<string, unknown> {
  const entries = new Map<string, unknown>();
  if (typeof node !== 'object' || node === null) return entries.set(prefix, node);
  for (const [key, value] of Object.entries(node)) {
    for (const [path, leaf] of flatten(value, prefix ? `${prefix}.${key}` : key)) {
      entries.set(path, leaf);
    }
  }
  return entries;
}

describe('message catalogues', () => {
  it('give every locale exactly the same keys as Persian', async () => {
    const reference = [...flatten(await loadMessages('fa')).keys()].sort();
    for (const locale of routing.locales) {
      const keys = [...flatten(await loadMessages(locale)).keys()].sort();
      expect(keys, `keys of ${locale}`).toEqual(reference);
    }
  });

  it('contain only non-empty strings', async () => {
    for (const locale of routing.locales) {
      for (const [path, value] of flatten(await loadMessages(locale))) {
        expect(typeof value === 'string' && value.trim().length > 0, `${locale}:${path}`).toBe(
          true,
        );
      }
    }
  });
});
