# Cross-Platform `doctor` + Auto-Provisioning `setup` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `sublime setup` a one-shot, no-admin provisioner that installs the full Android build toolchain (APK + AAB capable) on Windows, macOS, and Ubuntu, and make `sublime doctor` detect that managed toolchain with zero environment changes — all through a progress-driven CLI.

**Architecture:** Everything installs under `~/.sublime/` (`jdk-17/`, `android-sdk/`). `setup` runs five idempotent phases (JDK → cmdline-tools → licenses → SDK packages → verify). Detection (`probe.ts`) gains a *managed fallback* so `doctor`/`build` find the toolchain even when `ANDROID_HOME`/`JAVA_HOME` are unset. Downloads are Node-native streamed `fetch` (replacing PowerShell), extraction uses `extract-zip` + `tar`, and a TTY-gated visual layer renders a download bar, numbered phases, and spinners.

**Tech Stack:** TypeScript (ESM, strict), Node ≥18 (global `fetch`), `execa`, `commander`, `picocolors`, `vitest`. New devkit-only deps: `extract-zip`, `tar`.

## Global Constraints

- Package: `@sublime-ui/devkit` only. New deps (`extract-zip`, `tar`) are dev-time CLI deps; they MUST NOT enter any app runtime bundle.
- Managed-only: never write to the registry, shell profiles, or system Java. No env mutation.
- Pinned versions (from `requirements.ts`, do not change): NDK `27.1.12297006`, CMake `3.22.1`, build-tools `35.0.0`, platform `android-35`, JDK major `17`, Node min `18`.
- Temurin pin: `jdk-17.0.13+11` (same build already used for Windows).
- Android cmdline-tools build number: `11076708` (same across all OSes).
- All network/process/filesystem effects MUST be injectable so tests stay hermetic (follow the `runner`/`installer` injection pattern already in `gradle.ts`).
- TTY gating: when `process.stdout.isTTY` is false, spinners/bars degrade to plain single-line messages — no `\r`, no ANSI, no timers.
- Commit messages: NO Claude/AI attribution of any kind.
- Scope: Android toolchain only. No iOS, no keystore/signing, no env-writing mode.

---

### Task 1: Per-OS/arch download URLs + selectors

**Files:**
- Modify: `devkit/src/lib/requirements.ts`
- Test: `devkit/test/requirements.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `resolveJdkUrl(platform: NodeJS.Platform, arch: string): string` — Temurin URL or throws.
  - `resolveCmdlineToolsUrl(platform: NodeJS.Platform): string` — cmdline-tools URL or throws.
  - `JDK_DOWNLOAD` extended with `macX64`, `macArm64`, `linuxX64`, `linuxArm64`.
  - `CMDLINE_TOOLS_URL` extended with `mac`, `linux`.

- [ ] **Step 1: Write the failing test**

Append to `devkit/test/requirements.test.ts`:

```typescript
import { resolveJdkUrl, resolveCmdlineToolsUrl } from '../src/lib/requirements.js';

describe('resolveJdkUrl', () => {
  it('maps every supported platform/arch to a Temurin asset', () => {
    expect(resolveJdkUrl('win32', 'x64')).toContain('windows_hotspot');
    expect(resolveJdkUrl('darwin', 'x64')).toContain('x64_mac_hotspot');
    expect(resolveJdkUrl('darwin', 'arm64')).toContain('aarch64_mac_hotspot');
    expect(resolveJdkUrl('linux', 'x64')).toContain('x64_linux_hotspot');
    expect(resolveJdkUrl('linux', 'arm64')).toContain('aarch64_linux_hotspot');
  });
  it('uses .zip for Windows and .tar.gz elsewhere', () => {
    expect(resolveJdkUrl('win32', 'x64').endsWith('.zip')).toBe(true);
    expect(resolveJdkUrl('darwin', 'arm64').endsWith('.tar.gz')).toBe(true);
    expect(resolveJdkUrl('linux', 'x64').endsWith('.tar.gz')).toBe(true);
  });
  it('throws on an unsupported platform/arch', () => {
    expect(() => resolveJdkUrl('freebsd', 'x64')).toThrow(/unsupported/i);
    expect(() => resolveJdkUrl('linux', 'ia32')).toThrow(/unsupported/i);
  });
});

