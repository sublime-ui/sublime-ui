/**
 * Built-in native services barrel.
 *
 * Re-exports the five batteries-included services authored with
 * `defineNative` in the main process. Register the ones an app needs via
 * `registerNative([...])`, then consume them in the renderer with `useNative`.
 */

export { fs } from './fs.js';
export { dialog } from './dialog.js';
export { shell } from './shell.js';
export { clipboard } from './clipboard.js';
export { notifications, type NotifyOptions } from './notifications.js';
