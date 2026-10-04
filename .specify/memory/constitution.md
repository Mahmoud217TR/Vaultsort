<!--
Sync Impact Report — temporary review material; remove before committing.
Version change: 1.0.0 → 2.0.0.
Rationale: incompatible governance precedence and storage-policy redefinitions,
including permission for non-sensitive session state; expanded all six principles.
Modified principles:
- I. Privacy First → I. Privacy Is Non-Negotiable
- II. Preserve Data → II. Preserve User Data
- III. Be Honest About Security → III. Security Claims Must Match Reality
- IV. Keep the Interface Familiar → IV. The Interface Must Remain Consistent and Accessible
- V. Choose Simplicity → V. Prefer the Simplest Correct Solution
- VI. Verify Changes → VI. Every Change Must Be Verifiable
Added sections: Product Boundaries (replaces Project Scope).
Removed sections: Project Scope; draft/non-precedence clauses in Governance.
Preserved sections: Development and Review; Governance amendment and versioning rules.
Dependent templates and commands: unchanged; read the constitution at runtime.
Deferred: TODO(RATIFICATION_DATE) — original adoption date remains unknown; confirm ISO date.
Manual follow-up: reconcile AGENTS.md and CONTRIBUTING.md storage guidance with the
new preference-approval/session-state policy through a separate reviewed change.
No storage implementation or preference approval is introduced by this amendment.
-->

# Vaultsort Constitution

Vaultsort is a local-first editor for unencrypted Bitwarden/Vaultwarden JSON exports.
It is not a password manager, encryption tool, cloud service, or vault synchronization client.

## Core Principles

### I. Privacy Is Non-Negotiable

Vault data MUST remain on the user's device.

- Vault contents, original bytes, drafts, edits, search queries, history, and derived sensitive
  data MUST remain in memory.
- Vault data MUST NOT be transmitted to a backend, API, analytics provider, telemetry service,
  or third party.
- Real vault contents and secrets MUST NOT be written to logs, error messages, tests,
  screenshots, fixtures, issues, or documentation.
- Persistent browser storage MUST contain only explicitly approved non-sensitive preferences,
  such as language and theme. The currently approved preferences are `vaultsort.language`
  and `vaultsort.theme`; other preferences require explicit approval before implementation.
- Session storage MAY contain non-sensitive UI state, such as dismissal flags, but MUST NEVER
  contain vault-derived data.
- Production builds MUST NOT require external runtime services, fonts, analytics, or CDN
  resources.
- Network restrictions, including CSP `connect-src 'none'`, MUST NOT be weakened without
  a constitution amendment.

Synthetic data MUST be used for development, tests, documentation, and screenshots.

### II. Preserve User Data

Vaultsort MUST preserve data it does not understand.

- Unknown properties, unsupported item types, IDs, ownership metadata, and source structure
  MUST survive import/edit/export unless explicitly changed by the user.
- Importing and exporting an untouched vault MUST be semantically lossless.
- View-only controls MUST NOT mutate exported data.
- Destructive operations MUST be explicit, confirmed, and reversible where practical.
  Editing workflows MUST retain undo.
- Original imported bytes MUST remain available for backup during the active session,
  including through original-copy downloads.
- Validation MUST detect structural problems and block structurally invalid modified exports.
- Invalid edits MUST fail without corrupting the working document.

Data preservation takes precedence over normalization, cleanup, or convenience.

### III. Security Claims Must Match Reality

Vaultsort MUST describe its security boundaries accurately.

- Privacy Mode MUST mask secrets in the DOM without changing document values; it is visual
  masking, not encryption.
- Exported files remain plaintext.
- Closing a vault releases application references but MUST NOT be described as secure
  memory erasure.
- Hosted builds MUST NOT be presented as equivalent in trust to reviewed local builds.
- Compatibility, security audits, secure deletion, or other guarantees MUST NOT be claimed
  without evidence.

Security documentation MUST distinguish application guarantees from browser, operating-system,
extension, clipboard, hosting, and dependency risks.

### IV. The Interface Must Remain Consistent and Accessible

All UI work MUST follow [docs/design-system.md](../../docs/design-system.md).
Vaultsort MUST preserve:

- The Azure design system, Vaultsort branding, and bundled Inter typography.
- Compact, information-dense editor workflows.
- Light and dark modes.
- English/LTR and Arabic/RTL support.
- Keyboard usability, visible focus states, and accessible contrast.

RTL support is a first-class requirement, not a visual afterthought. Visual refinement
MUST NOT reduce usability, information density, accessibility, or security clarity.

### V. Prefer the Simplest Correct Solution

Implementations SHOULD use the simplest production-ready solution that satisfies these
principles; added complexity is justified only by an actual Vaultsort requirement.

- Prefer existing project patterns, native browser capabilities, semantic design tokens,
  small focused modules, and existing dependencies.
- Avoid speculative features, unnecessary abstractions or dependencies, premature framework
  changes, and architecture introduced without a current requirement.

Complexity MUST be justified by an actual Vaultsort requirement and recorded in the change's
rationale so reviewers can assess the tradeoff.

### VI. Every Change Must Be Verifiable

Non-trivial behavior MUST be tested. Security-sensitive and data-transformation changes
MUST include regression tests. Import/export behavior MUST be tested using synthetic
vault data only.

Before a change is considered complete, all of these checks MUST pass:

```bash
npm run lint
npm test
npm run build
```

UI changes MUST also be checked, where relevant, in English/LTR, Arabic/RTL, light mode,
dark mode, narrow layouts, and keyboard navigation. Applicable checks and any exclusions
MUST be recorded with their rationale.

## Product Boundaries

The following are outside Vaultsort's core responsibility unless explicitly introduced
through an approved specification:

- Password management.
- Encrypted vault storage.
- Cloud synchronization.
- User accounts.
- Backend services.
- Automatic credential modification.
- Remote vault access.

Features crossing these boundaries MUST include explicit justification and be reviewed
against the Privacy and Data Preservation principles. An approved specification alone
MUST NOT override a constitutional prohibition.

## Development and Review

Pull requests MUST describe affected principles and record applicable verification results.
Reviewers MUST check privacy, security boundaries, data preservation, accessibility,
compatibility, and unnecessary complexity before approving a change.

## Governance

This constitution takes precedence over implementation convenience and feature
specifications. Specifications, implementation plans, and tasks MUST comply with it.

If a proposed feature conflicts with the constitution, the conflict MUST be resolved before
implementation by changing the proposal or formally amending the constitution.

Constitution amendments MUST:

- Be proposed through a pull request and receive maintainer review and approval.
- Explain the rationale.
- Describe privacy, security, data-preservation, accessibility, and compatibility impact.
- Update affected documentation and tests.
- Update the version and last-amended date while preserving the original ratification date
  once confirmed.

Versioning uses MAJOR for incompatible principle removals or redefinitions, MINOR for new
principles or materially expanded guidance, and PATCH for non-semantic clarifications.
Compliance MUST be reviewed on each pull request; conflicts MUST be resolved explicitly
rather than silently bypassing a principle.

[AGENTS.md](../../AGENTS.md), [CONTRIBUTING.md](../../CONTRIBUTING.md),
[SECURITY.md](../../SECURITY.md), and [docs/design-system.md](../../docs/design-system.md)
provide implementation guidance but MUST NOT override this constitution.

**Version**: 2.0.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date unknown | **Last Amended**: 2026-10-04
