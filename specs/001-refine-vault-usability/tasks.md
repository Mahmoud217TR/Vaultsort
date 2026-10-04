---
description: "Executable, story-grouped implementation tasks for Vaultsort usability refinement"
---

# Tasks: Refine Vaultsort Usability

**Input**: Design documents from `specs/001-refine-vault-usability/`.

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [UI contracts](contracts/ui-contracts.md),
[quickstart.md](quickstart.md), and [baseline.md](baseline.md).

**Tests**: Included because FR-026 explicitly requires synthetic-data regressions for
security-sensitive and item-targeting behavior, and the constitution requires verification
of non-trivial changes. Add focused cases to existing suites; no new test framework is needed.
Write the applicable regression cases before their implementation and confirm they fail for
the intended missing behavior, not merely a broken test environment.

**Organization**: Six story phases in specification priority order. Checked tasks are completed;
unchecked tasks still require their full implementation or validation matrix.

**Execution note**: The implementation command makes reviewer checklists read-only. Record
implementation evidence in `implementation.md` beside this file instead of creating or updating
`checklists/implementation.md`; all such evidence references below use that substitute.

## Format and working boundaries

- Task format: `- [ ] Tnnn [P?] [USn?] Description with exact file paths`.
- `[P]` means file-disjoint work can run concurrently **after its stated prerequisites**.
  It does not authorize concurrently editing the same App, stylesheet, locales or test file.
- Paths are repository-relative. New source files are limited to the planned focused
  presentation components and `src/components/usability.test.ts`; extend existing modules.
- Use the existing Vue/native browser/vue-i18n stack, semantic tokens, Inter and logo.
  Read `docs/design-system.md` before any Vue-template/style edits. No new dependency, backend,
  persistence, imported HTML, runtime network request, telemetry or global overlay framework.
- Only `vaultsort.language` and `vaultsort.theme` persist, through their existing reader/writer.
  All vault-derived and optional-field state remains in memory. Keep `connect-src 'none'` intact.
- Record actual checks, environment, exclusions and pending acceptance in
  `specs/001-refine-vault-usability/checklists/implementation.md`, created by T002.
  Never use real vault data or mark participant/browser checks passed without evidence.

## Phase 1: Setup — Existing Project and Evidence

**Purpose**: Reuse the existing project and preserve the already captured comparison build;
do not scaffold another application or overwrite user work.

- [X] T001 Verify the Node version and `package-lock.json` against `package.json`, install with `npm ci` only if needed, and retain the original production build, synthetic fixture/hash and raw samples referenced by `specs/001-refine-vault-usability/baseline.md`; if evidence or matching test conditions are unavailable, regenerate the old baseline using `specs/001-refine-vault-usability/quickstart.md` before modifying application files, without replacing the recorded baseline silently.
- [X] T002 Create `specs/001-refine-vault-usability/implementation.md` with pending FR-001–026/SC-001–012 evidence entries, existing source status and verification conditions; read `AGENTS.md`, `.specify/memory/constitution.md` and `docs/design-system.md`, run `npm run lint`, `npm test` and `npm run build`, and record actual results without modifying the constitution, old specification, or storage policy.

**Checkpoint**: Existing environment and pre-change evidence are available; requirements and
privacy boundaries are understood. Setup results do not count as new-feature acceptance.

## Phase 2: Foundational — Shared Transient State

**Purpose**: Only the small state primitives used by multiple stories. Complete T001–T002
before either task and complete this phase before story implementation.

- [X] T003 Add an App-local document revision in `src/App.vue` with the exact constraint "Monotonically increasing App-local integer whenever the working-document reference changes"; update synchronously on load/commit replacement/undo/redo/close, never reset it through `resetUI()`, retain the existing source indices scoped to that revision, and leave `src/composables/useVault.ts` snapshots/export behavior unchanged; capture revision at result derivation rather than at later activation.
- [X] T004 Replace the existing filter-disclosure boolean with shared `openControl` state in `src/App.vue`, constrained to "`filters`, `sort`, `fields`, or null; default null" and "At most one disclosed form panel"; preserve the current filters while preparing the Fields/Sort panels for their stories, add guarded outside/Escape dismissal and connected-trigger focus return, and make the existing shortcut handler respect consumed events so transient dismissal cannot discard an editor draft; no global overlay manager.

**Checkpoint**: Shared view-only state is ready. Fields, notes, issue metadata, SSH descriptors,
preference fixes and tooltips still belong to the story phases below.

