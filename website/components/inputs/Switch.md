---
title: Switch
sidebar_position: 5
---

# Switch

A toggle control for flipping a single setting between on and off.

Renders on web via MUI and on mobile via React Native Paper from a single import.

## Usage

```tsx
import { useState } from 'react';
import { Switch } from '@sublime-ui/library';

export default function SwitchExample() {
  const [enabled, setEnabled] = useState(false);
  return (
    <Switch
      value={enabled}
      onValueChange={setEnabled}
      label="Enable notifications"
    />
  );
}
```

## Examples

### Without a label

Omit `label` to render just the toggle, for placing inside your own row layout.

```tsx
import { useState } from 'react';
import { Switch } from '@sublime-ui/library';

export default function BareSwitchExample() {
  const [on, setOn] = useState(true);
  return <Switch value={on} onValueChange={setOn} />;
}
```

### Tones

The `tone` prop colors the on state. Switch supports every shared tone.

```tsx
import { useState } from 'react';
import { Switch } from '@sublime-ui/library';

export default function SwitchTonesExample() {
  const [values, setValues] = useState({
    primary: true,
    success: true,
    danger: true,
    warning: true,
    info: true,
    neutral: true,
  });
  const set = (key: keyof typeof values) => (next: boolean) =>
    setValues((prev) => ({ ...prev, [key]: next }));
  return (
    <>
      <Switch
        value={values.primary}
        onValueChange={set('primary')}
        tone="primary"
        label="Primary"
      />
      <Switch
        value={values.success}
        onValueChange={set('success')}
        tone="success"
        label="Success"
      />
      <Switch
        value={values.danger}
        onValueChange={set('danger')}
        tone="danger"
        label="Danger"
      />
      <Switch
        value={values.warning}
        onValueChange={set('warning')}
        tone="warning"
        label="Warning"
      />
      <Switch
        value={values.info}
        onValueChange={set('info')}
        tone="info"
        label="Info"
      />
      <Switch
        value={values.neutral}
        onValueChange={set('neutral')}
        tone="neutral"
        label="Neutral"
      />
    </>
  );
}
```

### Disabled

Set `disabled` to prevent interaction while still reflecting the current value.

```tsx
import { Switch } from '@sublime-ui/library';

export default function DisabledSwitchExample() {
  const noop = (_value: boolean) => {};
  return (
    <>
      <Switch
        value={true}
        onValueChange={noop}
        disabled
        label="Locked on"
      />
      <Switch
        value={false}
        onValueChange={noop}
        disabled
        label="Locked off"
      />
    </>
  );
}
```

### Controlled setting row

A common pattern: keep the switch value in state and react to changes.

```tsx
import { useState } from 'react';
import { Switch } from '@sublime-ui/library';

export default function DarkModeSwitchExample() {
  const [darkMode, setDarkMode] = useState(false);
  return (
    <Switch
      value={darkMode}
      onValueChange={(next) => {
        setDarkMode(next);
        console.log(next ? 'Dark mode on' : 'Dark mode off');
      }}
      tone="info"
      label="Dark mode"
      testID="dark-mode-switch"
    />
  );
}
```

## Props

### value

**Type:** `boolean`
**Default:** —
**Required:** Yes

Whether the switch is on. Switch is a controlled component, so you supply the current value.

### onValueChange

**Type:** `(value: boolean) => void`
**Default:** —
**Required:** Yes

Called with the new value when the switch is toggled. Update your state here to keep the switch in sync.

### label

**Type:** `string`
**Default:** —
**Required:** No

Optional label rendered beside the switch. When omitted, only the toggle control is rendered.

### disabled

**Type:** `boolean`
**Default:** `false`
**Required:** No

Disables interaction. The switch still reflects its current `value` but cannot be toggled.

### tone

**Type:** [`Tone`](/components/reference/shared-types)
**Default:** `'primary'`
**Required:** No

Color tone applied to the on state.

### testID

**Type:** `string`
**Default:** —
**Required:** No

Test identifier forwarded to the underlying control for use in automated tests.

## See also

- [Checkbox](/components/inputs/Checkbox)
- [Input](/components/inputs/Input)
- [Select](/components/inputs/Select)
