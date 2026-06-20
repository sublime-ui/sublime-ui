---
sidebar_position: 1
title: Overview
---

# Framework

`@sublime-ui/framework` is Sublime UI's **model-centric data layer**. You declare
a `Model` once and read, write, cache, and react to that data the same way on
mobile, web, and desktop — no hand-written reducers, actions, or `fetch` calls.

```ts
import { Model, registerModel } from '@sublime-ui/framework';

export class Note extends Model {
  protected static resource = 'notes';
  declare id: string;
  declare title: string;
}
registerModel(Note);   // in-memory by default
```

Read and write through expressive commands — `Note.all()`, `Note.find(id)`,
`note.save()`, `note.delete()` — and read **reactively** in components with
`Note.rxAll()` / `Note.rxFind(id)`, which serve from the cache first and fetch
when needed.

## Pick where your data lives

A model's backend is a pluggable **gateway**, chosen per model — the model code
never changes:

| Gateway | Where data lives |
|---|---|
| **In-memory** *(default)* | the Redux store — zero-config, great for prototyping |
| **`DbGateway`** | a local database — SQLite (desktop/mobile) · IndexedDB (web) |
| **`HttpGateway`** | your REST API |

Every gateway mirrors its data into a per-model Redux slice, so reactive reads
behave identically regardless of backend, and the store always holds plain,
syncable JSON.

→ See **[Models](/docs/framework/models)** for the full guide: defining models,
choosing a backend, commands, reactive reads, querying, errors, and local
persistence.
