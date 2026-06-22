---
sidebar_position: 4
title: Running Your App
---

# Running Your App

One codebase, three targets. Each platform has its own dev loop, all driven by the
`sublime` CLI. Whenever something looks off, `sublime doctor` checks your
environment and platform toolchains.

## Web

The web target runs your `screens/web/` screens with the MUI theme generated from
your tokens, behind the `navigation.tsx` (react-router) output of `build:nav`.
Develop it with:

```bash
npm run dev:web        # → sublime dev:web
```

`sublime dev:web` compiles the navigation, starts the Vite dev server, and keeps
**watching the storybooks** — so any navigation change recompiles automatically
while the server runs. (The generated nav files are git-ignored build artifacts;
you no longer run `build:nav` by hand during development.)

## Mobile

Mobile runs your `screens/mobile/` screens with React Native + Paper.

Build an offline Android APK:

```bash
npx @sublime-ui/devkit build
```

`sublime build` produces an offline Android APK. To install and launch it on a
connected device, use `run`:

```bash
npx @sublime-ui/devkit run
```

`sublime run` installs the build and launches it on the device.

## Desktop

Desktop reuses your **web UI** inside an Electron shell (via Electron Forge) and
adds a typed native bridge for Node/OS capabilities. There are no separate desktop
screens.

Start the desktop app in development, with Forge and HMR:

```bash
npx @sublime-ui/devkit dev:desktop
```

`sublime dev:desktop` runs Forge start with hot module replacement, so edits to
your web screens reload live in the desktop window. Like `dev:web`, it also
recompiles navigation whenever a storybook changes. (Still aliased as
`desktop:dev`.)

Package the app for distribution:

```bash
npx @sublime-ui/devkit build:desktop
```

`sublime build:desktop` runs Forge make to produce Windows, macOS, and Linux
packages (a portable `.zip` on Windows/macOS, `.deb`/`.rpm` on Linux). To add a
Windows installer, see [Packaging](/docs/platforms/desktop/packaging#want-a-windows-installer).

### Calling native code

From any screen, reach a native service with `useNative` — it returns `null` on
plain web and a typed client on desktop, so the same screen code works on both:

```ts
import { useNative } from '@sublime-ui/desktop';
import type { Printer } from '../../native/printer.service';

const printer = useNative<Printer>('printer'); // null on plain web
await printer?.print(receipt);
```

Because the renderer imports only `import type` of a service, Node dependencies
never leak into the web bundle. Built-in services include `fs`, `dialog`,
`shell`, `clipboard`, and `notifications`.

## The loop at a glance

| Platform | Develop | Build / Package |
| --- | --- | --- |
| Web | `sublime dev:web` | `sublime build:web` (static site) |
| Mobile | `sublime run` | `sublime build` (offline Android APK) |
| Desktop | `sublime dev:desktop` | `sublime build:desktop` |

The dev commands recompile navigation on every storybook change, so you rarely
touch `build:nav` directly. Reach for `sublime doctor` whenever a toolchain needs
a sanity check.
