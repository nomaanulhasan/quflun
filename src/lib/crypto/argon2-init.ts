import * as kdbxweb from 'kdbxweb';

/**
 * Registers the Argon2 implementation with kdbxweb's CryptoEngine.
 * Must be called before any KDBX operations that require key derivation.
 */
export async function initArgon2(): Promise<void> {
  const argon2 = await import('argon2-browser');
  const argon2Module = argon2.default || argon2;

  // C-2 fix: Verify the module loaded correctly before registration
  if (typeof argon2Module.hash !== 'function') {
    throw new Error(
      'argon2-browser failed to load correctly: hash function not found'
    );
  }

  kdbxweb.CryptoEngine.setArgon2Impl(
    async (
      password: ArrayBuffer,
      salt: ArrayBuffer,
      memory: number, // mem: KiB (matches KDBX format, matches argon2-browser API)
      iterations: number,
      length: number,
      parallelism: number,
      type: 0 | 2, // H-1 fix: Use literal union matching kdbxweb's Argon2Type
      version: 0x10 | 0x13 // H-1 fix: Use literal union matching kdbxweb's Argon2Version
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
      // M-1 fix: Create a clean copy to avoid returning a view into a larger backing buffer
      return new Uint8Array(result.hash).buffer as ArrayBuffer;
    }
  );
}
