# Research: Refine Vaultsort Usability

**Date**: 2026-10-04 | **Scope**: Phase 0 design research; no application changes or acceptance claims.

Research covered current source, accessibility/native-browser guidance, and the upstream SSH
type. Two read-only research agents traced domain/navigation and presentation/preferences.
All implementation choices below are resolved. Initial runtime reproduction and baseline
measurements were subsequently captured in [baseline.md](baseline.md) during planning;
post-implementation verification remains pending.

## 1. Keep the incumbent stack and visual authority

- **Decision**: Retain Vue refs/computed state, the existing domain module and composable,
  vue-i18n, bundled Inter/logo, and `src/style.css` semantic tokens. No new dependency.
- **Rationale**: `package.json`, `AGENTS.md`, and `docs/design-system.md` already define a coherent
  frontend. The requested changes do not require a new store, component library, or visual world.
- **Alternatives considered**: A UI-library migration, new design documentation system, remote
  fonts, or rewritten app shell would add scope and duplicate working conventions.

## 2. Compact labelled disclosure forms

- **Decision**: Keep search visible; use Filters, Sort, and Fields buttons to disclose native
  form controls in one bounded inline area. Keep at most one control panel open. The collapsed
  Sort control includes its key/direction; Filters shows the number of explicit active filters.
- **Rationale**: `src/App.vue:379–391` already has this form/disclosure pattern. At narrow sizes,
  `src/style.css:509` currently removes the Filters text; retain labels instead. Search plus a
  wrapped compact action row fits SC-005 without permanently displaying every select.
- **Alternatives considered**: Always-expanded controls consume rows. ARIA menus require
  unnecessary arrow-key conventions for ordinary forms. General-purpose popovers are not
  needed for these choices; native `<details>` remains suitable for static import guidance.
- **Clarified semantics**: Count folder/type/ownership/inspection filter values; navigation
  categories and search have their own visible state. Clear filters resets those four values,
  not navigation, search, sort, or field choices. Preserve existing selection/page watchers.

## 3. Independent fields and safe notes

- **Decision**: Replace `showDates` with three boolean choices, initially false. Use `text()`
  for imported notes, treating blank/non-text content as unavailable. Preview only visible
  rows; collapse whitespace for display and cap the preview at 100 Unicode code points including
  its ellipsis. Preserve the original full text and line breaks for inspection.
- **Rationale**: `src/App.vue:37,383,400,415–416` couples both dates. Existing text guards and
  pagination already solve malformed input and bounded rendering without coercion or caching.
- **Alternatives considered**: Saved column preferences contradict this feature's session-only
  scope. Sanitized HTML, Markdown rendering, and automatic linkification create unnecessary
  imported-content execution/network risks. Pre-rendering full notes in every row leaks hidden
  content and increases DOM cost.

## 4. One native full-note inspector with existing fallback

- **Decision**: Use one `NoteInspector.vue`, mounted only for an explicitly opened readable note.
  Prefer a feature-detected native `popover="auto"`; use `Modal.vue` if the API is unavailable.
  Bound its width/height to the viewport; centre it without depending on CSS anchor positioning.
  Render text through interpolation, never `v-html`. No entrance/exit animation is needed.
- **Rationale**: Native popovers use the top layer and support outside/Escape dismissal. Existing
  dialog code supplies the fallback. Popover support is independent of anchor-positioning support.
  Mounting only an active, privacy-allowed note prevents hidden full-text leakage.
- **Alternatives considered**: Hover-only full notes exclude touch/keyboard users. Expanding
  table rows reduces density. A positioning library or universal overlay manager is excessive.
- **Lifecycle**: Store only index/revision/trigger, derive text from the live document. Close
  and unmount on privacy enablement, hidden Notes, removed trigger, document replacement, or reset.
  Synchronize native dismissal with Vue state. Return focus for Close/Escape; outside activation
  keeps its destination focus. A disconnected trigger falls back to the Fields or list control.
- **Shortcut interaction**: `src/App.vue:327` currently closes the editor on Escape. Dismiss the
  innermost tooltip/detail/control panel first and consume that Escape, without an editor reset.

## 5. Accessible action help, not title-only hints

