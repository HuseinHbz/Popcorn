import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  type Commit,
  configFor,
  DEFAULT_CONFIG,
  DEPENDABOT_CONFIG,
  DEPENDABOT_EMAIL,
  lintCommit,
  LOG_FORMAT,
  parseLog,
} from '../scripts/lint-commits';

/** Proves CI's commit gate skips subject-case for Dependabot's own commits and nothing else. */
const root = fileURLToPath(new URL('..', import.meta.url));
const SIGN_OFF = '\n\nSigned-off-by: dependabot[bot] <support@github.com>\n';
const BUMP = `build(deps-dev): Bump the minor-and-patch group with 2 updates\n\nBumps the group.${SIGN_OFF}`;
const HUMAN = 'owner@example.com';
/** A commitlint configuration file's default export. */
const load = async (file: string): Promise<unknown> =>
  ((await import(pathToFileURL(join(root, file)).href)) as { default: unknown }).default;
const commit = (authorEmail: string, message: string): Commit => ({
  sha: 'a'.repeat(40),
  authorEmail,
  message,
});

describe('configFor', () => {
  it("uses Dependabot's configuration for a commit Dependabot authored", () => {
    // On main after a merge the actor is whoever merged; the commit's author is still Dependabot.
    expect(configFor(commit(DEPENDABOT_EMAIL, BUMP), 'HuseinHbz')).toBe(DEPENDABOT_CONFIG);
  });

  it('uses it when Dependabot is the run’s actor', () => {
    expect(configFor(commit(DEPENDABOT_EMAIL, BUMP), 'dependabot[bot]')).toBe(DEPENDABOT_CONFIG);
  });

  it('never uses it for a human commit with a forged Dependabot message', () => {
    expect(configFor(commit(HUMAN, BUMP), 'HuseinHbz')).toBe(DEFAULT_CONFIG);
  });

  it.each([
    ['without the sign-off', BUMP.replace(SIGN_OFF, '\n')],
    ['with another type', BUMP.replace('build(deps-dev)', 'feat')],
    ['with another scope', BUMP.replace('build(deps-dev)', 'build(ui)')],
    ['with the sign-off mid-body', `${BUMP}\nMore text.\n`],
  ])('never uses it for a Dependabot commit %s', (_case, message) => {
    expect(configFor(commit(DEPENDABOT_EMAIL, message), 'dependabot[bot]')).toBe(DEFAULT_CONFIG);
  });
});

describe('commitlint.dependabot.config.mjs', () => {
  it('differs from the default configuration only in subject-case', async () => {
    const base = (await load(DEFAULT_CONFIG)) as object;
    expect(await load(DEPENDABOT_CONFIG)).toEqual({ ...base, rules: { 'subject-case': [0] } });
  });
});

describe('lintCommit, with the real commitlint', () => {
  it('accepts a Dependabot commit and rejects the same message from a human', () => {
    expect(lintCommit(commit(DEPENDABOT_EMAIL, BUMP), 'HuseinHbz', root)).toBe(0);
    expect(lintCommit(commit(HUMAN, BUMP), 'HuseinHbz', root)).not.toBe(0);
  });

  it('still applies every other rule to a Dependabot commit', () => {
    const fullStop = BUMP.replace('2 updates', '2 updates.');
    expect(lintCommit(commit(DEPENDABOT_EMAIL, fullStop), 'dependabot[bot]', root)).not.toBe(0);
  });
});

describe('a real repository', () => {
  it('rejects a human commit carrying a forged Dependabot sign-off', () => {
    const repo = mkdtempSync(join(tmpdir(), 'lint-commits-'));
    const git = (args: string[], email = HUMAN): string =>
      execFileSync('git', ['-c', 'commit.gpgsign=false', ...args], {
        cwd: repo,
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: 'Author',
          GIT_AUTHOR_EMAIL: email,
          GIT_COMMITTER_NAME: 'Author',
          GIT_COMMITTER_EMAIL: email,
        },
        encoding: 'utf8',
      });
    git(['init', '-q']);
    git(['commit', '-q', '--allow-empty', '-m', 'chore: start']);
    git(['commit', '-q', '--allow-empty', '-m', BUMP], DEPENDABOT_EMAIL);
    git(['commit', '-q', '--allow-empty', '-m', BUMP]);
    const [forged, real] = parseLog(git(['log', `--format=${LOG_FORMAT}`, 'HEAD~2..HEAD']));
    if (!forged || !real) throw new Error('expected the two commits');
    expect([forged.authorEmail, real.authorEmail]).toEqual([HUMAN, DEPENDABOT_EMAIL]);
    expect(forged.message).toBe(BUMP);
    expect(lintCommit(real, 'HuseinHbz', root)).toBe(0);
    expect(lintCommit(forged, 'HuseinHbz', root)).not.toBe(0);
  });
});
