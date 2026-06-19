---
sidebar_position: 1
title: Overview
---

# Library

`@sublime-ui/library` is a tokens-first design system. A serializable set of
**tokens** generates a matching Material theme for each platform (MUI on web,
React Native Paper on mobile), and every component resolves to the right platform
implementation at build time. There is no custom render engine and no webview:
each platform draws with its own native-feeling toolkit.

> Looking for the per-component prop tables and examples? See the
> **[Components catalog](/components/overview)** — one page per component, with
> typechecked `tsx` snippets.

## The component quartet

Every component is authored as a quartet inside `library/src/components/<Name>/`:

- `<Name>.tsx` — the web implementation (MUI).
- `<Name>.native.tsx` — the mobile implementation (React Native Paper).
- `<Name>.types.ts` — the **shared** props interface both implementations satisfy.
- `index.ts` — the export barrel.

You always `import { Button } from '@sublime-ui/library'`; the bundler picks
`.tsx` or `.native.tsx` per platform. Because both implementations satisfy the
same `<Name>.types.ts`, a component's prop names and types are identical on every
platform — write against one component and one props type.

## Tokens and theming

A `SublimeTokens` object is a plain, serializable description of your brand:
colors, spacing, radii, and typography. From those tokens the library derives a
matching Material theme for each platform, so `tone="danger"` is the same red
whether the pixel is painted by MUI or by Paper.

### `<SublimeProvider>` is required

Components read theme tokens from context. Wrap your app once:

```tsx
import { SublimeProvider } from '@sublime-ui/library';

export function App() {
  return (
    <SublimeProvider mode="light">
      {/* your screens */}
    </SublimeProvider>
  );
}
```

`SublimeProvider` accepts `mode?: 'light' | 'dark'` (default `'light'`), an
optional `tokens?: SublimeTokens` object (defaults to `defaultTokens`), and
`children`. It mounts the theme, a `CssBaseline`/Paper theme, and the
per-platform `NotificationHost`.

### `useTokens()`

Inside any component you can read the resolved theme tokens:

```tsx
import { useTokens } from '@sublime-ui/library';

function Price() {
  const tokens = useTokens();
  return <span style={{ color: tokens.colors.primary }}>$9.99</span>;
}
```

Calling `useTokens()` outside a `<SublimeProvider>` throws.

## Unified notifications

Notifications are unified through `useNotify`, so the same call shows a snackbar
on mobile and a toast on web. The notification tones are
`'success' | 'error' | 'warning' | 'info' | 'neutral'`.

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

## Platform availability

Most components render on both web and mobile. Two are **mobile-only**:
`BottomNav` and `Drawer`. On web they render `null` and emit a dev-only
`console.warn` (`"<Name> is mobile-only"`), so importing them is safe but they
draw nothing. `AppBar` and `GlassAppBar` exist on **both** platforms.

## Where to next

- **[Components catalog](/components/overview)** — the full, per-component
  reference with props, defaults, and runnable examples.
- **[Shared Types](/components/reference/shared-types)** — the `Tone`, `Variant`,
  and `Size` unions used across the component API.
