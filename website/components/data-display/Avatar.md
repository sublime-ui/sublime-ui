---
title: Avatar
sidebar_position: 1
---

# Avatar

A compact, circular representation of a user or entity that shows a profile image when one is available and falls back to initials derived from a label.

Renders on web via MUI and on mobile via React Native Paper from a single import.

## Usage

```tsx
import { Avatar } from '@sublime-ui/library';

export default function AvatarExample() {
  return <Avatar source="https://i.pravatar.cc/150?img=12" label="Ada Lovelace" />;
}
```

## Examples

### Image avatar

When `source` is provided the avatar displays that image. Pass `label` as well so the image still has accessible alt text.

```tsx
import { Avatar } from '@sublime-ui/library';

export default function ImageAvatarExample() {
  return <Avatar source="https://i.pravatar.cc/150?img=5" label="Grace Hopper" />;
}
```

### Initials fallback

Omit `source` to render a themed circle with initials. The initials are taken from the first letter of the first two words in `label`, so "Ada Lovelace" becomes "AL".

```tsx
import { Avatar } from '@sublime-ui/library';

export default function InitialsAvatarExample() {
  return <Avatar label="Ada Lovelace" />;
}
```

### Sizes

`size` accepts `sm`, `md` (the default), and `lg`, mapping to 28, 40, and 56 pixels respectively.

```tsx
import { Avatar } from '@sublime-ui/library';

export default function AvatarSizesExample() {
  return (
    <>
      <Avatar label="Ada Lovelace" size="sm" />
      <Avatar label="Ada Lovelace" size="md" />
      <Avatar label="Ada Lovelace" size="lg" />
    </>
  );
}
```

### A row of teammates

Avatars are commonly stacked together to represent a group. Each derives its own initials from its label.

```tsx
import { Avatar } from '@sublime-ui/library';

export default function TeamAvatarsExample() {
  const team = ['Ada Lovelace', 'Alan Turing', 'Katherine Johnson'];

  return (
    <>
      {team.map((name) => (
        <Avatar key={name} label={name} size="sm" />
      ))}
    </>
  );
}
```

### With a test identifier

Pass `testID` to target the avatar from automated tests. It maps to `data-testid` on web and `testID` on mobile.

```tsx
import { Avatar } from '@sublime-ui/library';

export default function TestableAvatarExample() {
  return (
    <Avatar
      source="https://i.pravatar.cc/150?img=8"
      label="Margaret Hamilton"
      size="lg"
      testID="profile-avatar"
    />
  );
}
```

## Props

### source

**Type:** `string`
**Default:** —
**Required:** No

Image URI to display. When present the avatar renders this image; when absent it falls back to initials derived from `label`.

### label

**Type:** `string`
**Default:** —
**Required:** No

Fallback text used to derive initials when no `source` is set. When a `source` is present, it is also used as the image's accessible alt text. Initials are the first letter of up to the first two words, uppercased.

### size

**Type:** [`Size`](/components/reference/shared-types)
**Default:** `'md'`
**Required:** No

The diameter of the avatar. `'sm'` is 28px, `'md'` is 40px, and `'lg'` is 56px.

### testID

**Type:** `string`
**Default:** —
**Required:** No

Test identifier forwarded to the underlying element — `data-testid` on web and `testID` on mobile — for use in automated tests.

## See also

- [Badge](/components/data-display/Badge) — a small status or count indicator often overlaid on an avatar.
- [Icon](/components/data-display/Icon) — a single themed glyph, useful as a placeholder when no image or label is available.
- [Card](/components/layout/Card) — a container that frequently pairs an avatar with a name and supporting text.
