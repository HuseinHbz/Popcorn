import { z } from 'zod';

/** Any spelling of the `.env.example` placeholder: change-me, CHANGE_ME, ChangeMe, change.me. */
const PLACEHOLDER = /change[-_ .]?me/i;
/** Production secrets are generated, so a short one is a typo or a test value. */
const MIN_S3_SECRET = 32;
const MIN_SERVICE_PASSWORD = 16;
/** Hosts reached without leaving the machine or the private container network. */
const LOCAL_HOST = /^(?:localhost|127(?:\.\d{1,3}){3}|\[::1\]|[a-z0-9-]+)$/i;

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

/** `%63hange-me` must not slip past the placeholder check; malformed escapes stay as they are. */
function decoded(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function passwordProblem(key: 'DATABASE_URL' | 'REDIS_URL', value: string): string | undefined {
  const password = decoded(new URL(value).password);
  if (password === '') return `${key}: has no password`;
  if (password.length < MIN_SERVICE_PASSWORD) {
    return `${key}: password shorter than ${String(MIN_SERVICE_PASSWORD)} characters`;
  }
  return undefined;
}

/** Rules that only production enforces: local services run with throwaway credentials. */
function productionProblems(env: Env): string[] {
  if (env.APP_ENV !== 'production') return [];
  const problems = Object.entries(env)
    .filter(([, value]) => PLACEHOLDER.test(decoded(value)))
    .map(([key]) => `${key}: still contains a "change-me" placeholder`);
  for (const key of ['DATABASE_URL', 'REDIS_URL'] as const) {
    const problem = passwordProblem(key, env[key]);
    if (problem) problems.push(problem);
  }
  if (env.S3_SECRET_KEY.trim().length < MIN_S3_SECRET) {
    problems.push(`S3_SECRET_KEY: shorter than ${String(MIN_S3_SECRET)} characters`);
  }
  const s3 = new URL(env.S3_ENDPOINT);
  if (s3.protocol !== 'https:' && !LOCAL_HOST.test(s3.hostname)) {
    problems.push('S3_ENDPOINT: must use https unless the host is local');
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
