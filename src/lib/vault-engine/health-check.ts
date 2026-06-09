import type * as kdbxweb from 'kdbxweb';

/**
 * Result of a vault health check operation.
 * Contains structural metadata only — no secrets are exposed.
 */
export interface HealthCheckResult {
  status: 'healthy' | 'corrupted' | 'error';
  entryCount: number;
  groupCount: number;
  errors: string[];
  timestamp: string; // ISO 8601
}

/**
 * Interface for vault structural integrity validation.
 */
export interface VaultHealthCheck {
  run(db: kdbxweb.Kdbx): Promise<HealthCheckResult>;
}

/** KDBX file magic bytes: 0x03D9A29A (little-endian) */
const KDBX_MAGIC_1 = 0x9aa2d903;

/**
 * Creates a VaultHealthCheck instance.
 * The check validates:
 * 1. Group hierarchy — counts groups, verifies parent references
 * 2. Entry integrity — counts entries, verifies UUID uniqueness, verifies required fields
 * 3. Serialization — performs db.save(), verifies non-empty output with KDBX magic bytes
 *
 * CRITICAL: Never calls .getText() on any ProtectedValue.
 */
export function createVaultHealthCheck(): VaultHealthCheck {
  return {
    async run(db: kdbxweb.Kdbx): Promise<HealthCheckResult> {
      const errors: string[] = [];
      let entryCount = 0;
      let groupCount = 0;

      try {
        const defaultGroup = db.getDefaultGroup();
        if (!defaultGroup) {
          return {
            status: 'corrupted',
            entryCount: 0,
            groupCount: 0,
            errors: ['Default group is missing.'],
            timestamp: new Date().toISOString(),
          };
        }

        // ─── 1. Verify group hierarchy ─────────────────────────────────

        const visitedGroups = new Set<string>();

        function countGroups(group: kdbxweb.KdbxGroup, expectedParent: kdbxweb.KdbxGroup | undefined): void {
          groupCount++;
          const groupId = group.uuid.toString();

          // Check for duplicate group UUIDs
          if (visitedGroups.has(groupId)) {
            errors.push(`Duplicate group UUID: ${groupId}`);
          } else {
            visitedGroups.add(groupId);
          }

          // Verify parent reference (root group has no parent)
          if (expectedParent !== undefined && group.parentGroup !== expectedParent) {
            errors.push(
              `Group "${group.name || groupId}" has incorrect parent reference.`
            );
          }

          // Recurse into child groups
          for (const childGroup of group.groups) {
            countGroups(childGroup, group);
          }
        }

        // Start from root — root's parent is undefined
        countGroups(defaultGroup, undefined);

        // ─── 2. Verify entry integrity ─────────────────────────────────

        const entryUuids = new Set<string>();

        for (const entry of defaultGroup.allEntries()) {
          entryCount++;
          const entryId = entry.uuid.toString();

          // Check UUID uniqueness
          if (entryUuids.has(entryId)) {
            errors.push(`Duplicate entry UUID: ${entryId}`);
          } else {
            entryUuids.add(entryId);
          }

          // Verify required fields exist (Title must be present)
          const title = entry.fields.get('Title');
          if (title === undefined || title === null) {
            errors.push(`Entry ${entryId} is missing Title field.`);
          }

          // Verify Password field exists (can be empty ProtectedValue for notes)
          const password = entry.fields.get('Password');
          if (password === undefined || password === null) {
            errors.push(`Entry ${entryId} is missing Password field.`);
          }
          // CRITICAL: Do NOT call .getText() on password — no secrets exposed

          // Verify entry has a parent group
          if (!entry.parentGroup) {
            errors.push(`Entry ${entryId} has no parent group.`);
          }
        }

        // ─── 3. Verify KDBX serialization ──────────────────────────────

        let buffer: ArrayBuffer;
        try {
          buffer = await db.save();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown serialization error';
          errors.push(`Serialization failed: ${msg}`);
          return {
            status: 'corrupted',
            entryCount,
            groupCount,
            errors,
            timestamp: new Date().toISOString(),
          };
        }

        // Verify non-empty
        if (!buffer || buffer.byteLength === 0) {
          errors.push('Serialization produced empty output.');
        } else {
          // Verify KDBX magic bytes (first 4 bytes, little-endian)
          const view = new DataView(buffer);
          const magic = view.getUint32(0, true);
          if (magic !== KDBX_MAGIC_1) {
            errors.push(
              `Invalid KDBX magic bytes: expected 0x${KDBX_MAGIC_1.toString(16)}, got 0x${magic.toString(16)}.`
            );
          }
        }

        // ─── Determine status ──────────────────────────────────────────

        const status = errors.length === 0 ? 'healthy' : 'corrupted';

        return {
          status,
          entryCount,
          groupCount,
          errors,
          timestamp: new Date().toISOString(),
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return {
          status: 'error',
          entryCount,
          groupCount,
          errors: [...errors, `Unexpected error: ${msg}`],
          timestamp: new Date().toISOString(),
        };
      }
    },
  };
}
