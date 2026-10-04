# UI and Domain Contracts: Expand Export and Duplicate Review

**Spec**: [spec.md](../spec.md) | **Model**: [data-model.md](../data-model.md)

Vaultsort has no backend or external API. These contracts describe its user-facing workflows
and planned local component/domain boundaries, not a network service or new public SDK.

## EX-01 — Filename and reviewed download

**Owner**: App's existing export Modal and local download helper.
**Requirements**: FR-001–004, FR-010–013, FR-020–022; SC-001/003/004/007/008.

- Full toolbar export, Export selected and Export folder use one export review. Identify scope,
  item count, plaintext output, preserved opaque-root metadata and applicable compatibility advisories.
- A labelled native text input starts with the source-derived scope default, fallback
  `vault-edited.json`, `vault-selected.json` or `vault-folder.json`. Show the resolved final
  name, including appended `.json`, before download. Error text is associated with its input.
- The pure filename resolver returns a valid final basename or an error message key. It validates
  raw text first, does not silently trim/sanitize user text, preserves valid Unicode and rejects
  spec punctuation/control/path/reserved cases, bidi embedding/isolate controls and lone surrogates.
  Enforce 200 code points after suffix resolution; no HTML `maxlength` code-unit substitute
  and no additional UTF-8 byte limit. The app-requested name equals the displayed resolved name.
- The download button is disabled for invalid filename, stale review, preparation failure,
  pending draft or resulting structural errors. Advisory warnings remain readable and do not
  automatically repair or prohibit a structurally valid preservation export.
- Existing `requestExport()` draft/folder-dialog blocking is shared by all entry points, without
  invoking `discardDraft()`. Recheck at download even if native-modal inertness normally prevents
  concurrent edits. Invalid captured targets are rejected before any draft prompt.
- Cancellation releases export-only state. Filename edits never rebuild or alter the prepared
  document. Original copy retains the current byte-exact download and original-derived name.
- A successful subset download must not call `markExported()`. Full export keeps existing
  successful-download baseline behavior; download failure does not update that baseline.
- The app suggests a filename, not an OS write path: record browser/OS filename adjustments and
  filesystem limitations rather than promise universal on-disk equality or collision behavior.

## EX-02 — Pure preparation, selection and folder closure

**Owner**: Planned `prepareVaultExport` boundary in `src/domain/vault.ts`, App's captured scope.
**Requirements**: FR-005–013; SC-002–004/009.

| Boundary | Input | Output / invariant |
| --- | --- | --- |
| Domain preparation | Valid working document and full/selected/folder membership | Separate document, item/folder source maps, safe diagnostic keys |
| App review opening | Revision-bound scope and current trigger | Validated snapshot with exact scope count, or safe rejection |
| App download | Fresh review, valid displayed filename, no blocking result errors | Serialize prepared document only; no source/history mutation |

- Selected action is available only with nonzero selection. Include every actually selected
  source index across pages, never visible positions or imported IDs; source order wins.
- Folder actions are discoverable beside existing manager/navigation actions for actual and
  virtual branches. Use exact path or `path + '/'` descendants, not prefix matches. Include all
  direct/descendant items even when hidden by filters; exclude unassigned/ancestor/sibling items.
- Before preparing a folder result, count exact full-path names among actual records within that
  branch. Duplicate root/descendant paths block the request with a localized ambiguity explanation,
  regardless of IDs or item count; do not choose, combine, rename or remove records. Virtual
  grouping rows do not count as actual duplicates. Check before adding ancestor metadata, so
  duplicate ancestors/siblings/outside-branch paths do not activate this guard. Selected-item
  export remains exact-membership plus normal resulting validation, not subject to this guard.
- Preserve empty branch records and existing ancestors, but do not fabricate virtual ancestors.
  Duplicate structural IDs remain data for resulting validation, not an invitation to select one.
  Literal case/whitespace/slash semantics are preserved. An actual empty-string folder name has
  direct-item scope only; duplicate raw empty-string names block it. Nontext names are structural
  errors, not inferred empty paths. Existing ancestors are retained in source order without items.
- Retain available directly referenced collections/organizations and organizations referenced
  by retained collections. Do not add unrelated collections based merely on shared ownership.
- Preserve every retained record's unknown properties/values, root opaque metadata and
  source-relative list order. Add no absent structural arrays and remove no present array merely
  because its retained membership is empty. Full output is an unchanged structural clone.
- Block unsafe interpretation of malformed present ownership metadata; do not coerce/drop it.
  Both subset operations explain this preparation failure; retaining malformed metadata wholesale
  is not an allowed workaround. Loaded values/original bytes/history remain unchanged.
  Missing referenced records remain advisory and unchanged. There is no lossy ownership conversion.
- Prepared JSON is validated using root parsing and actual-result validation. Unrelated errors
  in excluded known items/folders are not copied blindly into the result's error list.
- Review invalidates on source revision or relevant selected-membership change. Users must
  reopen/refresh it; download never silently adopts newly selected items or a different folder.

## EX-03 — Subset validation and issue destinations

**Owner**: Domain source maps → App current validation bundle → existing `inspectIssue()`.
**Requirements**: FR-010/012/013/022; SC-003/004/006.

- Keep exported-item numbering distinct from source item numbering in localized explanatory text.
- Map result item/folder indexes through the prepared source maps. For actionable item warnings,
  resolve an equivalent current source Issue and capture its revision before calling the shared
  handler. Never send an exported local index or a foreign Issue object to source navigation.
