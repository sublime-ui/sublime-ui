---
title: Fab
sidebar_position: 4
---

# Fab

A floating action button for the screen's primary action — a circular icon button by default, or an extended pill that also shows a text label.

Renders on web via MUI and on mobile via React Native Paper from a single import.

## Usage

```tsx
import { Fab } from '@sublime-ui/library';

export default function FabExample() {
  return <Fab icon="add" onPress={() => console.log('compose')} />;
}
```

## Examples

### Extended with a label

Pass a `label` to render the extended (pill) variant — the icon sits next to the text. Omitting `label` keeps the circular icon-only shape.

```tsx
import { Fab } from '@sublime-ui/library';

export default function FabExtendedExample() {
  return <Fab icon="edit" label="Compose" onPress={() => console.log('compose')} />;
}
```

### Tones

The `tone` prop colors the icon (and label) to signal intent. It accepts any of the shared tones.

```tsx
import { Fab } from '@sublime-ui/library';

export default function FabTonesExample() {
  const noop = () => {};

  return (
    <>
      <Fab icon="add" tone="primary" onPress={noop} />
      <Fab icon="check" tone="success" onPress={noop} />
      <Fab icon="delete" tone="danger" onPress={noop} />
      <Fab icon="warning" tone="warning" onPress={noop} />
      <Fab icon="info" tone="info" onPress={noop} />
      <Fab icon="more_horiz" tone="neutral" onPress={noop} />
    </>
  );
}
```

### A destructive action

Combine a `danger` tone with an extended label to make a high-stakes action unmistakable.

```tsx
import { Fab } from '@sublime-ui/library';

export default function FabDestructiveExample() {
  const handleDelete = () => console.log('delete selected');

  return <Fab icon="delete" label="Delete" tone="danger" onPress={handleDelete} />;
}
```

### Driving state from the handler

`onPress` is a plain callback, so you can wire it to React state to toggle UI — here flipping the icon and label between two modes.

```tsx
import { useState } from 'react';
import { Fab } from '@sublime-ui/library';

export default function FabToggleExample() {
  const [editing, setEditing] = useState(false);

  return (
    <Fab
      icon={editing ? 'check' : 'edit'}
      label={editing ? 'Done' : 'Edit'}
      tone={editing ? 'success' : 'primary'}
      onPress={() => setEditing((prev) => !prev)}
    />
  );
}
```

### With a test identifier

Set `testID` to target the button in tests; it is exposed as `data-testid` on web and `testID` on mobile.

```tsx
import { Fab } from '@sublime-ui/library';

export default function FabTestIdExample() {
  return <Fab icon="add" testID="compose-fab" onPress={() => {}} />;
}
```

## Props

### icon

**Type:** `string`
**Default:** —
**Required:** Yes

The icon to display. On web this is a Material Icons ligature name (e.g. `"add"`); on mobile it is the corresponding React Native Paper icon name.

### onPress

**Type:** `() => void`
**Default:** —
**Required:** No

Called when the button is pressed. Maps to `onClick` on web and `onPress` on mobile; if omitted, the button is inert.

### tone

**Type:** [`Tone`](/components/reference/shared-types)
**Default:** `'primary'`
**Required:** No

The semantic color of the icon and label. `danger` maps to the error color and `neutral` to a foreground/inherit color.

### label

**Type:** `string`
**Default:** —
**Required:** No

When provided, renders the extended (pill) variant with this text beside the icon. Omit it for the default circular, icon-only button.

### testID

**Type:** `string`
**Default:** —
**Required:** No

Test identifier, surfaced as `data-testid` on web and `testID` on mobile.

## See also

- [AppBar](/components/bars-nav/AppBar)
- [GlassAppBar](/components/bars-nav/GlassAppBar)
- [BottomNav](/components/bars-nav/BottomNav)
