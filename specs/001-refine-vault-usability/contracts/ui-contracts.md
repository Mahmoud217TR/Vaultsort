# UI Contracts: Refine Vaultsort Usability

These contracts describe the browser application's user interface and its existing component
boundaries. They are design requirements, not implemented endpoints or a new public API.
Read with [data-model.md](../data-model.md) and [quickstart.md](../quickstart.md).
All strings, accessible names, confirmations, help and notices use synchronized English/Arabic
localization keys. Imported values remain literal and are never translated.

## UI-01 — Compact list controls and view-only fields

**Owner**: `src/App.vue`; existing native forms and source-index rows.

- Search remains visible. Filters, Sort and Fields have visible localized labels at every width.
  Their buttons expose `aria-expanded` and `aria-controls`; a collapsed Sort also identifies
  its current key/direction. Active filters have a numeric/text indicator, not color alone.
- Each button toggles its inline form panel; opening another closes the old one. Tab navigates
  native controls; do not apply ARIA menu arrow-key behavior. Escape closes the current panel
  and restores its button focus before any editor-close handler runs. Outside activation
  dismisses the panel without stealing focus or discarding a draft.
- Filters retain folder, item type, ownership and inspection choices. Clear filters resets
  these values and their existing selection/pagination effects only. It leaves category,
  search, sort, optional fields and editor draft unchanged. Their independent states remain visible.
- Sort retains original/name/created/modified and ASC/DESC. Original order remains the default.
  Alphabetical comparison uses the chosen locale; missing/invalid dates remain last in either
  direction; ties retain original order. Sorting never reorders exported arrays.
- Fields contains exactly three ordinary independently checked checkboxes: Notes, Date created,
  Last modified. One field can be enabled in at most three activations from the normal list.
  All start hidden, reset on close/replacement, and survive theme/language changes.
- Table headers/cell structure and empty-state column spans match enabled columns. Dates use
  local time zone and the active locale, with a dash for unavailable values. Do not invent metadata.

**Checks**: FR-002–010; SC-002, SC-005, SC-008, SC-011–012.

## UI-02 — Privacy-aware note inspection

**Owner**: App row preview plus one planned `NoteInspector.vue`.

**Input boundary**: Current revision/source index, current literal note text derived only while
privacy is off and Notes is enabled, localized title/chrome, and invoker reference.
**Output boundary**: Dismissal closes App's target state; it never saves or edits a note.

- Non-blank text gets one line of preview, at most 100 Unicode code points including ellipsis.
  Whitespace collapsing is presentation-only. Blank, missing and non-text notes get a neutral dash.
  A named button affords full-note opening via click, Enter/Space, or touch; hovering alone
  does not expose complete sensitive notes. No complete note is duplicated in a title/description.
- Privacy Mode on replaces note content with a non-sensitive mask and makes inspection unavailable.
  No full/preview note text is mounted, even in hidden elements or accessible attributes.
- A current readable note opens a viewport-bounded scrollable native `popover="auto"` when
  supported; otherwise the existing native dialog provides the same literal-text inspection.
  Set an accessible title, focus the inspector's Close control, and preserve readable line breaks.
  The popover is non-modal; the dialog fallback retains its native focus containment.
- Close/Escape dismiss the innermost inspector and restore the connected invoker. Native outside
  dismissal clears Vue target state but keeps the activated destination focus. If the invoker
  disappears, use the Fields or list control as a connected fallback. No dismissal discards a draft.
- Privacy enablement, hidden Notes, changed document/revision, removed row trigger, or reset
  closes and unmounts exposed detail. A declined existing privacy/draft confirmation means
  privacy has not changed; once enablement is accepted, removal occurs in the resulting render.
- Display markup, script-like text, links and image syntax literally. No HTML/Markdown renderer,
  automatic link loading, remote image, or imported action exists. Full text is not truncated.

**Checks**: FR-006–009, FR-024–026; SC-006, SC-008, SC-011.

## UI-03 — Contextual warning activation

**Owner**: Domain validation hints → App's shared guarded navigation → ItemEditor focus/context.

| Boundary | Payload / behavior |
| --- | --- |
| `validateVault()` result | Existing Issue list plus optional typed `field`/`entryIndex`; messages remain keys |
| App validation bundle | One revision plus Issue list shared with review and export |
| ReviewPanel input | Existing document plus current validation bundle; do not independently generate item-warning targets |
| ReviewPanel issue output | `inspectIssue` with the captured revision and complete Issue, not just item index |
| ReviewPanel duplicate output | Existing `select(index)` for duplicate candidates; remains distinct from issue navigation |
| Table/export actions | Route the same revision-stamped Issue request to the shared handler |
| ItemEditor input | Accepted current Issue context/focus request alongside existing item/index/document/privacy props |
| ItemEditor output | Existing save/close/dirty/notice events remain; focus does not save or change values |

- A general row warning chooses the first actionable current item issue in validation order.
  Its item context exposes remaining issues with named actions, rather than dropping them.
- Validate request revision and index before any navigation or discard prompt. Stale targets
  produce a localized unavailable-target notice and cannot open the new occupant of that index.
  Undo/redo refresh results; they do not revive old requests.
- Respect the existing draft-discard guard before changing view, item, editor version, modal,
  page or selection. Cancellation leaves all of them and the draft unchanged. Same-item issue
  activation still updates focus/context without needlessly resetting a draft.
- On acceptance, use the source index from the full working array, not filtered page position
  or imported ID. Open the item even outside active filters/page; do not clear those states.
  Close an originating export dialog before moving focus, then recheck revision after rendering.
- Existing accessible fields receive focus and scroll into their owning editor region. For a
  hidden metadata section, open it before focusing. Privacy-protected inputs stay readonly/masked;
  do not toggle Privacy Mode, reveal secrets, or switch automatically to protected Raw JSON.
