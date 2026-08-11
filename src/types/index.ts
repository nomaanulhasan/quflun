// Core TypeScript interfaces for Quflun Password Manager

// ─── Entry Types ───────────────────────────────────────────────────────────────

/**
 * A full vault entry as stored in the KDBX database.
 * Maps to KDBX fields per the design document.
 */
export interface VaultEntry {
  /** RFC 4122 UUID */
  uuid: string;
  /** Entry type: password credential, secure note, or application PIN */
  type: 'password' | 'note' | 'pin';
  /** Entry title, 1–256 chars */
  title: string;
  /** Username, 0–256 chars */
  username: string;
  /** Password value, 1–10,000 chars (password entries) or PIN value (pin entries) */
  password: string;
  /** URL, 0–2,048 chars */
  url: string;
  /** Notes text, 0–10,000 chars (or body for secure notes) */
  notes: string;
  /** Category name, 0–128 chars, or null for uncategorized */
  category: string | null;
  /** Tags array, max 20 tags, each max 64 chars */
  tags: string[];
  /** Whether the entry is marked as a favorite */
  favorite: boolean;
  /** Creation timestamp in ISO 8601 UTC */
  createdAt: string;
  /** Last modification timestamp in ISO 8601 UTC */
  modifiedAt: string;
  /** Custom key-value fields (API keys, recovery codes, etc.) */
  customFields: CustomField[];
  /** File attachments (SSH keys, certificates, etc.) */
  attachments: AttachmentMeta[];
}

/** Custom field stored in KDBX entry.fields beyond the standard 5. */
export interface CustomField {
  key: string;
  value: string;
  /** Whether the value should be masked (stored as ProtectedValue in KDBX) */
  protected: boolean;
}

/** Attachment metadata (binary content fetched separately to avoid memory bloat). */
export interface AttachmentMeta {
  key: string;
  size: number;
}

/**
 * Input data for creating or editing a password entry.
 */
export interface EntryInput {
  title: string;
  username?: string;
  password: string;
  url?: string;
  notes?: string;
  category?: string;
  tags?: string[];
  favorite?: boolean;
  customFields?: CustomField[];
}

/**
 * Input data for creating or editing a secure note.
 */
export interface NoteInput {
  title: string;
  body: string;
  category?: string;
  tags?: string[];
  favorite?: boolean;
}

/**
 * Input data for creating or editing an application PIN.
 */
export interface PinInput {
  title: string;
  pin: string;
  notes?: string;
  category?: string;
  tags?: string[];
  favorite?: boolean;
}

/**
 * Lightweight entry representation for list views (no password exposed).
 */
export interface EntryListItem {
  uuid: string;
  type: 'password' | 'note' | 'pin';
  title: string;
  username: string;
  url: string;
  category: string | null;
  tags: string[];
  favorite: boolean;
  modifiedAt: string;
  /** Password strength indicator for card display (null for notes and PINs) */
  passwordStrength: 'weak' | 'fair' | 'strong' | null;
}

// ─── Application Settings ──────────────────────────────────────────────────────

/**
 * User-configurable application settings stored in IndexedDB.
 */
export interface AppSettings {
  /** Auto-lock idle timeout in minutes (1–60, default 5) */
  idleTimeoutMinutes: number;
  /** Clipboard auto-clear timeout in seconds (5–120, default 30) */
  clipboardTimeoutSeconds: number;
  /** Backup reminder interval in days (default 30) */
  backupReminderDays: number;
  /** Last backup date in ISO 8601, or null if never backed up */
  lastBackupDate: string | null;
  /** UI theme preference */
  theme: 'light' | 'dark' | 'system';
  /** Custom keyboard shortcut bindings */
  shortcuts: ShortcutBindings;
}

// ─── Keyboard Shortcuts ────────────────────────────────────────────────────────

/** Identifiers for configurable shortcuts */
export type ShortcutId = 'commandPalette' | 'newEntry' | 'newNote' | 'lockVault';

/** A single shortcut binding */
export interface ShortcutBinding {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
}

/** Map of all configurable shortcut bindings */
export type ShortcutBindings = Record<ShortcutId, ShortcutBinding>;

// ─── Vault Metadata ────────────────────────────────────────────────────────────

/**
 * Metadata for a vault record stored in IndexedDB.
 */
export interface VaultMeta {
  /** Unique vault identifier */
  id: string;
  /** User-provided vault name */
  name: string;
  /** Last opened timestamp in ISO 8601 */
  lastOpened: string;
}
