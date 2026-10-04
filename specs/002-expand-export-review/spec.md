# Feature Specification: Expand Export and Duplicate Review

**Feature Branch**: No branch created; specification directory is independent of the current branch.

**Created**: 2026-10-04

**Status**: Draft — ready for planning

**Input**: User description: "Expand Vaultsort's export and duplicate-review workflows while preserving its existing local-only privacy and data-preservation guarantees: custom export filenames, selected-item export, recursive folder export, and privacy-aware duplicate comparison with explicit rename/delete/ignore actions; use synthetic fixtures, validate resulting documents, and never automatically merge credentials."

## Clarifications

### Session 2026-10-04

- Q: Should subset export be blocked when organization or collection metadata is malformed and cannot be safely narrowed to the selected items? → A: Block subset export with an explanation; leave the loaded vault unchanged.
- Q: Should filename validation keep the 200-character Unicode limit, or also enforce a stricter limit for filesystem portability? → A: Keep 200 Unicode code points; verify the displayed/requested download name and document possible browser/OS adjustments, without an additional byte limit.
- Q: If two distinct folder records have the same full path, should exporting that branch include both folders or block the ambiguous export? → A: Block folder export if the branch contains duplicate full paths; explain the ambiguity without modifying data.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Name an Edited Export (Priority: P1)

As a vault owner, I want to choose a recognizable filename before downloading my edited vault
without changing its contents or accidentally choosing a path or unusable filename.

**Why this priority**: Naming is part of every modified export, including the new subset flows.

**Independent Test**: Import a synthetic vault, apply an edit, open export, choose a different
valid filename and download. Verify the chosen download name and identical document content
regardless of filename. Exercise invalid names and cancellation without downloading or losing state.

**Acceptance Scenarios**:

1. **Given** an imported vault with applied edits, **When** the user opens full export,
   **Then** a labelled editable filename has a safe default derived from the source basename,
   with an edited-export suffix and a `.json` extension, or `vault-edited.json` when unavailable.
2. **Given** a valid export, **When** the user changes only its filename and downloads,
   **Then** the app requests the displayed valid filename and the exported contents remain identical;
   browser or operating-system adjustments to the saved name are outside this guarantee.
3. **Given** a blank, path-like, reserved or overlong name, **When** download is attempted,
   **Then** download is blocked with localized actionable feedback and the entered value is retained.
4. **Given** an open export and an unapplied draft, **When** the user cancels or follows the
   existing draft confirmation flow, **Then** cancellation preserves the draft and all loaded state;
   no unapplied change is silently included or discarded.

---

### User Story 2 - Export Selected Items (Priority: P1)

As a vault owner, I want to download only the items I selected, together with their required
folder and ownership structures, without changing the vault I am editing.

**Why this priority**: This enables deliberate partial sharing or migration while keeping the
working vault intact and avoiding missing structural references.

**Independent Test**: Select synthetic items across folders, types and ownerships, including
unknown item/root properties; export and validate the subset. Compare its membership, metadata,
source order and preserved values, and verify the loaded vault, original bytes and history are unchanged.

**Acceptance Scenarios**:

1. **Given** no selected items, **When** the user views bulk actions,
   **Then** no enabled Export selected action can create an accidental empty or full-vault export.
2. **Given** selected items on multiple pages, **When** Export selected is activated,
   **Then** the export review identifies the selected scope and exact item count, offers a filename,
   and includes all and only the actual selected items, in original source order.
3. **Given** selected personal and organization-owned items, **When** their subset is exported,
   **Then** their IDs, folder references, ownership/collection memberships, unknown properties and
   available referenced folder/organization/collection records are preserved without reassignment.
4. **Given** a structural error in the proposed subset, **When** it is reviewed for download,
   **Then** download is blocked without removing data or modifying the loaded vault; unrelated
   errors solely in excluded known records do not block an otherwise valid subset.
5. **Given** a subset with advisory warnings but no blocking errors, **When** the user explicitly
   downloads it, **Then** it retains those values and warnings are not silently repaired.
