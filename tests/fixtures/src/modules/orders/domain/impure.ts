import { readFileSync } from 'node:fs';

export const load = (): Promise<Response> => fetch(String(readFileSync('x')));
