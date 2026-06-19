---
title: BottomNav
sidebar_position: 3
---

# BottomNav

A fixed bottom navigation bar that switches between the top-level sections of a mobile app.

Renders on web via MUI and on mobile via React Native Paper from a single import. BottomNav is a mobile-only component: on web it renders nothing (a stub), since bottom tab bars are a mobile interaction pattern. Use it inside your native app shell.

## Usage

```tsx
import { useState } from 'react';
import { BottomNav } from '@sublime-ui/library';
import type { NavItem } from '@sublime-ui/library';

export default function BottomNavExample() {
  const [active, setActive] = useState('home');
  const items: NavItem[] = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'search', label: 'Search', icon: 'magnify' },
    { key: 'profile', label: 'Profile', icon: 'account' },
  ];
  return <BottomNav items={items} activeKey={active} onSelect={setActive} />;
}
```

## Examples

### Tabs with badges

Any item can carry a `badge` (a string or number) rendered as a small counter on its icon, handy for unread counts or pending notifications.

```tsx
import { useState } from 'react';
import { BottomNav } from '@sublime-ui/library';
import type { NavItem } from '@sublime-ui/library';

export default function BottomNavBadgesExample() {
  const [active, setActive] = useState('inbox');
  const items: NavItem[] = [
    { key: 'inbox', label: 'Inbox', icon: 'inbox', badge: 12 },
    { key: 'chats', label: 'Chats', icon: 'chat', badge: '9+' },
    { key: 'alerts', label: 'Alerts', icon: 'bell', badge: 3 },
    { key: 'me', label: 'Me', icon: 'account' },
  ];
  return <BottomNav items={items} activeKey={active} onSelect={setActive} />;
}
```

### Driving the active screen

`activeKey` is controlled, so the same key you store in state can decide which screen to render above the bar.

```tsx
import { useState } from 'react';
import { View, Text } from 'react-native';
import { BottomNav } from '@sublime-ui/library';
import type { NavItem } from '@sublime-ui/library';

export default function BottomNavRoutedExample() {
  const [active, setActive] = useState('feed');
  const items: NavItem[] = [
    { key: 'feed', label: 'Feed', icon: 'view-dashboard' },
    { key: 'explore', label: 'Explore', icon: 'compass' },
    { key: 'settings', label: 'Settings', icon: 'cog' },
  ];
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Current screen: {active}</Text>
      </View>
      <BottomNav items={items} activeKey={active} onSelect={setActive} />
    </View>
  );
}
```

### Reacting to selection

The `onSelect` callback receives the key of the tapped item. Use it to run side effects, such as analytics, alongside updating state.

```tsx
import { useState } from 'react';
import { BottomNav } from '@sublime-ui/library';
import type { NavItem } from '@sublime-ui/library';

export default function BottomNavOnSelectExample() {
  const [active, setActive] = useState('library');
  const items: NavItem[] = [
    { key: 'library', label: 'Library', icon: 'bookshelf' },
    { key: 'discover', label: 'Discover', icon: 'star' },
    { key: 'downloads', label: 'Downloads', icon: 'download' },
  ];
  const handleSelect = (key: string) => {
    console.log('Navigated to', key);
    setActive(key);
  };
  return <BottomNav items={items} activeKey={active} onSelect={handleSelect} />;
}
```

### Tagged for testing

Pass `testID` to expose the bar (and each item) to your test runner. Items receive a derived id of the form `<testID>-<itemKey>`.

```tsx
import { useState } from 'react';
import { BottomNav } from '@sublime-ui/library';
import type { NavItem } from '@sublime-ui/library';

export default function BottomNavTestIDExample() {
  const [active, setActive] = useState('orders');
  const items: NavItem[] = [
    { key: 'orders', label: 'Orders', icon: 'receipt' },
    { key: 'cart', label: 'Cart', icon: 'cart', badge: 2 },
    { key: 'account', label: 'Account', icon: 'account-circle' },
  ];
  return (
    <BottomNav
      items={items}
      activeKey={active}
      onSelect={setActive}
      testID="main-bottom-nav"
    />
  );
}
```

## Props

### items

**Type:** [`NavItem`](/components/reference/shared-types)`[]`
**Default:** —
**Required:** Yes

The tabs to render, left to right. Each `NavItem` has a unique `key`, a `label`, an `icon` (a Material Community Icons name), and an optional `badge` (string or number) shown as a counter on the icon.

### activeKey

**Type:** `string`
**Default:** —
**Required:** Yes

The `key` of the currently selected item. BottomNav is controlled, so the matching tab is highlighted based on this value.

### onSelect

**Type:** `(key: string) => void`
**Default:** —
**Required:** Yes

Called with the tapped item's `key`. Update your active state here, and run any navigation side effects.

### testID

**Type:** `string`
**Default:** —
**Required:** No

Test identifier forwarded to the bar. Each item also gets a derived `` `${testID}-${item.key}` `` id (falling back to `bottomnav` when omitted) for use in automated tests.

## See also

- [AppBar](/components/bars-nav/AppBar)
- [GlassAppBar](/components/bars-nav/GlassAppBar)
- [Drawer](/components/layout/Drawer)
