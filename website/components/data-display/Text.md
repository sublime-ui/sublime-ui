---
title: Text
sidebar_position: 3
---

# Text

A typographic primitive for rendering headings, body copy, and supporting text with consistent type scale and color.

Renders on web via MUI `Typography` and on mobile via React Native Paper `Text` from a single import. The same `variant` values map to the right native type ramp on each platform, so a `"title"` on web and on mobile share one source of truth.

## Usage

```tsx
import { Text } from '@sublime-ui/library';

export default function TextExample() {
  return <Text>Your changes have been saved.</Text>;
}
```

## Examples

### Variants

`variant` selects the role in the type scale. `subtitle` and `caption` are rendered in a muted foreground color automatically, while `title` and `body` use the primary foreground.

```tsx
import { Text } from '@sublime-ui/library';

export default function TextVariantsExample() {
  return (
    <>
      <Text variant="title">Account settings</Text>
      <Text variant="subtitle">Manage your profile and preferences</Text>
      <Text variant="body">
        Updates take effect immediately and apply across every device.
      </Text>
      <Text variant="caption">Last synced 2 minutes ago</Text>
    </>
  );
}
```

### Body text (default variant)

Omitting `variant` renders body text — the most common case for paragraphs and inline labels.

```tsx
import { Text } from '@sublime-ui/library';

export default function BodyTextExample() {
  return (
    <Text>
      We sent a confirmation link to your inbox. Open it to finish setting up
      your workspace.
    </Text>
  );
}
```

### Toned text

`tone` accepts any shared tone token, letting text signal status — for example a success confirmation or a danger warning alongside body copy.

```tsx
import { Text } from '@sublime-ui/library';

export default function TonedTextExample() {
  return (
    <>
      <Text tone="success">Payment received</Text>
      <Text tone="danger">Card declined — please try another method</Text>
      <Text tone="warning">Your trial ends in 3 days</Text>
      <Text tone="neutral">No recent activity</Text>
    </>
  );
}
```

### Truncating to a fixed number of lines

`numberOfLines` clamps overflowing content to the given line count — useful for previews and list rows where space is constrained.

```tsx
import { Text } from '@sublime-ui/library';

export default function ClampedTextExample() {
  return (
    <Text numberOfLines={2}>
      This is a long product description that should be truncated after two
      lines so the surrounding card layout stays compact and predictable across
      both web and mobile.
    </Text>
  );
}
```

### Composing variants in a layout

Variants combine naturally to build a titled section with supporting and fine-print text.

```tsx
import { Text } from '@sublime-ui/library';

export default function SectionHeaderExample() {
  const unreadCount = 12;

  return (
    <>
      <Text variant="title">Notifications</Text>
      <Text variant="subtitle">{`${unreadCount} unread`}</Text>
      <Text variant="caption">You can mute conversations from each thread.</Text>
    </>
  );
}
```

## Props

### children

**Type:** `ReactNode`
**Default:** —
**Required:** Yes

The text content to render. Typically a string, but any valid React node is accepted.

### variant

**Type:** [`TextVariant`](/components/reference/shared-types) (`'title' | 'subtitle' | 'body' | 'caption'`)
**Default:** `'body'`
**Required:** No

Selects the role in the type scale. `subtitle` and `caption` are displayed in a muted color; `title` and `body` use the primary foreground.

### tone

**Type:** [`Tone`](/components/reference/shared-types)
**Default:** —
**Required:** No

Semantic color tone for the text, drawn from the shared tone palette (`primary`, `success`, `danger`, `warning`, `info`, `neutral`).

### numberOfLines

**Type:** `number`
**Default:** —
**Required:** No

Maximum number of lines to display before truncating overflowing content with an ellipsis. When omitted, the text wraps freely.

### testID

**Type:** `string`
**Default:** —
**Required:** No

Test identifier forwarded to the underlying element — `data-testid` on web and `testID` on mobile — for use in automated tests.

## See also

- [Badge](/components/data-display/Badge) — a small count or status indicator for labeling other elements.
- [Icon](/components/data-display/Icon) — renders a named glyph, often paired with text.
- [Avatar](/components/data-display/Avatar) — displays a user image, initials, or icon.
