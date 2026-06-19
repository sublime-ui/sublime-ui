---
title: Spinner
sidebar_position: 3
---

# Spinner

An indeterminate loading indicator — a small spinning ring you show while content, a request, or an action is still in flight and you can't yet report progress as a percentage.

Renders on web via MUI (`CircularProgress`) and on mobile via React Native Paper (`ActivityIndicator`) from a single import. The API is identical on both platforms; the only difference is the rendering primitive underneath.

## Usage

```tsx
import { Spinner } from '@sublime-ui/library';

export default function SpinnerExample() {
  return <Spinner />;
}
```

## Examples

### Sizes

The `size` prop scales the indicator using the shared t-shirt sizes. On web `sm`, `md`, and `lg` map to 16px, 24px, and 40px; on mobile Paper exposes two physical sizes, so `sm` and `md` both render `small` while `lg` renders `large`.

```tsx
import { Spinner } from '@sublime-ui/library';

export default function SpinnerSizesExample() {
  return (
    <>
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </>
  );
}
```

### Tones

The `tone` prop maps the spinner onto the theme's semantic colors. Use it to match the surrounding context — `primary` for the default action color, `danger` while retrying a failed request, `neutral` for quiet inline loading.

```tsx
import { Spinner } from '@sublime-ui/library';

export default function SpinnerTonesExample() {
  return (
    <>
      <Spinner tone="primary" />
      <Spinner tone="success" />
      <Spinner tone="danger" />
      <Spinner tone="warning" />
      <Spinner tone="info" />
      <Spinner tone="neutral" />
    </>
  );
}
```

### Inline loading label

A spinner reads well beside a short status line. Pair it with `Text` to explain what the user is waiting for.

```tsx
import { Spinner, Text } from '@sublime-ui/library';

export default function SpinnerInlineExample() {
  return (
    <>
      <Spinner size="sm" tone="neutral" />
      <Text>Loading your dashboard…</Text>
    </>
  );
}
```

### Conditional loading state

Because `Spinner` is just a component, it composes naturally with React state — render it while a request is pending and swap in the result when it resolves.

```tsx
import { useState } from 'react';
import { Spinner, Text, Button } from '@sublime-ui/library';

export default function SpinnerLoadingExample() {
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <>
      <Button onPress={handleSave}>Save changes</Button>
      {loading ? <Spinner size="sm" /> : <Text>Up to date</Text>}
    </>
  );
}
```

### Inside a button

A small neutral spinner sits well inside a button while its action is running, signalling the press was registered.

```tsx
import { useState } from 'react';
import { Spinner, Button } from '@sublime-ui/library';

export default function SpinnerInButtonExample() {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => setSubmitting(false), 1500);
  };

  return (
    <Button onPress={handleSubmit} disabled={submitting}>
      {submitting ? <Spinner size="sm" tone="neutral" /> : 'Submit'}
    </Button>
  );
}
```

### Full-page loader

A larger spinner centered on its own works as a first-paint loader for a screen or route.

```tsx
import { Spinner, Text } from '@sublime-ui/library';

export default function SpinnerFullPageExample() {
  return (
    <>
      <Spinner size="lg" tone="primary" />
      <Text>Preparing your workspace…</Text>
    </>
  );
}
```

## Props

### size

**Type:** [`Size`](/components/reference/shared-types)

**Default:** `'md'`

**Required:** No

The overall scale of the indicator — one of `sm`, `md`, or `lg`. On web these map to 16px, 24px, and 40px; on mobile, where React Native Paper offers only two physical sizes, `sm` and `md` both render as `small` and `lg` renders as `large`.

### tone

**Type:** [`Tone`](/components/reference/shared-types)

**Default:** `'primary'`

**Required:** No

The semantic color of the spinner — one of `primary`, `success`, `danger`, `warning`, `info`, or `neutral`. It resolves to the same color from your theme tokens on both web and mobile.

### testID

**Type:** `string`

**Default:** —

**Required:** No

A test identifier. On web it is applied as `data-testid`; on mobile it is passed through as React Native's `testID`.

## See also

- [Dialog](/components/feedback/Dialog) — a modal surface that often hosts a spinner while its contents load.
- [Banner](/components/feedback/Banner) — a prominent inline message for surfacing the result once loading completes.
- [Button](/components/inputs/Button) — pairs with a spinner to show a pending state while its action runs.
