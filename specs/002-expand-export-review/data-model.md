# Data Model: Expand Export and Duplicate Review

**Spec**: [spec.md](spec.md) | **Decisions**: [research.md](research.md)

All new entities are in-memory view state or separately prepared copies. Nothing adds fields
to imported vault items, folders or root objects. Existing `VaultExport`/`VaultItem` open JSON
types, original bytes and `useVault` snapshots remain authoritative.

## 1. Source identity

- **Document revision**: Existing synchronous monotonically increasing App counter, advancing
  on document replacement/commit/undo/redo/import/close; never restored to an old revision by undo.
- **Item/folder source index**: Position in the working source array for one revision, independent
  of IDs, filters, sort, page or comparison column. Repeated/missing imported IDs remain allowed.
- **Target validation**: Integer/in-range index, matching current revision, and captured path or
  current group membership where relevant. Reject invalid targets before prompts and recheck
  after prompts. Imported IDs are data to preserve, not application identity.

## 2. ExportScope

Discriminated scope owned by App:

| Kind | Captured fields | Membership |
| --- | --- | --- |
| Full | `revision` | Entire working document, no list pruning |
| Selected | `revision`, canonical source-index list | Exactly selected items in source order |
| Folder | `revision`, `path`, actual `folderIndex` or virtual marker | Unambiguous existing branch folders and assigned items; reject duplicate full paths inside the branch |

Canonical selected indexes are unique integers in source order; a zero-length or invalid selected
request is rejected, not silently narrowed. Selection signature represents only membership,
not selection-click order. Capture it when opening review and compare with live selection at download.

An actual folder request verifies its source index/path against the current record. Virtual
requests verify the path remains in current `folderTree()` as a grouping node. Scope is based on
the path hierarchy: check actual records at the target path and segment-boundary descendants,
not prefix siblings, for duplicate full paths before preparing any folder result. Reject duplicates
instead of combining records, even when their IDs differ or they contain no items. Check only
branch records, before adding retained ancestors: sibling/outside-branch/ancestor-only duplicates
do not activate this rule. Selected scope has no new path-ambiguity restriction.
Unassigned items are not members. Missing/duplicate IDs are preserved for resulting validation.

Paths retain literal existing case, whitespace and slash semantics. A valid actual empty-string
name uses its source index/direct folder assignment only, with no inferred descendants; duplicate
raw empty-string names block that folder export. Missing/nontext names are structural errors,
not additional empty-name records. Virtual paths must be existing nonempty grouping nodes.

## 3. PreparedExport

Returned by a pure domain preparation boundary; owned only while export review is open:

| Field | Meaning |
| --- | --- |
| `document` | Separate clone containing full or selected lists |
| `itemSources` | Prepared item position → original source index |
| `folderSources` | Prepared folder position → original source index |
| `diagnostics` | Preparation/ownership/compatibility message keys; no secret-value interpolation |

Result validation belongs to the export review and operates on this actual document. A full
export returns an unchanged clone and identity maps for existing lists. Subsets:

1. Validate the captured scope. For folder scope, scan actual branch records for repeated full
   paths and block ambiguity without choosing or combining them; then determine item and branch
   folder membership using source records, never visible rows. This guard is independent of IDs.
2. Retain referenced folders and existing slash ancestors. For a folder scope, preserve empty
   branch folders; added ancestor records do not broaden item membership.
3. Collect item collection IDs and ownership IDs. Include matching available collections and
   organizations; add organizations referenced by retained collections. Keep every matching
   duplicate structural record in original order rather than silently choosing one.
4. Reduce only arrays that already exist. Preserve omitted arrays as omitted and present empty
   arrays as present; do not add `collections: []` to a personal envelope. Missing `items` in a
   folders-only input may stay absent, representing zero items under existing root semantics.
5. Preserve unknown root properties and opaque arrays completely, and every nested property of
   retained records. Do not normalize names, reassign ownership, generate IDs or fabricate ancestors.
6. Build source maps before pruning. Serialize/parse using existing root validation, then call
   `validateVault()` on the result; no operation commits or writes the source clone back.

For subset scope, malformed present understood metadata containers/entries that cannot be
classified safely produce a blocking preparation diagnostic. Missing lists/referenced records
produce an advisory, not invented metadata. Invalid records that are structurally understood but
excluded by scope do not contribute resulting-item errors. Unknown root values are not inspected
for reference guesses and remain intact even when they contain excluded-scope information.
Both selected-item and folder exports follow this confirmed policy: malformed ownership data
cannot be dropped, coerced or retained wholesale to bypass the blocker.

A classifiable ownership record is an object with a nonempty string `id`; a collection's optional
`organizationId` is absent/null/string, not a guessed owner. Official collection records without
that optional field are valid. Selected item membership references keep existing types; malformed
reference shapes that prevent safe closure cause preparation failure rather than a fabricated empty set.

### Result issues and source navigation

Each resulting Issue has an **export-local** item/folder index. The review stores that issue
alongside an optional mapped source index. Actionable item links resolve an equivalent live
source Issue by message/severity/field/entry/source index and issue membership in App's current
validation bundle, then use the existing revision-bearing `IssueRequest`. The local index is
never sent to the source editor. Unmapped/preparation/root diagnostics have no fabricated item link.

## 4. ExportReview and ExportFilename

