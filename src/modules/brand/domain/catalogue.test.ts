import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  BRAND_SLUGS,
  type BrandSlug,
  IDENTITIES,
  type Identity,
  isBrandSlug,
  isIdentity,
} from './catalogue';

describe('BRAND_SLUGS', () => {
  it('lists the three brands in a fixed order', () => {
    expect(BRAND_SLUGS).toEqual(['nakaya', 'em-cafe', 'izakaya']);
    expectTypeOf<BrandSlug>().toEqualTypeOf<'nakaya' | 'em-cafe' | 'izakaya'>();
  });
});

describe('IDENTITIES', () => {
  it('is the group followed by every brand', () => {
    expect(IDENTITIES).toEqual(['group', ...BRAND_SLUGS]);
    expectTypeOf<Identity>().toEqualTypeOf<'group' | BrandSlug>();
  });
});

describe('isBrandSlug', () => {
  it.each(BRAND_SLUGS)('accepts %s', (slug) => {
    expect(isBrandSlug(slug)).toBe(true);
  });

  it.each(['group', 'Nakaya', 'em_cafe', 'em-café', ' nakaya', 'nakaya/', '', 'constructor'])(
    'rejects %j',
    (value) => {
      expect(isBrandSlug(value)).toBe(false);
    },
  );

  it('narrows a string to BrandSlug', () => {
    const value: string = 'izakaya';
    if (isBrandSlug(value)) expectTypeOf(value).toEqualTypeOf<BrandSlug>();
    expect(isBrandSlug(value)).toBe(true);
  });
});

describe('isIdentity', () => {
  it.each(IDENTITIES)('accepts %s', (identity) => {
    expect(isIdentity(identity)).toBe(true);
  });

  it.each(['Group', 'kish', 'elahieh', '', 'toString'])('rejects %j', (value) => {
    expect(isIdentity(value)).toBe(false);
  });

  it('narrows a string to Identity', () => {
    const value: string = 'group';
    if (isIdentity(value)) expectTypeOf(value).toEqualTypeOf<Identity>();
    expect(isIdentity(value)).toBe(true);
  });
});
