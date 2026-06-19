# Sublime UI — Cross-Platform Navigation ("Storybook") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "storybook" navigation layer — authored per platform, compiled by devkit into idiomatic React Navigation (native) + react-router (web) artifacts — with a typed `useNav().turnTo()` API and shared layout primitives.

**Architecture:** A new runtime package `@sublime-ui/ui` exposes the authoring helpers (`book`/`page`/`link`), the `useNav` facade (platform-bridged to React Navigation / react-router), and the `Screen`/`Stack`/`Row`/`Spacer` layout primitives. A new devkit command `sublime build:nav` loads the per-platform storybooks, validates them with pure functions, and renders `navigation.native.tsx`, `navigation.web.tsx`, and `routes.d.ts` with pure string generators (TDD).

**Tech Stack:** TypeScript (strict), React, React Native, `@react-navigation/*`, `react-router-dom`, tsup (`bundle:false` platform split), vitest, commander (devkit).

## Global Constraints

- TS strict flags ON: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noUnusedLocals`. ESM only.
- Platform file resolution is by filename: `X.tsx` (web/MUI) vs `X.native.tsx` (mobile/Paper); shared types in `X.types.ts`. tsup config: `bundle: false`, entry excludes `*.native.tsx`, `external` lists all platform peers. `package.json` has `"react-native": "./src/index.ts"`.
- All platform peer deps are **optional** peerDependencies (gated by `peerDependenciesMeta`).
- Print formats — mobile: `'drawer' | 'stack' | 'bottomNav'` (`bottomNav` ≤ 5 direct pages); web: `'sidebar' | 'stack' | 'tabs'`. A book accepts only its own platform's union.
- Page keys are the global navigation namespace — duplicates across the reachable tree are an error.
- Devkit reuses existing `loadConfig` (extend with `navigationDir`, default `src/navigation`), `safeWrite`, `updateBarrel`, `util/log`, `picocolors`, `commander`.
- Commit messages: conventional commits, **no AI/Claude attribution of any kind**.
- Test command: `npm test` runs `vitest run --passWithNoTests` per workspace.

---

### Task 1: Scaffold `@sublime-ui/ui` package

**Files:**
- Create: `ui/package.json`, `ui/tsconfig.json`, `ui/tsup.config.ts`, `ui/vitest.config.ts`, `ui/src/index.ts`
- Modify: root `package.json` (workspaces already glob `*`; none needed), root `tsconfig` references if present

**Interfaces:**
- Produces: a buildable workspace `@sublime-ui/ui` with the #4 platform-split toolchain; `ui/src/index.ts` as the public barrel.

- [ ] **Step 1: Write `ui/package.json`** (mirror `library/package.json`)

```json
{
  "name": "@sublime-ui/ui",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./navigation": { "types": "./dist/navigation/index.d.ts", "import": "./dist/navigation/index.js" }
  },
  "react-native": "./src/index.ts",
  "files": ["dist", "src"],
  "scripts": {
    "build": "tsup",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --passWithNoTests",
    "lint": "eslint src"
  },
  "peerDependencies": {
    "react": ">=18",
    "react-native": ">=0.74",
    "@react-navigation/native": ">=6",
    "@react-navigation/native-stack": ">=6",
    "@react-navigation/bottom-tabs": ">=6",
    "@react-navigation/drawer": ">=6",
    "react-native-safe-area-context": ">=4",
    "react-router-dom": ">=6"
  },
  "peerDependenciesMeta": {
    "react-native": { "optional": true },
    "@react-navigation/native": { "optional": true },
    "@react-navigation/native-stack": { "optional": true },
    "@react-navigation/bottom-tabs": { "optional": true },
    "@react-navigation/drawer": { "optional": true },
    "react-native-safe-area-context": { "optional": true },
    "react-router-dom": { "optional": true }
  },
  "devDependencies": {
    "@react-navigation/native": "^6.1.18",
    "@react-navigation/native-stack": "^6.11.0",
    "@react-navigation/bottom-tabs": "^6.6.1",
    "@react-navigation/drawer": "^6.7.2",
    "@testing-library/react": "^16.0.1",
    "@types/node": "^22",
    "@types/react": "^18.3.12",
    "jsdom": "^25.0.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-native": "^0.76.1",
    "react-native-safe-area-context": "^4.14.0",
    "react-router-dom": "^6.27.0"
  }
}
```

- [ ] **Step 2: Write `ui/tsconfig.json`** — extend the repo base, `jsx: react-jsx`, strict flags inherited. Copy `library/tsconfig.json` verbatim, changing only `"extends"` path if needed.

- [ ] **Step 3: Write `ui/tsup.config.ts`** (copy `library/tsup.config.ts`, swap externals)

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts', 'src/**/*.tsx', '!src/**/*.native.tsx', '!src/test-utils/**'],
  format: ['esm'],
  dts: true,
  clean: true,
  bundle: false,
  external: [
    'react', 'react-native', 'react-router-dom',
    '@react-navigation/native', '@react-navigation/native-stack',
    '@react-navigation/bottom-tabs', '@react-navigation/drawer',
    'react-native-safe-area-context',
  ],
});
```

