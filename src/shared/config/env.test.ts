import { describe, expect, it } from 'vitest';

import { EnvError, parseEnv } from './env';

const valid = {
  DATABASE_URL: 'postgres://app:s3cret-pass@127.0.0.1:5432/popcorn',
  REDIS_URL: 'redis://:r3dis-pass@127.0.0.1:6379',
  S3_ENDPOINT: 'http://127.0.0.1:8333',
  S3_BUCKET: 'popcorn-media',
  S3_ACCESS_KEY: 'popcorn',
  S3_SECRET_KEY: 'super-secret-key',
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
  it('returns the typed environment and defaults APP_ENV', () => {
    expect(parseEnv(valid)).toEqual({ ...valid, APP_ENV: 'development' });
  });

  it('reports every missing variable by name', () => {
    expect(problemsOf({})).toEqual([
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

  it('rejects "change-me" placeholders in production only', () => {
    const withPlaceholder = { ...valid, S3_SECRET_KEY: 'change-me-s3-secret' };
    expect(parseEnv({ ...withPlaceholder, APP_ENV: 'development' }).S3_SECRET_KEY).toBe(
      'change-me-s3-secret',
    );
    expect(problemsOf({ ...withPlaceholder, APP_ENV: 'production' })).toEqual([
      'S3_SECRET_KEY: still contains the "change-me" placeholder',
    ]);
  });

  it('rejects an unknown APP_ENV', () => {
    expect(problemsOf({ ...valid, APP_ENV: 'staging' })).toEqual(['APP_ENV: invalid_value']);
  });
});
