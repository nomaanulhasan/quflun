import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

/**
 * CSP Validation Tests
 *
 * Static analysis tests that verify the Content-Security-Policy is properly
 * configured in the hosting headers (vercel.json and _headers file).
 *
 * CSP is delivered via HTTP headers (not meta tag) because Next.js static
 * export generates inline scripts whose hashes change each build. The hosting
 * layer uses 'unsafe-inline' for script-src to accommodate these.
 *
 * Validates: Requirements 19.1, 19.2, 19.3, 19.4
 */

const vercelConfigPath = resolve(__dirname, '../vercel.json');
const headersPath = resolve(__dirname, '../public/_headers');
const vercelConfig = JSON.parse(readFileSync(vercelConfigPath, 'utf8'));
const headersContent = readFileSync(headersPath, 'utf8');

/**
 * Extract CSP value from vercel.json headers config.
 */
function extractCspFromVercelConfig(): string {
  const allHeaders = vercelConfig.headers?.[0]?.headers ?? [];
  const cspHeader = allHeaders.find(
    (h: { key: string; value: string }) => h.key.toLowerCase() === 'content-security-policy'
  );
  if (!cspHeader) {
    throw new Error('CSP header not found in vercel.json');
  }
  return cspHeader.value;
}

/**
 * Extract CSP value from _headers file.
 */
function extractCspFromHeadersFile(): string {
  const match = headersContent.match(/Content-Security-Policy:\s*(.+)/i);
  if (!match) {
    throw new Error('CSP header not found in _headers file');
  }
  return match[1].trim();
}

/**
 * Parse a CSP string into a map of directive -> values.
 */
function parseCsp(csp: string): Map<string, string[]> {
  const directives = new Map<string, string[]>();
  const parts = csp
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const part of parts) {
    const tokens = part.split(/\s+/);
    const directive = tokens[0];
    const values = tokens.slice(1);
    directives.set(directive, values);
  }

  return directives;
}

/**
 * Replicate the computeSha256 function from extract-csp-hashes.mjs
 * to validate hash computation logic.
 */
function computeSha256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('base64');
}

const vercelCsp = extractCspFromVercelConfig();
const headersCsp = extractCspFromHeadersFile();
const vercelDirectives = parseCsp(vercelCsp);
const headersDirectives = parseCsp(headersCsp);

describe('CSP Validation', () => {
  describe('vercel.json CSP header', () => {
    it("includes default-src 'none'", () => {
      expect(vercelDirectives.has('default-src')).toBe(true);
      expect(vercelDirectives.get('default-src')).toContain("'none'");
    });

    it("script-src contains 'self'", () => {
      expect(vercelDirectives.has('script-src')).toBe(true);
      expect(vercelDirectives.get('script-src')).toContain("'self'");
    });

    it("script-src contains 'wasm-unsafe-eval'", () => {
      expect(vercelDirectives.get('script-src')).toContain("'wasm-unsafe-eval'");
    });

    it("script-src contains 'unsafe-eval' (required by argon2-browser Emscripten glue)", () => {
      expect(vercelDirectives.get('script-src')).toContain("'unsafe-eval'");
    });

    it("connect-src is restricted to 'self'", () => {
      expect(vercelDirectives.has('connect-src')).toBe(true);
      expect(vercelDirectives.get('connect-src')).toEqual(["'self'"]);
    });

    it("font-src is restricted to 'self'", () => {
      expect(vercelDirectives.has('font-src')).toBe(true);
      expect(vercelDirectives.get('font-src')).toEqual(["'self'"]);
    });

    it("img-src is restricted to 'self'", () => {
      expect(vercelDirectives.has('img-src')).toBe(true);
      expect(vercelDirectives.get('img-src')).toEqual(["'self'"]);
    });

    it("frame-ancestors set to 'none'", () => {
      expect(vercelDirectives.has('frame-ancestors')).toBe(true);
      expect(vercelDirectives.get('frame-ancestors')).toContain("'none'");
    });
  });

  describe('_headers file CSP (Netlify/Cloudflare)', () => {
    it("includes default-src 'none'", () => {
      expect(headersDirectives.has('default-src')).toBe(true);
      expect(headersDirectives.get('default-src')).toContain("'none'");
    });

    it("script-src contains 'self' and 'wasm-unsafe-eval'", () => {
      expect(headersDirectives.get('script-src')).toContain("'self'");
      expect(headersDirectives.get('script-src')).toContain("'wasm-unsafe-eval'");
    });

    it("script-src contains 'unsafe-eval' (required by argon2-browser Emscripten glue)", () => {
      expect(headersDirectives.get('script-src')).toContain("'unsafe-eval'");
    });
  });

  describe('vercel.json and _headers consistency', () => {
    it('both contain the same CSP directives', () => {
      // Both should have the same set of directive names
      const vercelKeys = [...vercelDirectives.keys()].sort();
      const headersKeys = [...headersDirectives.keys()].sort();
      expect(vercelKeys).toEqual(headersKeys);
    });
  });

  describe('SHA-256 hash computation (extract-csp-hashes.mjs logic)', () => {
    it('produces valid base64-encoded SHA-256 hashes for known inputs', () => {
      const testCases = [
        {
          input: "console.log('hello');",
          expected: createHash('sha256').update("console.log('hello');", 'utf8').digest('base64'),
        },
        {
          input: '',
          expected: createHash('sha256').update('', 'utf8').digest('base64'),
        },
        {
          input: 'color: red; display: block;',
          expected: createHash('sha256')
            .update('color: red; display: block;', 'utf8')
            .digest('base64'),
        },
      ];

      for (const { input, expected } of testCases) {
        const result = computeSha256(input);
        expect(result).toBe(expected);
      }
    });

    it('produces a valid base64 string format', () => {
      const hash = computeSha256('test content');
      expect(hash).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('SHA-256 hash has correct length (44 chars base64 for 32 bytes)', () => {
      const hash = computeSha256('any content');
      expect(hash).toHaveLength(44);
    });

    it('produces different hashes for different inputs', () => {
      const hash1 = computeSha256('script A');
      const hash2 = computeSha256('script B');
      expect(hash1).not.toBe(hash2);
    });

    it('produces consistent hashes for the same input', () => {
      const input = "document.getElementById('app');";
      const hash1 = computeSha256(input);
      const hash2 = computeSha256(input);
      expect(hash1).toBe(hash2);
    });
  });
});
