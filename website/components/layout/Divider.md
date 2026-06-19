---
title: Divider
sidebar_position: 3
---

# Divider

A thin rule that visually separates content — either a horizontal line between stacked items or a vertical line between side-by-side ones.

Renders on web via MUI and on mobile via React Native Paper from a single import.

## Usage

```tsx
import { Divider, Text } from '@sublime-ui/library';

export default function DividerExample() {
  return (
    <>
      <Text>Account details</Text>
      <Divider />
      <Text>Billing details</Text>
    </>
  );
}
```

## Examples

### Horizontal divider (default)

With no props, `Divider` renders a full-width horizontal rule — the most common way to separate stacked rows.

```tsx
import { Divider, Text } from '@sublime-ui/library';

export default function HorizontalDividerExample() {
  return (
    <>
      <Text variant="subtitle">Recent activity</Text>
      <Text>Signed in from a new device</Text>
      <Divider />
      <Text>Password updated</Text>
      <Divider />
      <Text>Email address verified</Text>
    </>
  );
}
```

### Vertical divider

Set `vertical` to draw a vertical line, useful for separating items laid out in a row.

```tsx
import { Divider, Text } from '@sublime-ui/library';

export default function VerticalDividerExample() {
  return (
    <>
      <Text>Drafts</Text>
      <Divider vertical />
      <Text>Sent</Text>
      <Divider vertical />
      <Text>Archived</Text>
    </>
  );
}
```

### Inset divider

Set `inset` to indent the rule so it aligns with text content rather than spanning the full width — common in lists with leading avatars or icons.

```tsx
import { Divider, Text } from '@sublime-ui/library';

export default function InsetDividerExample() {
  return (
    <>
      <Text>Ada Lovelace</Text>
      <Divider inset />
      <Text>Alan Turing</Text>
      <Divider inset />
      <Text>Grace Hopper</Text>
    </>
  );
}
```

### Separating sections inside a card

A divider is frequently used to split related groups of content within a single container.

```tsx
import { Card, Divider, Text } from '@sublime-ui/library';

export default function CardDividerExample() {
  return (
    <Card>
      <Text variant="subtitle">Order #4821</Text>
      <Text>3 items · $64.00</Text>
      <Divider />
      <Text tone="success">Delivered on Tuesday</Text>
    </Card>
  );
}
```

### Tagged for testing

Pass `testID` to target the divider from automated tests on either platform.

```tsx
import { Divider, Text } from '@sublime-ui/library';

export default function TestableDividerExample() {
  return (
    <>
      <Text>Section A</Text>
      <Divider testID="section-divider" />
      <Text>Section B</Text>
    </>
  );
}
```

## Props

### vertical

**Type:** `boolean`
**Default:** `false`
**Required:** No

When `true`, the divider is drawn as a vertical line that stretches to fill its container's cross axis; otherwise it renders as a full-width horizontal rule. On web this maps to MUI's `orientation`, and on mobile a vertical divider is rendered as a thin stretched `View`.

### inset

**Type:** `boolean`
**Default:** `false`
**Required:** No

When `true`, the divider is indented from the leading edge so it aligns with inset content such as list text beside an avatar. On web this uses MUI's inset variant; on mobile it applies a left margin. Has no visual effect when combined with `vertical`.

### testID

**Type:** `string`
**Default:** —
**Required:** No

Test identifier forwarded to the underlying element — `data-testid` on web and `testID` on mobile — for use in automated tests.

## See also

- [Card](/components/layout/Card) — a glass-surfaced container whose sections are commonly separated by dividers.
- [Surface](/components/layout/Surface) — a lower-level elevated container for grouping content.
- [Text](/components/data-display/Text) — typographic primitive often placed on either side of a divider.
