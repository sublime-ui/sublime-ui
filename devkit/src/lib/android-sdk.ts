import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { resolveCmdlineToolsUrl } from './requirements.js';
import { sublimeHomeDir, type InstallDeps } from './jdk.js';
import { downloadFile } from '../util/download.js';
import { extractArchive } from '../util/archive.js';
import { log } from '../util/log.js';

const defaultDeps: InstallDeps = { download: downloadFile, extract: extractArchive };

const smName = process.platform === 'win32' ? 'sdkmanager.bat' : 'sdkmanager';

/** The managed Android SDK root, `<workDir>/android-sdk`. */
export function managedSdkDir(workDir: string = sublimeHomeDir()): string {
  return join(workDir, 'android-sdk');
}

/** True if `cmdline-tools/latest/bin/sdkmanager[.bat]` exists under `sdkDir`. */
export function hasCmdlineTools(sdkDir: string): boolean {
  return existsSync(join(sdkDir, 'cmdline-tools', 'latest', 'bin', smName));
}

/**
 * The cmdline-tools zip extracts a top-level `cmdline-tools/` containing
 * `bin/ lib/ …`, but sdkmanager requires `<sdk>/cmdline-tools/latest/bin/…`.
 * Moves the extracted folder into the `latest` slot.
 */
export function fixCmdlineToolsLayout(extractedDir: string, sdkDir: string): void {
  const from = join(extractedDir, 'cmdline-tools');
  if (!existsSync(from)) {
    throw new Error(`Expected cmdline-tools/ in the extracted archive at ${from}.`);
  }
  const latest = join(sdkDir, 'cmdline-tools', 'latest');
  mkdirSync(join(sdkDir, 'cmdline-tools'), { recursive: true });
  rmSync(latest, { recursive: true, force: true });
  renameSync(from, latest);
}

export interface EnsureSdkOptions {
  deps?: InstallDeps;
  workDir?: string;
}

/**
 * Ensures Android cmdline-tools under the managed SDK root. Downloads +
 * extracts + fixes the `latest` layout if absent; idempotent otherwise.
 * Returns the SDK root path.
 */
export async function ensureManagedSdk(opts: EnsureSdkOptions = {}): Promise<string> {
  const deps = opts.deps ?? defaultDeps;
  const workDir = opts.workDir ?? sublimeHomeDir();
  const sdkDir = managedSdkDir(workDir);
  if (hasCmdlineTools(sdkDir)) return sdkDir;

  const url = resolveCmdlineToolsUrl(process.platform);
  mkdirSync(workDir, { recursive: true });
  const archive = join(workDir, 'cmdline-tools.zip');
  const tmp = join(workDir, 'cmdline-tools-tmp');
  rmSync(tmp, { recursive: true, force: true });

  log.step('Downloading Android cmdline-tools…');
  await deps.download(url, archive, (received, total) => log.progress(received, total));
  log.progressDone();
  log.step('Extracting cmdline-tools…');
  await deps.extract(archive, tmp);

  fixCmdlineToolsLayout(tmp, sdkDir);
  rmSync(tmp, { recursive: true, force: true });
  rmSync(archive, { force: true });
  if (!hasCmdlineTools(sdkDir)) {
    throw new Error(`cmdline-tools install incomplete under ${sdkDir}.`);
  }
  return sdkDir;
}
