---
sidebar_position: 5
title: Navigation
---

# Navigation

In Sublime UI you don't hand-write router code. You describe your navigation as a
typed **storybook** — one per platform — and a build step compiles it, ahead of
time, into the idiomatic router each platform expects: react-router on web, React
Navigation on mobile. You never hand-write platform routing.

## The mental model

A storybook is a plain, typed description of your screens and how they connect:

- A **Book** is a navigator. It has a **print format** that decides how its pages
  are presented.
- A **Page** is a screen. One page follows another.
- A book can **link** to another book — a nested navigator.

You author this in `storybook.web.ts` and `storybook.native.ts`, kept **separate
per platform** because web and mobile navigation are genuinely different shapes —
different screens, different presentation formats. The mobile book references
mobile screens and mobile formats; the web book references web screens and web
formats.

The important part: **you author the storybook; the navigation code is generated.**
The `sublime build:nav` step reads each storybook ahead of time and emits idiomatic
routers — react-router on web, React Navigation on mobile — plus a fully typed route
map. Your app just mounts the platform-resolved `<Navigation>` and moves between
pages with one typed `useNav()` hook.

Because the route map is generated from the same source, navigation is checked at
the type level: an unknown page name is a compile error, and screen params are
required exactly when a page declares them. Treat the compiled
`navigation.*.tsx` / `routes.d.ts` files as build artifacts — edit the storybook,
not the output.

## Print formats

Formats are a validated string union per platform — an invalid value is a type
error.

| Platform | Formats |
| --- | --- |
| Mobile | `drawer` · `stack` · `bottomNav` (max 5 pages) |
| Web | `sidebar` · `stack` · `tabs` |

## Authoring

```ts
// src/navigation/storybook.native.ts  (mobile)
import { book, page, link } from '@sublime-ui/ui/navigation';
import { Home } from '../screens/mobile/Home';
import { ProductDetail } from '../screens/mobile/ProductDetail';
import { settingsBook } from './settings.native';

export default book({
  format: 'bottomNav',
  pages: {
    home: page(Home, { title: 'Home', icon: 'home' }),
    product: page<{ id: number }>(ProductDetail, { title: 'Product' }),
    settings: link(settingsBook, { title: 'Settings', icon: 'cog' }),
  },
});
```

The web book has the same shape, pointing at `../screens/web/*` with a web format
such as `sidebar`.

## Typed routes and navigating

One typed hook, everywhere:

```ts
const nav = useNav();
nav.turnTo('product', { id: 1 }); // params required because the page declared them
nav.turnBack();
```

`turnTo` is checked against a generated route map: an unknown page name is a type
error, and params are required exactly when the target page declares them.

## Compiling

A devkit step turns each storybook into platform artifacts:

```bash
sublime build:nav
```

It emits `navigation.native.tsx` (React Navigation), `navigation.tsx`
(react-router), and `routes.d.ts` (the typed route map). The platform-resolved
`<Navigation>` is what your app mounts. Validation runs here too — a 6-page
`bottomNav`, a duplicate page key, or a dangling link fails the build with a clear
message.

## Mobile header (AppBar)

On mobile, every generated navigator uses the shipped Sublime
[`AppBar`](/components/bars-nav/AppBar) as its header — **not** React
Navigation's default header. You get it for free; there is nothing to wire up.

- The header **title** comes from each page's `title` option.
- The **back arrow appears only when there is a screen to go back to** — root
  screens and `bottomNav` / `drawer` top-level screens show none automatically.
- Nested navigators don't stack headers: a book mounted inside another navigator
  hides the outer header so only the inner AppBar shows.

### Turning the AppBar off / using your own

Set `header: false` to hide the Sublime AppBar and render your own bar inside the
screen instead. It works per page, or per book as a default for all its pages
(a per-page value wins):

```ts
export default book({
  format: 'stack',
  // header: false,            // ← default for every page in this book
  pages: {
    // Default: shows the Sublime AppBar titled "Feed".
    feed: page(Feed, { title: 'Feed' }),

    // Opt out: no Sublime AppBar — this screen renders its own header.
    editor: page(Editor, { title: 'Editor', header: false }),
  },
});
```

> Note: this is mobile-only. Web navigation (react-router) renders its own chrome
> and is unaffected. Custom transitions use native-stack's `animation` /
> `gestureEnabled` — the native iOS slide and swipe-back are on by default.

## Layout primitives

Screens compose from a small, platform-resolved set: `Screen`, `Stack`, `Row`,
`Spacer` — so a screen's structure reads the same on every platform while
rendering with native primitives underneath.