## Phase 3: User Story 1 — Choose Fields Without Exposing Secrets (P1) — MVP

**Goal**: Independent hidden-by-default fields and safe literal full-note inspection.

**Independent Test**: Import synthetic long/malformed/mixed-script notes and dates, enable any
one field in at most three activations, inspect full notes with privacy off, then mask/reset.
No note survives in the masked DOM; original bytes and exported values/order stay unchanged.

**Contracts**: UI-01 field portion and UI-02. **Requirements**: FR-005–010, FR-024–026;
SC-002, SC-006, SC-008, SC-011. **Prerequisites**: Phase 2 only.

### Tests

- [X] T005 [P] [US1] Extend `src/components/security.test.ts` for UI-02 with synthetic notes on login/non-login/SSH/unknown items: privacy-on must mount no note preview/full text/secret descriptions, opening then masking must remove detail, script/image/link-like notes must remain literal, and hiding Notes/document replacement/deletion/undo/reset must clear stale detail; cover native-popover detection and dialog fallback without treating jsdom as a real layout test.
- [X] T006 [P] [US1] Extend `src/components/sorting.test.ts` for the UI-01 field contract: three independent false defaults, import/close/replacement reset, survival of sort/filter/locale/theme changes, valid local-time/locale date display and neutral malformed-date values, correct column spans, ≤3 activations per field, and unchanged exports/original bytes including unknown properties.

### Implementation and validation

- [X] T007 [US1] Add matching field-selection, note-inspection, masked/unavailable and dismissal labels in `src/i18n/locales/en.json` and `src/i18n/locales/ar.json`; keep interpolation placeholders synchronized and action descriptions free of note contents.
- [X] T008 [US1] Replace `showDates` in `src/App.vue` with `visibleFields.notes`, `visibleFields.created` and `visibleFields.modified`, each constrained to "Boolean, false"; implement the labelled Fields disclosure, independent table columns and reset rules; enforce notes as "Untrusted value; only a string is displayable, blank/non-text means no preview" and dates as "Existing imported values; valid strings display through locale/time-zone formatting, otherwise a dash"; reuse existing date formatting and cap visible-row previews at 100 Unicode code points including ellipsis, preserving original text and view-only dirty/history semantics.
- [X] T009 [P] [US1] After T007, create `src/components/NoteInspector.vue` for UI-02 using feature-detected native `popover="auto"` and the existing `src/components/Modal.vue` fallback; render complete literal text through interpolation with readable line breaks, bounded scrolling, accessible title and initial Close focus; synchronize native dismissal with emitted closure, restore the connected invoker for Close/Escape, preserve outside-activation focus, and consume Escape before editor closure.
- [X] T010 [US1] After T008–T009, integrate one conditional inspector into `src/App.vue`; constrain `noteTarget` to "Null or current document revision plus source item index" and its display text to "Derived from the current item only while Notes is enabled and privacy is off"; derive rather than cache note text, validate the captured revision, and clear/unmount on accepted privacy enablement, hidden Notes, removed trigger, any document replacement and reset, with a Fields/list fallback when the trigger disconnects.
- [X] T011 [US1] Style Fields, bounded single-line previews and the inspector in `src/style.css` using existing tokens/logical properties, mixed-script isolation and literal-text wrapping; keep sensitive text in normal text colors, all trigger/Close focus visible, modal/popover contrast accessible and reduced-motion behavior unchanged.
- [X] T012 [US1] Run T005–T006 and quickstart scenario A against `src/App.vue` and `src/components/NoteInspector.vue`, including real-browser pointer/keyboard/touch-equivalent opening, native/fallback dismissal and DOM masking across all four locale/theme pairs; record results and exact original/export preservation in `specs/001-refine-vault-usability/checklists/implementation.md`, leaving unsupported real-hardware claims unverified.

**Checkpoint**: US1 can be demonstrated independently as the MVP. Compact Filter/Sort redesign,
SSH discovery, tooltip rollout and GitHub/security-chrome changes are not required for that demo.

## Phase 4: User Story 2 — Go Directly to an Item's Issue (P1)

**Goal**: Every item warning opens its exact current source item and focuses the existing
field or an item-specific safe explanation, without losing drafts or weakening privacy.

**Independent Test**: From table/review/export, activate warnings on sorted/filtered/off-page
items with duplicate/missing IDs. Confirm one activation plus existing confirmation reaches
the intended field/context; cancellation and stale targets never change the current draft/item.

