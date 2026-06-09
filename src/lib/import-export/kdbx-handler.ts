import * as kdbxweb from 'kdbxweb';
import type { CryptoAdapter } from '@/lib/crypto';
import { IMPORT_MAX_FILE_SIZE_MB, IMPORT_MAX_ENTRIES } from '@/lib/constants';

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface ImportResult {
  imported: number;
  skipped: SkippedEntry[];
  total: number;
}

export interface SkippedEntry {
  identifier: string; // UUID or description
  reason: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = IMPORT_MAX_FILE_SIZE_MB * 1024 * 1024;

/** CustomData key tracking the original source UUID of an imported entry */
const CUSTOM_KEY_SOURCE_UUID = '_qufly_source_uuid';

/** Prefix for all Qufly-specific customData keys */
const QUFLY_CUSTOM_PREFIX = '_qufly_';

// ─── Implementation ────────────────────────────────────────────────────────────

/**
 * Import entries from an external KDBX file into the current vault.
 *
 * Strategy:
 * - Uses db.importEntry() for cross-database entry transfer (preserves history, binaries, timestamps)
 * - Deduplication: builds a lookup set from target entry UUIDs AND _qufly_source_uuid values
 *   to prevent repeated imports of the same file from creating duplicates
 * - After import: sets _qufly_source_uuid on the new entry + copies all _qufly_* customData from source
 * - Entries from the source recycle bin are excluded
 * - Groups are matched by name; created if missing
 * - Continues processing after individual entry failures
 */
export async function importKdbx(
  targetDb: kdbxweb.Kdbx,
  file: ArrayBuffer,
  password: string,
  cryptoAdapter: CryptoAdapter
): Promise<ImportResult> {
  // ─── Size validation ─────────────────────────────────────────────────

  if (file.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `Import file exceeds the maximum size of ${IMPORT_MAX_FILE_SIZE_MB} MB.`
    );
  }

  // ─── Decrypt source database ─────────────────────────────────────────

  let sourceDb: kdbxweb.Kdbx;
  try {
    sourceDb = await cryptoAdapter.loadDatabase(file, password);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('BadSignature') || msg.includes('Not a KDBX')) {
      throw new Error('The selected file is not a valid KDBX file.');
    }
    throw new Error('Failed to decrypt the import file. Check your password.');
  }

  // ─── Entry count validation ──────────────────────────────────────────

  const sourceDefaultGroup = sourceDb.getDefaultGroup();
  const sourceRecycleBinUuid = sourceDb.meta.recycleBinUuid;

  let sourceEntryCount = 0;
  for (const _ of sourceDefaultGroup.allEntries()) {
    sourceEntryCount++;
    if (sourceEntryCount > IMPORT_MAX_ENTRIES) {
      throw new Error(
        `Import file contains more than ${IMPORT_MAX_ENTRIES} entries.`
      );
    }
  }

  // ─── Build deduplication set ─────────────────────────────────────────
  // Includes:
  // 1. UUIDs of existing target entries (their native kdbxweb UUID)
  // 2. _qufly_source_uuid values from previously imported entries
  // This prevents repeated imports of the same source file from creating duplicates.

  const targetDefaultGroup = targetDb.getDefaultGroup();
  const knownSourceUuids = new Set<string>();

  for (const entry of targetDefaultGroup.allEntries()) {
    // Add the entry's own UUID
    knownSourceUuids.add(entry.uuid.toString());

    // Add the tracked source UUID if present (from a previous import)
    const sourceUuidValue = entry.customData?.get(CUSTOM_KEY_SOURCE_UUID)?.value;
    if (sourceUuidValue) {
      knownSourceUuids.add(sourceUuidValue);
    }
  }

  // ─── Import entries ──────────────────────────────────────────────────

  const skipped: SkippedEntry[] = [];
  let imported = 0;
  let total = 0;

  for (const entry of sourceDefaultGroup.allEntries()) {
    total++;

    // Skip entries in the source recycle bin
    if (sourceRecycleBinUuid && entry.parentGroup?.uuid.equals(sourceRecycleBinUuid)) {
      skipped.push({
        identifier: entry.uuid.toString(),
        reason: 'Entry is in the recycle bin.',
      });
      continue;
    }

    const sourceEntryUuid = entry.uuid.toString();

    // Skip if this source UUID was already imported previously
    if (knownSourceUuids.has(sourceEntryUuid)) {
      skipped.push({
        identifier: sourceEntryUuid,
        reason: 'Entry with same UUID already exists in vault.',
      });
      continue;
    }

    // Determine target group by matching source parent group name
    const targetGroup = resolveTargetGroup(
      targetDb,
      targetDefaultGroup,
      entry.parentGroup,
      sourceDefaultGroup
    );

    // Import entry using kdbxweb's importEntry (preserves history, binaries, fields)
    try {
      const importedEntry = targetDb.importEntry(entry, targetGroup, sourceDb);

      // Fix 1: Track source UUID for deduplication on repeated imports
      if (!importedEntry.customData) {
        importedEntry.customData = new Map();
      }
      importedEntry.customData.set(CUSTOM_KEY_SOURCE_UUID, { value: sourceEntryUuid });

      // Fix 2: Copy all _qufly_* customData keys from source (type, favorite, etc.)
      // importEntry's copyFrom() does NOT copy customData
      if (entry.customData) {
        for (const [key, item] of entry.customData) {
          if (key.startsWith(QUFLY_CUSTOM_PREFIX) && key !== CUSTOM_KEY_SOURCE_UUID) {
            importedEntry.customData.set(key, { value: item.value });
          }
        }
      }

      // Also add to known set so concurrent entries in the same import don't collide
      knownSourceUuids.add(sourceEntryUuid);
      imported++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      skipped.push({
        identifier: sourceEntryUuid,
        reason: `Import failed: ${msg}`,
      });
    }
  }

  return { imported, skipped, total };
}

/**
 * Export the current vault as an ArrayBuffer (KDBX format).
 */
export async function exportKdbx(db: kdbxweb.Kdbx): Promise<ArrayBuffer> {
  return await db.save();
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolves the target group for an imported entry.
 * Matches source parent group name to target groups.
 * Creates the group if it doesn't exist.
 * If the entry was in the source's root group, places in target root.
 */
function resolveTargetGroup(
  targetDb: kdbxweb.Kdbx,
  targetDefaultGroup: kdbxweb.KdbxGroup,
  sourceParentGroup: kdbxweb.KdbxGroup | undefined,
  sourceDefaultGroup: kdbxweb.KdbxGroup
): kdbxweb.KdbxGroup {
  if (!sourceParentGroup || sourceParentGroup === sourceDefaultGroup) {
    return targetDefaultGroup;
  }

  const groupName = sourceParentGroup.name;
  if (!groupName) {
    return targetDefaultGroup;
  }

  // Find existing group by name in target
  for (const group of targetDefaultGroup.groups) {
    if (group.name === groupName) {
      return group;
    }
  }

  // Create group in target
  return targetDb.createGroup(targetDefaultGroup, groupName);
}
