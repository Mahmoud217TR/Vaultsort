# Feature Specification: Refine Vaultsort Usability

**Feature Branch**: `wip/speckit` (existing branch; no feature branch was created)

**Created**: 2026-10-04

**Status**: Draft

**Input**: User description: "Improve Vaultsort's usability and visual polish without changing
its core workflows or privacy model." Scope includes compact filtering/sorting, optional field
selection and note previews, contextual warnings, SSH discovery, overflow fixes, consistent
preferences, contextual security messaging, and GitHub links. Preserve Azure, branding, Inter,
information density, English/Arabic, RTL, both themes, and keyboard accessibility.

## Clarifications

### Session 2026-10-04

- Q: How many items should a vault contain in responsiveness acceptance tests? → A: 10,000 items; this is a verification target, not an import limit.
- Q: How quickly should filtering, sorting, and field-selection changes update a 10,000-item vault? → A: No slower than the existing interface; no fixed time limit.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose Fields Without Exposing Secrets (Priority: P1)

As a vault owner, I can choose which optional fields appear and inspect notes without
overloading the table or accidentally revealing them while Privacy Mode is enabled.

**Why this priority**: Field visibility is a requested usability improvement with a sensitive
data boundary; convenience must not expose notes.

**Independent Test**: Import synthetic items containing long notes and dates, select fields,
inspect a note, and toggle Privacy Mode; verify field choices never modify the export.

**Acceptance Scenarios**:

1. **Given** a newly imported vault, **When** I open the field-selection control, **Then** Notes,
   Date created, and Last modified are individually selectable and initially hidden.
2. **Given** Privacy Mode is off, **When** I enable Notes, **Then** non-empty notes show a short
   table preview and a discoverable pointer, keyboard, and touch action opens the complete note
   as literal text; closing the detail returns focus to its trigger.
3. **Given** Privacy Mode is on and Notes is selected, **When** I inspect a row, **Then** note
   content is masked, cannot be revealed through hover or focus, and is absent from hidden page
   content and control descriptions. Re-enabling Privacy Mode closes any open note detail.
4. **Given** Date created alone is selected, **When** I inspect the table, **Then** only that
   optional date is shown; changing visibility or opening notes leaves imported values intact.
5. **Given** optional fields are selected, **When** I close or replace the vault, **Then** the
   next vault starts with all optional fields hidden.

---

### User Story 2 - Go Directly to an Item's Issue (Priority: P1)

As a vault owner, I can activate a validation warning and reach the affected item and issue
without searching a generic review page.

**Why this priority**: Context-free navigation interrupts correction and risks editing the
wrong item when sorting, pagination, or duplicate identifiers are involved.

**Independent Test**: Use synthetic warnings on several items with repeated or missing IDs,
sort and filter the list, and activate warnings from each place they are actionable.

**Acceptance Scenarios**:

1. **Given** an item warning in the table, **When** I activate it, **Then** the correct item's
   editor opens with the relevant issue identified, not merely the generic validation view.
2. **Given** a warning identifies a field with an existing editor control, **When** I activate
   it, **Then** the affected control is brought into view and receives keyboard focus.
3. **Given** the issue has no accessible dedicated field, **When** I activate it, **Then** the
   correct item opens with an issue-specific explanation or existing safe inspection location;
   Privacy Mode stays unchanged and no protected value is exposed.
4. **Given** a warning in the review or export results refers to an item outside the current
   page or filters, **When** I activate it, **Then** I reach that exact item without manually
   searching or clearing filters. Existing unsaved-draft confirmation remains in effect.
5. **Given** an unapplied edit, **When** I cancel a warning-navigation discard prompt, **Then**
   my draft, current item, and navigation state remain unchanged.

---

### User Story 3 - Edit in a Stable Workspace (Priority: P1)

As a vault owner, I can disable Privacy Mode and open any item without the workspace growing
beyond the window or hiding important actions.

**Why this priority**: The reported overflow bug obstructs the core editing workflow.

**Independent Test**: Open synthetic items with long values in a desktop workspace, toggle
Privacy Mode, enable every optional field, expand filters, and inspect the editor and footer.

**Acceptance Scenarios**:

1. **Given** a desktop workspace with Privacy Mode off, **When** I open an item, **Then** no
   page-level horizontal or vertical scrolling is introduced; table and editor contents scroll
   within their intended regions and Apply, Reset, and Close remain reachable.
2. **Given** narrow or intermediate layouts, **When** I open and close an item, **Then** the
   editor remains usable, the list can be reached again, and keyboard focus returns logically.
