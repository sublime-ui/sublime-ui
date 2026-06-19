---
title: Banner
sidebar_position: 1
---

# Banner

A prominent, inline message that communicates a contextual status — a success, a warning, an error, or a piece of information — directly within the page flow.

Renders on web via MUI (`Alert`) and on mobile via React Native Paper from a single import. On both platforms the `tone` resolves to the same soft-tinted background and foreground from your theme tokens, so a `tone="danger"` banner is the same red everywhere.

> Platform note: on web the optional `action` renders in MUI's trailing action slot and `onClose` shows a built-in dismiss button; on mobile the `action` renders below the message and `onClose` renders a Paper `IconButton` (a close icon) on the trailing edge.

## Usage

```tsx
import { Banner } from '@sublime-ui/library';

export default function BannerExample() {
  return (
    <Banner tone="info" title="Heads up">
      Your changes are saved automatically as you type.
    </Banner>
  );
}
```

## Examples

### Tones

`tone` sets the semantic color of the banner. The default is `info`.

```tsx
import { Banner } from '@sublime-ui/library';

export default function BannerTonesExample() {
  return (
    <>
      <Banner tone="info" title="Information">
        A new version of the dashboard is available.
      </Banner>
      <Banner tone="success" title="Saved">
        Your profile was updated successfully.
      </Banner>
      <Banner tone="warning" title="Storage almost full">
        You have used 92% of your available space.
      </Banner>
      <Banner tone="danger" title="Payment failed">
        We could not process your card ending in 4242.
      </Banner>
    </>
  );
}
```

### Title only vs. message only

`title` is optional — omit it to render a single line of body content.

```tsx
import { Banner } from '@sublime-ui/library';

export default function BannerNoTitleExample() {
  return (
    <Banner tone="neutral">
      You are viewing this workspace in read-only mode.
    </Banner>
  );
}
```

### Dismissible

Provide an `onClose` handler to make the banner dismissible. Track visibility in
local state and stop rendering it when the user closes it.

```tsx
import { useState } from 'react';
import { Banner } from '@sublime-ui/library';

export default function BannerDismissibleExample() {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return null;
  }

  return (
    <Banner
      tone="warning"
      title="Unsaved changes"
      onClose={() => setVisible(false)}
    >
      Leaving this page will discard your draft.
    </Banner>
  );
}
```

### With an action

Pass any node to `action` to offer the user a way to respond. Here we render a
`Button` so the action is consistent across web and mobile.

```tsx
import { Banner, Button } from '@sublime-ui/library';

export default function BannerActionExample() {
  return (
    <Banner
      tone="danger"
      title="Connection lost"
      action={
        <Button tone="danger" variant="soft" onPress={() => {}}>
          Retry
        </Button>
      }
    >
      We could not reach the server. Check your network and try again.
    </Banner>
  );
}
```

### Dismissible with an action

`onClose` and `action` can be combined — the banner shows the action and a close
affordance at the same time.

```tsx
import { useState } from 'react';
import { Banner, Button } from '@sublime-ui/library';

export default function BannerActionAndCloseExample() {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return null;
  }

  return (
    <Banner
      tone="info"
      title="Update available"
      onClose={() => setVisible(false)}
      action={
        <Button tone="primary" variant="soft" onPress={() => {}}>
          Reload
        </Button>
      }
    >
      Version 2.4 is ready to install.
    </Banner>
  );
}
```

### Rich children

`children` accepts any node, not just a string, so you can compose richer
content inside the banner body.

```tsx
import { Banner, Text } from '@sublime-ui/library';

export default function BannerRichChildrenExample() {
  return (
    <Banner tone="success" title="Deployment complete">
      <Text>
        Your site is live. It may take a few minutes for changes to propagate.
      </Text>
    </Banner>
  );
}
```

## Props

### tone

**Type:** [`Tone`](/components/reference/shared-types)
**Default:** `'info'`
**Required:** No

The semantic color role of the banner. Maps to your theme's soft background and
foreground tokens, so the same tone looks consistent on web and mobile.

### title

**Type:** `string`
**Default:** —
**Required:** No

An optional bold heading rendered above the message body.

### children

**Type:** `ReactNode`
**Default:** —
**Required:** Yes

The message body. Accepts plain text or any node; on mobile a string child is
wrapped in a Paper `Text` automatically.

### onClose

**Type:** `() => void`
**Default:** —
**Required:** No

Called when the user dismisses the banner. Providing this prop renders a close
affordance (a dismiss button on web, a close `IconButton` on mobile). The banner
does not hide itself — manage its visibility in your own state.

### action

**Type:** `ReactNode`
**Default:** —
**Required:** No

An optional node — typically a `Button` — offering the user a way to respond. It
renders in the trailing action slot on web and below the message on mobile.

### testID

**Type:** `string`
**Default:** —
**Required:** No

An identifier for finding the banner in tests. Maps to `data-testid` on web and
`testID` on mobile.

## See also

- [Spinner](/components/feedback/Spinner) — an inline activity indicator.
- [Dialog](/components/feedback/Dialog) — a modal for interruptive messages.
- [Tooltip](/components/data-display/Tooltip) — a transient hint on hover or focus.