6. **Given** malformed organization or collection metadata that cannot safely be narrowed,
   **When** selected-item export is prepared, **Then** download is blocked with an explanation;
   metadata is neither dropped nor included wholesale, and the loaded vault remains unchanged.

---

### User Story 3 - Export a Folder Branch (Priority: P1)

As a vault owner, I want to export an entire folder branch, including its nested folders,
without manually selecting each item or changing their original folder assignments.

**Why this priority**: A folder is a natural migration boundary; omitting descendants would
silently produce an incomplete export.

**Independent Test**: Use a synthetic hierarchy containing a parent, child, grandchild, empty
child, similarly prefixed sibling, unassigned items and opaque folder properties. Export the
parent and verify exact recursive membership, retained structures and a completely unchanged source.

**Acceptance Scenarios**:

1. **Given** `Work`, `Work/Servers`, `Work/Servers/Linux` and `Workshop`, **When** Work is exported,
   **Then** all items directly assigned to Work and its descendants are included, but Workshop
   and unassigned items are excluded; no search, category or page filter narrows this scope.
2. **Given** a nested folder with actual ancestor records, **When** it is exported,
   **Then** the selected folder, its descendants and existing ancestor structures needed to
   preserve the hierarchy are retained without exporting items from the ancestors or siblings.
3. **Given** an empty selected folder or empty descendant, **When** the branch is exported,
   **Then** the retained branch folder records remain present and an empty branch can be downloaded
   as a valid zero-item vault after an explicit zero-item scope review.
4. **Given** unknown folder/item properties or organization-owned branch items, **When** the
   branch is exported, **Then** retained values and relevant ownership structures survive intact.
5. **Given** a folder target that was removed or changed after opening export review,
   **When** download is attempted, **Then** the stale export is blocked and the user must reopen
   or refresh review; another folder is never substituted silently.
6. **Given** two or more actual folder records with the same full path within the selected
   branch, **When** folder export is requested, **Then** export is blocked with an explanation
   of the ambiguous path; no folder is chosen, combined, renamed or removed automatically.

---

### User Story 4 - Compare and Resolve Possible Duplicates (Priority: P2)

As a vault owner, I want to compare possible duplicates, understand their differences and
decide whether to rename, delete or ignore them rather than opening each candidate separately.

**Why this priority**: Comparison makes existing duplicate detection actionable, but it must
remain advisory and must never choose or merge credentials automatically.

**Independent Test**: Open synthetic groups with identical and differing names, credentials,
notes, URIs, custom fields, types and unknown properties, including repeated/missing IDs.
Verify every candidate and difference, masking, rename/delete confirmations and undo, and
session-only ignore behavior without any exported-data change.

**Acceptance Scenarios**:

1. **Given** a possible duplicate group, **When** its comparison action is activated,
   **Then** all its candidates open in one clear comparison context, with the duplicate rule,
   candidate identities and field-by-field differences; no manual search is needed.
2. **Given** candidates that differ in a stored value, an absent/null/empty value or an extra
   property, **When** compared, **Then** the differing field is identified using text or another
   non-color-only cue; source values are not normalized to hide the difference.
3. **Given** Privacy Mode is on, **When** comparison is opened,
   **Then** protected values remain absent from visible and hidden content and descriptions,
   while non-sensitive difference indicators still help review. Enabling Privacy Mode after
   disclosure immediately removes exposed protected values without modifying the vault.
4. **Given** a candidate and an unapplied draft, **When** rename is initiated,
   **Then** the existing draft guard is respected; cancellation preserves the draft, and an
   applied rename changes only that exact candidate's name and can be undone.
5. **Given** a candidate, **When** deletion is requested,
   **Then** an explicit confirmation identifies the affected candidate and count; cancellation
   changes nothing, and confirmation removes only the intended candidate with existing undo available.
6. **Given** a group, **When** Ignore this group is chosen,
   **Then** only that group for that duplicate rule is hidden from active duplicate review and
   its count updates; working/exported values, validation warnings and document undo history do not change.
