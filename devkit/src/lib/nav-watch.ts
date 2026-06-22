import { watchNav } from '../commands/build-nav.js';

/** A running navigation watcher; call `close()` to stop it. */
export interface NavWatchHandle {
  close(): void;
}

/**
 * Starts the navigation watcher for a project (initial build + rebuild on
 * storybook change) and returns a handle to stop it. Injectable into the dev
 * commands so tests can stub it without touching the filesystem.
 */
export type NavWatcher = (cwd: string) => Promise<NavWatchHandle>;

export const navWatch: NavWatcher = async (cwd) => {
  const watchers = await watchNav({ cwd });
  return {
    close() {
      for (const w of watchers) w.close();
    },
  };
};
