/**
 * Destructive operation warning messages.
 *
 * These functions return user-facing warning strings for operations
 * that may result in irreversible data loss. Each message recommends
 * creating a backup before proceeding.
 */

export type DestructiveOperation = 'vault-delete' | 'entry-delete' | 'import-overwrite';

/**
 * Returns a warning message appropriate for the given destructive operation.
 * Messages inform the user about potential data loss and recommend backing up first.
 */
export function getDestructiveWarningMessage(operation: DestructiveOperation): string {
  switch (operation) {
    case 'vault-delete':
      return 'Deleting this vault will permanently remove all stored entries and cannot be undone. Export a backup before proceeding to avoid data loss.';
    case 'entry-delete':
      return 'This entry will be permanently deleted and cannot be recovered. Consider exporting a backup if you need to preserve this data.';
    case 'import-overwrite':
      return 'Importing may overwrite existing entries in your vault. Export a backup of your current vault before importing to prevent accidental data loss.';
  }
}