7. **Given** ignored groups, **When** they are restored or the working document changes,
   **Then** applicable groups can be reviewed again; sorting, filtering and preference changes
   alone do not forget ignores. Closing or replacing the vault clears the ignore state.
8. **Given** changed or removed candidates while comparison is open, **When** an old action is
   invoked, **Then** it cannot rename/delete a different item or discard a draft; the comparison
   refreshes or closes with an explicit unavailable-target explanation.

### Edge Cases

- Filenames containing separators, control characters, platform-reserved names, trailing dots
  or spaces, only an extension, Unicode text or more than 200 Unicode code points after extension
  handling; omitted or differently cased `.json` extensions.
- A valid Unicode filename may exceed a filesystem's byte limit or be adjusted by the browser/OS.
  No additional byte limit is imposed; displayed/requested name equality is the application guarantee,
  not universal on-disk name equality or successful filesystem saving.
- Selection spanning pages, repeated/missing item IDs, changed selections during export review,
  deleted selected items, undo/redo, replacement imports and source-index shifts.
- Missing/duplicate folder IDs, missing folder references, malformed retained items, and root
  structural problems. Never invent missing records or silently remove malformed selected data.
- Virtual grouping folders, actual ancestors absent from the source, duplicate folder paths,
  empty descendants and similarly prefixed siblings; follow the existing folder-path hierarchy.
- Duplicate full paths within an actual or virtual export branch block folder export. Duplicate
  paths outside the branch do not trigger this branch-ambiguity rule; selected-item export remains
  governed by exact selected membership and resulting-document validation.
- Multiple referenced organizations/collections, missing metadata records, unsupported types
  such as SSH, and unknown root arrays that cannot safely be interpreted as subset membership.
- Malformed organization/collection metadata that prevents safe subset preparation blocks
  selected-item and folder exports; missing metadata remains advisory under existing semantics.
- A subset is not guaranteed to contain only selected-item information: preserved opaque root
  metadata can contain additional data. Scope review must disclose this limitation before download.
- Three or more duplicate candidates, candidates appearing in different duplicate rules,
  identical repeated array entries, missing/null/empty differences, ordered URI/custom-field lists,
  nested unknown properties and values containing literal HTML/script/image/link-like text.
- Very long and mixed-script values; narrow comparison layouts, keyboard-only navigation,
  English/Arabic, light/dark, reduced motion and Privacy Mode changes while comparing.
- All groups ignored, fewer than two candidates after deletion, failed rename/validation,
  cancelled destructive/draft confirmations and original-copy download after any new operation.

## Requirements *(mandatory)*

### Functional Requirements

#### Filename and export review

- **FR-001**: Every modified full, selected-item and folder export MUST offer a localized,
  labelled editable filename before download, with a safe source-derived scope-specific default;
  fallback names MUST be `vault-edited.json`, `vault-selected.json` and `vault-folder.json`.
- **FR-002**: A filename MUST be a basename, never a directory path. Reject empty/extension-only
  names, `/`, `\`, `<`, `>`, `:`, `"`, `|`, `?`, `*`, Unicode control characters, `.`/`..`,
  trailing spaces/dots, and platform-reserved device basenames such as CON, PRN, AUX, NUL,
  COM1–COM9 and LPT1–LPT9, case-insensitively even when followed by an extension. Limit the
  resulting name to 200 Unicode code points. Preserve valid Unicode names. Append `.json`
  when absent, recognize its case-insensitive presence, and show the resulting name before download.
  Invalid user input MUST block download with feedback rather than silently changing it.
  The app MUST NOT impose an additional filename byte limit. It MUST request the displayed valid name
  and explain that browser/OS adjustments and filesystem limits may affect the saved filename.
- **FR-003**: Filename choice MUST affect only the download name, never the exported contents.
  Filename drafts MUST remain in memory and reset when their export review is dismissed or the
  vault is replaced/closed. Original-copy download MUST retain its existing name and exact bytes.
- **FR-004**: Export review MUST identify full/selected/folder scope and item count, explain
  plaintext output and preserved opaque metadata, expose applicable validation results and allow
  cancellation without changing vault data, selection, navigation, draft or document history.

