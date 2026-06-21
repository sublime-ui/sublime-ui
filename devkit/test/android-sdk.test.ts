import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  managedSdkDir, hasCmdlineTools, fixCmdlineToolsLayout, ensureManagedSdk,
} from '../src/lib/android-sdk.js';

let dir = '';
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'sdk-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

const smName = process.platform === 'win32' ? 'sdkmanager.bat' : 'sdkmanager';

describe('managedSdkDir', () => {
  it('is <workDir>/android-sdk', () => {
    expect(managedSdkDir(dir)).toBe(join(dir, 'android-sdk'));
  });
});

describe('fixCmdlineToolsLayout', () => {
  it('moves the extracted cmdline-tools into cmdline-tools/latest', () => {
    // Simulate the zip's top-level `cmdline-tools/bin/sdkmanager`.
    const extracted = join(dir, 'extracted');
    mkdirSync(join(extracted, 'cmdline-tools', 'bin'), { recursive: true });
    writeFileSync(join(extracted, 'cmdline-tools', 'bin', smName), '');
    const sdk = join(dir, 'android-sdk');

    fixCmdlineToolsLayout(extracted, sdk);
    expect(existsSync(join(sdk, 'cmdline-tools', 'latest', 'bin', smName))).toBe(true);
    expect(hasCmdlineTools(sdk)).toBe(true);
  });
});

describe('ensureManagedSdk', () => {
  it('short-circuits when cmdline-tools already present', async () => {
    const sdk = join(dir, 'android-sdk', 'cmdline-tools', 'latest', 'bin');
    mkdirSync(sdk, { recursive: true });
    writeFileSync(join(sdk, smName), '');
    const download = vi.fn();
    const extract = vi.fn();
    const root = await ensureManagedSdk({ workDir: dir, deps: { download, extract } });
    expect(root).toBe(join(dir, 'android-sdk'));
    expect(download).not.toHaveBeenCalled();
  });

  it('downloads + extracts + fixes layout when absent', async () => {
    const download = vi.fn(async () => {});
    const extract = vi.fn(async (_a: string, dest: string) => {
      mkdirSync(join(dest, 'cmdline-tools', 'bin'), { recursive: true });
      writeFileSync(join(dest, 'cmdline-tools', 'bin', smName), '');
    });
    const root = await ensureManagedSdk({ workDir: dir, deps: { download, extract } });
    expect(hasCmdlineTools(root)).toBe(true);
    expect(download).toHaveBeenCalledOnce();
  });
});
