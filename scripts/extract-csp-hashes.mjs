/**
 * Post-build script: extract-csp-hashes.mjs
 *
 * Scans all HTML files in the `out/` directory, extracts inline <script>
 * content and inline style="..." attributes, computes SHA-256 hashes,
 * and updates the CSP meta tag with the computed hashes.
 *
 * Run automatically via the `postbuild` npm script after `next build`.
 */

import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const OUT_DIR = resolve(process.cwd(), "out");

/**
 * Recursively find all .html files in a directory.
 */
async function findHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findHtmlFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Compute a SHA-256 hash of content, returned as base64.
 */
function computeSha256(content) {
  return createHash("sha256").update(content, "utf8").digest("base64");
}

/**
 * Extract all inline <script>...</script> content from HTML.
 * Matches script tags that have content (not src-based).
 */
function extractInlineScripts(html) {
  const scriptRegex = /<script(?:\s[^>]*)?>([^]*?)<\/script>/gi;
  const scripts = [];
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    const tag = match[0];
    const content = match[1];

    // Skip external scripts (those with src attribute)
    if (/\ssrc\s*=/i.test(tag)) continue;

    // Only include scripts with actual content
    if (content.trim().length > 0) {
      scripts.push(content);
    }
  }

  return scripts;
}

/**
 * Extract inline style="..." attribute values from HTML.
 * These come from Shadcn/Radix components that apply inline styles.
 */
function extractInlineStyles(html) {
  const styleAttrRegex = /\sstyle="([^"]+)"/gi;
  const styles = new Set();
  let match;

  while ((match = styleAttrRegex.exec(html)) !== null) {
    const styleContent = match[1];
    if (styleContent.trim().length > 0) {
      styles.add(styleContent);
    }
  }

  return [...styles];
}

/**
 * Update the CSP meta tag in HTML with computed hashes.
 */
function updateCspMetaTag(html, scriptHashes, styleHashes) {
  // Build hash strings
  const scriptHashStr = scriptHashes
    .map((h) => `'sha256-${h}'`)
    .join(" ");
  const styleHashStr = styleHashes
    .map((h) => `'sha256-${h}'`)
    .join(" ");

  // Build the updated CSP directives
  const scriptSrc = ["'self'", "'wasm-unsafe-eval'", scriptHashStr]
    .filter(Boolean)
    .join(" ");
  const styleSrc = ["'self'", "'unsafe-hashes'", styleHashStr]
    .filter(Boolean)
    .join(" ");

  const cspValue = [
    `default-src 'none'`,
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    `img-src 'self'`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `worker-src 'self'`,
    `manifest-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join("; ") + ";";

  // Replace the existing CSP meta tag content
  const cspMetaRegex =
    /(<meta\s+http-equiv="Content-Security-Policy"\s+content=")([^"]*?)("\s*\/?>)/i;

  // Also handle the case where http-equiv and content are in different order
  const cspMetaRegexAlt =
    /(<meta\s+content=")([^"]*?)("\s+http-equiv="Content-Security-Policy"\s*\/?>)/i;

  if (cspMetaRegex.test(html)) {
    return html.replace(cspMetaRegex, `$1${cspValue}$3`);
  } else if (cspMetaRegexAlt.test(html)) {
    return html.replace(cspMetaRegexAlt, `$1${cspValue}$3`);
  }

  // If no CSP meta tag found, log a warning
  console.warn("  ⚠ No CSP meta tag found in file — skipping.");
  return html;
}

/**
 * Process a single HTML file.
 */
async function processHtmlFile(filePath) {
  const html = await readFile(filePath, "utf8");

  // Extract inline scripts and styles
  const inlineScripts = extractInlineScripts(html);
  const inlineStyles = extractInlineStyles(html);

  // Compute hashes
  const scriptHashes = inlineScripts.map(computeSha256);
  const styleHashes = inlineStyles.map(computeSha256);

  // Update CSP meta tag
  const updatedHtml = updateCspMetaTag(html, scriptHashes, styleHashes);

  // Write back only if changed
  if (updatedHtml !== html) {
    await writeFile(filePath, updatedHtml, "utf8");
  }

  return { scriptHashes, styleHashes };
}

/**
 * Main entry point.
 */
async function main() {
  console.log("🔒 Extracting CSP hashes from build output...\n");

  let htmlFiles;
  try {
    htmlFiles = await findHtmlFiles(OUT_DIR);
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(`❌ Output directory not found: ${OUT_DIR}`);
      console.error("   Run 'next build' first to generate the static export.");
      process.exit(1);
    }
    throw err;
  }

  if (htmlFiles.length === 0) {
    console.warn("⚠ No HTML files found in output directory.");
    return;
  }

  console.log(`📂 Found ${htmlFiles.length} HTML file(s) in ${OUT_DIR}\n`);

  let totalScriptHashes = 0;
  let totalStyleHashes = 0;

  for (const file of htmlFiles) {
    const relativePath = file.replace(OUT_DIR, "").replace(/^[/\\]/, "");
    const { scriptHashes, styleHashes } = await processHtmlFile(file);

    totalScriptHashes += scriptHashes.length;
    totalStyleHashes += styleHashes.length;

    if (scriptHashes.length > 0 || styleHashes.length > 0) {
      console.log(`  ✓ ${relativePath}`);
      if (scriptHashes.length > 0) {
        console.log(`    Scripts: ${scriptHashes.length} hash(es)`);
      }
      if (styleHashes.length > 0) {
        console.log(`    Styles:  ${styleHashes.length} hash(es)`);
      }
    } else {
      console.log(`  · ${relativePath} (no inline content)`);
    }
  }

  console.log(
    `\n✅ Done! Injected ${totalScriptHashes} script hash(es) and ${totalStyleHashes} style hash(es) across ${htmlFiles.length} file(s).`
  );
}

main().catch((err) => {
  console.error("❌ CSP hash extraction failed:", err);
  process.exit(1);
});