#### Selected and folder scope

- **FR-005**: When one or more items are selected, an accessible Export selected action MUST
  be available. It MUST export exactly the selected source items, including selections across
  pages, independent of visible row order; zero selection MUST not initiate this operation.
- **FR-006**: Folder management/navigation MUST offer an accessible Export folder action for
  an actual folder and existing virtual grouping paths. It MUST include items assigned directly
  to the selected folder and all descendant folders using the existing slash-separated hierarchy.
  Descendants MUST match a whole path-segment boundary, not merely a common name prefix.
  If the selected actual or virtual branch contains multiple actual folder records with the same
  full path, folder export MUST be blocked with a localized ambiguity explanation before download.
  The app MUST NOT choose or combine those folders or modify the loaded vault as a workaround.
  Duplicate paths outside that branch do not trigger this rule; it does not broaden or restrict
  selected-item export beyond its existing membership and validation rules.
- **FR-007**: Folder export MUST retain the selected and descendant folder records, including
  empty folders, and existing ancestor records needed for their path hierarchy. A virtual path
  MUST use existing descendant records only; absent ancestors MUST not be synthesized. Neither
  ancestor items, sibling items nor unassigned items are added unless they actually belong to scope.
- **FR-008**: Selected export MUST retain every folder referenced by its items and any existing
  ancestor records required for their hierarchy. Both subset exports MUST retain available
  referenced organization and collection records, including available organizations referenced
  by retained collections; unrelated records in those understood structural lists MUST be omitted.
  Item ownership and membership references MUST not be rewritten, cleared or reassigned.
- **FR-009**: Subset export MUST preserve all retained item/folder/organization/collection
  properties, IDs, types, metadata, nested values and array order. Retained lists MUST preserve
  source-relative order regardless of sorting/selection order. Unknown root properties MUST
  be preserved unchanged, including opaque structures whose references cannot be interpreted
  safely; no heuristic pruning, normalization or fabricated records is permitted.
- **FR-010**: Every proposed export MUST be validated as the actual resulting document before
  download. Blocking structural errors MUST prevent download; advisory warnings remain visible
  and do not automatically rewrite data. Missing ownership metadata retains existing validation
  semantics and an explicit advisory when necessary, without fabricated records or compatibility claims.
  Selected-item and folder export MUST be blocked with an explanation when malformed organization
  or collection metadata cannot be safely narrowed. Such metadata MUST NOT be silently dropped,
  coerced or retained wholesale as a workaround; the loaded vault MUST remain unchanged.
- **FR-011**: Full exports MUST retain the full source structure; subset exports may change
  only membership of the understood item/folder/organization/collection lists as defined above.
  Output MUST retain the unencrypted Bitwarden/Vaultwarden JSON vault format, not become a raw
  item array. Compatibility evidence MUST cover supported personal and ownership-bearing fixtures;
  unsupported or unverified import behavior MUST be documented rather than promised.
- **FR-012**: Export preparation, validation, filename changes, cancellation and download MUST
  never mutate the working document, original bytes, unapplied drafts, selection or undo history.
  Existing draft/export guards MUST be preserved; unapplied edits MUST not be exported silently.
- **FR-013**: Scope and candidates MUST be reviewed against the current document. Changes to
  the working document or relevant selection invalidate an open export review before download;
  the user MUST refresh/reopen it. Repeated/missing IDs and shifted positions MUST never substitute
  different items. Invalid requests MUST be rejected before any draft-discard prompt.

#### Duplicate comparison and explicit resolution

- **FR-014**: Activating a duplicate group MUST open a comparison of all current candidates,
  with the existing matching rule and candidate identities. Existing detection rules MUST remain
  advisory; this feature adds no automatic merge, survivor choice or credential modification.
