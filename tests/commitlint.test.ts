import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/** Proves the commit-msg hook and CI reject non-conventional messages (story AC9). */
const root = fileURLToPath(new URL('..', import.meta.url));
const commitlint = fileURLToPath(new URL('../node_modules/.bin/commitlint', import.meta.url));

function lint(message: string): number | null {
  return spawnSync(commitlint, [], { cwd: root, input: message, encoding: 'utf8' }).status;
}

describe('commitlint', () => {
  it.each(['feat(i18n): add locale switch', 'fix: correct proxy matcher', 'docs: update ADR 0014'])(
    'accepts "%s"',
    (message) => {
      expect(lint(message)).toBe(0);
    },
  );

  it.each(['added stuff', 'Feat: capitalised type', 'feat:missing space', 'wip: unknown type'])(
    'rejects "%s"',
    (message) => {
      expect(lint(message)).not.toBe(0);
    },
  );

  // Dependabot's subjects start with a capital "Bump", which subject-case rejects; only its
  // exact shape is skipped (commitlint.config.mjs).
  const signOff = '\n\nSigned-off-by: dependabot[bot] <support@github.com>\n';
  it.each([
    'build(deps-dev): Bump the minor-and-patch group with 2 updates',
    'build(deps): Bump postgres from 17.11-alpine to 17.12-alpine',
    'ci: Bump actions/checkout from 7.0.1 to 7.0.2',
  ])('accepts Dependabot\'s "%s" with its sign-off', (header) => {
    expect(lint(`${header}\n\nBumps the group.${signOff}`)).toBe(0);
  });

  it.each([
    ['without the sign-off', 'build(deps): Bump postgres from 17.11 to 17.12\n'],
    ['with another subject', `feat: Add a capitalised subject${signOff}`],
    ['with another scope', `build(ui): Bump the button padding${signOff}`],
    ['with the sign-off mid-body', `build(deps): Bump x from 1 to 2${signOff}\nMore text.\n`],
  ])('still lints a capitalised subject %s', (_case, message) => {
    expect(lint(message)).not.toBe(0);
  });
});
