import type DatabaseConstructor from 'better-sqlite3';

/**
 * Lazy, mockable accessor for the optional `better-sqlite3` native module.
 *
 * `better-sqlite3` is a main-process-only native addon and an OPTIONAL peer
 * dependency: importing it at module-eval time would break environments that
 * don't ship it (and would taint any bundle that reaches this file). Going
 * through this single dynamic-import indirection keeps it lazy and gives unit
 * tests one seam to mock via `vi.mock('better-sqlite3', …)`.
 */
export async function getBetterSqlite3(): Promise<typeof DatabaseConstructor> {
  const mod = await import('better-sqlite3');
  return (mod as { default: typeof DatabaseConstructor }).default;
}
