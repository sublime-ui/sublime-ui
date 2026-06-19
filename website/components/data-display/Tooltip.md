---
title: Tooltip
sidebar_position: 5
---

# Tooltip

A small floating label that explains the element it wraps — shown on hover on the web and on long-press on mobile, giving controls and icons a short, contextual hint without cluttering the layout.

Renders on web via MUI and on mobile via React Native Paper from a single import. The API is identical on both platforms; the only behavioural difference is how the tooltip is triggered — pointer hover on the web, a long-press on mobile.

## Usage

```tsx
import { Tooltip, Button } from '@sublime-ui/library';

export default function TooltipExample() {
  return (
    <Tooltip label="Save your changes">
      <Button tone="primary">Save</Button>
    </Tooltip>
  );
}
```

## Examples

### Hinting an icon button

Icon-only controls are the most common place for a tooltip — the glyph carries the action and the tooltip spells it out for anyone who is unsure.

```tsx
import { Tooltip, Button } from '@sublime-ui/library';

export default function IconButtonTooltipExample() {
  return (
    <Tooltip label="Delete this item">
      <Button icon="delete" tone="danger" variant="ghost">
        Delete
      </Button>
    </Tooltip>
  );
}
```

### Explaining a standalone icon

A tooltip can wrap any single element, including a bare [`Icon`](/components/data-display/Icon). Here it clarifies what an info glyph represents.

```tsx
import { Tooltip, Icon } from '@sublime-ui/library';

export default function IconTooltipExample() {
  return (
    <Tooltip label="Your data is encrypted at rest">
      <Icon name="info" />
    </Tooltip>
  );
}
```

### Annotating an avatar

Wrap an [`Avatar`](/components/data-display/Avatar) to reveal the full name on hover or long-press — useful in a dense row of teammates where only the picture is shown.

```tsx
import { Tooltip, Avatar } from '@sublime-ui/library';

export default function AvatarTooltipExample() {
  return (
    <Tooltip label="Ada Lovelace">
      <Avatar label="Ada Lovelace" size="sm" />
    </Tooltip>
  );
}
```

### A row of explained actions

Because each tooltip wraps exactly one element, you place one per control. Here a small toolbar gives every icon button its own hint.

```tsx
import { Tooltip, Button } from '@sublime-ui/library';

export default function ToolbarTooltipExample() {
  const actions = [
    { icon: 'content_copy', label: 'Copy' },
    { icon: 'edit', label: 'Edit' },
    { icon: 'share', label: 'Share' },
  ];

  return (
    <>
      {actions.map((action) => (
        <Tooltip key={action.label} label={action.label}>
          <Button icon={action.icon} variant="ghost">
            {action.label}
          </Button>
        </Tooltip>
      ))}
    </>
  );
}
```

### A label driven by state

The `label` is just a string, so it can be computed from React state — for example, a toggle whose tooltip reflects its current mode.

```tsx
import { useState } from 'react';
import { Tooltip, Button } from '@sublime-ui/library';

export default function StatefulTooltipExample() {
  const [muted, setMuted] = useState(false);

  return (
    <Tooltip label={muted ? 'Unmute notifications' : 'Mute notifications'}>
      <Button
        icon={muted ? 'notifications_off' : 'notifications'}
        variant="ghost"
        onPress={() => setMuted((prev) => !prev)}
      >
        {muted ? 'Muted' : 'On'}
      </Button>
    </Tooltip>
  );
}
```

### With a test identifier

Pass `testID` to target the tooltip from automated tests. It maps to `data-testid` on web.

```tsx
import { Tooltip, Button } from '@sublime-ui/library';

export default function TestableTooltipExample() {
  return (
    <Tooltip label="Download the report" testID="download-tooltip">
      <Button icon="download" tone="primary">
        Download
      </Button>
    </Tooltip>
  );
}
```

## Props

### label

**Type:** `string`

**Default:** —

**Required:** Yes

The text shown when the wrapped element is hovered (web) or long-pressed (mobile).

### children

**Type:** `ReactElement`

**Default:** —

**Required:** Yes

The single element the tooltip wraps and attaches to. It must be exactly one React element — the trigger that the tooltip anchors to.

### testID

**Type:** `string`

**Default:** —

**Required:** No

A test identifier. On web it is applied as `data-testid` on the tooltip wrapper for use in automated tests.

## See also

- [Badge](/components/data-display/Badge) — a small pill for statuses and counts that a tooltip can further explain.
- [Avatar](/components/data-display/Avatar) — a circular image or initials marker, a natural element to wrap with a tooltip.
- [Icon](/components/data-display/Icon) — a single themed glyph that often pairs with a tooltip to describe its meaning.
