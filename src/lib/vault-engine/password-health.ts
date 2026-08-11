/**
 * Password Health Report types.
 *
 * Computed entirely in-memory from the decrypted KDBX database.
 * No passwords are exposed in the report — only metadata and UUIDs.
 */

/** Individual entry issue */
export interface PasswordHealthIssue {
  uuid: string;
  title: string;
  issue: PasswordIssueType;
}

export type PasswordIssueType =
  'weak' | 'reused' | 'old' | 'missing-url' | 'missing-username' | 'no-category';

/** Summary statistics for the dashboard */
export interface PasswordHealthSummary {
  totalEntries: number;
  totalPasswords: number;
  totalNotes: number;
  weakPasswords: number;
  reusedPasswords: number;
  oldPasswords: number;
  missingUrls: number;
  missingUsernames: number;
  noCategory: number;
  /** Overall health score (0–100) */
  score: number;
}

/** Full password health report */
export interface PasswordHealthReport {
  summary: PasswordHealthSummary;
  issues: PasswordHealthIssue[];
  timestamp: string;
}
