import Papa from 'papaparse';
import type { ImportResult, SkippedEntry } from './kdbx-handler';

// ─── Interfaces ────────────────────────────────────────────────────────────────

/** A single row parsed from a CSV import */
export interface CsvRow {
  title: string;
  username: string;
  password: string;
  url: string;
  notes?: string;
}

/** Required columns in the CSV header */
const REQUIRED_COLUMNS = ['title', 'username', 'password', 'url'] as const;

// ─── Import ────────────────────────────────────────────────────────────────────

/**
 * Parse a CSV string and return validated rows.
 * Creates new entries — no UUID matching, no history, no categories, no favorites.
 * CSV is a lossy interchange format.
 *
 * Expected header: title, username, password, url, [notes]
 * First row is always treated as header.
 * Rows missing required columns are skipped with reasons.
 */
export function importCsv(csvContent: string): { rows: CsvRow[]; result: ImportResult } {
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  // Validate that required columns exist in header
  const headers = parsed.meta.fields ?? [];
  const normalizedHeaders = headers.map((h) => h.toLowerCase());
  const missingColumns = REQUIRED_COLUMNS.filter((col) => !normalizedHeaders.includes(col));

  if (missingColumns.length > 0) {
    throw new Error(
      `CSV is missing required columns: ${missingColumns.join(', ')}. ` +
      `Expected: title, username, password, url`
    );
  }

  const rows: CsvRow[] = [];
  const skipped: SkippedEntry[] = [];
  let total = 0;

  for (let i = 0; i < parsed.data.length; i++) {
    total++;
    const row = parsed.data[i];
    const rowNumber = i + 2; // +2 because row 1 is header, data starts at row 2

    const title = row['title']?.trim() ?? '';
    const password = row['password']?.trim() ?? '';

    // Validate: title and password are required per Requirement 4.1
    if (!title) {
      skipped.push({
        identifier: `Row ${rowNumber}`,
        reason: 'Missing title.',
      });
      continue;
    }
    if (!password) {
      skipped.push({
        identifier: `Row ${rowNumber}`,
        reason: 'Missing password.',
      });
      continue;
    }

    rows.push({
      title,
      username: row['username']?.trim() ?? '',
      password,
      url: row['url']?.trim() ?? '',
      notes: row['notes']?.trim() ?? '',
    });
  }

  // Also include PapaParse errors as skipped
  for (const error of parsed.errors) {
    skipped.push({
      identifier: `Row ${(error.row ?? 0) + 2}`,
      reason: error.message,
    });
  }

  return {
    rows,
    result: {
      imported: rows.length,
      skipped,
      total,
    },
  };
}

// ─── Export ────────────────────────────────────────────────────────────────────

/** Entry data for CSV export */
export interface CsvExportEntry {
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
}

/**
 * Generate an RFC 4180-compliant CSV string from entries.
 * Columns: title, username, password, url, notes
 * PapaParse handles all escaping, quoting, and newline edge cases.
 */
export function exportCsv(entries: CsvExportEntry[]): string {
  return Papa.unparse(entries, {
    columns: ['title', 'username', 'password', 'url', 'notes'],
    header: true,
    newline: '\r\n', // RFC 4180 requires CRLF
  });
}
