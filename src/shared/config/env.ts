import { z } from 'zod';

const PLACEHOLDER = 'change-me';

const url = (protocols: RegExp) => z.url({ protocol: protocols });

/** Every environment variable the application reads (CLAUDE.md: Zod at every boundary). */
const envSchema = z.object({
  /** Deployment environment, set explicitly by the deploy (Next.js fixes NODE_ENV itself). */
  APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
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

function placeholderProblems(env: Env): string[] {
  if (env.APP_ENV !== 'production') return [];
  return Object.entries(env)
    .filter(([, value]) => value.includes(PLACEHOLDER))
    .map(([key]) => `${key}: still contains the "${PLACEHOLDER}" placeholder`);
}

/** Validates `source` (usually `process.env`) and returns the typed environment. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new EnvError(
      result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.code}`),
    );
  }
  const placeholders = placeholderProblems(result.data);
  if (placeholders.length > 0) throw new EnvError(placeholders);
  return result.data;
}