- [ ] **Step 4: Write `ui/vitest.config.ts`** (copy `library/vitest.config.ts` — jsdom env).
- [ ] **Step 5: Write `ui/src/index.ts`** with `export {};` placeholder.
- [ ] **Step 6: Install + verify**

Run: `npm install && npm -w @sublime-ui/ui run build && npm -w @sublime-ui/ui run typecheck && npm -w @sublime-ui/ui test`
Expected: build emits `dist/index.js`; typecheck clean; tests pass (no tests).

- [ ] **Step 7: Commit**

```bash
git add ui package-lock.json && git commit -m "feat(ui): scaffold @sublime-ui/ui package"
```

---

### Task 2: Navigation core types

**Files:**
- Create: `ui/src/navigation/types.ts`, `ui/test/navigation/types.test-d.ts`

**Interfaces:**
- Produces: `MobileFormat`, `WebFormat`, `PrintFormat`, `PageOptions`, internal `PageDef`/`LinkDef`/`Entry`/`BookDef<F, RM>`, and `RouteMap` (record of route key → params). `BookDef` carries a phantom `RouteMap` type param for inference.

- [ ] **Step 1: Write `ui/src/navigation/types.ts`**

```ts
export type MobileFormat = 'drawer' | 'stack' | 'bottomNav';
export type WebFormat = 'sidebar' | 'stack' | 'tabs';
export type PrintFormat = MobileFormat | WebFormat;

export interface PageOptions {
  title?: string;
  icon?: string;
  path?: string;       // web URL segment; defaults to kebab-cased key
  initial?: boolean;
}

export interface PageDef<P = void> {
  readonly kind: 'page';
  readonly component: unknown;        // a React component; typed structurally at author site
  readonly options: PageOptions;
  readonly __params?: P;              // phantom: carries the page's param type
}

export interface LinkDef<RM extends RouteMap = RouteMap> {
  readonly kind: 'link';
  readonly book: BookDef<PrintFormat, RM>;
  readonly options: PageOptions;
}

export type Entry = PageDef<any> | LinkDef<any>;

export type RouteMap = Record<string, unknown>;

export interface BookDef<F extends PrintFormat, RM extends RouteMap> {
  readonly kind: 'book';
  readonly format: F;
  readonly pages: Record<string, Entry>;
  readonly __routes?: RM;             // phantom: flattened route map
}
```

- [ ] **Step 2: Write the type test** `ui/test/navigation/types.test-d.ts` asserting a `BookDef<'bottomNav', RM>` does not accept `'sidebar'` (use `// @ts-expect-error`).

```ts
import { expectTypeOf } from 'vitest';
import type { MobileFormat, WebFormat } from '../../src/navigation/types';

expectTypeOf<MobileFormat>().toEqualTypeOf<'drawer' | 'stack' | 'bottomNav'>();
expectTypeOf<WebFormat>().toEqualTypeOf<'sidebar' | 'stack' | 'tabs'>();
```

