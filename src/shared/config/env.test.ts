import { describe, expect, it } from 'vitest';

import { EnvError, parseEnv } from './env';

const valid = {
  APP_ENV: 'development',
  DATABASE_URL: 'postgres://app:s3cret-pass@127.0.0.1:5432/popcorn',
  REDIS_URL: 'redis://:r3dis-pass@127.0.0.1:6379',
  S3_ENDPOINT: 'http://127.0.0.1:8333',
  S3_BUCKET: 'popcorn-media',
  S3_ACCESS_KEY: 'popcorn',
  S3_SECRET_KEY: 'super-secret-key',
};

const production = {
  ...valid,
  APP_ENV: 'production',
  S3_SECRET_KEY: 'a-generated-secret-of-32-chars-ok',
};

function problemsOf(source: Record<string, string | undefined>): readonly string[] {
  try {
    parseEnv(source);
  } catch (error) {
    if (error instanceof EnvError) return error.problems;
    throw error;
  }
  return [];
}

describe('parseEnv', () => {
  it('returns the typed environment', () => {
    expect(parseEnv(valid)).toEqual(valid);
    expect(parseEnv(production)).toEqual(production);
  });

  it('reports every missing variable by name', () => {
    expect(problemsOf({})).toEqual([
      'APP_ENV: invalid_value',
      'DATABASE_URL: invalid_type',
      'REDIS_URL: invalid_type',
      'S3_ENDPOINT: invalid_type',
      'S3_BUCKET: invalid_type',
      'S3_ACCESS_KEY: invalid_type',
      'S3_SECRET_KEY: invalid_type',
    ]);
  });

  it('rejects URLs with the wrong protocol and malformed values', () => {
    const problems = problemsOf({
      ...valid,
      DATABASE_URL: 'mysql://db/popcorn',
      REDIS_URL: 'not a url',
      S3_BUCKET: 'Bad_Bucket',
      S3_SECRET_KEY: 'short',
    });
    expect(problems.map((problem) => problem.split(':')[0])).toEqual([
      'DATABASE_URL',
      'REDIS_URL',
      'S3_BUCKET',
      'S3_SECRET_KEY',
    ]);
  });

  it('never echoes variable values in the error', () => {
    const error = (() => {
      try {
        parseEnv({ ...valid, S3_SECRET_KEY: 'leak', DATABASE_URL: 'mysql://user:leaked-pw@db/x' });
      } catch (caught) {
        return caught;
      }
      return undefined;
    })();
    expect(error).toBeInstanceOf(EnvError);
    expect(String(error)).not.toMatch(/leak/);
  });

  it('does not default APP_ENV: a deploy that forgets it does not start', () => {
    const withoutAppEnv: Record<string, string> = { ...production };
    delete withoutAppEnv.APP_ENV;
    expect(problemsOf(withoutAppEnv)).toEqual(['APP_ENV: invalid_value']);
  });

  it('rejects placeholders in production only, in any spelling', () => {
    const placeholders = {
      DATABASE_URL: 'postgres://app:change-me@db/popcorn',
      REDIS_URL: 'redis://:CHANGE_ME@cache:6379',
      S3_ACCESS_KEY: 'ChangeMe',
      S3_SECRET_KEY: 'change me, a placeholder 32 characters long',
    };
    expect(problemsOf({ ...valid, ...placeholders })).toEqual([]);
    expect(problemsOf({ ...production, ...placeholders })).toEqual([
      'DATABASE_URL: still contains a "change-me" placeholder',
      'REDIS_URL: still contains a "change-me" placeholder',
      'S3_ACCESS_KEY: still contains a "change-me" placeholder',
      'S3_SECRET_KEY: still contains a "change-me" placeholder',
    ]);
  });

  it('requires service passwords and a 32-character S3 secret in production', () => {
    const weak = {
      DATABASE_URL: 'postgres://app@db/popcorn',
      REDIS_URL: 'redis://cache:6379',
      S3_SECRET_KEY: 'only-16-chars-ok',
    };
    expect(problemsOf({ ...valid, ...weak })).toEqual([]);
    expect(problemsOf({ ...production, ...weak })).toEqual([
      'DATABASE_URL: has no password',
      'REDIS_URL: has no password',
      'S3_SECRET_KEY: shorter than 32 characters',
    ]);
  });

  it('rejects an unknown APP_ENV', () => {
    expect(problemsOf({ ...valid, APP_ENV: 'staging' })).toEqual(['APP_ENV: invalid_value']);
  });
});
