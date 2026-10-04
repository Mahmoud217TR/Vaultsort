# Contributing to Vaultsort

Small, focused improvements, bug reports, and reviewed translations are welcome. Follow the [Code of Conduct](CODE_OF_CONDUCT.md). For vulnerabilities, use [private reporting](SECURITY.md#report-a-vulnerability), not a public issue or PR.

**Never attach real vault exports or paste passwords, TOTP secrets, API keys, or access tokens.** Use minimal synthetic examples. Sanitize screenshots, JSON, browser output, filenames, URLs, and personal data before sharing.

## Setup

Fork the repository, clone your fork, and use Node.js 22.13+ (22.x), 24.x, or 26+.

```bash
npm ci
npm run dev
```

The dev server binds to localhost. HMR is intentionally disabled to avoid its network connection; refresh after edits. Real exports should stay outside the checkout, never in `public/`, fixtures, or committed files.

## Branches, commits, and pull requests

- Branch from `main`. Use short descriptive names such as `fix/folder-collision`, `feat/search-filter`, `docs/security-note`, or `i18n/ar-wording`.
- Use focused, imperative commit messages, for example `fix: preserve folder metadata` or `i18n: improve Arabic validation messages`. Keep unrelated cleanup out of the change.
- Discuss substantial changes in an issue first. Link the issue in your PR, describe behavior and tradeoffs, and include reproduction steps/test results. There is no required issue for a small fix or translation correction.
- Add regression tests for non-trivial logic and security-sensitive changes. Update English strings, affected translations, and documentation together; record user-visible changes under `[Unreleased]` in `CHANGELOG.md`.
- For UI work, include sanitized screenshots using synthetic data. Check English/LTR and Arabic/RTL in both light and dark themes, including narrow layouts and keyboard focus.
- Complete applicable PR checklist items. Maintainer review is required; address feedback before merging. CI verifies pushes to main and pull requests targeting main; also run the checks yourself. Optional Pages demo publication is disabled by default; see [maintainer setup](README.md#publish-the-optional-demo-maintainers). No automatic merge or package release is configured.

## Testing, linting, and formatting

```bash
npm ci
npm run lint
npm test
npm run build
git diff --check
```

ESLint covers Vue, TypeScript, and JavaScript. The build also runs strict TypeScript checking. There is no separate formatter or formatting script: follow surrounding style, use valid UTF-8/JSON/YAML, and avoid whitespace-only rewrites.

Vitest tests use jsdom, not a real browser. Manually check affected screens in a browser and record which language/theme/layout combinations you tested. Prefer existing dependencies and simple native browser features; do not add a library where a small existing helper is enough.

Workflow/guard tests are static and mocked checks, not proof of GitHub permissions or a live
deployment. Record skipped browser/live checks explicitly. Demo build and deployment require
successful verification of the same main SHA and exact `VAULTSORT_PAGES_ENABLED=true`; fork
PRs cannot publish. Maintain forward-only main history; recover with a new verified revert.

## Design and architecture

- Read [AGENTS.md](AGENTS.md) and the canonical supplied guide, [docs/design-system.md](docs/design-system.md), before UI work. The original `design.md` was migrated there; do not add a competing copy.
- Reuse `src/style.css` semantic Azure/Slate tokens, bundled Inter, visible focus, accessible contrast, and reduced-motion behavior. Use logical CSS for first-class RTL; keep JSON, URIs, and shortcuts LTR and isolate imported names.
- Preserve the provided logo at `src/branding/vaultsort-logo.svg`. See [docs/favicon.md](docs/favicon.md) before changing favicon integration. Retain `public/fonts/OFL.txt` in builds.
- Keep document operations in `src/domain/vault.ts` and session/history state in `src/composables/useVault.ts`. Preserve unknown JSON properties, IDs, ownership, and source structure; do not silently normalize imported values.

## Security and privacy requirements

- Vault data, filenames, search, drafts, privacy state, and history stay in memory. No server upload, backend, telemetry, browser vault storage, or runtime external requests.
- Only the validated language/theme preferences may be persisted: `public/preferences.js` reads them and `src/preferences.ts` writes them. Keep the blocking head bootstrap and CSP `connect-src 'none'` intact.
- The sole additional approved exception is hosted-only tab-session acknowledgment: `src/hostedDemo.ts` alone may access `vaultsort.hostedDemoAcknowledged:<BASE_URL>` in sessionStorage, with exact value `'1'`. Local builds must not access it; no vault-derived values or other application state may be stored.
- Never log vault contents or include them in errors, audit messages, tests, or screenshots. Use message keys for notices/history so locale changes translate existing messages without modifying data.
- Never render imported HTML, load vault-provided images, or place secrets in the DOM in Privacy Mode. UI masks must never be saved into the document.
- Protect original bytes and undo history. Fail invalid edits without data loss; close/reset paths must clear session references and revoke download URLs.
- Review staged files before submitting. `.gitignore` is only a guardrail: it cannot recognize every export filename or remove already tracked secrets. If a secret was exposed, stop sharing it, revoke/rotate it, and use private reporting.

## Translations

**English is the canonical/default locale** at `src/i18n/locales/en.json`. Arabic is supported at `src/i18n/locales/ar.json`; RTL is a first-class requirement. Additional languages are community-contributable.

To add a language:

1. Copy `src/i18n/locales/en.json` to `src/i18n/locales/<language-code>.json` (for example, `fr.json`). Use an appropriate BCP 47 language tag, including a region only when needed.
2. Translate **values**, not keys. Keep the same nested structure. Do not translate technical identifiers/JSON field names in code or examples, URLs, keyboard shortcut symbols, or interpolation variables such as `{count}`, `{index}`, and `{name}`. Natural-language UI labels may be translated. Keep every interpolation variable exactly as written; sentences may reorder variables naturally. Preserve any plural-message `|` syntax and use grammatically appropriate forms; count-labelled wording is also acceptable.
3. Register the imported messages in `src/i18n/index.ts` and add an entry to its `languages` list with `direction: 'ltr'` or `'rtl'`. The header selector in `src/App.vue` is generated from this list. Add the language's native display name under `app.<language-code>` in all locale files. Keep English as the fallback/default.
4. Extend startup validation and direction handling in `public/preferences.js`, plus initial locale selection in `src/i18n/index.ts` and the locale type in `src/preferences.ts`. The current bootstrap explicitly recognizes `en`/`ar`; registering a dropdown option alone does not make a new language survive refreshes correctly.
5. Extend `src/i18n/i18n.test.ts` for key/placeholder parity, startup restoration, and the new language in both themes. Update `src/test.setup.ts` only if needed; tests must still start with English. Update the supported-language list in `README.md`.
6. Test the **full interface**, not just the import screen: navigation, forms, dialogs, tables, item/raw editors, validation/error messages, confirmations, audit history, empty states, and folder workflows. Verify switching languages with a vault open, reload persistence, light/dark mode, narrow layouts, and keyboard access.
7. For RTL languages, check panel/order flow, indentation, logical borders/spacing, directional icons, pagination, mixed-script imported names, and LTR technical fields. Do not mirror the logo or non-directional icons.

Use natural, consistent wording. Translation tools can assist, but do not submit unreviewed machine output. A PR adding a language should ideally be reviewed by a native/fluent speaker; say who reviewed it or request that review. Keep locale values plain text—no HTML—and never translate or alter imported vault data.

Use the [translation issue form](https://github.com/Mahmoud217TR/Vaultsort/issues/new?template=translation.yml) for incorrect/missing translations, RTL defects, or language proposals. For small new UI messages, add English and update Arabic/other affected locales in the same PR where possible.
