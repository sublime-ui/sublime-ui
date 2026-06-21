---
sidebar_position: 3
title: Models
---

# Models

A **Model** is how Sublime UI thinks about your data. If you've used Laravel's
Eloquent, it will feel familiar: you declare a class **once** — its fields, its
resource, its casts — and that single declaration becomes the home for reading,
writing, caching, and reacting to that data everywhere your app runs: mobile,
web, and desktop.

You don't wire up stores, reducers, or fetch calls by hand. Calling
`registerModel` connects the Model to a **Gateway** — its pluggable backend — and
auto-generates a **Redux slice** behind the scenes. The same model code runs
everywhere; what changes is **where the data lives**, and you choose that per
model without touching the model itself.

Once registered, you talk to your data through expressive commands —
`all()`, `find()`, `save()`, `delete()` — and read it **reactively** in
components with `rxAll()` / `rxFind()`. The reactive reads serve **cache-first**:
they hand back whatever is already loaded immediately, then fetch in the
background when something is missing.

```ts
import { Model, registerModel } from '@sublime-ui/framework';

export class User extends Model {
  protected static resource = '/users';
  declare id: number;
  declare name: string;
}
registerModel(User);

// Anywhere in your app:
const user = await User.find(1);   // command
const users = User.rxAll();        // reactive, cache-first
```

The same Model works unchanged on mobile, web, and desktop — that's the
"declare once" promise applied to your data layer.

:::note
A Model's backend is chosen **when you register it** — `registerModel(Todo, DbGateway)`
for a local database, or `registerModel(Post, HttpGateway)` for a REST API
(in-memory is the default when you pass no gateway). See
[Data & persistence](/docs/core-concepts/data-and-persistence) for the full
story on backends, adapters, and configuration.
:::

## Define a model

Fields are declared **once**, in the class body, as `declare` properties — real
TypeScript types, no companion interface, no decorators. `declare` emits **no
runtime code**, so the framework's hydration never clobbers your data.

```ts
import { Model } from '@sublime-ui/framework';

export class Note extends Model {
  protected static resource = 'notes';   // logical collection name

  declare id: string;
  declare title: string;
  declare body: string;
  declare pinned: boolean;

  // computed values are getters — typed, never stored
  get preview(): string {
    return this.body.slice(0, 80);
  }
}
```

- **`declare` fields** are your typed instance fields. Accessing an *undeclared*
  member is a compile-time error — typos are caught for you.
- **Getters/methods** live on the prototype and are **never persisted** — only
  your own data is.
- **`resource`** is the logical collection name. For a REST-backed model it’s
  also the URL path (`/notes`); for in-memory and local-DB models it’s just the
  table/store name.

### Casts

Use casts to convert raw stored values into rich runtime types and back again —
dates, numbers, booleans, and JSON survive the round-trip without manual parsing:

```ts
import { Model } from '@sublime-ui/framework';

export class Note extends Model {
  protected static resource = 'notes';
  protected static casts = {
    createdAt: 'date',     // string ⇄ Date
    pinned: 'boolean',     // 0/1 ⇄ boolean
    tags: 'json',          // serialized text ⇄ array/object
  };

  declare id: string;
  declare createdAt: Date;
  declare pinned: boolean;
  declare tags: string[];
}
```

Casts are applied on hydration (read) and serialization (write), so your
`declare` fields always hold the rich type while the store keeps plain JSON.

## Choosing a backend

Connect a model to its backend with `registerModel`. The **gateway** you pass
decides where the data lives — and that’s the only thing that changes:

```ts
import { registerModel, HttpGateway, DbGateway } from '@sublime-ui/framework';

registerModel(Note);                 // in-memory (default)
// registerModel(Note, HttpGateway); // REST API:   GET/POST/PUT/DELETE /notes
// registerModel(Note, DbGateway);   // local DB:   SQLite (desktop/mobile) · IndexedDB (web)
```

| Gateway | Where data lives | Use it for |
|---|---|---|
| **In-memory** *(default)* | the Redux store | prototyping, ephemeral/derived data, zero-config |
| **`DbGateway`** | a local document database | offline-first apps, local persistence |
| **`HttpGateway`** | your REST API | server-backed data |

A single app can **mix** backends — a live `User` over `HttpGateway` alongside a
`Draft` kept in `DbGateway` — because the choice is per model.

## How it works

Whichever gateway you pick, the flow is the same:

```
 Model.all() / find() / save() / delete()
        │
        ▼
   Gateway  (in-memory · DB · REST)  ──►  returns plain rows
        │
        ▼
   per-model Redux slice (plain JSON cache)
        │
        ▼
   rxAll() / rxFind()  ──►  hydrated Model instances, reactively
```

Every gateway **mirrors its results into a per-model Redux slice**, so your
reactive reads (`rxAll`/`rxFind`) behave **identically** no matter the backend.
The store only ever holds **plain JSON** — instances are rehydrated on read
(getters and methods come from the prototype), which keeps state serializable and
syncable across platforms.

You never write reducers, actions, or `fetch` calls by hand. `registerModel`
wires the gateway and the auto-registering slice for you.

## Commands (imperative)

Commands are async. They resolve with hydrated model(s), and **reject with a
typed error** on failure — wrap them in `try/catch`.

```ts
const notes = await Note.all();         // list (optionally: Note.all(query))
const note  = await Note.find('abc');   // Note | null  — null if it doesn't exist

const draft = new Note({ title: 'Hi', body: '…', pinned: false });
await draft.save();                     // no id → create;  has id → update

await draft.delete();                   // remove
```

