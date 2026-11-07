import { describe, expect, it } from 'vitest';

import * as accent from './accent';
import * as catalogue from './catalogue';
import * as check from './check';
import * as colour from './colour';
import * as contrast from './contrast';
import * as domain from './index';
import * as oklch from './oklch';

describe('brand domain public API', () => {
  it('re-exports exactly the functions and constants of each file', () => {
    const expected = { ...accent, ...catalogue, ...check, ...colour, ...contrast, ...oklch };
    expect(Object.keys(domain).sort()).toEqual(Object.keys(expected).sort());
    for (const [name, value] of Object.entries(expected)) {
      expect(domain).toHaveProperty(name, value);
    }
  });
});
