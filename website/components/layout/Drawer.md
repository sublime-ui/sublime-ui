---
title: Drawer
sidebar_position: 4
---

# Drawer

A vertical side-navigation panel that lists the app's top-level destinations and highlights the one currently active.

Drawer is a mobile-only component. It renders the full navigation panel on mobile via React Native Paper; on web it renders nothing (use a web layout shell for side navigation there), so it can be imported safely from shared cross-platform code.

## Usage

```tsx
import { useState } from 'react';
import { Drawer } from '@sublime-ui/library';
import type { NavItem } from '@sublime-ui/library';

export default function DrawerExample() {
  const items: NavItem[] = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'reports', label: 'Reports', icon: 'chart-line' },
    { key: 'settings', label: 'Settings', icon: 'cog' },
  ];
  const [active, setActive] = useState('home');

  return <Drawer items={items} activeKey={active} onSelect={setActive} />;
}
```

## Examples

### Items with notification badges

Any `NavItem` can carry a `badge` (string or number) that renders as a small counter pill on the right edge of the row.

```tsx
import { useState } from 'react';
import { Drawer } from '@sublime-ui/library';
import type { NavItem } from '@sublime-ui/library';

export default function DrawerWithBadgesExample() {
  const items: NavItem[] = [
    { key: 'inbox', label: 'Inbox', icon: 'inbox', badge: 12 },
    { key: 'drafts', label: 'Drafts', icon: 'file-document-edit', badge: 'NEW' },
    { key: 'archive', label: 'Archive', icon: 'archive' },
  ];
  const [active, setActive] = useState('inbox');

  return <Drawer items={items} activeKey={active} onSelect={setActive} />;
}
```

### With a header

Pass any React node as `header` to render a branded region above the navigation list, separated by a divider.

```tsx
import { useState } from 'react';
import { Drawer, Text } from '@sublime-ui/library';
import type { NavItem } from '@sublime-ui/library';

export default function DrawerWithHeaderExample() {
  const items: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', icon: 'view-dashboard' },
    { key: 'orders', label: 'Orders', icon: 'package-variant' },
    { key: 'customers', label: 'Customers', icon: 'account-group' },
  ];
  const [active, setActive] = useState('dashboard');

  return (
    <Drawer
      items={items}
      activeKey={active}
      onSelect={setActive}
      header={<Text variant="title">Acme Admin</Text>}
    />
  );
}
```

### With a footer

Use `footer` for persistent actions pinned to the bottom of the panel, such as a sign-out button.

```tsx
import { useState } from 'react';
import { Drawer, Button } from '@sublime-ui/library';
import type { NavItem } from '@sublime-ui/library';

export default function DrawerWithFooterExample() {
  const items: NavItem[] = [
    { key: 'projects', label: 'Projects', icon: 'folder-multiple' },
    { key: 'team', label: 'Team', icon: 'account-multiple' },
  ];
  const [active, setActive] = useState('projects');

  const signOut = () => {
    console.log('Signing out');
  };

  return (
    <Drawer
      items={items}
      activeKey={active}
      onSelect={setActive}
      footer={
        <Button variant="ghost" tone="danger" onPress={signOut}>
          Sign out
        </Button>
      }
    />
  );
}
```

### Full panel with header, footer, and badges

A complete navigation panel combining a branded header, badged items, and a footer action — the typical shape inside a mobile app shell.

```tsx
import { useState } from 'react';
import { Drawer, Text, Button } from '@sublime-ui/library';
import type { NavItem } from '@sublime-ui/library';

export default function FullDrawerExample() {
  const items: NavItem[] = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'messages', label: 'Messages', icon: 'message-text', badge: 3 },
    { key: 'billing', label: 'Billing', icon: 'credit-card' },
    { key: 'settings', label: 'Settings', icon: 'cog' },
  ];
  const [active, setActive] = useState('home');

  const openProfile = () => {
    console.log('Opening profile');
  };

  return (
    <Drawer
      items={items}
      activeKey={active}
      onSelect={setActive}
      testID="main-drawer"
      header={<Text variant="title">Field Service</Text>}
      footer={
        <Button variant="soft" tone="primary" onPress={openProfile}>
          My profile
        </Button>
      }
    />
  );
}
```

## Props

### items

**Type:** `NavItem[]`
**Default:** —
**Required:** Yes

The navigation destinations to render, in order. Each `NavItem` has a unique `key`, a `label`, an `icon` (a Material Community Icons name), and an optional `badge` (`string | number`).

### activeKey

**Type:** `string`
**Default:** —
**Required:** Yes

The `key` of the currently selected item. The matching row is highlighted with the primary soft background and emphasized text.

### onSelect

**Type:** `(key: string) => void`
**Default:** —
**Required:** Yes

Called with the `key` of an item when its row is pressed. Drive `activeKey` from this callback to update the selected destination.

### header

**Type:** `ReactNode`
**Default:** —
**Required:** No

Optional content rendered in a padded region above the navigation list, separated from it by a divider. Use it for branding or a workspace switcher.

### footer

**Type:** `ReactNode`
**Default:** —
**Required:** No

Optional content pinned below the navigation list, separated by a divider. Use it for persistent actions such as sign-out or a profile shortcut.

### testID

**Type:** `string`
**Default:** —
**Required:** No

Test identifier forwarded to the underlying panel. Each item row is additionally tagged as `` `${testID}-${item.key}` `` (falling back to `drawer` when `testID` is omitted) for use in automated tests.

## See also

- [BottomNav](/components/bars-nav/BottomNav) — a bottom tab bar for switching between a small number of top-level destinations.
- [AppBar](/components/bars-nav/AppBar) — the top application bar that pairs with a drawer for the screen title and actions.
- [GlassAppBar](/components/bars-nav/GlassAppBar) — a translucent variant of the app bar for immersive layouts.
