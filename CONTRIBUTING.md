# Contributing to Qufly

Thank you for your interest in Qufly.

## Current Status

This repository is **currently private**. Public contributions will be accepted after v1.0 is released.

## Development Requirements

- Node.js 18.18+
- pnpm 10+
- Modern browser (Chrome 92+, Firefox 95+, Safari 15.4+, Edge 92+)

## Setup

```bash
pnpm install
pnpm dev          # Start development server
pnpm build        # Production build (webpack)
pnpm test         # Run all tests
pnpm test:watch   # Watch mode
pnpm lint         # ESLint
```

## Coding Standards

### TypeScript

- Strict mode enabled (`"strict": true`)
- Never use `any` — prefer `unknown` with type guards
- No unused imports, variables, functions, or parameters
- Shared types in separate files under `src/types/`

### React

- Prefer Server Components where possible
- Use Client Components only where state or browser APIs are required
- Target 30–80 lines per component (max 100)
- Extract repeated patterns immediately (Rule of Three)
- All hooks called unconditionally before early returns

### Architecture

- VaultEngine is the source of truth — stores are projections
- No localStorage or sessionStorage for application data
- IndexedDB via `idb` for persistence (encrypted vault + settings only)
- No custom cryptography — use kdbxweb + argon2-browser
- Dependency injection where appropriate

### UI

- Mobile-first responsive design
- Tailwind CSS v4 (no v3 config syntax)
- Shadcn UI components (base-nova style)
- Lucide icons (no emoji)
- Accessibility first (ARIA labels, keyboard navigation, focus management)
- Minimum 44px touch targets

### Testing

- vitest for unit and property-based tests
- fast-check for property-based testing
- fake-indexeddb for storage tests
- Tests must pass before merge
- No mocking of core logic — mock only external APIs (clipboard, DOM, WASM)

## Security

- Never persist master passwords, derived keys, or decrypted vault contents
- Never use `eval()`, `new Function()`, or `'unsafe-eval'` in production code
- Clipboard clearing is best-effort (documented browser limitations)
- Follow CSP restrictions: no inline scripts, no external resources

## Commit Messages

Use conventional commits:

```
feat: add password generator dialog
fix: resolve tags not persisting after edit
refactor: extract FavoriteToggle component
test: add property tests for categories
docs: update CHANGELOG for v0.5.0
```
