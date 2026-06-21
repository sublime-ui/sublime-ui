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