3. **Given** long mixed-script names, notes, and extra columns, **When** I use either language
   and theme, **Then** content does not overlap controls or force horizontal page overflow.
4. **Given** filters are expanded on a short desktop window, **When** I browse items, **Then**
   rows and pagination remain reachable rather than being consumed by the control area.

---

### User Story 4 - Find Filters, Sorting, and SSH Items (Priority: P2)

As a vault owner, I can discover filtering and ordering from compact, clearly labelled controls
and find SSH items in the same way as other supported item types.

**Why this priority**: Discoverable controls and restored SSH categories reduce browsing effort
without introducing new editing capabilities.

**Independent Test**: Import a synthetic mixed-type vault, filter it through navigation and
type selection, sort its results, and reset filters without changing exported data.

**Acceptance Scenarios**:

1. **Given** the item list, **When** I scan its controls, **Then** Filters, Sort, and Fields have
   understandable labels, current sorting is identifiable, and active filtering is indicated
   without relying solely on color.
2. **Given** active filters, **When** I inspect and clear them, **Then** selected values are
   discoverable and I can reset filtering without resetting independent sorting or field choices.
3. **Given** items with missing or invalid dates, **When** I choose date sorting in either
   direction, **Then** those items remain last and equal keys retain original relative order.
4. **Given** an imported vault contains SSH items, **When** I inspect navigation or item-type
   filtering, **Then** SSH is available with an accurate count and selects only SSH items.
5. **Given** no SSH items are present, **When** I inspect those controls, **Then** there is no
   misleading non-empty SSH category; other unsupported types remain separately discoverable.

---

### User Story 5 - Trust Language and Theme Preferences (Priority: P2)

As a user, I can tell which language and theme are selected, change them consistently, and
recover my choices after reopening the app.

**Why this priority**: Reliable preferences support Arabic use, accessibility, and visual trust
across both the import screen and workspace.

**Independent Test**: Change each language/theme combination with and without an open vault,
reload, and repeat with preference storage unavailable or invalid.

**Acceptance Scenarios**:

1. **Given** any supported language/theme combination, **When** I use either switcher, **Then**
   its visible selection, accessible name/state, and the applied appearance agree immediately.
2. **Given** stored Arabic/dark preferences, **When** I reopen the app, **Then** the first usable
   screen and controls reflect those choices without a visible wrong-language/theme flash.
3. **Given** an open vault and unapplied edits, **When** I change language or theme, **Then**
   the vault, draft, selection, privacy setting, and field choices remain intact; interface text,
   dates, numbers, and reading direction reflect the chosen language without translating data.
4. **Given** blocked storage or invalid saved preferences, **When** I open the app or change a
   preference, **Then** valid defaults apply and controls still work for the active session.

---

### User Story 6 - Understand Controls and Find Help (Priority: P2)

As a user, I can understand terse controls, reach the project and issue tracker, and receive
security guidance where it matters without a permanent warning taking workspace space.

**Why this priority**: Small explanatory affordances and trustworthy links improve confidence
while preserving the compact native-desktop-inspired identity.

**Independent Test**: Browse import, workspace, editor, and dialogs using pointer and keyboard;
check tooltips, project/help links, plaintext messaging, and original-copy access.

**Acceptance Scenarios**:

1. **Given** an icon-only or ambiguous action, **When** I hover or focus it, **Then** concise
   localized help explains the action without revealing vault data; richer explanations are
   reserved for information that cannot fit reasonably in a tooltip.
2. **Given** the main workspace, **When** I inspect it, **Then** the persistent yellow plaintext
   banner is absent, while original-copy download remains discoverable and security guidance
   remains available at import and export and explains hosted-build trust at the import boundary.
3. **Given** the footer or branding label, **When** I activate its GitHub link, **Then** the
   Vaultsort repository opens without navigating away from the active vault; the logo/name
   retains its existing home/navigation behavior.
4. **Given** a visible but unobtrusive "Having an issue?" link, **When** I activate it, **Then**
   the Vaultsort Issues page opens without including vault data or losing my workspace.
5. **Given** either theme and language, **When** I use menus, dialogs, and editor controls,
   **Then** default, hover, focus, active, disabled, loading, empty, and error states remain
   distinguishable and consistent with the existing design system.

### Edge Cases

- Empty, missing, non-text, whitespace-only, extremely long, multiline, and mixed-script notes
  need bounded previews and readable full-text inspection without fabricating or altering data.
- Note text resembling markup, scripts, links, or images is displayed literally; no execution,
  automatic link loading, or imported image request is permitted.
