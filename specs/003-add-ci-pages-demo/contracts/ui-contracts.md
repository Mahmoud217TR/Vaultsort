# Hosted Demo UI Contracts

**Spec**: [spec.md](../spec.md) | **Model**: [data-model.md](../data-model.md)

## HD-01 — Build identity and fixed session decision

- `VITE_HOSTED_DEMO=true` marks demo output; comparison is exact, other/unset values mean local.
- `src/hostedDemo.ts` is the sole owner of hosted-state sessionStorage access. It exports the
  build distinction and minimal acknowledgment operations, never accepts a vault/File/name payload.
- Key: `vaultsort.hostedDemoAcknowledged:${import.meta.env.BASE_URL}`; exact value `'1'`
  acknowledges. The deployment prefix is public build configuration, not vault-derived data.
- Demo base URLs must be explicit root or repository prefixes; ordinary local builds retain
  existing relative assets and never read/write the acknowledgment key.
- Storage exceptions are caught without logging their contents or relaxing the gate. Continue
  permits only an immediate picker attempt if retention fails; later attempts warn again.
- App does not clear the retained flag on import, close, language/theme/privacy changes or
  chooser cancellation. No third session preference, ID, timestamp or acknowledgment analytics.
- A shared-header localized label remains visible before/after import, without implying a
  trust equivalence to local reviewed builds. Local preview of demo output stays demo-marked.

**Checks**: exact/missing/invalid flag, explicit/unset/other build values, storage throws,
local zero-storage-access, reload/remount, independent sessions and deployment-prefix isolation.

## HD-02 — Every picker and read is gated

1. Landing Select JSON and workspace Open vault remain routed through `chooseFile()`.
2. For an unacknowledged hosted attempt, open the warning without opening file selection.
3. The hidden input's native click must also prevent default and show the warning if
   unacknowledged. `importFile()` independently checks before creating/starting FileReader.
4. An unsolicited input change is refused, input cleared and the warning shown. Do not save
   its File or replay the change automatically on Continue: require a fresh allowed selection.
5. Continue records only the session choice, closes the warning and resumes the existing
   guarded picker path from that user gesture. Recheck current unsaved/draft state instead of
   executing a captured mutation/discard callback. Cancelled unsaved confirmation leaves all
   existing drafts, originals, working state and dialogs unchanged.
6. Continue is not consent to discard edits, upload anything or change Privacy Mode. If the
   browser blocks picker activation after dialog teardown, present a fresh allowed file-choice
   action rather than bypassing controls or reading a previously blocked file.
7. Normal imports retain extension/parse/read-version/abort checks and atomic replacement.
   No new drag/drop import is added; future alternate import entry points must obey this contract.

The read boundary must also reject replacement of dirty current state without a valid current
unsaved decision for that attempt. A direct change event cannot inherit a stale prior guard
acceptance. A normal picker path need not prompt twice for the same unchanged accepted state;
test direct changes and state changes between selection request and read independently.

No call to `run()`, `discardDraft()` or vault domain mutation is part of warning preparation.
If a read is refused or fails, the current vault survives under existing import semantics.

**Checks**: both callers, input native click/change, keyboard activation, no reader before
Continue, retry after cancellation, repeated import/close/reopen and all four draft kinds.

## HD-03 — Warning content, dismissal and accessibility

Reuse `Modal.vue` rather than introducing a UI library. A separate hosted-warning state must
not overwrite `modal = 'folder'` or discard a comparison/editor draft. If two native dialogs
can coexist, their titles require distinct IDs; replace shared fixed `modal-title` with a
per-instance ID and keep `aria-labelledby` aligned. Preserve the underlying dialog/form.

Every warning includes the following localized statements:

- Processing occurs locally in the browser.
- Vaultsort does not intentionally upload the vault.
- Remotely delivered JavaScript has a different trust model from a reviewed local build;
  a changed or compromised host/build can change protections.
- Running locally is recommended for sensitive real vaults.
- Continuing with the hosted demo is the user's choice.

Actions: explicit Continue, Cancel, and local-use guidance. Guidance is fixed application
content/README link, never a dynamically fetched resource. Following an external documentation
link is explicit user navigation; it cannot acknowledge, choose a file or transmit vault data.

Escape, header close, backdrop dismissal and Cancel all cancel without storing acknowledgment.
Focus returns to the initiating connected control or a safe file-choice fallback. Warning
input takes priority over global keyboard shortcuts and cannot accidentally trigger import,
delete, export, undo, close-vault or draft-discard behind it. Native picker activation and
dialog focus restoration must be executed in a real browser, not asserted from jsdom alone.

Keep new text/accessible labels in both locales with matching interpolation keys and English
fallback. Use semantic tokens, AA text contrast, logical RTL styles, local fonts/unchanged logo,
bounded dialog-body scrolling and no extra animation. Demo identity must remain readable at
320/768/1280/1440 CSS widths and native 200% browser zoom in both languages/themes.

**Checks**: all five statements, default-safe focus, modal coexistence/dismissal, translated
labels, no raw file/draft interpolation, keyboard-only Continue/Cancel/local guidance, focus
fallback and both theme/locale combinations.

## HD-04 — Privacy, assets and policy boundaries

- Preserve CSP `connect-src 'none'`, `form-action 'none'` and existing image/script/font limits.
- Preserve `public/preferences.js` as the blocking head script preceding stylesheet paint,
  and preserve its validated language/theme localStorage-only behavior. Hosted acknowledgment
  must not enter it or the language/theme writer.
- Vite emits all assets under the configured build base; favicon integration remains exactly
  once in `index.html`, manifest resources remain relative, and bundled Inter plus OFL ship.
- No backend/API, telemetry, analytics, third-party runtime script, CDN, remote font/translation,
  service worker or vault-derived DOM links/images are introduced.
- Existing security scans continue to forbid sessionStorage everywhere except the one hosted
  helper, which has its own exact-key/value/storage/network/log assertions. Do not globally
  remove the ban or weaken preference checks.
- Before implementation, reconcile AGENTS.md, CONTRIBUTING.md, SECURITY.md and README storage
  wording narrowly with HD-01. Constitution permits this non-sensitive session flag; no broad
  preference or vault-persistence exception is approved.

**Checks**: source security/branding/i18n regressions; built HTML/manifest/CSS resources at root
and a non-root prefix; offline synthetic original/export/undo equality; request/log/storage audit.