**Contract**: UI-03. **Requirements**: FR-011–012, FR-024–026; SC-003, SC-008.
**Prerequisites**: Phase 2; no US1 feature dependency. Default execution follows US1 to avoid
concurrent changes to `src/App.vue` and shared test/localization files.

### Tests

- [X] T013 [P] [US2] Extend `src/domain/vault.test.ts` for UI-03 validation metadata: missing folder, malformed login/username/password/TOTP/URI and ownership advisories get correct typed hints/URI entry positions; severity/message keys and folder/document-only scope remain unchanged, and no hint contains imported sensitive values.
- [X] T014 [P] [US2] Create `src/components/usability.test.ts` using the existing App mount/FileReader/native-dialog stubbing pattern to cover table/review/export warning routing, repeated/missing IDs, filtering/sorting/pagination, same-item issue focus, multiple issues, accepted/cancelled draft prompts, stale deletion/index shift/undo/redo/replacement requests and privacy-safe fallbacks; assert cancellation preserves view, filters, page, selection, current item, draft and originating dialog.

### Implementation and validation

- [X] T015 [US2] Extend `Issue` and `validateVault()` in `src/domain/vault.ts` with item-only optional field hints `folderId`, `login`, `login.username`, `login.password`, `login.totp`, `login.uris`, `ownership`, and `entryIndex` constrained to "Optional non-negative URI entry position; only for `login.uris`"; retain `itemIndex` as "Optional source item position", `folderIndex` as "Optional source folder position", severity "Existing `error` or `warning`", message "Existing untranslated localization key; never imported secret text", and the rules "At most one item/folder index may be set. Neither means document-level." and "Indices and entry positions must be valid for the revision where validation occurred."; derive hints at their rules, never translated text, without changing data/export blocking.
- [X] T016 [US2] Add synchronized issue-context, remaining-issue actions and unavailable/stale-target notices in `src/i18n/locales/en.json` and `src/i18n/locales/ar.json`; retain localization keys rather than translated strings or copied secret values in active issue context/notices.
- [X] T017 [US2] Build one revision-stamped validation bundle, source-index issue map and shared guarded warning handler in `src/App.vue`; reject stale/invalid/no-longer-current issues before prompting, confirm draft discard before any navigation/modal mutation, handle same-item requests without resetting drafts, select from the full source array without clearing filters/page/selection, and recheck revision before deferred focus; invalidate context/pending focus on document changes without persistent IDs or cross-snapshot remapping.
- [X] T018 [P] [US2] After T015–T017, update `src/components/ReviewPanel.vue` to consume App's validation bundle and emit `inspectIssue` with its captured revision and complete Issue, keeping duplicate-candidate `select(index)` separate; update the review binding and table/export actions in `src/App.vue` to use the same handler, select the first current actionable row issue and close export only after accepted navigation.
- [X] T019 [P] [US2] After T015–T017, update `src/components/ItemEditor.vue` to accept issue/focus context and identify existing folder/username/password/TOTP/URI controls, Add URI fallback, malformed-login context and metadata summary; open metadata before focusing, show all current item issues with actionable context, keep protected controls masked/readonly, never auto-enter protected Raw JSON, and use a focusable item-specific heading when no dedicated control exists.
- [X] T020 [US2] Add compact issue-context/focus styling in `src/style.css` without changing field colors to warning colors or shrinking editor actions; ensure focused controls scroll within the editor rather than introducing page scrolling, and folder/document explanations do not pretend to be item targets.
- [X] T021 [US2] Run T013–T014 and quickstart scenario B against `src/domain/vault.ts`, `src/App.vue`, `src/components/ReviewPanel.vue` and `src/components/ItemEditor.vue`; use a real browser to verify focus after export-dialog removal and masked field navigation, and record all entry-point/cancellation/stale-target results in `specs/001-refine-vault-usability/checklists/implementation.md`.

**Checkpoint**: Warning navigation is complete across all callers, not only the reported table
path. Existing review, export validation, duplicate browsing, confirmations and history remain usable.

## Phase 5: User Story 3 — Edit in a Stable Workspace (P1)

**Goal**: Fix the demonstrated hidden-label overflow at its containing block and retain
reachable editor/list actions on desktop, intermediate and narrow layouts.

**Independent Test**: With privacy off, long imported values and an item open, measure document,
table/editor scroll regions and footers across all locale/theme pairs. Desktop has no page
overflow; narrow layouts preserve intended scrolling, reachable actions and return focus.

