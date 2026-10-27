export const stamp = (): number => Date.now();
export const today = (): Date => new Date();
export const roll = (): number => Math.random();
export const sneakyFetch = (): unknown => globalThis.fetch;
export const log = (message: string): void => {
  console.log(message);
};
