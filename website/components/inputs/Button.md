---
title: Button
sidebar_position: 1
---

# Button

A pressable control that triggers an action — submitting a form, confirming a dialog, or navigating. It supports multiple visual variants, semantic tones, sizes, and loading/disabled states.

Renders on web via MUI and on mobile via React Native Paper from a single import.

## Usage

```tsx
import { Button } from '@sublime-ui/library';

export default function ButtonExample() {
  return (
    <Button variant="solid" tone="primary" onPress={() => console.log('saved')}>
      Save changes
    </Button>
  );
}
```

## Examples

### Variants

Each `variant` changes the button's emphasis: `solid` is filled, `soft` is a tinted fill, `outline` is bordered, and `ghost` is text-only.

```tsx
import { Button } from '@sublime-ui/library';

export default function ButtonVariantsExample() {
  const onPress = () => {};
  return (
    <>
      <Button variant="solid" onPress={onPress}>Solid</Button>
      <Button variant="soft" onPress={onPress}>Soft</Button>
      <Button variant="outline" onPress={onPress}>Outline</Button>
      <Button variant="ghost" onPress={onPress}>Ghost</Button>
    </>
  );
}
```

### Tones

The `tone` prop maps the button to a semantic color, so the same component can read as a primary action, a success confirmation, or a destructive one.

```tsx
import { Button } from '@sublime-ui/library';

export default function ButtonTonesExample() {
  const onPress = () => {};
  return (
    <>
      <Button tone="primary" onPress={onPress}>Primary</Button>
      <Button tone="success" onPress={onPress}>Save</Button>
      <Button tone="danger" onPress={onPress}>Delete</Button>
      <Button tone="warning" onPress={onPress}>Archive</Button>
      <Button tone="info" onPress={onPress}>Details</Button>
      <Button tone="neutral" onPress={onPress}>Cancel</Button>
    </>
  );
}
```

### Sizes

Use `size` to fit the button to its context — `sm` for dense toolbars, `lg` for prominent calls to action.

```tsx
import { Button } from '@sublime-ui/library';

export default function ButtonSizesExample() {
  const onPress = () => {};
  return (
    <>
      <Button size="sm" onPress={onPress}>Small</Button>
      <Button size="md" onPress={onPress}>Medium</Button>
      <Button size="lg" onPress={onPress}>Large</Button>
    </>
  );
}
```

### Loading state

While `loading` is true the button shows a spinner and is automatically non-interactive, which is useful for async submits.

```tsx
import { useState } from 'react';
import { Button } from '@sublime-ui/library';

export default function ButtonLoadingExample() {
  const [submitting, setSubmitting] = useState(false);

  const handlePress = () => {
    setSubmitting(true);
    setTimeout(() => setSubmitting(false), 1500);
  };

  return (
    <Button tone="primary" loading={submitting} onPress={handlePress}>
      {submitting ? 'Submitting…' : 'Submit order'}
    </Button>
  );
}
```

### Disabled state

A `disabled` button is dimmed and ignores presses.

```tsx
import { Button } from '@sublime-ui/library';

export default function ButtonDisabledExample() {
  return (
    <Button tone="primary" disabled onPress={() => {}}>
      Unavailable
    </Button>
  );
}
```

### With an icon

Pass an `icon` name to prefix the label. The icon renders on mobile (React Native Paper); on web the label is shown without the leading glyph.

```tsx
import { Button } from '@sublime-ui/library';

export default function ButtonIconExample() {
  return (
    <Button variant="outline" icon="download" onPress={() => {}}>
      Export CSV
    </Button>
  );
}
```

### Full-width

Set `fullWidth` to stretch the button across its container — common for forms and bottom sheets. On web this expands to 100% of the parent width.

```tsx
import { Button } from '@sublime-ui/library';

export default function ButtonFullWidthExample() {
  return (
    <Button variant="solid" tone="primary" fullWidth onPress={() => {}}>
      Continue
    </Button>
  );
}
```

## Props

### children

**Type:** `ReactNode`
**Default:** —
**Required:** Yes

The button's content, typically the label text.

### onPress

**Type:** `() => void`
**Default:** —
**Required:** No

Called when the button is pressed (mapped to `onClick` on web).

### variant

**Type:** [`Variant`](/components/reference/shared-types)
**Default:** `'solid'`
**Required:** No

Visual emphasis of the button: `'solid'`, `'soft'`, `'outline'`, or `'ghost'`.

### tone

**Type:** [`Tone`](/components/reference/shared-types)
**Default:** `'primary'`
**Required:** No

Semantic color of the button. Applied on web; on mobile the Paper theme color is used.

### size

**Type:** [`Size`](/components/reference/shared-types)
**Default:** `'md'`
**Required:** No

Control size: `'sm'`, `'md'`, or `'lg'`.

### disabled

**Type:** `boolean`
**Default:** `false`
**Required:** No

When true, the button is dimmed and does not respond to presses.

### loading

**Type:** `boolean`
**Default:** `false`
**Required:** No

When true, shows a spinner and disables interaction until it resolves.

### icon

**Type:** `string`
**Default:** —
**Required:** No

Name of a leading icon. Rendered on mobile via React Native Paper; ignored on web.

### fullWidth

**Type:** `boolean`
**Default:** `false`
**Required:** No

When true, the button stretches to fill the width of its container.

### testID

**Type:** `string`
**Default:** —
**Required:** No

Test identifier, surfaced as `data-testid` on web and `testID` on mobile.

## See also

- [Input](/components/inputs/Input)
- [Select](/components/inputs/Select)
- [Checkbox](/components/inputs/Checkbox)