- [ ] **Step 3: Run** `npm -w @sublime-ui/ui run typecheck` → PASS.
- [ ] **Step 4: Commit** `git commit -am "feat(ui): navigation core types"`

---

### Task 3: Authoring helpers `book` / `page` / `link`

**Files:**
- Create: `ui/src/navigation/book.ts`, `ui/test/navigation/book.test.ts`, `ui/test/navigation/book.test-d.ts`

**Interfaces:**
- Consumes: `types.ts` (`BookDef`, `PageDef`, `LinkDef`, `PrintFormat`, `RouteMap`).
- Produces:
  - `page<P = void>(component, options?): PageDef<P>`
  - `link<RM>(book: BookDef<any, RM>, options?): LinkDef<RM>`
  - `book<F, Pages>(def: { format: F; pages: Pages }): BookDef<F, RoutesOf<Pages>>` where `RoutesOf` flattens page params + linked-book routes into one `RouteMap` at the type level.

- [ ] **Step 1: Write failing test** `book.test.ts`

```ts
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
    expect(root.pages.more.kind).toBe('link');
  });
});
```

- [ ] **Step 2: Run** → FAIL (module not found).
- [ ] **Step 3: Implement** `ui/src/navigation/book.ts`

```ts
import type {
  BookDef, Entry, LinkDef, PageDef, PageOptions, PrintFormat, RouteMap,
} from './types';

export function page<P = void>(component: unknown, options: PageOptions = {}): PageDef<P> {
  return { kind: 'page', component, options };
}

export function link<RM extends RouteMap>(
  book: BookDef<PrintFormat, RM>,
  options: PageOptions = {},
): LinkDef<RM> {
  return { kind: 'link', book, options };
}

// Flatten Pages (page params + nested link routes) into one RouteMap at type level.
type RoutesOf<Pages extends Record<string, Entry>> =
  { [K in keyof Pages as Pages[K] extends PageDef<any> ? K : never]:
      Pages[K] extends PageDef<infer P> ? P : never }
  & UnionToIntersection<
      { [K in keyof Pages]: Pages[K] extends LinkDef<infer RM> ? RM : {} }[keyof Pages]
    >;

type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export function book<F extends PrintFormat, Pages extends Record<string, Entry>>(
  def: { format: F; pages: Pages },
): BookDef<F, RoutesOf<Pages> & RouteMap> {
  return { kind: 'book', format: def.format, pages: def.pages };
}
```

- [ ] **Step 4: Run** `book.test.ts` → PASS.
- [ ] **Step 5: Write type test** `book.test-d.ts` — `book({format:'bottomNav', pages:{ p: page<{id:number}>(Dummy)}})` yields a `RouteMap` with `p: {id:number}`; assert via `expectTypeOf(root.__routes!).toHaveProperty('p')`.
- [ ] **Step 6: Run typecheck** → PASS.
- [ ] **Step 7: Commit** `git commit -am "feat(ui): book/page/link authoring helpers with RouteMap inference"`

---

### Task 4: `useNav` facade + `NavContext`

**Files:**
- Create: `ui/src/navigation/nav.types.ts`, `ui/src/navigation/use-nav.ts`, `ui/test/navigation/use-nav.test.tsx`

**Interfaces:**
- Produces:
  - `interface Nav<RM extends RouteMap = RouteMap>` with `turnTo`, `turnBack`, `current`, `params`.
  - `NavContext` (React context of `Nav | null`), `NavProvider`.
  - `useNav<RM>(): TypedNav<RM>` — throws if no provider.
  - `TypedNav<RM>` makes `turnTo(name, params?)` require params iff declared.

- [ ] **Step 1: Write `ui/src/navigation/nav.types.ts`**

```ts
import type { RouteMap } from './types';

export interface Nav {
  turnTo(name: string, params?: unknown): void;
  turnBack(): void;
  current(): string;
  params<T = unknown>(): T;
}

type NoParams<P> = [P] extends [void] ? true : P extends undefined ? true : false;

export interface TypedNav<RM extends RouteMap> {
  turnTo<K extends keyof RM & string>(
    ...args: NoParams<RM[K]> extends true ? [name: K] : [name: K, params: RM[K]]
  ): void;
  turnBack(): void;
  current(): keyof RM & string;
  params<K extends keyof RM & string>(): RM[K];
}
```

