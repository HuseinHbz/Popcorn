/**
 * Runs Lighthouse CI the way `lhci autorun` does (healthcheck, collect, assert, upload), except:
 * - when collect fails on one of the Lighthouse runtime errors in RETRIED, collect runs once more
 *   and a warning annotation says so. lhci already tries each run three times, so this fires only
 *   when one run failed three times in a row. A second collect failure fails the step. Scores are
 *   checked by assert, which never runs twice, so a score failure is never retried;
 * - an upload failure fails the step (autorun only warns), since the summary and the artifact
 *   need the report;
 * - a step killed by a signal counts as failed (autorun counts it as passed).
 * Risk register: "Lighthouse runtime-error retry".
 * Usage: pnpm lhci
 */
import { spawn } from 'node:child_process';
import { appendFileSync } from 'node:fs';

export type Step = 'healthcheck' | 'collect' | 'assert' | 'upload';
export type Outcome = { status: number; output: string };
export type Runner = (step: Step) => Promise<Outcome>;

/** The runtime errors worth one more collection, and the text Lighthouse prints for each. */
export const RETRIED = {
  NO_NAVSTART: '(NO_NAVSTART)',
  NO_FCP: '(NO_FCP)',
  // This message names the protocol method, not the code.
  PROTOCOL_TIMEOUT: 'Waiting for DevTools protocol response has exceeded the allotted time.',
} as const;
export type RetriedCode = keyof typeof RETRIED;

const CODES = Object.keys(RETRIED) as RetriedCode[];
/** Lighthouse prints every runtime error on a line of its own that starts with this. */
const RUNTIME_ERROR = /^Runtime error encountered: (.*)$/gm;

/** The retried code named on a Lighthouse "Runtime error encountered:" line, if any. */
export function retriedCode(output: string): RetriedCode | undefined {
  for (const [, message = ''] of output.matchAll(RUNTIME_ERROR)) {
    const code = CODES.find((candidate) => message.includes(RETRIED[candidate]));
    if (code !== undefined) return code;
  }
  return undefined;
}

export async function collectWithRetry(
  run: Runner,
  warn: (code: RetriedCode) => void,
): Promise<number> {
  const first = await run('collect');
  if (first.status === 0) return 0;
  const code = retriedCode(first.output);
  if (code === undefined) return first.status;
  warn(code);
  return (await run('collect')).status;
}

/** autorun's order; upload runs after a failed assert too, so the report still exists. */
export async function lighthouseCi(
  run: Runner,
  warn: (code: RetriedCode) => void,
): Promise<number> {
  const health = await run('healthcheck');
  if (health.status !== 0) return health.status;
  const collected = await collectWithRetry(run, warn);
  if (collected !== 0) return collected;
  const asserted = await run('assert');
  const uploaded = await run('upload');
  return asserted.status === 0 ? uploaded.status : asserted.status;
}

const ARGS: Record<Step, string[]> = {
  healthcheck: ['healthcheck', '--fatal'],
  collect: ['collect'],
  assert: ['assert'],
  upload: ['upload'],
};

/** Runs `lhci <step>` from PATH (`pnpm lhci` puts node_modules/.bin first), streaming its output
 * and keeping a copy to search. */
export const lhci: Runner = (step) =>
  new Promise((resolve, reject) => {
    const child = spawn('lhci', ARGS[step], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    const keep = (to: NodeJS.WriteStream) => (chunk: string) => {
      to.write(chunk);
      output += chunk;
    };
    child.stdout.setEncoding('utf8').on('data', keep(process.stdout));
    child.stderr.setEncoding('utf8').on('data', keep(process.stderr));
    child.on('error', reject);
    // A child killed by a signal has no status; autorun counts that as success, this as failure.
    child.on('close', (status) => {
      resolve({ status: status ?? 1, output });
    });
  });

/** A warning annotation, plus a line in the job summary when GitHub Actions provides one. */
export function warnRetry(code: RetriedCode, summary = process.env.GITHUB_STEP_SUMMARY): void {
  console.log(`::warning::Lighthouse retried after ${code}`);
  if (summary) appendFileSync(summary, `Lighthouse retried after ${code}\n`);
}

if (import.meta.filename === process.argv[1]) {
  process.exitCode = await lighthouseCi(lhci, warnRetry);
}
