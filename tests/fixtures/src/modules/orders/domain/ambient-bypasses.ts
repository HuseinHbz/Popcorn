// The clock, randomness and I/O in the shapes the plain rules do not see (ADR 0015).
export const callDate = (): string => Date(); // expect: no-restricted-syntax
export const computedNow = (): number => Date['now'](); // expect: no-restricted-syntax
export const computedRandom = (): number => Math['random'](); // expect: no-restricted-syntax
export const nowReference = Date.now; // expect: no-restricted-syntax
const D = Date; // expect: no-restricted-syntax
export const aliased = (): number => D.now();
export const reflected = (): unknown => Reflect.get(Math, 'random'); // expect: no-restricted-syntax
export const today = (): string => new Intl.DateTimeFormat('fa').format(); // expect: no-restricted-syntax
export const parts = (): unknown => new Intl.DateTimeFormat('fa').formatToParts(); // expect: no-restricted-syntax
export const db = (): unknown => indexedDB; // expect: no-restricted-globals
export const cache = (): unknown => caches; // expect: no-restricted-globals
export const later = (): void => {
  queueMicrotask(() => undefined); // expect: no-restricted-globals
};
export const soon = (): unknown => setImmediate(() => undefined); // expect: no-restricted-globals
export const frame = (): number => requestAnimationFrame(() => undefined); // expect: no-restricted-globals

// Pure uses of Date, Math and Intl: no findings.
export const parse = (iso: string): number => Date.parse(iso);
export const at = (iso: string): Date => new Date(iso);
export const isDate = (value: unknown): boolean => value instanceof Date;
export const larger = (a: number, b: number): number => Math.max(a, b);
export const format = (date: Date): string => new Intl.DateTimeFormat('fa').format(date);
