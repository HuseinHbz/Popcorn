import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  type Outcome,
  type RetriedCode,
  type Runner,
  type Step,
  collectWithRetry,
  lighthouseCi,
  RETRIED,
  retriedCode,
  warnRetry,
} from '../scripts/lighthouse-ci';

/** Proves Lighthouse CI collects again once on a listed runtime error, and never retries scores. */
const lighthouse = dirname(
  createRequire(createRequire(import.meta.url).resolve('@lhci/cli/package.json')).resolve(
    'lighthouse/package.json',
  ),
);
const messages = JSON.parse(
  readFileSync(join(lighthouse, 'shared/localization/locales/en-US.json'), 'utf8'),
) as Record<string, { message: string }>;
/** What the installed Lighthouse prints for an error, filled in as it fills it in. */
const printed = (key: string, code: string): string =>
  `Runtime error encountered: ${(messages[`core/lib/lh-error.js | ${key}`]?.message ?? '')
    .replace('{errorCode}', code)
    .replace('{protocolMethod}', 'Page.enable')}`;
// The line from the failed CI run of 2026-11-05, as lhci printed it after its own three tries.
const NAVSTART_LOG = [
  'Error: Lighthouse failed with exit code 1',
  '2026-11-05T05:43:41.093Z LH:uses-http2:warn Caught exception: NO_NAVSTART',
  '2026-11-05T05:43:41.213Z LH:ChromeLauncher Killing Chrome instance 7700',
  'Runtime error encountered: Something went wrong with recording the trace over your page load. Please run Lighthouse again. (NO_NAVSTART)',
  '',
].join('\n');
const SCORE_LOG = '✘  categories.performance failure for minScore assertion\n';

describe('retriedCode', () => {
  it.each([
    ['NO_NAVSTART', 'badTraceRecording'],
    ['NO_FCP', 'noFcp'],
    ['PROTOCOL_TIMEOUT', 'protocolTimeout'],
  ] as const)('recognizes %s as the installed Lighthouse prints it', (code, key) => {
    expect(retriedCode(`log line\n${printed(key, code)}\n`)).toBe(code);
  });

  it('recognizes the failed CI run', () => {
    expect(retriedCode(NAVSTART_LOG)).toBe('NO_NAVSTART');
  });

  it('prints its runtime errors on a line that starts with the prefix it matches', () => {
    const run = readFileSync(join(lighthouse, 'cli/run.js'), 'utf8');
    expect(run).toContain("console.error('Runtime error encountered:'");
  });

  it.each([
    ['another code with the same message', printed('badTraceRecording', 'NO_TRACING_STARTED')],
    ['another runtime error', printed('noLcp', 'NO_LCP')],
    ['a code outside a runtime-error line', 'LH:uses-http2:warn Caught exception: NO_NAVSTART'],
    ['a runtime-error line not at the start', `  ${printed('noFcp', 'NO_FCP')}`],
    ['a score failure', SCORE_LOG],
  ])('ignores %s', (_case, output) => {
    expect(retriedCode(output)).toBeUndefined();
  });

  it('lists exactly the codes the owner chose', () => {
    expect(Object.keys(RETRIED)).toEqual(['NO_NAVSTART', 'NO_FCP', 'PROTOCOL_TIMEOUT']);
  });
});

const ok: Outcome = { status: 0, output: '' };
const navstart: Outcome = { status: 1, output: NAVSTART_LOG };
/** A runner that answers each step's calls in order from the plan, and records them. */
function fake(plan: Partial<Record<Step, Outcome[]>>) {
  const calls: Step[] = [];
  const warnings: RetriedCode[] = [];
  const run: Runner = (step) => {
    calls.push(step);
    const nth = calls.filter((called) => called === step).length;
    return Promise.resolve(plan[step]?.[nth - 1] ?? ok);
  };
  return { run, calls, warnings, warn: (code: RetriedCode) => warnings.push(code) };
}

describe('lighthouseCi', () => {
  it('collects once more after a listed runtime error, then asserts and uploads', async () => {
    const { run, calls, warnings, warn } = fake({ collect: [navstart, ok] });
    expect(await lighthouseCi(run, warn)).toBe(0);
    expect(calls).toEqual(['healthcheck', 'collect', 'collect', 'assert', 'upload']);
    expect(warnings).toEqual(['NO_NAVSTART']);
  });

  it('fails when the second collection fails too, for any reason', async () => {
    for (const second of [navstart, { status: 2, output: 'Error: ECONNREFUSED' }]) {
      const { run, calls, warn } = fake({ collect: [navstart, second] });
      expect(await lighthouseCi(run, warn)).toBe(second.status);
      expect(calls).toEqual(['healthcheck', 'collect', 'collect']);
    }
  });

  it('never retries a collection that failed for another reason', async () => {
    const { run, calls, warnings, warn } = fake({ collect: [{ status: 1, output: SCORE_LOG }] });
    expect(await lighthouseCi(run, warn)).toBe(1);
    expect(calls).toEqual(['healthcheck', 'collect']);
    expect(warnings).toEqual([]);
  });

  it('never retries a score failure, and still uploads the report', async () => {
    // Even when the assert output carries a runtime-error line, assert runs once.
    const { run, calls, warnings, warn } = fake({
      assert: [{ status: 1, output: SCORE_LOG + NAVSTART_LOG }],
    });
    expect(await lighthouseCi(run, warn)).toBe(1);
    expect(calls).toEqual(['healthcheck', 'collect', 'assert', 'upload']);
    expect(warnings).toEqual([]);
  });

  it('stops when the healthcheck fails and fails when the upload fails', async () => {
    const health = fake({ healthcheck: [{ status: 1, output: '' }] });
    expect(await lighthouseCi(health.run, health.warn)).toBe(1);
    expect(health.calls).toEqual(['healthcheck']);
    const upload = fake({ upload: [{ status: 1, output: '' }] });
    expect(await lighthouseCi(upload.run, upload.warn)).toBe(1);
  });

  it('retries at most once inside collectWithRetry', async () => {
    const { run, calls, warn } = fake({ collect: [navstart, navstart, ok] });
    expect(await collectWithRetry(run, warn)).toBe(1);
    expect(calls).toEqual(['collect', 'collect']);
  });
});

