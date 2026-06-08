import { describe, it, expect, beforeEach } from 'vitest';
import { createSearchEngine, SearchableEntry, SearchEngine } from '@/lib/search';

function makeEntry(overrides: Partial<SearchableEntry> = {}): SearchableEntry {
  return {
    uuid: 'test-uuid-1',
    type: 'password',
    title: 'GitHub',
    username: 'octocat',
    url: 'https://github.com',
    notes: 'My main account',
    tags: ['dev', 'work'],
    ...overrides,
  };
}

describe('SearchEngine', () => {
  let engine: SearchEngine;

  beforeEach(() => {
    engine = createSearchEngine();
  });

  describe('index and basic search', () => {
    it('should return matching entries by title substring', () => {
      const entries = [
        makeEntry({ uuid: '1', title: 'GitHub', url: '', notes: '', tags: [] }),
        makeEntry({ uuid: '2', title: 'GitLab', url: '', notes: '', tags: [] }),
        makeEntry({ uuid: '3', title: 'Jira', url: '', username: '', notes: '', tags: [] }),
      ];
      engine.index(entries);

      const results = engine.search('Git');
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.uuid)).toContain('1');
      expect(results.map((r) => r.uuid)).toContain('2');
    });

    it('should return empty array when no entries match', () => {
      engine.index([makeEntry({ uuid: '1', title: 'GitHub' })]);
      const results = engine.search('nonexistent');
      expect(results).toHaveLength(0);
    });
  });

  describe('case-insensitivity', () => {
    it('should match regardless of query case', () => {
      engine.index([makeEntry({ uuid: '1', title: 'GitHub' })]);

      expect(engine.search('github')).toHaveLength(1);
      expect(engine.search('GITHUB')).toHaveLength(1);
      expect(engine.search('GiThUb')).toHaveLength(1);
    });

    it('should match regardless of entry case', () => {
      engine.index([makeEntry({ uuid: '1', title: 'UPPERCASE TITLE' })]);
      expect(engine.search('uppercase')).toHaveLength(1);
    });
  });

  describe('empty/whitespace query returns all entries', () => {
    it('should return all entries for empty string', () => {
      const entries = [
        makeEntry({ uuid: '1' }),
        makeEntry({ uuid: '2' }),
        makeEntry({ uuid: '3' }),
      ];
      engine.index(entries);

      const results = engine.search('');
      expect(results).toHaveLength(3);
    });

    it('should return all entries for whitespace-only string', () => {
      const entries = [makeEntry({ uuid: '1' }), makeEntry({ uuid: '2' })];
      engine.index(entries);

      expect(engine.search('   ')).toHaveLength(2);
      expect(engine.search('\t\n')).toHaveLength(2);
    });
  });

  describe('search across different fields', () => {
    it('should search in title', () => {
      engine.index([makeEntry({ uuid: '1', title: 'UniqueTitle' })]);
      expect(engine.search('UniqueTitle')).toHaveLength(1);
    });

    it('should search in username', () => {
      engine.index([makeEntry({ uuid: '1', username: 'specialuser' })]);
      expect(engine.search('specialuser')).toHaveLength(1);
    });

    it('should search in url', () => {
      engine.index([makeEntry({ uuid: '1', url: 'https://special.example.com' })]);
      expect(engine.search('special.example')).toHaveLength(1);
    });

    it('should search in notes', () => {
      engine.index([makeEntry({ uuid: '1', notes: 'Remember to update quarterly' })]);
      expect(engine.search('quarterly')).toHaveLength(1);
    });

    it('should search in tags', () => {
      engine.index([makeEntry({ uuid: '1', tags: ['finance', 'banking'] })]);
      expect(engine.search('banking')).toHaveLength(1);
    });
  });

  describe('notes body is searchable', () => {
    it('should find secure note entries by body content', () => {
      const noteEntry = makeEntry({
        uuid: '1',
        type: 'note',
        title: 'API Keys',
        notes: 'sk-live-abc123xyz secret production key',
      });
      engine.index([noteEntry]);

      expect(engine.search('abc123xyz')).toHaveLength(1);
      expect(engine.search('production key')).toHaveLength(1);
    });
  });

  describe('max query length handling', () => {
    it('should handle query at exactly 128 chars', () => {
      const longTitle = 'a'.repeat(128);
      engine.index([makeEntry({ uuid: '1', title: longTitle })]);

      const query = 'a'.repeat(128);
      expect(engine.search(query)).toHaveLength(1);
    });

    it('should silently truncate queries longer than 128 chars', () => {
      const title = 'a'.repeat(128);
      engine.index([makeEntry({ uuid: '1', title })]);

      // Query is 200 chars, but should be truncated to 128 and still match
      const query = 'a'.repeat(200);
      expect(engine.search(query)).toHaveLength(1);
    });

    it('should not match when truncated query does not match', () => {
      // Title is 128 "a"s followed by "b" - but only 128 chars total of "a"
      engine.index([makeEntry({ uuid: '1', title: 'a'.repeat(127) + 'b' })]);

      // Query is 128 "a"s - the entry title has 127 "a"s so it won't contain 128 "a"s
      const query = 'a'.repeat(128);
      expect(engine.search(query)).toHaveLength(0);
    });
  });

  describe('clear()', () => {
    it('should release all indexed data', () => {
      engine.index([makeEntry({ uuid: '1' }), makeEntry({ uuid: '2' })]);
      expect(engine.search('')).toHaveLength(2);

      engine.clear();
      expect(engine.search('')).toHaveLength(0);
    });

    it('should allow re-indexing after clear', () => {
      engine.index([makeEntry({ uuid: '1' })]);
      engine.clear();
      engine.index([makeEntry({ uuid: '2' }), makeEntry({ uuid: '3' })]);

      expect(engine.search('')).toHaveLength(2);
      expect(engine.search('').map((e) => e.uuid)).toContain('2');
    });
  });
});
