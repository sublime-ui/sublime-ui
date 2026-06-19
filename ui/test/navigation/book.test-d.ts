import { expectTypeOf } from 'vitest';
import { book, page } from '../../src/navigation/book';

const Dummy = () => null;

const root = book({
  format: 'bottomNav',
  pages: { p: page<{ id: number }>(Dummy) },
});

// The flattened RouteMap carries page params under their page key.
expectTypeOf(root.__routes!).toHaveProperty('p');
expectTypeOf(root.__routes!.p).toEqualTypeOf<{ id: number }>();
