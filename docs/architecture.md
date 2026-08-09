# Quflun Architecture

## Fundamental Rule

```
VaultEngine
    ↓
Services
    ↓
Stores
    ↓
Hooks
    ↓
UI
```

**VaultEngine is the source of truth.** It holds the decrypted KDBX database, performs all CRUD operations, manages brute-force state, and serializes to IndexedDB.

**Stores are projections.** Zustand stores reflect VaultEngine state reactively for the UI. They do not contain business logic, validation, or persistence logic. They delegate every operation to the engine and refresh their state from it.

**Hooks are wrappers.** React hooks provide ergonomic access to stores and services. They add loading/error state, debouncing, and lifecycle management. They do not duplicate logic from services or stores.

**UI components contain no business logic.** Components render state, call store actions, and handle user input. Validation, encryption, persistence, and format handling happen in the layers below.

## Layer Responsibilities

### Adapter Layer (`src/lib/crypto/`, `src/lib/storage/`)

- CryptoAdapter: wraps kdbxweb + argon2-browser WASM
- StorageAdapter: wraps IndexedDB via `idb`
- These are the only modules that interact with browser APIs for data persistence

### Service Layer (`src/lib/vault-engine/`, `src/lib/search/`, etc.)

- VaultEngine: vault lifecycle, entry CRUD, categories, tags, favorites, brute-force protection, password change, vault health report
- SearchEngine: in-memory substring search
- FuzzySearch: lightweight fuzzy matching for command palette
- PasswordGenerator: CSPRNG-based generation with rejection sampling
- ClipboardManager: timed clipboard clearing with ownership detection
- IdleMonitor: activity event listeners with configurable timeout
- Import/Export: KDBX import with UUID dedup, CSV via PapaParse
- HealthCheck: structural integrity validation

### State Layer (`src/stores/`)

- VaultStore: projects VaultEngine state, provides reactive signals
- UIStore: non-sensitive settings (theme, timeouts), manual IndexedDB persistence

### Hook Layer (`src/hooks/`)

- useVault: loading/error state around vault operations
- useSearch: debounced query input
- useIdle: connects IdleMonitor to vault lock
- useClipboard: copy action wrapper
- useCopyAction: clipboard copy with toast feedback and visual state
- useHotkeys: declarative global keyboard shortcut registration

### UI Layer (`src/app/`, `src/components/`)

- Pages: routing and layout composition
- Components: presentational, reusable, accessible

## Key Design Decisions

### No Persist Middleware

Zustand persist middleware is forbidden on the vault store. Decrypted vault data must never reach persistent storage. Settings use manual `storageAdapter.saveSettings()` to IndexedDB.

### Categories = KDBX Groups

Categories are native KDBX groups under the root group. `setCategory()` calls `db.move(entry, targetGroup)`. No metadata-based category strings.

### Tags = entry.tags + Registry

Entry-level tags use kdbxweb's native `entry.tags` array. The tag registry (available tags for selection) is stored as JSON in the root group's customData.

### Favorites = customData

The `_quflun_favorite` key in entry customData marks favorites. Invisible to other KeePass clients.

### Notes = KDBX Entries

Secure notes are standard KDBX entries with `_quflun_type: "note"` in customData, body in the Notes field, and empty Password.

### Static Export

`output: 'export'` produces fully static HTML/CSS/JS. No server runtime. argon2-browser WASM is served as a static asset (`/_next/static/wasm/argon2.wasm`). Dynamic routes are not used — the vault page handles list/edit views via internal state.

### Module-Level Singletons

Runtime services (engine, storage) and Zustand stores are module-level singletons that survive React component remounts. This prevents vault state loss on navigation.

## Security Boundaries

| Persisted (IndexedDB) | In-Memory Only |
|----------------------|----------------|
| Encrypted KDBX blob | Decrypted Kdbx object |
| Vault metadata (id, name) | Master password |
| UI settings (theme, timeouts) | Derived keys |
| Tag registry | Entry list |
|  | Brute-force counters |

Lock clears all in-memory state. Only the encrypted blob remains.

## Testing Strategy

- **Unit tests**: adapter layer, service layer (vitest)
- **Property tests**: universal correctness properties (fast-check)
- **Integration**: vault lifecycle round-trips (create → add → lock → unlock → verify)
- **Component tests**: health check, import/export, settings pages (React Testing Library + happy-dom)
- **Compliance tests**: no telemetry, no forbidden storage, no external URLs, CSP validation
- **391 tests** across 27 test files

## CSP Strategy

Content-Security-Policy is enforced via HTTP headers, not a `<meta>` tag:

- **Delivery:** `vercel.json` (Vercel) and `public/_headers` (Netlify/Cloudflare Pages) set the CSP header on all responses
- **`script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline'`:** `'unsafe-inline'` is required because Next.js static export generates inline `<script>` tags for hydration data whose content changes every build (hashes can't be pre-computed reliably in CI). `'wasm-unsafe-eval'` allows Argon2 WASM compilation.
- **`style-src 'self' 'unsafe-inline'`:** Required because Shadcn/Radix components apply inline styles dynamically at runtime via JavaScript — these cannot be pre-hashed.
- **`frame-ancestors 'none'`:** Enforced via HTTP headers (ignored in meta tags per CSP spec).
- **Development:** No CSP is applied. Next.js requires inline scripts and dynamic code execution for HMR/React Refresh.
- **Service worker:** Only registered in production to avoid stale precache manifest errors during development.

**Why not a meta tag with hashes?** Next.js static export generates inline scripts for hydration (`self.__next_f.push(...)`) whose content includes chunk filenames that change every build. A post-build hash extraction approach was attempted but proved unreliable in CI (Vercel doesn't guarantee the script runs, and the circular dependency between HTML generation and hash injection makes it fragile). The `'unsafe-inline'` approach is the standard pragmatic solution for static Next.js deployments — same as used by Vercel's own documentation sites.
