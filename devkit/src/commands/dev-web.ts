import { runInherit } from '../util/exec.js';
import { navWatch, type NavWatcher } from '../lib/nav-watch.js';

/** Runs a process in `cwd` and resolves with its exit code. */
export type WebRunner = (cmd: string, args: string[], cwd: string) => Promise<number>;

const defaultRunner: WebRunner = (cmd, args, cwd) => runInherit(cmd, args, { cwd });

/**
 * Web dev server: compiles the navigation layer, keeps watching the storybooks
 * (rebuilding on change), then runs Vite. The generated nav files are gitignored
 * build artifacts, so this guarantees they exist and stay in sync while editing.
 * The watcher is torn down when Vite exits. Returns Vite's exit code.
 */
export async function devWeb(opts: {
  project: string;
  runner?: WebRunner;
  navWatch?: NavWatcher;
}): Promise<number> {
  const runner = opts.runner ?? defaultRunner;
  const startWatch = opts.navWatch ?? navWatch;
  const watcher = await startWatch(opts.project);
  try {
    return await runner('npx', ['vite'], opts.project);
  } finally {
    watcher.close();
  }
}
