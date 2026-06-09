# Qufly Release Plan

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

### v1-utility-pages-complete

- [ ] Settings page functional
- [ ] Import/export page functional
- [ ] Health check page functional
- [ ] Generator standalone page
- [ ] Security documentation page
- [ ] Privacy policy page
- [ ] Security limitations page
- [ ] All pages accessible offline

### v1-pwa-complete

- [ ] Manifest passes installability check
- [ ] Service worker caches all assets
- [ ] App works fully offline after first load
- [ ] Update notification displays correctly

### v1-beta

- [ ] CSP meta tag with correct SHA-256 hashes
- [ ] No `unsafe-inline` or `unsafe-eval` (only `wasm-unsafe-eval`)
- [ ] Security headers configured
- [ ] Backup reminder system functional
- [ ] Accessibility: keyboard navigation, screen reader, focus management
- [ ] Integration tests pass
- [ ] Compliance tests pass

### v1.0.0

- [ ] All 25 requirement groups verified
- [ ] Performance: <100ms search on 10K entries
- [ ] Public repository published
- [ ] README complete with build instructions