- **FR-015**: Comparison MUST cover names/types, folder/ownership metadata, notes/dates,
  applicable type-specific fields, URIs, custom fields and unknown properties. It MUST distinguish
  absent, null, empty, equal and different stored values, including nested properties and ordered
  arrays. Difference cues MUST not rely on color alone. Object property ordering alone MUST not
  be treated as a value difference; no credential/URI normalization may hide stored differences.
- **FR-016**: Comparison MUST obey existing Privacy Mode protections for credentials, notes,
  private SSH/type-specific/custom values and potentially sensitive unknown data. Protected values
  MUST be absent from visible/hidden text, form values, attributes and accessible descriptions
  while masked. A field may be marked different without disclosing its values, length or fragments;
  protected labels MUST not leak sensitive imported data. Imported content MUST remain literal.
- **FR-017**: Comparison MUST provide explicit per-candidate Rename and Delete actions and
  an Ignore this group action. Rename MUST change only the chosen item's name through existing
  validated editing/undo behavior. Delete MUST confirm the exact candidate/count and retain undo.
  Cancelling either operation or its draft guard MUST preserve existing data and navigation state.
- **FR-018**: Ignore MUST affect only in-memory duplicate-review state for the exact group and
  matching rule, never exported data, validation warnings or document undo history. Users MUST
  be able to restore ignored groups. Ignore state MUST survive view/sort/filter/language/theme
  changes but clear on any committed document change, undo/redo, replacement or close, preventing
  stale membership from hiding new groups. This lifetime MUST be explained in localized help.
- **FR-019**: After rename/delete/undo/redo, duplicate results/counts and comparison membership
  MUST refresh. A group with fewer than two remaining matching candidates MUST no longer be
  presented as actionable. Old candidate actions MUST be rejected without changing another
  item, losing a draft or reviving previously ignored targets.

#### Cross-cutting boundaries

- **FR-020**: New actions, forms, validation, comparisons and help MUST support English/LTR,
  Arabic/RTL, both themes, keyboard access, visible focus, non-color status cues, WCAG AA text
  contrast and reduced motion, while preserving the Azure identity, branding and bundled fonts.
  At widths 320/768/1280/1440 and 200% zoom, all comparison/export actions and long content MUST
  remain reachable without horizontal page overflow; bounded comparison/table scrolling is allowed.
- **FR-021**: All processing MUST remain local and work offline after local assets load.
  Vaults, export/filename drafts, comparisons, ignore state and history MUST remain in memory;
  no new browser storage, backend, telemetry, logs of vault content or runtime external assets/
  requests are allowed. Only the already approved language/theme preferences may persist;
  existing network restrictions MUST remain unchanged.
- **FR-022**: Synthetic regression fixtures MUST verify filenames, exact subset membership,
  metadata preservation, resulting-document validation, source non-mutation, unchanged original
  bytes/history, stale targets, Privacy Mode, confirmation/cancellation and reversible resolution.
  Existing full-export, import, editing, folders, bulk selection, warnings and undo behaviors
  MUST remain intact; test or documentation evidence MUST never use real vault secrets.

### Key Entities *(include if feature involves data)*

- **Export scope**: Full vault, exact selected items or a folder branch; includes reviewed item
  count and the current source context, not only what is visible on the current page.
- **Export document**: A separately prepared unencrypted vault containing the chosen items,
  required understood structures and unchanged opaque root metadata; validated before download.
- **Export filename**: A transient user-chosen safe basename and its displayed `.json` extension;
  independent of document values and the original backup name.
- **Folder branch**: An actual folder or virtual path, its segment-boundary descendants and
  existing retained ancestor structures; source folder IDs continue to assign items.
- **Duplicate group**: Candidates matching one existing rule in the current working vault;
  candidate identity is independent of imported IDs and list sorting.
- **Comparison field**: A stored field/property across candidates, with presence/equality/
  difference status and privacy-dependent value display.
- **Ignored group**: An in-memory review dismissal for one group/rule in an unchanged document;
  does not annotate items, alter validation or become exported data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In all valid-name scenarios, the displayed filename matches the name requested
  by the app for download, without an additional byte-limit restriction;
  in all invalid-name scenarios download is blocked with actionable feedback. Changing only the
  filename produces identical export contents in 100% of preservation checks. Browser/OS saved-name
  adjustments and filesystem save limitations are documented, not treated as app-controlled guarantees.
