import { EnvError, parseEnv } from './shared/config/env';

/**
 * Stops the process with exit code 1 when the environment is invalid, so the app never
 * serves requests half-configured (phase-00 PR 0.2). Names variables, never values.
 */
export function assertValidEnv(): void {
  try {
    parseEnv(process.env);
  } catch (error) {
    if (!(error instanceof EnvError)) throw error;
    console.error(error.message);
    process.exit(1);
  }
}
