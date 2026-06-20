# Sublime UI — SP1: Storage-Agnostic Gateway — Design

Date: 2026-06-20
Status: Draft (pending written-spec review)
Target version: **0.2.0** (minor; pre-1.0 breaking changes allowed per `.changeset/config.json`)

## 1. Program context

`@sublime-ui/framework` is the Laravel/Eloquent-style data layer: you declare a
`Model` once and read/write it through `all/find/save/delete/call` +
`rxAll/rxFind`, with a per-model Redux slice as the reactive cache. Today that
layer is **hard-wired to REST** — `Model` resolves a single concrete `Gateway`
(`framework/src/gateway/Gateway.ts:4`) that returns the `ApiResponse` envelope,
and `Model` reads `res.data` everywhere (`Model.ts:60,61,74,75,95,96,121`).

The framework-core spec (#2) deliberately scoped a non-REST gateway as
**"future"**; the facts brief states *"Gateway = API-only layer (REST today; a DB
Gateway is roadmapped)."* **SP1 delivers that roadmap item**: it makes the data
layer storage-agnostic via three interchangeable **gateway strategies**, selected
per-model by the developer.

SP1 is the first of a planned sequence (SP2 caching, SP3 write-path/validation,
SP4 relationships, SP5 pagination, SP6 offline/sync). It is the foundation that
unblocks the rest. **It is a pure refactor of REST + two new strategies + a new
storage package; it does not add caching, validation, relationships, pagination,
or sync** (those are later SPs).

### The one idea

`Model` talks to a **`Gateway` interface**, not a REST class. Three
implementations satisfy it; all three mirror their results into the model's Redux
slice, so the reactive hooks are identical regardless of backend:

```ts
registerModel(User);                 // in-memory (DEFAULT) — Redux is the source of truth
registerModel(User, HttpGateway);    // REST API
registerModel(Note, DbGateway);      // local DB (SQLite desktop/mobile · IndexedDB web)
```

## 2. The three-strategy model

