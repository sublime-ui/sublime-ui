---
title: Input
sidebar_position: 2
---

# Input

A single- or multi-line text field for collecting typed user input, with an optional label, placeholder, error message, and password masking.

Renders on web via MUI's `TextField` and on mobile via React Native Paper's `TextInput`, all from a single import. On both platforms the field uses an outlined style. The only platform difference worth noting: the error message is rendered as MUI helper text on web and as a Paper `HelperText` element on mobile — the API you write is identical.

## Usage

```tsx
import { useState } from 'react';
import { Input } from '@sublime-ui/library';

export default function InputExample() {
  const [email, setEmail] = useState('');

  return (
    <Input
      label="Email address"
      placeholder="you@company.com"
      value={email}
      onChangeText={setEmail}
    />
  );
}
```

## Examples

### Controlled value

The Input is fully controlled: pass the current `value` and update it from `onChangeText`.

```tsx
import { useState } from 'react';
import { Input } from '@sublime-ui/library';

export default function ControlledInputExample() {
  const [name, setName] = useState('Ada Lovelace');

  return (
    <Input
      label="Full name"
      value={name}
      onChangeText={setName}
    />
  );
}
```

### With a placeholder

Use `placeholder` to show hint text before the user types anything.

```tsx
import { useState } from 'react';
import { Input } from '@sublime-ui/library';

export default function PlaceholderInputExample() {
  const [search, setSearch] = useState('');

  return (
    <Input
      placeholder="Search invoices…"
      value={search}
      onChangeText={setSearch}
    />
  );
}
```

### Validation error

Pass a non-empty `error` string to put the field into its error state and display the message beneath it.

```tsx
import { useState } from 'react';
import { Input } from '@sublime-ui/library';

export default function ErrorInputExample() {
  const [email, setEmail] = useState('not-an-email');
  const error = email.includes('@') ? undefined : 'Enter a valid email address';

  return (
    <Input
      label="Email address"
      value={email}
      onChangeText={setEmail}
      error={error}
    />
  );
}
```

### Password entry

Set `secureTextEntry` to mask the characters as the user types.

```tsx
import { useState } from 'react';
import { Input } from '@sublime-ui/library';

export default function PasswordInputExample() {
  const [password, setPassword] = useState('');

  return (
    <Input
      label="Password"
      placeholder="Enter your password"
      value={password}
      onChangeText={setPassword}
      secureTextEntry
    />
  );
}
```

### Multiline text area

Set `multiline` to let the field grow for longer-form content such as notes or descriptions.

```tsx
import { useState } from 'react';
import { Input } from '@sublime-ui/library';

export default function MultilineInputExample() {
  const [notes, setNotes] = useState('');

  return (
    <Input
      label="Delivery notes"
      placeholder="Leave the parcel with the concierge…"
      value={notes}
      onChangeText={setNotes}
      multiline
    />
  );
}
```

### Disabled

Set `disabled` to make the field read-only and visually muted.

```tsx
import { Input } from '@sublime-ui/library';

export default function DisabledInputExample() {
  return (
    <Input
      label="Account ID"
      value="ACC-100294"
      onChangeText={() => {}}
      disabled
    />
  );
}
```

### Test identifier

Pass `testID` to target the field from web (`data-testid`) or native test queries.

```tsx
import { useState } from 'react';
import { Input } from '@sublime-ui/library';

export default function TestIDInputExample() {
  const [coupon, setCoupon] = useState('');

  return (
    <Input
      label="Coupon code"
      value={coupon}
      onChangeText={setCoupon}
      testID="checkout-coupon-input"
    />
  );
}
```

## Props

### value

**Type:** `string`
**Default:** —
**Required:** Yes

The current text shown in the field. The Input is controlled, so this should come from your component's state.

### onChangeText

**Type:** `(text: string) => void`
**Default:** —
**Required:** Yes

Called with the new text whenever the user edits the field. Use it to update the `value` you pass back in.

### label

**Type:** `string`
**Default:** —
**Required:** No

A floating label rendered above or inside the field to describe what the user should enter.

### placeholder

**Type:** `string`
**Default:** —
**Required:** No

Hint text shown inside the field while it is empty.

### error

**Type:** `string`
**Default:** —
**Required:** No

When set to a non-empty string, the field switches to its error styling and displays this message beneath it. Leave it `undefined` when the value is valid.

### disabled

**Type:** `boolean`
**Default:** `false`
**Required:** No

When `true`, the field is non-interactive and visually muted.

### secureTextEntry

**Type:** `boolean`
**Default:** `false`
**Required:** No

When `true`, the entered characters are masked (rendered as a password field on web).

### multiline

**Type:** `boolean`
**Default:** `false`
**Required:** No

When `true`, the field accepts and grows for multi-line text.

### testID

**Type:** `string`
**Default:** —
**Required:** No

An identifier for tests. Applied as `data-testid` on web and `testID` on native.

## See also

- [Button](/components/inputs/Button)
- [Select](/components/inputs/Select)
- [Checkbox](/components/inputs/Checkbox)
