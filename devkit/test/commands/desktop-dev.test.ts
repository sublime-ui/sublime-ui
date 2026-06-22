import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { desktopDev } from '../../src/commands/desktop-dev.js';

let dir = '';
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'desktop-dev-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('desktopDev', () => {
  it('starts the nav watcher, runs npm start in the default desktop dir, then closes the watcher', async () => {
    const calls: Array<{ cmd: string; args: string[]; cwd: string }> = [];
    let watchedCwd = '';
    let closed = false;
    const code = await desktopDev({
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
    expect(calls[0]?.cmd).toBe('npm');
    expect(calls[0]?.args).toEqual(['start']);
    expect(calls[0]?.cwd).toBe(join(dir, 'desktop'));
  });

  it('resolves the desktop dir from config and propagates the runner exit code', async () => {
    writeFileSync(
      join(dir, 'sublime.config.json'),
      JSON.stringify({ desktop: { dir: 'apps/shell' } }),
    );
    const calls: Array<{ cmd: string; args: string[]; cwd: string }> = [];
    const code = await desktopDev({
      project: dir,
      navWatch: async () => ({ close: () => {} }),
      runner: async (cmd, args, cwd) => {
        calls.push({ cmd, args, cwd });
        return 3;
      },
    });
    expect(code).toBe(3);
    expect(calls[0]?.cwd).toBe(join(dir, 'apps', 'shell'));
  });

  it('closes the nav watcher even when the runner throws', async () => {
    let closed = false;
    await expect(
      desktopDev({
        project: dir,
        navWatch: async () => ({ close: () => { closed = true; } }),
        runner: async () => { throw new Error('forge crashed'); },
      }),
    ).rejects.toThrow('forge crashed');
    expect(closed).toBe(true);
  });
});
