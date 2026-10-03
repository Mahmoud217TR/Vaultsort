# Vaultsort project instructions

## Visual system (required for all UI work)

Read `docs/design-system.md` before editing Vue templates or styles. It is the single canonical copy of the supplied design principles. Follow the implementation notes where example colors conflict with WCAG AA contrast.

- Keep the app calm, local-first, dense but readable: Slate/white surfaces, navy text, restrained Azure actions, soft Sky selection, crisp borders, minimal shadows.
- Reuse semantic tokens in `src/style.css`; do not add a competing palette, remote font, UI library, or unnecessary animation. Inter is bundled locally; technical values and shortcuts use system monospace.
- Respect native light/dark defaults, explicit theme selection, and reduced-motion preferences. Use logical CSS properties for RTL. Mirror directional icons only; technical JSON, URIs, and shortcuts stay LTR, while imported names use bidi isolation. Provide visible focus, accessible text contrast, labels, and non-color-only selection/status cues. Sensitive values use normal text colors; amber means caution, red means destructive/error, green means success/local state.
- All UI text, accessible labels, confirmations, validation, and audit messages belong in `src/i18n/locales/`. Use `vue-i18n` with English fallback; keep Arabic keys and interpolation placeholders in sync. Retain message keys in history/notices so changing languages translates existing messages, without modifying imported data.
- Use the provided `src/branding/vaultsort-logo.svg` via a Vite import. Preserve its geometry/color. Read `docs/favicon.md` before modifying the one favicon integration in root `index.html`; all favicon files live only in `public/`.

## Privacy and architecture

Vault documents and undo history stay in memory. No backend, vault browser storage, telemetry, runtime external requests, vault logging, external item images, or HTML rendering of imported content. The sole storage exception is the explicitly requested `vaultsort.language` (`en`/`ar`) and `vaultsort.theme` (`light`/`dark`) preferences. Only `public/preferences.js` reads them and `src/preferences.ts` writes them; never persist vault content, filenames, drafts, search, privacy state, or history. Keep the blocking preference script in the head before styles to avoid theme flashes. Keep the CSP's `connect-src 'none'` intact. Mask secrets in the DOM in Privacy Mode without ever applying masks to the document. Preserve unknown JSON properties and source structure.

Keep domain operations in `src/domain/vault.ts`, use the existing in-memory history, and test non-trivial logic. Prefer native browser features and existing dependencies over new abstractions.

## Verification

Run `npm run lint`, `npm test`, and `npm run build`. Localization, preference restoration, and all language/theme combinations are checked in `src/i18n/i18n.test.ts`. Brand migration checks are in `src/components/branding.test.ts`; privacy and editor checks are in `src/components/security.test.ts`. Keep font licensing distributed with production builds (`public/fonts/OFL.txt`).