- Missing/unsupported controls use item-specific explanation and a focusable issue heading.
  No new credential editor/control is invented. Folder-only/document issues retain their existing
  contextual explanation/folder-review path, with no fabricated item action.

**Checks**: FR-011–012, FR-024–026; SC-003, SC-008; duplicate/missing IDs, stale deletion/undo,
same-item issues, export guards, and cancelled draft navigation need automated regression coverage.

## UI-04 — SSH discovery and unsupported-data boundary

**Owner**: Existing domain helpers and App navigation/type filters.

- Numeric type 5 is SSH, labelled consistently in rows, category and filter choices; reuse the
  existing key icon. Show it when imported/working SSH items exist and give an accurate count.
- Navigation and type filtering each select only SSH items and combine with existing filters.
  Unknown/Other must exclude all known types, including SSH. Do not coerce string or malformed types.
- After deletion/undo, recompute counts and availability; an active emptied SSH category may
  remain explicitly labelled zero, or a no-longer-applicable option can return to All. Never
  silently display other types under an SSH heading. The planned default is retained zero state.
- Recognized SSH no longer receives the generic unknown-type advisory. No SSH field validation,
  key transformation, new specialized editor or newly recognized other type is introduced.
  Generic editing and existing privacy-gated Raw JSON remain unchanged; unknown SSH data survives.

**Checks**: FR-013, FR-026; SC-009.

## UI-05 — Workspace layout, action help and focus

**Owner**: Shared `src/style.css`, existing panels/dialogs, planned `Tooltip.vue`.

- At 1280 × 800 and 1440 × 900, privacy-off/editor-open must not add page-level horizontal
  or vertical overflow. Table content may scroll horizontally/vertically; editor body scrolls
  independently and Apply, Reset and Close remain reachable. Pagination stays reachable.
- At widths 320/768/1024/1280/1440, no horizontal page overflow or overlapping controls occurs,
  including all fields, long mixed-script content, expanded controls, and all locale/theme pairs.
  Narrow layouts may intentionally page-scroll vertically; compact editor closing returns
  to its connected row trigger or logical fallback. At 200% zoom no action/content is lost.
- At 1280 × 800 with at least 75 rows, eight complete default rows are visible; collapsed
  list controls occupy at most 112 pixels excluding heading/table header. Open controls use a
  bounded scrolling region rather than consuming every row on short desktop windows.
- Reuse semantic tokens, logical properties, local Inter and supplied logo geometry/color.
  Keep technical JSON/URIs/shortcuts LTR, isolate imported names, and mirror only directional icons.
- Tooltips explain every changed icon-only/ambiguous control on hover and focus. Static help
  has a stable description association, `role="tooltip"`, no interactive children or vault values,
  and supports hover persistence and Escape dismissal. Disabled actions remain disabled and
  have reachable explanation; essential instructions cannot depend on hover-only interaction.
- Tooltip, inspector and disclosure Escape handling precedes editor-close behavior. Dialog
  tooltips stay in the accessible dialog context. No unnecessary motion is added; any changed
  transitions obey reduced motion. Focus, text contrast and all control states remain visible.

**Checks**: FR-001, FR-014–015, FR-018, FR-024; SC-004–006.

## UI-06 — Consistent independent display preferences

**Owner**: Existing head bootstrap, `public/preferences.js`, `src/preferences.ts`, header selects.

- Language/theme visible selections, accessible names, root `lang`/`dir`/theme and actual
  appearance agree on import/workspace and update immediately through existing setters.
- Validate each preference independently before the first usable screen: language defaults to
  English and theme to the OS preference. One invalid value or failed per-key read cannot erase
  the other valid value; completely blocked storage uses both defaults.
- Failed persistence does not prevent active-session changes. Only the two approved keys are
  read/written by their existing modules. Keep the blocking script before styles and CSP intact.
- Theme/language changes preserve document, draft, current item, selection, history, privacy
  and fields. Locale chrome/dates/counts/reading direction update without translating imported data.

**Checks**: FR-016–017, FR-024–025; SC-007; extend the existing restoration/i18n checks.

## UI-07 — Security boundaries and explicit project navigation

**Owner**: Import/workspace chrome and existing summary/export dialogs.

| Link | Fixed destination | Placement |
| --- | --- | --- |
| Vaultsort GitHub repository | `https://github.com/Mahmoud217TR/Vaultsort` | Workspace footer, replacing memory-only text |
| Local vault editor tagline | Same repository URL | Independent anchor next to logo/name home control |
| Having an issue? | `https://github.com/Mahmoud217TR/Vaultsort/issues` | Import and workspace, visible but unobtrusive |

- Every anchor is keyboard reachable, identifies new-tab behavior through localized accessible
  text, and uses `target="_blank"` plus `rel="noopener noreferrer"`. Keep logo/name's existing
  home action, avoid nested anchors, and keep links accessible on narrow layouts.
- Destinations never contain query strings or data-derived values. No automatic request,
  prefetch, embedded reporter, remote icon or external font is added. Explicit link activation
  alone permits browser navigation; it does not close the active vault or discard a draft.
- Remove only the permanent yellow workspace banner. Keep original-copy download discoverable
  in the toolbar and preserve byte-for-byte downloads. Plaintext/local-processing guidance
  remains at import, summary and export, including exports blocked by errors. Import exposes
  hosted-build trust limits without host detection or a saved dismissal flag.
- Offline editing/export still work. Do not equate visual privacy with encryption or closed
  references with secure erasure; GitHub availability is not a prerequisite to editing.

**Checks**: FR-019–023, FR-025–026; SC-010, SC-008.
