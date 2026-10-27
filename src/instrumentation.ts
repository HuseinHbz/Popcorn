/**
 * Runs once when a Next.js server starts. An invalid environment stops the process
 * with exit code 1, so the app never serves requests half-configured (phase-00 PR 0.2).
 * The message names the variables only, never their values.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { EnvError, parseEnv } = await import('./shared/config/env');
  try {
    parseEnv(process.env);
  } catch (error) {
    if (!(error instanceof EnvError)) throw error;
    console.error(error.message);
    process.exit(1);
  }
}
