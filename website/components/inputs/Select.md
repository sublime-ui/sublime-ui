---
title: Select
sidebar_position: 3
---

# Select

A labelled dropdown that lets the user pick one value from a list of options.

Renders on web via MUI (`Select` inside a `FormControl`) and on mobile via React Native Paper (a read-only `TextInput` anchoring a `Menu`) from a single import. On both platforms the open menu uses the theme's glass surface tokens, so it looks the same everywhere; the only behavioural difference is that the native menu manages its own open/closed state internally while the web control defers to the browser's native popover.

## Usage

```tsx
import { useState } from 'react';
import { Select } from '@sublime-ui/library';

export default function SelectExample() {
  const [country, setCountry] = useState('za');
  return (
    <Select
      label="Country"
      value={country}
      onChange={setCountry}
      options={[
        { value: 'za', label: 'South Africa' },
        { value: 'ke', label: 'Kenya' },
        { value: 'ng', label: 'Nigeria' },
        { value: 'eg', label: 'Egypt' },
      ]}
    />
  );
}
```

## Examples

### With a placeholder (no initial selection)

When `value` is the empty string, the placeholder is shown until the user picks an option.

```tsx
import { useState } from 'react';
import { Select } from '@sublime-ui/library';

export default function SelectPlaceholderExample() {
  const [role, setRole] = useState('');
  return (
    <Select
      label="Role"
      placeholder="Choose a role…"
      value={role}
      onChange={setRole}
      options={[
        { value: 'admin', label: 'Administrator' },
        { value: 'editor', label: 'Editor' },
        { value: 'viewer', label: 'Viewer' },
      ]}
    />
  );
}
```

### Without a label

Omit `label` for a bare control — handy inside a toolbar or a compact filter row.

```tsx
import { useState } from 'react';
import { Select } from '@sublime-ui/library';

export default function SelectNoLabelExample() {
  const [sort, setSort] = useState('newest');
  return (
    <Select
      value={sort}
      onChange={setSort}
      options={[
        { value: 'newest', label: 'Newest first' },
        { value: 'oldest', label: 'Oldest first' },
        { value: 'price', label: 'Price: low to high' },
      ]}
    />
  );
}
```

### Disabled

A `disabled` Select renders its current value but cannot be opened or changed.

```tsx
import { Select } from '@sublime-ui/library';

export default function SelectDisabledExample() {
  return (
    <Select
      label="Plan"
      disabled
      value="pro"
      onChange={() => {}}
      options={[
        { value: 'free', label: 'Free' },
        { value: 'pro', label: 'Pro' },
        { value: 'enterprise', label: 'Enterprise' },
      ]}
    />
  );
}
```

### Driven by external state

`Select` is fully controlled: render whatever your state holds, and reset or sync it from elsewhere in your app.

```tsx
import { useState } from 'react';
import { Select, Button } from '@sublime-ui/library';

export default function SelectControlledExample() {
  const [size, setSize] = useState('m');
  return (
    <>
      <Select
        label="T-shirt size"
        value={size}
        onChange={setSize}
        options={[
          { value: 's', label: 'Small' },
          { value: 'm', label: 'Medium' },
          { value: 'l', label: 'Large' },
          { value: 'xl', label: 'Extra Large' },
        ]}
      />
      <Button onPress={() => setSize('m')}>Reset to Medium</Button>
    </>
  );
}
```

### Tagged for testing

Pass `testID` to give the control a stable selector in your test suite (mapped to `data-testid` on web and `testID` on mobile).

```tsx
import { useState } from 'react';
import { Select } from '@sublime-ui/library';

export default function SelectTestIdExample() {
  const [currency, setCurrency] = useState('usd');
  return (
    <Select
      testID="currency-select"
      label="Currency"
      value={currency}
      onChange={setCurrency}
      options={[
        { value: 'usd', label: 'US Dollar' },
        { value: 'eur', label: 'Euro' },
        { value: 'zar', label: 'South African Rand' },
      ]}
    />
  );
}
```

## Props

### value

**Type:** `string`
**Default:** —
**Required:** Yes

The currently selected option's `value`. `Select` is a controlled component, so this must reflect your own state. Use the empty string (`''`) together with `placeholder` to represent "nothing selected yet".

### onChange

**Type:** `(value: string) => void`
**Default:** —
**Required:** Yes

Called with the newly chosen option's `value` whenever the user picks an item. Update your state from here to keep the control in sync.

### options

**Type:** `SelectOption[]` — each `{ value: string; label: string }`
**Default:** —
**Required:** Yes

The list of selectable items. `value` is the stable identifier passed to `onChange`; `label` is the human-readable text shown in the menu. On mobile, an empty `options` array renders a single disabled "No options" item.

### label

**Type:** `string`
**Default:** —
**Required:** No

The field label. On web it renders as a floating `InputLabel`; on mobile it is the outlined `TextInput` label. Omit it for a bare, label-less control.

### placeholder

**Type:** `string`
**Default:** —
**Required:** No

Text shown when no option is selected. On web, providing it enables `displayEmpty` and adds a disabled leading menu item; on mobile it is shown as the input's placeholder.

### disabled

**Type:** `boolean`
**Default:** `false`
**Required:** No

When `true`, the control is greyed out and cannot be opened or changed.

### testID

**Type:** `string`
**Default:** —
**Required:** No

A stable identifier for end-to-end and unit tests. Emitted as `data-testid` on web and as `testID` on mobile.

## See also

- [Input](/components/inputs/Input) — single-line free-text entry.
- [Checkbox](/components/inputs/Checkbox) — a single on/off choice.
- [Switch](/components/inputs/Switch) — a toggle for boolean settings.