**Contract**: UI-05 layout/focus portion. **Requirements**: FR-001, FR-014–015, FR-024;
SC-004, SC-006. **Prerequisites**: Phase 2; the root-cause fix is standalone, but the checkpoint's
all-optional-fields scenario needs US1. Repeat the matrix after US4's compact toolbar changes.

### Tests

- [X] T022 [US3] Extend `src/components/security.test.ts` with a focused structural regression that `src/style.css` establishes the `.editor-scroll` containing block while the accessible Notes label remains in `src/components/ItemEditor.vue`; extend the existing compact-editor/keyboard-scroll focus cases in `src/components/sorting.test.ts` for disconnected-trigger fallback; reproduce actual document overflow in a real browser using `specs/001-refine-vault-usability/baseline.md`, not a jsdom dimension assertion.

### Implementation and validation

- [X] T023 [US3] Fix the proven cause in `src/style.css` by giving `.editor-scroll` a positioning context (`position: relative`) so its absolute `sr-only` Notes label is contained; preserve the label, body scrolling and editor/footer geometry, and add only wrapping/logical shrink constraints justified by separate measured long-content failures, never global page clipping.
- [X] T024 [P] [US3] After T022, preserve/correct compact editor closing and connected-trigger/fallback focus in `src/App.vue` and `src/components/ItemEditor.vue` against the new regression; keep table keyboard scrolling and Apply/Reset/Close reachable without hidden actions or new focus infrastructure, making code changes only where the regression demonstrates a defect.
- [X] T025 [US3] Run quickstart scenario D's layout/focus portion after US1 and T023–T024: measure 1280 × 800, 1440 × 900, short 1440 × 600 and widths 320/768/1024/1280/1440 in English/Arabic × light/dark, privacy off, long/mixed-script content, all fields, expanded controls and 200% zoom; record actual scroll bounds/action reachability/return focus and unavailable engines in `specs/001-refine-vault-usability/checklists/implementation.md`.

**Checkpoint**: The original overflow reproducer is fixed without removing accessible text or
masking offscreen content; intentional narrow vertical/table horizontal scrolling still works.

## Phase 6: User Story 4 — Find Filters, Sorting, and SSH Items (P2)

**Goal**: Compact labelled controls with visible state, existing view-only sort/filter behavior,
and consistent SSH discovery without a new SSH editor.

**Independent Test**: Import mixed types, choose SSH from navigation and type filtering, combine
filters, delete/undo, sort invalid dates both ways and clear filters. Counts/identity/order remain
correct; independent sort/field choices and opaque exported properties are preserved.

**Contracts**: UI-01 filtering/sorting and UI-04. **Requirements**: FR-001–004, FR-013,
FR-024–026; SC-001, SC-005, SC-009, SC-011–012. **Prerequisites**: Phase 2 and US1 for complete
Fields/clear-filter interaction; domain SSH recognition itself does not depend on US1.

### Tests

- [X] T026 [P] [US4] Extend `src/domain/vault.test.ts` for UI-04's shared known-type labels/classification/validation: numeric type 5 is SSH, unknown types remain unknown, string `"5"` is not coerced, recognized SSH gets no generic unsupported advisory, and opaque SSH properties survive unchanged; retain existing stable-tie/invalid-date-last sort tests.
- [X] T027 [P] [US4] Extend `src/components/sorting.test.ts` for UI-01/UI-04: visibly labelled Filters/Sort/Fields and current sort/filter status, filter reset preserving category/search/sort/fields and existing bulk/page semantics, SSH counts through navigation/type/folder/ownership filters, no-SSH import/active zero state/deletion/undo, and stable item/draft/selection targeting after view-only sorts.

### Implementation and validation

