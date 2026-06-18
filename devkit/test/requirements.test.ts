import { describe, it, expect } from 'vitest';
import {
  REQUIREMENTS,
  satisfiesMajor,
  satisfiesExact,
} from '../src/lib/requirements.js';

describe('REQUIREMENTS', () => {
  it('pins the proven Android toolchain versions', () => {
    expect(REQUIREMENTS.ndk).toBe('27.1.12297006');
    expect(REQUIREMENTS.cmake).toBe('3.22.1');
    expect(REQUIREMENTS.jdk.major).toBe(17);
    expect(REQUIREMENTS.node.min).toBe(18);
  });
});

describe('satisfiesMajor', () => {
  it('passes when the actual major meets or exceeds the floor', () => {
    expect(satisfiesMajor('17.0.9', 17)).toBe(true);
    expect(satisfiesMajor('21', 17)).toBe(true);
    expect(satisfiesMajor('v24.16.0', 18)).toBe(true);
  });
  it('fails below the floor or when unknown', () => {
    expect(satisfiesMajor('1.8.0_202', 17)).toBe(false);
    expect(satisfiesMajor(null, 17)).toBe(false);
    expect(satisfiesMajor('not-a-version', 17)).toBe(false);
  });
});

describe('satisfiesExact', () => {
  it('requires an exact match', () => {
    expect(satisfiesExact('3.22.1', '3.22.1')).toBe(true);
    expect(satisfiesExact('3.22.0', '3.22.1')).toBe(false);
    expect(satisfiesExact(null, '3.22.1')).toBe(false);
  });
});
