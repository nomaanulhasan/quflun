# Quflun Milestones

## v1-foundation-complete

Date: 2026-06-09
Status: Completed
Git tag: v1-foundation-complete

Highlights:
- Project scaffolding completed
- Adapter layer completed (CryptoAdapter, StorageAdapter)
- Vault engine completed (lifecycle, CRUD, notes, categories, tags, favorites)
- Service layer completed (search, password generator, clipboard, idle monitor)
- Import/export completed (KDBX with UUID dedup, CSV via PapaParse)
- Health check completed (group hierarchy, UUID uniqueness, serialization)
- Zustand stores and hooks completed
- Core UI completed (lock screen, vault list, entry editor, new entry/note)
- Search and filters implemented (category, tag, favorites)
- Password generator implemented (inline dialog from password fields)
- Secure notes implemented (KDBX entries with type marker)
- Shared component architecture established (PasswordField, TagsInput, FavoriteToggle, etc.)
- Static export architecture finalized (webpack + argon2 WASM asset)
- Memory-only decrypted vault model
- Navigation and reload trust issues fixed
- 295 tests passing

Next phase: v1-utility-pages

## v1-utility-pages

Status: Planned

## v1-pwa-complete

Status: Planned

## v1-beta

Status: Planned

## v1.0.0

Status: Planned
