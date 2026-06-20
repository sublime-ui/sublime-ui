import { describe, it, expect, vi } from 'vitest';
import { registerModel } from '../src/register.js';
import { modelRegistry } from '../src/discovery/modelRegistry.js';
import { store } from '../src/store/store.js';
import { InMemoryGateway } from '../src/gateway/InMemoryGateway.js';
import { HttpGateway } from '../src/gateway/HttpGateway.js';
import { DbGateway } from '../src/gateway/DbGateway.js';
import { configureSublime, resetConfig } from '../src/config/Config.js';
import type { DatabaseAdapter } from '../src/gateway/DatabaseAdapter.js';

class Invoice {
  static resource = '/invoices';
}
class Receipt {
  static resource = '/receipts';
}

describe('registerModel', () => {
  it('wires gateway + slice + reducer + discovery', () => {
    registerModel(Invoice as unknown as { name: string; resource?: string });
    const reg = modelRegistry.resolve(Invoice);
    expect(reg.sliceName).toBe('invoices');
    expect(reg.idKey).toBe('id');
    // reducer is registered → store has the slice after a dispatch
    store.dispatch(reg.actions.setItems([{ id: 1 }]));
    const state = store.getState() as Record<string, { items: unknown[] }>;
    expect(state['invoices']!.items).toEqual([{ id: 1 }]);
  });

  it('defaults to an InMemoryGateway when no gateway class is given', () => {
    registerModel(Invoice as unknown as { name: string; resource?: string });
    expect(modelRegistry.resolve(Invoice).gateway).toBeInstanceOf(InMemoryGateway);
  });

  it('uses the explicit HttpGateway when passed', () => {
    registerModel(Receipt as unknown as { name: string; resource?: string }, HttpGateway);
    expect(modelRegistry.resolve(Receipt).gateway).toBeInstanceOf(HttpGateway);
  });

  it('still accepts an options object as the 2nd arg (overload disambiguation)', () => {
    class Ledger {
      static resource = '/ledgers';
    }
    registerModel(Ledger as unknown as { name: string; resource?: string }, { idKey: 'uuid' });
    const reg = modelRegistry.resolve(Ledger);
    expect(reg.idKey).toBe('uuid');
    expect(reg.gateway).toBeInstanceOf(InMemoryGateway);
  });

  it('throws when resource is missing', () => {
    class NoResource {}
    expect(() =>
      registerModel(NoResource as unknown as { name: string; resource?: string }),
    ).toThrow(/resource/i);
  });

  it('registerModel(M, DbGateway) with a configured databaseAdapter calls ensureCollection(resource)', () => {
    const ensureCollection = vi.fn(async () => {});
    const adapter: DatabaseAdapter = {
      ensureCollection,
      get: async () => null,
      getAll: async () => [],
      query: async () => [],
      insert: async (_r, row) => row,
      update: async (_r, _id, row) => row,
      delete: async () => {},
    };
    resetConfig();
    configureSublime({ platform: 'web', databaseAdapter: adapter });

    class Photo {
      static resource = '/photos';
    }
    registerModel(Photo as unknown as { name: string; resource?: string }, DbGateway);

    expect(modelRegistry.resolve(Photo).gateway).toBeInstanceOf(DbGateway);
    expect(ensureCollection).toHaveBeenCalledWith('/photos');
  });
});
