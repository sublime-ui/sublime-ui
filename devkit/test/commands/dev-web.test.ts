import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { devWeb } from '../../src/commands/dev-web.js';

let dir = '';
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'dev-web-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('devWeb', () => {
  it('starts the nav watcher, runs vite in the project dir, then closes the watcher', async () => {
    const calls: Array<{ cmd: string; args: string[]; cwd: string }> = [];
    let watchedCwd = '';
    let closed = false;
    const code = await devWeb({
      project: dir,
      navWatch: async (cwd) => {
        watchedCwd = cwd;
        return { close: () => { closed = true; } };
      },
      runner: async (cmd, args, cwd) => {
        calls.push({ cmd, args, cwd });
        return 0;
      },
    });
    expect(code).toBe(0);
    expect(watchedCwd).toBe(dir);
    expect(closed).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.cmd).toBe('npx');
    expect(calls[0]?.args).toEqual(['vite']);
    expect(calls[0]?.cwd).toBe(dir);
  });

  it('propagates Vite exit code and closes the watcher even when the runner throws', async () => {
    let closed = false;
    await expect(
      devWeb({
        project: dir,
        navWatch: async () => ({ close: () => { closed = true; } }),
        runner: async () => { throw new Error('vite crashed'); },
      }),
    ).rejects.toThrow('vite crashed');
    expect(closed).toBe(true);
  });
});
