/**
 * Property-based tests for Service Layer (Tasks 6.5–6.10)
 * Covers: Search Engine, Password Generator, Clipboard Manager, Idle Monitor
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { createSearchEngine, SearchableEntry } from '@/lib/search';
import { createPasswordGenerator, PasswordGeneratorConfig } from '@/lib/password-generator';
import { createClipboardManager } from '@/lib/clipboard';
import { createIdleMonitor } from '@/lib/idle-monitor';

// ─── Property 8: Search correctness (Task 6.5) ────────────────────────────────

describe('Property 8: Search correctness', () => {
  const entryArb: fc.Arbitrary<SearchableEntry> = fc.record({
    uuid: fc.uuid(),
    type: fc.constant('password' as const),
    title: fc.string({ minLength: 1, maxLength: 50 }),
    username: fc.string({ minLength: 0, maxLength: 30 }),
    url: fc.string({ minLength: 0, maxLength: 50 }),
    notes: fc.string({ minLength: 0, maxLength: 100 }),
    tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
  });

  it('any entry whose title contains the query must appear in results', () => {
    const engine = createSearchEngine();

    fc.assert(
      fc.property(
        fc.array(entryArb, { minLength: 1, maxLength: 20 }),
        (entries) => {
          engine.index(entries);
          const target = entries[0];
          // Use first 3 chars of title as query (guaranteed substring)
          if (target.title.length < 1) return;
          const query = target.title.slice(0, Math.min(3, target.title.length));
          const results = engine.search(query);
          const uuids = results.map((r) => r.uuid);
          expect(uuids).toContain(target.uuid);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('search is case-insensitive: query in any case matches', () => {
    const engine = createSearchEngine();

    fc.assert(
      fc.property(entryArb, (entry) => {
        engine.index([entry]);
        if (entry.title.length < 1) return;
        const query = entry.title.slice(0, 3);
        // Search with uppercase query
        const upper = engine.search(query.toUpperCase());
        // Search with lowercase query
        const lower = engine.search(query.toLowerCase());
        expect(upper.length).toBe(lower.length);
      }),
      { numRuns: 20 }
    );
  });

  it('notes body is searchable for note-type entries', () => {
    const engine = createSearchEngine();

    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 50 }),
        (body) => {
          const noteEntry: SearchableEntry = {
            uuid: 'note-1',
            type: 'note',
            title: 'My Note',
            username: '',
            url: '',
            notes: body,
            tags: [],
          };
          engine.index([noteEntry]);
          const query = body.slice(0, 5);
          const results = engine.search(query);
          expect(results.length).toBe(1);
        }
      ),
      { numRuns: 10 }
    );
  });
});

// ─── Property 9: Whitespace query returns all entries (Task 6.6) ──────────────

describe('Property 9: Whitespace query returns all entries', () => {
  const entryArb: fc.Arbitrary<SearchableEntry> = fc.record({
    uuid: fc.uuid(),
    type: fc.constant('password' as const),
    title: fc.string({ minLength: 1, maxLength: 30 }),
    username: fc.string({ maxLength: 20 }),
    url: fc.string({ maxLength: 30 }),
    notes: fc.string({ maxLength: 50 }),
    tags: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 3 }),
  });

  it('empty string returns all indexed entries', () => {
    const engine = createSearchEngine();

    fc.assert(
      fc.property(
        fc.array(entryArb, { minLength: 0, maxLength: 20 }),
        (entries) => {
          engine.index(entries);
          const results = engine.search('');
          expect(results.length).toBe(entries.length);
        }
      ),
      { numRuns: 15 }
    );
  });

  it('whitespace-only string returns all indexed entries', () => {
    const engine = createSearchEngine();

    fc.assert(
      fc.property(
        fc.array(entryArb, { minLength: 1, maxLength: 10 }),
        fc.constantFrom('   ', '\t', '\n', '  \t  ', '\n\t '),
        (entries, ws) => {
          engine.index(entries);
          const results = engine.search(ws);
          expect(results.length).toBe(entries.length);
        }
      ),
      { numRuns: 10 }
    );
  });
});

// ─── Property 10: Password generator length correctness (Task 6.7) ────────────

describe('Property 10: Password generator length correctness', () => {
  const generator = createPasswordGenerator();

  const validConfig: fc.Arbitrary<PasswordGeneratorConfig> = fc.record({
    length: fc.integer({ min: 4, max: 128 }),
    uppercase: fc.boolean(),
    lowercase: fc.boolean(),
    digits: fc.boolean(),
    symbols: fc.boolean(),
  }).filter((c) => c.uppercase || c.lowercase || c.digits || c.symbols)
    .filter((c) => {
      const sets = [c.uppercase, c.lowercase, c.digits, c.symbols].filter(Boolean).length;
      return c.length >= sets;
    });

  it('generated password always has exactly the requested length', () => {
    fc.assert(
      fc.property(validConfig, (config) => {
        const password = generator.generate(config);
        expect(password.length).toBe(config.length);
      }),
      { numRuns: 50 }
    );
  });
});

// ─── Property 11: Password character set compliance (Task 6.8) ────────────────

describe('Property 11: Password character set compliance', () => {
  const generator = createPasswordGenerator();

  const UPPER = /[A-Z]/;
  const LOWER = /[a-z]/;
  const DIGIT = /[0-9]/;
  const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;\':",./<>?`~\\';

  const validConfig: fc.Arbitrary<PasswordGeneratorConfig> = fc.record({
    length: fc.integer({ min: 4, max: 50 }),
    uppercase: fc.boolean(),
    lowercase: fc.boolean(),
    digits: fc.boolean(),
    symbols: fc.boolean(),
  }).filter((c) => c.uppercase || c.lowercase || c.digits || c.symbols)
    .filter((c) => {
      const sets = [c.uppercase, c.lowercase, c.digits, c.symbols].filter(Boolean).length;
      return c.length >= sets;
    });

  it('password contains at least one char from each enabled set', () => {
    fc.assert(
      fc.property(validConfig, (config) => {
        const password = generator.generate(config);

        if (config.uppercase) expect(password).toMatch(UPPER);
        if (config.lowercase) expect(password).toMatch(LOWER);
        if (config.digits) expect(password).toMatch(DIGIT);
        if (config.symbols) {
          const hasSymbol = [...password].some((ch) => SYMBOL_CHARS.includes(ch));
          expect(hasSymbol).toBe(true);
        }
      }),
      { numRuns: 50 }
    );
  });

  it('password only contains characters from enabled sets', () => {
    fc.assert(
      fc.property(validConfig, (config) => {
        const password = generator.generate(config);

        for (const ch of password) {
          const inUpper = config.uppercase && UPPER.test(ch);
          const inLower = config.lowercase && LOWER.test(ch);
          const inDigit = config.digits && DIGIT.test(ch);
          const inSymbol = config.symbols && SYMBOL_CHARS.includes(ch);
          expect(inUpper || inLower || inDigit || inSymbol).toBe(true);
        }
      }),
      { numRuns: 50 }
    );
  });
});

// ─── Property 23: Clipboard auto-clear on timeout (Task 6.9) ─────────────────

describe('Property 23: Clipboard auto-clear on timeout', () => {
  let mockWriteText: ReturnType<typeof vi.fn>;
  let mockReadText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockWriteText = vi.fn().mockResolvedValue(undefined);
    mockReadText = vi.fn().mockResolvedValue('');

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText, readText: mockReadText },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clipboard is cleared after the specified timeout', async () => {
    const timeoutArb = fc.integer({ min: 1000, max: 120_000 });

    await fc.assert(
      fc.asyncProperty(timeoutArb, async (timeout) => {
        const manager = createClipboardManager();
        mockReadText.mockResolvedValue('test-value');
        await manager.copy('test-value', timeout);

        mockWriteText.mockClear();

        // Should not have cleared yet
        await vi.advanceTimersByTimeAsync(timeout - 1);
        expect(mockWriteText).not.toHaveBeenCalledWith('');

        // Now should clear
        await vi.advanceTimersByTimeAsync(1);
        expect(mockWriteText).toHaveBeenCalledWith('');

        manager.destroy();
      }),
      { numRuns: 10 }
    );
  });
});

// ─── Property 24: Clipboard ownership check (Task 6.10) ──────────────────────

describe('Property 24: Clipboard ownership check', () => {
  let mockWriteText: ReturnType<typeof vi.fn>;
  let mockReadText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockWriteText = vi.fn().mockResolvedValue(undefined);
    mockReadText = vi.fn().mockResolvedValue('');

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText, readText: mockReadText },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not clear clipboard if external app changed the content', async () => {
    const manager = createClipboardManager();
    mockReadText.mockResolvedValue('our-secret');
    await manager.copy('our-secret', 5000);

    // External app overwrites
    mockReadText.mockResolvedValue('external-content');
    mockWriteText.mockClear();

    await vi.advanceTimersByTimeAsync(5000);

    // Should NOT have written empty string (ownership check failed)
    expect(mockWriteText).not.toHaveBeenCalledWith('');

    manager.destroy();
  });

  it('clears clipboard if content still matches what we wrote', async () => {
    const manager = createClipboardManager();
    mockReadText.mockResolvedValue('our-value');
    await manager.copy('our-value', 5000);
    mockWriteText.mockClear();

    await vi.advanceTimersByTimeAsync(5000);

    expect(mockWriteText).toHaveBeenCalledWith('');

    manager.destroy();
  });

  it('unconditionally clears when readText is unavailable', async () => {
    // Make readText fail (simulates Firefox/Safari)
    mockReadText.mockRejectedValue(new Error('Not allowed'));

    const manager = createClipboardManager();
    await manager.copy('secret', 5000);
    mockWriteText.mockClear();

    await vi.advanceTimersByTimeAsync(5000);

    expect(mockWriteText).toHaveBeenCalledWith('');

    manager.destroy();
  });
});
