# Changelog

Notable changes are recorded here following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). No published releases are recorded yet; the package version is not release history.

## [Unreleased]

### Added

- Editable export filenames with scope-specific defaults, Unicode-aware 200-code-point validation and an explicit browser/OS saved-name boundary; original-copy downloads remain byte-exact.
- Selected-item and recursive actual/virtual folder JSON exports with source-order structural closure, unknown-data preservation, result validation and mapped source-warning links. Unsafe ownership narrowing and duplicate paths within folder-export branches block without repair.
- Complete privacy-aware duplicate comparison with explicit name-only rename, confirmed single-candidate deletion and undo, plus in-memory group/rule ignore and restore. No automatic credential merging or survivor choice.

- Independent session-only Notes, Date created, and Last modified columns, initially hidden, with localized dates and privacy-gated literal full-note inspection.
- Compact labelled Filters/Sort/Fields disclosures, contextual revision-guarded item-warning navigation, and numeric SSH type 5 discovery without a new SSH editor.
- Localized action help and explicit new-tab GitHub/Issues links, with original-copy access retained in the workspace sidebar.
- View-only item sorting by name, creation date, and last-modified date, with ascending/descending controls in English and Arabic.
- Browser-only import, original backups, item/raw JSON editing, search/filtering, bulk actions, validation/export, duplicate review, and in-memory undo/redo.
- Folder/subfolder creation, editing, branch moves, safe deletion, merging, and virtual grouping paths using native slash-separated names.
- English (canonical/default) and Arabic (RTL) localization, plus persisted language and light/dark preferences.
- Vaultsort branding, local Inter font, and migrated design/favicon guidance.
- Public contribution/security/conduct documentation, MIT license, and GitHub issue/PR templates with translation guidance.

### Changed

- Refined interface density, shared control states, table/sidebar readability, dialog scrolling, and narrow-screen LTR/RTL layouts without changing the Azure identity or vault workflows.
- Expanded local/sensitive-file ignore rules without ignoring general JSON files.
- Excluded test fixtures from production Tailwind class scanning so regression tests do not change shipped utility CSS.
- Clarified hosted-build trust, plaintext-export handling, preference-only persistence, and current pre-release status in project documentation.

### Fixed

- Contained the editor's hidden Notes label within its scroll region, fixing the reproduced desktop page overflow.
- Restored language and theme independently when one preference storage read fails.
- Kept row click targets stable when dismissing inline controls and restored list focus when a compact editor opener disappears.
- Parsed imported sort dates once per row instead of repeatedly inside comparisons.
- Resolved the active item-type category once per filtering pass instead of repeating descriptor lookup/string conversion for every item.
- Raised import file-badge and step-number text contrast using the existing secondary-text token.

### Security

- Export/comparison requests are revision-bound; subset downloads do not mark whole-vault edits saved. Ignore state never modifies documents/history/validation and resets on document changes. Comparison values and sensitive labels are projected to fixed masks before DOM binding.
- Documented that subsets preserve opaque root metadata and are not sanitization/anonymization; ownership/import-route limitations are disclosed without claiming actual local importer verification.

- Vault documents, original bytes, drafts, and history remain in memory; only language/theme preferences are persisted.
- DOM privacy masks, escaped imported content, local-only CSP, and preservation/security regression tests are part of the current implementation.
- Community reporting instructions require synthetic reproductions and prohibit sharing actual vaults or credentials.
