---
title: Card
sidebar_position: 1
---

# Card

A glass-surfaced container that groups related content into a single, elevated block — optionally tappable as a whole.

Renders on web via MUI and on mobile via React Native Paper from a single import.

## Usage

```tsx
import { Card, Text } from '@sublime-ui/library';

export default function CardExample() {
  return (
    <Card>
      <Text variant="subtitle">Monthly summary</Text>
      <Text>You spent $1,240 across 18 transactions this month.</Text>
    </Card>
  );
}
```

## Examples

### Tappable card

Pass `onPress` to make the whole card act as a single touch target — the content area becomes a pressable surface on both platforms.

```tsx
import { Card, Text } from '@sublime-ui/library';

export default function TappableCardExample() {
  const openInvoice = () => {
    console.log('Opening invoice #4821');
  };

  return (
    <Card onPress={openInvoice}>
      <Text variant="subtitle">Invoice #4821</Text>
      <Text tone="success">Paid — $320.00</Text>
    </Card>
  );
}
```

### Edge-to-edge content (no padding)

Set `padded={false}` when the card hosts media or a list that should run to the card's edges.

```tsx
import { Card, Text } from '@sublime-ui/library';

export default function FlushCardExample() {
  return (
    <Card padded={false}>
      <Text variant="caption">Cover image and full-bleed content go here.</Text>
    </Card>
  );
}
```

### Composing cards with other components

`children` accepts any React content, so cards commonly wrap a heading, body text, and an action.

```tsx
import { Card, Text, Button } from '@sublime-ui/library';

export default function ComposedCardExample() {
  const upgrade = () => {
    console.log('Upgrade flow started');
  };

  return (
    <Card>
      <Text variant="title">Upgrade to Pro</Text>
      <Text tone="neutral">Unlock unlimited projects and priority support.</Text>
      <Button variant="solid" tone="primary" onPress={upgrade}>
        Upgrade now
      </Button>
    </Card>
  );
}
```

### Selectable list of cards

A common pattern is rendering several tappable cards driven by state.

```tsx
import { useState } from 'react';
import { Card, Text } from '@sublime-ui/library';

export default function CardListExample() {
  const plans = [
    { id: 'starter', name: 'Starter', price: '$0/mo' },
    { id: 'team', name: 'Team', price: '$24/mo' },
    { id: 'scale', name: 'Scale', price: '$80/mo' },
  ];
  const [selected, setSelected] = useState<string>('team');

  return (
    <>
      {plans.map((plan) => (
        <Card key={plan.id} onPress={() => setSelected(plan.id)} testID={`plan-${plan.id}`}>
          <Text variant="subtitle">{plan.name}</Text>
          <Text tone={selected === plan.id ? 'primary' : 'neutral'}>{plan.price}</Text>
        </Card>
      ))}
    </>
  );
}
```

## Props

### children

**Type:** `ReactNode`
**Default:** —
**Required:** Yes

The content rendered inside the card. Accepts any valid React node — text, other Sublime components, or arbitrary markup.

### onPress

**Type:** `() => void`
**Default:** —
**Required:** No

Called when the card is pressed. Providing this turns the entire card into a single tappable surface (a `CardActionArea` on web, a `Pressable` on mobile). Omit it for a static, non-interactive card.

### padded

**Type:** `boolean`
**Default:** `true`
**Required:** No

Whether the card applies its standard internal spacing. Set to `false` for edge-to-edge content such as media or full-width lists.

### testID

**Type:** `string`
**Default:** —
**Required:** No

Test identifier forwarded to the underlying element — `data-testid` on web and `testID` on mobile — for use in automated tests.

## See also

- [Surface](/components/layout/Surface) — a lower-level elevated container with configurable elevation levels.
- [Divider](/components/layout/Divider) — a thin rule for separating content within or between cards.
- [Text](/components/data-display/Text) — typographic primitive commonly composed inside cards.
