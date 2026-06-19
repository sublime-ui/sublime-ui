---
title: Checkbox
sidebar_position: 4
---

# Checkbox

A controlled checkbox for capturing a single on/off choice, with an optional inline label.

Renders on web via MUI and on mobile via React Native Paper from a single import. The component is fully controlled: you own the `checked` state and update it from `onChange`. On mobile, an unlabeled checkbox renders as a standalone Paper checkbox, while passing a `label` renders a tappable `Checkbox.Item` row.

## Usage

```tsx
import { useState } from 'react';
import { Checkbox } from '@sublime-ui/library';

export default function CheckboxExample() {
  const [accepted, setAccepted] = useState(false);

  return (
    <Checkbox
      checked={accepted}
      onChange={setAccepted}
      label="I accept the terms and conditions"
    />
  );
}
```

## Examples

### Without a label

Omit `label` to render just the checkbox control, useful inside table rows or custom layouts.

```tsx
import { useState } from 'react';
import { Checkbox } from '@sublime-ui/library';

export default function CheckboxNoLabelExample() {
  const [selected, setSelected] = useState(true);

  return <Checkbox checked={selected} onChange={setSelected} />;
}
```

### Tones

Set `tone` to color the checked state. Every tone from the shared palette is supported.

```tsx
import { useState } from 'react';
import { Checkbox } from '@sublime-ui/library';

export default function CheckboxTonesExample() {
  const [values, setValues] = useState({
    primary: true,
    success: true,
    danger: true,
    warning: true,
    info: true,
    neutral: true,
  });

  const toggle = (key: keyof typeof values) => (checked: boolean) =>
    setValues((prev) => ({ ...prev, [key]: checked }));

  return (
    <>
      <Checkbox checked={values.primary} onChange={toggle('primary')} tone="primary" label="Primary" />
      <Checkbox checked={values.success} onChange={toggle('success')} tone="success" label="Success" />
      <Checkbox checked={values.danger} onChange={toggle('danger')} tone="danger" label="Danger" />
      <Checkbox checked={values.warning} onChange={toggle('warning')} tone="warning" label="Warning" />
      <Checkbox checked={values.info} onChange={toggle('info')} tone="info" label="Info" />
      <Checkbox checked={values.neutral} onChange={toggle('neutral')} tone="neutral" label="Neutral" />
    </>
  );
}
```

### Disabled

Use `disabled` to prevent interaction. Both the checked and unchecked states can be disabled.

```tsx
import { Checkbox } from '@sublime-ui/library';

export default function CheckboxDisabledExample() {
  const noop = (_checked: boolean) => {};

  return (
    <>
      <Checkbox checked onChange={noop} disabled label="Locked (checked)" />
      <Checkbox checked={false} onChange={noop} disabled label="Locked (unchecked)" />
    </>
  );
}
```

### A list of options

Because the component is controlled, a group of related options is just an array of checkbox states you update by key.

```tsx
import { useState } from 'react';
import { Checkbox } from '@sublime-ui/library';

export default function CheckboxGroupExample() {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });

  const set = (key: keyof typeof notifications) => (checked: boolean) =>
    setNotifications((prev) => ({ ...prev, [key]: checked }));

  return (
    <>
      <Checkbox checked={notifications.email} onChange={set('email')} label="Email" />
      <Checkbox checked={notifications.sms} onChange={set('sms')} label="SMS" />
      <Checkbox checked={notifications.push} onChange={set('push')} label="Push notifications" />
    </>
  );
}
```

### With a test ID

Pass `testID` to target the checkbox from automated tests. It maps to `data-testid` on web and to Paper's `testID` on mobile.

```tsx
import { useState } from 'react';
import { Checkbox } from '@sublime-ui/library';

export default function CheckboxTestIdExample() {
  const [subscribed, setSubscribed] = useState(false);

  return (
    <Checkbox
      checked={subscribed}
      onChange={setSubscribed}
      label="Subscribe to the newsletter"
      testID="newsletter-checkbox"
    />
  );
}
```

## Props

### checked

**Type:** `boolean`
**Default:** —
**Required:** Yes

Whether the checkbox is currently checked. The component is controlled, so this value should come from your state.

### onChange

**Type:** `(checked: boolean) => void`
**Default:** —
**Required:** Yes

Called with the new checked value whenever the checkbox is toggled. Update your state here.

### label

**Type:** `string`
**Default:** —
**Required:** No

Optional label rendered beside the checkbox. When provided on mobile, the control renders as a tappable `Checkbox.Item` row; when omitted, only the checkbox control is rendered.

### disabled

**Type:** `boolean`
**Default:** `false`
**Required:** No

Disables interaction and visually dims the control.

### tone

**Type:** [`Tone`](/components/reference/shared-types)
**Default:** `'primary'`
**Required:** No

Color tone applied to the checked state.

### testID

**Type:** `string`
**Default:** —
**Required:** No

Test identifier for the control. Maps to `data-testid` on web and to React Native Paper's `testID` on mobile.

## See also

- [Switch](/components/inputs/Switch) — a toggle for a single boolean setting.
- [Select](/components/inputs/Select) — choose one option from a list.
- [Input](/components/inputs/Input) — free-form text entry.
