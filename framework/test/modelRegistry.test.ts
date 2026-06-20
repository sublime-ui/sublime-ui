import { describe, it, expect } from 'vitest';
import { modelRegistry } from '../src/discovery/modelRegistry.js';
import { HttpGateway } from '../src/gateway/HttpGateway.js';
import { createModelSlice } from '../src/store/createModelSlice.js';
import { store } from '../src/store/store.js';

class Thing {}

describe('modelRegistry', () => {
  it('registers and resolves a model registration', () => {
    const slice = createModelSlice('things', { idKey: 'id' });
    const gateway = new HttpGateway({
      resource: '/things',
      idKey: 'id',
      sliceName: 'things',
      actions: slice.actions,
      store,
    });
    const reg = { gateway, sliceName: 'things', actions: slice.actions, idKey: 'id' };
    modelRegistry.register(Thing, reg);
    expect(modelRegistry.resolve(Thing)).toBe(reg);
  });

  it('throws for an unregistered model', () => {
    class Unknown {}
    expect(() => modelRegistry.resolve(Unknown)).toThrow(/not registered/i);
  });
});
