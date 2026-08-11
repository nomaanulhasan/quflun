import {
  PASSWORD_GEN_MIN_LENGTH,
  PASSWORD_GEN_MAX_LENGTH,
  PASSWORD_GEN_DEFAULT_LENGTH,
} from '@/lib/constants';

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface PasswordGeneratorConfig {
  length: number; // 4–128
  uppercase: boolean;
  lowercase: boolean;
  digits: boolean;
  symbols: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface PasswordGenerator {
  generate(config: PasswordGeneratorConfig): string;
  getDefaultConfig(): PasswordGeneratorConfig;
  validate(config: PasswordGeneratorConfig): ValidationResult;
}

// ─── Character Sets ────────────────────────────────────────────────────────────

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const DIGIT_CHARS = '0123456789';
const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;\':",./<>?`~\\';

// ─── Implementation ────────────────────────────────────────────────────────────

/**
 * Picks a random index in [0, setSize) using rejection sampling to avoid modulo bias.
 * Uses crypto.getRandomValues() exclusively.
 */
function randomIndex(setSize: number): number {
  const threshold = 256 - (256 % setSize);
  const buf = new Uint8Array(1);

  while (true) {
    crypto.getRandomValues(buf);
    const byte = buf[0];
    if (byte < threshold) {
      return byte % setSize;
    }
  }
}

/**
 * Fisher-Yates shuffle using crypto.getRandomValues() for indices.
 */
function shuffle(arr: string[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    // Pick a random index in [0, i]
    const j = randomIndex(i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}

export function createPasswordGenerator(): PasswordGenerator {
  return {
    getDefaultConfig(): PasswordGeneratorConfig {
      return {
        length: PASSWORD_GEN_DEFAULT_LENGTH,
        uppercase: true,
        lowercase: true,
        digits: true,
        symbols: true,
      };
    },

    validate(config: PasswordGeneratorConfig): ValidationResult {
      if (config.length < PASSWORD_GEN_MIN_LENGTH) {
        return { valid: false, error: 'Minimum length is 4' };
      }
      if (config.length > PASSWORD_GEN_MAX_LENGTH) {
        return { valid: false, error: 'Maximum length is 128' };
      }

      const enabledSets: string[] = [];
      if (config.uppercase) enabledSets.push(UPPERCASE_CHARS);
      if (config.lowercase) enabledSets.push(LOWERCASE_CHARS);
      if (config.digits) enabledSets.push(DIGIT_CHARS);
      if (config.symbols) enabledSets.push(SYMBOL_CHARS);

      if (enabledSets.length === 0) {
        return { valid: false, error: 'At least one character set is required' };
      }

      if (config.length < enabledSets.length) {
        return {
          valid: false,
          error: `Length must be at least ${enabledSets.length} to include one character from each enabled set`,
        };
      }

      return { valid: true };
    },

    generate(config: PasswordGeneratorConfig): string {
      const validation = this.validate(config);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Collect enabled character sets
      const enabledSets: string[] = [];
      if (config.uppercase) enabledSets.push(UPPERCASE_CHARS);
      if (config.lowercase) enabledSets.push(LOWERCASE_CHARS);
      if (config.digits) enabledSets.push(DIGIT_CHARS);
      if (config.symbols) enabledSets.push(SYMBOL_CHARS);

      // Build combined pool
      const pool = enabledSets.join('');

      const chars: string[] = [];

      // Step a/b: Reserve one position for each enabled set, pick random char from that set
      for (const set of enabledSets) {
        const idx = randomIndex(set.length);
        chars.push(set[idx]);
      }

      // Step c: Fill remaining positions from combined pool
      const remaining = config.length - enabledSets.length;
      for (let i = 0; i < remaining; i++) {
        const idx = randomIndex(pool.length);
        chars.push(pool[idx]);
      }

      // Step e: Fisher-Yates shuffle the entire array
      shuffle(chars);

      // Step f: Return as string
      return chars.join('');
    },
  };
}
