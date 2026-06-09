import * as kdbxweb from 'kdbxweb';

/**
 * Registers the Argon2 implementation with kdbxweb's CryptoEngine.
 *
 * argon2-browser's WASM loading checks these paths in order:
 * 1. global.loadArgon2WasmBinary() ← we use this
 * 2. require('../dist/argon2.wasm') → atob() ← broken in webpack bundles
 * 3. fetch(global.argon2WasmPath) ← never reached if require exists
 *
 * We set loadArgon2WasmBinary to a function that fetches the WASM file
 * from the asset path where webpack placed it.
 */
export async function initArgon2(): Promise<void> {
  // Provide custom WASM loader — checked first by argon2-browser,
  // bypasses the broken require() → atob() path in webpack bundles.
  (globalThis as Record<string, unknown>).loadArgon2WasmBinary = async () => {
    const response = await fetch('/_next/static/wasm/argon2.wasm');
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  };

  const argon2 = await import('argon2-browser');
  const argon2Module = argon2.default || argon2;

  if (typeof argon2Module.hash !== 'function') {
    throw new Error(
      'argon2-browser failed to load correctly: hash function not found'
    );
  }

  kdbxweb.CryptoEngine.setArgon2Impl(
    async (
      password: ArrayBuffer,
      salt: ArrayBuffer,
      memory: number,
      iterations: number,
      length: number,
      parallelism: number,
      type: 0 | 2,
      version: 0x10 | 0x13
    ): Promise<ArrayBuffer> => {
      const result = await argon2Module.hash({
        pass: new Uint8Array(password),
        salt: new Uint8Array(salt),
        time: iterations,
        mem: memory,
        hashLen: length,
        parallelism,
        type,
        version,
      });
      return new Uint8Array(result.hash).buffer as ArrayBuffer;
    }
  );
}