- [ ] **Step 2: Write failing test** `use-nav.test.tsx` — rendering a component calling `useNav()` outside a provider throws; inside `NavProvider value={fake}` returns it.
- [ ] **Step 3: Implement** `ui/src/navigation/use-nav.ts`

```ts
import { createContext, createElement, useContext, type ReactNode } from 'react';
import type { Nav, TypedNav } from './nav.types';
import type { RouteMap } from './types';

export const NavContext = createContext<Nav | null>(null);

export function NavProvider(props: { value: Nav; children: ReactNode }) {
  return createElement(NavContext.Provider, { value: props.value }, props.children);
}

export function useNav<RM extends RouteMap = RouteMap>(): TypedNav<RM> {
  const nav = useContext(NavContext);
  if (nav === null) throw new Error('useNav() must be used within <Navigation> (NavProvider missing)');
  return nav as unknown as TypedNav<RM>;
}
```

- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `git commit -am "feat(ui): useNav facade + NavContext"`

---

### Task 5: Platform `useNav` bridges (native + web)

**Files:**
- Create: `ui/src/navigation/bridge.native.ts`, `ui/src/navigation/bridge.web.ts`, `ui/test/navigation/bridge.web.test.tsx`

**Interfaces:**
- Consumes: `Nav` from `nav.types.ts`.
- Produces: `useNativeNav(): Nav` (wraps `@react-navigation/native`'s `useNavigation`/`useRoute`); `useWebNav(routeOf): Nav` (wraps react-router's `useNavigate`/`useLocation`/`useParams`); `routeOf` maps a route key → path (passed in by generated code).

- [ ] **Step 1: Write `bridge.native.ts`**

```ts
import { useNavigation, useRoute } from '@react-navigation/native';
import type { Nav } from './nav.types';

export function useNativeNav(): Nav {
  const navigation = useNavigation<any>();
  const route = useRoute();
  return {
    turnTo: (name, params) => navigation.navigate(name as never, params as never),
    turnBack: () => navigation.goBack(),
    current: () => route.name,
    params: <T,>() => (route.params ?? {}) as T,
  };
}
```

- [ ] **Step 2: Write `bridge.web.ts`**

```ts
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import type { Nav } from './nav.types';

export function useWebNav(pathOf: (name: string, params?: unknown) => string, nameOf: (path: string) => string): Nav {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  return {
    turnTo: (name, p) => navigate(pathOf(name, p)),
    turnBack: () => navigate(-1),
    current: () => nameOf(location.pathname),
    params: <T,>() => params as unknown as T,
  };
}
```

- [ ] **Step 3: Write web test** `bridge.web.test.tsx` — wrap in `MemoryRouter`, assert `turnTo('product', {id:1})` calls the navigate spy with the path from a stub `pathOf`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `git commit -am "feat(ui): native + web useNav bridges"`

---

### Task 6: `Screen` layout primitive

**Files:**
- Create: `ui/src/layout/Screen.types.ts`, `ui/src/layout/Screen.tsx`, `ui/src/layout/Screen.native.tsx`, `ui/test/layout/Screen.test.tsx`

**Interfaces:**
- Produces: `ScreenProps { children; scroll?: boolean; padded?: boolean; testID?: string }`; web `<Screen>` renders `<main>`; native renders `SafeAreaView` + optional `ScrollView`.

- [ ] **Step 1: Write `Screen.types.ts`**

```ts
import type { ReactNode } from 'react';
export interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  testID?: string;
}
```

- [ ] **Step 2: Write failing test** `Screen.test.tsx` — render web `<Screen testID="s"><span>hi</span></Screen>`, assert text present + `<main>` role.
- [ ] **Step 3: Implement web `Screen.tsx`**

```tsx
import type { ScreenProps } from './Screen.types';

export function Screen({ children, padded = true, testID }: ScreenProps) {
  return (
    <main data-testid={testID} style={{ padding: padded ? 16 : 0, minHeight: '100%' }}>
      {children}
    </main>
  );
}
```

