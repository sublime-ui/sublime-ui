import { join } from 'node:path';
import { defineNative } from '../define-native.js';
import { getElectron } from './get-electron.js';
import { getBetterSqlite3 } from './get-better-sqlite3.js';
import type DatabaseInstance from 'better-sqlite3';

/**
 * Built-in `sqlite` native service (main process only).
 *
 * A minimal synchronous-SQLite façade over `better-sqlite3`, exposed through the
 * native bridge so the renderer (and the `@sublime-ui/storage` desktop driver)
 * can drive a real on-disk database over the single `native:invoke` channel
 * without any native module entering the web bundle. The database lives at
 * `<userData>/sublime.db` and is opened lazily, once.
 *
 * `better-sqlite3` is an OPTIONAL peer dependency: an app only needs it when it
 * registers this service. The renderer-facing contract is the type-only
 * {@link SqliteContract}.
 */

let dbPromise: Promise<DatabaseInstance.Database> | undefined;

async function db(): Promise<DatabaseInstance.Database> {
  if (dbPromise === undefined) {
    dbPromise = (async () => {
      const electron = await getElectron();
      const Database = await getBetterSqlite3();
      const file = join(electron.app.getPath('userData'), 'sublime.db');
      return new Database(file);
    })();
  }
  return dbPromise;
}

export const sqlite = defineNative('sqlite', {
  /** Run a parameter-free statement (DDL / PRAGMA). */
  exec: async (sql: string): Promise<void> => {
    (await db()).exec(sql);
  },
  /** Run a write statement with bound params; returns the affected row count. */
  run: async (sql: string, params: unknown[]): Promise<{ changes: number }> => {
    const info = (await db()).prepare(sql).run(...params);
    return { changes: info.changes };
  },
  /** Run a read statement; returns the matching `{ doc }` rows. */
  all: async (sql: string, params: unknown[]): Promise<{ doc: string }[]> => {
    return (await db()).prepare(sql).all(...params) as { doc: string }[];
  },
  /** Run a read statement; returns the first `{ doc }` row or `undefined`. */
  get: async (sql: string, params: unknown[]): Promise<{ doc: string } | undefined> => {
    return (await db()).prepare(sql).get(...params) as { doc: string } | undefined;
  },
});

/**
 * Renderer-safe contract for the `sqlite` native service.
 *
 * `import type { SqliteContract }` only — importing the VALUE `sqlite` would
 * pull `better-sqlite3`/node into the bundle. The `@sublime-ui/storage` desktop
 * driver consumes this type to adapt `getNative<SqliteContract>('sqlite')` to
 * its `SqliteDriver` port.
 */
export type SqliteContract = typeof sqlite.methods;
