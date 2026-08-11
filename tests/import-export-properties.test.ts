// @vitest-environment node
/**
 * Property-based tests for Import/Export and Health Check (Tasks 8.4–8.8)
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeAll } from 'vitest';
import { vi } from 'vitest';
import * as fc from 'fast-check';
import * as kdbxweb from 'kdbxweb';
import { importKdbx, exportKdbx } from '@/lib/import-export/kdbx-handler';
import { importCsv, exportCsv } from '@/lib/import-export/csv-handler';
import { createVaultHealthCheck } from '@/lib/vault-engine/health-check';
import type { CsvExportEntry } from '@/lib/import-export/csv-handler';

vi.mock('@/lib/crypto/argon2-init', () => ({
  initArgon2: vi.fn().mockResolvedValue(undefined),
}));

async function registerTestArgon2(): Promise<void> {
  const { createHash } = await import('node:crypto');
  kdbxweb.CryptoEngine.setArgon2Impl(
    async (
      password: ArrayBuffer,
      salt: ArrayBuffer,
      _memory: number,
      _iterations: number,
      length: number,
      _parallelism: number,
      _type: number,
      _version: number
    ): Promise<ArrayBuffer> => {
      const hash = createHash('sha512');
      hash.update(new Uint8Array(password));
      hash.update(new Uint8Array(salt));
      const result = hash.digest();
      const output = new Uint8Array(length);
      output.set(result.subarray(0, Math.min(result.length, length)));
      return output.buffer as ArrayBuffer;
    }
  );
}

async function getCryptoAdapter() {
  const { cryptoAdapter } = await import('@/lib/crypto/crypto-adapter');
  return cryptoAdapter;
}

async function createTestDb(name: string, password = 'test-pass'): Promise<kdbxweb.Kdbx> {
  const credentials = new kdbxweb.Credentials(kdbxweb.ProtectedValue.fromString(password));
  return kdbxweb.Kdbx.create(credentials, name);
}

describe(
  'Property Tests — Import/Export & Health Check (Tasks 8.4–8.8)',
  { timeout: 60_000 },
  () => {
    beforeAll(async () => {
      await registerTestArgon2();
    });

    // ─── Property 12: KDBX export-import round-trip (Task 8.4) ──────────────────

    describe('Property 12: KDBX export-import round-trip', () => {
      it('entries exported then imported into empty vault produce matching data', async () => {
        const crypto = await getCryptoAdapter();

        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.string({ minLength: 0, maxLength: 30 }),
            fc.string({ minLength: 1, maxLength: 30 }),
            fc.string({ minLength: 0, maxLength: 50 }),
            async (title, username, password, url) => {
              const sourceDb = await createTestDb('Source', 'pw');
              const group = sourceDb.getDefaultGroup();
              const entry = sourceDb.createEntry(group);
              entry.fields.set('Title', title);
              entry.fields.set('UserName', username);
              entry.fields.set('Password', kdbxweb.ProtectedValue.fromString(password));
              entry.fields.set('URL', url);

              const buffer = await exportKdbx(sourceDb);
              const targetDb = await createTestDb('Target');
              const result = await importKdbx(targetDb, buffer, 'pw', crypto);

              expect(result.imported).toBe(1);

              const entries = [...targetDb.getDefaultGroup().allEntries()];
              expect(entries.length).toBe(1);
              expect(entries[0].fields.get('Title')).toBe(title);
              expect(entries[0].fields.get('UserName')).toBe(username);
              expect((entries[0].fields.get('Password') as kdbxweb.ProtectedValue).getText()).toBe(
                password
              );
              expect(entries[0].fields.get('URL')).toBe(url);
            }
          ),
          { numRuns: 5 }
        );
      });
    });

    // ─── Property 13: KDBX import merge by UUID (Task 8.5) ─────────────────────

    describe('Property 13: KDBX import merge by UUID', () => {
      it('importing the same file twice does not create duplicates', async () => {
        const crypto = await getCryptoAdapter();

        await fc.assert(
          fc.asyncProperty(fc.string({ minLength: 1, maxLength: 30 }), async (title) => {
            const sourceDb = await createTestDb('Source', 'pw');
            const entry = sourceDb.createEntry(sourceDb.getDefaultGroup());
            entry.fields.set('Title', title);
            entry.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw'));

            const buffer = await sourceDb.save();
            const targetDb = await createTestDb('Target');

            // First import
            const r1 = await importKdbx(targetDb, buffer, 'pw', crypto);
            expect(r1.imported).toBe(1);

            // Second import — should skip (dedup via _quflun_source_uuid)
            const r2 = await importKdbx(targetDb, buffer, 'pw', crypto);
            expect(r2.imported).toBe(0);
            expect(r2.skipped.length).toBe(1);

            // Only one entry in target
            const entries = [...targetDb.getDefaultGroup().allEntries()];
            expect(entries.length).toBe(1);
          }),
          { numRuns: 5 }
        );
      });
    });

    // ─── Property 14: CSV import correctness (Task 8.6) ─────────────────────────

    describe('Property 14: CSV import correctness', () => {
      // Generate valid CSV data without special chars, and pre-trimmed
      const safeString = fc
        .string({ minLength: 1, maxLength: 30 })
        .map((s) => s.replace(/[,"\n\r]/g, '').trim())
        .filter((s) => s.length > 0);

      it('valid CSV rows produce correct parsed entries', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                title: safeString,
                username: safeString,
                password: safeString,
                url: safeString,
              }),
              { minLength: 1, maxLength: 10 }
            ),
            (rows) => {
              const header = 'title,username,password,url';
              const csvLines = rows.map((r) => `${r.title},${r.username},${r.password},${r.url}`);
              const csv = [header, ...csvLines].join('\n');

              const { rows: parsed, result } = importCsv(csv);

              expect(result.imported).toBe(rows.length);
              expect(parsed.length).toBe(rows.length);

              for (let i = 0; i < rows.length; i++) {
                expect(parsed[i].title).toBe(rows[i].title);
                expect(parsed[i].username).toBe(rows[i].username);
                expect(parsed[i].password).toBe(rows[i].password);
                expect(parsed[i].url).toBe(rows[i].url);
              }
            }
          ),
          { numRuns: 10 }
        );
      });

      it('rows with empty title or password are always skipped', () => {
        const safeStr = fc
          .string({ minLength: 1, maxLength: 20 })
          .map((s) => s.replace(/[,"\n\r]/g, '').trim())
          .filter((s) => s.length > 0);

        fc.assert(
          fc.property(safeStr, safeStr, (username, url) => {
            // Missing title
            const csv1 = `title,username,password,url\n,${username},pw,${url}`;
            const { result: r1 } = importCsv(csv1);
            expect(r1.skipped.length).toBeGreaterThan(0);

            // Missing password
            const csv2 = `title,username,password,url\ntitle,${username},,${url}`;
            const { result: r2 } = importCsv(csv2);
            expect(r2.skipped.length).toBeGreaterThan(0);
          }),
          { numRuns: 10 }
        );
      });
    });

    // ─── Property 15: CSV export RFC 4180 compliance (Task 8.7) ─────────────────

    describe('Property 15: CSV export RFC 4180 compliance', () => {
      it('exported CSV can always be re-imported with identical values', () => {
        const safeString = fc.string({ minLength: 1, maxLength: 50 });

        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                title: safeString.filter((s) => s.trim().length > 0),
                username: safeString,
                password: safeString.filter((s) => s.trim().length > 0),
                url: safeString,
                notes: safeString,
              }),
              { minLength: 1, maxLength: 5 }
            ),
            (entries: CsvExportEntry[]) => {
              const csv = exportCsv(entries);
              const { rows } = importCsv(csv);

              expect(rows.length).toBe(entries.length);
              for (let i = 0; i < entries.length; i++) {
                expect(rows[i].title).toBe(entries[i].title.trim());
                expect(rows[i].username).toBe(entries[i].username.trim());
                expect(rows[i].password).toBe(entries[i].password.trim());
                expect(rows[i].url).toBe(entries[i].url.trim());
                expect(rows[i].notes).toBe(entries[i].notes.trim());
              }
            }
          ),
          { numRuns: 10 }
        );
      });

      it('exported CSV uses CRLF line endings', () => {
        const entries: CsvExportEntry[] = [
          { title: 'A', username: 'u', password: 'p', url: 'u', notes: '' },
        ];
        const csv = exportCsv(entries);
        expect(csv).toContain('\r\n');
        // No bare LF without preceding CR
        const lines = csv.split('\r\n');
        for (const line of lines) {
          expect(line).not.toContain('\n');
        }
      });
    });

    // ─── Property 25: Vault health check correctness (Task 8.8) ────────────────

    describe('Property 25: Vault health check correctness', () => {
      const healthCheck = createVaultHealthCheck();

      it('a freshly created vault with entries is always healthy', async () => {
        await fc.assert(
          fc.asyncProperty(fc.integer({ min: 0, max: 10 }), async (entryCount) => {
            const db = await createTestDb('Healthy');
            const group = db.getDefaultGroup();

            for (let i = 0; i < entryCount; i++) {
              const entry = db.createEntry(group);
              entry.fields.set('Title', `Entry ${i}`);
              entry.fields.set('Password', kdbxweb.ProtectedValue.fromString(`pw${i}`));
            }

            const result = await healthCheck.run(db);
            expect(result.status).toBe('healthy');
            expect(result.entryCount).toBe(entryCount);
            expect(result.errors).toHaveLength(0);
            expect(result.timestamp).toBeTruthy();
          }),
          { numRuns: 5 }
        );
      });

      it('entry count matches actual entries in the database', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.integer({ min: 1, max: 8 }),
            fc.integer({ min: 0, max: 3 }),
            async (rootEntries, subGroupEntries) => {
              const db = await createTestDb('Counting');
              const root = db.getDefaultGroup();

              for (let i = 0; i < rootEntries; i++) {
                const e = db.createEntry(root);
                e.fields.set('Title', `Root ${i}`);
                e.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw'));
              }

              if (subGroupEntries > 0) {
                const sub = db.createGroup(root, 'Sub');
                for (let i = 0; i < subGroupEntries; i++) {
                  const e = db.createEntry(sub);
                  e.fields.set('Title', `Sub ${i}`);
                  e.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw'));
                }
              }

              const result = await healthCheck.run(db);
              expect(result.entryCount).toBe(rootEntries + subGroupEntries);
            }
          ),
          { numRuns: 5 }
        );
      });

      it('detects entries with missing Title field', async () => {
        const db = await createTestDb('MissingTitle');
        const entry = db.createEntry(db.getDefaultGroup());
        entry.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw'));
        entry.fields.delete('Title');

        const result = await healthCheck.run(db);
        expect(result.status).toBe('corrupted');
        expect(result.errors.some((e) => e.includes('Title'))).toBe(true);
      });

      it('serialization produces valid KDBX with magic bytes', async () => {
        const db = await createTestDb('Serialization');
        const entry = db.createEntry(db.getDefaultGroup());
        entry.fields.set('Title', 'Valid');
        entry.fields.set('Password', kdbxweb.ProtectedValue.fromString('pw'));

        const result = await healthCheck.run(db);
        expect(result.status).toBe('healthy');
        // The health check internally verifies magic bytes — if it passed, they're correct
      });
    });
  }
);
