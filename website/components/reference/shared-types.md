---
title: Shared Types
sidebar_position: 1
---

# Shared Types

A handful of prop types are shared across many components so that the same word
means the same thing everywhere. They live in one place
(`library/src/components/common.ts`) and are re-exported through
`@sublime-ui/library`. Per-component pages deep-link here instead of repeating
the unions.

```tsx
import { Button } from '@sublime-ui/library';

export function ToneAndSize() {
  return (
    <Button variant="solid" tone="primary" size="md">
      Save
    </Button>
  );
}
```

### Tone

```ts
type Tone = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
```

The semantic color role of a component. `Tone` maps to your theme tokens, so
`tone="danger"` resolves to the same red on web (MUI) and mobile (Paper).

**Used by:** `Button`, `Badge`, `Banner`, `Fab`, `Text`, `Spinner`, `Switch`,
`Checkbox`.

### Variant

```ts
type Variant = 'solid' | 'soft' | 'outline' | 'ghost';
```

The visual weight / fill style of a component — from a fully filled `solid` to a
transparent `ghost`.

**Used by:** `Button` (the `variant` prop). Note that some components define
their own, narrower variant unions instead of this shared one — for example
`Badge` uses `BadgeVariant` (`'solid' | 'soft' | 'muted'`) and `Text` uses
`TextVariant` (`'title' | 'subtitle' | 'body' | 'caption'`).

### Size

```ts
type Size = 'sm' | 'md' | 'lg';
```

The t-shirt size of a component, controlling its overall scale.

**Used by:** `Button`, `Avatar`, `Spinner`, and `Icon` (where `Icon` accepts
either a `Size` or a raw `number`).

### NavItem

```ts
interface NavItem {
  key: string;
  label: string;
  icon: string;
  badge?: string | number;
}
```

A single entry in a navigation surface: a stable `key`, a visible `label`, an
`icon` name, and an optional `badge` (a count or short string).

**Used by:** the navigation components — `BottomNav` and `Drawer` — which take a
list of `NavItem`s. `NavItem` is exported directly from `@sublime-ui/library`.