| State | Fields / lifetime |
| --- | --- |
| ExportReview | Scope, prepared result, result validation, freshness status, trigger reference |
| Filename draft | Raw user text, resolved final basename or error key; independent of document serialization |
| Freshness | Current revision, exact selected membership when applicable, target validity and draft guard |

Filename validation checks raw input before extension handling, then the resulting code-point
count. Reserved stems are checked before the first dot, case-insensitively. `.JSON` remains
unchanged; `report.txt` resolves to `report.txt.json`; there is no Unicode normalization. Default
generation is allowed to sanitize source-derived text, but invalid user text is retained with
feedback. Unknown filename values never enter notices/logs/history or persisted preferences.
Enforce exactly the confirmed 200-code-point ceiling after extension resolution, with no extra
byte limit. The displayed final name must equal the app-requested download name; OS/browser
saved-name adjustments and filesystem byte limits are documented outside this guarantee.

Export transitions:

```text
Closed → validate target and existing item/folder draft guards → Prepared/Fresh
Closed → branch ambiguity or unsafe ownership narrowing → Blocking diagnostic, no prepared download
Prepared/Fresh → filename change → same document, updated name/error
Prepared/Fresh → source revision/relevant selection change → Invalidated
Prepared/Fresh → recheck freshness, drafts, filename and result errors → Download
Invalidated → explanation → user reopens/refreshes review (no silent new membership)
Any open state → cancel/replace/close → release prepared document, filename and trigger references
```

Preparing/cancelling/downloading does not change item drafts, selection, page, history or originals.
Successful full download retains the existing dirty-baseline update if applicable; subset download
never marks the whole vault exported. Failed downloads do not mark it exported. Existing Blob URL
revocation and original-copy behavior remain unchanged.

## 5. DuplicateGroupRequest and CandidateAction

- **Group request**: `revision`, existing `DuplicateKind`, canonical ordered candidate source
  indexes. Must match an existing current group with at least two candidates.
- **Group signature**: Rule plus canonical source-index membership only, scoped to one revision.
  No names, secrets, credential keys or imported IDs. Same-rule identical-membership detection
  matches are aliases of one logical group; different rules remain distinct.
- **Candidate request**: Current group request, exact candidate source index, action. Rename
  additionally includes one user-edited name draft; delete includes no broader bulk membership.
- **Comparison state**: Current validated group request, trigger/fallback focus and optional
  candidate name draft. Source values are derived from the live document; never keep a secret
  string snapshot just to survive a privacy or revision change.

App handles requests. Rename validates string/name rules and commits only `{ name }` through
`updateItem`; delete confirms the exact candidate/count and uses `deleteItems`. Both check targets
before guards and before commit. Cancelled guards preserve comparison/name/item drafts and source.
Commit/undo/redo invalidates old requests, clears name drafts, and refreshes/closes comparison.
Validation failures retain the prior source/history and show localized safe feedback.

## 6. ComparisonRow and privacy projection

Domain comparison works on raw own-property presence and JSON values, not current display helpers:

- **Row identity**: Numeric traversal ordinal; internal path segments must not become DOM IDs,
  data attributes, titles or labels while protected.
- **Path/presence**: Union of actual nested keys and ordered array positions. Include container
  presence where needed to distinguish empty object/array from missing/null.
- **Per-candidate value state**: Absent, null, empty string/container, or actual scalar/container.
- **Difference**: Equality based on own key sets and recursively equal values; object key ordering
  is irrelevant, array position/order is not. Detection's URI/name normalization is not applied.

Presentation is a separate derived projection:

| Field category | Privacy on | Privacy off |
| --- | --- | --- |
| Existing public name/type/folder/status/date fields | Existing readable policy, literal and isolated | Literal and isolated |
| Credentials, notes, type-specific/private/custom/unknown values | Fixed mask plus value-free difference/presence cue | Complete literal content in bounded cells |
| Potentially sensitive custom/unknown imported labels/path segments | Localized generic ordinal labels | Literal labels, never executable content |

Do not expose protected lengths, prefixes, dynamic paths or stringified structures in any DOM
property or accessible description. The masked projection has no raw protected strings. Privacy
off uses normal Vue text binding, not `v-html`, image URLs, Markdown or automatic URI anchors.
Technical values/JSON remain LTR; imported names use bidi isolation. Privacy changes replace the
projection immediately without saving masks or requiring comparison to be closed first.

## 7. IgnoredGroups

App-owned in-memory Set of current-revision group signatures. It filters active **review** groups
and counts only. Validation and quality warnings continue using the complete domain duplicate results.

```text
Active group → ignore valid current group → Hidden in active review
Hidden → explicit restore (individual or restore all) → Active
Any committed document change/undo/redo/import/close → empty Set
View/search/sort/filter/locale/theme/privacy change → preserve Set
```

No ignore event enters `useVault.commit()`, document fields, exported JSON or undo history.
Ignored-state reset is synchronous with revision changes, so shifted indexes never revive an old
dismissal. Review remounts receive the App-owned Set, not a second component-owned copy.

## 8. Complexity and ownership

Reuse current history cloning/cap, revision watch, duplicate detector and folder helpers. One
prepared export and one comparison are active at a time. Subset scans are linear in relevant
source lists; recursive comparison is proportional to traversed candidate JSON and row union.
There is no global overlay registry, persistent identity map, background worker or speculative
virtualization. Measure the required large fixtures before introducing any additional machinery.
