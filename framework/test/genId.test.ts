import { describe, it, expect, afterEach, vi } from 'vitest';
import { genId } from '../src/gateway/genId.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('genId', () => {
  it('returns a non-empty string', () => {
    const id = genId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns a unique value across many calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) ids.add(genId());
    expect(ids.size).toBe(1000);
  });

  it('uses crypto.randomUUID when present', () => {
    const spy = vi.fn(() => '11111111-1111-4111-8111-111111111111');
    vi.stubGlobal('crypto', { randomUUID: spy });
    expect(genId()).toBe('11111111-1111-4111-8111-111111111111');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('falls back to a unique string when crypto.randomUUID is absent', () => {
    vi.stubGlobal('crypto', {}); // no randomUUID
    const a = genId();
    const b = genId();
    expect(typeof a).toBe('string');
    expect(a.length).toBeGreaterThan(0);
    expect(a).not.toBe(b);
  });

  it('falls back when crypto itself is undefined', () => {
    vi.stubGlobal('crypto', undefined);
    const id = genId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});
