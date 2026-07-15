# Quflun Release Plan

## Tags

| Tag | Criteria |
|-----|----------|
| `v1-foundation-complete` | Core engine, services, stores, hooks, and UI pages implemented. 295+ tests. Static export working. |
| `v1-utility-pages-complete` | All utility pages (settings, generator, import/export, health check, info pages) implemented and tested. |
| `v1-pwa-complete` | Service worker registered, manifest valid, offline caching functional, installable on desktop and mobile. |
| `v1-beta` | CSP enforced, security headers configured, accessibility reviewed, integration tests passing, documentation complete. |
| `v1.0.0` | All requirements verified, public repository, open source release. |

## Release Criteria

### v1-foundation-complete ✅

- [x] Vault engine: create, open, lock, unlock, save
- [x] Entry CRUD with validation
- [x] Secure notes
- [x] Categories (KDBX groups), tags, favorites
- [x] Search engine
- [x] Password generator
- [x] Clipboard manager
- [x] Idle monitor
- [x] KDBX import/export
- [x] CSV import/export
- [x] Health check
- [x] Zustand stores (no persist middleware)
- [x] React hooks
- [x] Lock screen + vault selection
- [x] Entry list with search and filters
- [x] New entry / new note forms
- [x] Edit entry / edit note forms
- [x] Delete confirmation dialog
- [x] 295 tests passing
- [x] Build succeeds

### v1-utility-pages-complete ✅

- [x] Settings page functional
- [x] Import/export page functional
- [x] Health check page functional
- [x] Generator integrated as inline dialog in entry forms
- [x] Security documentation page
- [x] Privacy policy page
- [x] Security limitations page
- [x] All pages accessible offline

### v1-pwa-complete ✅

- [x] Manifest passes installability check
- [x] Service worker caches all assets
- [x] App works fully offline after first load
- [x] Update notification displays correctly
- [x] SW registration skipped in dev mode (prevents stale precache errors)

### v1-beta ✅

- [x] CSP meta tag with correct SHA-256 hashes (via post-build extraction)
- [x] No `unsafe-eval` (only `wasm-unsafe-eval` for Argon2 WASM)
- [x] `style-src 'unsafe-inline'` required for Shadcn/Radix runtime styles
- [x] Security headers configured (`_headers` file)
- [x] Backup reminder system functional
- [x] Integration tests pass
- [x] Compliance tests pass
- [x] 388 tests passing across 27 test files

### v1.0.0 ✅

- [x] All 25 requirement groups verified
- [x] Public repository published
- [x] README complete with build instructions
- [x] Deployed on Vercel
