/**
 * Lints every commit of a range with commitlint: CI's commit-message gate (CLAUDE.md workflow
 * step 8). Dependabot's subjects start with a capital "Bump", which subject-case rejects, so a
 * commit Dependabot made is linted with commitlint.dependabot.config.mjs instead, where only
 * subject-case is off. Made by Dependabot means the run's actor is dependabot[bot] (GitHub sets
 * it; nothing in the repository can) or the commit's author email is Dependabot's, and the
 * message also has Dependabot's shape. A human commit with a Dependabot-shaped message, its
 * sign-off included, is linted with every rule.
 * Usage: ACTOR=<github.actor> node scripts/lint-commits.ts <from> <to> | --last
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { join } from 'node:path';

export const DEPENDABOT_ACTOR = 'dependabot[bot]';
export const DEPENDABOT_EMAIL = '49699333+dependabot[bot]@users.noreply.github.com';
export const DEFAULT_CONFIG = 'commitlint.config.mjs';
export const DEPENDABOT_CONFIG = 'commitlint.dependabot.config.mjs';

/** The type and scope .github/dependabot.yml sets, then Dependabot's verb. */
const DEPENDABOT_HEADER = /^(?:build|ci)(?:\((?:deps|deps-dev)\))?: Bump \S/;
const DEPENDABOT_SIGNOFF = /\nSigned-off-by: dependabot\[bot\] <support@github\.com>\s*$/;

/** git log fields and records, split by the unit and record separators. */
export const LOG_FORMAT = '%H%x1f%ae%x1f%B%x1e';

export type Commit = {
  readonly sha: string;
  readonly authorEmail: string;
  readonly message: string;
};

/** The configuration a commit is linted with. */
export function configFor(commit: Commit, actor: string): string {
  const byDependabot = actor === DEPENDABOT_ACTOR || commit.authorEmail === DEPENDABOT_EMAIL;
  const shaped = DEPENDABOT_HEADER.test(commit.message) && DEPENDABOT_SIGNOFF.test(commit.message);
  return byDependabot && shaped ? DEPENDABOT_CONFIG : DEFAULT_CONFIG;
}

/** Parses `git log --format=LOG_FORMAT` output (each record may start with a newline). */
export function parseLog(output: string): Commit[] {
  return output
    .split('\x1e')
    .map((record) => record.replace(/^\n/, ''))
    .filter((record) => record !== '')
    .map((record) => {
      const [sha = '', authorEmail = '', message = ''] = record.split('\x1f');
      return { sha, authorEmail, message };
    });
}

/** Runs commitlint on one commit's message with its configuration; returns the exit status. */
export function lintCommit(commit: Commit, actor: string, root: string): number {
  const config = configFor(commit, actor);
  console.log(`Commit ${commit.sha.slice(0, 7)} (${config})`);
  const result = spawnSync(
    join(root, 'node_modules/.bin/commitlint'),
    ['--config', join(root, config), '--verbose'],
    { cwd: root, input: commit.message, stdio: ['pipe', 'inherit', 'inherit'] },
  );
  return result.status ?? 1;
}

function main(): void {
  const [first, second] = process.argv.slice(2);
  const range = first === '--last' ? ['-1', 'HEAD'] : [`${String(first)}..${String(second)}`];
  if (first !== '--last' && (first === undefined || second === undefined)) {
    console.error('Usage: node scripts/lint-commits.ts <from> <to> | --last');
    process.exit(2);
  }
  const root = process.cwd();
  const log = execFileSync('git', ['log', `--format=${LOG_FORMAT}`, ...range], { cwd: root });
  const commits = parseLog(log.toString('utf8'));
  const actor = process.env.ACTOR ?? '';
  const failed = commits.filter((commit) => lintCommit(commit, actor, root) !== 0);
  console.log(`Linted ${String(commits.length)} commits: ${String(failed.length)} failed.`);
  if (failed.length > 0) process.exit(1);
}

if (import.meta.filename === process.argv[1]) main();
