---
sidebar_position: 7
title: Theming
---

# Theming

Your app's look is driven by **one serializable object** of design tokens — a
`SublimeTokens` set describing your brand's colors, spacing, radii, and
typography. That single object is the source of truth for **both** platforms: it
generates the [MUI](https://mui.com) theme on web and the
[React Native Paper](https://callstack.github.io/react-native-paper/) (MD3) theme
on mobile. You don't hand-write a Paper theme and a separate MUI theme; you write
tokens, and the matching platform themes are derived for you.

## Tokens-first, not style code

The mental shift is that you stop styling components and start declaring tokens.
A `SublimeTokens` object is a plain, serializable description of your brand:
colors, spacing, radii, and typography. Because both platform themes come from
the same `SublimeTokens`, `tone="danger"` is the same red whether the pixel is
painted by MUI or by Paper — by construction, not by you keeping two theme files
in sync.

## Change tokens once

Your tokens live in the **shared** `src/theme/` directory (`tokens.json` plus a
typed `tokens.ts`) — the single set that produces both platform themes. When you
want a different brand color, a tighter spacing scale, or a new corner radius,
you edit your tokens in one place. Both the web theme and the mobile theme update
from that one edit — there is no second place to change, and the platforms can't
drift apart. Light and dark modes fall out of the same tokens too.

You can scaffold a fresh set with `sublime theme:init`.

## Generating the platform themes

The library generates a platform theme for each target from the same tokens:

```ts
import { generateThemes } from '@sublime-ui/library';

const { muiTheme, paperTheme } = generateThemes(tokens, 'light');
// muiTheme → web (MUI) · paperTheme → mobile (Paper MD3)
```

One token set produces a coherent MUI theme on web and a Paper MD3 theme on
mobile, so the two platforms stay in sync **by construction** — you never theme
the app twice. `generateThemes(tokens, mode)` takes the mode, so the same tokens
yield matched light and dark themes on both platforms.

## `<SublimeProvider>` is required

Components read theme tokens from context. Wrap your app once and the platform
theme flows to every component:

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

You can also pass an explicit token set:

```tsx
<SublimeProvider tokens={tokens}>
  <App />
</SublimeProvider>;
```

`SublimeProvider` accepts `mode?: 'light' | 'dark'` (default `'light'`), an
optional `tokens?: SublimeTokens` object (defaults to `defaultTokens`), and
`children`. It builds the platform theme from your tokens and installs it,
mounting a `CssBaseline`/Paper theme provider and the per-platform
`NotificationHost`, so every library component picks up your colors, typography,
and spacing.

## `useTokens()`

Inside any component you can read the resolved theme tokens directly:

```tsx
import { useTokens } from '@sublime-ui/library';

function Price() {
  const tokens = useTokens();
  return <span style={{ color: tokens.colors.primary }}>$9.99</span>;
}
```

Calling `useTokens()` outside a `<SublimeProvider>` throws.

## Per-platform notes

The token-and-provider model above is identical on both platforms. The only
difference is the Material toolkit the tokens compile to.

### Web (MUI)

On web, the framework turns your tokens into a real Material UI theme, so
`@sublime-ui/library` components render as genuine MUI. `<SublimeProvider>`
builds the MUI theme from your tokens and installs it, so every component picks
up your colors, typography, and spacing.

Because the web theme is a real MUI theme, you can still use MUI's `sx` and
component APIs in a web (`*.tsx`) screen — but prefer tokens for anything shared
across platforms, so mobile stays in step.

```tsx
import { useTokens } from '@sublime-ui/library';

function Price() {
  const tokens = useTokens();
  return <span style={{ color: tokens.colors.primary }}>$9.99</span>;
}
```

### Mobile (Paper)

On mobile, the framework turns the same tokens into a real **React Native Paper
(MD3)** theme, so `@sublime-ui/library` components render as genuine Paper.
`<SublimeProvider>` builds the Paper theme from your tokens and installs it (it
mounts Paper's theme provider under the hood), so every component picks up your
colors, typography, and spacing.

Because the mobile theme is a real Paper MD3 theme, you can still use Paper's
component APIs in a `*.native.tsx` screen — but prefer tokens for anything shared
across platforms, so web stays in step.

```tsx
import { useTokens } from '@sublime-ui/library';

function Price() {
  const tokens = useTokens();
  return <Text style={{ color: tokens.colors.primary }}>$9.99</Text>;
}
```

## Go deeper

- **[Components](/docs/core-concepts/components)** — the cross-platform component
  system that consumes these tokens, and the component quartet
  (`Card.native.tsx` is the Paper implementation, `Card.tsx` the MUI one).
- **[Components catalog](/components/overview)** — the full, per-component
  reference with props, defaults, and runnable examples.
