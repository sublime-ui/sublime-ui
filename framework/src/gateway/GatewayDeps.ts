import type { Store } from '@reduxjs/toolkit';
import type { Gateway } from './Gateway.js';
import type { ModelSlice } from '../store/createModelSlice.js';

/**
 * The dependency bundle the framework hands every gateway at construction.
 * Passing `store` lets InMemoryGateway read its slice with NO global-singleton
 * import and NO registry round-trip, and keeps construction uniform across all
 * three strategies.
 */
export interface GatewayDeps {
  resource: string; // table/collection name; URL path for HttpGateway only
  idKey: string; // primary-key field (default 'id')
  sliceName: string;
  actions: ModelSlice['actions'];
  store: Store; // InMemoryGateway reads via this; never imports the singleton
}

/** The Factory signature registerModel uses to instantiate a gateway strategy. */
export type GatewayClass = new (deps: GatewayDeps) => Gateway;
