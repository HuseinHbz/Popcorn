import { z } from 'zod';

/** Any spelling of the `.env.example` placeholder: change-me, CHANGE_ME, ChangeMe. */
const PLACEHOLDER = /change[-_ ]?me/i;
/** Production S3 secrets are generated, so a short one is a typo or a test value. */
const MIN_PRODUCTION_SECRET = 32;

const url = (protocols: RegExp) => z.url({ protocol: protocols });

/** Every environment variable the application reads (CLAUDE.md: Zod at every boundary). */
const envSchema = z.object({
  /**
   * Deployment environment (Next.js fixes NODE_ENV itself). Required with no default:
   * a production deploy that forgot it must not start with the development rules.
   */
  APP_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: url(/^postgres(?:ql)?$/),
  REDIS_URL: url(/^rediss?$/),
  S3_ENDPOINT: url(/^https?$/),
  S3_BUCKET: z.string().regex(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(8),
});

export type Env = z.infer<typeof envSchema>;

/** Raised when the environment is invalid. Lists variable names only, never values. */
export class EnvError extends Error {
  constructor(readonly problems: readonly string[]) {
    super(`Invalid environment:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`);
    this.name = 'EnvError';
  }
}

/** Rules that only production enforces: local services run with throwaway credentials. */
function productionProblems(env: Env): string[] {
  if (env.APP_ENV !== 'production') return [];
  const problems = Object.entries(env)
    .filter(([, value]) => PLACEHOLDER.test(value))
    .map(([key]) => `${key}: still contains a "change-me" placeholder`);
  for (const key of ['DATABASE_URL', 'REDIS_URL'] as const) {
    if (new URL(env[key]).password === '') problems.push(`${key}: has no password`);
  }
  if (env.S3_SECRET_KEY.length < MIN_PRODUCTION_SECRET) {
    problems.push(`S3_SECRET_KEY: shorter than ${String(MIN_PRODUCTION_SECRET)} characters`);
  }
  return problems;
}

/** Validates `source` (usually `process.env`) and returns the typed environment. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new EnvError(
      result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.code}`),
    );
  }
  const problems = productionProblems(result.data);
  if (problems.length > 0) throw new EnvError(problems);
  return result.data;
}
