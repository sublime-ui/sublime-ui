---
sidebar_position: 3
title: Packaging
---

# Packaging

Desktop packaging is driven by the `sublime` CLI and powered by **Electron Forge**.

```bash
sublime dev:desktop     # Forge start — Webpack dev server + HMR + live navigation recompile
sublime build:desktop   # Forge make — produces platform packages
```

`dev:desktop` compiles the navigation layer on startup and keeps watching the
storybooks, recompiling on every change (the generated nav files are git-ignored).
Both commands keep their old names — `desktop:dev` / `desktop:build` — as aliases.

## What `build:desktop` produces

Electron Forge **makers** generate the packages. The default makers favour a fast,
reliable build on every OS:

| Platform | Maker | Output |
| --- | --- | --- |
| Windows | `MakerZIP` | `.zip` (portable, unzip-and-run) |
| macOS | `MakerZIP` | `.zip` |
| Linux | `MakerDeb`, `MakerRpm` | `.deb`, `.rpm` |

The packages are copied into **`dist/desktop/`** at your project root, alongside the
other platforms' outputs (`dist/web`, `dist/mobile`) — see
[Where your builds go](/docs/reference/cli#where-your-builds-go).

### Want a Windows installer?

ZIP is the default on Windows because the Squirrel installer maker is slow and can
appear to **hang** on large or unsigned apps. To ship a Windows auto-update
installer, opt in: install the maker and add it to `desktop/forge.config.ts`
(the file ships with commented instructions):

```bash
npm i -D @electron-forge/maker-squirrel
```

```ts
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
// …
makers: [
  new MakerSquirrel({}),   // .exe installer (expect a multi-minute pack step)
  new MakerZIP({}),
  new MakerRpm({}),
  new MakerDeb({}),
],
```

Two Forge plugins harden and complete the build:

- **`plugin-auto-unpack-natives`** unpacks native Node modules from the asar — so a
  `defineNative` service that depends on real native modules (SQLite, serialport,
  escpos) packages correctly.
- **`plugin-fuses`** flips Electron security fuses at package time:
  `OnlyLoadAppFromAsar`, asar integrity validation, and `RunAsNode: false`.

## Where the config lives

The Forge config and webpack configs live **in your app's `desktop/` folder**,
where Forge expects them — not hidden in the framework:

```
desktop/
  forge.config.ts                 # makers + WebpackPlugin + Fuses + AutoUnpackNatives
  webpack.main.config.ts
  webpack.renderer.config.ts
  src/
    main/ main.ts, preload.ts
    renderer/ index.html, index.ts   # mounts the web app
```

`@sublime-ui/desktop` provides the reusable runtime (the bridge, the secure window
shell, and the built-in services); your `desktop/` folder owns the packaging
configuration. In development the renderer loads from the Webpack dev server (with
HMR); in a packaged build it loads from `file://` inside the asar.
