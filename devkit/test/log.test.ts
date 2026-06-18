import { describe, it, expect } from 'vitest';
import { renderTable } from '../src/util/log.js';

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
