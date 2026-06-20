import { describe, it, expect } from 'vitest';
import { applyQuery } from '../src/gateway/queryMatch.js';
import type { Query } from '../src/gateway/Query.js';

type Row = Record<string, unknown>;

const rows: Row[] = [
  { id: 1, name: 'Alpha', score: 30, tier: 'gold', active: true },
  { id: 2, name: 'beta', score: 10, tier: 'silver', active: false },
  { id: 3, name: 'Gamma', score: 20, tier: 'gold', active: true },
  { id: 4, name: 'delta', score: null, tier: 'bronze', active: false },
  { id: 5, name: 'Alphabet', score: 20, tier: null, active: true },
];

const ids = (out: Row[]): unknown[] => out.map((r) => r.id);

describe('applyQuery — filter operators', () => {
  it('eq matches exact equality', () => {
    const q: Query = { filters: [{ field: 'tier', op: 'eq', value: 'gold' }] };
    expect(ids(applyQuery(rows, q))).toEqual([1, 3]);
  });

  it('eq with null matches only null values', () => {
    const q: Query = { filters: [{ field: 'score', op: 'eq', value: null }] };
    expect(ids(applyQuery(rows, q))).toEqual([4]);
  });

  it('ne excludes exact equality (and excludes rows equal to value)', () => {
    const q: Query = { filters: [{ field: 'tier', op: 'ne', value: 'gold' }] };
    expect(ids(applyQuery(rows, q))).toEqual([2, 4, 5]);
  });

  it('gt compares numerically, skips null', () => {
    const q: Query = { filters: [{ field: 'score', op: 'gt', value: 20 }] };
    expect(ids(applyQuery(rows, q))).toEqual([1]);
  });

  it('gte compares numerically, skips null', () => {
    const q: Query = { filters: [{ field: 'score', op: 'gte', value: 20 }] };
    expect(ids(applyQuery(rows, q))).toEqual([1, 3, 5]);
  });

  it('lt compares numerically, skips null', () => {
    const q: Query = { filters: [{ field: 'score', op: 'lt', value: 20 }] };
    expect(ids(applyQuery(rows, q))).toEqual([2]);
  });

  it('lte compares numerically, skips null', () => {
    const q: Query = { filters: [{ field: 'score', op: 'lte', value: 20 }] };
    expect(ids(applyQuery(rows, q))).toEqual([2, 3, 5]);
  });

  it('in matches array membership', () => {
    const q: Query = { filters: [{ field: 'id', op: 'in', value: [2, 4] }] };
    expect(ids(applyQuery(rows, q))).toEqual([2, 4]);
  });

  it('in with no array value matches nothing', () => {
    const q: Query = { filters: [{ field: 'id', op: 'in', value: 2 }] };
    expect(ids(applyQuery(rows, q))).toEqual([]);
  });

  it('like is case-insensitive contains', () => {
    const q: Query = { filters: [{ field: 'name', op: 'like', value: 'alph' }] };
    expect(ids(applyQuery(rows, q))).toEqual([1, 5]);
  });

  it('like skips null field values', () => {
    const q: Query = { filters: [{ field: 'tier', op: 'like', value: 'o' }] };
    // tier contains 'o' (case-insensitive): 'gold'(1), 'gold'(3), 'bronze'(4);
    // 'silver'(2) has no 'o'; tier null(5) is skipped. (Brief's expected [1,3,2]
    // was a data error — 'silver' lacks 'o' and 'bronze' was omitted.)
    expect(ids(applyQuery(rows, q))).toEqual([1, 3, 4]);
  });

  it('multiple filters are ANDed', () => {
    const q: Query = {
      filters: [
        { field: 'tier', op: 'eq', value: 'gold' },
        { field: 'active', op: 'eq', value: true },
        { field: 'score', op: 'gte', value: 25 },
      ],
    };
    expect(ids(applyQuery(rows, q))).toEqual([1]);
  });
});

describe('applyQuery — sort', () => {
  it('sorts ascending with nulls first', () => {
    const q: Query = { sort: [{ field: 'score', dir: 'asc' }] };
    expect(ids(applyQuery(rows, q))).toEqual([4, 2, 3, 5, 1]);
  });

  it('sorts descending with nulls last', () => {
    const q: Query = { sort: [{ field: 'score', dir: 'desc' }] };
    expect(ids(applyQuery(rows, q))).toEqual([1, 3, 5, 2, 4]);
  });

  it('applies a stable multi-key sort (primary then secondary)', () => {
    const q: Query = {
      sort: [
        { field: 'score', dir: 'asc' },
        { field: 'name', dir: 'asc' },
      ],
    };
    // score asc: 4(null),2(10),then 3&5 tie at 20 -> name asc 'Gamma' vs 'Alphabet'
    // 'Alphabet' < 'Gamma' -> 5 before 3; then 1(30)
    expect(ids(applyQuery(rows, q))).toEqual([4, 2, 5, 3, 1]);
  });

  it('is stable for equal keys (preserves input order)', () => {
    const q: Query = { sort: [{ field: 'tier', dir: 'asc' }] };
    // tier asc, nulls first: null(5), then bronze(4), gold(1,3 in input order), silver(2)
    expect(ids(applyQuery(rows, q))).toEqual([5, 4, 1, 3, 2]);
  });
});

describe('applyQuery — limit/offset', () => {
  it('applies offset then limit', () => {
    const q: Query = { sort: [{ field: 'id', dir: 'asc' }], offset: 1, limit: 2 };
    expect(ids(applyQuery(rows, q))).toEqual([2, 3]);
  });

  it('applies limit alone', () => {
    const q: Query = { sort: [{ field: 'id', dir: 'asc' }], limit: 2 };
    expect(ids(applyQuery(rows, q))).toEqual([1, 2]);
  });

  it('applies offset alone', () => {
    const q: Query = { sort: [{ field: 'id', dir: 'asc' }], offset: 3 };
    expect(ids(applyQuery(rows, q))).toEqual([4, 5]);
  });

  it('an empty Query returns all rows', () => {
    expect(ids(applyQuery(rows, {}))).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('applyQuery — defensive clone', () => {
  it('returns shallow clones so callers cannot mutate the source rows', () => {
    const src: Row[] = [{ id: 1, name: 'x' }];
    const out = applyQuery(src, {});
    expect(out[0]).not.toBe(src[0]);
    expect(out[0]).toEqual(src[0]);
    (out[0] as Row).name = 'mutated';
    expect(src[0]!.name).toBe('x');
  });
});
