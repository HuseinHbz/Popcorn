/**
 * Conventional Commits (CLAUDE.md workflow step 8).
 *
 * Dependabot writes its own subjects, with a capital verb ("build(deps): Bump postgres from …")
 * that config-conventional's subject-case rejects, and it offers no option to change that. A
 * message in exactly Dependabot's shape is skipped: the type and scope its configuration sets
 * (.github/dependabot.yml), "Bump", and its sign-off as the last line. Anyone could write that
 * shape by hand, but it only skips message linting; the change itself is gated like any other.
 */
const DEPENDABOT_HEADER = /^(?:build|ci)(?:\((?:deps|deps-dev)\))?: Bump \S/;
const DEPENDABOT_SIGNOFF = /\nSigned-off-by: dependabot\[bot\] <support@github\.com>\s*$/;

const config = {
  extends: ['@commitlint/config-conventional'],
  ignores: [(message) => DEPENDABOT_HEADER.test(message) && DEPENDABOT_SIGNOFF.test(message)],
};

export default config;
