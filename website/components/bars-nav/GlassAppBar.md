---
title: GlassAppBar
sidebar_position: 2
---

# GlassAppBar

A frosted, translucent top app bar for screens that overlay content beneath a blurred header — a title, optional subtitle, a back action, and trailing actions.

Renders on web via MUI and on mobile via React Native Paper from a single import.

On web the glass effect is produced with a `backdrop-filter` blur over a translucent background. On mobile the same translucency is applied via the Paper `Appbar.Header`; the platform does not blur underlying content, but the bar keeps the same layout, tokens, and props.

## Usage

```tsx
import { GlassAppBar } from '@sublime-ui/library';

export default function GlassAppBarExample() {
  return <GlassAppBar title="Inbox" />;
}
```

## Examples

### With a subtitle

Pass `subtitle` to add a secondary line beneath the title — useful for context like a folder name or unread count.

```tsx
import { GlassAppBar } from '@sublime-ui/library';

export default function GlassAppBarSubtitleExample() {
  return <GlassAppBar title="Inbox" subtitle="12 unread messages" />;
}
```

### With a back action

Provide `onBack` to render a leading back control. The handler runs when the user activates it.

```tsx
import { GlassAppBar } from '@sublime-ui/library';

export default function GlassAppBarBackExample() {
  const handleBack = () => {
    console.log('Navigate back');
  };
  return (
    <GlassAppBar
      title="Message detail"
      subtitle="From Amara Okafor"
      onBack={handleBack}
    />
  );
}
```

### With trailing actions

`actions` accepts any `ReactNode`, so you can place buttons or icons at the end of the bar.

```tsx
import { GlassAppBar, Button } from '@sublime-ui/library';

export default function GlassAppBarActionsExample() {
  return (
    <GlassAppBar
      title="Inbox"
      onBack={() => console.log('back')}
      actions={
        <Button tone="primary" variant="ghost" onPress={() => console.log('compose')}>
          Compose
        </Button>
      }
    />
  );
}
```

### Transparent over content

Set `transparent` to drop the glass background and let the bar float over the screen content behind it.

```tsx
import { GlassAppBar } from '@sublime-ui/library';

export default function GlassAppBarTransparentExample() {
  return <GlassAppBar title="Gallery" transparent onBack={() => console.log('back')} />;
}
```

### Full detail header

A common screen header: a back action, title and subtitle, plus a trailing action button.

```tsx
import { GlassAppBar, Button } from '@sublime-ui/library';

export default function GlassAppBarDetailExample() {
  const goBack = () => console.log('back');
  const archive = () => console.log('archived');
  return (
    <GlassAppBar
      title="Project Atlas"
      subtitle="Updated 2 hours ago"
      onBack={goBack}
      actions={
        <Button tone="neutral" variant="ghost" onPress={archive}>
          Archive
        </Button>
      }
      testID="atlas-header"
    />
  );
}
```

## Props

### title

**Type:** `string`
**Default:** —
**Required:** Yes

The primary heading shown in the bar. Long titles are truncated to a single line.

### subtitle

**Type:** `string`
**Default:** —
**Required:** No

Optional secondary line rendered beneath the title for supplementary context.

### onBack

**Type:** `() => void`
**Default:** —
**Required:** No

When provided, a leading back control is rendered and this handler is called when it is activated. Omit it to hide the back control.

### actions

**Type:** `ReactNode`
**Default:** —
**Required:** No

Trailing content placed at the end of the bar, such as action buttons or icons.

### transparent

**Type:** `boolean`
**Default:** `false`
**Required:** No

When `true`, the glass background is dropped so the bar floats over the content behind it.

### testID

**Type:** `string`
**Default:** —
**Required:** No

Test identifier forwarded to the underlying bar for use in automated tests.

## See also

- [AppBar](/components/bars-nav/AppBar)
- [BottomNav](/components/bars-nav/BottomNav)
- [Drawer](/components/layout/Drawer)
