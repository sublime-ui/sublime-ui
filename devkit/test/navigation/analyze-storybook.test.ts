import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { analyzeStorybook } from '../../src/lib/navigation/analyze-storybook.js';

// The analyzer is PURE/static: it parses the storybook SOURCE with the TS
// compiler API and never imports/executes it. So unlike the old runtime loader
// there is no need for a clean temp root to avoid file-URL encoding bugs, and —
// critically — storybooks that import `.tsx` screens or `react-native` analyze
// fine because those imports are never loaded.

let dir = '';
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'analyze-sb-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

/** Write `content` to `<dir>/<name>` and return the absolute path. */
function fixture(name: string, content: string): string {
  const file = join(dir, name);
  writeFileSync(file, content);
  return file;
}

describe('analyzeStorybook', () => {
  it('walks the default-exported book() into a root RouteNode', () => {
    const file = fixture(
      'storybook.native.ts',
      `import { book, page } from '@sublime-ui/ui/navigation';
       export function Home() { return null; }
       export default book({
         format: 'bottomNav',
         pages: { home: page(Home, { title: 'Home' }) },
       });`,
    );
    const root = analyzeStorybook(file);
    expect(root.key).toBe('root');
    expect(root.kind).toBe('book');
    expect(root.format).toBe('bottomNav');
  });

  it('emits a page child with its component identifier name and options', () => {
    const file = fixture(
      'storybook.native.ts',
      `import { book, page } from '@sublime-ui/ui/navigation';
       export function Home() { return null; }
       export default book({
         format: 'bottomNav',
         pages: { home: page(Home, { title: 'Home', icon: 'home' }) },
       });`,
    );
    const root = analyzeStorybook(file);
    const home = root.children?.find((c) => c.key === 'home');
    expect(home?.kind).toBe('page');
    expect(home?.component).toBe('Home');
    expect(home?.options.title).toBe('Home');
    expect(home?.options.icon).toBe('home');
  });

  it('captures path and initial options (and omits absent fields)', () => {
    const file = fixture(
      'storybook.web.ts',
      `import { book, page } from '@sublime-ui/ui/navigation';
       export function Home() { return null; }
       export function About() { return null; }
       export default book({
         format: 'sidebar',
         pages: {
           home: page(Home, { path: 'home', initial: true }),
           about: page(About),
         },
       });`,
    );
    const root = analyzeStorybook(file);
    const home = root.children?.find((c) => c.key === 'home');
    expect(home?.options.path).toBe('home');
    expect(home?.options.initial).toBe(true);
    expect(home?.options.title).toBeUndefined();
    const about = root.children?.find((c) => c.key === 'about');
    expect(about?.options).toEqual({});
  });

  it('reads the page<T>() type-arg form as a normal page entry', () => {
    const file = fixture(
      'storybook.web.ts',
      `import { book, page } from '@sublime-ui/ui/navigation';
       export function ProductDetail() { return null; }
       export default book({
         format: 'sidebar',
         pages: { product: page<{ id: number }>(ProductDetail, { title: 'Product' }) },
       });`,
    );
    const root = analyzeStorybook(file);
    const product = root.children?.find((c) => c.key === 'product');
    expect(product?.kind).toBe('page');
    expect(product?.component).toBe('ProductDetail');
    expect(product?.options.title).toBe('Product');
  });

  it('resolves a local-const link() into a nested book node (fixture shape)', () => {
    const file = fixture(
      'storybook.web.ts',
      `import { book, link, page } from '@sublime-ui/ui/navigation';
       export function Profile() { return null; }
       const settingsBook = book({
         format: 'stack',
         pages: { profile: page(Profile, { title: 'Profile' }) },
       });
       export default book({
         format: 'sidebar',
         pages: { settings: link(settingsBook, { title: 'Settings' }) },
       });`,
    );
    const root = analyzeStorybook(file);
    const settings = root.children?.find((c) => c.key === 'settings');
    expect(settings?.kind).toBe('book');
    expect(settings?.format).toBe('stack');
    // The link's options become the node options.
    expect(settings?.options.title).toBe('Settings');
    const profile = settings?.children?.find((c) => c.key === 'profile');
    expect(profile?.kind).toBe('page');
    expect(profile?.component).toBe('Profile');
  });

  it('carries a linkError when link() target is not a local book()', () => {
    const file = fixture(
      'storybook.web.ts',
      `import { book, link } from '@sublime-ui/ui/navigation';
       const notABook = 42;
       export default book({
         format: 'sidebar',
         pages: { broken: link(notABook, { title: 'Broken' }) },
       });`,
    );
    const root = analyzeStorybook(file);
    const broken = root.children?.find((c) => c.key === 'broken');
    expect(broken?.kind).toBe('book');
    expect(broken?.children).toEqual([]);
    expect(broken?.linkError).toBe('link("broken") does not reference a book().');
    expect(broken?.options.title).toBe('Broken');
  });

  it('throws when there is no default-exported book()', () => {
    const file = fixture(
      'storybook.web.ts',
      `import { book } from '@sublime-ui/ui/navigation';
       export const notDefault = book({ format: 'sidebar', pages: {} });`,
    );
    expect(() => analyzeStorybook(file)).toThrow(/must default-export a book\(\)/);
  });

  it('analyzes a storybook that IMPORTS a .tsx screen WITHOUT executing it', () => {
    // A real screen written in TSX that Node's type-stripper would reject, AND a
    // module that imports react-native (which crashes when loaded in Node). The
    // analyzer parses source only, so neither is ever loaded.
    writeFileSync(
      join(dir, 'HomeScreen.tsx'),
      `import 'react-native';
       export function HomeScreen() {
         return <view>oops, JSX that Node cannot strip</view> as unknown;
       }`,
    );
    writeFileSync(
      join(dir, 'native-only.ts'),
      `import 'react-native';
       export function NativeScreen() { return null; }`,
    );
    const file = fixture(
      'storybook.native.ts',
      `import { book, page } from '@sublime-ui/ui/navigation';
       import { HomeScreen } from './HomeScreen';
       import { NativeScreen } from './native-only';
       export default book({
         format: 'bottomNav',
         pages: {
           home: page(HomeScreen, { title: 'Home' }),
           native: page(NativeScreen, { title: 'Native' }),
         },
       });`,
    );
    const root = analyzeStorybook(file);
    const home = root.children?.find((c) => c.key === 'home');
    expect(home?.kind).toBe('page');
    expect(home?.component).toBe('HomeScreen');
    const native = root.children?.find((c) => c.key === 'native');
    expect(native?.component).toBe('NativeScreen');
  });

  it('handles books nested directly via a local-const link chain', () => {
    const file = fixture(
      'storybook.web.ts',
      `import { book, link, page } from '@sublime-ui/ui/navigation';
       export function A() { return null; }
       export function B() { return null; }
       const inner = book({
         format: 'stack',
         pages: { b: page(B, { title: 'B' }) },
       });
       const outer = book({
         format: 'stack',
         pages: {
           a: page(A, { title: 'A' }),
           innerLink: link(inner, { title: 'Inner' }),
         },
       });
       export default book({
         format: 'sidebar',
         pages: { outerLink: link(outer, { title: 'Outer' }) },
       });`,
    );
    const root = analyzeStorybook(file);
    const outer = root.children?.find((c) => c.key === 'outerLink');
    expect(outer?.kind).toBe('book');
    expect(outer?.format).toBe('stack');
    const inner = outer?.children?.find((c) => c.key === 'innerLink');
    expect(inner?.kind).toBe('book');
    expect(inner?.format).toBe('stack');
    expect(inner?.children?.find((c) => c.key === 'b')?.component).toBe('B');
  });
});
