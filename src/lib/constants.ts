// Validation constants for Quflun Password Manager

// ─── Field Length Limits ───────────────────────────────────────────────────────

/** Maximum length for entry title (characters) */
export const TITLE_MAX_LENGTH = 256;

/** Maximum length for username field (characters) */
export const USERNAME_MAX_LENGTH = 256;

/** Maximum length for password field (characters) */
export const PASSWORD_MAX_LENGTH = 10_000;

/** Maximum length for URL field (characters) */
export const URL_MAX_LENGTH = 2_048;

/** Maximum length for notes field (characters) */
export const NOTES_MAX_LENGTH = 10_000;

/** Maximum length for secure note body (characters) */
export const NOTE_BODY_MAX_LENGTH = 10_000;

/** Maximum length for entry category name (characters) */
export const CATEGORY_MAX_LENGTH = 128;

/** Maximum length for category/tag names when creating or renaming (characters) */
export const CATEGORY_NAME_MAX_LENGTH = 64;

/** Maximum length for a single tag (characters) */
export const TAG_MAX_LENGTH = 64;

/** Maximum number of tags per entry */
export const MAX_TAGS_PER_ENTRY = 20;

/** Maximum number of categories in the vault */
export const MAX_CATEGORIES = 50;

/** Maximum number of tags in the vault */
export const MAX_TAGS = 100;

// ─── Idle Timeout ──────────────────────────────────────────────────────────────

/** Minimum idle timeout in minutes */
export const IDLE_TIMEOUT_MIN = 1;

/** Maximum idle timeout in minutes */
export const IDLE_TIMEOUT_MAX = 60;

/** Default idle timeout in minutes */
export const IDLE_TIMEOUT_DEFAULT = 5;

// ─── Clipboard Timeout ─────────────────────────────────────────────────────────

/** Minimum clipboard clear timeout in seconds */
export const CLIPBOARD_TIMEOUT_MIN = 5;

/** Maximum clipboard clear timeout in seconds */
export const CLIPBOARD_TIMEOUT_MAX = 120;

/** Default clipboard clear timeout in seconds */
export const CLIPBOARD_TIMEOUT_DEFAULT = 30;

// ─── Backup ────────────────────────────────────────────────────────────────────

/** Default backup reminder interval in days */
export const BACKUP_REMINDER_DEFAULT_DAYS = 30;

// ─── Password Generator ────────────────────────────────────────────────────────

/** Minimum generated password length */
export const PASSWORD_GEN_MIN_LENGTH = 4;

/** Maximum generated password length */
export const PASSWORD_GEN_MAX_LENGTH = 128;

/** Default generated password length */
export const PASSWORD_GEN_DEFAULT_LENGTH = 20;

// ─── Search ────────────────────────────────────────────────────────────────────

/** Maximum search query length (characters) */
export const SEARCH_MAX_QUERY_LENGTH = 128;

// ─── Master Password ───────────────────────────────────────────────────────────

/** Minimum master password length (characters) */
export const MASTER_PASSWORD_MIN_LENGTH = 1;

/** Maximum master password length (characters) */
export const MASTER_PASSWORD_MAX_LENGTH = 128;

/** Password length below which a weak-password warning is shown */
export const MASTER_PASSWORD_WEAK_THRESHOLD = 8;

// ─── Brute-Force Protection ────────────────────────────────────────────────────

/** Maximum consecutive unlock attempts before cooldown */
export const MAX_UNLOCK_ATTEMPTS = 5;

/** Cooldown duration in seconds after max failed attempts */
export const UNLOCK_COOLDOWN_SECONDS = 60;

// ─── Import/Export ─────────────────────────────────────────────────────────────

/** Maximum import file size in megabytes */
export const IMPORT_MAX_FILE_SIZE_MB = 100;

/** Maximum number of entries that can be imported */
export const IMPORT_MAX_ENTRIES = 10_000;
