import { describe, it, expect } from 'vitest';
import { importCsv, exportCsv } from '@/lib/import-export/csv-handler';
import type { CsvExportEntry } from '@/lib/import-export/csv-handler';

describe('CSV Import (Task 8.2)', () => {
  describe('importCsv()', () => {
    it('should parse a valid CSV with all columns', () => {
      const csv = `title,username,password,url,notes
GitHub,octocat,secret123,https://github.com,My account
AWS,admin,aws-pw,https://aws.amazon.com,Production`;

      const { rows, result } = importCsv(csv);

      expect(rows.length).toBe(2);
      expect(result.imported).toBe(2);
      expect(result.skipped).toHaveLength(0);

      expect(rows[0].title).toBe('GitHub');
      expect(rows[0].username).toBe('octocat');
      expect(rows[0].password).toBe('secret123');
      expect(rows[0].url).toBe('https://github.com');
      expect(rows[0].notes).toBe('My account');

      expect(rows[1].title).toBe('AWS');
    });

    it('should handle CSV without optional notes column', () => {
      const csv = `title,username,password,url
Entry1,user1,pass1,https://example.com`;

      const { rows } = importCsv(csv);

      expect(rows.length).toBe(1);
      expect(rows[0].notes).toBe('');
    });

    it('should skip rows missing title', () => {
      const csv = `title,username,password,url
,user1,pass1,https://a.com
ValidEntry,user2,pass2,https://b.com`;

      const { rows, result } = importCsv(csv);

      expect(rows.length).toBe(1);
      expect(rows[0].title).toBe('ValidEntry');
      expect(result.skipped.length).toBe(1);
      expect(result.skipped[0].reason).toContain('Missing title');
      expect(result.skipped[0].identifier).toBe('Row 2');
    });

    it('should skip rows missing password', () => {
      const csv = `title,username,password,url
NoPw,user1,,https://a.com
HasPw,user2,pass2,https://b.com`;

      const { rows, result } = importCsv(csv);

      expect(rows.length).toBe(1);
      expect(rows[0].title).toBe('HasPw');
      expect(result.skipped.length).toBe(1);
      expect(result.skipped[0].reason).toContain('Missing password');
    });

    it('should throw if required columns are missing from header', () => {
      const csv = `name,user,secret
Entry1,user1,pass1`;

      expect(() => importCsv(csv)).toThrow(/missing required columns/i);
    });

    it('should handle case-insensitive headers', () => {
      const csv = `Title,Username,Password,URL,Notes
Entry1,user1,pass1,https://a.com,note1`;

      const { rows } = importCsv(csv);
      expect(rows.length).toBe(1);
      expect(rows[0].title).toBe('Entry1');
    });

    it('should handle headers with extra whitespace', () => {
      const csv = ` title , username , password , url
Entry1,user1,pass1,https://a.com`;

      const { rows } = importCsv(csv);
      expect(rows.length).toBe(1);
      expect(rows[0].title).toBe('Entry1');
    });

    it('should handle fields with commas (quoted)', () => {
      const csv = `title,username,password,url,notes
"My, Entry",user1,pass1,https://a.com,"Note with, comma"`;

      const { rows } = importCsv(csv);
      expect(rows.length).toBe(1);
      expect(rows[0].title).toBe('My, Entry');
      expect(rows[0].notes).toBe('Note with, comma');
    });

    it('should handle fields with quotes (escaped)', () => {
      const csv = `title,username,password,url,notes
"Entry ""quoted""",user1,pass1,https://a.com,""`;

      const { rows } = importCsv(csv);
      expect(rows.length).toBe(1);
      expect(rows[0].title).toBe('Entry "quoted"');
    });

    it('should handle fields with newlines (quoted)', () => {
      const csv = `title,username,password,url,notes
"Multi\nLine",user1,pass1,https://a.com,"Line 1\nLine 2"`;

      const { rows } = importCsv(csv);
      expect(rows.length).toBe(1);
      expect(rows[0].title).toBe('Multi\nLine');
      expect(rows[0].notes).toBe('Line 1\nLine 2');
    });

    it('should skip empty lines', () => {
      const csv = `title,username,password,url

Entry1,user1,pass1,https://a.com

Entry2,user2,pass2,https://b.com
`;

      const { rows } = importCsv(csv);
      expect(rows.length).toBe(2);
    });

    it('should return total count including skipped', () => {
      const csv = `title,username,password,url
Valid,user,pass,url
,noTitle,,noUrl
Also Valid,u2,p2,u2`;

      const { result } = importCsv(csv);
      expect(result.total).toBe(3);
      expect(result.imported).toBe(2);
      expect(result.skipped.length).toBe(1);
    });
  });
});

