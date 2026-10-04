# Changelog

Notable changes are recorded here following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). No published releases are recorded yet; the package version is not release history.

## [Unreleased]

### Added

- Optional creation/last-modified columns with localized date/time formatting and a session-only Show dates toggle.
- View-only item sorting by name, creation date, and last-modified date, with ascending/descending controls in English and Arabic.
- Browser-only import, original backups, item/raw JSON editing, search/filtering, bulk actions, validation/export, duplicate review, and in-memory undo/redo.
- Folder/subfolder creation, editing, branch moves, safe deletion, merging, and virtual grouping paths using native slash-separated names.
- English (canonical/default) and Arabic (RTL) localization, plus persisted language and light/dark preferences.
- Vaultsort branding, local Inter font, and migrated design/favicon guidance.
- Public contribution/security/conduct documentation, MIT license, and GitHub issue/PR templates with translation guidance.

### Changed

- Refined interface density, shared control states, table/sidebar readability, dialog scrolling, and narrow-screen LTR/RTL layouts without changing the Azure identity or vault workflows.
- Expanded local/sensitive-file ignore rules without ignoring general JSON files.
- Clarified hosted-build trust, plaintext-export handling, preference-only persistence, and current pre-release status in project documentation.

### Fixed

- No fixes recorded for this initial changelog yet.

### Security

- Vault documents, original bytes, drafts, and history remain in memory; only language/theme preferences are persisted.
- DOM privacy masks, escaped imported content, local-only CSP, and preservation/security regression tests are part of the current implementation.
- Community reporting instructions require synthetic reproductions and prohibit sharing actual vaults or credentials.