- Toggling Privacy Mode while a note detail is open immediately removes the exposed note,
  including hidden detail content. Choosing Notes while privacy is on never reveals it.
- Missing, malformed, or non-text dates use a neutral missing-value indicator; sorting them
  never invents timestamps or changes metadata.
- Duplicate/missing item IDs, filtering, pagination, deleted items, and undo must not redirect
  issue navigation to a different item. A stale issue reports that its target is unavailable.
- Multiple issues on one item show item-specific context; a general row warning targets the
  first currently actionable issue, with the remaining issues reachable in that same context.
- Document-level or folder-only validation issues cannot invent an item target; they retain
  contextual explanations and their existing review/folder inspection paths.
- SSH items mixed with unknown types, empty categories, and changes through deletion or undo
  keep type counts accurate without losing unsupported data.
- Long Arabic labels, 200% zoom, narrow windows, and expanded controls must not obscure actions.
- Escape and outside dismissal close transient information without discarding drafts; disabled
  actions remain understandable without becoming actionable.
- Invalid or unavailable preference storage falls back safely; closing a vault clears transient
  UI state but does not reset independently saved language/theme preferences.
- Offline use keeps editing functional; GitHub links do not require connectivity until the
  user deliberately activates them.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The interface MUST preserve the existing Azure design system, logo/branding,
  bundled typography, compact hierarchy, and core import/edit/folder/bulk/review/export/undo
  workflows. Repeated controls and panel headings MUST have consistent spacing, alignment,
  typography, and distinguishable interaction states; no competing aesthetic is introduced.
- **FR-002**: Filters, Sort, and Fields MUST be discoverable through visible localized labels.
  Default controls MUST stay compact; secondary choices MAY use progressive disclosure.
  Active filter status and current sort key/direction MUST be identifiable without color alone.
- **FR-003**: Filtering MUST retain current capabilities, expose active values, and offer a
  clear reset. Clearing filters MUST NOT reset sorting or optional field choices. Filtering
  MUST retain existing selection/pagination behavior rather than silently changing bulk scope.
- **FR-004**: Sorting MUST retain original order, alphabetical, creation-date, and last-modified
  choices with ascending/descending direction. Sorting MUST remain view-only and retain stable
  item targeting, selection, and drafts; invalid/missing dates stay last in either direction.
- **FR-005**: A clearly labelled field-selection control MUST replace the standalone date
  visibility checkbox interaction. It MUST offer Notes, Date created, and Last modified as
  independently selectable optional fields; all three are hidden after import or vault reset.
- **FR-006**: Optional field choices MUST apply only to the active vault session, survive
  sorting/filtering and language/theme changes, and never be persisted or written to exports.
  This change MUST NOT make other fields newly configurable.
- **FR-007**: With Notes enabled and Privacy Mode off, text notes MUST have a single-line table
  preview of at most 100 characters, with truncation indicated and an accessible action for
  full text. Missing, blank, or non-text notes MUST use a neutral missing-value indicator.
- **FR-008**: Full-note inspection MUST display the complete text literally, preserve readable
  line breaks, remain bounded and scrollable for long notes, and support keyboard/touch opening,
  Escape dismissal, and focus return. Imported markup MUST NOT be rendered or executed.
- **FR-009**: Privacy Mode MUST override note visibility and inspection: note content MUST NOT
  appear in previews, tooltip text, accessible descriptions, or hidden page content while on.
  Enabling Privacy Mode MUST close and clear exposed details without changing the document.
- **FR-010**: Enabled dates MUST be formatted using the selected locale and user's local time
  zone; missing/invalid values MUST show a neutral missing-value indicator without mutation.
- **FR-011**: Every actionable item-associated validation warning, including table, review,
  and export results, MUST navigate to the exact affected item. It MUST focus and reveal the
  affected field when an existing accessible control is available; otherwise it MUST provide
  item-specific issue context or a safe existing inspection location, never just generic review.
- **FR-012**: Issue navigation MUST respect Privacy Mode and unsaved-draft confirmations and
  work across filtering, sorting, and pagination, including repeated/missing item IDs. A stale
  target MUST be handled explicitly without opening a different item or discarding a draft.
- **FR-013**: SSH MUST appear in type navigation and item-type filtering when SSH items exist
  in the working vault. Labels/counts MUST be accurate, filter combinations MUST work normally,
  and SSH MUST NOT also be classified as an unknown type. No new SSH editing workflow is added.