describe('CSV Export (Task 8.2)', () => {
  describe('exportCsv()', () => {
    it('should produce RFC 4180 CSV with header', () => {
      const entries: CsvExportEntry[] = [
        { title: 'GitHub', username: 'user', password: 'pw', url: 'https://github.com', notes: '' },
      ];

      const csv = exportCsv(entries);

      // Header line
      expect(csv).toContain('title,username,password,url,notes');
      // Data line
      expect(csv).toContain('GitHub,user,pw,https://github.com,');
      // Uses CRLF per RFC 4180
      expect(csv).toContain('\r\n');
    });

    it('should escape commas in fields', () => {
      const entries: CsvExportEntry[] = [
        { title: 'Entry, with comma', username: 'u', password: 'p', url: 'u', notes: '' },
      ];

      const csv = exportCsv(entries);
      expect(csv).toContain('"Entry, with comma"');
    });

    it('should escape quotes in fields', () => {
      const entries: CsvExportEntry[] = [
        { title: 'Has "quotes"', username: 'u', password: 'p', url: 'u', notes: '' },
      ];

      const csv = exportCsv(entries);
      expect(csv).toContain('"Has ""quotes"""');
    });

    it('should escape newlines in fields', () => {
      const entries: CsvExportEntry[] = [
        { title: 'Multi\nLine', username: 'u', password: 'p', url: 'u', notes: 'Line1\nLine2' },
      ];

      const csv = exportCsv(entries);
      // PapaParse wraps newline-containing fields in quotes
      expect(csv).toContain('"Multi\nLine"');
      expect(csv).toContain('"Line1\nLine2"');
    });

    it('should export multiple entries', () => {
      const entries: CsvExportEntry[] = [
        { title: 'A', username: 'u1', password: 'p1', url: 'url1', notes: 'n1' },
        { title: 'B', username: 'u2', password: 'p2', url: 'url2', notes: 'n2' },
        { title: 'C', username: 'u3', password: 'p3', url: 'url3', notes: '' },
      ];

      const csv = exportCsv(entries);
      const lines = csv.split('\r\n').filter((l) => l.length > 0);
      // 1 header + 3 data lines
      expect(lines.length).toBe(4);
    });

    it('should produce empty CSV for no entries', () => {
      const csv = exportCsv([]);
      // PapaParse produces empty string when there are no data rows
      expect(csv).toBe('');
    });

    it('round-trip: exported CSV can be re-imported', () => {
      const entries: CsvExportEntry[] = [
        {
          title: 'RoundTrip',
          username: 'admin',
          password: 's3cret!',
          url: 'https://rt.com',
          notes: 'A note, with "quotes"',
        },
      ];

      const csv = exportCsv(entries);
      const { rows } = importCsv(csv);

      expect(rows.length).toBe(1);
      expect(rows[0].title).toBe('RoundTrip');
      expect(rows[0].username).toBe('admin');
      expect(rows[0].password).toBe('s3cret!');
      expect(rows[0].url).toBe('https://rt.com');
      expect(rows[0].notes).toBe('A note, with "quotes"');
    });
  });
});
