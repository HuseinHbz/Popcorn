import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

const root = fileURLToPath(new URL('..', import.meta.url));
const next = fileURLToPath(new URL('../node_modules/.bin/next', import.meta.url));

/** Starts the production server with `overrides` and resolves with its exit code and output. */
function startServer(
  overrides: Record<string, string>,
): Promise<{ code: number | null; output: string }> {
  return new Promise((resolve) => {
    const server = spawn(next, ['start', '-H', '127.0.0.1', '-p', '3998'], {
      cwd: root,
      env: { ...process.env, ...overrides },
    });
    let output = '';
    server.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
    server.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()));
    const timer = setTimeout(() => server.kill('SIGKILL'), 30_000);
    server.on('exit', (code) => {
      clearTimeout(timer);
      resolve({ code, output });
    });
  });
}

test('the server refuses to start with an invalid environment', async ({}, testInfo) => {
  // Not viewport-dependent; one run avoids two servers racing for the same port.
  test.skip(testInfo.project.name !== 'desktop', 'runs once, in the desktop project');
  test.setTimeout(45_000);
  const { code, output } = await startServer({ DATABASE_URL: 'mysql://user:leaked-secret@db/x' });
  expect(code).toBe(1);
  expect(output).toContain('DATABASE_URL');
  expect(output).not.toContain('leaked-secret');
});
