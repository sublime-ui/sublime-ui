/**
 * Hook-free accessor for a native service.
 *
 * The non-React twin of {@link useNative}: it reads the same
 * `globalThis.sublimeNative` bridge exposed by the preload and returns the same
 * typed {@link createProxy}, or `null` on plain web where no bridge ran. Use it
 * outside React — e.g. the `@sublime-ui/storage` desktop SQLite driver adapts
 * `getNative('sqlite')` to its driver port. `useNative` delegates here so the
 * proxy/error-revival semantics are defined in exactly one place.
 */

import { createProxy } from './bridge/proxy.js';
import { deserializeError } from './errors.js';
import type { SerializedError } from './errors.js';
import type { NativeMethods } from './types.js';

/** Shape of the bridge exposed at `globalThis.sublimeNative` by the preload. */
interface SublimeNativeWindow {
  invoke(mod: string, method: string, args: unknown[]): Promise<unknown>;
}

/** Envelope shape returned by the main router when a native call fails. */
interface NativeErrorEnvelope {
  __nativeError: SerializedError;
}

function isNativeErrorEnvelope(value: unknown): value is NativeErrorEnvelope {
  return typeof value === 'object' && value !== null && '__nativeError' in value;
}

/**
 * Access a native service by name without a React hook.
 *
 * @typeParam M the service's method map (from the `defineNative` author).
 * @param name  the registry key of the native service (e.g. `'sqlite'`).
 * @returns a typed proxy, or `null` when running outside the Electron shell.
 */
export function getNative<M extends NativeMethods>(name: string): M | null {
  const bridge = (globalThis as { sublimeNative?: SublimeNativeWindow }).sublimeNative;
  if (bridge === undefined) {
    return null;
  }
  return createProxy<M>(name, async (mod, method, args) => {
    const result = await bridge.invoke(mod, method, args);
    if (isNativeErrorEnvelope(result)) {
      throw deserializeError(result.__nativeError);
    }
    return result;
  });
}