- **Decision**: A small reusable `Tooltip.vue` supplies static localized action help on hover
  and keyboard focus, `role="tooltip"`, and `aria-describedby`. Keep the trigger's accessible
  name. Tooltips are non-interactive, hoverable, persistent while relevant, and Escape-dismissible.
- **Rationale**: `title` alone is not a dependable keyboard/touch explanation. Shared behavior
  avoids caller-specific focus/dismissal bugs; no vault values belong in action-help content.
- **Alternatives considered**: CSS pseudo-content alone cannot implement complete dismissal and
  assistive semantics. Rich popovers for every icon increase friction. A third-party tooltip
  library is unnecessary. Use viewport-clamped placement; keep modal help in its owning dialog's
  accessible context rather than teleporting it into inert background content.
- **Disabled/touch actions**: Retain disabled semantics; use adjacent explanatory text or a
  focusable descriptive wrapper when necessary. No essential instruction may be hover-only.

## 6. Extend validation metadata, keep source indices

- **Decision**: Keep `Issue.severity`, message keys, `itemIndex`, and `folderIndex`; add a small
  optional typed field hint and URI entry index at the validation rule. Stamp UI requests with
  an App-local monotonic document revision. Reuse source indices; do not create item UUIDs.
- **Rationale**: `src/domain/vault.ts:235–264` lacks field intent. Source indices already survive
  sorting/filtering and duplicate/missing imported IDs. Commits clone documents and deletion
  shifts indices (`src/composables/useVault.ts:31–55`, `src/domain/vault.ts:186–189`), so a stale
  index requires a revision guard. Undo must not reactivate old requests.
- **Alternatives considered**: Message-text inference is fragile and localized. Persistent IDs,
  hashes or cross-snapshot remapping are unnecessary. Replacing the entire Issue shape with a
  new scope hierarchy is larger than extending the established indices and testing invariants.
- **Scope invariant**: An issue has at most one item/folder index; neither means document-level.
  Field hints apply only to item issues and never contain imported sensitive values.

## 7. One guarded issue-navigation transaction

- **Decision**: One App handler serves table, validation review, and export issue actions.
  Reject stale requests first, confirm draft discard before any UI mutation, then open the
  exact item and issue context. Pass the same validation bundle to ReviewPanel instead of
  recomputing it. Keep duplicate-candidate selection separate from field-targeted issue events.
- **Rationale**: `src/App.vue:419` changes view before `selectItem`; `:486` closes export before
  selection. `ReviewPanel.vue:31` emits only an index. Cancellation can therefore lose context,
  and same-item selection returns too early to focus a new issue. Opening the editor already
  reads the full item array (`App.vue:88,432`), so clearing filters/pages is unnecessary.
- **Alternatives considered**: Three local fixes would retain sibling inconsistencies. Changing
  bulk scope, auto-revealing secrets, adding fields, or automatically entering Raw JSON is unsafe.
- **Focus mapping**: Folder → folder select; username/password/TOTP → existing readonly or
  editable control; URI → affected input or existing Add button; malformed login → credentials
  context; ownership → expanded metadata summary; duplicates/unsupported → item issue context.
  Wait for dialog removal/editor mount, recheck revision, then focus without page scrolling.

## 8. Recognize SSH consistently, without new editors

- **Decision**: Recognize numeric type 5 as SSH through one small known-type descriptor list
  used by labels, navigation/filter options, known-versus-other checks, and existing icon choice.
  Show SSH when present; retain an accurately labelled zero-result category if it is still active
  after deletion. Recognized SSH does not receive the generic unknown-type advisory.
- **Rationale**: The upstream enum defines `SshKey: 5`. Current independent type-1–4 lists
  in `App.vue:60–64,95–97,387` and `vault.ts:44,252` disagree with that export type. Generic
  preservation and Raw JSON already retain opaque SSH fields, as they do for cards/identities.
- **Alternatives considered**: Adding only a sidebar link leaves filtering and warnings broken.
  A new SSH editor or recognition of upstream types 6–8 exceeds the feature. Do not coerce a
  malformed string `"5"` into a valid imported numeric type or normalize its data.

## 9. Reuse preferences; fix presentation and isolated failures

