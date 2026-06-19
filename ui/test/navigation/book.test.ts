import { describe, it, expect } from 'vitest';
import { book, page, link } from '../../src/navigation/book';

const Dummy = () => null;

describe('authoring helpers', () => {
  it('page() tags a page def with options', () => {
    const p = page(Dummy, { title: 'Home' });
    expect(p.kind).toBe('page');
    expect(p.options.title).toBe('Home');
  });
  it('book() captures format + pages, link() nests a book', () => {
    const sub = book({ format: 'stack', pages: { a: page(Dummy) } });
    const root = book({ format: 'bottomNav', pages: { home: page(Dummy), more: link(sub) } });
    expect(root.format).toBe('bottomNav');
    expect(root.pages.more!.kind).toBe('link');
  });
});