/** A fake `lhci` on PATH that follows a plan per step and logs its arguments. */
function fakeBin(plan: Record<string, { status?: number; stderr?: string; signal?: boolean }[]>) {
  const dir = mkdtempSync(join(tmpdir(), 'lighthouse-ci-'));
  const log = join(dir, 'calls.log');
  const summary = join(dir, 'summary.md');
  writeFileSync(log, '');
  writeFileSync(
    join(dir, 'lhci'),
    `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, args.join(' ') + '\\n');
const nth = fs.readFileSync(${JSON.stringify(log)}, 'utf8').split('\\n').filter((line) => line.split(' ')[0] === args[0]).length;
const { status = 0, stderr = '', signal = false } = (${JSON.stringify(plan)}[args[0]] ?? [])[nth - 1] ?? {};
process.stdout.write(args[0] + ' ran\\n');
process.stderr.write(stderr);
if (signal) process.kill(process.pid, 'SIGKILL');
process.exitCode = status;
`,
  );
  chmodSync(join(dir, 'lhci'), 0o755);
  const env = {
    ...process.env,
    PATH: `${dir}:${process.env.PATH ?? ''}`,
    GITHUB_STEP_SUMMARY: summary,
  };
  const main = () =>
    spawnSync(process.execPath, ['scripts/lighthouse-ci.ts'], { env, encoding: 'utf8' });
  const calls = () => readFileSync(log, 'utf8').trim().split('\n');
  return { main, calls, summary: () => readFileSync(summary, 'utf8') };
}

describe('scripts/lighthouse-ci.ts, against a fake lhci', () => {
  it('retries once after a simulated runtime error and passes, with a visible warning', () => {
    const lhciBin = fakeBin({ collect: [{ status: 1, stderr: NAVSTART_LOG }] });
    const result = lhciBin.main();
    expect(result.status).toBe(0);
    expect(lhciBin.calls()).toEqual([
      'healthcheck --fatal',
      'collect',
      'collect',
      'assert',
      'upload',
    ]);
    expect(result.stdout).toContain('::warning::Lighthouse retried after NO_NAVSTART');
    expect(result.stderr).toContain('(NO_NAVSTART)');
    expect(lhciBin.summary()).toBe('Lighthouse retried after NO_NAVSTART\n');
  });

  it('fails when the runtime error happens again', () => {
    const lhciBin = fakeBin({
      collect: [
        { status: 1, stderr: NAVSTART_LOG },
        { status: 1, stderr: NAVSTART_LOG },
      ],
    });
    const result = lhciBin.main();
    expect(result.status).toBe(1);
    expect(lhciBin.calls()).toEqual(['healthcheck --fatal', 'collect', 'collect']);
  });

  it('never retries a score failure', () => {
    const lhciBin = fakeBin({ assert: [{ status: 1, stderr: SCORE_LOG + NAVSTART_LOG }] });
    const result = lhciBin.main();
    expect(result.status).toBe(1);
    expect(lhciBin.calls()).toEqual(['healthcheck --fatal', 'collect', 'assert', 'upload']);
    expect(result.stdout).not.toContain('::warning::');
  });

  it('counts a step killed by a signal as a failure', () => {
    const lhciBin = fakeBin({ upload: [{ signal: true }] });
    expect(lhciBin.main().status).toBe(1);
    expect(lhciBin.calls()).toEqual(['healthcheck --fatal', 'collect', 'assert', 'upload']);
  });
});

describe('warnRetry', () => {
  it('prints the annotation even without a job summary', () => {
    const lines: unknown[] = [];
    const log = console.log;
    console.log = (line: unknown) => lines.push(line);
    try {
      warnRetry('NO_FCP', undefined);
    } finally {
      console.log = log;
    }
    expect(lines).toEqual(['::warning::Lighthouse retried after NO_FCP']);
  });
});

describe('wiring', () => {
  it('pnpm lhci runs this script, and CI runs pnpm lhci', () => {
    const scripts = (
      JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
    ).scripts;
    expect(scripts.lhci).toBe('node scripts/lighthouse-ci.ts');
    expect(readFileSync('.github/workflows/ci.yml', 'utf8')).toMatch(
      /- name: Lighthouse CI \(mobile\)\n\s+run: pnpm lhci\n/,
    );
  });
});
