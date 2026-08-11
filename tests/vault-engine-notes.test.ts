// @vitest-environment node
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeAll } from 'vitest';
import { vi } from 'vitest';
import * as kdbxweb from 'kdbxweb';
import type { NoteInput } from '@/types';

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

async function createUnlockedEngine() {
  const { cryptoAdapter } = await import('@/lib/crypto/crypto-adapter');
  const { StorageAdapterImpl } = await import('@/lib/storage/storage-adapter');
  const { createVaultEngine } = await import('@/lib/vault-engine/vault-engine');

  const storage = new StorageAdapterImpl();
  const engine = createVaultEngine(cryptoAdapter, storage);
  await engine.create('test-password', 'NotesTestVault');
  return { engine, storage };
}

describe('VaultEngine Secure Notes (Task 4.3)', { timeout: 30_000 }, () => {
  beforeAll(async () => {
    await registerTestArgon2();
  });

  describe('addNote()', () => {
    it('should create a note and return EntryMeta', async () => {
      const { engine } = await createUnlockedEngine();

      const input: NoteInput = {
        title: 'SSH Key Notes',
        body: 'Private key location: ~/.ssh/id_rsa',
        tags: ['infrastructure'],
        favorite: true,
      };

      const meta = await engine.addNote(input);

      expect(meta.uuid).toBeTruthy();
      expect(meta.title).toBe('SSH Key Notes');
      expect(meta.modifiedAt).toBeTruthy();
    });

    it('should persist note retrievable via getEntry', async () => {
      const { engine } = await createUnlockedEngine();

      const meta = await engine.addNote({
        title: 'Recovery Codes',
        body: 'Code 1: ABCDEF\nCode 2: GHIJKL\nCode 3: MNOPQR',
        tags: ['backup', 'auth'],
        favorite: false,
      });

      const entry = engine.getEntry(meta.uuid);

      expect(entry.uuid).toBe(meta.uuid);
      expect(entry.type).toBe('note');
      expect(entry.title).toBe('Recovery Codes');
      // Body is stored in the notes field
      expect(entry.notes).toBe('Code 1: ABCDEF\nCode 2: GHIJKL\nCode 3: MNOPQR');
      expect(entry.tags).toEqual(['backup', 'auth']);
      expect(entry.favorite).toBe(false);
      // Password should be empty for notes
      expect(entry.password).toBe('');
      expect(entry.username).toBe('');
      expect(entry.url).toBe('');
    });

    it('should appear in listEntries with type "note"', async () => {
      const { engine } = await createUnlockedEngine();

      await engine.addNote({ title: 'My Note', body: 'Content here' });

      const list = engine.listEntries();
      expect(list.length).toBe(1);
      expect(list[0].type).toBe('note');
      expect(list[0].title).toBe('My Note');
    });

    it('should reject note without title', async () => {
      const { engine } = await createUnlockedEngine();

      await expect(engine.addNote({ title: '', body: 'Some body' })).rejects.toThrow(
        'Title is required'
      );
    });

    it('should reject note without body', async () => {
      const { engine } = await createUnlockedEngine();

      await expect(engine.addNote({ title: 'Empty Note', body: '' })).rejects.toThrow(
        'Body is required'
      );
    });

    it('should reject title exceeding 256 characters', async () => {
      const { engine } = await createUnlockedEngine();

      await expect(engine.addNote({ title: 'a'.repeat(257), body: 'body' })).rejects.toThrow(
        /Title must be at most/
      );
    });

    it('should reject body exceeding 10000 characters', async () => {
      const { engine } = await createUnlockedEngine();

      await expect(engine.addNote({ title: 'Big Note', body: 'x'.repeat(10001) })).rejects.toThrow(
        /Body must be at most/
      );
    });
  });

  describe('editNote()', () => {
    it('should update note title and body', async () => {
      const { engine } = await createUnlockedEngine();

      const meta = await engine.addNote({
        title: 'Original Note',
        body: 'Original content',
      });

      await engine.editNote(meta.uuid, {
        title: 'Updated Note',
        body: 'Updated content',
      });

      const entry = engine.getEntry(meta.uuid);
      expect(entry.title).toBe('Updated Note');
      expect(entry.notes).toBe('Updated content');
      expect(entry.type).toBe('note');
    });

    it('should update only specified fields', async () => {
      const { engine } = await createUnlockedEngine();

      const meta = await engine.addNote({
        title: 'Partial Edit',
        body: 'Keep this body',
        tags: ['original'],
      });

      await engine.editNote(meta.uuid, { title: 'New Title' });

      const entry = engine.getEntry(meta.uuid);
      expect(entry.title).toBe('New Title');
      expect(entry.notes).toBe('Keep this body');
      expect(entry.tags).toEqual(['original']);
    });

    it('should reject editing a password entry as a note', async () => {
      const { engine } = await createUnlockedEngine();

      const pwMeta = await engine.addEntry({ title: 'PW Entry', password: 'pw' });

      await expect(
        engine.editNote(pwMeta.uuid, { body: 'Trying to set body on password entry' })
      ).rejects.toThrow('Entry is not a secure note');
    });

    it('should reject removing title from note', async () => {
      const { engine } = await createUnlockedEngine();

      const meta = await engine.addNote({ title: 'Has Title', body: 'body' });

      await expect(engine.editNote(meta.uuid, { title: '' })).rejects.toThrow('Title is required');
    });

    it('should reject removing body from note', async () => {
      const { engine } = await createUnlockedEngine();

      const meta = await engine.addNote({ title: 'Note', body: 'Has body' });

      await expect(engine.editNote(meta.uuid, { body: '' })).rejects.toThrow('Body is required');
    });

    it('should update favorite on note', async () => {
      const { engine } = await createUnlockedEngine();

      const meta = await engine.addNote({
        title: 'Fav Note',
        body: 'content',
        favorite: false,
      });

      await engine.editNote(meta.uuid, { favorite: true });
      expect(engine.getEntry(meta.uuid).favorite).toBe(true);

      await engine.editNote(meta.uuid, { favorite: false });
      expect(engine.getEntry(meta.uuid).favorite).toBe(false);
    });

    it('should throw for non-existent UUID', async () => {
      const { engine } = await createUnlockedEngine();

      await expect(engine.editNote('non-existent', { body: 'x' })).rejects.toThrow(
        /Entry not found/
      );
    });
  });

  describe('note isolation from password entries', () => {
    it('notes and passwords coexist in the same vault', async () => {
      const { engine } = await createUnlockedEngine();

      await engine.addEntry({ title: 'Password 1', password: 'pw1' });
      await engine.addNote({ title: 'Note 1', body: 'body1' });
      await engine.addEntry({ title: 'Password 2', password: 'pw2' });
      await engine.addNote({ title: 'Note 2', body: 'body2' });

      const list = engine.listEntries();
      expect(list.length).toBe(4);

      const passwords = list.filter((e) => e.type === 'password');
      const notes = list.filter((e) => e.type === 'note');

      expect(passwords.length).toBe(2);
      expect(notes.length).toBe(2);
    });

    it('deleting a note does not affect password entries', async () => {
      const { engine } = await createUnlockedEngine();

      const pwMeta = await engine.addEntry({ title: 'Keep Me', password: 'pw' });
      const noteMeta = await engine.addNote({ title: 'Delete Me', body: 'bye' });

      await engine.deleteEntry(noteMeta.uuid);

      const list = engine.listEntries();
      expect(list.length).toBe(1);
      expect(list[0].uuid).toBe(pwMeta.uuid);
      expect(list[0].type).toBe('password');
    });

    it('deleting a password entry does not affect notes', async () => {
      const { engine } = await createUnlockedEngine();

      const pwMeta = await engine.addEntry({ title: 'Delete PW', password: 'pw' });
      const noteMeta = await engine.addNote({ title: 'Keep Note', body: 'stays' });

      await engine.deleteEntry(pwMeta.uuid);

      const list = engine.listEntries();
      expect(list.length).toBe(1);
      expect(list[0].uuid).toBe(noteMeta.uuid);
      expect(list[0].type).toBe('note');
    });
  });

  describe('round-trip persistence', () => {
    it('notes persist after lock/unlock cycle', async () => {
      const { engine } = await createUnlockedEngine();

      await engine.addNote({
        title: 'Persistent Note',
        body: 'This should survive lock/unlock',
        tags: ['persist'],
        favorite: true,
      });

      engine.lock();
      await engine.unlock('test-password');

      const list = engine.listEntries();
      expect(list.length).toBe(1);
      expect(list[0].type).toBe('note');
      expect(list[0].title).toBe('Persistent Note');
      expect(list[0].favorite).toBe(true);

      const full = engine.getEntry(list[0].uuid);
      expect(full.notes).toBe('This should survive lock/unlock');
      expect(full.type).toBe('note');
    });
  });

  describe('KDBX compatibility', () => {
    it('note is stored as a standard KDBX entry with type marker in customData', async () => {
      const { engine } = await createUnlockedEngine();

      const meta = await engine.addNote({
        title: 'KDBX Compatible',
        body: 'Standard entry internally',
      });

      // Retrieve and verify it's the same entry type
      const entry = engine.getEntry(meta.uuid);
      expect(entry.type).toBe('note');
      // Body stored in Notes field
      expect(entry.notes).toBe('Standard entry internally');
      // Password field is empty (not absent — KDBX entries always have Password)
      expect(entry.password).toBe('');
    });

    it('editEntry should reject notes (use editNote instead)', async () => {
      const { engine } = await createUnlockedEngine();

      const meta = await engine.addNote({ title: 'Note', body: 'body' });

      await expect(engine.editEntry(meta.uuid, { title: 'Nope' })).rejects.toThrow(
        /Use editNote instead/
      );

      // Entry remains unchanged
      const entry = engine.getEntry(meta.uuid);
      expect(entry.title).toBe('Note');
      expect(entry.type).toBe('note');
    });
  });
});
