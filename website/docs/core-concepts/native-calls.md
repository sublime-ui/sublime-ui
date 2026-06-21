---
sidebar_position: 8
title: Native calls
---

# Native calls

Some things a web bundle simply can't do: read a file off disk, pop a save
dialog, talk to a printer, raise an OS notification. **Native calls** are how a
Sublime app reaches those OS and Node.js capabilities — safely, with full
types, and through one secure channel — from the same screens that run in the
browser.

This is the **desktop native bridge**. Don't confuse it with business-logic
**Services**: those are your own app code, shared across every target. Native
calls cross a process boundary to reach the operating system, and only resolve
when your app runs inside the Electron shell.

## The mental model

The bridge has two ends, plus the channel that connects them:

- **`defineNative(name, methods)`** declares a typed service contract in the
  main process — the side that may import Node-only dependencies.
- **`useNative(name)`** returns a typed proxy in the renderer (your screens), or
  `null` on plain web — so the same screen runs everywhere without
  `if (isDesktop)` branches.
- Every method call travels over **one secure, `contextIsolation`-safe IPC
  channel** to the main process, which dispatches to the registered service.

```text
useNative('printer').print(receipt)   →   one IPC channel   →   printer.print(receipt)
        renderer                                                      main
```

Because every call shares one channel, adding a capability is just one more
registration — no preload edits, no bridge rebuild.

## Built-ins, and your own

Sublime ships ready-to-use services: `fs`, `dialog`, `shell`, `clipboard`, and
`notifications`. When you need more — a receipt printer, a serial device — you
author your own with `defineNative` and register it alongside them.

### Built-in services

| Service | Methods |
| --- | --- |
| `fs` | `readFile`, `writeFile`, `exists`, `readDir`, `mkdir`, `remove` |
| `dialog` | `openFile`, `saveFile`, `message` |
| `shell` | `openExternal`, `openPath`, `showItemInFolder` |
| `clipboard` | `readText`, `writeText` |
| `notifications` | `notify({ title, body })` |

## Define a service

Native logic lives in main-process modules under `src/native/`. They can import
anything Node — these dependencies never reach the web bundle.

```ts
// src/native/printer.service.ts  (main-process only)
import { defineNative } from '@sublime-ui/desktop';
import escpos from 'escpos'; // node-only — bundled into MAIN, never the renderer

export const printer = defineNative('printer', {
  async print(receipt: Receipt): Promise<void> {
    /* ...node code... */
  },
  async listDevices(): Promise<Device[]> {
    /* ... */
  },
});

export type Printer = typeof printer; // the contract type
```

Register the built-ins plus your services once, in the main entry:

```ts
// desktop/src/main/main.ts
registerNative([fs, dialog, shell, clipboard, notifications, printer]);
```

## Call it from a screen

```tsx
import { useNative } from '@sublime-ui/desktop';
import type { Printer } from '../../native/printer.service';

function PrintButton({ receipt }: { receipt: Receipt }) {
  const printer = useNative<Printer>('printer');
  // null on plain web → the same screen runs everywhere without `if (isDesktop)`
  return <Button onPress={() => printer?.print(receipt)}>Print</Button>;
}
```

The renderer imports only `import type { Printer }` — erased at build — so node
dependencies stay out of the web bundle. `useNative` returns a typed proxy whose
method calls are forwarded over IPC; errors thrown in main surface as a typed
`NativeError` you can `catch` like a local call.

## How it travels

```text
useNative<Printer>('printer').print(receipt)
   → proxy: invoke('printer', 'print', receipt)
   → preload: contextBridge → ipcRenderer.invoke('native:invoke', ...)
   → main:  ipcMain.handle('native:invoke')  // validates (mod, method) ∈ registry
   → registry['printer']['print'](receipt)   // e.g. printing a receipt
```

One generic channel carries every call, so adding a module is just another
`registerNative` entry — no preload edits, no bridge rebuild.

## Security

The renderer runs with `contextIsolation: true` and `nodeIntegration: false`. The
preload exposes exactly one function. The main handler rejects any
`(module, method)` pair that is not in the registry, so the renderer can only reach
capabilities you explicitly registered.

## Where to go next

Native calls only resolve inside the Electron shell. Platform-specific desktop
packaging and shell setup live at [Desktop](/docs/platforms/desktop/overview) and
[Packaging](/docs/platforms/desktop/packaging). For where native modules live in
your tree, see [Project structure](/docs/core-concepts/project-structure), and for
the relevant commands, see the [CLI reference](/docs/reference/cli). If something
misbehaves, check [Troubleshooting](/docs/reference/troubleshooting).
