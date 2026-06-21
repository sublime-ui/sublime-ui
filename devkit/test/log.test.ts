import { describe, it, expect } from 'vitest';
import { renderTable, renderProgressBar, spinner } from '../src/util/log.js';
import { vi, beforeEach, afterEach } from 'vitest';

describe('renderTable', () => {
  it('renders a check/cross per row with aligned labels', () => {
    const out = renderTable([
      { label: 'Node', ok: true, detail: 'v24.16.0' },
      { label: 'JDK 17', ok: false, detail: 'not found' },
    ]);
    expect(out).toContain('Node');
    expect(out).toContain('v24.16.0');
    expect(out).toContain('JDK 17');
    expect(out).toContain('not found');
    // one line per row
    expect(out.trim().split('\n')).toHaveLength(2);
    // pass marker on row 1, fail marker on row 2
    const [line1, line2] = out.trim().split('\n');
    expect(line1).toMatch(/✓|OK/);
    expect(line2).toMatch(/✗|X/);
  });
});

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
    expect(joined).not.toMatch(/\r|\[/);
  });
});