- [ ] **Step 4: Implement native `Screen.native.tsx`**

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View } from 'react-native';
import type { ScreenProps } from './Screen.types';

export function Screen({ children, scroll, padded = true, testID }: ScreenProps) {
  const inner = <View style={{ padding: padded ? 16 : 0, flex: 1 }}>{children}</View>;
  return (
    <SafeAreaView style={{ flex: 1 }} testID={testID}>
      {scroll ? <ScrollView>{inner}</ScrollView> : inner}
    </SafeAreaView>
  );
}
```

- [ ] **Step 5: Run** → PASS. **Step 6: Commit** `git commit -am "feat(ui): Screen layout primitive"`

---

### Task 7: `Stack` / `Row` / `Spacer` primitives

**Files:**
- Create: `Stack.types.ts`, `Stack.tsx`, `Stack.native.tsx`, `Row.tsx`, `Row.native.tsx`, `Spacer.tsx`, `Spacer.native.tsx` (under `ui/src/layout/`), `ui/test/layout/stack.test.tsx`

**Interfaces:**
- Produces: `Stack`/`Row` with `{ children; gap?; align?; justify?; testID? }` (Row adds `wrap?`); `Spacer` with `{ size?: number }` (flex if absent). Web uses CSS flex; native uses RN `View` flexDirection.

- [ ] **Step 1: Write `Stack.types.ts`** (shared `FlexProps`), **Step 2** failing test (render web `Stack` with two children, assert order + `flexDirection: column`).
- [ ] **Step 3:** implement web + native `Stack`/`Row`/`Spacer` (column vs row; Spacer web = `<div style={{flex: size?undefined:1, height/width:size}}/>`, native = `<View>`).
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** `git commit -am "feat(ui): Stack/Row/Spacer primitives"`

---

### Task 8: Package barrels + public API

**Files:**
- Create: `ui/src/layout/index.ts`, `ui/src/navigation/index.ts`
- Modify: `ui/src/index.ts`

**Interfaces:**
- Produces: `@sublime-ui/ui` exports `Screen/Stack/Row/Spacer` + types; `@sublime-ui/ui/navigation` exports `book/page/link`, `useNav`, `NavProvider`, `NavContext`, and all navigation types.

- [ ] **Step 1:** `navigation/index.ts` re-exports `./book`, `./use-nav`, `./types`, `./nav.types` (NOT the platform bridges — those are consumed only by generated code, imported directly).
- [ ] **Step 2:** `layout/index.ts` re-exports the four primitives + types.
- [ ] **Step 3:** `ui/src/index.ts` → `export * from './layout';`
- [ ] **Step 4:** Run `npm -w @sublime-ui/ui run build && npm -w @sublime-ui/ui run typecheck` → both `dist/index.d.ts` and `dist/navigation/index.d.ts` emitted.
- [ ] **Step 5: Commit** `git commit -am "feat(ui): public barrels for layout + navigation"`

---

### Task 9: `flatten` — book tree → flat route table (pure, devkit)

**Files:**
- Create: `devkit/src/lib/navigation/model.ts` (shared types), `devkit/src/lib/navigation/flatten.ts`, `devkit/test/navigation/flatten.test.ts`

**Interfaces:**
- Produces:
  - `interface RouteNode { key: string; kind: 'page' | 'book'; format?: PrintFormat; component?: string; options: PageOptions; children?: RouteNode[]; }` (an analyzed tree, built by `load-storybook`).
  - `flatten(root: RouteNode): { routes: { key: string; path: string; hasParams: boolean }[] }` — depth-first, kebab-cases keys into paths, nested book paths are prefixed by their link key.

- [ ] **Step 1: Write failing test** `flatten.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { flatten } from '../../src/lib/navigation/flatten';

const tree = {
  key: 'root', kind: 'book', format: 'bottomNav', options: {},
  children: [
    { key: 'home', kind: 'page', component: 'Home', options: {} },
    { key: 'settings', kind: 'book', format: 'stack', options: {}, children: [
      { key: 'profile', kind: 'page', component: 'Profile', options: {} },
    ] },
  ],
} as const;