- New root/preparation/compatibility diagnostics explain the result but have no fake item link.
- Accepted source navigation removes the export dialog before editor field focus. Existing
  privacy guards, masked fields, unavailable contexts and same-item draft preservation still apply.
- Stale navigation is rejected before confirmation; cancellation keeps export review/filename,
  current item/draft, filters, page and selection untouched.

## DR-01 — Group activation and inline comparison

**Owner**: App's current duplicate bundle/state → ReviewPanel → one DuplicateComparison component.
**Requirements**: FR-014–016/019/020/022; SC-005/007/009.

| Boundary | Payload |
| --- | --- |
| Review input | Current duplicate results, revision, current comparison, ignored signatures, privacy |
| Group activation | Captured `{ revision, kind, indexes }`, with complete canonical membership |
| Comparison input | Validated current group, privacy-safe presentation rows, localized chrome |
| Comparison outputs | Back, revision-bound rename/delete/ignore requests; no direct document writes |

- One accessible group action opens all candidates; nested interactive card controls are not used.
  Existing detection rules remain unchanged. Same-rule identical-membership matches form one
  logical review group, but different-rule groups can be ignored independently.
- Comparison stays within Review's intended scroll region, with candidate names/ordinal source
  labels and matching rule. Preserve access to the global Privacy Mode control. Provide Back,
  per-candidate Rename/Delete and Ignore; counts distinguish active and ignored review groups.
- Show non-color-only difference status for every differing stored field, with absent/null/empty
  and nested/array differences represented. Object key ordering is not a value difference.
- All candidates and complete readable values remain reachable through bounded comparison/cell
  scrolling. No two-candidate cap, arbitrary omitted columns or silent truncation. Use labelled
  keyboard-scrollable containers and retain natural RTL layout with technical values LTR.
- Back/Escape dismisses the transient comparison/name-edit context before any editor-close
  handler; returns focus to a connected group trigger or the rule selector/Review heading.
  Closing a comparison with an edited name uses a localized discard confirmation; declining
  keeps that name draft. It does not discard an unrelated item-editor draft.

## DR-02 — Privacy projection and literal data

**Owner**: Pure differences plus privacy-aware presentation before any DOM binding.
**Requirements**: FR-015/016/020/021; SC-005/007/008.

- Compare raw JSON values without writing normalization, masks, annotations or differences into
  the document. Public-schema labels may remain translated; sensitive imported keys/custom labels
  use generic ordinal labels while masked.
- Masked values use fixed non-sensitive text. Protected prefixes, lengths, raw field paths and
  serialized structures may not enter hidden elements, descriptions, titles, input values or attributes.
  Vue row keys need not expose raw imported paths; DOM identities are numeric stable row ordinals.
- Turning privacy on immediately replaces exposed content/labels and releases any disclosure-only
  projection. Difference flags may remain but may not interpolate protected values or fragments.
- Privacy off displays complete literal text; never use HTML/Markdown rendering, remote images,
  automatic imported-link requests or vault values in Tooltip/audit/notice messages.
- Names/type/folder/status/date fields follow existing public display semantics, with imported
  names isolated for bidi. All type-specific/custom/unknown values use conservative protected policy.

## DR-03 — Rename/delete/ignore request guards and refresh

**Owner**: App's shared freshness/guard boundary and existing domain/history operations.
**Requirements**: FR-017–019/022; SC-004/006.

- Verify revision, exact current group and candidate membership before any prompt. Recheck after
  accepted draft/destructive prompts and before committing. Repeated/missing IDs never choose targets.
- Rename owns one candidate-name input at a time. It commits only `updateItem(document, index,
  { name })`, not the broad ItemEditor draft; empty names retain existing permitted semantics,
  while non-string or newly edited names outside existing editor constraints fail with safe
  feedback. Do not normalize or reject an unchanged imported name as incidental cleanup.
  A failed mutation retains source/history.
- Delete names the candidate and count explicitly in the confirmation, then uses existing
  atomic delete/undo behavior. No automatic survivor, multi-candidate deletion or credential merge.
- Declining confirmation leaves source, item/name drafts, comparison, selection, page and filters
  unchanged. Confirmed mutations use existing localized key-based audit/history messages without
  secret values, refresh duplicate counts and release stale comparison state.
- Ignore/restore updates only App's in-memory current-revision Set. It does not call commit,
  markExported, edit item/root JSON or remove validation warnings. Restore all ignored groups is
  sufficient; individual restoration may be offered using the same guard/signature semantics.
- Ignore state survives view/preference changes and Review unmount/remount; document commit,
  undo/redo/import/close clears it synchronously. Help explicitly describes this lifetime.
- A group no longer matching at least two current candidates is unavailable; old actions show
  localized unavailable feedback without prompting to discard a draft or changing a new occupant.

## CC-01 — Locality, accessibility and evidence

**Requirements**: FR-020–022; SC-007–009.

Reuse semantic tokens, Azure branding, bundled Inter/license, existing Modal/Tooltip and locale
keys. No palette/library/font/dependency/store/network/storage expansion. Both locales and themes,
keyboard/focus/contrast/reduced motion, required widths and actual 200% zoom are verification gates.

Distinguish structural validation, source-derived importer analysis and executed local imports.
Record tested client/server versions/routes and synthetic fixture identities. Mixed ownership,
combined folders/collections, opaque metadata, supported types and empty-envelope limitations
are disclosed rather than repaired. No deployed vault or hosted import is used for acceptance.
