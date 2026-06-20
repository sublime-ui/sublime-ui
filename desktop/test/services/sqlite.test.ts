import { describe, it, expect, beforeEach, vi } from 'vitest';

// Fakes for the better-sqlite3 statement + database the service drives.
const stmtRun = vi.fn();
const stmtAll = vi.fn();
const stmtGet = vi.fn();
const dbPrepare = vi.fn(() => ({ run: stmtRun, all: stmtAll, get: stmtGet }));
const dbExec = vi.fn();
const DatabaseCtor = vi.fn(() => ({ prepare: dbPrepare, exec: dbExec }));

vi.mock('better-sqlite3', () => ({ default: DatabaseCtor }));

// Resolve the DB path off the app userData dir without pulling electron at eval.
const getPath = vi.fn(() => '/tmp/userdata');
vi.mock('electron', () => ({ app: { getPath } }));

import { sqlite } from '../../src/services/sqlite';

beforeEach(() => {
  vi.clearAllMocks();
  stmtAll.mockReturnValue([]);
  stmtGet.mockReturnValue(undefined);
  stmtRun.mockReturnValue({ changes: 0 });
});

describe('sqlite service', () => {
  it('is a native service named "sqlite"', () => {
    expect(sqlite.name).toBe('sqlite');
  });

  it('exec forwards the SQL to better-sqlite3 exec', async () => {
    await sqlite.methods.exec('CREATE TABLE "t" (id TEXT PRIMARY KEY, doc TEXT NOT NULL)');
    expect(dbExec).toHaveBeenCalledWith(
      'CREATE TABLE "t" (id TEXT PRIMARY KEY, doc TEXT NOT NULL)',
    );
  });

  it('run prepares + executes with params and returns { changes }', async () => {
    stmtRun.mockReturnValue({ changes: 1, lastInsertRowid: 0 });
    const res = await sqlite.methods.run('INSERT INTO "t"(id,doc) VALUES(?,?)', ['1', '{}']);
    expect(dbPrepare).toHaveBeenCalledWith('INSERT INTO "t"(id,doc) VALUES(?,?)');
    expect(stmtRun).toHaveBeenCalledWith('1', '{}');
    expect(res).toEqual({ changes: 1 });
  });

  it('all returns the rows from the prepared statement', async () => {
    stmtAll.mockReturnValue([{ doc: '{"a":1}' }, { doc: '{"a":2}' }]);
    const rows = await sqlite.methods.all('SELECT doc FROM "t"', []);
    expect(stmtAll).toHaveBeenCalledWith();
    expect(rows).toEqual([{ doc: '{"a":1}' }, { doc: '{"a":2}' }]);
  });

  it('get returns the first row or undefined', async () => {
    stmtGet.mockReturnValue({ doc: '{"a":1}' });
    await expect(sqlite.methods.get('SELECT doc FROM "t" WHERE id=?', ['1'])).resolves.toEqual({
      doc: '{"a":1}',
    });
    stmtGet.mockReturnValue(undefined);
    await expect(sqlite.methods.get('SELECT doc FROM "t" WHERE id=?', ['9'])).resolves.toBeUndefined();
  });

  it('opens the database lazily (once) under the app userData dir', async () => {
    // Re-import on a fresh module graph so the module-level db singleton starts
    // unopened for this case (earlier tests in this file already opened it). The
    // hoisted `vi.mock` registrations above survive `resetModules`.
    vi.resetModules();
    const { sqlite: fresh } = await import('../../src/services/sqlite');
    await fresh.methods.exec('SELECT 1');
    await fresh.methods.all('SELECT 1', []);
    expect(DatabaseCtor).toHaveBeenCalledTimes(1);
    expect(getPath).toHaveBeenCalledWith('userData');
  });
});