- [X] T028 [US4] Add one small static known-type descriptor list/helper in `src/domain/vault.ts`, constrained to "Numeric known types 1–5; numeric 5 is SSH; other values remain opaque/unknown" with singular/category localization keys and existing icons; use it for `typeName()` and validation's known/Other boundary, retain the SSH key icon, and do not add types 6–8, SSH-specific validation/editing or imported-value normalization.
- [X] T029 [P] [US4] After T026–T027, add synchronized SSH category/type and compact sort/filter-state labels in `src/i18n/locales/en.json` and `src/i18n/locales/ar.json`, preserving interpolation parity and non-color-only count/direction descriptions.
- [X] T030 [US4] After T028–T029, replace divergent hardcoded type lists/icons in `src/App.vue` and `src/components/ItemEditor.vue` with the shared descriptors; show SSH navigation/filter options when present or still active at zero, derive accurate working-document counts, exclude SSH from Other, and finish labelled Filters/Sort/Fields disclosures with visible collapsed sort key/direction and explicit folder/type/ownership/inspection filter count/reset, leaving category/search/sort/fields and existing selection/page watchers intact.
- [X] T031 [US4] Refine the compact control row, disclosed form bounds, table headings/rows and narrow visible labels in `src/style.css` using existing semantic tokens and logical spacing; at 1280 × 800 with ≥75 items require ≥8 fully visible default rows and ≤112 pixels of collapsed control height excluding heading/table header, keep expanded controls bounded on short windows and preserve US3's scroll ownership.
- [X] T032 [US4] Run T026–T027 and quickstart scenario C plus density measurements against `src/App.vue` and `src/style.css`; verify the 10,000-item fixture has 1,666 SSH items (Personal 1,666/Work zero), add a small synthetic case with SSH in both folders, recheck the US3 desktop/narrow bounds after toolbar changes, and record counts, view-only preservation, density and keyboard disclosure results in `specs/001-refine-vault-usability/checklists/implementation.md`.

**Checkpoint**: All three controls are discoverable and compact, and SSH is recognized across
shared paths, not merely added to the sidebar. Comparative timing remains a final gate.

## Phase 7: User Story 5 — Trust Language and Theme Preferences (P2)

**Goal**: Consistent native switchers, independently validated pre-paint restoration and usable
session changes even when preference storage fails.

**Independent Test**: Save/reload every language/theme pair and test missing/invalid/blocked
and per-key failing storage. Visible selection, root attributes and appearance agree while an
open vault/draft/selection/privacy/fields stay intact during switching.

**Contract**: UI-06. **Requirements**: FR-016–017, FR-024–025; SC-007.
**Prerequisites**: Phase 2; the restoration fix is independent, while field-retention acceptance
needs US1. No new preference or storage exception is approved by this phase.

### Tests

- [X] T033 [US5] Extend `src/i18n/i18n.test.ts` for UI-06: all four restored combinations, invalid/missing language and theme independently, each key's read throwing while the other is valid, blocked writes with active-session changes, first-screen/root/select agreement, and switches with open drafts/selection/privacy/fields; enforce "Existing `en`/`ar` and `light`/`dark` preference state remains authoritative" and existing locale-key/interpolation checks.

### Implementation and validation

- [X] T034 [P] [US5] After T033, isolate the reads/validation in `public/preferences.js` so one failed/invalid language or theme cannot suppress the other valid choice; retain English and native OS-theme defaults independently, existing blocking-head order in `index.html`, approved keys only and no vault/session persistence.
- [X] T035 [P] [US5] After T033, align native language/theme selection, accessible names and reactive root state in `src/App.vue` through existing `src/preferences.ts` setters, retaining failed-write session functionality and all vault/draft/history/view state; fix setter/binding defects only as demonstrated by tests, without a new store, custom select, theme mode or readers outside the bootstrap.
- [X] T036 [P] [US5] After T033, align the existing preference-control sizes, spacing, selected/hover/focus/disabled states and RTL/narrow behavior in `src/style.css` without hiding the current native values, competing colors or font changes; coordinate unchanged selector names with T035.
- [X] T037 [US5] Run T033 and quickstart scenario E's preference checks against `public/preferences.js`, `src/preferences.ts` and `src/App.vue`, including real-browser pre-paint reload, storage failure and open-draft switching in all combinations; record state agreement, correct independent defaults and approved-key-only storage in `specs/001-refine-vault-usability/checklists/implementation.md`.

**Checkpoint**: Preferences agree visually/accessibly and restore safely without changing the
feature's in-memory boundaries or importing/translating vault data.

## Phase 8: User Story 6 — Understand Controls and Find Help (P2)

**Goal**: Accessible concise help, fixed explicit GitHub navigation, contextual security guidance
and original-copy access without a permanent yellow workspace banner.

**Independent Test**: Pointer/keyboard browse import/workspace/editor/dialog controls, dismiss
tooltips, activate repository/tagline/Issues links and download original bytes. Help is localized,
links preserve workspace/drafts, no external request occurs before activation, and import/export
still describe plaintext and hosted trust honestly.

