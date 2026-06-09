# Lessons Learned

Decisions and discoveries made during development that aren't obvious from the code alone.

## Why Turbopack was abandoned for production builds

Turbopack statically traces all `import()` calls — even dynamic ones inside `useEffect`. argon2-browser's Emscripten code references Node.js modules (`fs`, `path`) and uses a custom WASM loading mechanism incompatible with Turbopack's module resolution. No amount of configuration (`resolve.fallback`, `externals`, `serverExternalPackages`) prevented Turbopack from failing on the WASM file's internal imports.

Webpack handles this correctly with `resolve.fallback: { fs: false, path: false }` and `asset/resource` for the WASM file. The `globalThis.loadArgon2WasmBinary` function provides the WASM via `fetch()` at runtime, bypassing argon2-browser's broken `require()` → `atob()` path.

## Why memory-only vaults were chosen

JavaScript cannot guarantee secure memory erasure (no `memset` equivalent). The best we can do is null all references and allow GC to collect. This is the same approach used by 1Password, Bitwarden, and KeePassXC browser extensions. Persisting decrypted data would require trusting the browser's storage layer, which is accessible to XSS and browser extensions.

## Why KDBX groups represent categories

KDBX groups are literally designed for hierarchical organization. Using metadata strings (`category: "Work"` in customData) would duplicate what the format already provides, break interoperability with KeePass/KeePassXC, and require custom serialization logic.

## Why dynamic routes were avoided

Next.js static export (`output: 'export'`) requires `generateStaticParams()` for dynamic `[id]` routes. Vault entry IDs are runtime-determined (UUIDs generated after vault creation). Returning an empty array from `generateStaticParams()` still fails the build. The workaround (internal state-based view switching) is simpler and works reliably.

## Why component extraction follows the Rule of Three

Extracting a shared component on first occurrence creates speculative abstractions. On second occurrence, you note the opportunity. On third occurrence, you have enough examples to design the right interface. This prevented premature extraction of FavoriteToggle (extracted at 4 usages), TagsInput (4 usages), and PasswordField (5+ planned usages).

## Why `globalThis.loadArgon2WasmBinary` was necessary

argon2-browser's WASM loader checks three paths in order:
1. `global.loadArgon2WasmBinary()` — custom function
2. `require('../dist/argon2.wasm')` → `decodeWasmBinary()` → `atob()` — broken in webpack
3. `fetch(global.argon2WasmPath)` — never reached because webpack provides `require`

Setting `argon2WasmPath` doesn't work because webpack's `require` exists in the bundle, so path 2 runs before path 3. Setting `loadArgon2WasmBinary` (path 1) is the only way to bypass the broken path entirely.

## Why stores use module-level singletons

Zustand stores were initially created inside React refs (`useRef`). If the Providers component remounted (navigation, React strict mode), refs reset to null, stores were recreated with initial `locked` state, and the UI appeared to lose the vault. Module-level variables (`let vaultStore`) survive component lifecycle and prevent this.

## Why vault metadata is hydrated from IndexedDB on app start

After page reload, the decrypted vault is gone (by design). But the user expects to see a lock screen — not the "Create New Vault" page. Reading vault metadata (id, name) from IndexedDB's vault records and setting `engine.setVaultContext(id, name)` allows the lock screen to render with the vault name, and `unlock()` to know which encrypted blob to load.
