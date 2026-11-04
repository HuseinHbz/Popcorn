// A module file in pure code gets the purity rules too (security review round 7, K4).
export const now = () => Date.now(); // expect: no-restricted-syntax
