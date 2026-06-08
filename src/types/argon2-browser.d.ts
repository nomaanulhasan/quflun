declare module 'argon2-browser' {
  interface Argon2HashOptions {
    pass: Uint8Array | string;
    salt: Uint8Array | string;
    time: number;
    mem: number;
    hashLen: number;
    parallelism: number;
    type: number;
    version: number; // H-2 fix: version is always required (kdbxweb always passes it)
  }

  interface Argon2HashResult {
    hash: Uint8Array;
    hashHex: string;
    encoded: string;
  }

  interface Argon2 {
    hash(options: Argon2HashOptions): Promise<Argon2HashResult>;
  }

  const argon2: Argon2;
  export default argon2;
}
