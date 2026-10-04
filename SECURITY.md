# Security policy

Vaultsort processes **highly sensitive, plaintext vault data** from unencrypted Bitwarden / Vaultwarden JSON exports. Privacy defects, accidental persistence, secret exposure, unsafe rendering, and destructive/data-loss behavior are security-relevant.

## Supported versions

Only language/theme preferences may use localStorage through the existing preference modules.
The sole additional approved exception is hosted-only tab-session acknowledgment: only
`src/hostedDemo.ts` may access `vaultsort.hostedDemoAcknowledged:<BASE_URL>` in sessionStorage,
with exact value `'1'`. Ordinary local builds must not access it. No vault-derived values or
other application state may be stored.

| Version | Security fixes |
| --- | --- |
| Current development code on `main` | Best-effort fixes during pre-release development |
| Published/older releases | No release support policy established yet |

`0.1.0` is currently package metadata, not an assertion of a published release. No response-time guarantee or independent security audit is claimed.

## Report a vulnerability

**Do not open a public issue or PR with vulnerability details. Never send real vault exports, passwords, TOTP secrets, API keys, access tokens, or sensitive personal data—even in a private report.** Reproduce with minimal synthetic data and sanitize screenshots, JSON examples, URLs, filenames, and browser output.

Use GitHub's [private vulnerability report form](https://github.com/Mahmoud217TR/Vaultsort/security/advisories/new), also available through **Security → Report a vulnerability**, when enabled. Include:

- Affected commit/build, browser/OS, and whether the app was served locally or hosted.
- Expected security boundary, observed impact, and reproducible steps with synthetic data.
- A proposed fix or workaround if you have one.

Repository setting status is not established by these files. **Before public release, the maintainer must verify/enable GitHub private vulnerability reporting.** If the private form is unavailable, do not disclose details publicly. You may open a content-free request to `@Mahmoud217TR` to enable private reporting, then submit the actual report through that private channel. No project security email is currently documented; do not guess an address.

The maintainer reviews reports on a best-effort basis, coordinates fixes privately, and can publish a sanitized advisory after mitigation. Never include usable credentials or a real export in a patch, advisory, or test fixture. If credentials were exposed, revoke/rotate them with the relevant provider; removing a file or issue is not enough.

## Security boundaries

- **In scope:** vault/session data stays in memory; localStorage contains only `vaultsort.language` and `vaultsort.theme`. The only sessionStorage exception is the fixed hosted acknowledgment described above. No backend, telemetry, runtime external requests, imported HTML, or vault-provided image loading. CSP `connect-src 'none'` remains enforced in the intended build.
- **In scope:** Privacy Mode masks sensitive DOM values, prevents secret editing/reveal/copy while on, and never writes masks back into vault data. Original backups are byte-for-byte; validation, atomic edits, undo, and close/reset paths should prevent unintended data loss/exposure.
- **Trust required:** source, dependencies, built JavaScript, host/repository account, browser, device, and extensions. A compromised hosted build—including a GitHub Pages copy—can remove security controls and read selected files. Loading hosted app assets may expose normal request/IP metadata to the host.
- **Outside app control:** OS/browser-managed memory, extensions, forensic recovery, autocomplete behavior, downloaded plaintext files, clipboard/history, and password-manager import behavior. Closing a vault drops references, not a guaranteed secure erase. Download initiation does not prove that the browser saved the file.

Keep real exports outside the repository and never serve them from `public/` or `dist/`. Privacy Mode is not encryption; Vaultsort is not a password manager and does not support encrypted exports. Validate changes before re-importing and keep an original backup.

Marked demo builds require voluntary acknowledgment before file choice/read; sensitive real
vaults are better handled in reviewed local builds. Acknowledgment is not unsaved-work consent
and cannot protect against malicious remotely delivered code. Tab reloads retain it; independent
sessions warn, while browser duplication/restoration may inherit the flag. Storage failure grants
only the immediate explicit picker attempt, not permanent consent.

Optional Pages publication is disabled by default and separates read-only PR verification,
same-SHA demo build, and protected publication credentials. Only static dist output is packaged;
no checkout/npm/artifact code executes in the deploy job. A serialized current-main check blocks
stale attempts under forward-only history; rollback requires a new verified revert. Opting out
does not remove an existing site or necessarily cancel in-flight work. See [setup and limits](README.md#publish-the-optional-demo-maintainers).
Configured controls and mocked tests are not a security audit or evidence of a live deployment.
