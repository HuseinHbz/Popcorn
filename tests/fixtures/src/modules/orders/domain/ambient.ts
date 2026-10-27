export const stamp = (): number => Date.now(); // expect: no-restricted-syntax
export const today = (): Date => new Date(); // expect: no-restricted-syntax
export const roll = (): number => Math.random(); // expect: no-restricted-syntax
export const sneakyFetch = (): unknown => globalThis.fetch; // expect: no-restricted-globals
export const log = (message: string): void => {
  console.log(message); // expect: no-restricted-globals
};
