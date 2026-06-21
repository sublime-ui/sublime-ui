---
sidebar_position: 2
title: Packages
---

# Packages

Sublime UI ships as a set of focused `@sublime-ui/*` packages. Each one owns a
single concern, and they compose into a full cross-platform app.

### @sublime-ui/framework

Laravel/Eloquent-style Models, pluggable gateways (`DbGateway`, `HttpGateway`),
typed Redux-backed state, and the reactive data layer at the compile-time core of
every Sublime UI app.

→ [Models](/docs/core-concepts/models), [Data & persistence](/docs/core-concepts/data-and-persistence)

### @sublime-ui/library

The tokens-first design system. One serializable set of tokens drives real Material
components on every platform — MUI on web and React Native Paper on mobile — so a
single component API renders natively everywhere.

→ [Components](/docs/core-concepts/components), [Theming](/docs/core-concepts/theming)

### @sublime-ui/ui

Cross-platform navigation and layout primitives. You author navigation once as a
storybook, and it compiles to React Navigation on mobile and react-router on web.

→ [Navigation](/docs/core-concepts/navigation)

### @sublime-ui/storage

Local-first persistence behind a single Gateway. It resolves the right
`DatabaseAdapter` per platform — IndexedDB on web, SQLite on desktop and mobile —
so your models persist identically across targets.

→ [Data & persistence](/docs/core-concepts/data-and-persistence)

### @sublime-ui/desktop

The Electron desktop shell plus a secure, typed native bridge
(`defineNative`/`useNative`) that exposes native capabilities to your app over one
IPC channel.

→ [Native calls](/docs/core-concepts/native-calls), [Desktop](/docs/platforms/desktop/overview)

### @sublime-ui/devkit

The Sublime UI CLI (`sublime` / `sui`), code generators, the navigation compiler,
and the dev server and build tooling for every platform.

→ [CLI](/docs/reference/cli)

### @sublime-ui/create-app

The project scaffolder. Run `npm create @sublime-ui/app` to generate a new,
ready-to-run Sublime UI app.

→ [Getting Started](/docs/getting-started)
