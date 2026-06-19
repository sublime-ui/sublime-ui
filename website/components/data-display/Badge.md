---
title: Badge
sidebar_position: 2
---

# Badge

A compact, pill-shaped label for statuses, counts, and categories — the kind of small marker you place next to a title, a row, or an avatar to call out state at a glance.

Renders on web via MUI (`Chip`) and on mobile via React Native Paper from a single import. The API is identical on both platforms; the only difference is the rendering primitive underneath.

## Usage

```tsx
import { Badge } from '@sublime-ui/library';

export default function BadgeExample() {
  return <Badge label="New" tone="primary" />;
}
```

## Examples

### Variants

Each badge supports three visual weights via the `variant` prop: `soft` (the default, a tinted background), `solid` (a filled, high-contrast chip), and `muted` (a neutral grey regardless of tone).

```tsx
import { Badge } from '@sublime-ui/library';

export default function BadgeVariantsExample() {
  return (
    <>
      <Badge label="Soft" tone="primary" variant="soft" />
      <Badge label="Solid" tone="primary" variant="solid" />
      <Badge label="Muted" tone="primary" variant="muted" />
    </>
  );
}
```

### Tones

The `tone` prop maps the badge onto the theme's semantic colors. Use it to signal meaning — `success` for healthy states, `danger` for failures, `warning` for attention, and so on.

```tsx
import { Badge } from '@sublime-ui/library';

export default function BadgeTonesExample() {
  return (
    <>
      <Badge label="Active" tone="success" />
      <Badge label="Failed" tone="danger" />
      <Badge label="Pending" tone="warning" />
      <Badge label="Beta" tone="info" />
      <Badge label="Draft" tone="neutral" />
    </>
  );
}
```

### Solid status pills

A common pattern: filled badges that read as crisp status pills next to a list item or a heading.

```tsx
import { Badge } from '@sublime-ui/library';

export default function BadgeSolidExample() {
  return (
    <>
      <Badge label="Live" tone="success" variant="solid" />
      <Badge label="Archived" tone="neutral" variant="solid" />
      <Badge label="Overdue" tone="danger" variant="solid" />
    </>
  );
}
```

### With an icon

Pass a Material Symbols icon name to `icon` to render a glyph before the label. The icon inherits the badge's foreground color automatically.

```tsx
import { Badge } from '@sublime-ui/library';

export default function BadgeIconExample() {
  return (
    <>
      <Badge label="Verified" tone="success" icon="check_circle" />
      <Badge label="Premium" tone="warning" icon="star" />
      <Badge label="Locked" tone="neutral" icon="lock" />
    </>
  );
}
```

### Muted category tags

The `muted` variant ignores `tone` and always renders in neutral grey — handy for low-emphasis category tags where color would be noise.

```tsx
import { Badge } from '@sublime-ui/library';

export default function BadgeMutedExample() {
  const categories = ['Design', 'Engineering', 'Marketing'];
  return (
    <>
      {categories.map((category) => (
        <Badge key={category} label={category} variant="muted" />
      ))}
    </>
  );
}
```

### Driven by state

Because `label` is just a string, badges compose naturally with React state — for example, a live count that updates as data changes.

```tsx
import { useState } from 'react';
import { Badge } from '@sublime-ui/library';

export default function BadgeCountExample() {
  const [unread] = useState(7);
  return <Badge label={`${unread} unread`} tone="info" variant="solid" />;
}
```

## Props

### label

**Type:** `string`

**Default:** —

**Required:** Yes

The text shown inside the badge. This is the only required prop.

### tone

**Type:** [`Tone`](/components/reference/shared-types)

**Default:** `'neutral'`

**Required:** No

The semantic color of the badge — one of `primary`, `success`, `danger`, `warning`, `info`, or `neutral`. Ignored when `variant` is `muted`.

### variant

**Type:** `'solid' | 'soft' | 'muted'`

**Default:** `'soft'`

**Required:** No

The visual weight of the badge. `soft` uses a tinted background, `solid` is a filled high-contrast chip, and `muted` is a tone-agnostic neutral grey.

### icon

**Type:** `string`

**Default:** —

**Required:** No

The name of a Material Symbols icon to render before the label (for example `check_circle` or `star`). The icon inherits the badge's foreground color.

### testID

**Type:** `string`

**Default:** —

**Required:** No

A test identifier. On web it is applied as `data-testid`; on mobile it is passed through as React Native's `testID`.

## See also

- [Avatar](/components/data-display/Avatar) — a circular image or initials marker, often paired with a badge.
- [Card](/components/layout/Card) — a surface for grouping related content that badges frequently annotate.
- [Text](/components/data-display/Text) — the typographic primitive for the labels that sit beside badges.
