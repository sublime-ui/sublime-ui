// framework/src/gateway/InMemoryGateway.ts
import type { Gateway, Row, Id } from './Gateway.js';
import type { GatewayDeps } from './GatewayDeps.js';
import type { Query } from './Query.js';
import { applyQuery } from './queryMatch.js';
import { genId } from './genId.js';
import { NotFoundError } from '../errors/index.js';

/**
 * Default storage strategy. The model's Redux slice is the source of truth.
 *
 * Reads come straight from the injected store
 * (`deps.store.getState()[deps.sliceName].items`) — NEVER from the global store
 * singleton, so the gateway is testable with any configureStore() and honors
 * the single-writer rule (§5.2): writes only COMPUTE and return rows; `Model`
 * dispatches `setItems`/`upsertItem`/`removeItem` to commit them.
 */
export class InMemoryGateway implements Gateway {
  constructor(private readonly deps: GatewayDeps) {}

  private items(): Row[] {
    const state = this.deps.store.getState() as Record<
      string,
      { items: Row[] } | undefined
    >;
    return state[this.deps.sliceName]?.items ?? [];
  }

  async index(query?: Query): Promise<Row[]> {
    const rows = this.items();
    return query ? applyQuery(rows, query) : rows.map((r) => ({ ...r }));
  }

  async show(id: Id): Promise<Row | null> {
    const key = this.deps.idKey;
    return this.items().find((r) => r[key] === id) ?? null;
  }

  async create(body: Row): Promise<Row> {
    const key = this.deps.idKey;
    return { ...body, [key]: body[key] ?? genId() };
  }

  async update(id: Id, body: Row): Promise<Row> {
    const key = this.deps.idKey;
    const current = this.items().find((r) => r[key] === id);
    if (!current) {
      throw new NotFoundError(`${this.deps.resource}#${id} not found`, {
        resource: this.deps.resource,
        id,
      });
    }
    return { ...current, ...body, [key]: id };
  }

  async destroy(_id: Id): Promise<void> {
    // No-op: Model.delete dispatches removeItem (Model.ts:110). The slice is the
    // source of truth, so there is nothing for the gateway to persist.
  }
}
