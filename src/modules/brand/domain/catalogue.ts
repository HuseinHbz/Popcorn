/** The three brands' slugs, in display order (CLAUDE.md domain facts). */
export const BRAND_SLUGS = ['nakaya', 'em-cafe', 'izakaya'] as const;

export type BrandSlug = (typeof BRAND_SLUGS)[number];

/** Every identity with its own theme: the group (pages with no brand), then each brand. */
export const IDENTITIES = ['group', ...BRAND_SLUGS] as const;

export type Identity = (typeof IDENTITIES)[number];

/** Whether a string is exactly one of the brand slugs (case-sensitive, no trimming). */
export function isBrandSlug(value: string): value is BrandSlug {
  return BRAND_SLUGS.some((slug) => slug === value);
}

/** Whether a string is exactly one of the identities (case-sensitive, no trimming). */
export function isIdentity(value: string): value is Identity {
  return IDENTITIES.some((identity) => identity === value);
}
