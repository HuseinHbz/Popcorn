/**
 * Runs once when a Next.js server starts. Node-only start-up checks live in
 * `instrumentation-node.ts`, imported behind the runtime check so the Edge build
 * never includes them.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { assertValidEnv } = await import('./instrumentation-node');
    assertValidEnv();
  }
}
