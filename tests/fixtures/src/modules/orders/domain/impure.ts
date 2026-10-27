import { readFileSync } from 'node:fs'; // expect: boundaries/dependencies

export const load = (): Promise<Response> => fetch(String(readFileSync('x'))); // expect: no-restricted-globals
