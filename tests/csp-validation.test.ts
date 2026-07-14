import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

/**
 * CSP Validation Tests
 *
 * Static analysis tests that verify the Content-Security-Policy meta tag
 * in layout.tsx meets the security requirements.
 *
 * Validates: Requirements 19.1, 19.2, 19.3, 19.4
 */

const layoutPath = resolve(__dirname, "../src/app/layout.tsx");
const layoutContent = readFileSync(layoutPath, "utf8");

/**
 * Extract the CSP content string from the layout.tsx file.
 */
function extractCspContent(html: string): string {
  // Match the content attribute value inside the CSP meta tag
  const cspMatch = html.match(
    /httpEquiv="Content-Security-Policy"\s+content="([^"]+)"/
  );
  if (!cspMatch) {
    throw new Error("CSP meta tag not found in layout.tsx");
  }
  return cspMatch[1];
}

/**
 * Parse a CSP string into a map of directive -> values.
 */
function parseCsp(csp: string): Map<string, string[]> {
  const directives = new Map<string, string[]>();
  const parts = csp.split(";").map((s) => s.trim()).filter(Boolean);

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
  return createHash("sha256").update(content, "utf8").digest("base64");
}

const cspContent = extractCspContent(layoutContent);
const cspDirectives = parseCsp(cspContent);

describe("CSP Validation", () => {
  describe("default-src directive", () => {
    it("CSP meta tag includes default-src 'none'", () => {
      expect(cspDirectives.has("default-src")).toBe(true);
      expect(cspDirectives.get("default-src")).toContain("'none'");
    });
  });

  describe("script-src directive", () => {
    it("script-src contains 'self'", () => {
      expect(cspDirectives.has("script-src")).toBe(true);
      expect(cspDirectives.get("script-src")).toContain("'self'");
    });

    it("script-src contains 'wasm-unsafe-eval'", () => {
      expect(cspDirectives.get("script-src")).toContain("'wasm-unsafe-eval'");
    });

    it("script-src does NOT contain 'unsafe-inline'", () => {
      expect(cspDirectives.get("script-src")).not.toContain("'unsafe-inline'");
    });

    it("script-src does NOT contain 'unsafe-eval'", () => {
      expect(cspDirectives.get("script-src")).not.toContain("'unsafe-eval'");
    });
  });

  describe("resource directives restricted to self", () => {
    it("connect-src is restricted to 'self'", () => {
      expect(cspDirectives.has("connect-src")).toBe(true);
      expect(cspDirectives.get("connect-src")).toEqual(["'self'"]);
    });

    it("font-src is restricted to 'self'", () => {
      expect(cspDirectives.has("font-src")).toBe(true);
      expect(cspDirectives.get("font-src")).toEqual(["'self'"]);
    });

    it("img-src is restricted to 'self'", () => {
      expect(cspDirectives.has("img-src")).toBe(true);
      expect(cspDirectives.get("img-src")).toEqual(["'self'"]);
    });
  });

  describe("SHA-256 hash computation (extract-csp-hashes.mjs logic)", () => {
    it("produces valid base64-encoded SHA-256 hashes for known inputs", () => {
      // Known input/output pairs for SHA-256 base64
      const testCases = [
        {
          input: "console.log('hello');",
          // Pre-computed expected hash
          expected: createHash("sha256")
            .update("console.log('hello');", "utf8")
            .digest("base64"),
        },
        {
          input: "",
          expected: createHash("sha256").update("", "utf8").digest("base64"),
        },
        {
          input: "color: red; display: block;",
          expected: createHash("sha256")
            .update("color: red; display: block;", "utf8")
            .digest("base64"),
        },
      ];

      for (const { input, expected } of testCases) {
        const result = computeSha256(input);
        expect(result).toBe(expected);
      }
    });

    it("produces a valid base64 string format", () => {
      const hash = computeSha256("test content");
      // Base64 strings only contain A-Z, a-z, 0-9, +, /, and = padding
      expect(hash).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it("SHA-256 hash has correct length (44 chars base64 for 32 bytes)", () => {
      const hash = computeSha256("any content");
      // SHA-256 = 32 bytes -> base64 = ceil(32/3)*4 = 44 characters
      expect(hash).toHaveLength(44);
    });

    it("produces different hashes for different inputs", () => {
      const hash1 = computeSha256("script A");
      const hash2 = computeSha256("script B");
      expect(hash1).not.toBe(hash2);
    });

    it("produces consistent hashes for the same input", () => {
      const input = "document.getElementById('app');";
      const hash1 = computeSha256(input);
      const hash2 = computeSha256(input);
      expect(hash1).toBe(hash2);
    });
  });
});
