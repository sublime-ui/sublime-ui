import type { Query, QueryFilter, FilterValue } from './Query.js';

/**
 * Plain serializable row, structurally identical to gateway/Gateway.ts's `Row`.
 * Declared locally so this evaluator stays a leaf module in Phase B (Gateway.ts
 * is rewritten to export `Row` in Phase D; the alias unifies then).
 */
type Row = Record<string, unknown>;

/**
 * The reference query evaluator, shared by InMemoryGateway and the IndexedDB
 * scan fallback so there is ONE operator-semantics oracle. (SP1 design §6.1.)
 * Pipeline: filter (per-op, ANDed) -> stable multi-key sort (nulls first on asc)
 * -> slice(offset, offset+limit) -> defensive shallow clone.
 */
export function applyQuery(rows: Row[], q: Query): Row[] {
  let out = rows;

  if (q.filters && q.filters.length > 0) {
    const filters = q.filters;
    out = out.filter((row) => filters.every((f) => matchFilter(row[f.field], f)));
  }

  if (q.sort && q.sort.length > 0) {
    const sort = q.sort;
    // Decorate-sort-undecorate to keep the sort stable across engines.
    out = out
      .map((row, i) => ({ row, i }))
      .sort((a, b) => {
        for (const s of sort) {
          const cmp = compareValues(a.row[s.field], b.row[s.field], s.dir);
          if (cmp !== 0) return cmp;
        }
        return a.i - b.i; // stable tie-break by original index
      })
      .map((d) => d.row);
  }

  const offset = q.offset ?? 0;
  if (offset > 0 || q.limit !== undefined) {
    const end = q.limit === undefined ? undefined : offset + q.limit;
    out = out.slice(offset, end);
  }

  // Defensive shallow clone so callers cannot mutate the source rows.
  return out.map((row) => ({ ...row }));
}

function matchFilter(actual: unknown, f: QueryFilter): boolean {
  switch (f.op) {
    case 'eq':
      return actual === f.value;
    case 'ne':
      return actual !== f.value;
    case 'gt':
      return isComparable(actual, f.value) && (actual as number) > (f.value as number);
    case 'gte':
      return isComparable(actual, f.value) && (actual as number) >= (f.value as number);
    case 'lt':
      return isComparable(actual, f.value) && (actual as number) < (f.value as number);
    case 'lte':
      return isComparable(actual, f.value) && (actual as number) <= (f.value as number);
    case 'in':
      return Array.isArray(f.value) && f.value.some((v) => v === actual);
    case 'like': {
      if (actual == null || typeof f.value !== 'string') return false;
      return String(actual).toLowerCase().includes(f.value.toLowerCase());
    }
    default:
      return false;
  }
}

/** Ordered comparisons skip nullish operands (mirrors SQL's NULL semantics). */
function isComparable(actual: unknown, value: FilterValue): boolean {
  return actual != null && value != null;
}

/**
 * Three-way compare honoring direction. Nulls sort FIRST on ascending (and
 * therefore LAST on descending, because the whole comparison is negated).
 */
function compareValues(a: unknown, b: unknown, dir: 'asc' | 'desc'): number {
  const an = a == null;
  const bn = b == null;
  if (an && bn) return 0;
  if (an) return dir === 'asc' ? -1 : 1; // null first on asc
  if (bn) return dir === 'asc' ? 1 : -1;

  let base: number;
  if (typeof a === 'number' && typeof b === 'number') {
    base = a < b ? -1 : a > b ? 1 : 0;
  } else {
    const as = String(a);
    const bs = String(b);
    base = as < bs ? -1 : as > bs ? 1 : 0;
  }
  return dir === 'asc' ? base : -base;
}