- **FR-014**: Disabling Privacy Mode and opening an item MUST NOT create page-level scrolling
  in desktop workspaces. Overflow from rows, optional fields, filters, or editor content MUST
  remain within intended regions; editor actions and pagination MUST stay reachable.
- **FR-015**: Narrow/intermediate layouts MUST support every existing workflow without
  horizontal page overflow, overlapping controls, or inaccessible scrolling regions. Intentional
  narrow-screen vertical page scrolling and horizontal table scrolling remain permitted.
- **FR-016**: Language and theme controls MUST have consistent styling, visible current values,
  localized accessible labels, and keyboard operability on both import and workspace screens.
  Switching MUST update their state and the interface without changing vault data or drafts.
- **FR-017**: Valid English/Arabic and light/dark choices MUST restore before the initial usable
  screen. Each invalid/missing preference MUST fall back independently: English for language,
  system theme for appearance. Blocked storage MUST not prevent session-only changes.
  Only language/theme are persisted.
- **FR-018**: Icon-only and ambiguous controls MUST provide concise localized tooltips on
  pointer hover and keyboard focus, alongside accessible names. Tooltips MUST not contain vault
  secrets or essential instructions unavailable through keyboard/touch operation. Popovers
  MUST be reserved for longer explanations or full-note inspection and be dismissible.
- **FR-019**: The persistent yellow plaintext-vault workspace banner MUST be removed. Plaintext
  and local-processing guidance MUST remain at import and export; import guidance MUST make
  hosted-build trust limits accessible without falsely equating hosted and reviewed local builds.
  Original-copy backup MUST remain discoverable after leaving the import summary.
- **FR-020**: The workspace footer's "Stored in memory only" text MUST be replaced by a link
  to `https://github.com/Mahmoud217TR/Vaultsort`, labelled as the Vaultsort GitHub repository.
- **FR-021**: A visible, unobtrusive, localized "Having an issue?" link MUST point to
  `https://github.com/Mahmoud217TR/Vaultsort/issues` on import and workspace screens.
- **FR-022**: The "LOCAL VAULT EDITOR" branding label MUST link to the repository independently
  of the logo/name home action. All requested GitHub links MUST support keyboard use,
  identify that they open a new tab, and preserve the current vault/draft when activated.
- **FR-023**: GitHub links MUST NOT automatically contact GitHub, load external assets, or
  include vault data in destinations or prefilled issue content. They represent explicit user
  navigation, not a new runtime service. Existing network restrictions MUST remain unchanged.
- **FR-024**: All changed controls, transient details, and states MUST support English/LTR,
  Arabic/RTL, both themes, visible focus, keyboard navigation, reduced-motion preferences,
  and WCAG AA text contrast. Imported mixed-script names and technical values MUST remain readable.
- **FR-025**: Vaults, original bytes, drafts, search, history, field choices, and derived sensitive
  content MUST remain in memory; Privacy Mode MUST default on. No backend, telemetry, vault
  logging, new persistence, imported-content execution, or unrelated product capability is added.
- **FR-026**: View-only refinements MUST leave source order, unknown properties, unsupported
  types, metadata, originals, export validation, undo, and confirmations intact. Security-sensitive
  and item-targeting behavior MUST have regression coverage using synthetic data only.

### Key Entities *(include if feature involves data)*

- **Vault Item**: An imported item with type, name, optional notes/dates, and preserved unknown
  data; the same item must remain identifiable throughout list ordering and issue navigation.
- **Optional Field Selection**: Independent session-only visibility choices for Notes,
  Date created, and Last modified; separate from sorting, filters, and document values.
- **List View State**: Search, filters, sorting, pagination, and selection that determine how
  users browse existing items; not exported content or saved preferences.
- **Validation Issue Target**: An issue's affected item and, when identifiable, field or
  inspection context; some issues concern only a folder or the overall document.
- **Display Preferences**: Language and theme, the only saved preferences in this feature;
  selected values must agree with the visible interface and reading direction.
- **Transient Detail**: A temporary tooltip or note/issue explanation with a trigger,
  dismissible content, and privacy-aware lifetime; never stored with the vault.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a usability check with at least five representative users, at least 80% can
  find filtering, change sorting, and enable a requested optional field without assistance
  within 60 seconds; at least 80% rate clarity and ease of use at 4/5 or better.
- **SC-002**: A user can reveal any one optional field from the normal list in at most three
  control activations. All three fields are initially hidden in 100% of import/reset checks.
- **SC-003**: In 100% of item-warning scenarios, one activation, plus any existing discard
  confirmation, reaches the correct item/field or item-specific fallback without manual search.
