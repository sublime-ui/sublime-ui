import { createModelSlice } from './store/createModelSlice.js';
import { registerReducer, store } from './store/store.js';
import { modelRegistry } from './discovery/modelRegistry.js';
import type { GatewayClass, GatewayDeps } from './gateway/GatewayDeps.js';
import { InMemoryGateway } from './gateway/InMemoryGateway.js';
import { DbGateway } from './gateway/DbGateway.js';
import { getConfig } from './config/Config.js';

interface RegisterOpts {
  name?: string;
  idKey?: string;
}

// Accepts a Model subclass. `resource` is read internally; it is intentionally
// not part of this type so subclasses can keep it `protected static` without a
// public/protected mismatch.
type ModelLike = { name: string };

export function registerModel(
  ModelClass: ModelLike,
  gateway: GatewayClass,
  opts?: RegisterOpts,
): void;
export function registerModel(ModelClass: ModelLike, opts?: RegisterOpts): void;
export function registerModel(
  ModelClass: ModelLike,
  arg2?: GatewayClass | RegisterOpts,
  arg3?: RegisterOpts,
): void {
  // A class is callable (typeof === 'function'); an options object is not.
  const GatewayCtor: GatewayClass =
    typeof arg2 === 'function' ? arg2 : InMemoryGateway;
  const opts: RegisterOpts =
    typeof arg2 === 'function' ? arg3 ?? {} : arg2 ?? {};

  const resource = (ModelClass as { resource?: string }).resource;
  if (!resource) {
    throw new Error(
      `Model "${ModelClass.name}" is missing a static "resource" (e.g. protected static resource = '/users').`,
    );
  }
  const sliceName = opts.name ?? `${ModelClass.name.toLowerCase()}s`;
  const idKey = opts.idKey ?? 'id';

  const slice = createModelSlice(sliceName, { idKey });
  registerReducer(slice.name, slice.reducer);

  const deps: GatewayDeps = {
    resource,
    idKey,
    sliceName,
    actions: slice.actions,
    store,
  };
  const gateway = new GatewayCtor(deps);

  if (GatewayCtor === DbGateway && getConfig().databaseAdapter !== undefined) {
    void getConfig().databaseAdapter!.ensureCollection(resource);
  }

  modelRegistry.register(ModelClass as unknown as abstract new (...args: never[]) => object, {
    gateway,
    sliceName,
    actions: slice.actions,
    idKey,
  });
}