| Strategy | Source of truth | I/O | Use |
|---|---|---|---|
| **InMemoryGateway** (DEFAULT) | the model's Redux slice | none | prototyping, ephemeral/derived models, zero-config |
| **DbGateway** | local document DB | injected `DatabaseAdapter` | offline-first / local persistence |
| **HttpGateway** | the REST API | `fetch` | server-backed models (today's behaviour) |

The default **flips from REST to in-memory**: a fresh model just works in the
store, offline, with zero configuration; you opt into persistence (`DbGateway`)
or a server (`HttpGateway`) when you need them.

### 2.1 Architecture

```
 App code
   │  Model.all(query) / find(id) / save() / delete() / call(cfg)
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Model (context)  framework/src/model/Model.ts                          │
│  • normalizeQuery(legacy | Query) -> Query                             │
│  • SINGLE WRITER to the slice: setItems / upsertItem / removeItem      │
│  • fail(): normalize any throw -> DataError, dispatch setError, rethrow│
│  • call(): requires a RequestCapableGateway (HttpGateway only)         │
└───────────────┬──────────────────────────────────────────────────────┘
                │ reg.gateway: Gateway   (modelRegistry.resolve)
   ┌────────────┼───────────────────────────────┐
   ▼            ▼                                 ▼
┌────────────┐ ┌────────────┐                   ┌────────────────────────┐
│InMemory    │ │HttpGateway │                   │DbGateway               │
│Gateway     │ │(REST)      │                   │(ONE platform-agnostic  │
│slice =     │ │unwrap+throw│                   │ class)                 │
│truth (deps │ │            │                   │  delegates to ─────────┐│
│.store)     │ │            │                   └────────────────────────┘│
└────────────┘ └─────┬──────┘                                  ▼          │
                     │ fetch                     ┌───────────────────────────┐
                     ▼                           │ DatabaseAdapter (port)    │ ← core: TYPES ONLY
              REST API (envelope)                │  ensureCollection/get/    │
                                                 │  getAll/query/insert/     │
                                                 │  update/delete/tx?        │
                                                 └──────────┬────────────────┘
                            configureSublime({ databaseAdapter: createDatabaseAdapter() })
        ┌───────────────────────────────┼───────────────────────────────┐
        ▼ (@sublime-ui/storage/desktop)  ▼ (.../mobile)                   ▼ (.../web)
  SqliteAdapter ── desktop driver    SqliteAdapter ── expo driver    IndexedDbAdapter (idb)
   (better-sqlite3 in Electron        (expo-sqlite, async)            objectStore '<resource>'
    MAIN, via @sublime-ui/desktop                                     keyPath 'id'
    native bridge / IPC)
```

**Core has zero native/RN/DOM imports.** The only platform knowledge in
`framework/` is the `DatabaseAdapter` **interface** (pure types).
`better-sqlite3`/`expo-sqlite`/`idb`/`electron` live exclusively in the new
`@sublime-ui/storage` package (and the `sqlite` service in `@sublime-ui/desktop`),
injected at runtime. Enforced by an ESLint `import/no-restricted-paths` rule plus
a CI grep asserting `framework/src/**` imports none of those modules.

### 2.2 Design patterns

- **Strategy** — `Gateway` interface + three implementations; `Model` is the context.
- **Bridge / Adapter** — `DbGateway` is *one* platform-agnostic class that delegates to an injected `DatabaseAdapter`; per-platform differences live in drivers, **not** in gateway subclasses.
- **Query Object** — a backend-neutral `Query` consumed by in-memory + DB and serialized for REST.
- **Dependency Injection** — adapters injected via `configureSublime`, keeping core platform-agnostic.
- **Factory** — `registerModel` instantiates the chosen gateway class with a `GatewayDeps` bundle.

## 3. Vocabulary

| Term | Role |
|---|---|
| **`Gateway`** | The storage-strategy **interface**: `index/show/create/update/destroy`. Returns raw rows; throws typed errors. |
| **`RequestCapableGateway`** | `Gateway` + `request<T>()` (custom REST endpoints). Implemented **only** by `HttpGateway`. |
| **`InMemoryGateway` / `DbGateway` / `HttpGateway`** | The three concrete strategies. |
| **`DatabaseAdapter`** | Platform-agnostic document-store **port** the `DbGateway` delegates to. Concrete adapters ship outside core. |
| **`GatewayDeps`** | The bundle the framework hands a gateway at construction (`resource`, `idKey`, `sliceName`, `actions`, `store`). |
| **`Query`** | Backend-neutral query object (`filters/sort/limit/offset`). |
| **`DataError`** | Base of the transport-neutral error tree (`HttpError`, `NetworkError`, `AuthError`, `NotFoundError`, `ConfigError`, `StorageError`, reserved `ValidationError`). |
| **`@sublime-ui/storage`** | New workspace shipping the platform adapters + `createDatabaseAdapter()`. |

## 4. Public API (developer-facing)

Defining a model is **unchanged** — `declare`-only fields, a `resource`
(table/collection name; only `HttpGateway` treats it as a URL path):

```ts
import { Model, registerModel, HttpGateway, DbGateway } from '@sublime-ui/framework';

export class Note extends Model {
  protected static resource = 'notes';
  declare id: string;
  declare title: string;
  declare pinned: boolean;
}

registerModel(Note);                 // in-memory (default)
// registerModel(Note, HttpGateway); // REST: GET/POST/PUT/DELETE /notes
// registerModel(Note, DbGateway);   // local DB (adapter auto-selected per platform, §6.5)
```

Commands and reactive reads are **unchanged** in signature and semantics
(`all/find/save/delete/call`, `rxAll/rxFind`). `find()`/`rxFind()` keep returning
`T | null` for genuine absence; **every real failure throws a typed `DataError`**.

```ts
const note  = await Note.find('abc');     // T | null (null = legitimately absent)
const notes = Note.rxAll();               // reactive, cache-first, identical across backends
await new Note({ title: 'x' }).save();    // create (no id) / update (id present)
```

`Model.all(query)` accepts the neutral `Query` **or** today's flat record
(`{ storeId: 7 }`), normalized internally (§5.1).

`Model.call(...)` (custom endpoints) requires an HTTP-backed model; on an
in-memory/DB model it throws `DataError{ code: 'unsupported' }` (§6.1).

## 5. The Gateway interface, types, and implementations

`framework/src/gateway/Gateway.ts` is **rewritten** from the concrete REST class
into the interface + shared aliases. The REST body moves to `HttpGateway.ts`.

```ts
// framework/src/gateway/Gateway.ts
import type { Query } from './Query.js';
import type { RequestConfig } from './http.js';

export type Row = Record<string, unknown>;   // plain serializable JSON, as stored in a slice
export type Id = string | number;

/**
 * Storage-strategy contract. Every method returns RAW data (no ApiResponse
 * envelope) and THROWS a typed DataError on real failure. Absence is NOT a
 * failure: show() returns null for a record that legitimately does not exist.
 * All methods are async on every strategy (sync better-sqlite3 is wrapped),
 * so Model never branches on transport.
 */
export interface Gateway {
  index(query?: Query): Promise<Row[]>;
  show(id: Id): Promise<Row | null>;
  create(body: Row): Promise<Row>;
  update(id: Id, body: Row): Promise<Row>;
  destroy(id: Id): Promise<void>;
}

/** REST-only escape hatch for custom endpoints (Model.call). HttpGateway only. */
export interface RequestCapableGateway extends Gateway {
  request<T>(config: RequestConfig): Promise<T>;
}

export function isRequestCapable(g: Gateway): g is RequestCapableGateway {
  return typeof (g as Partial<RequestCapableGateway>).request === 'function';
}
```

### 5.1 Construction — `GatewayDeps` bundle (DECIDED)

The framework instantiates every gateway with a single dependency bundle (not a
positional `resource`). This lets `InMemoryGateway` read its slice via an
injected `store` with **no global-singleton import and no registry round-trip**,
and is uniform across strategies. `registerModel(User, HttpGateway)` — the
developer-facing call — is unchanged.

```ts
// framework/src/gateway/GatewayDeps.ts
import type { Store } from '@reduxjs/toolkit';
import type { ModelSlice } from '../store/createModelSlice.js';

export interface GatewayDeps {
  resource: string;                 // table/collection name; URL path for HttpGateway only
  idKey: string;                    // primary-key field (default 'id')
  sliceName: string;
  actions: ModelSlice['actions'];
  store: Store;                     // InMemoryGateway reads via this; never imports the singleton
}

export type GatewayClass = new (deps: GatewayDeps) => Gateway;   // the Factory signature
```

### 5.2 Single-writer rule

**`Model` is the single writer to every slice, across all three strategies.**
Gateways compute and return rows; `Model` dispatches `setItems`/`upsertItem`/
`removeItem` (unchanged from `Model.ts:60,74,95,110`). For in-memory, reads come
from the slice via `deps.store`; writes return the computed row and let `Model`'s
existing dispatch commit it (no double-write, no second copy).

### 5.3 InMemoryGateway (DEFAULT)

```ts
export class InMemoryGateway implements Gateway {
  constructor(private readonly deps: GatewayDeps) {}
  private items(): Row[] {
    const s = this.deps.store.getState() as Record<string, { items: Row[] } | undefined>;
    return s[this.deps.sliceName]?.items ?? [];
  }
  async index(q?: Query)  { const r = this.items(); return q ? applyQuery(r, q) : [...r]; }
  async show(id: Id)      { return this.items().find((r) => r[this.deps.idKey] === id) ?? null; }   // absent -> null
  async create(body: Row) { const k = this.deps.idKey; return { ...body, [k]: body[k] ?? genId() }; }
  async update(id, body)  { const k = this.deps.idKey; const cur = this.items().find((r) => r[k] === id);
                            if (!cur) throw new NotFoundError(`${this.deps.resource}#${id} not found`, { resource: this.deps.resource, id });
                            return { ...cur, ...body, [k]: id }; }
  async destroy(_id: Id)  { /* no-op: Model.delete dispatches removeItem (Model.ts:110) */ }
}
```

### 5.4 DbGateway (one platform-agnostic class)

```ts
export class DbGateway implements Gateway {
  constructor(private readonly deps: GatewayDeps) {}
  async index(q?: Query)  { const db = getDatabaseAdapter(); return q ? db.query(this.deps.resource, q) : db.getAll(this.deps.resource); }
  async show(id: Id)      { return getDatabaseAdapter().get(this.deps.resource, id); }           // 0 rows -> null
  async create(body: Row) { const k = this.deps.idKey; const row = body[k] == null ? { ...body, [k]: genId() } : body;
                            return getDatabaseAdapter().insert(this.deps.resource, row); }
  async update(id, body)  { return getDatabaseAdapter().update(this.deps.resource, id, body); }  // missing -> NotFoundError
  async destroy(id: Id)   { await getDatabaseAdapter().delete(this.deps.resource, id); }         // missing -> no-op
}
```

### 5.5 HttpGateway (refactored REST)

Today's `Gateway.ts` body with the new contract: return `Row`/`Row[]` not
`ApiResponse`, map **404 → null** inside `show()` (the 404 check leaves `Model`),
serialize `Query` via `toQueryString` (§5.7), throw typed errors (§7).

```ts
export class HttpGateway implements RequestCapableGateway {
  constructor(private readonly deps: GatewayDeps) {}
  private get resource() { return this.deps.resource; }
  async index(q?: Query)  { return http.request<Row[]>({ url: `${this.resource}${toQueryString(q)}` }); }
  async show(id: Id)      { try { return await http.request<Row>({ url: `${this.resource}/${id}` }); }
                            catch (e) { if (e instanceof HttpError && e.status === 404) return null; throw e; } }
  async create(body: Row) { return http.request<Row>({ url: this.resource, method: 'POST', body }); }
  async update(id, body)  { return http.request<Row>({ url: `${this.resource}/${id}`, method: 'PUT', body }); }
  async destroy(id: Id)   { await http.request<unknown>({ url: `${this.resource}/${id}`, method: 'DELETE' }); }
  request<T>(c: RequestConfig) { return http.request<T>(c); }
}
```

### 5.6 id generation + update-of-missing (DECIDED)

One shared generator, `framework/src/gateway/genId.ts`, returns a **string UUID**
(`crypto.randomUUID()`, with a timestamp fallback). Used by in-memory + DB
`create()` when `body[idKey]` is unset; a developer-supplied id is always honored.

**`update()` of a missing id THROWS `NotFoundError` in all three strategies**
(in-memory checks the slice; SQLite throws when `changes === 0`; IndexedDB throws
when `get` is `undefined`; HTTP surfaces the server's non-2xx). `Model.save()`
routes by id *presence*, so this only fires when a developer hand-sets an id that
doesn't exist — a genuine error. This does **not** contradict the absence-as-null
rule, which governs reads (`find`/`show`).

**Id-type caveat (documented):** in-memory/DB generate string UUIDs; HTTP models
typically get numeric server ids; the slice matches by strict `===`. **Switching a
model's gateway strategy is a data-migration boundary, not transparent.** SQLite
stores the PK as `TEXT` for uniformity; identity lookups always use the PK column
with `String(id)`, never `json_extract(doc,'$.id')`.

## 6. Query, errors, config, registration

### 6.1 The Query object (canonical)

```ts
// framework/src/gateway/Query.ts
export type FilterOp = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like';
export type FilterValue = string | number | boolean | null | Array<string | number>;
export interface QueryFilter { field: string; op: FilterOp; value: FilterValue; }  // `in` => value is an array
export interface QuerySort  { field: string; dir: 'asc' | 'desc'; }
export interface Query {            // all fields optional; empty Query => "all rows"
  filters?: QueryFilter[];          // ANDed (no OR/grouping in v1 — reserved)
  sort?: QuerySort[];               // applied primary, secondary, …
  limit?: number;                   // forward-compat for SP5 pagination
  offset?: number;
}
export type LegacyQuery = Record<string, string | number | boolean>;  // today's flat form
```

Helpers (one set, no duplicates): `normalizeQuery(q?: Query|LegacyQuery)` +
`isQuery()` in `Query.ts`; the JS evaluator `applyQuery(rows, q)` in
`queryMatch.ts` (shared by **InMemoryGateway and the IndexedDB scan fallback** —
one operator-semantics oracle); `toQueryString(q)` in `HttpGateway.ts`.

**Translation:**
- **In-memory** — `applyQuery`: filter (per-op, ANDed) → stable multi-key sort (nulls first on asc) → `slice(offset, offset+limit)` → defensive clone. The reference semantics.
- **SQLite** — `buildSelect`: each filter → `json_extract(doc,'$.field') <op> ?` (`eq`→`=`, `ne`→`<>`, `in`→`IN (?,…)`, `like`→`LIKE ? ESCAPE '\'` wrapping `%term%`, `eq null`→`IS NULL`); `sort`→`ORDER BY json_extract(...)`; `LIMIT`/`OFFSET`. Field paths are **bound parameters**, the table name is validated (`^[A-Za-z_][A-Za-z0-9_]*$`) — no injection.
- **IndexedDB** — id-only filters push down (`get`/`IDBKeyRange`); anything else → `getAll()` + the same `applyQuery`. Sort/limit/offset never push down in v1.
- **REST** — `toQueryString`: `eq` scalar → flat `field=value` (**preserves today's `?storeId=7`**); non-`eq` → `filter[field][op]=value`; `in` → repeated keys; `sort=field`/`sort=-field`; flat `limit`/`offset`. `encodeURIComponent` unchanged.

**`like` = case-insensitive contains** on every backend (`%term%`, framework
escapes raw `%`/`_`). A cross-backend **conformance fixture** (§9) pins this.

**Push-down vs client-side (the `where` collision) — no change to
`ModelCollection`:** `Model.all(query)` decides *which rows are fetched*;
`ModelCollection.where/whereIn/sortBy/filter` refines *already-hydrated
instances* (including computed getters that can't be pushed down). Different
types, different timing, different objects — they never collide.

### 6.2 Error hierarchy

`framework/src/errors/` holds the tree; `HttpError` (the renamed `ApiError`) lives
in `gateway/HttpError.ts`. **All subtypes extend `DataError` directly** (a DB
connection drop can be a `StorageError`/`NetworkError` without faking an HTTP
`url`/`status`); `instanceof DataError` is the universal test, `instanceof
HttpError` the "came over the wire" test. The base uses `new.target.prototype`
(fixes the latent subclass-`instanceof` bug at `ApiError.ts:19`).

```
DataError (base; code: DataErrorCode, cause?)
├── HttpError    (status, url, errors)          ← was ApiError
├── NetworkError (url?)                          connection failed (DNS/offline/refused)
├── AuthError    (status?)                       401/403
├── ValidationError (fields)                     RESERVED for SP3 — thrown nowhere in SP1
├── NotFoundError (resource?, id?)               thrown by update-of-missing; NOT by find/show
├── ConfigError                                  missing baseURL / databaseAdapter
└── StorageError (cause?)                         DB driver/transport failure
```

`framework/src/gateway/ApiError.ts` becomes a back-compat shim:
`export { HttpError, HttpError as ApiError }` (+ type aliases), so existing
imports and `instanceof ApiError` keep working (runtime `.name` is now
`'HttpError'`).

`http.ts` is re-classified: return raw `T` (`return parsed.data`); fetch throw →
`NetworkError`; bad JSON → `HttpError`; 401/403 → `AuthError`; 422 →
`ValidationError`; other non-2xx (incl. 404) → `HttpError`. `ApiResponse`
(`entities/ApiResponse.ts`, shape unchanged) becomes **HTTP-internal**.

Slice/collection error typing changes `ApiError` → `DataError`
(`createModelSlice.ts:2,12,57`, `ModelCollection.ts:1,6,12`, `Model.ts:8`); the
store's `serializableCheck` carve-out matches by path (`/\.error$/`, `store.ts:18-24`)
so it needs no edit.

### 6.3 Config changes

HTTP fields become optional (a local-only/in-memory-only app supplies none); add
`databaseAdapter`; validate lazily at first use so a mixed-backend app isn't
forced to supply global HTTP config.

```ts
export interface SublimeConfig {
  baseURL?: string;                              // required only if a model uses HttpGateway
  tokenProvider?: () => Promise<string | null>;  // defaults to "no token"
  databaseAdapter?: DatabaseAdapter;             // required only if a model uses DbGateway
  storageAdapter?: StorageAdapter;               // KV string store (separate port); now optional
  platform: 'mobile' | 'web' | 'desktop';        // always required (drives §6.5 auto-select)
}
// getHttpConfig() throws ConfigError if baseURL missing; getDatabaseAdapter() throws if adapter missing.
```

`storageAdapter` stays a **separate** port from `databaseAdapter` (KV string store
vs document store) — not overloaded. `configureSublime({ platform: 'web' })` is now
valid (enables the zero-config in-memory default).

### 6.4 registerModel — overloads + in-memory default

```ts
export function registerModel(M: ModelLike, gateway: GatewayClass, opts?: RegisterOpts): void;
export function registerModel(M: ModelLike, opts?: RegisterOpts): void;
// impl: GatewayCtor = typeof arg2 === 'function' ? arg2 : InMemoryGateway   // DEFAULT flips
//       deps: GatewayDeps = { resource, idKey, sliceName, actions, store }
//       new GatewayCtor(deps)                                                // Factory
//       if (GatewayCtor === DbGateway && configured idb adapter) void adapter.ensureCollection(resource)  // §6.5
```

Disambiguation: a class is callable (`typeof arg2 === 'function'`), an options
object isn't — so `registerModel(User, { idKey })` still compiles.
`modelRegistry.ModelRegistration.gateway` is now interface-typed
(`modelRegistry.ts:5`; broadens, no textual edit).

### 6.5 Platform auto-selection of the DB adapter (requirement)

The adapter is **auto-resolved by platform**, the same way UI components and
`ui/src/navigation/bridge.web.ts`/`bridge.native.ts` resolve — the developer never
hand-picks an engine and native deps never enter the web bundle.

`@sublime-ui/storage` exposes one factory, resolved by the bundler via package
`exports` conditions + the `.web.ts`/`.native.ts` file convention:

- **Metro (mobile)** → `createDatabaseAdapter.native.ts` → `expo-sqlite` adapter.
- **Web bundler** → `createDatabaseAdapter.web.ts` → IndexedDB adapter, **but at
  runtime it probes for the desktop native bridge** (`globalThis.sublimeNative?.sqlite`);
  if present (desktop runs the web bundle) it returns the **SQLite-over-IPC**
  adapter, else IndexedDB.

```ts
// app bootstrap — one line, all platforms:
import { createDatabaseAdapter } from '@sublime-ui/storage';
configureSublime({ platform, databaseAdapter: createDatabaseAdapter() });
registerModel(Note, DbGateway);   // uses whatever the platform resolved
```

## 7. DatabaseAdapter port, adapters, packaging

### 7.1 The port (core, pure types)

```ts
// framework/src/gateway/DatabaseAdapter.ts  (ZERO runtime native/DOM imports)
export interface DatabaseAdapter {
  ensureCollection(resource: string): Promise<void>;        // idempotent
  get(resource: string, id: Id): Promise<Row | null>;       // absent -> null
  getAll(resource: string): Promise<Row[]>;                 // empty -> []
  query(resource: string, query: Query): Promise<Row[]>;    // no match -> []
  insert(resource: string, row: Row): Promise<Row>;         // dup id -> StorageError
  update(resource: string, id: Id, row: Row): Promise<Row>; // missing -> NotFoundError
  delete(resource: string, id: Id): Promise<void>;          // missing -> no-op
  transaction?<T>(fn: (tx: DatabaseAdapter) => Promise<T>): Promise<T>;  // optional; desktop defers (§11)
}
```

### 7.2 SqliteAdapter (desktop + mobile) — one class, two drivers

Document storage: `CREATE TABLE IF NOT EXISTS "<resource>" (id TEXT PRIMARY KEY,
doc TEXT NOT NULL)`. The adapter calls a `SqliteDriver` port
(`exec/run/all/get/tx?`); per-platform drivers differ (Bridge — no per-platform
adapter subclass). On first use it runs a **JSON1 capability probe**
(`SELECT json_extract('{"a":1}','$.a')`) and throws a typed `StorageError` if
absent. Identifier safety as in §6.1.

- **Desktop driver** — `better-sqlite3` runs **synchronously in the Electron MAIN
  process**, reached over the existing `@sublime-ui/desktop` native bridge (no new
  IPC channel) as a built-in `sqlite` native service (`defineNative`, alongside
  `fs`/`dialog`). The renderer driver adapts the proxy to `SqliteDriver` via a
  **hook-free `getNative<T>()`** accessor.
- **Mobile driver** — `expo-sqlite` async API (`openDatabaseAsync`/`runAsync`/
  `getAllAsync`/`getFirstAsync`/`withTransactionAsync`) — same SQL, real
  transactions.

### 7.3 IndexedDbAdapter (web)

ObjectStore per resource (`keyPath: 'id'`, native objects). Object stores can only
be created in a `versionchange` upgrade, so: **collect-then-open with an enforced
fast path** — `registerModel` calls `adapter.ensureCollection(resource)` at
registration time (required for the idb path) so all stores are buffered before
the DB opens once at v1 (common case: one open, zero reopens). A model registered
*after* first I/O (code-split) triggers a guarded `reopenWithBump()` (close +
reopen at v+1, I/O queued, multi-tab `versionchange` handled by `idb`'s
`blocked`/`blocking`). `query` runs `getAll()` + shared `applyQuery` for non-id
filters.

### 7.4 Library picks

| Platform | Pick | Caveat / mitigation |
|---|---|---|
| Desktop | **better-sqlite3** (Electron MAIN) | native module → `electron-rebuild` + `@electron-forge/plugin-auto-unpack-natives`; mark `external` in the Vite main build; **CI asserts `app.asar.unpacked` contains `better-sqlite3.node`** (mitigates electron/forge#3934) |
| Mobile | **expo-sqlite** (SDK 56) | JSON1 not formally advertised → startup probe; op-sqlite is the perf upgrade (needs prebuild) |
| Web | **idb** (~1–3 KB) | no query engine → shared `applyQuery` over a cursor scan; Dexie rejected (heavier; its schema model fights "no schema") |

Future swaps (documented, not in SP1): `node:sqlite`, `@libsql`, `op-sqlite`.

### 7.5 Packaging & DI

New workspace **`@sublime-ui/storage`** with per-platform entry points so native
deps stay out of the web bundle:

```jsonc
"exports": {
  ".":         "./dist/index.js",    // types + SqliteAdapter + applyQuery (pure) + createDatabaseAdapter resolver
  "./web":     "./dist/web.js",      // IndexedDbAdapter (idb)
  "./desktop": "./dist/desktop.js",  // SqliteAdapter + desktop driver
  "./mobile":  "./dist/mobile.js"    // SqliteAdapter + expo driver
}
```

Native libs are **optional peer dependencies**. Two additive changes to
`@sublime-ui/desktop` (included in SP1): (a) a hook-free `getNative<T>(name)`
factored out of `useNative`'s body into `@sublime-ui/desktop/client`; (b) a
`sqlite` built-in native service (main-only `better-sqlite3`) with a renderer-safe,
type-only contract export. Neither changes existing behaviour.

## 8. Cross-platform

The core stays plain TypeScript + React + Redux Toolkit — no RN/DOM/native
imports. Platform differences enter only through injected adapters and the
`createDatabaseAdapter()` resolver. The same model code runs on mobile, web, and
desktop; desktop reuses the web bundle and auto-upgrades to SQLite when the native
bridge is present.

## 9. Migration & back-compat (ship as 0.2.0)

**Breaking changes:** B1 default gateway REST→InMemory; B2 `ApiResponse`
internalized (removed from barrel, gateways return raw `Row`); B3 `ApiError`→
`HttpError` (runtime `.name`; value+type alias preserved); B4 `Model` no longer
reads `res.data`; B5 `registerModel` gains the `GatewayClass` overload (old 2-arg
preserved); B6 `Gateway` is an interface, REST class renamed `HttpGateway`; B7
Config HTTP fields optional (widening); B8 barrel additions; B9 `call()` requires
a request-capable gateway. All `@sublime-ui/*` are a fixed version group → all
bump to 0.2.0 together. Changeset `commit: false` (human commits).

**Test migration (same commit as the default flip, so CI never goes red),
verified against real files:**
- `ApiError.test.ts:13`, `http.test.ts:36`, `createModelSlice.test.ts:46` — `name` `'ApiError'`→`'HttpError'`; add `toBeInstanceOf(DataError)`.
- `http.test.ts` — "returns ApiResponse"/`res.data` → assert raw `res`; network case → `NetworkError`.
- `Gateway.test.ts` → rename `HttpGateway.test.ts`; `new Gateway('/users')` → `new HttpGateway(deps)` or drive via `registerModel`; URL/verb + `?storeId=7` assertions stay green; returned-value `res.data` → raw row.
- `Model.commands.test.ts:15`, `Model.rx.test.tsx:15`, `integration.test.ts:17` — add `HttpGateway` (these stub fetch / assert REST; `integration` also calls `User.expired()` which is `call()` → needs request-capable, else it fails twice under the default flip).
- `register.test.ts` — assert default `instanceof InMemoryGateway`; explicit → `HttpGateway`.
- `modelRegistry.test.ts:3,11` — `new Gateway(...)` → a minimal fake satisfying the interface, or `new HttpGateway(deps)`.
- `Config.test.ts` — 4-field config still valid; add `{platform:'web'}` succeeds and `getHttpConfig()`/`getDatabaseAdapter()` throw `ConfigError` when their deps are absent.

**Barrel (`index.ts`):** add the error tree + `ApiError` alias, gateway types
(`Gateway`, `Row`, `Id`, `RequestCapableGateway`, `isRequestCapable`),
`HttpGateway`/`InMemoryGateway`/`DbGateway`, `Query` + query types,
`DatabaseAdapter`, `getHttpConfig`/`getDatabaseAdapter`; remove the constructable
`Gateway` export; **keep `export type { ApiResponse }`** documented as
"HTTP-internal, not part of the Model data contract."

**Docs / devkit:** correct `docs/notes/framework-facts-brief.md` (in-memory
default; typed `DataError` tree; Gateway = pluggable strategy returning raw rows);
banner the #2 spec pointing here; update `core-concepts/models.md` + the new
framework Model page (task #8); devkit scaffold keeps `registerModel(Task)` (now
in-memory = friendly starter) + a comment, and its generator snapshot tests
update.

## 10. Testing

Existing TDD discipline. **New tests:** (1) error-tree shape + `instanceof` +
`new.target` fix; (2) `ApiError` alias; (3) serialization carve-out for a
`NetworkError` in `slice.error`; (4) Config optionality + `ConfigError`; (5)
default → `InMemoryGateway`; (6) explicit gateway + overload disambiguation; (7)
HttpGateway requires `baseURL`; (8) `find/show → null` on absence per gateway, **no
error dispatched**; (9) typed-error throwing per gateway; (10) **update-of-missing
throws `NotFoundError` uniformly** across in-memory + fake SqliteDriver +
fake-indexeddb; (11) `call()` on a non-request-capable gateway rejects
`DataError{code:'unsupported'}`; (12) mixed-backend app (HTTP `User` + in-memory
`Note` in one store; missing `databaseAdapter` doesn't break them); (13)
**Query conformance fixture** (~15 `{query, expectedIds}` cases) across in-memory +
SQLite + idb, REST via `toQueryString` snapshots — **CI gate**; (14) IndexedDB
versionchange (all-registered-first = 0 reopens; lazy = 1 reopen, no data loss);
(15) id round-trip (UUID in-memory + numeric HTTP).

**CI infra:** ESLint/grep that `framework/src/**` has no native/DOM imports;
packaged-desktop assertion that `app.asar.unpacked` contains `better-sqlite3.node`
and it's `external` in the Vite main build; the SQLite JSON1 startup probe.

## 11. Scope boundaries (YAGNI)

**In SP1:** the `Gateway` interface + three implementations; `GatewayDeps`/Factory;
`DataError` tree; `Query` + translation to all four backends + shared evaluator;
`DatabaseAdapter` port + Sqlite (desktop via native bridge + mobile) + IndexedDB
adapters; `@sublime-ui/storage` package + `createDatabaseAdapter()` platform
auto-select; Config changes; `registerModel` overloads + in-memory default; full
migration + the test suite above.

**Not in SP1 (later SPs / deferred):** caching/TTL/staleness/invalidation (SP2);
optimistic updates, validation rules, per-field server errors, PATCH/dirty-tracking
(SP3); relationships/eager loading (SP4); pagination metadata — the `Query` shape
is forward-compatible (SP5); offline queue, retry/backoff, cancellation, sync (SP6);
OR/nested query groups, dotted paths, typed secondary indexes, projection; an
opt-in "persist in-memory to `storageAdapter`"; desktop multi-statement
`transaction` (the port's `transaction?` is optional; desktop leaves it
unimplemented and `DbGateway` falls back to sequential awaits — a future
`sqlite.batch()` over one IPC adds it).

## 12. Decisions log

1. **Boundary contract:** gateways return raw rows; `HttpGateway` unwraps the envelope.
2. **Errors:** neutral `DataError` tree, always thrown for real failures, never silent null.
3. **Absence:** `find/show → null`; failures throw.
4. **Strategies:** in-memory (default) · DB · REST, chosen per model.
5. **Registration:** `registerModel(Model, GatewayClass?, opts?)`, default `InMemoryGateway`.
6. **Gateway construction:** `new GatewayClass(deps: GatewayDeps)` bundle.
7. **Storage:** document JSON, no runtime schema; SQLite `(id, doc)` + `json_extract`, IndexedDB native object stores.
8. **update-of-missing:** throws `NotFoundError` uniformly.
9. **Adapter selection:** auto by platform via `createDatabaseAdapter()` (+ desktop runtime bridge detection).
10. **Desktop SQLite:** included in SP1 (adds `getNative` + `sqlite` service to `@sublime-ui/desktop`).

Open (with recommended defaults, confirm at review): in-memory persistence across
reloads — **defer** (keep in-memory ephemeral); desktop multi-statement
transactions — **defer** to a later SP.

## 13. Acceptance criteria

- `registerModel(M)` wires in-memory; `registerModel(M, HttpGateway)` REST; `registerModel(M, DbGateway)` local DB — all with identical `Model`/`rx` surfaces.
- A model's `all/find/save/delete` work against in-memory, SQLite (desktop + mobile), and IndexedDB (web) with the **same** behaviour; the Query conformance fixture passes across all backends.
- `find/show` return `null` on genuine absence; every real failure throws a typed `DataError`; `update`-of-missing throws `NotFoundError` everywhere.
- The DB adapter is auto-selected by platform from one `createDatabaseAdapter()` call; desktop auto-upgrades to SQLite via the native bridge; the web bundle contains no `better-sqlite3`/`expo-sqlite`.
- A mixed-backend app (HTTP + DB + in-memory models) works with only the config each backend needs.
- `npm run typecheck`, `lint`, `test`, `build` green across the monorepo; core has no RN/DOM/native imports (CI-enforced); the suite migrates in one commit with no red CI.