**Contracts**: UI-05 help portion and UI-07. **Requirements**: FR-001, FR-018–026;
SC-006, SC-008, SC-010. **Prerequisites**: Phase 2 for helpers/links; complete US1–US5 before
the final changed-control inventory and integration checkpoint so no later control lacks help.

### Tests

- [X] T038 [P] [US6] Extend `src/components/security.test.ts` for UI-07: fixed repository/Issues destinations, `_blank`/`noopener noreferrer` and localized new-tab identification, independent tagline/home anchors, links available on import/workspace, no data/query strings/network/prefetch additions, original-copy byte preservation after summary and banner removal, and plaintext guidance in valid and structurally blocked exports; retain existing CSP/font/logo/local-only assertions.
- [X] T039 [P] [US6] Extend `src/components/usability.test.ts` for UI-05 action help: hover/focus descriptions and accessible names, hover persistence, Escape dismissal without editor/draft loss, disabled-action explanation without activation, proper dialog-context descriptions, and no secret text in tooltips; preserve existing native note/disclosure dismissal priority and connected focus restoration.

### Implementation and validation

- [X] T040 [US6] Add matching concise action-help, GitHub/Issues/new-tab and honest plaintext/hosted-trust guidance keys in `src/i18n/locales/en.json` and `src/i18n/locales/ar.json`; tooltips explain actions only, never interpolate vault values or claim Privacy Mode is encryption/closing is secure erasure.
- [X] T041 [P] [US6] After T040, create `src/components/Tooltip.vue` using static localized content, trigger accessible names and stable `aria-describedby`/`role="tooltip"` associations, enforcing "They contain no vault values and are not interactive controls."; implement hover/focus visibility, hover persistence, Escape consumption, viewport-clamped placement and teardown, with reachable disabled/touch explanations and tooltips kept inside their owning native dialog's accessible context; no tooltip library or overlay registry.
- [X] T042 [US6] After T040, update `src/App.vue` to separate the repository-linked tagline from logo/name home behavior, replace the memory footer with the fixed Vaultsort GitHub repository link, add visible unobtrusive Issues links on import/workspace and identify new-tab behavior using `_blank`/`noopener noreferrer`; move Original copy to a discoverable persistent action before removing the yellow banner, keep import/summary/all-export-state plaintext guidance and accessible import hosted-trust details, and add no request/prefetch/data-derived destination.
- [X] T043 [US6] After T041–T042 and US1–US5, inventory and apply action help in `src/App.vue`, `src/components/ItemEditor.vue`, `src/components/ReviewPanel.vue` and `src/components/Modal.vue`, using `src/components/Tooltip.vue` without nested interactive controls; explain disabled actions without enabling them, preserve accessible names and parent-dialog context, and ensure transient Escape/outside dismissal cannot close an editor or discard a draft.
- [X] T044 [US6] Style help, relocated backup/security messaging, separate tagline and footer/Issues links in `src/style.css` using current tokens/logical properties; keep requested links reachable on narrow screens, descriptions viewport-bounded and hoverable, all default/hover/focus/active/disabled/loading/empty/error states distinguishable, and avoid unnecessary animation or large permanent caution surfaces.
- [X] T045 [US6] Run T038–T039 and quickstart scenarios D/E's help/link/trust checks against `src/App.vue`, `src/components/Tooltip.vue` and `src/style.css` in all four locale/theme pairs; verify keyboard/touch-equivalent access, offline local editing/export, zero automatic external traffic, fixed new-tab destinations and preserved active drafts, then record results/exclusions in `specs/001-refine-vault-usability/checklists/implementation.md`.

**Checkpoint**: The banner is gone without removing backup/trust guidance; every changed terse
action is understandable and project navigation remains explicit and workspace-preserving.

## Phase 9: Polish and Cross-Cutting Acceptance

**Purpose**: Validate the integrated feature and update honest behavior/evidence documentation,
not introduce unrelated capabilities. Requires all six story checkpoints before final sign-off.

