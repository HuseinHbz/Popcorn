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

/** A stand-in for a generated secret, built at runtime: key-like literals trip the secret scan. */
const generated = (length: number): string =>
  Array.from({ length }, (_, index) =>
    'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(index % 36),
  ).join('');

const production = {
  ...valid,
  APP_ENV: 'production',
  DATABASE_URL: `postgres://app:${generated(16)}@db:5432/popcorn`,
  REDIS_URL: `redis://:${generated(16)}@cache:6379`,
  S3_ENDPOINT: 'http://objectstore:8333',
  S3_SECRET_KEY: generated(32),
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

  it('rejects placeholders in production only, in any spelling or encoding', () => {
    const placeholders = {
      DATABASE_URL: 'postgres://app:%63hange-me-database@db/popcorn',
      REDIS_URL: 'redis://:CHANGE_ME_REDIS_PASSWORD@cache:6379',
      // A malformed escape cannot be decoded and is checked as written.
      S3_ACCESS_KEY: '100%-change.me',
      S3_SECRET_KEY: 'ChangeMe, a placeholder of more than 32 characters',
    };
    expect(problemsOf({ ...valid, ...placeholders })).toEqual([]);
    expect(problemsOf({ ...production, ...placeholders })).toEqual([
      'DATABASE_URL: still contains a "change-me" placeholder',
      'REDIS_URL: still contains a "change-me" placeholder',
      'S3_ACCESS_KEY: still contains a "change-me" placeholder',
      'S3_SECRET_KEY: still contains a "change-me" placeholder',
    ]);
  });

  it('requires real secrets and https to a remote S3 endpoint in production', () => {
    const weak = {
      DATABASE_URL: 'postgres://app@db/popcorn',
      REDIS_URL: `redis://:${'r'.repeat(15)}@cache:6379`,
      S3_ENDPOINT: 'http://s3.example.com',
      S3_SECRET_KEY: ' '.repeat(32),
    };
    expect(problemsOf({ ...valid, ...weak })).toEqual([]);
    expect(problemsOf({ ...production, ...weak })).toEqual([
      'DATABASE_URL: has no password',
      'REDIS_URL: password shorter than 16 characters',
      'S3_SECRET_KEY: shorter than 32 characters',
      'S3_ENDPOINT: must use https unless the host is local',
    ]);
  });

  it('rejects secrets with few distinct characters, and blank service passwords', () => {
    const repeated = {
      DATABASE_URL: `postgres://app:${'p'.repeat(16)}@db/popcorn`,
      REDIS_URL: `redis://:${'%20'.repeat(16)}@cache:6379`,
      S3_SECRET_KEY: 'x'.repeat(32),
    };
    expect(problemsOf({ ...valid, ...repeated })).toEqual([]);
    expect(problemsOf({ ...production, ...repeated })).toEqual([
      'DATABASE_URL: password uses fewer than 8 distinct characters',
      'REDIS_URL: has no password',
      'S3_SECRET_KEY: uses fewer than 8 distinct characters',
    ]);
  });

  it('allows plain http to a loopback or container-network S3 endpoint in production', () => {
    for (const endpoint of [
      'http://127.0.0.1:8333',
      'http://localhost:8333',
      'http://objectstore:8333',
    ]) {
      expect(problemsOf({ ...production, S3_ENDPOINT: endpoint })).toEqual([]);
    }
    expect(problemsOf({ ...production, S3_ENDPOINT: 'https://s3.example.com' })).toEqual([]);
  });

  it('rejects an unknown APP_ENV', () => {
    expect(problemsOf({ ...valid, APP_ENV: 'staging' })).toEqual(['APP_ENV: invalid_value']);
  });
});
