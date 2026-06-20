import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { InMemoryGateway } from '../src/gateway/InMemoryGateway.js';
import { createModelSlice } from '../src/store/createModelSlice.js';
import { NotFoundError } from '../src/errors/index.js';
import type { GatewayDeps } from '../src/gateway/GatewayDeps.js';
import type { Row } from '../src/gateway/Gateway.js';

// Builds a real, isolated Redux store holding one model slice named `notes`,
// then a GatewayDeps bundle pointing the gateway at that slice. The gateway must
// read state via deps.store.getState()[deps.sliceName].items — never a singleton.
function harness(seed: Row[] = []) {
  const slice = createModelSlice('notes', { idKey: 'id' });
  const store = configureStore({ reducer: { notes: slice.reducer } });
  if (seed.length) store.dispatch(slice.actions.setItems(seed));
  const deps: GatewayDeps = {
    resource: 'notes',
    idKey: 'id',
    sliceName: 'notes',
    actions: slice.actions,
    store,
  };
  const gateway = new InMemoryGateway(deps);
  const items = () => (store.getState().notes as { items: Row[] }).items;
  return { slice, store, deps, gateway, items };
}

describe('InMemoryGateway', () => {
  let h: ReturnType<typeof harness>;
  beforeEach(() => {
    h = harness([
      { id: '1', title: 'alpha', pinned: true },
      { id: '2', title: 'beta', pinned: false },
      { id: '3', title: 'gamma', pinned: true },
    ]);
  });

  it('index() with no query returns a defensive copy of every slice item', async () => {
    const rows = await h.gateway.index();
    expect(rows).toEqual([
      { id: '1', title: 'alpha', pinned: true },
      { id: '2', title: 'beta', pinned: false },
      { id: '3', title: 'gamma', pinned: true },
    ]);
    expect(rows).not.toBe(h.items());
  });

  it('index() with an empty slice returns []', async () => {
    const empty = harness();
    expect(await empty.gateway.index()).toEqual([]);
  });

  it('index(query) delegates filtering to applyQuery', async () => {
    const rows = await h.gateway.index({ filters: [{ field: 'pinned', op: 'eq', value: true }] });
    expect(rows.map((r) => r.id)).toEqual(['1', '3']);
  });

  it('show() returns the matching row by idKey', async () => {
    expect(await h.gateway.show('2')).toEqual({ id: '2', title: 'beta', pinned: false });
  });

  it('show() returns null for a genuinely absent id (not an error)', async () => {
    expect(await h.gateway.show('999')).toBeNull();
  });

  it('create() assigns a generated string id when body has none, and returns the row', async () => {
    const created = await h.gateway.create({ title: 'delta', pinned: false });
    expect(typeof created.id).toBe('string');
    expect((created.id as string).length).toBeGreaterThan(0);
    expect(created).toMatchObject({ title: 'delta', pinned: false });
  });

  it('create() honors a developer-supplied id', async () => {
    const created = await h.gateway.create({ id: 'custom', title: 'epsilon' });
    expect(created.id).toBe('custom');
  });

  it('create() does NOT write the slice itself (Model is the single writer)', async () => {
    const before = h.items().length;
    await h.gateway.create({ title: 'zeta' });
    expect(h.items().length).toBe(before);
  });

  it('update() returns the merged row, keeping the id', async () => {
    const updated = await h.gateway.update('2', { title: 'beta!' });
    expect(updated).toEqual({ id: '2', title: 'beta!', pinned: false });
  });

  it('update() throws NotFoundError for a missing id', async () => {
    await expect(h.gateway.update('999', { title: 'x' })).rejects.toBeInstanceOf(NotFoundError);
    await expect(h.gateway.update('999', { title: 'x' })).rejects.toMatchObject({
      resource: 'notes',
      id: '999',
    });
  });

  it('destroy() resolves to a no-op (Model dispatches removeItem)', async () => {
    const before = h.items().length;
    await expect(h.gateway.destroy('1')).resolves.toBeUndefined();
    expect(h.items().length).toBe(before);
  });
});