- **SC-002**: Selected exports contain 100% of selected items and zero unselected items;
  folder exports contain 100% of direct/descendant items and zero unrelated items, including
  across pages and active filters, in all synthetic membership scenarios.
  Every actual/virtual folder-export fixture containing duplicate full paths within the selected
  branch blocks download with an ambiguity explanation and leaves the loaded document unchanged.
- **SC-003**: Every valid subset fixture passes resulting-document validation with required
  available structural records present. All retained known/unknown values and source-relative
  list order match the source; all invalid-result fixtures block download without silent repairs.
  Every fixture with malformed ownership metadata that prevents safe narrowing blocks selected-item
  and folder download with an explanation, without modifying the loaded document.
- **SC-004**: In 100% of new export/cancel/ignore scenarios, loaded values, original backup
  bytes and document history remain unchanged. Confirmed rename/delete changes only the
  requested candidate/name or membership, and undo restores the prior document exactly.
- **SC-005**: One group activation opens every candidate in that group. All seeded stored
  differences in the comparison fixtures receive non-color-only indicators, and every protected
  value is absent from masked content/descriptions before and after toggling Privacy Mode.
- **SC-006**: In all ignore/restore/reset scenarios, active review counts reflect the exact
  group/rule state while exported data and validation remain unchanged. Every seeded stale
  export/candidate action is rejected without targeting a new occupant or losing a draft.
- **SC-007**: Every new export and comparison action can be completed with keyboard only in
  all four language/theme combinations, at the specified widths and 200% zoom, without losing
  access to actions or long values; eligible text meets AA contrast requirements.
- **SC-008**: After local assets load, full/selected/folder export and duplicate resolution work
  offline, with zero automatic external requests and no saved export/comparison/ignore state.
- **SC-009**: With a 10,000-item synthetic vault and a group of at least 100 candidates,
  selected/folder export review and candidate comparison remain operable to completion, do not
  omit candidates or scope members, and do not lose drafts or require a page reload. Record
  observed interaction completion times and exclusions without inventing a fixed speed guarantee.

## Assumptions

- This specification introduces new workflows, not an implementation, and does not imply that
  the preceding usability feature has passed its remaining performance or participant gates.
- The existing unencrypted vault format, duplicate rules, folder-path hierarchy, validation,
  draft guards, original-copy download and undo are the baseline behaviors to preserve.
- Subset export is a deliberate partial copy, not a data-sanitization or anonymization tool.
  Unknown root values remain opaque and intact even when they contain information outside the
  selected scope. Understood structural lists are reduced only by the specified membership rules.
- Organization/collection metadata is preserved when available; preserving it does not promise
  that every Bitwarden/Vaultwarden import route accepts organization-owned exports. Planning
  must identify supported import routes and record verified fixtures/limitations before claiming compatibility.
- Folder ancestry is represented by the existing slash-separated names, not a new hierarchy
  model. Real records are preserved; virtual or missing ancestors are not fabricated.
  Folder export does not guess membership when its branch contains duplicate full paths;
  those requests are blocked without automatic repair.
- Filename input accepts a complete basename. Safe defaults may remove invalid source-name
  characters; user-edited invalid names receive feedback rather than silent sanitization.
  The 200-code-point rule is not a universal filesystem limit; browser/OS filename adjustments
  are outside app control, and no additional byte limit is introduced.
- Duplicate comparison is an alternative clear layout, not a requirement for a particular
  modal or side-by-side arrangement; large groups must not be limited to the first two items.
- Ignore is deliberately review-only, reversible and scoped to an unchanged working document.
  Clearing it on any document change avoids persisting derived identifiers or hiding new results.
- No credential merge, automatic deletion, encrypted export, remote import testing, new saved
  preference or private-reporting workflow is introduced. Tests, screenshots and examples use
  synthetic data only, and compatibility evidence uses local fixtures/import environments.
