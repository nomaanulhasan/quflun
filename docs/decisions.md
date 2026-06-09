# Architectural Decision Records

## ADR-001: Static export instead of server backend

**Context:** Qufly is an offline-first password manager. A server would introduce attack surface, require hosting, and contradict the "no network requests" requirement.

**Decision:** Use Next.js `output: 'export'` producing fully static HTML/CSS/JS. No server runtime.

**Consequences:** No SSR, no API routes, no middleware. Dynamic routes not supported — entry editing uses internal state instead of URL params. CSP headers require hosting platform config or meta tags.

## ADR-002: KDBX 4.x format

**Context:** Need an open, audited, interoperable vault format. Custom formats would require independent security auditing.

**Decision:** Use KeePass KDBX 4.x via the kdbxweb library.

**Consequences:** Full compatibility with KeePass, KeePassXC, KeeWeb. Format limitations (full-database decryption, no lazy loading) are inherited. Protected memory via ProtectedValue XOR.

## ADR-003: Argon2id for key derivation

**Context:** KDBX 4.x supports Argon2id natively. It provides resistance to both side-channel and GPU attacks.

**Decision:** Use Argon2id with 64 MB memory, 2 iterations, 1 parallelism via argon2-browser WASM.

**Consequences:** Requires `wasm-unsafe-eval` in CSP. Each key derivation takes 1–3 seconds on modern hardware (intentional — brute-force resistance). WASM binary adds ~300 KB to bundle.

## ADR-004: IndexedDB only

**Context:** Need persistent storage for encrypted vault blobs and settings. localStorage has size limits (5 MB) and is accessible to XSS. sessionStorage doesn't persist.

**Decision:** Use IndexedDB exclusively via the `idb` wrapper. No localStorage or sessionStorage for any application data.

**Consequences:** Larger storage quota. Transactional integrity. Binary blob support for KDBX files. Slightly more complex API than localStorage.

## ADR-005: No cloud sync

**Context:** Cloud sync requires a backend, user accounts, and network trust. This contradicts the privacy-first, no-telemetry requirements.

**Decision:** All data stays on the local device. Import/export provides manual backup and migration.

**Consequences:** Users must manually export backups. No cross-device sync. Simpler threat model.

## ADR-006: Memory-only decrypted vault

**Context:** Decrypted passwords must never reach persistent storage. JavaScript cannot guarantee secure memory erasure, but we can minimize exposure.

**Decision:** Decrypted Kdbx object exists only in memory. Lock nulls all references. No Zustand persist middleware. No serialization of decrypted state.

**Consequences:** Page refresh requires re-authentication. Idle timeout locks the vault. This matches behavior of 1Password, Bitwarden, and KeePassXC browser extensions.

## ADR-007: Webpack instead of Turbopack for production

**Context:** Turbopack traces all dynamic imports statically and cannot handle argon2-browser's Emscripten-style WASM loading (references `fs`, `path`, custom binary format).

**Decision:** Use webpack for production builds (`next build --webpack`). Turbopack still works for development.

**Consequences:** Slightly slower builds (~15s vs ~5s). Full control over `resolve.fallback`, WASM asset handling, and module externals. argon2-browser's WASM served as `asset/resource`.

## ADR-008: No dynamic routes for vault entries

**Context:** `output: 'export'` requires `generateStaticParams()` for dynamic `[id]` routes. Entry IDs are runtime-determined and cannot be pre-rendered.

**Decision:** The vault page manages list/edit views via internal React state (`editingId`). No URL-based routing for individual entries.

**Consequences:** Browser back/forward doesn't navigate between entries. Bookmarking individual entries is not possible. Simpler static export. The page is effectively a single-page application within the `/vault` route.

## ADR-009: Rule of Three for component extraction

**Context:** Premature extraction creates unused abstractions. Late extraction creates duplication.

**Decision:** Extract a shared component when a pattern appears three or more times. Document extraction opportunities for two-occurrence patterns.

**Consequences:** Components like FavoriteToggle, TagsInput, PasswordField were extracted at the right time. Single-use patterns remain inline until reused.
