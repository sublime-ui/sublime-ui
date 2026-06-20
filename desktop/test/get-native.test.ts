import { afterEach, describe, it, expect, vi } from 'vitest';
import { getNative } from '../src/get-native';
import { NativeError, serializeError } from '../src/errors';

type Fs = {
  readFile: (path: string) => Promise<string>;
};

afterEach(() => {
  delete (globalThis as unknown as { sublimeNative?: unknown }).sublimeNative;
});

describe('getNative (hook-free)', () => {
  it('returns null on plain web (no globalThis.sublimeNative)', () => {
    expect(getNative<Fs>('fs')).toBeNull();
  });

  it('forwards calls through the bridge invoke', async () => {
    const invoke = vi.fn().mockResolvedValue('contents');
    (globalThis as unknown as { sublimeNative: { invoke: typeof invoke } }).sublimeNative = {
      invoke,
    };

    const proxy = getNative<Fs>('fs');
    expect(proxy).not.toBeNull();
    await expect(proxy!.readFile('/a.txt')).resolves.toBe('contents');
    expect(invoke).toHaveBeenCalledWith('fs', 'readFile', ['/a.txt']);
  });

  it('rethrows a {__nativeError} envelope as a NativeError', async () => {
    const envelope = {
      __nativeError: serializeError(
        Object.assign(new Error('boom'), { code: 'ENOENT' }),
      ),
    };
    const invoke = vi.fn().mockResolvedValue(envelope);
    (globalThis as unknown as { sublimeNative: { invoke: typeof invoke } }).sublimeNative = {
      invoke,
    };

    const proxy = getNative<Fs>('fs');
    await expect(proxy!.readFile('/missing.txt')).rejects.toBeInstanceOf(NativeError);
    await expect(proxy!.readFile('/missing.txt')).rejects.toMatchObject({
      message: 'boom',
      code: 'ENOENT',
    });
  });
});
