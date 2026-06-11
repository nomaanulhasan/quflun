# Security Policy

Quflun is a privacy-first, offline-first password manager. We take security reports seriously and prioritize them above feature work.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅ Active development |
| < 1.0   | ❌ Not supported |

## Reporting a Vulnerability

**Do not disclose vulnerabilities publicly.** Please report them privately.

### How to Report

1. Email the maintainers at the address listed in the repository settings, or
2. Use GitHub's private security advisory feature (if available), or
3. Open a private issue if the repository supports it.

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment:** within 48 hours
- **Initial assessment:** within 7 days
- **Fix or mitigation:** prioritized based on severity

### Scope

The following are in scope:

- Cryptographic implementation issues
- Key derivation weaknesses
- Memory exposure of decrypted secrets
- IndexedDB data handling
- Clipboard protection bypass
- Content Security Policy bypass
- Supply chain vulnerabilities in dependencies

### Out of Scope

- Browser extension interference (documented limitation)
- Physical device access
- JavaScript memory inspection via DevTools (documented limitation)
- Social engineering

## Security Architecture

Quflun uses:

- KDBX 4.x format via kdbxweb (MIT, audited in KeeWeb)
- Argon2id via argon2-browser WASM
- AES-256 or ChaCha20 for vault encryption
- No custom cryptographic implementations
- IndexedDB as the only persistent storage mechanism
- No network requests beyond asset caching

For details, see the in-app security documentation page.
