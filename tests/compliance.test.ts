/**
 * Compliance tests — no telemetry, no external requests, no forbidden storage
 *
 * Validates: Requirements 14.1, 14.2, 14.6, 14.7, 21.1, 21.2
 *
 * These tests perform static analysis on the source code and dependency tree
 * to ensure the app remains privacy-first with zero external communication.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const PKG_PATH = path.join(ROOT_DIR, 'package.json');

/**
 * Recursively collect all .ts and .tsx files from a directory.
 */
function collectSourceFiles(dir: string, extensions = ['.ts', '.tsx']): string[] {
  const results: string[] = [];

  function walk(current: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        // Skip node_modules and .next build artifacts
        if (entry.name === 'node_modules' || entry.name === '.next') continue;
        walk(fullPath);
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }

  walk(dir);
  return results;
}

/**
 * Files that are documentation/info pages — allowed to contain external URLs
 * as references for users to visit.
 */
const EXCLUDED_URL_FILES = ['security.tsx', 'privacy.tsx', 'security-limitations.tsx'];

function isExcludedFromUrlScan(filePath: string): boolean {
  const fileName = path.basename(filePath);
  // Also match page.tsx inside these route directories
  const parentDir = path.basename(path.dirname(filePath));
  return (
    EXCLUDED_URL_FILES.includes(fileName) ||
    (fileName === 'page.tsx' &&
      ['security', 'privacy', 'security-limitations'].includes(parentDir))
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Compliance: No telemetry, no external requests, no forbidden storage', () => {
  describe('1. Production dependencies contain zero analytics/tracking/telemetry packages', () => {
    it('should not have any known telemetry or analytics packages in dependencies', () => {
      const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
      const dependencies = Object.keys(pkg.dependencies || {});

      const TELEMETRY_PACKAGES = [
        'google-analytics',
        '@google-analytics',
        'ga-4-react',
        'react-ga',
        'react-ga4',
        'mixpanel',
        'mixpanel-browser',
        '@segment/analytics-next',
        'analytics-node',
        '@segment/analytics.js-core',
        'amplitude-js',
        '@amplitude/analytics-browser',
        'hotjar-react-tracker',
        '@hotjar/browser',
        '@sentry/browser',
        '@sentry/react',
        '@sentry/nextjs',
        'sentry',
        'posthog-js',
        'posthog-node',
        'plausible-tracker',
        'heap-api',
        '@heap/heap-web',
        '@fullstory/browser',
        'fullstory',
        'datadog-rum',
        '@datadog/browser-rum',
        'logrocket',
        'bugsnag',
        '@bugsnag/js',
        'rollbar',
        'newrelic',
        'pendo-sdk',
        'intercom-client',
      ];

      const found = dependencies.filter((dep: string) =>
        TELEMETRY_PACKAGES.some(
          (telemetry) => dep === telemetry || dep.startsWith(telemetry + '/')
        )
      );

      expect(found).toEqual([]);
    });
  });

  describe('2. No localStorage.setItem or sessionStorage.setItem calls in source code', () => {
    it('should not use localStorage.setItem anywhere in src/', () => {
      const files = collectSourceFiles(SRC_DIR);
      const violations: string[] = [];

      for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes('localStorage.setItem')) {
          const relativePath = path.relative(ROOT_DIR, filePath);
          violations.push(relativePath);
        }
      }

      expect(violations).toEqual([]);
    });

    it('should not use sessionStorage.setItem anywhere in src/', () => {
      const files = collectSourceFiles(SRC_DIR);
      const violations: string[] = [];

      for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes('sessionStorage.setItem')) {
          const relativePath = path.relative(ROOT_DIR, filePath);
          violations.push(relativePath);
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe('3. No external URLs (CDN, analytics endpoints) in source code', () => {
    it('should not contain external http/https URLs in source files (excluding docs pages)', () => {
      const files = collectSourceFiles(SRC_DIR);
      const violations: { file: string; line: number; url: string }[] = [];

      // Matches http:// or https:// URLs
      const urlPattern = /https?:\/\/[^\s'"`)>]+/g;

      // Allowed patterns — localhost, relative self-references, and common safe patterns
      const ALLOWED_PATTERNS = [
        /^https?:\/\/localhost/,
        /^https?:\/\/127\.0\.0\.1/,
        /^https?:\/\/0\.0\.0\.0/,
        /^https?:\/\/\[::1\]/,
        // Example/placeholder domains (RFC 2606)
        /^https?:\/\/example\.(com|org|net)/,
        // Schema.org metadata
        /^https?:\/\/schema\.org/,
        // Next.js/Vercel internal references in comments
        /^https?:\/\/nextjs\.org/,
        /^https?:\/\/vercel\.com/,
        // TypeScript/ESLint config references
        /^https?:\/\/typescript/,
        // W3C references
        /^https?:\/\/www\.w3\.org/,
        // GitHub references (documentation links)
        /^https?:\/\/github\.com/,
        // MDN documentation references
        /^https?:\/\/developer\.mozilla\.org/,
        // OWASP references
        /^https?:\/\/owasp\.org/,
        /^https?:\/\/cheatsheetseries\.owasp\.org/,
        // Web standard specifications
        /^https?:\/\/www\.rfc-editor\.org/,
        /^https?:\/\/tools\.ietf\.org/,
        // Font/asset self-hosted references (next/font)
        /^https?:\/\/fonts\.googleapis\.com/,
        /^https?:\/\/fonts\.gstatic\.com/,
      ];

      for (const filePath of files) {
        // Skip documentation pages that are allowed to have external links
        if (isExcludedFromUrlScan(filePath)) continue;

        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Skip comment lines
          const trimmed = line.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
            continue;
          }

          const matches = line.matchAll(urlPattern);
          for (const match of matches) {
            const url = match[0];
            const isAllowed = ALLOWED_PATTERNS.some((pattern) => pattern.test(url));
            if (!isAllowed) {
              violations.push({
                file: path.relative(ROOT_DIR, filePath),
                line: i + 1,
                url,
              });
            }
          }
        }
      }

      if (violations.length > 0) {
        const details = violations
          .map((v) => `  ${v.file}:${v.line} → ${v.url}`)
          .join('\n');
        expect.fail(
          `Found ${violations.length} external URL(s) in source code:\n${details}`
        );
      }
    });
  });

  describe('4. No uuid package import in source code', () => {
    it('should not import from uuid package anywhere in src/', () => {
      const files = collectSourceFiles(SRC_DIR);
      const violations: { file: string; line: number; content: string }[] = [];

      const importPatterns = [
        /import\s+.*\s+from\s+['"]uuid['"]/,
        /import\s+['"]uuid['"]/,
        /require\s*\(\s*['"]uuid['"]\s*\)/,
      ];

      for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          for (const pattern of importPatterns) {
            if (pattern.test(line)) {
              violations.push({
                file: path.relative(ROOT_DIR, filePath),
                line: i + 1,
                content: line.trim(),
              });
            }
          }
        }
      }

      if (violations.length > 0) {
        const details = violations
          .map((v) => `  ${v.file}:${v.line} → ${v.content}`)
          .join('\n');
        expect.fail(
          `Found uuid package import(s) in source code:\n${details}`
        );
      }
    });
  });

  describe('5. No eval() or new Function() usage in source code', () => {
    it('should not use eval() anywhere in src/', () => {
      const files = collectSourceFiles(SRC_DIR);
      const violations: { file: string; line: number; content: string }[] = [];

      // Match eval( but not .eval( from other objects in comments, and not evalua* words
      const evalPattern = /\beval\s*\(/;

      for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();
          // Skip comments
          if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
            continue;
          }
          if (evalPattern.test(line)) {
            violations.push({
              file: path.relative(ROOT_DIR, filePath),
              line: i + 1,
              content: trimmed,
            });
          }
        }
      }

      if (violations.length > 0) {
        const details = violations
          .map((v) => `  ${v.file}:${v.line} → ${v.content}`)
          .join('\n');
        expect.fail(
          `Found eval() usage in source code:\n${details}`
        );
      }
    });

    it('should not use new Function() anywhere in src/', () => {
      const files = collectSourceFiles(SRC_DIR);
      const violations: { file: string; line: number; content: string }[] = [];

      const newFunctionPattern = /new\s+Function\s*\(/;

      for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();
          // Skip comments
          if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
            continue;
          }
          if (newFunctionPattern.test(line)) {
            violations.push({
              file: path.relative(ROOT_DIR, filePath),
              line: i + 1,
              content: trimmed,
            });
          }
        }
      }

      if (violations.length > 0) {
        const details = violations
          .map((v) => `  ${v.file}:${v.line} → ${v.content}`)
          .join('\n');
        expect.fail(
          `Found new Function() usage in source code:\n${details}`
        );
      }
    });
  });
});