- [X] T046 Run `npm run lint`, `npm test`, `npm run build` and `git diff --check`, then execute `specs/001-refine-vault-usability/quickstart.md` end to end against the production build: import/edit/folders/bulk/review/export/original/undo/confirmations, four locale/theme pairs, tested widths/200% zoom, keyboard/focus/contrast/reduced motion and native/fallback notes; retain `index.html` CSP and `public/fonts/OFL.txt`, synthetic-only evidence, and log exact results/exclusions in `specs/001-refine-vault-usability/checklists/implementation.md`.
- [ ] T047 Compare all eleven filtering/sorting/paired-date operations against `specs/001-refine-vault-usability/baseline.md` using the identical 10,000-item fixture/hash, device/browser/build conditions, one warm-up and five samples per operation; require each completed-render median no greater than its old counterpart, record independent date/Notes visibility/open/close timings without invented comparators, assert correct results and unchanged values, and attach raw evidence to `specs/001-refine-vault-usability/checklists/implementation.md`; run without concurrent builds/test loads and fix only demonstrated shared-path regressions in `src/App.vue` or `src/domain/vault.ts`, retaining pagination and no arbitrary time budget.
- [ ] T048 Perform the SC-001 usability check in `specs/001-refine-vault-usability/quickstart.md` with at least five representative users and synthetic data: at least 80% must independently find filters, change sorting and enable a field within 60 seconds, and at least 80% rate clarity/ease ≥4/5; record actual outcomes in `specs/001-refine-vault-usability/checklists/implementation.md`, leaving this task unchecked and acceptance explicitly pending if participants are unavailable instead of substituting agent/automation opinions.
- [X] T049 [P] After the story checkpoints, update `README.md` and `CHANGELOG.md` to describe only implemented compact controls, independent session-only fields/privacy-safe notes, contextual warning navigation, SSH discovery, consistent preferences and GitHub/backup guidance; preserve honest plaintext/host/browser limitations and original-copy workflows, and do not claim usability/performance/cross-browser acceptance before the corresponding results exist.
- [ ] T050 Review all FR-001–026 and SC-001–012 entries in `specs/001-refine-vault-usability/checklists/implementation.md` against `specs/001-refine-vault-usability/spec.md` and `specs/001-refine-vault-usability/contracts/ui-contracts.md`; re-run affected tests and `npm run lint`, `npm test`, `npm run build`, `git diff --check` after any fixes, retain unverified gates/exclusions explicitly, and confirm no extra storage/dependency/product scope or loss of unknown data, source order, originals, validation, drafts or undo before reporting implementation status.

## Dependencies and Execution Order

### Phase dependencies and completion graph

```text
Setup T001–T002
  └─ Foundation T003–T004
       ├─ US1 T005–T012 ── MVP checkpoint
       ├─ US2 T013–T021 (no US1 feature dependency)
       ├─ US3 T022–T025 (all-fields checkpoint also needs US1)
       ├─ US4 T026–T032 (complete Fields/reset checkpoint also needs US1)
       ├─ US5 T033–T037 (field-retention checkpoint also needs US1)
       └─ US6 T038–T045 (full help inventory/integration needs US1–US5)
            └─ All story checkpoints → T046–T049 → T050 final sign-off
```

**Recommended completion order**: Setup → Foundation → US1 → US2 → US3 → US4 → US5 → US6
→ integrated acceptance. This honors P1 before P2 and avoids shared-file collisions. T023's
standalone overflow fix can be brought forward after T022 if needed, but T025 still exercises
the implemented optional fields and final acceptance rechecks the later control layout.

**Functional versus file dependencies**: Domain warning metadata, SSH classification,
preference bootstrap and tooltip mechanics do not inherently depend on each other. Their
App/styles/locales integration is serialized because those files are shared. Do not label
whole stories parallel merely because their user outcomes differ.

### Within each story

1. Write its stated regression cases first and check that failures identify intended behavior.
2. Add constrained domain/view state and synchronized locale keys.
3. Build the focused component/handler, then wire every relevant caller.
4. Add styling without replacing tokens or competing with existing scroll ownership.
5. Run the story's independent test and record actual evidence at its checkpoint.

T003/T004 cannot overlap (both App). T005/T006 and T013/T014 are file-disjoint test pairs.
T018/T019 start only after T015–T017; T018 owns App/ReviewPanel and T019 owns ItemEditor.
T009 and T008 can overlap only after T007; integration T010 waits for both. T024 can overlap
T023 after T022. T029 can overlap T028 after T026–T027. T034–T036 can overlap after T033,
with existing selector/setter contracts agreed; T037 waits for all three. T041 can overlap
T042 after T040; T043 waits for both. Final documentation T049 can overlap non-source-changing
checks after story completion; benchmark T047 must not run alongside resource-heavy checks.

### Parallel execution examples per story

