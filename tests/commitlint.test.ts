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
});