- **Decision**: Keep native language/theme selects bound to existing reactive state, setters,
  root attributes, and blocking head bootstrap. Align their sizing, selected values, accessible
  names, and state styles. Read/validate each stored preference independently so a per-key
  failure cannot discard the other valid choice. Preserve all drafts and session-only fields.
- **Rationale**: `src/preferences.ts:8–27` already validates writes and synchronously applies
  root state. `public/preferences.js:5–10` reads both values before validating either in one try.
  Existing Intl formatting already responds to locale; no second preference source is needed.
- **Alternatives considered**: A settings store, custom select library, extra saved UI state,
  or new theme mode would change architecture or product behavior unnecessarily.

## 10. Scroll ownership and boundaries

- **Decision**: Establish a positioning context on `.editor-scroll` so the absolute-positioned
  hidden Notes label stays within that scroll region. Preserve the accessible label and existing
  footer sizing. Measure viewport, document, workspace, table, editor scroll region and footers
  across the complete acceptance matrix; apply other constraints only for demonstrated defects.
- **Rationale**: Static pressure points are `style.css:180–203` (fixed shell), `:239–261`
  (control/table minimums), `:262–287` (nowrap wider privacy-off table), and `:294–344` (editor).
  `:525–541` intentionally permits phone page scrolling. The subsequent real-browser diagnosis
  in [baseline.md](baseline.md) demonstrated that `ItemEditor.vue:122`'s hidden label has BODY as
  its containing block while `.editor-scroll` is static. A temporary `position: relative` there
  restored desktop page bounds in all four locale/theme combinations; removing it restored
  overflow. This was an in-browser experiment only, not an application edit or full acceptance.
- **Alternatives considered**: Global body clipping hides inaccessible actions; changing only
  one screenshot's height or forcing the whole app to page-scroll breaks the desktop workflow.
  Additional flex sizing changes are unnecessary for the proven hidden-label bug unless a
  separate content/breakpoint regression demonstrates their need.

## 11. Fixed GitHub anchors and contextual security guidance

- **Decision**: Plain fixed anchors use `target="_blank"`, `rel="noopener noreferrer"`, and
  localized new-tab identification. Separate the repository tagline from the home anchor.
  Relocate Original copy to a persistent toolbar action; keep plaintext guidance at import,
  summary, and every export state, with hosted trust guidance accessible at import.
- **Rationale**: `App.vue:344` nests the tagline inside home; `:362` couples backup access with
  the banner; `:375` has the replaceable footer. `:487` currently makes plaintext export wording
  conditional on error state. `index.html:6–9` already protects referrer/CSP/bootstrap boundaries.
- **Alternatives considered**: Embedded issue reporting, prefetching, remote icons, host detection,
  or a new persisted warning-dismissal flag are unneeded. Do not hide all requested links at
  small breakpoints merely because their former containers were hidden.

## 12. Comparative verification, not speculative scaling

- **Decision**: Record the current revision/build, browser/device, deterministic synthetic
  dataset, operations, and five-run medians before source edits. Repeat identically afterward.
  Compare filtering, sorts, and both dates shown/hidden together with their existing equivalents;
  record new independent/Notes operations without pretending they existed in the old UI.
- **Rationale**: The accepted clarifications require 10,000 items and no slowdown, not an
  absolute time limit. Current 75-row pagination and cached computed state bound presentation.
- **Alternatives considered**: Timing jsdom as browser paint, fabricated historical results,
  unsolicited workers/virtualization, or performance telemetry would misrepresent evidence.
  Retain linear search/full snapshots; only tune a measured regression at its shared source.
- **Recorded evidence**: [baseline.md](baseline.md) now contains all eleven old-interface
  operations' five-run samples, dataset/build/environment hashes, and scoped layout evidence.
  New Notes timings and comparative post-change acceptance remain pending.

## References

Consulted for design on 2026-10-04; these are research links, not runtime dependencies.

- [MDN: Using the Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using)
- [WCAG: Content on Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)
- [APG tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)
  (the pattern is marked work in progress; WCAG behavior remains the acceptance authority).
- [Bitwarden cipher types](https://github.com/bitwarden/clients/blob/main/libs/common/src/vault/enums/cipher-type.ts)
- [Canonical design system](../../docs/design-system.md)
- [Constitution](../../.specify/memory/constitution.md)
