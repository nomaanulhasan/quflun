import * as kdbxweb from 'kdbxweb';
import { initArgon2 } from './argon2-init';

/**
 * Interface for cryptographic operations wrapping kdbxweb.
 */
export interface CryptoAdapter {
  initialize(): Promise<void>;
  createDatabase(password: string, name: string): Promise<kdbxweb.Kdbx>;
  loadDatabase(buffer: ArrayBuffer, password: string): Promise<kdbxweb.Kdbx>;
  saveDatabase(db: kdbxweb.Kdbx): Promise<ArrayBuffer>;
  generateRandom(length: number): Uint8Array;
}

/**
 * Implementation of the CryptoAdapter interface using kdbxweb + argon2-browser.
 */
class CryptoAdapterImpl implements CryptoAdapter {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await initArgon2();
    this.initialized = true;
  }

  // C-1 fix: Ensure Argon2 is registered before any KDBX operation
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async createDatabase(password: string, name: string): Promise<kdbxweb.Kdbx> {
    await this.ensureInitialized(); // C-1 fix

    const credentials = new kdbxweb.Credentials(kdbxweb.ProtectedValue.fromString(password));
    const db = kdbxweb.Kdbx.create(credentials, name);

    // Configure Argon2id parameters: 64 MB memory, 2 iterations, 1 parallelism
    const kdfParams = db.header.kdfParameters;
    if (kdfParams) {
      kdfParams.set(
        'M',
        kdbxweb.VarDictionary.ValueType.UInt64,
        kdbxweb.Int64.from(64 * 1024 * 1024)
      );
      kdfParams.set('I', kdbxweb.VarDictionary.ValueType.UInt64, kdbxweb.Int64.from(2));
      kdfParams.set('P', kdbxweb.VarDictionary.ValueType.UInt32, 1);
    }

    return db;
  }

  async loadDatabase(buffer: ArrayBuffer, password: string): Promise<kdbxweb.Kdbx> {
    await this.ensureInitialized(); // C-1 fix

    const credentials = new kdbxweb.Credentials(kdbxweb.ProtectedValue.fromString(password));
    const db = await kdbxweb.Kdbx.load(buffer, credentials);
    return db;
  }

  async saveDatabase(db: kdbxweb.Kdbx): Promise<ArrayBuffer> {
    const buffer = await db.save();
    return buffer;
  }

  generateRandom(length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
  }
}

/** Singleton crypto adapter instance */
export const cryptoAdapter: CryptoAdapter = new CryptoAdapterImpl();
