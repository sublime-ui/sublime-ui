---
title: Components
sidebar_position: 1
---

# Components

The Sublime UI component catalog. Every component is **cross-platform by
construction**: you import it once from a single package, and it renders as a
real [MUI](https://mui.com) component on the web and a real
[React Native Paper](https://callstack.github.io/react-native-paper/) component
on mobile. There is no custom re-implementation underneath — you get the native
look, feel, and accessibility of each platform's flagship library, driven by one
shared theme.

## One import, every platform

```tsx
import { Button, Card, Text } from '@sublime-ui/library';
```

| Platform | Renders as          |
| -------- | ------------------- |
| Web      | MUI                 |
| Mobile   | React Native Paper  |

The same props mean the same thing everywhere. Tone, variant, and size flow from
your tokens into the right primitive on each platform, so `tone="danger"` is the
same red whether the pixel is painted by MUI or by Paper.

## Component groups

Components are organized into the groups below. Each page documents the props,
shows copy-pasteable `tsx` examples, and deep-links to the shared prop types in
the [Reference](./reference/shared-types.md).

| Group                                    | What's in it                                                        |
| ---------------------------------------- | ------------------------------------------------------------------- |
| **Inputs & Forms**                       | Button, Input, Select, Checkbox, Switch, Fab — collect user input.  |
| **Layout**                               | Card, Surface, Divider — structure and elevate content.             |
| **Bars & Navigation**                    | AppBar, GlassAppBar, BottomNav, Drawer — move around the app.        |
| **Data Display**                         | Text, Icon, Avatar, Badge — present content and status.             |
| **Feedback**                             | Spinner, Dialog, Banner, Tooltip — communicate state to the user.   |
| [Reference](./reference/shared-types.md) | Shared prop unions (`Tone`, `Variant`, `Size`) used across the API. |

Use the sidebar on the left to jump into any group. Each group's landing page
lists its components; individual component pages land in a later phase.

## How to read a component page

Every per-component page follows the same shape:

- a one-line summary of what the component is for,
- the public props, with each shared union linking to the
  [Shared Types](./reference/shared-types.md) reference,
- runnable `tsx` snippets — these are type-checked in CI, so the examples on the
  page always compile against the current `@sublime-ui/library` types.
