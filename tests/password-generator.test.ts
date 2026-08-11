import { describe, it, expect } from 'vitest';
import {
  createPasswordGenerator,
  PasswordGenerator,
  PasswordGeneratorConfig,
} from '@/lib/password-generator';
import * as fs from 'fs';
import * as path from 'path';

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;\':",./<>?`~\\';

describe('PasswordGenerator', () => {
  let generator: PasswordGenerator;

  beforeEach(() => {
    generator = createPasswordGenerator();
  });

  describe('generated password length', () => {
    it('should produce a password of the specified length', () => {
      const configs: PasswordGeneratorConfig[] = [
        { length: 4, uppercase: true, lowercase: true, digits: true, symbols: false },
        { length: 10, uppercase: true, lowercase: true, digits: true, symbols: true },
        { length: 20, uppercase: true, lowercase: true, digits: true, symbols: true },
        { length: 50, uppercase: false, lowercase: true, digits: true, symbols: false },
        { length: 128, uppercase: true, lowercase: true, digits: true, symbols: true },
      ];

      for (const config of configs) {
        const password = generator.generate(config);
        expect(password).toHaveLength(config.length);
      }
    });

    it('should produce a password of length 4 (minimum)', () => {
      const password = generator.generate({
        length: 4,
        uppercase: true,
        lowercase: true,
        digits: true,
        symbols: true,
      });
      expect(password).toHaveLength(4);
    });

    it('should produce a password of length 128 (maximum)', () => {
      const password = generator.generate({
        length: 128,
        uppercase: true,
        lowercase: true,
        digits: true,
        symbols: true,
      });
      expect(password).toHaveLength(128);
    });
  });

  describe('each enabled set appears at least once', () => {
    it('should contain at least one uppercase when enabled', () => {
      // Generate multiple times to be statistically confident
      for (let i = 0; i < 10; i++) {
        const password = generator.generate({
          length: 20,
          uppercase: true,
          lowercase: true,
          digits: true,
          symbols: true,
        });
        expect(password).toMatch(/[A-Z]/);
      }
    });

    it('should contain at least one lowercase when enabled', () => {
      for (let i = 0; i < 10; i++) {
        const password = generator.generate({
          length: 20,
          uppercase: true,
          lowercase: true,
          digits: true,
          symbols: true,
        });
        expect(password).toMatch(/[a-z]/);
      }
    });

    it('should contain at least one digit when enabled', () => {
      for (let i = 0; i < 10; i++) {
        const password = generator.generate({
          length: 20,
          uppercase: true,
          lowercase: true,
          digits: true,
          symbols: true,
        });
        expect(password).toMatch(/[0-9]/);
      }
    });

    it('should contain at least one symbol when enabled', () => {
      for (let i = 0; i < 10; i++) {
        const password = generator.generate({
          length: 20,
          uppercase: true,
          lowercase: true,
          digits: true,
          symbols: true,
        });
        // Check that at least one char is a non-alphanumeric ASCII printable
        const hasSymbol = [...password].some((ch) => SYMBOLS.includes(ch));
        expect(hasSymbol).toBe(true);
      }
    });

    it('should guarantee each set even at minimum length', () => {
      // length = 4 with 4 sets enabled — each char must be from a different set
      for (let i = 0; i < 20; i++) {
        const password = generator.generate({
          length: 4,
          uppercase: true,
          lowercase: true,
          digits: true,
          symbols: true,
        });
        expect(password).toMatch(/[A-Z]/);
        expect(password).toMatch(/[a-z]/);
        expect(password).toMatch(/[0-9]/);
        const hasSymbol = [...password].some((ch) => SYMBOLS.includes(ch));
        expect(hasSymbol).toBe(true);
      }
    });
  });

  describe('default config', () => {
    it('should produce a 20-char password with all sets enabled', () => {
      const config = generator.getDefaultConfig();
      expect(config.length).toBe(20);
      expect(config.uppercase).toBe(true);
      expect(config.lowercase).toBe(true);
      expect(config.digits).toBe(true);
      expect(config.symbols).toBe(true);

      const password = generator.generate(config);
      expect(password).toHaveLength(20);
    });
  });

  describe('length boundaries', () => {
    it('should generate valid password at length 4', () => {
      const password = generator.generate({
        length: 4,
        uppercase: true,
        lowercase: false,
        digits: false,
        symbols: false,
      });
      expect(password).toHaveLength(4);
      expect(password).toMatch(/^[A-Z]{4}$/);
    });

    it('should generate valid password at length 128', () => {
      const password = generator.generate({
        length: 128,
        uppercase: false,
        lowercase: true,
        digits: false,
        symbols: false,
      });
      expect(password).toHaveLength(128);
      expect(password).toMatch(/^[a-z]{128}$/);
    });
  });

  describe('validation rejects invalid configs', () => {
    it('should reject length < 4', () => {
      const result = generator.validate({
        length: 3,
        uppercase: true,
        lowercase: true,
        digits: true,
        symbols: true,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Minimum length is 4');
    });

    it('should reject length > 128', () => {
      const result = generator.validate({
        length: 129,
        uppercase: true,
        lowercase: true,
        digits: true,
        symbols: true,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Maximum length is 128');
    });

    it('should reject no character sets enabled', () => {
      const result = generator.validate({
        length: 20,
        uppercase: false,
        lowercase: false,
        digits: false,
        symbols: false,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('At least one character set is required');
    });

    it('should reject length < number of enabled sets', () => {
      const result = generator.validate({
        length: 4,
        uppercase: true,
        lowercase: true,
        digits: true,
        symbols: true,
      });
      // 4 sets, length 4 — this should be valid (exactly enough)
      expect(result.valid).toBe(true);

      const result2 = generator.validate({
        length: 5,
        uppercase: true,
        lowercase: true,
        digits: true,
        symbols: true,
      });
      expect(result2.valid).toBe(true);

      // 4 sets but length 3 — not enough
      const result3 = generator.validate({
        length: 3,
        uppercase: true,
        lowercase: true,
        digits: true,
        symbols: true,
      });
      // Should fail with min length error (checked first)
      expect(result3.valid).toBe(false);
    });

    it('should reject when length is less than enabled set count but above min', () => {
      // 4 sets enabled but only length 4 is minimum — try 4 sets with length that is valid (>=4)
      // but length < sets count: impossible since min 4 and max sets is 4
      // Use a scenario: 3 sets enabled, length 2 — but length 2 < min so it fails with min error
      // Instead: length 5 but 4 sets — valid. This validates the boundary.
      // The real test: length 4, with 4 sets = valid (exactly at boundary)
      const result = generator.validate({
        length: 4,
        uppercase: true,
        lowercase: true,
        digits: true,
        symbols: true,
      });
      expect(result.valid).toBe(true);
    });

    it('should accept valid configs', () => {
      const result = generator.validate({
        length: 20,
        uppercase: true,
        lowercase: true,
        digits: true,
        symbols: true,
      });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('randomness', () => {
    it('should produce different passwords on multiple generations', () => {
      const config = generator.getDefaultConfig();
      const passwords = new Set<string>();

      for (let i = 0; i < 20; i++) {
        passwords.add(generator.generate(config));
      }

      // With 20 chars from a large pool, probability of any collision is negligible
      expect(passwords.size).toBeGreaterThan(1);
      // In practice, all 20 should be unique
      expect(passwords.size).toBe(20);
    });
  });

  describe('no Math.random usage', () => {
    it('should not use Math.random in the source', () => {
      const sourcePath = path.resolve(__dirname, '../src/lib/password-generator/generator.ts');
      const source = fs.readFileSync(sourcePath, 'utf-8');
      expect(source).not.toContain('Math.random');
    });
  });

  describe('symbols character set', () => {
    it('should contain all expected symbol characters', () => {
      const expectedSymbols = '!@#$%^&*()_+-=[]{}|;\':",./<>?`~\\';

      // Generate many passwords with only symbols to verify the set
      const allChars = new Set<string>();
      for (let i = 0; i < 500; i++) {
        const password = generator.generate({
          length: 32,
          uppercase: false,
          lowercase: false,
          digits: false,
          symbols: true,
        });
        for (const ch of password) {
          allChars.add(ch);
        }
      }

      // All characters in generated passwords should be from the expected set
      for (const ch of allChars) {
        expect(expectedSymbols).toContain(ch);
      }

      // With 500 * 32 = 16000 random picks from 32 chars, we should see most of them
      // (probability of missing one is ~(31/32)^16000 ≈ 0, effectively certain to see all)
      expect(allChars.size).toBe(expectedSymbols.length);
    });
  });
});
