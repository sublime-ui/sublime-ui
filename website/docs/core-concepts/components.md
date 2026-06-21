---
sidebar_position: 6
title: Components
---

# Components

A Sublime UI component is one idea — a `Card`, a `Button` — that knows how to
draw itself on every platform. You reach for the same component everywhere; the
right implementation is chosen for you at build time. There's no webview and no
custom render engine: the web component paints with real [MUI](https://mui.com),
and the mobile component paints with
[React Native Paper](https://callstack.github.io/react-native-paper/). Each
platform draws with its own native-feeling toolkit.

`@sublime-ui/library` is the package that ships these components, as part of a
tokens-first design system: a serializable set of tokens generates a matching
Material theme for each platform, and every component resolves to the right
platform implementation at build time. (For the token side of that story, see
**[Theming](/docs/core-concepts/theming)**.)

## A component is a quartet

Each component is authored as four files that travel together inside
`library/src/components/<Name>/`:

- `<Name>.types.ts` — the **shared** props interface both platforms satisfy.
- `<Name>.tsx` — the **web** implementation (MUI).
- `<Name>.native.tsx` — the **mobile** implementation (React Native Paper).
- `index.ts` — the export barrel.

You never import these files individually. You write
`import { Card } from '@sublime-ui/library'`, and the bundler resolves `.tsx` on
web or `.native.tsx` on mobile. Because both implementations satisfy the same
`<Name>.types.ts`, the prop names and types are identical on every platform — you
write against one component and one props type.

## One component, a screen per platform

The split that matters in Sublime is per *screen*, not per *component*. You may
write a web screen and a native screen for a given route, but inside both you
reach for the same shared `Card`, `Button`, and friends. The component layer is
where cross-platform consistency lives, so a screen stays small and only
expresses what's genuinely platform-specific.

## Shared variant / tone / size props

Several components draw from a small set of shared union types declared in
`library/src/components/common.ts`:

| Type | Values |
| --- | --- |
| `Variant` | `'solid'` · `'soft'` · `'outline'` · `'ghost'` |
| `Tone` | `'primary'` · `'success'` · `'danger'` · `'warning'` · `'info'` · `'neutral'` |
| `Size` | `'sm'` · `'md'` · `'lg'` |

A `NavItem` shape — `{ key, label, icon, badge? }` — is shared by the navigation
components. Every component also accepts an optional `testID?: string` for test
targeting.

## Unified notifications

Notifications are unified through `useNotify`, so the same call shows a snackbar
on mobile and a toast on web. The notification tones are
`'success' | 'error' | 'warning' | 'info' | 'neutral'`.

## Platform availability

Most components render on both web and mobile. Two are **mobile-only**:
`BottomNav` and `Drawer`. On web they render `null` and emit a dev-only
`console.warn` (`"<Name> is mobile-only"`), so importing them is safe but they
draw nothing. `AppBar` and `GlassAppBar` exist on **both** platforms.

## Go deeper

The **[Components catalog](/components/overview)** is the per-component reference:
one page each, with props, defaults, and runnable `tsx` examples. See also the
**[Shared Types](/components/reference/shared-types)** for the `Tone`, `Variant`,
and `Size` unions used across the component API.

For the model behind the whole library — tokens, theming, and
`<SublimeProvider>` — see **[Theming](/docs/core-concepts/theming)**.