| Story | Safe concurrent tasks | Required boundary |
| --- | --- | --- |
| US1 | T005 security tests + T006 sorting/field tests; later T008 App fields + T009 NoteInspector | Foundation complete; component/App work after T007; T010 waits for both |
| US2 | T013 domain metadata tests + T014 App navigation tests; later T018 review/caller integration + T019 editor focus | Foundation complete; integration pair after T015–T017 |
| US3 | T023 stylesheet containing-block fix + T024 Vue focus correction | T022 complete; no competing App or stylesheet work from another story |
| US4 | T026 domain SSH tests + T027 sorting/filter UI tests; later T028 domain descriptors + T029 locale keys | Tests first; T030 waits for descriptor/locale completion |
| US5 | T034 bootstrap JS + T035 App/preference bindings + T036 preference styles | T033 complete; three separate file ownership groups and unchanged shared selectors |
| US6 | T038 security/link tests + T039 tooltip interaction tests; later T041 Tooltip + T042 App links/guidance | Tests first; implementation pair after T040; T043 waits for both |

Parallel markers describe execution opportunities, not instructions to spawn agents. No task
may edit another task's active files, including the shared evidence ledger. Have a single
owner consolidate validation entries rather than racing writes to the checklist.

## Implementation Strategy

### MVP first

Complete T001–T012 and demonstrate **US1 only**: independent fields and privacy-safe full notes.
Run its regressions/native-fallback/DOM/export checks before proceeding. Keep unchanged existing
Filter/Sort behavior until US4; do not declare the entire refinement complete or add deployment.
The old overflow bug is not solved by the US1 MVP; prioritize the documented US3 fix next if it
blocks a usable demonstration, while preserving the story-labelled task accounting.

### Incremental delivery

Complete each subsequent story's checkpoint in P1 then P2 order, rerunning existing tests to
catch cross-story regressions. Preserve the pre-change build and synthetic fixtures throughout.
After all stories, measure the integrated production build, conduct the representative-user
check and update behavior documentation. An unavailable participant/engine or missing baseline
is a reported verification gap, not permission to fabricate acceptance evidence.

### Scope and counts

| Phase / story | Task IDs | Count |
| --- | --- | --- |
| Setup | T001–T002 | 2 |
| Foundation | T003–T004 | 2 |
| US1 — Fields/notes | T005–T012 | 8 |
| US2 — Issue destinations | T013–T021 | 9 |
| US3 — Stable workspace | T022–T025 | 4 |
| US4 — Filters/sort/SSH | T026–T032 | 7 |
| US5 — Preferences | T033–T037 | 5 |
| US6 — Help/trust/links | T038–T045 | 8 |
| Cross-cutting acceptance | T046–T050 | 5 |
| **Total** | **T001–T050** | **50** |

## Requirements and Contract Traceability

| Requirements / outcomes | Tasks / acceptance gate |
| --- | --- |
| FR-001; density SC-005 | T011, T020, T023–T025, T031–T032, T036, T044, T046 |
| FR-002–004 | T004, T027, T030–T032; T047 comparison; T048 discoverability |
| FR-005–010; SC-002, SC-008 | T005–T012; T047 dataset and new Notes timing |
| FR-011–012; SC-003 | T013–T021 |
| FR-013; SC-009 | T026–T030, T032 |
| FR-014–015; SC-004 | T022–T025, T031–T032, T046 |
| FR-016–017; SC-007 | T033–T037 |
| FR-018; SC-006 | T039–T041, T043–T046; preceding story focus checks |
| FR-019–023; SC-010 | T038, T040, T042–T045 |
| FR-024 | Locale/styling/keyboard tasks in each story; T046 |
| FR-025–026; SC-008 | T003, T005–T006, T013–T021, T026–T027, T033, T038, T046, T050 |
| SC-001 | T048; cannot be satisfied by automated checks |
| SC-011–012 | T001, T032, T047; retained baseline, correct 10,000-item results and five-run medians |
| UI-01 | T006, T008, T027, T030–T032 |
| UI-02 | T005, T009–T012 |
| UI-03 | T013–T021 |
| UI-04 | T026–T030, T032 |
| UI-05 | T022–T025, T031, T039, T041, T043–T046 |
| UI-06 | T033–T037 |
| UI-07 | T038, T040, T042–T045 |

Do not add scaffold/auth/database/API/logging tasks from the generic template: this is an
existing local-first frontend. Constitution ratification/storage-guidance reconciliation and
GitHub repository-setting verification remain separate governance/release work, not this UI feature.
