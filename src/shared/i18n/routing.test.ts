import { describe, expect, it } from 'vitest';

import { directionOf, routing } from './routing';

describe('routing', () => {
  it('defaults to Persian and always prefixes the locale', () => {
    expect(routing.defaultLocale).toBe('fa');
    expect(routing.locales).toEqual(['fa', 'en']);
    expect(routing.localePrefix).toBe('always');
  });

  it('renders Persian right-to-left and English left-to-right', () => {
    expect(directionOf('fa')).toBe('rtl');
    expect(directionOf('en')).toBe('ltr');
  });
});
