---
title: Dialog
sidebar_position: 2
---

# Dialog

A modal overlay for focused tasks and decisions — confirmations, short forms, or anything that should interrupt the page until the user responds. It dims the surrounding UI, takes focus, and dismisses on backdrop press or the built-in close affordance.

Renders on web via MUI (`Dialog`) and on mobile via React Native Paper (`Portal` + `Dialog`) from a single import. The API is identical on both platforms; the only difference is the rendering primitive underneath.

## Usage

```tsx
import { useState } from 'react';
import { Button, Dialog } from '@sublime-ui/library';

export default function DialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button tone="primary" onPress={() => setOpen(true)}>
        Open dialog
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete project"
        actions={
          <>
            <Button variant="ghost" onPress={() => setOpen(false)}>
              Cancel
            </Button>
            <Button tone="danger" onPress={() => setOpen(false)}>
              Delete
            </Button>
          </>
        }
      >
        This action permanently removes the project and all of its files.
      </Dialog>
    </>
  );
}
```

## Examples

### Confirmation dialog

The most common pattern: a title, a short explanatory body, and a pair of actions where the destructive choice carries the `danger` tone.

```tsx
import { useState } from 'react';
import { Button, Dialog } from '@sublime-ui/library';

export default function DialogConfirmExample() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button tone="danger" onPress={() => setOpen(true)}>
        Remove member
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Remove member"
        actions={
          <>
            <Button variant="ghost" onPress={() => setOpen(false)}>
              Keep
            </Button>
            <Button tone="danger" onPress={() => setOpen(false)}>
              Remove
            </Button>
          </>
        }
      >
        Sofia will lose access to this workspace immediately. You can re-invite
        her at any time.
      </Dialog>
    </>
  );
}
```

### Titleless dialog

The `title` prop is optional. Omit it for a bare-bones dialog whose body carries its own heading or messaging — useful for full-bleed content or custom layouts.

```tsx
import { useState } from 'react';
import { Button, Dialog, Text } from '@sublime-ui/library';

export default function DialogNoTitleExample() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onPress={() => setOpen(true)}>What's new</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        actions={
          <Button tone="primary" onPress={() => setOpen(false)}>
            Got it
          </Button>
        }
      >
        <Text variant="title">Release 2.4</Text>
        <Text>Faster sync, a redesigned inbox, and dark-mode tweaks.</Text>
      </Dialog>
    </>
  );
}
```

### Dialog without actions

When `actions` is omitted no footer renders. The dialog can still be dismissed by pressing the backdrop or the close button in the title bar — handy for purely informational overlays.

```tsx
import { useState } from 'react';
import { Button, Dialog } from '@sublime-ui/library';

export default function DialogNoActionsExample() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onPress={() => setOpen(true)}>About</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="About Sublime">
        Sublime is a cross-platform component library that renders on web and
        mobile from one import.
      </Dialog>
    </>
  );
}
```

### Form inside a dialog

`children` accepts any node, so a dialog can host a small form. Wire the inputs to state and confirm from the footer actions.

```tsx
import { useState } from 'react';
import { Button, Dialog, Input } from '@sublime-ui/library';

export default function DialogFormExample() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const save = () => {
    console.log('renamed to', name);
    setOpen(false);
  };

  return (
    <>
      <Button onPress={() => setOpen(true)}>Rename</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Rename board"
        actions={
          <>
            <Button variant="ghost" onPress={() => setOpen(false)}>
              Cancel
            </Button>
            <Button tone="primary" onPress={save}>
              Save
            </Button>
          </>
        }
      >
        <Input label="Board name" value={name} onChangeText={setName} />
      </Dialog>
    </>
  );
}
```

### A single dismiss action

A one-button footer is the idiomatic shape for an acknowledgement dialog. The same `onClose` handler powers both the button and the backdrop dismissal.

```tsx
import { useState } from 'react';
import { Button, Dialog } from '@sublime-ui/library';

export default function DialogAcknowledgeExample() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <Button tone="success" onPress={() => setOpen(true)}>
        Finish setup
      </Button>
      <Dialog
        open={open}
        onClose={close}
        title="You're all set"
        actions={
          <Button tone="primary" onPress={close}>
            Done
          </Button>
        }
      >
        Your account is ready. We've sent a confirmation email to get you
        started.
      </Dialog>
    </>
  );
}
```

### Tagged for testing

Pass `testID` to target the dialog in tests. On web it lands as `data-testid`; on mobile it is forwarded as React Native's `testID`.

```tsx
import { useState } from 'react';
import { Button, Dialog } from '@sublime-ui/library';

export default function DialogTestIdExample() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onPress={() => setOpen(true)}>Open</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Connection lost"
        testID="connection-dialog"
      >
        We couldn't reach the server. Check your network and try again.
      </Dialog>
    </>
  );
}
```

## Props

### open

**Type:** `boolean`

**Default:** —

**Required:** Yes

Controls visibility. When `true` the dialog and its backdrop are shown; when `false` it is hidden. The Dialog is fully controlled — you own this state.

### onClose

**Type:** `() => void`

**Default:** —

**Required:** Yes

Called when the user requests dismissal — pressing the backdrop, the title-bar close button (web), or an outside tap (mobile `onDismiss`). Typically flips `open` back to `false`.

### title

**Type:** `string`

**Default:** —

**Required:** No

Optional heading rendered in the dialog's title bar. On web, supplying a title also adds a close (✕) button to the top-right of the bar. Omit it for a header-less dialog.

### children

**Type:** `ReactNode`

**Default:** —

**Required:** Yes

The dialog body. Accepts any node — text, form fields, or arbitrary layout. On mobile a plain string child is automatically wrapped in a `Text` element.

### actions

**Type:** `ReactNode`

**Default:** —

**Required:** No

Optional footer content, usually one or more `Button`s. When omitted, no footer (action bar) is rendered.

### testID

**Type:** `string`

**Default:** —

**Required:** No

Test identifier, surfaced as `data-testid` on web and `testID` on mobile.

## See also

- [Banner](/components/feedback/Banner) — an inline, non-modal message for persistent page-level notices.
- [Tooltip](/components/data-display/Tooltip) — a lightweight transient hint shown on hover or focus.
- [Spinner](/components/feedback/Spinner) — a loading indicator for the in-progress work a dialog might trigger.
