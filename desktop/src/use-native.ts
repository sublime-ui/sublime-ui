/**
 * Renderer hook for consuming a native service from React.
 *
 * `useNative('fs')` reads the `window.sublimeNative` bridge exposed by the
 * preload (see `exposeNativeBridge`). On plain web — where no preload ran and
 * the bridge is absent — it returns `null`, letting components gracefully
 * degrade. Inside the Electron shell it returns a typed {@link createProxy}
 * whose `invoke` forwards over the one `native:invoke` channel and revives any
 * `{ __nativeError }` envelope (produced by the main router) back into a
 * {@link NativeError} so the caller sees a normal rejected promise.
 */

import { getNative } from './get-native.js';
import type { NativeMethods } from './types.js';

/**
 * Access a native service by name from the renderer.
 *
 * Thin React-facing wrapper over {@link getNative}: it returns the same typed
 * proxy (or `null` outside the Electron shell). The proxy is created on every
 * render but is cheap and stateless, so callers can use it directly.
 *
 * @typeParam M the service's method map (from the `defineNative` author).
 * @param name  the registry key of the native service (e.g. `'fs'`).
 * @returns a typed proxy, or `null` when running outside the Electron shell.
 */
export function useNative<M extends NativeMethods>(name: string): M | null {
  return getNative<M>(name);
}
