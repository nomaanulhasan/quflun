/**
 * Runtime service initialization.
 *
 * Lazily loads crypto, storage, and vault engine services at runtime.
 * This module is imported dynamically from providers.tsx inside a useEffect,
 * meaning it only executes in the browser after hydration.
 *
 * The dynamic imports below are standard — no eval or Function() hacks.
 * Turbopack may trace these imports, but since argon2-browser is listed in
 * serverExternalPackages and the actual execution only happens client-side
 * inside useEffect, the Node.js-only code paths in argon2-browser are never
 * reached during SSR/prerendering.
 */

import type { VaultEngine } from '@/lib/vault-engine';
import type { StorageAdapter } from '@/lib/storage';

export interface RuntimeServices {
  engine: VaultEngine;
  storage: StorageAdapter;
}

let services: RuntimeServices | null = null;
let initPromise: Promise<RuntimeServices> | null = null;

/**
 * Lazily initializes and returns the runtime services.
 * Safe to call multiple times — returns the same instance.
 */
export function getServices(): Promise<RuntimeServices> {
  if (services) return Promise.resolve(services);
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const [cryptoMod, storageMod, engineMod] = await Promise.all([
      import('@/lib/crypto/crypto-adapter'),
      import('@/lib/storage/storage-adapter'),
      import('@/lib/vault-engine/vault-engine'),
    ]);

    const storage = new storageMod.StorageAdapterImpl();
    const engine = engineMod.createVaultEngine(cryptoMod.cryptoAdapter, storage);

    services = { engine, storage };
    return services;
  })();

  return initPromise;
}