describe('resolveCmdlineToolsUrl', () => {
  it('maps each OS to the matching cmdline-tools zip', () => {
    expect(resolveCmdlineToolsUrl('win32')).toContain('commandlinetools-win');
    expect(resolveCmdlineToolsUrl('darwin')).toContain('commandlinetools-mac');
    expect(resolveCmdlineToolsUrl('linux')).toContain('commandlinetools-linux');
  });
  it('throws on an unsupported platform', () => {
    expect(() => resolveCmdlineToolsUrl('freebsd')).toThrow(/unsupported/i);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd devkit && npx vitest run test/requirements.test.ts`
Expected: FAIL — `resolveJdkUrl is not a function` / import error.

- [ ] **Step 3: Implement the URLs + selectors**

In `devkit/src/lib/requirements.ts`, replace the `JDK_DOWNLOAD` and `CMDLINE_TOOLS_URL` blocks with:

```typescript
const TEMURIN_BASE =
  'https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.13%2B11';

export const JDK_DOWNLOAD = {
  windowsX64: `${TEMURIN_BASE}/OpenJDK17U-jdk_x64_windows_hotspot_17.0.13_11.zip`,
  macX64: `${TEMURIN_BASE}/OpenJDK17U-jdk_x64_mac_hotspot_17.0.13_11.tar.gz`,
  macArm64: `${TEMURIN_BASE}/OpenJDK17U-jdk_aarch64_mac_hotspot_17.0.13_11.tar.gz`,
  linuxX64: `${TEMURIN_BASE}/OpenJDK17U-jdk_x64_linux_hotspot_17.0.13_11.tar.gz`,
  linuxArm64: `${TEMURIN_BASE}/OpenJDK17U-jdk_aarch64_linux_hotspot_17.0.13_11.tar.gz`,
} as const;

const CMDLINE_TOOLS_BASE = 'https://dl.google.com/android/repository';

export const CMDLINE_TOOLS_URL = {
  windows: `${CMDLINE_TOOLS_BASE}/commandlinetools-win-11076708_latest.zip`,
  mac: `${CMDLINE_TOOLS_BASE}/commandlinetools-mac-11076708_latest.zip`,
  linux: `${CMDLINE_TOOLS_BASE}/commandlinetools-linux-11076708_latest.zip`,
} as const;

/** Temurin 17 asset URL for the running OS/arch, or throws if unsupported. */
export function resolveJdkUrl(platform: NodeJS.Platform, arch: string): string {
  if (platform === 'win32' && arch === 'x64') return JDK_DOWNLOAD.windowsX64;
  if (platform === 'darwin' && arch === 'x64') return JDK_DOWNLOAD.macX64;
  if (platform === 'darwin' && arch === 'arm64') return JDK_DOWNLOAD.macArm64;
  if (platform === 'linux' && arch === 'x64') return JDK_DOWNLOAD.linuxX64;
  if (platform === 'linux' && arch === 'arm64') return JDK_DOWNLOAD.linuxArm64;
  throw new Error(
    `Unsupported platform/arch for the managed JDK: ${platform}/${arch}. ` +
      'Install a JDK 17 manually and set JAVA_HOME.',
  );
}

/** Google cmdline-tools zip URL for the running OS, or throws if unsupported. */
export function resolveCmdlineToolsUrl(platform: NodeJS.Platform): string {
  if (platform === 'win32') return CMDLINE_TOOLS_URL.windows;
  if (platform === 'darwin') return CMDLINE_TOOLS_URL.mac;
  if (platform === 'linux') return CMDLINE_TOOLS_URL.linux;
  throw new Error(
    `Unsupported platform for Android cmdline-tools: ${platform}. ` +
      'Install the Android SDK manually and set ANDROID_HOME.',
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd devkit && npx vitest run test/requirements.test.ts`
Expected: PASS (existing `REQUIREMENTS`/`satisfies*` tests still green).

- [ ] **Step 5: Commit**

```bash
git add devkit/src/lib/requirements.ts devkit/test/requirements.test.ts
git commit -m "feat(devkit): per-OS/arch Temurin + cmdline-tools URL selectors"
```

---

### Task 2: Cross-platform streamed download util

**Files:**
- Create: `devkit/src/util/download.ts`
- Test: `devkit/test/download.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type ProgressFn = (received: number, total: number) => void`
  - `downloadFile(url: string, dest: string, onProgress?: ProgressFn, fetchImpl?: typeof fetch): Promise<void>` — streams the response body to `dest`, calling `onProgress` as bytes arrive. Throws on non-OK HTTP status.

- [ ] **Step 1: Write the failing test**

Create `devkit/test/download.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { downloadFile } from '../src/util/download.js';

let dir = '';
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'dl-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

/** Minimal fake fetch returning a streamed body with a content-length. */
function fakeFetch(body: string, ok = true, status = 200): typeof fetch {
  const bytes = new TextEncoder().encode(body);
  return (async () => ({
    ok,
    status,
    headers: { get: (h: string) => (h.toLowerCase() === 'content-length' ? String(bytes.length) : null) },
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, Math.ceil(bytes.length / 2)));
        controller.enqueue(bytes.slice(Math.ceil(bytes.length / 2)));
        controller.close();
      },
    }),
  })) as unknown as typeof fetch;
}

describe('downloadFile', () => {
  it('writes the streamed body to disk and reports progress to completion', async () => {
    const dest = join(dir, 'out.bin');
    const seen: Array<[number, number]> = [];
    await downloadFile('http://x/file', dest, (r, t) => seen.push([r, t]), fakeFetch('hello world'));
    expect(readFileSync(dest, 'utf8')).toBe('hello world');
    const last = seen.at(-1)!;
    expect(last[0]).toBe(last[1]); // received reached total
    expect(last[1]).toBe(11);
  });

  it('throws on a non-OK status', async () => {
    const dest = join(dir, 'out.bin');
    await expect(
      downloadFile('http://x/missing', dest, undefined, fakeFetch('nope', false, 404)),
    ).rejects.toThrow(/404/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd devkit && npx vitest run test/download.test.ts`
Expected: FAIL — cannot find module `download.js`.

- [ ] **Step 3: Implement `download.ts`**

Create `devkit/src/util/download.ts`:

```typescript
import { createWriteStream } from 'node:fs';
import { Writable } from 'node:stream';

export type ProgressFn = (received: number, total: number) => void;

/**
 * Streams `url` to `dest`, invoking `onProgress(received, total)` as chunks
 * arrive (total is 0 when the server omits Content-Length). Uses the global
 * `fetch` (Node >=18); `fetchImpl` is injectable for tests. Throws on a
 * non-OK HTTP status or a missing body.
 */
export async function downloadFile(
  url: string,
  dest: string,
  onProgress?: ProgressFn,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`Download failed (${res.status}) for ${url}`);
  }
  if (res.body === null) {
    throw new Error(`Download returned an empty body for ${url}`);
  }
  const total = Number(res.headers.get('content-length') ?? '0');
  let received = 0;

  const file = createWriteStream(dest);
  const sink = new Writable({
    write(chunk: Buffer, _enc, cb): void {
      received += chunk.length;
      onProgress?.(received, total);
      file.write(chunk, () => cb());
    },
  });

  await new Promise<void>((resolve, reject) => {
    sink.on('error', reject);
    file.on('error', reject);
    void (async () => {
      try {
        const reader = res.body!.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          await new Promise<void>((res2, rej2) =>
            sink.write(Buffer.from(value), (e) => (e ? rej2(e) : res2())),
          );
        }
        sink.end(() => file.end(() => resolve()));
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    })();
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd devkit && npx vitest run test/download.test.ts`
Expected: PASS (both cases).

- [ ] **Step 5: Commit**

```bash
git add devkit/src/util/download.ts devkit/test/download.test.ts
git commit -m "feat(devkit): Node-native streamed download with progress"
```

---

### Task 2 dependency prerequisite (deps install)

Before Task 3 compiles, the new libraries must exist. This is folded here because `archive.ts` imports them.

**Files:**
- Modify: `devkit/package.json`

- [ ] **Step 1: Add the dependencies**

Run:

```bash
cd devkit && npm install extract-zip@^2.0.1 tar@^7.4.3
```

- [ ] **Step 2: Verify types resolve**

`extract-zip` and `tar` v7 both ship their own type declarations. Confirm:

Run: `cd devkit && node -e "require.resolve('extract-zip'); require.resolve('tar'); console.log('ok')"`
Expected: `ok`

If `tar`'s types are missing under your TS resolution, also run `npm install -D @types/tar@^6.1.13` and note it in the commit.

- [ ] **Step 3: Commit**

```bash
git add devkit/package.json package-lock.json
git commit -m "build(devkit): add extract-zip + tar for cross-platform extraction"
```

---

### Task 3: Cross-platform archive extraction

**Files:**
- Create: `devkit/src/util/archive.ts`
- Test: `devkit/test/archive.test.ts`

**Interfaces:**
- Consumes: `extract-zip`, `tar`.
- Produces:
  - `extractTarGz(archive: string, dest: string): Promise<void>`
  - `extractZip(archive: string, dest: string): Promise<void>`
  - `extractArchive(archive: string, dest: string): Promise<void>` — dispatches on extension (`.zip` → zip, `.tar.gz`/`.tgz` → tar).

- [ ] **Step 1: Write the failing test**

Create `devkit/test/archive.test.ts` (tar round-trips with the `tar` lib — deterministic on every OS; zip dispatch is asserted via the extension router):

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { create as tarCreate } from 'tar';
import { extractTarGz, extractArchive } from '../src/util/archive.js';

let dir = '';
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'arc-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

describe('extractTarGz', () => {
  it('round-trips a packed directory back to disk', async () => {
    const src = join(dir, 'src');
    mkdirSync(join(src, 'sub'), { recursive: true });
    writeFileSync(join(src, 'sub', 'a.txt'), 'alpha');
    const tgz = join(dir, 'bundle.tar.gz');
    await tarCreate({ gzip: true, file: tgz, cwd: src }, ['sub']);

    const out = join(dir, 'out');
    await extractTarGz(tgz, out);
    expect(readFileSync(join(out, 'sub', 'a.txt'), 'utf8')).toBe('alpha');
  });
});

describe('extractArchive', () => {
  it('routes .tar.gz to the tar extractor', async () => {
    const src = join(dir, 'src');
    mkdirSync(src, { recursive: true });
    writeFileSync(join(src, 'b.txt'), 'beta');
    const tgz = join(dir, 'bundle.tgz');
    await tarCreate({ gzip: true, file: tgz, cwd: src }, ['b.txt']);

    const out = join(dir, 'out');
    await extractArchive(tgz, out);
    expect(existsSync(join(out, 'b.txt'))).toBe(true);
  });

  it('throws on an unknown archive extension', async () => {
    await expect(extractArchive(join(dir, 'x.rar'), join(dir, 'o'))).rejects.toThrow(/unsupported archive/i);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd devkit && npx vitest run test/archive.test.ts`
Expected: FAIL — cannot find module `archive.js`.

- [ ] **Step 3: Implement `archive.ts`**

Create `devkit/src/util/archive.ts`:

```typescript
import { mkdirSync } from 'node:fs';
import extract from 'extract-zip';
import { extract as tarExtract } from 'tar';

/** Extracts a .tar.gz/.tgz into `dest` (created if absent). */
export async function extractTarGz(archive: string, dest: string): Promise<void> {
  mkdirSync(dest, { recursive: true });
  await tarExtract({ file: archive, cwd: dest });
}

/** Extracts a .zip into `dest` (created if absent). */
export async function extractZip(archive: string, dest: string): Promise<void> {
  mkdirSync(dest, { recursive: true });
  await extract(archive, { dir: dest });
}

/** Extracts by extension: .zip → zip, .tar.gz/.tgz → tar. */
export async function extractArchive(archive: string, dest: string): Promise<void> {
  if (archive.endsWith('.zip')) return extractZip(archive, dest);
  if (archive.endsWith('.tar.gz') || archive.endsWith('.tgz')) {
    return extractTarGz(archive, dest);
  }
  throw new Error(`Unsupported archive type: ${archive}`);
}
```

Note: `extract-zip` requires an **absolute** `dir`. Callers (Tasks 4–5) always pass paths under `~/.sublime`, which are absolute; the temp-dir tests use absolute `tmpdir()` paths too.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd devkit && npx vitest run test/archive.test.ts`
Expected: PASS (tar round-trip + extension routing + throw).

- [ ] **Step 5: Commit**

```bash
git add devkit/src/util/archive.ts devkit/test/archive.test.ts
git commit -m "feat(devkit): cross-platform zip + tar.gz extraction"
```

---

### Task 4: JDK layout normalization + managed JDK installer

**Files:**
- Modify: `devkit/src/lib/jdk.ts`
- Test: `devkit/test/jdk.test.ts`

**Interfaces:**
- Consumes: `resolveJdkUrl` (Task 1), `downloadFile`/`ProgressFn` (Task 2), `extractArchive` (Task 3), `sublimeHomeDir` (existing).
- Produces:
  - `hasJava(home: string): boolean` — true if `home/bin/java` or `home/bin/java.exe` exists.
  - `findJavaHomeRoot(extractedDir: string): string | null` — the inner dir whose `bin/java[.exe]` exists (handles Windows/Linux `<ver>/bin` and macOS `<ver>/Contents/Home/bin`).
  - `interface InstallDeps { download: typeof downloadFile; extract: typeof extractArchive }`
  - `interface EnsureJdkOptions { deps?: InstallDeps; workDir?: string }`
  - `ensureManagedJdk17(opts?: EnsureJdkOptions): Promise<string>` — returns `~/.sublime/jdk-17` (or `<workDir>/jdk-17`), downloading+installing if absent. Idempotent.
- Removes: the old `ensurePortableJdk17` PowerShell implementation (callers updated in Tasks 5/9; `build.ts` updated in Task 7).

- [ ] **Step 1: Write the failing test**

Create `devkit/test/jdk.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hasJava, findJavaHomeRoot, ensureManagedJdk17 } from '../src/lib/jdk.js';

let dir = '';
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'jdk-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

function makeJava(home: string): void {
  mkdirSync(join(home, 'bin'), { recursive: true });
  writeFileSync(join(home, 'bin', 'java'), '');
}

describe('findJavaHomeRoot', () => {
  it('finds a Linux/Windows-style <ver>/bin/java layout', () => {
    const ver = join(dir, 'jdk-17.0.13+11');
    makeJava(ver);
    expect(findJavaHomeRoot(dir)).toBe(ver);
  });
  it('finds a macOS <ver>/Contents/Home/bin/java layout', () => {
    const home = join(dir, 'jdk-17.0.13+11', 'Contents', 'Home');
    makeJava(home);
    expect(findJavaHomeRoot(dir)).toBe(home);
  });
  it('returns null when no java is present', () => {
    mkdirSync(join(dir, 'jdk-17.0.13+11'), { recursive: true });
    expect(findJavaHomeRoot(dir)).toBeNull();
  });
});

describe('ensureManagedJdk17', () => {
  it('short-circuits when the managed JDK already exists', async () => {
    makeJava(join(dir, 'jdk-17'));
    const download = vi.fn();
    const extract = vi.fn();
    const root = await ensureManagedJdk17({ workDir: dir, deps: { download, extract } });
    expect(root).toBe(join(dir, 'jdk-17'));
    expect(download).not.toHaveBeenCalled();
    expect(extract).not.toHaveBeenCalled();
  });

  it('downloads, extracts, and normalizes into <workDir>/jdk-17', async () => {
    const download = vi.fn(async () => {});
    // Simulate extraction producing a versioned top-level dir with bin/java.
    const extract = vi.fn(async (_archive: string, dest: string) => {
      makeJava(join(dest, 'jdk-17.0.13+11'));
    });
    const root = await ensureManagedJdk17({ workDir: dir, deps: { download, extract } });
    expect(root).toBe(join(dir, 'jdk-17'));
    expect(hasJava(root)).toBe(true);
    expect(download).toHaveBeenCalledOnce();
    expect(extract).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd devkit && npx vitest run test/jdk.test.ts`
Expected: FAIL — `findJavaHomeRoot`/`ensureManagedJdk17` not exported.

- [ ] **Step 3: Rewrite `jdk.ts`**

Replace the entire contents of `devkit/src/lib/jdk.ts` with:

```typescript
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { resolveJdkUrl } from './requirements.js';
import { downloadFile, type ProgressFn } from '../util/download.js';
import { extractArchive } from '../util/archive.js';
import { log } from '../util/log.js';

export function sublimeHomeDir(): string {
  return join(homedir(), '.sublime');
}

/** True if `home/bin/java` or `home/bin/java.exe` exists. */
export function hasJava(home: string): boolean {
  return (
    existsSync(join(home, 'bin', 'java')) ||
    existsSync(join(home, 'bin', 'java.exe'))
  );
}

function listDirs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(dir, e.name));
}

/**
 * Given an extracted Temurin archive, returns the inner directory that is a
 * valid JAVA_HOME. Temurin extracts a single versioned top-level folder whose
 * java lives at `bin/java` (Windows/Linux) or `Contents/Home/bin/java`
 * (macOS). Returns null if none is found.
 */
export function findJavaHomeRoot(extractedDir: string): string | null {
  for (const root of [extractedDir, ...listDirs(extractedDir)]) {
    for (const home of [root, join(root, 'Contents', 'Home')]) {
      if (hasJava(home)) return home;
    }
  }
  return null;
}

export interface InstallDeps {
  download: (url: string, dest: string, onProgress?: ProgressFn) => Promise<void>;
  extract: (archive: string, dest: string) => Promise<void>;
}

const defaultDeps: InstallDeps = { download: downloadFile, extract: extractArchive };

export interface EnsureJdkOptions {
  deps?: InstallDeps;
  workDir?: string;
}

/**
 * Ensures a managed Temurin JDK 17 at `<workDir>/jdk-17` (default
 * `~/.sublime/jdk-17`) on every platform. Downloads + extracts + normalizes
 * the layout if absent; idempotent otherwise. Returns the JAVA_HOME path.
 */
export async function ensureManagedJdk17(opts: EnsureJdkOptions = {}): Promise<string> {
  const deps = opts.deps ?? defaultDeps;
  const workDir = opts.workDir ?? sublimeHomeDir();
  const root = join(workDir, 'jdk-17');
  if (hasJava(root)) return root;

  const url = resolveJdkUrl(process.platform, process.arch);
  const ext = url.endsWith('.zip') ? '.zip' : '.tar.gz';
  mkdirSync(workDir, { recursive: true });
  const archive = join(workDir, `jdk-17${ext}`);
  const tmp = join(workDir, 'jdk-17-tmp');
  rmSync(tmp, { recursive: true, force: true });
  rmSync(root, { recursive: true, force: true });

  log.step('Downloading JDK 17 (Temurin)…');
  await deps.download(url, archive, (received, total) => log.progress(received, total));
  log.progressDone();
  log.step('Extracting JDK 17…');
  await deps.extract(archive, tmp);

  const home = findJavaHomeRoot(tmp);
  if (home === null) {
    throw new Error('JDK 17 archive did not contain a JDK (no bin/java).');
  }
  renameSync(home, root);
  rmSync(tmp, { recursive: true, force: true });
  rmSync(archive, { force: true });
  if (!hasJava(root)) {
    throw new Error(`Managed JDK 17 install incomplete (no bin/java at ${root}).`);
  }
  return root;
}

/** @deprecated use ensureManagedJdk17. Kept as an alias during migration. */
export const ensurePortableJdk17 = (): Promise<string> => ensureManagedJdk17();
```

Note: `log.progress` and `log.progressDone` are added in Task 8. Because tests for this task inject `deps` and stub `download`/`extract`, they never exercise a real progress render — but `log.progress` must exist at import time. **Task 8 must merge before this task's file is run in CI**; in subagent order, dispatch Task 8 before Task 4, OR add the `log.progress`/`log.progressDone` no-op stubs as part of this task and let Task 8 flesh them out. The implementer should add minimal `progress`/`progressDone` stubs to `log.ts` here if Task 8 has not landed, to keep the module importable.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd devkit && npx vitest run test/jdk.test.ts`
Expected: PASS (3 `findJavaHomeRoot` + 2 `ensureManagedJdk17`).

- [ ] **Step 5: Commit**

```bash
git add devkit/src/lib/jdk.ts devkit/test/jdk.test.ts devkit/src/util/log.ts
git commit -m "feat(devkit): managed cross-platform JDK 17 installer + layout normalization"
```

---

### Task 5: Managed Android SDK installer (cmdline-tools + layout fix)

**Files:**
- Create: `devkit/src/lib/android-sdk.ts`
- Test: `devkit/test/android-sdk.test.ts`

**Interfaces:**
- Consumes: `resolveCmdlineToolsUrl` (Task 1), `InstallDeps` (Task 4), `sublimeHomeDir` (Task 4).
- Produces:
  - `managedSdkDir(workDir?: string): string` — `<workDir>/android-sdk` (default `~/.sublime/android-sdk`).
  - `hasCmdlineTools(sdkDir: string): boolean` — true if `cmdline-tools/latest/bin/sdkmanager[.bat]` exists.
  - `fixCmdlineToolsLayout(extractedDir: string, sdkDir: string): void` — moves the extracted `cmdline-tools/` into `<sdkDir>/cmdline-tools/latest`.
  - `ensureManagedSdk(opts?: { deps?: InstallDeps; workDir?: string }): Promise<string>` — returns the SDK root, installing cmdline-tools if absent. Idempotent.

- [ ] **Step 1: Write the failing test**

Create `devkit/test/android-sdk.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd devkit && npx vitest run test/android-sdk.test.ts`
Expected: FAIL — cannot find module `android-sdk.js`.

- [ ] **Step 3: Implement `android-sdk.ts`**

Create `devkit/src/lib/android-sdk.ts`:

```typescript
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd devkit && npx vitest run test/android-sdk.test.ts`
Expected: PASS (managedSdkDir + layout-fix + 2 ensureManagedSdk).

- [ ] **Step 5: Commit**

```bash
git add devkit/src/lib/android-sdk.ts devkit/test/android-sdk.test.ts
git commit -m "feat(devkit): managed Android cmdline-tools installer + latest layout fix"
```

---

### Task 6: stdin support in exec + license acceptance

**Files:**
- Modify: `devkit/src/util/exec.ts`
- Modify: `devkit/src/lib/sdkmanager.ts`
- Test: `devkit/test/sdkmanager.test.ts` (extend)

**Interfaces:**
- Consumes: `sdkmanagerPath` (existing in `probe.ts`), `run`/`RunResult`/`RunOptions` (existing in `exec.ts`).
- Produces:
  - `RunOptions.input?: string` — fed to the child's stdin.
  - `acceptLicenses(sdkRoot: string, jdkHome: string, runner?: Runner): Promise<number>` — runs `sdkmanager --licenses` piping enough "y" lines to accept all; returns the exit code. `type Runner = (file: string, args: string[], opts: RunOptions) => Promise<RunResult>`.

- [ ] **Step 1: Write the failing test**

Append to `devkit/test/sdkmanager.test.ts`:

```typescript
import { acceptLicenses } from '../src/lib/sdkmanager.js';
import type { RunResult, RunOptions } from '../src/util/exec.js';

describe('acceptLicenses', () => {
  it('runs sdkmanager --licenses feeding repeated "y" on stdin', async () => {
    const calls: Array<{ file: string; args: string[]; opts: RunOptions }> = [];
    const runner = async (file: string, args: string[], opts: RunOptions): Promise<RunResult> => {
      calls.push({ file, args, opts });
      return { stdout: '', stderr: '', exitCode: 0 };
    };
    const code = await acceptLicenses('/sdk', '/jdk', runner);
    expect(code).toBe(0);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.file).toContain('sdkmanager');
    expect(calls[0]!.args).toContain('--licenses');
    expect(calls[0]!.args).toContain('--sdk_root=/sdk');
    // Several acceptances, scoped to the managed JDK.
    expect((calls[0]!.opts.input ?? '').match(/y/g)!.length).toBeGreaterThanOrEqual(10);
    expect(calls[0]!.opts.env).toMatchObject({ JAVA_HOME: '/jdk', ANDROID_HOME: '/sdk' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd devkit && npx vitest run test/sdkmanager.test.ts`
Expected: FAIL — `acceptLicenses` not exported.

- [ ] **Step 3a: Add `input` to `exec.ts`**

In `devkit/src/util/exec.ts`, extend `RunOptions` and pass `input` to execa in `run`:

```typescript
export interface RunOptions {
  cwd?: string;
  env?: Record<string, string>;
  input?: string;
}
```

In `run`, add `input` to the execa options object:

```typescript
  const result = await execa(file, args, {
    ...(opts.cwd === undefined ? {} : { cwd: opts.cwd }),
    env: { ...process.env, ...opts.env },
    ...(opts.input === undefined ? {} : { input: opts.input }),
    reject: false,
    all: false,
  });
```

- [ ] **Step 3b: Add `acceptLicenses` to `sdkmanager.ts`**

In `devkit/src/lib/sdkmanager.ts`, add imports and the function (keep existing exports):

```typescript
import { run, type RunResult, type RunOptions } from '../util/exec.js';
// (sdkmanagerPath is already importable from './probe.js')
import { sdkmanagerPath } from './probe.js';

export type Runner = (
  file: string,
  args: string[],
  opts: RunOptions,
) => Promise<RunResult>;

/**
 * Accepts all Android SDK licenses non-interactively by piping "y" lines into
 * `sdkmanager --licenses`, scoped to the managed JDK and SDK root. Returns the
 * sdkmanager exit code.
 */
export async function acceptLicenses(
  sdkRoot: string,
  jdkHome: string,
  runner: Runner = run,
): Promise<number> {
  const smPath = sdkmanagerPath(sdkRoot);
  const env = { JAVA_HOME: jdkHome, ANDROID_HOME: sdkRoot };
  // sdkmanager prompts y/N for each license; feed plenty of acceptances.
  const input = 'y\n'.repeat(50);
  const res = await runner(smPath, [`--sdk_root=${sdkRoot}`, '--licenses'], { env, input });
  return res.exitCode;
}
```

Note: `sdkmanager.ts` already imports `run` indirectly through `ensureComponents`? It currently imports `run` from `../util/exec.js`. If `run` is already imported, do not duplicate the import — only add `RunResult`/`RunOptions` to the existing import and add `sdkmanagerPath` to the existing `./probe.js` import.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd devkit && npx vitest run test/sdkmanager.test.ts`
Expected: PASS (existing `isValidNdk` tests + new `acceptLicenses`).

- [ ] **Step 5: Commit**

```bash
git add devkit/src/util/exec.ts devkit/src/lib/sdkmanager.ts devkit/test/sdkmanager.test.ts
git commit -m "feat(devkit): non-interactive SDK license acceptance"
```

---

### Task 7: Detection managed fallback + doctor-report source + build.ts wiring

**Files:**
- Modify: `devkit/src/lib/probe.ts`
- Modify: `devkit/src/lib/doctor-report.ts`
- Modify: `devkit/src/commands/build.ts:80` (swap `ensurePortableJdk17` → `ensureManagedJdk17`)
- Test: `devkit/test/probe.test.ts` (extend), `devkit/test/doctor-report.test.ts` (extend)

**Interfaces:**
- Consumes: `managedSdkDir`/`hasCmdlineTools` (Task 5), `hasJava`/`sublimeHomeDir`/`ensureManagedJdk17` (Task 4).
- Produces:
  - `resolveAndroidSdk(env: NodeJS.ProcessEnv): { path: string | null; source: 'env' | 'managed' | null }` — env first, else the managed SDK if it has cmdline-tools.
  - `Probes` gains `androidHomeSource?: 'env' | 'managed'` and `jdkSource?: 'managed' | 'path'`.
  - `gatherProbes` resolves the managed JDK first and the managed SDK fallback; doctor-report shows the source suffix.
- Unchanged: `resolveAndroidHome(env)` stays env-only (pure) so existing call sites/tests are untouched.

- [ ] **Step 1: Write the failing test**

Append to `devkit/test/probe.test.ts` a new describe (it can reuse the existing `existsSyncMock`):

```typescript
import { resolveAndroidSdk } from '../src/lib/probe.js';
import { managedSdkDir } from '../src/lib/android-sdk.js';

describe('resolveAndroidSdk (managed fallback)', () => {
  it('prefers an env ANDROID_HOME and marks the source env', () => {
    existsSyncMock.mockReturnValue(true);
    expect(resolveAndroidSdk({ ANDROID_HOME: '/a' })).toEqual({ path: '/a', source: 'env' });
  });
  it('falls back to the managed SDK when env is unset and cmdline-tools exist', () => {
    const smPath = join(managedSdkDir(), 'cmdline-tools', 'latest', 'bin',
      process.platform === 'win32' ? 'sdkmanager.bat' : 'sdkmanager');
    existsSyncMock.mockImplementation((p: string) => p === smPath);
    expect(resolveAndroidSdk({})).toEqual({ path: managedSdkDir(), source: 'managed' });
  });
  it('returns null when env is unset and no managed SDK exists', () => {
    existsSyncMock.mockReturnValue(false);
    expect(resolveAndroidSdk({})).toEqual({ path: null, source: null });
  });
});
```

Append to `devkit/test/doctor-report.test.ts`:

```typescript
it('annotates the ANDROID_HOME and JDK rows with their source', () => {
  const report = buildDoctorReport({
    ...fullyEquipped,
    androidHomeSource: 'managed',
    jdkSource: 'managed',
  });
  const androidRow = report.rows.find((r) => r.label.includes('ANDROID_HOME'));
  const jdkRow = report.rows.find((r) => r.label.includes('JDK'));
  expect(androidRow?.detail).toContain('(managed)');
  expect(jdkRow?.detail).toContain('(managed)');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd devkit && npx vitest run test/probe.test.ts test/doctor-report.test.ts`
Expected: FAIL — `resolveAndroidSdk` not exported; `androidHomeSource` not on `Probes`.

- [ ] **Step 3a: Add `resolveAndroidSdk` + managed JDK probe to `probe.ts`**

In `devkit/src/lib/probe.ts`, add the import and function, and update `gatherProbes`:

```typescript
import { managedSdkDir, hasCmdlineTools } from './android-sdk.js';
import { sublimeHomeDir, hasJava } from './jdk.js';
import { join } from 'node:path';

/** Resolves the effective Android SDK: env first, else the managed SDK. */
export function resolveAndroidSdk(
  env: NodeJS.ProcessEnv,
): { path: string | null; source: 'env' | 'managed' | null } {
  const fromEnv = resolveAndroidHome(env);
  if (fromEnv !== null) return { path: fromEnv, source: 'env' };
  const managed = managedSdkDir();
  if (hasCmdlineTools(managed)) return { path: managed, source: 'managed' };
  return { path: null, source: null };
}
```

Update `gatherProbes` so it: (a) resolves the managed JDK first, (b) uses `resolveAndroidSdk`, (c) records sources. Replace the `androidHome`/`java` portions:

```typescript
  const nodeRes = await run(process.execPath, ['-v']);

  // Prefer the managed JDK; fall back to PATH `java`.
  const managedJdk = join(sublimeHomeDir(), 'jdk-17');
  let jdk17: string | null = null;
  let jdkSource: 'managed' | 'path' | undefined;
  if (hasJava(managedJdk)) {
    const res = await run(join(managedJdk, 'bin', process.platform === 'win32' ? 'java.exe' : 'java'), ['-version']);
    jdk17 = parseJavaVersion(res.stderr);
    jdkSource = 'managed';
  } else {
    const res = await run('java', ['-version']);
    jdk17 = parseJavaVersion(res.stderr);
    if (jdk17 !== null) jdkSource = 'path';
  }

  const { path: androidHome, source: androidHomeSource } = resolveAndroidSdk(process.env);
```

Keep the existing NDK/CMake/sdkmanager filesystem block, but guard it on `androidHome !== null` (already the case). At the return, add the sources:

```typescript
  return {
    node: nodeRes.stdout.trim() || null,
    jdk17,
    ...(jdkSource ? { jdkSource } : {}),
    androidHome,
    ...(androidHomeSource ? { androidHomeSource } : {}),
    sdkmanager,
    platformTools: parseAdbVersion(adbRes.stdout) !== null,
    ndk,
    cmake,
  };
```

- [ ] **Step 3b: Extend `Probes` + source suffix in `doctor-report.ts`**

In `devkit/src/lib/doctor-report.ts`, extend the interface:

```typescript
export interface Probes {
  node: string | null;
  jdk17: string | null;
  jdkSource?: 'managed' | 'path';
  androidHome: string | null;
  androidHomeSource?: 'env' | 'managed';
  sdkmanager: boolean;
  platformTools: boolean;
  ndk: string | null;
  cmake: string | null;
}
```

Update the JDK and ANDROID_HOME rows to append the source:

```typescript
    {
      label: 'JDK 17',
      ok: satisfiesMajor(probes.jdk17, REQUIREMENTS.jdk.major),
      detail: probes.jdk17
        ? `${probes.jdk17}${probes.jdkSource ? ` (${probes.jdkSource})` : ''}`
        : 'not found (run: sublime setup)',
    },
    {
      label: 'ANDROID_HOME',
      ok: probes.androidHome !== null,
      detail: probes.androidHome
        ? `${probes.androidHome}${probes.androidHomeSource ? ` (${probes.androidHomeSource})` : ''}`
        : 'not set (run: sublime setup)',
    },
```

- [ ] **Step 3c: Point `build.ts` at the managed JDK**

In `devkit/src/commands/build.ts`, change the import and call:

```typescript
import { ensureManagedJdk17 } from '../lib/jdk.js';
```

and at line ~80 replace `const jdk17Home = await ensurePortableJdk17();` with:

```typescript
  const jdk17Home = await ensureManagedJdk17();
```

Also switch `build.ts`'s `resolveAndroidHome(process.env)` to use the managed fallback so an env-less managed install builds:

```typescript
import { resolveAndroidSdk } from '../lib/probe.js';
// …
  const { path: androidHome } = resolveAndroidSdk(process.env);
  if (androidHome === null) {
    log.error('No Android SDK found. Run: sublime setup');
    return 1;
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd devkit && npx vitest run test/probe.test.ts test/doctor-report.test.ts`
Expected: PASS. Then full suite: `cd devkit && npm test` → all green.

- [ ] **Step 5: Commit**

```bash
git add devkit/src/lib/probe.ts devkit/src/lib/doctor-report.ts devkit/src/commands/build.ts devkit/test/probe.test.ts devkit/test/doctor-report.test.ts
git commit -m "feat(devkit): managed-SDK detection fallback + source-annotated doctor rows"
```

---

### Task 8: CLI visual layer (banner, phases, progress bar, spinner) + doctor polish

**Files:**
- Modify: `devkit/src/util/log.ts`
- Modify: `devkit/src/commands/doctor.ts`
- Test: `devkit/test/log.test.ts` (extend)

**Interfaces:**
- Consumes: `picocolors` (existing).
- Produces (all on the `log` object unless noted):
  - `renderProgressBar(received: number, total: number, width?: number): string` — pure, exported.
  - `log.banner(title: string): void`
  - `log.phase(i: number, total: number, msg: string): void`
  - `log.progress(received: number, total: number): void` — in-place bar when TTY, throttled plain line otherwise.
  - `log.progressDone(): void` — finishes the progress line.
  - `spinner(text: string): Spinner` where `interface Spinner { update(text: string): void; succeed(text?: string): void; fail(text?: string): void }`.

- [ ] **Step 1: Write the failing test**

Append to `devkit/test/log.test.ts`:

```typescript
import { renderProgressBar, spinner } from '../src/util/log.js';
import { vi, beforeEach, afterEach } from 'vitest';

describe('renderProgressBar', () => {
  it('renders a filled/empty bar with percent and MB', () => {
    const out = renderProgressBar(5 * 1024 * 1024, 10 * 1024 * 1024, 10);
    expect(out).toContain('50%');
    expect(out).toContain('5.0/10.0 MB');
    expect(out).toMatch(/█{5}░{5}/);
  });
  it('clamps to 100% and handles an unknown total', () => {
    expect(renderProgressBar(10, 5, 4)).toContain('100%');
    expect(renderProgressBar(10, 0, 4)).toContain('0%');
  });
});

describe('spinner (non-TTY degradation)', () => {
  const original = process.stdout.isTTY;
  let logs: string[] = [];
  beforeEach(() => {
    logs = [];
    Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true });
    vi.spyOn(console, 'log').mockImplementation((m?: unknown) => { logs.push(String(m)); });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(process.stdout, 'isTTY', { value: original, configurable: true });
  });
  it('prints plain lines and no ANSI/control codes when not a TTY', () => {
    const s = spinner('working');
    s.succeed('done');
    const joined = logs.join('\n');
    expect(joined).toContain('done');
    // No carriage returns or escape sequences in non-TTY mode.
    expect(joined).not.toMatch(/\r|\[/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd devkit && npx vitest run test/log.test.ts`
Expected: FAIL — `renderProgressBar`/`spinner` not exported.

- [ ] **Step 3: Implement the visual layer**

In `devkit/src/util/log.ts`, add above the `log` object:

```typescript
const isTTY = (): boolean => process.stdout.isTTY === true;

const mb = (n: number): string => (n / (1024 * 1024)).toFixed(1);

/** Pure: `[████░░░░]  50%  5.0/10.0 MB`. */
export function renderProgressBar(received: number, total: number, width = 18): string {
  const ratio = total > 0 ? Math.min(1, received / total) : 0;
  const filled = Math.round(ratio * width);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  const pct = String(Math.round(ratio * 100)).padStart(3);
  const size = total > 0 ? `  ${mb(received)}/${mb(total)} MB` : '';
  return `[${bar}] ${pct}%${size}`;
}

const SPIN_FRAMES = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'];

export interface Spinner {
  update(text: string): void;
  succeed(text?: string): void;
  fail(text?: string): void;
}

/** A TTY spinner; in non-TTY mode it just prints plain status lines. */
export function spinner(text: string): Spinner {
  let current = text;
  if (!isTTY()) {
    console.log(`  … ${current}`);
    return {
      update: (t) => { current = t; console.log(`  … ${t}`); },
      succeed: (t) => console.log(pc.green(`  ✓ ${t ?? current}`)),
      fail: (t) => console.error(pc.red(`  ✗ ${t ?? current}`)),
    };
  }
  let i = 0;
  const render = (): void => {
    process.stdout.write(`\r  ${pc.cyan(SPIN_FRAMES[i % SPIN_FRAMES.length]!)} ${current}   `);
    i += 1;
  };
  const timer = setInterval(render, 80);
  render();
  const stop = (mark: string, t?: string): void => {
    clearInterval(timer);
    process.stdout.write(`\r  ${mark} ${t ?? current}        \n`);
  };
  return {
    update: (t) => { current = t; },
    succeed: (t) => stop(pc.green('✓'), t),
    fail: (t) => stop(pc.red('✗'), t),
  };
}
```

Then add these methods to the `log` object literal:

```typescript
  banner: (title: string): void => {
    console.log('');
    console.log(pc.bold(pc.cyan(`  ${title}`)));
    console.log('');
  },
  phase: (i: number, total: number, msg: string): void => {
    console.log(pc.bold(`  [${i}/${total}] ${msg}`));
  },
  progress: (received: number, total: number): void => {
    const line = renderProgressBar(received, total);
    if (isTTY()) {
      process.stdout.write(`\r        ${line}`);
    }
    // Non-TTY: stay silent here; phase headers carry progress to keep logs clean.
  },
  progressDone: (): void => {
    if (isTTY()) process.stdout.write('\n');
  },
```

- [ ] **Step 4: Polish `doctor.ts`**

Replace `devkit/src/commands/doctor.ts` body to add the banner + a one-line verdict:

```typescript
import { gatherProbes } from '../lib/probe.js';
import { buildDoctorReport } from '../lib/doctor-report.js';
import { log } from '../util/log.js';

export async function doctorCommand(): Promise<number> {
  log.banner('Sublime · Environment doctor');
  const probes = await gatherProbes();
  const report = buildDoctorReport(probes);
  log.table(report.rows);
  if (report.ok) {
    log.success('Environment ready — run: sublime build');
    return 0;
  }
  log.warn('Some requirements are missing — run: sublime setup');
  return 1;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd devkit && npx vitest run test/log.test.ts`
Expected: PASS (progress bar + non-TTY spinner).

- [ ] **Step 6: Commit**

```bash
git add devkit/src/util/log.ts devkit/src/commands/doctor.ts devkit/test/log.test.ts
git commit -m "feat(devkit): progress-driven CLI visuals (banner, phases, bar, spinner)"
```

---

### Task 9: Rewrite `setup` as a 5-phase provisioner

**Files:**
- Modify: `devkit/src/commands/setup.ts`
- Test: `devkit/test/commands/setup.test.ts` (create)

**Interfaces:**
- Consumes: `ensureManagedJdk17` (Task 4), `ensureManagedSdk`/`managedSdkDir` (Task 5), `acceptLicenses` (Task 6), `ensureComponents` (existing in `sdkmanager.ts`), `gatherProbes`/`buildDoctorReport` (existing), `log.banner`/`log.phase` (Task 8), `REQUIREMENTS` (existing).
- Produces:
  - `SETUP_COMPONENTS: string[]` — the full sdkmanager id list.
  - `setupCommand(deps?: SetupDeps): Promise<number>` where `SetupDeps` injects `ensureJdk`, `ensureSdk`, `acceptLicenses`, `installComponents`, `report` for tests.

- [ ] **Step 1: Write the failing test**

Create `devkit/test/commands/setup.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { SETUP_COMPONENTS, setupCommand } from '../../src/commands/setup.js';

describe('SETUP_COMPONENTS', () => {
  it('lists the full pinned toolchain', () => {
    expect(SETUP_COMPONENTS).toEqual([
      'platform-tools',
      'platforms;android-35',
      'build-tools;35.0.0',
      'ndk;27.1.12297006',
      'cmake;3.22.1',
    ]);
  });
});

describe('setupCommand orchestration', () => {
  it('runs phases in order and returns 0 when the env verifies', async () => {
    const order: string[] = [];
    const code = await setupCommand({
      ensureJdk: async () => { order.push('jdk'); return '/jdk'; },
      ensureSdk: async () => { order.push('sdk'); return '/sdk'; },
      acceptLicenses: async () => { order.push('licenses'); return 0; },
      installComponents: async (_root, ids) => { order.push(`install:${ids.length}`); },
      report: () => ({ ok: true, rows: [] }),
    });
    expect(order).toEqual(['jdk', 'sdk', 'licenses', 'install:5']);
    expect(code).toBe(0);
  });

  it('returns 1 when verification fails', async () => {
    const code = await setupCommand({
      ensureJdk: async () => '/jdk',
      ensureSdk: async () => '/sdk',
      acceptLicenses: async () => 0,
      installComponents: async () => {},
      report: () => ({ ok: false, rows: [] }),
    });
    expect(code).toBe(1);
  });

  it('propagates an installer failure as a non-zero exit', async () => {
    const code = await setupCommand({
      ensureJdk: async () => '/jdk',
      ensureSdk: async () => '/sdk',
      acceptLicenses: async () => 0,
      installComponents: async () => { throw new Error('network'); },
      report: () => ({ ok: true, rows: [] }),
    }).catch(() => 1);
    expect(code).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd devkit && npx vitest run test/commands/setup.test.ts`
Expected: FAIL — `SETUP_COMPONENTS`/`setupCommand` shape mismatch.

- [ ] **Step 3: Rewrite `setup.ts`**

Replace `devkit/src/commands/setup.ts` with:

```typescript
import { ensureManagedJdk17 } from '../lib/jdk.js';
import { ensureManagedSdk, managedSdkDir } from '../lib/android-sdk.js';
import { acceptLicenses as acceptLicensesDefault } from '../lib/sdkmanager.js';
import { ensureComponents } from '../lib/sdkmanager.js';
import { gatherProbes } from '../lib/probe.js';
import { buildDoctorReport, type DoctorReport } from '../lib/doctor-report.js';
import { REQUIREMENTS } from '../lib/requirements.js';
import { log } from '../util/log.js';

/** The full pinned toolchain `setup` installs in one shot. */
export const SETUP_COMPONENTS: string[] = [
  'platform-tools',
  `platforms;${REQUIREMENTS.platform}`,
  `build-tools;${REQUIREMENTS.buildTools}`,
  `ndk;${REQUIREMENTS.ndk}`,
  `cmake;${REQUIREMENTS.cmake}`,
];

export interface SetupDeps {
  ensureJdk: () => Promise<string>;
  ensureSdk: () => Promise<string>;
  acceptLicenses: (sdkRoot: string, jdkHome: string) => Promise<number>;
  installComponents: (sdkRoot: string, ids: string[], jdkHome: string) => Promise<void>;
  report: () => Promise<DoctorReport> | DoctorReport;
}

const defaultDeps: SetupDeps = {
  ensureJdk: () => ensureManagedJdk17(),
  ensureSdk: () => ensureManagedSdk(),
  acceptLicenses: acceptLicensesDefault,
  installComponents: ensureComponents,
  report: async () => buildDoctorReport(await gatherProbes()),
};

export async function setupCommand(deps: SetupDeps = defaultDeps): Promise<number> {
  log.banner('Sublime · Android build setup');
  const TOTAL = 5;

  log.phase(1, TOTAL, 'JDK 17 (Temurin)');
  const jdkHome = await deps.ensureJdk();

  log.phase(2, TOTAL, 'Android cmdline-tools');
  const sdkRoot = await deps.ensureSdk();

  log.phase(3, TOTAL, 'Accept SDK licenses');
  await deps.acceptLicenses(sdkRoot, jdkHome);

  log.phase(4, TOTAL, 'SDK packages');
  await deps.installComponents(sdkRoot, SETUP_COMPONENTS, jdkHome);

  log.phase(5, TOTAL, 'Verify');
  const report = await deps.report();
  log.table(report.rows);
  if (report.ok) {
    log.success(`Done — toolchain ready at ${managedSdkDir()}. Run: sublime build`);
    return 0;
  }
  log.warn('Setup finished but some checks did not pass — re-run: sublime setup');
  return 1;
}
```

Note: `DoctorReport` must be exported from `doctor-report.ts` (it already is). The CLI wiring in `cli.ts` calls `setupCommand()` with no args — unchanged, so it uses `defaultDeps`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd devkit && npx vitest run test/commands/setup.test.ts`
Expected: PASS (component list + 3 orchestration cases).

- [ ] **Step 5: Commit**

```bash
git add devkit/src/commands/setup.ts devkit/test/commands/setup.test.ts
git commit -m "feat(devkit): one-shot cross-platform setup provisioner (5 phases)"
```

---

### Task 10: Docs + changeset + full-suite green

**Files:**
- Modify: `website/docs/getting-started/commands.md`
- Modify: `website/docs/platforms/mobile/building.md` (note `setup` provisions the toolchain)
- Create: `.changeset/cross-platform-doctor-setup.md`
- Modify: `devkit/README.md`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: user-facing docs + a changeset (patch `@sublime-ui/devkit`).

- [ ] **Step 1: Add the changeset**

Create `.changeset/cross-platform-doctor-setup.md`:

```markdown
---
"@sublime-ui/devkit": minor
---

`sublime setup` now provisions the complete Android build toolchain (JDK 17 +
cmdline-tools + licenses + platform-tools + platform + build-tools + NDK +
CMake) automatically on Windows, macOS, and Ubuntu — no admin, no Homebrew/apt.
Everything installs under `~/.sublime/` and is auto-detected by `sublime
doctor` and `sublime build` with no environment changes. The CLI now shows a
download progress bar and numbered phases.
```

- [ ] **Step 2: Document the new behavior**

In `website/docs/getting-started/commands.md`, under the `sublime setup` entry, add:

```markdown
`sublime setup` installs the full Android toolchain into `~/.sublime`
(`jdk-17/` and `android-sdk/`) on Windows, macOS, and Linux. It needs no admin
rights and changes no environment variables — `sublime doctor` and `sublime
build` find the managed toolchain automatically. Re-running `setup` is safe; it
resumes from the first missing piece.
```

In `website/docs/platforms/mobile/building.md`, add a sentence near the top:

```markdown
Before your first build, run `sublime setup` once — it downloads and installs
the JDK, Android SDK, NDK, and CMake under `~/.sublime`. Then `sublime build`
produces the APK (or `sublime build --aab` for an App Bundle).
```

- [ ] **Step 3: Update `devkit/README.md`**

Find the `setup`/`doctor` section in `devkit/README.md` and update it to state that `setup` is fully automatic on all three platforms and installs into `~/.sublime` with no env changes. (If no such section exists, add a short "Environment setup" section with the two commands.)

- [ ] **Step 4: Run the full suite + typecheck + build**

Run: `cd devkit && npm test && npm run typecheck && npm run build`
Expected: all tests PASS, `tsc --noEmit` clean, `tsup` emits `dist/cli.js`.

- [ ] **Step 5: Commit**

```bash
git add website/docs .changeset/cross-platform-doctor-setup.md devkit/README.md
git commit -m "docs(devkit): document cross-platform setup + add changeset"
```

---

## Manual verification (per-OS, not automated)

The unit/integration tests above are hermetic — they never hit the network or
run real `sdkmanager`. The real toolchain install must be verified by hand on
each OS:

1. On a clean machine (or after `rm -rf ~/.sublime`), run `node devkit/dist/cli.js setup`.
2. Confirm the progress bar renders during downloads and phases advance 1→5.
3. Confirm `node devkit/dist/cli.js doctor` shows all rows green with
   `ANDROID_HOME … (managed)` and `JDK 17 … (managed)`.
4. In a scaffolded mobile app, run `sublime build` and `sublime build --aab`;
   confirm `dist/mobile/*.apk` and `*.aab` are produced.
5. Repeat on macOS (Intel + Apple Silicon if available) and Ubuntu.

---

## Self-Review

**Spec coverage:**
- Managed-only install, no env mutation → Tasks 4, 5 (install to `~/.sublime`), Task 7 (detection fallback, no env writes). ✓
- Full toolchain in one shot → Task 9 `SETUP_COMPONENTS` (platform-tools, platform, build-tools, NDK, CMake) + licenses. ✓
- Fully automatic portable downloads all platforms → Tasks 1 (URLs), 2 (download), 3 (extract), 4 (JDK), 5 (SDK). ✓
- Two new devkit-only deps → Task 2-prereq (`extract-zip`, `tar`). ✓
- JDK layout normalization (macOS `Contents/Home`) → Task 4 `findJavaHomeRoot`. ✓
- cmdline-tools `latest` layout fix → Task 5 `fixCmdlineToolsLayout`. ✓
- License acceptance → Task 6 `acceptLicenses`. ✓
- Managed detection + source-annotated rows → Task 7. ✓
- Visual CLI (banner, phases, progress bar, spinner) + TTY gating → Task 8. ✓
- Hermetic tests via injection → every task injects deps/runners. ✓
- Docs + changeset → Task 10. ✓
- Scope guards (no iOS/keystore/env-writing) → respected; `--aab` unchanged. ✓

**Type consistency:** `InstallDeps` defined in Task 4, reused in Task 5. `resolveAndroidSdk` shape `{ path, source }` consistent across Task 7 producer + tests. `Probes` optional `androidHomeSource`/`jdkSource` added in Task 7 and consumed in `doctor-report`. `SetupDeps` shape matches the Task 9 test. `log.progress`/`log.progressDone` defined in Task 8, called in Tasks 4/5 (ordering note in Task 4 Step 3).

**Ordering note for the executor:** Task 8 (log visuals) should land before or together with Tasks 4/5 because `jdk.ts`/`android-sdk.ts` call `log.progress`/`log.progressDone`. If executing strictly in number order, the Task 4 implementer adds minimal `progress`/`progressDone` stubs to `log.ts` (called out in Task 4 Step 3), which Task 8 then completes. Either path keeps every task's suite green.
