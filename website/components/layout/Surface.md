---
title: Surface
sidebar_position: 2
---

# Surface

A low-level elevated container that gives content a themed background, border, and configurable drop shadow.

Renders on web via MUI and on mobile via React Native Paper from a single import.

## Usage

```tsx
import { Surface, Text } from '@sublime-ui/library';

export default function SurfaceExample() {
  return (
    <Surface>
      <Text variant="subtitle">Account balance</Text>
      <Text>$4,820.50 available across all accounts.</Text>
    </Surface>
  );
}
```

## Examples

### Elevation levels

`elevation` controls the depth of the drop shadow. The available levels are `none`, `sm` (the default), `md`, and `lg`.

```tsx
import { Surface, Text } from '@sublime-ui/library';

export default function SurfaceElevationExample() {
  return (
    <>
      <Surface elevation="none">
        <Text>Flat — no shadow</Text>
      </Surface>
      <Surface elevation="sm">
        <Text>Small elevation (default)</Text>
      </Surface>
      <Surface elevation="md">
        <Text>Medium elevation</Text>
      </Surface>
      <Surface elevation="lg">
        <Text>Large elevation</Text>
      </Surface>
    </>
  );
}
```

### Flush content (no padding)

Set `padded={false}` when the surface hosts media or a list that should run all the way to its edges.

```tsx
import { Surface, Text } from '@sublime-ui/library';

export default function FlushSurfaceExample() {
  return (
    <Surface padded={false}>
      <Text variant="caption">Edge-to-edge content goes here.</Text>
    </Surface>
  );
}
```

### Composing other components

`children` accepts any React content, so a surface commonly wraps a heading, body text, and an action.

```tsx
import { Surface, Text, Button } from '@sublime-ui/library';

export default function ComposedSurfaceExample() {
  const startTrial = () => {
    console.log('Trial started');
  };

  return (
    <Surface elevation="md">
      <Text variant="title">Try Pro free for 14 days</Text>
      <Text tone="neutral">No card required. Cancel anytime.</Text>
      <Button variant="solid" tone="primary" onPress={startTrial}>
        Start free trial
      </Button>
    </Surface>
  );
}
```

### Raised panel with a test identifier

Pass `testID` to target the surface from automated tests. It maps to `data-testid` on web and `testID` on mobile.

```tsx
import { Surface, Text } from '@sublime-ui/library';

export default function RaisedPanelExample() {
  return (
    <Surface elevation="lg" testID="summary-panel">
      <Text variant="subtitle">Weekly summary</Text>
      <Text>You completed 32 of 40 planned tasks.</Text>
    </Surface>
  );
}
```

## Props

### children

**Type:** `ReactNode`
**Default:** —
**Required:** Yes

The content rendered inside the surface. Accepts any valid React node — text, other Sublime components, or arbitrary markup.

### elevation

**Type:** `'none' | 'sm' | 'md' | 'lg'`
**Default:** `'sm'`
**Required:** No

How much drop shadow the surface casts. `'none'` renders a flat, shadowless container; higher levels lift the surface further off the page. On mobile this maps to React Native Paper's elevation scale.

### padded

**Type:** `boolean`
**Default:** `true`
**Required:** No

Whether the surface applies its standard internal spacing. Set to `false` for edge-to-edge content such as media or full-width lists.

### testID

**Type:** `string`
**Default:** —
**Required:** No

Test identifier forwarded to the underlying element — `data-testid` on web and `testID` on mobile — for use in automated tests.

## See also

- [Card](/components/layout/Card) — a higher-level container that builds on Surface and can be made tappable as a whole.
- [Divider](/components/layout/Divider) — a thin rule for separating content within or between surfaces.
- [Text](/components/data-display/Text) — typographic primitive commonly composed inside surfaces.
