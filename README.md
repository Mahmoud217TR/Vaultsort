# Vaultsort

A local-first, browser-only editor for **unencrypted Bitwarden / Vaultwarden JSON exports**. Clean up folders, edit items, and inspect duplicates before re-importing—without sending your vault to a server.

Vault exports can be awkward to reorganize by hand. Vaultsort provides an in-memory workspace while preserving unknown properties and unsupported item types. It is an export editor, **not a password manager or an encryption tool**.

## Status

Pre-release and under development. `package.json` currently identifies the project as `0.1.0`; that is not a claim of a published release. See [CHANGELOG.md](CHANGELOG.md) for unreleased work. No independent security audit is claimed; keep an original backup and check exported files before re-importing.

## Screenshots

_Screenshots coming soon: import screen, folder management, and English/Arabic workspaces in light/dark mode. Use synthetic data only; sanitize all screenshots before sharing._

## Features

- Import unencrypted JSON and download a byte-for-byte original copy, including whitespace and UTF-8 BOM.
- Search/filter items, edit login details or raw JSON, and apply bulk folder/favorite/delete actions.
- Sort items alphabetically, by creation date, or by last-modified date in ascending/descending order. Sorting is view-only; export order is unchanged. Date sorting uses imported `creationDate`/`revisionDate`; missing or invalid dates stay last. Sort choices stay in memory and reset with the vault.
- Toggle **Show dates** to display creation/last-modified columns, formatted in the selected language and your browser's local time zone. Missing/invalid dates show a dash; date visibility resets with the vault and is not persisted.
- Create, rename, move, merge, and safely delete folders and subfolders. Slash-separated folder names retain the native export structure; folder deletion reassigns items rather than deleting credentials.
- Name full, selected-item and recursive actual/virtual folder exports. Subsets preserve source order, referenced structures and unknown properties without changing the loaded vault.
- Compare every candidate in a duplicate group, with literal field differences and privacy-safe masks. Rename or confirm deletion of one candidate with undo; ignore/restore groups in review only. Nothing is merged automatically; structural errors block modified export, while warnings are advisory.
- Undo/redo up to 30 in-memory snapshots, a secret-free action history, and unsaved-work warnings.
- Privacy Mode on by default: DOM masks for sensitive values, hidden notes/raw JSON, and disabled secret editing/reveal/copy until turned off.
- English (`en`)—the canonical/default locale—and Arabic (`ar`) with first-class RTL support. [Additional translations are welcome](CONTRIBUTING.md#translations).
- Light and dark themes. Language/theme selections are saved locally; the initial theme follows the OS if no preference exists. Preferences restore before paint.

## Privacy and security

**These exports contain plaintext passwords and other secrets. Never upload a real vault export anywhere—including issues, pull requests, chat, or this repository.** Selecting a file in Vaultsort reads it locally; it is not a server upload.

- Original bytes, the working document, drafts, and history stay in browser memory. Vaultsort has no backend, account, telemetry, service worker, or vault persistence.
- Only `vaultsort.language` and `vaultsort.theme` use LocalStorage. Vault contents, filenames, search terms, and history are not stored there.
- App assets, translations, and fonts load locally with the application. No runtime API requests, external item images, or HTML rendering of imported notes. The CSP keeps `connect-src 'none'`; development HMR is disabled.
- **Apply** updates memory; **Export vault** downloads plaintext JSON. Closing or refreshing loses unsaved work. **Close vault** drops the session's references and revokes download URLs; JavaScript cannot guarantee forensic erasure of browser-managed memory.
- Privacy Mode is visual privacy, not encryption or protection against a compromised browser. Extensions, clipboard history, downloads, the OS, and other software are outside Vaultsort's control.

Keep real exports outside the checkout—especially outside `public/` and `dist/`. Use a trusted device/browser, protect downloads, and clear copied secrets from clipboard history yourself. See [SECURITY.md](SECURITY.md) for boundaries and private reporting.

### Hosted copies / GitHub Pages

The static build can be hosted over HTTPS, including on GitHub Pages, but this repository does not configure a deployment workflow or advertise a hosted instance. Loading a hosted copy makes ordinary requests for application assets; its host may log those requests and your IP address.

You must trust the host, repository account, build dependencies, and delivered JavaScript. A malicious or changed build can read a selected plaintext vault and remove security controls; CSP is not proof that a hosted copy is trustworthy. For sensitive use, review/build the source and serve it locally. Never deploy vault files alongside the app.

## Tech stack

Vue 3, TypeScript, Vite, Tailwind CSS, and `vue-i18n`; Vitest + Vue Test Utils/jsdom for tests and ESLint for linting. Inter is bundled locally. No backend or UI component library.

## Local development

Use Node.js **22.13+ (22.x), 24.x, or 26+**, as specified in `package.json`.

```bash
git clone https://github.com/Mahmoud217TR/Vaultsort.git
cd Vaultsort
npm ci
npm run dev
```

Open the printed localhost URL. HMR is intentionally disabled: refresh after source changes. Use synthetic vault data for development.

## Production build

```bash
npm run build
npm run preview
```

The build type-checks the app and writes static assets to `dist/`. Preview serves the build locally; it is not a production backend. Serve `dist/` with a static HTTP(S) server. Relative asset paths support subdirectory hosting. Opening `index.html` directly through `file://` is not supported.

## How to use

1. Export **unencrypted JSON** from Bitwarden or Vaultwarden. Handle this temporary plaintext file carefully.
2. Open it in Vaultsort and download an **Original copy** before editing.
3. Browse/search/filter, select an item, and **Apply** edits. Turn off Privacy Mode to edit secrets or use Raw JSON. Unknown/type-specific structures remain available in Raw JSON.
4. Use **Folders → Manage** to reorganize folders, or select rows for bulk actions. The header checkbox selects all filtered items, including other pages. **Include subfolders** explicitly includes a branch when deleting/merging.
5. Review duplicate candidates and validation. Export the modified vault and verify the download before closing. Only applied edits are exported; no original file is overwritten.
6. Follow your password manager's import guidance and check the result. Imports may create duplicates; Vaultsort cannot guarantee compatibility with every export/import version.

### Export scope and filenames

**Export vault** saves the complete applied document. **Export selected** includes selections
across pages; folder download actions include direct/descendant items and empty branch records,
plus existing ancestor structures without ancestor items. Filters do not narrow a folder export.
Review shows scope/count, validation and an editable source-derived filename. Subset downloads
do **not** mark all working-vault edits saved. Apply/reset pending drafts first; changed documents
or selections require reopening review. Original-copy bytes and name remain unchanged.

Names are basenames, not paths. Unsafe/reserved names block download rather than being silently
repaired; `.json` is appended if absent. The final limit is **200 Unicode code points**, with no
additional byte limit. The app requests the displayed name; browser/OS adjustments, collisions
and filesystem limits can affect the saved name or successful saving.

Folder export blocks duplicate full paths inside the requested actual/virtual branch. Duplicates
outside it do not activate this guard; selected export retains its independent validation rules.
Unsafe narrowing of malformed organization/collection metadata blocks either subset operation
without dropping, coercing or retaining that metadata wholesale. Missing metadata remains advisory.

**Subset export is not sanitization or anonymization:** opaque root metadata is preserved and may
contain information outside scope. Ownership references are not converted. Personal and authorized
organization import routes differ; combined folder/collection lists, empty envelopes, mixed ownership,
unsupported types and unknown metadata can be handled differently or lost by downstream importers.
No actual local importer verification or lossless multi-owner import guarantee is claimed.

### Duplicate review

**Compare group** opens all candidates, including nested unknown properties and ordered arrays.
Absent, null and empty stored values differ; object-key ordering alone does not. Privacy Mode
removes protected values and sensitive imported labels from comparison DOM content. Turning it
off shows complete literal text, not HTML, images or active imported links. Rename applies only
the chosen name; Delete confirms the exact candidate/count. Neither chooses a survivor or merges
credentials automatically.

**Ignore this group** hides only that group/rule from active review, not validation or exports.
Restore ignored groups explicitly. Ignores survive view/preference changes but clear on any
document change, undo/redo, replacement or close. Comparison, filename and ignore state stay in memory.

**Filters**, **Sort**, and **Fields** disclose compact controls. Notes, Date created, and Last
modified are independent, initially hidden, session-only columns. Full notes are inspected as
literal text only with Privacy Mode off. Sorting changes the view, not export order. Numeric SSH
type 5 is discoverable through navigation and filtering; its opaque data remains available through
the existing Raw JSON editor, without a specialized SSH editor.

Item warnings open the current source item and its field or safe context. Stale warnings are
rejected; cancelled navigation retains drafts. **Download original copy** remains in the workspace
sidebar. Repository and **Having an issue?** links open fixed GitHub destinations in new tabs;
they never include vault data and do not contact GitHub until activated.

There is no encrypted-export support, cloud sync, or automatic save. Full-document undo snapshots cost memory proportional to vault size; test large files cautiously.

## Contributing and checks

See [CONTRIBUTING.md](CONTRIBUTING.md), especially [Translations](CONTRIBUTING.md#translations), and follow our [Code of Conduct](CODE_OF_CONDUCT.md). Report ordinary bugs/features through the issue forms; report vulnerabilities [privately](SECURITY.md#report-a-vulnerability).

```bash
npm run lint
npm test
npm run build
```

Tests cover preservation, folder operations, validation, session history, DOM privacy, branding, translation coverage, preference restoration, and all four current language/theme combinations. Automated UI tests use jsdom; browser/RTL visual checks are still needed for UI changes. No CI workflow or separate formatting command is currently configured.

Refinement acceptance evidence and remaining gates are recorded in
[`specs/001-refine-vault-usability/implementation.md`](specs/001-refine-vault-usability/implementation.md).
This is not a cross-browser or representative-user acceptance claim.
Export/comparison regression and Chromium native-zoom/offline/scale evidence is recorded in
[`specs/002-expand-export-review/implementation.md`](specs/002-expand-export-review/implementation.md).
Firefox, Safari, physical touch hardware and actual local imports remain unverified.

## License

Vaultsort is licensed under the [MIT License](LICENSE). Bundled Inter has its own [SIL Open Font License](public/fonts/OFL.txt); third-party dependencies retain their respective licenses.