- **`find()` returns `null`** when a record legitimately doesn’t exist — that’s
  not an error. Anything that actually *fails* (offline, auth, bad request,
  DB error) **throws** (see [Errors](#errors)).
- **`save()`** creates when the instance has no id, updates when it does.
- **`call()`** hits a custom REST endpoint and is therefore only available on
  models registered with `HttpGateway`:

  ```ts
  // on a class registered with HttpGateway
  static expired() {
    return this.call<Note[]>({ url: '/notes/expired', store: true });
  }
  ```

## Reactive reads

In components, read **reactively** and **cache-first** with the `rx` methods.
They return immediately from the cache, fetch in the background when something is
missing, and re-render when the store changes.

```tsx
function Notes() {
  const notes = Note.rxAll();

  if (notes.loading) return <Spinner />;
  if (notes.error)   return <ErrorView error={notes.error} onRetry={notes.refetch} />;

  return notes
    .where('pinned', true)
    .sortBy('title')
    .map((n) => <Row key={n.id} title={n.title} subtitle={n.preview} />);
}
```

`rxAll()` returns a **`ModelCollection`** — array-like, with `loading`, `error`,
`refetch()`, and chainable helpers (`where`, `whereIn`, `sortBy`, `filter`,
`find`, `first`, `map`, `length`). `rxFind(id)` returns a reactive `Model | null`.

## Querying

There are two complementary ways to narrow data, and they don’t overlap:

**1. Push it down to the backend** — pass a query to `all()`/`rxAll()`. The
gateway runs it where the data lives (a SQL `WHERE`, an IndexedDB scan, a REST
query string, or an in-memory filter):

```ts
await Note.all({
  filters: [{ field: 'pinned', op: 'eq', value: true }],
  sort: [{ field: 'title', dir: 'asc' }],
  limit: 20,
});

// the familiar flat form still works and means "equals":
await Note.all({ pinned: true });   // → filters: [{ field: 'pinned', op: 'eq', value: true }]
```

Operators: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `like` (case-insensitive
contains).

**2. Refine the result in the client** — chain `ModelCollection` helpers on what
came back. These run on already-hydrated instances, so they can use **computed
getters** that aren’t stored fields:

```ts
Note.rxAll().where('pinned', true);     // refines the loaded collection
```

Rule of thumb: a **query** (passed to `all`) decides *which rows are fetched*; a
**collection helper** (`.where`) refines *what you already have*.

## Errors

Failures surface as a small, typed error tree rooted at **`DataError`** — and
they’re **always thrown**, never swallowed into a `null`, so you always know what
went wrong:

| Error | Means |
|---|---|
| `HttpError` | a non-success HTTP response (carries `status`, `url`) |
| `NetworkError` | the request never completed (offline, DNS, refused) |
| `AuthError` | authentication/authorization failed (401/403) |
| `NotFoundError` | you tried to `update()` a record that doesn’t exist |
| `ConfigError` | a required config/adapter wasn’t provided |
| `StorageError` | the local database failed |

```ts
import { DataError, NetworkError } from '@sublime-ui/framework';

try {
  await note.save();
} catch (e) {
  if (e instanceof NetworkError) showOfflineBanner();
  else if (e instanceof DataError) report(e);   // catches the whole family
  throw e;
}
```

Reactive reads surface the same error via `collection.error`, with `refetch()` to
retry. (`ApiError` remains as a deprecated alias of `HttpError`.)

## Persistence & platforms

Local-DB models work across platforms with **one line** — the right database is
chosen automatically:

```ts
import { configureSublime } from '@sublime-ui/framework';
import { createDatabaseAdapter } from '@sublime-ui/storage';

configureSublime({
  platform,                                   // 'web' | 'mobile' | 'desktop'
  databaseAdapter: createDatabaseAdapter(),   // resolves per platform
  // baseURL / tokenProvider — only if you use HttpGateway
});
```

`createDatabaseAdapter()` resolves the same way Sublime UI components do — the
bundler picks the platform’s implementation:

- **Web** → IndexedDB
- **Mobile** → SQLite (`expo-sqlite`)
- **Desktop** → SQLite (`better-sqlite3`), reached through the desktop
  [native bridge](/docs/core-concepts/native-calls); the web build automatically
  upgrades to it when running in the desktop shell.

Native database code never enters the web bundle, and the framework core stays
free of any platform-specific imports.

## Things to know (assumptions)

- **No schema, no migrations.** Local data is stored as JSON documents keyed by
  `id`, so adding a `declare` field never needs a migration. (SQLite uses a
  `(id, doc)` table with `json_extract`; IndexedDB uses native object stores.)
- **The store holds plain JSON only** — model instances are ephemeral views
  created on read. This keeps state serializable and cross-platform syncable.
- **IDs:** local backends generate string UUIDs on create; REST models usually
  get server-assigned ids. Because identity is matched exactly, **switching a
  model’s backend is a data-migration boundary, not a transparent swap.**
- **`call()` is REST-only** — it has no meaning when the source of truth is Redux
  or a local DB, and will throw on a non-HTTP model.
- **`resource`** is a logical name everywhere; only `HttpGateway` treats it as a
  URL path.

## See also

- [Data & persistence](/docs/core-concepts/data-and-persistence)
- [Project structure](/docs/core-concepts/project-structure)
- [Components](/docs/core-concepts/components)
