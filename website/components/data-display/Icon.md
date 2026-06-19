---
title: Icon
sidebar_position: 4
---

# Icon

A single glyph drawn from a named icon set, sized and tinted from your theme tokens.

Renders on web via MUI (Material Icons) and on mobile via React Native Paper from a single import.

## Usage

```tsx
import { Icon } from '@sublime-ui/library';

export default function IconExample() {
  return <Icon name="home" />;
}
```

## Examples

### Named sizes

`size` accepts a shared `Size` (`'sm' | 'md' | 'lg'`), which resolves to your typography scale. When omitted it defaults to `'md'`.

```tsx
import { Icon } from '@sublime-ui/library';

export default function IconSizesExample() {
  return (
    <>
      <Icon name="favorite" size="sm" />
      <Icon name="favorite" size="md" />
      <Icon name="favorite" size="lg" />
    </>
  );
}
```

### Exact pixel size

Pass a raw `number` to `size` when you need an exact pixel dimension instead of a t-shirt size.

```tsx
import { Icon } from '@sublime-ui/library';

export default function IconPixelSizeExample() {
  return (
    <>
      <Icon name="settings" size={16} />
      <Icon name="settings" size={32} />
      <Icon name="settings" size={48} />
    </>
  );
}
```

### Tinting with theme tokens

`color` accepts any color token key (for example `primary`, `success`, `danger`), and resolves to the matching token for the active theme.

```tsx
import { Icon } from '@sublime-ui/library';

export default function IconTokenColorExample() {
  return (
    <>
      <Icon name="check_circle" color="success" />
      <Icon name="error" color="danger" />
      <Icon name="info" color="info" />
      <Icon name="warning" color="warning" />
      <Icon name="star" color="primary" />
    </>
  );
}
```

### Custom color string

Any value that is not a token key is passed through verbatim, so you can supply a raw CSS color string.

```tsx
import { Icon } from '@sublime-ui/library';

export default function IconCustomColorExample() {
  return (
    <>
      <Icon name="palette" color="#9333ea" />
      <Icon name="palette" color="rgb(13,148,136)" />
    </>
  );
}
```

### Custom glyph node (web)

On web you can pass your own `node` instead of a Material Icons name — `name` still applies as a fallback label. The custom node inherits the resolved `size` and `color`. On mobile only `name` is rendered.

```tsx
import { Icon } from '@sublime-ui/library';

export default function IconCustomNodeExample() {
  return (
    <Icon
      name="bolt"
      size="lg"
      color="primary"
      node={
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
      }
    />
  );
}
```

### Inside a labelled row

Icons are commonly paired with text. Tag the icon with a `testID` so it can be targeted in automated tests.

```tsx
import { Icon, Text } from '@sublime-ui/library';

export default function IconWithLabelExample() {
  return (
    <>
      <Icon name="notifications" size="md" color="primary" testID="bell-icon" />
      <Text>3 new notifications</Text>
    </>
  );
}
```

## Props

### name

**Type:** `string`
**Default:** —
**Required:** Yes

The icon identifier. On web this is a Material Icons ligature name (for example `"home"`); on mobile it is the icon name resolved by React Native Paper. When a `node` is supplied on web, `name` is still used as a fallback.

### node

**Type:** `ReactNode`
**Default:** —
**Required:** No

A custom element to render in place of the named glyph, inheriting the resolved `size` and `color`. Web only — this prop is ignored on mobile, which always renders `name`.

### size

**Type:** `number | `[`Size`](/components/reference/shared-types)
**Default:** `'md'`
**Required:** No

The icon size. Pass a shared `Size` (`'sm' | 'md' | 'lg'`) to use your typography scale, or a raw `number` for an exact pixel dimension.

### color

**Type:** `keyof ColorTokens | (string & {})`
**Default:** —
**Required:** No

The icon color. A color token key (such as `primary`, `success`, `danger`) resolves to the matching theme token; any other string is passed through as a raw CSS/native color. When omitted, the icon inherits the surrounding text color.

### testID

**Type:** `string`
**Default:** —
**Required:** No

Test identifier forwarded to the rendered element for use in automated tests.

## See also

- [Avatar](/components/data-display/Avatar)
- [Badge](/components/data-display/Badge)
- [Text](/components/data-display/Text)