- **SC-004**: At 1280 × 800 and 1440 × 900 desktop sizes, opening an item with Privacy Mode off
  produces zero page-level scroll overflow. At widths 320, 768, 1024, 1280, and 1440, all changed
  workflows remain reachable with zero horizontal page overflow in all four language/theme
  combinations, including long-content and all-optional-fields cases. At 200% zoom, controls
  remain operable and content is neither lost nor overlapped.
- **SC-005**: At 1280 × 800 with the default list and at least 75 synthetic items, at least eight
  complete rows remain visible without scrolling. Collapsed filter/sort/field controls occupy
  no more than 112 pixels of vertical space, excluding the heading and table header.
- **SC-006**: Every changed action can be completed with keyboard-only interaction; tooltips
  explain 100% of icon-only/ambiguous controls. Focus remains visible and returns after
  dismissing details or closing the editor across all language/theme combinations.
- **SC-007**: All four language/theme combinations restore consistently when saved; every
  blocked/invalid-storage scenario retains usable controls and correct documented defaults.
- **SC-008**: Privacy checks reveal zero note contents while Privacy Mode is on, including
  after opening and then masking a detail. View-only actions produce zero changes to original
  bytes or exported values/order across the synthetic preservation scenarios.
- **SC-009**: Mixed-type scenarios show correct SSH counts and matching results through both
  navigation and filtering in 100% of cases, including deletion/undo and unsupported types.
- **SC-010**: The workspace contains no persistent plaintext banner; the requested GitHub
  footer, branding, and Issues links are reachable, open the correct destination, and leave
  the active workspace intact. Offline editing remains functional without them.
- **SC-011**: Filtering, sorting, optional-field changes, and note-preview inspection MUST be
  verified against a synthetic vault containing 10,000 items, with correct results and unchanged
  document values. This acceptance dataset does not establish a maximum supported import size.
- **SC-012**: On the same device, browser, and 10,000-item synthetic dataset, the median time
  to display completed filtering, sorting, and comparable field-visibility changes MUST be no
  greater than the pre-refinement interface's median over five repetitions of each operation.
  Record the baseline build and test conditions. There is no fixed time limit; new interactions
  without an existing equivalent have their timings recorded but no invented baseline comparison.

## Assumptions

- This is a specification-only refinement of the existing editor, not an implementation or a
  replacement visual identity. No password management, synchronization, accounts, encrypted
  storage, new editing types, or automatic credential changes are included.
- The existing constitution and [design system](../../docs/design-system.md) are binding.
  Existing import, validation, export, draft confirmation, and history behavior are dependencies
  to preserve, not replacements to design in this feature.
- Original order remains the default sort. Dates use imported creation/last-modified values,
  never synthesized timestamps. Showing a field does not change the sort or search scope.
- SSH means the SSH-key item type represented by imported Bitwarden/Vaultwarden exports.
  This restores discovery and filtering only; unknown/type-specific data remains preserved.
- Notes may contain secrets on any item type, so all note previews and details follow the
  existing Privacy Mode boundary; selecting Notes does not imply permission to reveal it.
- Optional choices persist only within the current in-memory vault session and reset on
  replacement/close. Language/theme changes preserve these choices; no storage exception is needed.
- A warning with several issues selects its first actionable issue and exposes the other
  item-specific issues. Fields unavailable in the current editor use a safe item-context
  fallback rather than adding new editors or disabling Privacy Mode.
- The reported overflow fix targets unintended workspace overflow. Intentional vertical page
  scrolling on narrow screens and horizontal scrolling inside the table are not bugs.
- GitHub is used only through explicit links, not an embedded issue reporter. Links open in a
  new tab to protect unsaved work and convey that behavior; the brand label remains translated.
- Hosted trust guidance is accessible at import for all copies; this feature does not introduce
  host detection, a persistent warning, or a new dismissal preference.
- Representative usability participants and synthetic exports containing SSH items, malformed
  fields, warnings, long notes, and mixed-script content are needed to verify the outcomes.
  These are verification dependencies, not claims that testing has already occurred.
- Responsiveness acceptance uses a 10,000-item synthetic vault; the existing 75-item fixture
  remains useful for pagination and layout checks but is not the responsiveness baseline.
- Responsiveness is measured against the pre-refinement interface under identical conditions,
  not an absolute time threshold. Date visibility changes use the existing date-visibility
  interaction as their comparator; new Notes interactions have no existing equivalent and
  are verified for correct completion with recorded timings rather than a fabricated baseline.
