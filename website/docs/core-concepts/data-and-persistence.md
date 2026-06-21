---
sidebar_position: 4
title: Data & persistence
---

# Data & persistence

A Sublime UI **Model** never talks to a database or an API directly. It talks to
a **gateway** — a swappable storage strategy you choose at registration time. The
gateway does the work: it opens the database connection or makes the `fetch`
calls. Your model code stays exactly the same either way.

That single decision — *which gateway* — is the headline feature of the data
layer. The same model, backed by a **local database** or a **REST API**, with no
SQL and no `fetch` in your code.

```ts
import { registerModel, DbGateway, HttpGateway } from '@sublime-ui/framework';

registerModel(Todo, DbGateway);    // local-first persistence
registerModel(Post, HttpGateway);  // your REST API
```

See **[Models](/docs/core-concepts/models)** for the full model API and
**[Packages](/docs/reference/packages)** for what ships where.

## The Gateway abstraction

Every gateway implements one small contract. The model calls these methods; it
never knows whether the bytes came from IndexedDB, SQLite, or the network:

```ts
interface Gateway {
  index(query?: Query): Promise<Row[]>;
  show(id: Id): Promise<Row | null>;
  create(body: Row): Promise<Row>;
  update(id: Id, body: Row): Promise<Row>;
  destroy(id: Id): Promise<void>;
}
```

Because the contract is identical across backends, the **Model API is the same
regardless of gateway**. You write the model once and pick its backing store at
`registerModel`. Three gateways ship in the box:

| Gateway | Where data lives |
|---|---|
| **In-memory** *(default)* | the Redux store — zero-config, great for prototyping |
| **`DbGateway`** | a local database — SQLite (desktop/mobile) · IndexedDB (web) |
| **`HttpGateway`** | your REST API |

## Local-first: `registerModel(Todo, DbGateway)`

`DbGateway` persists each model to a local document store. It owns no engine of
its own — it resolves the **`DatabaseAdapter`** you configured at startup and
delegates every read and write to it.

You configure that adapter once, with `createDatabaseAdapter()` from
`@sublime-ui/storage`. The factory is **platform-resolved**: your bundler picks
the right implementation automatically, so the same line of code gives you
IndexedDB on the web and SQLite on desktop and mobile.

```ts
import { configureSublime } from '@sublime-ui/framework';
import { createDatabaseAdapter } from '@sublime-ui/storage';

configureSublime({
  platform: 'web', // 'web' | 'desktop' | 'mobile'
  databaseAdapter: createDatabaseAdapter(),
});
```

What `createDatabaseAdapter()` resolves to:

| Platform | Backend | How it's selected |
|---|---|---|
| **Web** | IndexedDB (via `idb`) | bundler picks `createDatabaseAdapter.web.ts`; on plain web it returns the IndexedDB adapter |
| **Desktop** | SQLite (`better-sqlite3` over IPC) | same web entry, but it probes the Electron native bridge at runtime and returns the SQLite adapter |
| **Mobile** | SQLite (`expo-sqlite`) | Metro picks `createDatabaseAdapter.native.ts` via the `.native.ts` convention |

Then register the model against `DbGateway` and use it:

```ts
import { Model, registerModel, DbGateway } from '@sublime-ui/framework';

export class Todo extends Model {
  protected static resource = 'todos';
  declare id: string;
  declare title: string;
  declare done: boolean;
}

registerModel(Todo, DbGateway);

// Create + persist — no SQL, no connection handling:
const todo = await Todo.make({ title: 'Ship the docs', done: false }).save();

// Update is the same call (it has an id now):
todo.done = true;
await todo.save();

// Delete:
await todo.delete();
```

### Offline-first

The `DbGateway` path is **offline-first by design**. The database lives on the
device — IndexedDB in the browser, SQLite on desktop and mobile — so reads and
writes work with no network and survive app restarts. There is no server round
trip in the critical path: `save()` and `delete()` go straight to local storage,
and every model still mirrors its rows into a Redux slice so reactive reads stay
instant.

## REST: `registerModel(Post, HttpGateway)`

`HttpGateway` backs a model with your REST API. It maps the gateway contract onto
conventional endpoints relative to the model's `resource`:

| Method | Request |
|---|---|
| `index()` | `GET /posts` (with a query string) |
| `show(id)` | `GET /posts/:id` (a `404` becomes `null`) |
| `create(body)` | `POST /posts` |
| `update(id, body)` | `PUT /posts/:id` |
| `destroy(id)` | `DELETE /posts/:id` |

### Response envelope

`HttpGateway` expects every JSON response wrapped in a standard envelope and
**unwraps it for you** — your model only ever sees `data`:

```ts
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
}
```

So `GET /posts` should return `{ "success": true, "message": "...", "data": [ ... ], "errors": null }`,
and the gateway hands the model the inner array. A non-success response surfaces
as a typed `DataError`.

### Base URL configuration

The API root is set once in `configureSublime`. An optional `tokenProvider`
supplies a bearer token per request:

```ts
import { configureSublime } from '@sublime-ui/framework';

configureSublime({
  platform: 'web',
  baseURL: 'https://api.example.com',
  tokenProvider: async () => localStorage.getItem('token'),
});
```

`baseURL` is validated lazily — it's only required when a model actually uses
`HttpGateway`, so a purely local app never has to supply one.

```ts
import { Model, registerModel, HttpGateway } from '@sublime-ui/framework';

export class Post extends Model {
  protected static resource = 'posts';
  declare id: number;
  declare title: string;
  declare body: string;
}

registerModel(Post, HttpGateway);
```

## The same Model API, either way

This is the point of the whole abstraction: **swap `DbGateway` for
`HttpGateway` and not one line of model usage changes.** You write no `fetch` and
no SQL.

```ts
function PostList() {
  // Reactive read: serves from cache, fetches when needed, re-renders on change.
  const posts = Post.rxAll();

  return (
    <ul>
      {posts.map((p) => (
        <li key={p.id}>{p.title}</li>
      ))}
    </ul>
  );
}

function PostDetail({ id }: { id: number }) {
  const post = Post.rxFind(id); // null until loaded, then reactive
  return <h1>{post?.title}</h1>;
}
```

Writes are identical to the local example above:

```ts
const post = await Post.make({ title: 'Hello', body: 'World' }).save(); // POST
post.title = 'Hello again';
await post.save();   // PUT
await post.delete(); // DELETE
```

| You write | `DbGateway` does | `HttpGateway` does |
|---|---|---|
| `Post.rxAll()` / `Post.rxFind(id)` | reads from SQLite / IndexedDB | `GET /posts` / `GET /posts/:id` |
| `make().save()` (new) | inserts a local row (auto-generated id) | `POST /posts` |
| `save()` (existing) | updates the local row | `PUT /posts/:id` |
| `delete()` | deletes the local row | `DELETE /posts/:id` |

In every case the gateway returns plain rows, the model hydrates typed instances,
and the result is mirrored into a Redux slice so `rxAll`/`rxFind` stay reactive.
You choose where the data lives once — the rest of your app never has to care.

→ Next: **[Models](/docs/core-concepts/models)** for queries, collections, error
handling, and `Model.call()` for custom endpoints.
