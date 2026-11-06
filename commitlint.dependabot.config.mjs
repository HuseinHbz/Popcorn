/**
 * Commitlint for commits Dependabot made, and only those (scripts/lint-commits.ts decides by
 * the run's actor or the commit's author, and the message's shape). Its subjects start with a
 * capital "Bump", which subject-case rejects, and it offers no option to change that, so that
 * one rule is off; every other rule of commitlint.config.mjs applies.
 */
import base from './commitlint.config.mjs';

const config = { ...base, rules: { 'subject-case': [0] } };

export default config;