describe('flatten', () => {
  it('produces a flat route list with prefixed nested paths', () => {
    const { routes } = flatten(tree as any);
    expect(routes.map(r => r.key)).toEqual(['home', 'profile']);
    expect(routes.find(r => r.key === 'profile')?.path).toBe('/settings/profile');
  });
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3:** implement `flatten` (recursive DFS, `path` = parent prefix + `/` + (`options.path` ?? kebab(key))). **Step 4: Run** → PASS. **Step 5: Commit** `git commit -am "feat(devkit): flatten storybook tree to route table"`

---

### Task 10: `validate` — diagnostics (pure, devkit)

**Files:**
- Create: `devkit/src/lib/navigation/validate.ts`, `devkit/test/navigation/validate.test.ts`

**Interfaces:**
- Consumes: `RouteNode` (`model.ts`), `flatten`.
- Produces: `validate(root: RouteNode, platform: 'mobile' | 'web'): Diagnostic[]` where `Diagnostic { level: 'error'; rule: string; message: string }`. Rules: bad-format-for-platform, `bottomNav` > 5 direct pages, duplicate page key across tree, dangling link/page (no component/book), >1 `initial: true` per book.

- [ ] **Step 1: Write failing tests** — one per rule:

```ts
import { describe, it, expect } from 'vitest';
import { validate } from '../../src/lib/navigation/validate';

const page = (key: string) => ({ key, kind: 'page', component: key, options: {} });

describe('validate', () => {
  it('flags bottomNav with >5 pages', () => {
    const root = { key: 'r', kind: 'book', format: 'bottomNav', options: {},
      children: ['a','b','c','d','e','f'].map(page) } as any;
    const d = validate(root, 'mobile');
    expect(d.some(x => x.rule === 'bottomNav-max-5')).toBe(true);
  });
  it('flags a web format used on mobile', () => {
    const root = { key: 'r', kind: 'book', format: 'sidebar', options: {}, children: [page('a')] } as any;
    expect(validate(root, 'mobile').some(x => x.rule === 'format-platform')).toBe(true);
  });
  it('flags duplicate keys across nested books', () => {
    const root = { key: 'r', kind: 'book', format: 'stack', options: {}, children: [
      page('dup'), { key: 'sub', kind: 'book', format: 'stack', options: {}, children: [page('dup')] },
    ] } as any;
    expect(validate(root, 'mobile').some(x => x.rule === 'duplicate-key')).toBe(true);
  });
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3:** implement `validate` walking the tree, with `MOBILE_FORMATS`/`WEB_FORMATS` sets. **Step 4: Run** → PASS. **Step 5: Commit** `git commit -am "feat(devkit): storybook validation diagnostics"`

---

### Task 11: `render-native` — emit `navigation.native.tsx` (pure)

**Files:**
- Create: `devkit/src/lib/navigation/render-native.ts`, `devkit/test/navigation/render-native.test.ts`

**Interfaces:**
- Consumes: `RouteNode`.
- Produces: `renderNative(root: RouteNode, opts: { screensImport: string }): string` — emits a `navigation.native.tsx` string: imports `NavigationContainer` + the right navigator factory per format, builds nested navigators for linked books, wires `NavProvider` via `useNativeNav`, imports screen components from `opts.screensImport`.

- [ ] **Step 1: Write failing test** — assert the output for a `bottomNav` root contains `createBottomTabNavigator`, a `<Tab.Screen name="home"`, and `NavigationContainer`; assert a nested `stack` book emits `createNativeStackNavigator`.
- [ ] **Step 2: Run** → FAIL. **Step 3:** implement `renderNative` (map format→factory: `bottomNav`→`createBottomTabNavigator`, `drawer`→`createDrawerNavigator`, `stack`→`createNativeStackNavigator`; recurse linked books into nested navigator components; a `Root` component wraps everything in `NavigationContainer` + provides `useNativeNav` through `NavProvider`). **Step 4: Run** → PASS. **Step 5: Commit** `git commit -am "feat(devkit): render navigation.native.tsx"`

---

### Task 12: `render-web` — emit `navigation.web.tsx` (pure)

**Files:**
- Create: `devkit/src/lib/navigation/render-web.ts`, `devkit/test/navigation/render-web.test.ts`

**Interfaces:**
- Consumes: `RouteNode`, `flatten` (for the path table + `pathOf`/`nameOf`).
- Produces: `renderWeb(root: RouteNode, opts: { screensImport: string }): string` — emits `navigation.web.tsx`: a `createBrowserRouter`/`<Routes>` tree, a layout component per `sidebar`/`tabs` format wrapping `<Outlet/>`, the `pathOf`/`nameOf` maps, and `useWebNav(pathOf, nameOf)` bridged through `NavProvider`.

- [ ] **Step 1: Write failing test** — assert `sidebar` root output contains `<Routes>`, a `<Route path="/" element={<Sidebar/>}` layout wrapper, a child `<Route path="product"`, and the generated `pathOf` map. **Step 2: Run** → FAIL. **Step 3:** implement. **Step 4: Run** → PASS. **Step 5: Commit** `git commit -am "feat(devkit): render navigation.web.tsx"`

---

### Task 13: `render-routes-dts` — emit `routes.d.ts` (pure)

**Files:**
- Create: `devkit/src/lib/navigation/render-routes-dts.ts`, `devkit/test/navigation/render-routes-dts.test.ts`

**Interfaces:**
- Consumes: the `flatten` route list + per-page param info (params are represented as the page's declared TS type string, captured by `load-storybook`; default `void`).
- Produces: `renderRoutesDts(routes: { key: string; params: string }[]): string` — emits `export interface AppRoutes { home: void; product: { id: number }; ... }` and `declare module '@sublime-ui/ui/navigation' { ... typed useNav default ... }` augmentation OR a plain exported `AppRoutes` the app feeds to `useNav<AppRoutes>()`.

- [ ] **Step 1: Write failing test** — `renderRoutesDts([{key:'home',params:'void'},{key:'product',params:'{ id: number }'}])` contains `home: void;` and `product: { id: number };`. **Step 2: Run** → FAIL. **Step 3:** implement. **Step 4: Run** → PASS. **Step 5: Commit** `git commit -am "feat(devkit): render routes.d.ts route map"`

---

### Task 14: `load-storybook` + config `navigationDir`

**Files:**
- Create: `devkit/src/lib/navigation/load-storybook.ts`, `devkit/test/navigation/load-storybook.test.ts`, a fixture `devkit/test/fixtures/nav-app/src/navigation/storybook.native.ts`
- Modify: `devkit/src/lib/generators/config.ts` (add `navigationDir`)

**Interfaces:**
- Consumes: the authoring runtime shape (`BookDef`/`Entry`).
- Produces: `loadStorybook(absFile: string): Promise<RouteNode>` — dynamic-imports the user's compiled storybook (via `tsx`/`jiti` or a pre-built `.js`), walks the `BookDef` into a `RouteNode` tree (component name from `component.name`, params type unknown at runtime → defaults `void`; param types come from a lightweight source scan, see note). Adds `navigationDir: 'src/navigation'` to `GeneratorConfig` + `DEFAULT_CONFIG`.

> **Param-type note:** runtime import loses the `page<{id:number}>` type argument. v1 captures params by reading the storybook source with the TS compiler API to extract each `page<...>()` type argument; if absent, `void`. Keep this in a small `extract-params.ts` helper unit-tested with one fixture. (If too heavy for v1, default all params to `void` and require the app to pass an explicit `AppRoutes`; record this as a follow-up.)

- [ ] **Step 1:** add `navigationDir` to `config.ts` (+ a test in the existing config test). **Step 2:** write the fixture storybook. **Step 3:** failing test asserting `loadStorybook(fixture)` returns a `RouteNode` with `key:'root'`, format, and a `home` page child. **Step 4:** implement (use the same import strategy the devkit already uses for loading TS in-process — reuse `theme-init`'s approach). **Step 5: Run** → PASS. **Step 6: Commit** `git commit -am "feat(devkit): load storybook + navigationDir config"`

---

### Task 15: `build:nav` command + CLI wiring

**Files:**
- Create: `devkit/src/commands/build-nav.ts`, `devkit/test/navigation/build-nav.smoke.test.ts`
- Modify: `devkit/src/cli.ts`

**Interfaces:**
- Consumes: `loadConfig`, `loadStorybook`, `validate`, `flatten`, `renderNative`, `renderWeb`, `renderRoutesDts`, `safeWrite`, `updateBarrel`, `util/log`.
- Produces: `buildNav(opts: { cwd: string; watch?: boolean; force?: boolean }): Promise<number>` (exit code). Registers `sublime build:nav` in `cli.ts`.

- [ ] **Step 1: Write smoke test** `build-nav.smoke.test.ts` — copy the fixture app to a temp dir, run `buildNav({ cwd })`, assert `navigation.native.tsx`, `navigation.web.tsx`, `routes.d.ts`, `index.ts` exist with expected substrings; assert a `bottomNav`-with-6-pages fixture returns non-zero and writes nothing.
- [ ] **Step 2: Run** → FAIL. **Step 3:** implement `buildNav`: load both storybooks → `validate` each → if any error, print diagnostics + return 1 → else `flatten` + render the four files → `safeWrite` (force-overwrite generated files: these are owned by the generator, so write unconditionally with a header comment `// AUTO-GENERATED by sublime build:nav — do not edit`) → write `index.ts` barrel. **Step 4:** register command in `cli.ts` with `--watch`/`--force`/`--project`. **Step 5: Run** → PASS. **Step 6: Commit** `git commit -am "feat(devkit): build:nav command compiles storybooks"`

---

### Task 16: End-to-end typecheck + type tests + monorepo green

**Files:**
- Create: `ui/test/navigation/turn-to.test-d.ts`, `devkit/test/fixtures/nav-app/` (full fixture: both storybooks + screens + generated output)
- Modify: none (verification task)

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Type tests** `turn-to.test-d.ts` — with a concrete `AppRoutes`, assert `useNav<AppRoutes>().turnTo('product', { id: 1 })` compiles, `turnTo('product')` is `@ts-expect-error`, `turnTo('nope')` is `@ts-expect-error`, `turnTo('home')` (void) compiles.
- [ ] **Step 2:** run `build:nav` against the fixture, then `tsc --noEmit` the generated `navigation.native.tsx` + `navigation.web.tsx` against the real peers (add a `typecheck:fixture` script). Expected: clean.
- [ ] **Step 3:** Full monorepo gate:

Run: `npm run -ws --if-present typecheck && npm run -ws --if-present lint && npm test -ws --if-present && npm run -ws --if-present build`
Expected: all green.

- [ ] **Step 4: Commit** `git commit -am "test(ui,devkit): e2e navigation type tests + fixture typecheck"`

---

## Self-Review

**Spec coverage:** §2 concepts → Tasks 2,3,9; §3 authoring API → Tasks 2,3; §4 runtime `useNav` → Tasks 4,5; §5 layout primitives → Tasks 6,7; §6 compile step + validation → Tasks 9–15; §7 structure → Tasks 1,8,9; §8 deps → Task 1; §9 testing → every task + Task 16; §11 acceptance criteria → Tasks 10 (validation errors), 15 (four files), 16 (turnTo type safety, per-platform render, monorepo green). Covered.

**Placeholder scan:** One acknowledged risk parked explicitly with a fallback — the param-type extraction in Task 14 (`page<...>` type arg is lost at runtime). The fallback (default `void` + explicit `AppRoutes`) keeps the plan shippable; this is a scoped decision, not a vague placeholder.

**Type consistency:** `RouteNode`/`Diagnostic` shapes defined in Task 9/10 `model.ts` and reused in 11–15; `Nav`/`TypedNav` from Task 4 consumed by Tasks 5,16; `BookDef`/`PageDef` from Task 2 consumed by Task 3 and (runtime walk) Task 14. `pathOf`/`nameOf` produced in Task 12 and consumed by Task 5's `useWebNav`. Consistent.
