# Research: Expand Export and Duplicate Review

**Date**: 2026-10-04 | **Spec**: [spec.md](spec.md)

Research is read-only: current-source exploration and authoritative documentation/source
inspection. No implementation or interoperability test is implied by these decisions.

This planning refresh incorporates the three accepted answers in the specification's
2026-10-04 Clarifications section. Previous source/importer research and pinned references are
reused; no new interoperability claim or application change is made.

## R1 — Extend the existing export review and download path

**Decision**: Keep the existing App export Modal and Blob/download mechanism. Add a transient
scope, prepared-result snapshot and filename; do not introduce an export service or additional store.
Block export while an item draft or folder edit is open using the existing `requestExport()`
behavior, without invoking `run()` or `discardDraft()`. Recheck dirty draft state at download.

**Rationale**: `src/App.vue` already has `download()`, `downloadOriginal()`, `requestExport()`
and `exportVault()`. The guard rejects pending edits without discarding them; `run()` and
`discardDraft()` would remount/reset editor state even when used for an ostensibly read-only export.
Use the established local notice to ask the user to Apply/Reset their draft first.

**Alternatives considered**: Exporting unapplied edits would change the contract; automatically
discarding them loses data. A second export dialog/service duplicates the current validation/download path.

Full successful downloads may retain current `markExported()` dirty-baseline behavior. Selected
and folder downloads **never call `markExported()`**; saving one subset is not saving all pending
working-vault edits. Neither kind writes document undo history. Original backup bytes/name remain intact.

## R2 — One pure preparation boundary and conservative structural closure

**Decision**: Add a pure `prepareVaultExport(document, scope)` boundary in `src/domain/vault.ts`.
Clone the source, then replace only understood item/folder/organization/collection list membership.
Filter source arrays in their original order, retaining unknown fields and nested structures.
Return item/folder source-index maps alongside the prepared document.

Use `withinFolder()` and `folderParent()` for slash-segment ancestry. Selected scope retains
referenced actual folders plus existing ancestors. Folder scope collects selected/descendant
actual records, including empty ones, then existing ancestors; item membership uses only the
branch records, never the additionally retained ancestors. Virtual branches synthesize no records.
Retain every source record matching a referenced ID, so duplicate folder IDs remain detectable
instead of choosing one record with `find()` and accidentally repairing the source.

For present valid organization/collection lists, retain referenced collections, organizations
referenced by items, and organizations referenced by retained collections. No reverse inference
adds unrelated collections merely because an organization is retained. Missing records remain
missing, ownership/membership references unchanged and advisory under existing validation semantics.

**Rationale**: The existing folder hierarchy and clone/validation primitives cover this feature.
`parseVault()` allows opaque organization/collection values; those are not universally safe to filter.
Unknown root arrays cannot be interpreted as item lists and must remain unchanged with scope disclosure.

**Alternatives considered**: Building a normalized vault drops unknown data; retaining every
understood list record defeats scope; stripping unknown root values defeats preservation; arbitrary
ownership conversion incorrectly promises import compatibility.

### Unclassifiable metadata policy

- For subset preparation, a present organization/collection container that is not an array,
  or has entries that cannot be classified by a usable string ID/reference shape, yields a
  localized blocking preparation diagnostic. Keep the original data untouched; do not coerce
  it to an empty list, silently omit entries, retain it wholesale as a workaround or guess ownership.
  This applies to selected-item and folder exports and is now explicitly confirmed in FR-010.
- A missing list is not malformed: do not fabricate it or a missing owner. Add a value-free
  advisory when a selected reference has no available record.
- A structurally understandable but invalid unselected item/folder is excluded according to
  exact scope; validate the prepared result so unrelated excluded-item errors do not block it.
- Full export preserves source structure and the existing validation policy, including opaque
  metadata. This subset-specific preparation check is not a new global import rule.

## R3 — Freshness and subset warning navigation

**Decision**: Reuse App's synchronous document revision and source-index identity. A captured
export scope carries revision plus the exact selected-membership signature or actual-folder
source index/path; virtual branches carry path and must still exist in current `folderTree()`.
Revision/selection changes invalidate the reviewed result. Check before any prompt and again
before creating the download.

Validate the resulting document with existing parsing/validation, then translate each retained
item/folder diagnostic through its source-index map. Resolve an equivalent issue in the current
full validation bundle before calling `inspectIssue()`. New result-only or root preparation
diagnostics get context only, never a fabricated source navigation link.

**Rationale**: Current `inspectIssue()` rejects stale revisions and issues not in its own bundle.
Prepared-array indexes are not source indexes. Passing a subset Issue directly would either
reject it or risk targeting another source item. IDs cannot replace source identity because
repeated/missing IDs are supported. Modal removal still precedes editor field focus.

**Alternatives considered**: Mapping by imported ID is ambiguous; forwarding bare indexes is
unsafe; filtering source warnings is not validation of the actual result; regenerating a changed
scope silently at download violates the user's reviewed selection.

## R4 — Pure filename validation, not silent user-input sanitation

**Decision**: A small domain helper returns the displayed final basename or localized error key.
Validate raw input first so a trailing dot/space cannot become acceptable after appending an
extension. Append `.json` only when absent case-insensitively, then enforce the 200-code-point
bound. Reject the spec's punctuation/path syntax, reserved device stems before the first dot,
empty stems, control characters (`Cc`), lone surrogates and misleading bidi embedding/override/
isolate controls (U+202A–U+202E, U+2066–U+2069). Include reserved COM/LPT superscript ¹/²/³ forms.
Do not reject all Unicode format characters: joining characters remain valid. No normalization,
trim or silent sanitation of user input. Validate again at download.

Defaults may sanitize the imported basename, remove its final `.json`, add `-edited`, `-selected`
or `-folder`, reserve suffix length, and fall back to the prescribed `vault-*.json` names when
sanitization/validation cannot produce a safe name. Avoid folder names in defaults: the source
basename plus scope suffix is sufficient and requires fewer naming edge cases.

The accepted filename clarification fixes the validation boundary: 200 Unicode code points,
**no additional byte limit**, and equality between the displayed and app-requested name. Browser-
suggested or on-disk adjustments are recorded as platform behavior, not a failed app-name promise.

**Rationale**: The browser's filename suggestion is not an OS path or guarantee of filesystem
collision behavior. Application validation reduces predictable invalid names while preserving
valid Arabic and other Unicode names. Browser/OS duplicate-name handling remains outside app control.

**Alternatives considered**: Silent replacement of typed characters hides intent; ASCII-only
filenames break localization; a filename library is unnecessary for the explicit bounded rules.

## R5 — Inline comparison and exact, privacy-safe differences

**Decision**: Add one `DuplicateComparison.vue` inside the existing Review region, not another
modal competing with export/editor dialogs. It receives the current validated group, privacy,
and derived comparison rows, emits explicit requests, and owns at most one candidate name draft.
App's toolbar privacy control remains reachable while comparing. Back returns focus to a connected
group trigger, otherwise the rule selector/Review heading. Candidate columns live in a labelled
keyboard-scrollable region; all candidates remain reachable, even in a 100-item group.

Compute own-property differences from raw JSON, not the lossy `text()`, `scalar()`, `login()` or
`uris()` display helpers. Recursively enumerate field/container presence and leaf paths across
candidates, distinguish absent/null/empty, compare object key sets independent of ordering and
ordered array positions exactly. Detection normalization remains only in `findDuplicates()`;
comparison does not normalize URIs/credentials. Return field equality/status independently of
presentation, with numeric row identifiers rather than putting imported paths into DOM attributes.

Project values and labels through privacy policy before rendering. Public schema fields may use
localized labels; credentials, notes, type-specific/custom/unknown subtrees use fixed masks and
generic ordinal labels for potentially sensitive imported keys. No prefix, length, raw path,
hidden template, title, description or form value may disclose a protected comparison value.
Privacy-off text is literal, never HTML/Markdown, imported links or remote images. Disclosed
notes/structured values remain inspectable in bounded cells; no silent truncation loses comparison data.

**Rationale**: Existing username masks reveal a prefix and cannot satisfy FR-016. Ordinary
JSON serialization compares object insertion order falsely. Unknown keys can be secrets too.
Inline Review avoids native-modal inertness blocking the global privacy control.

**Alternatives considered**: A two-candidate-only dialog misses large groups; automatic merge
violates scope; a diff/editor library adds dependencies and rendering risk; CSS blur retains secrets.

## R6 — Shared guarded name/delete actions and revision-scoped ignores

**Decision**: App owns current comparison and an in-memory Set of canonical group signatures
`rule + ordered source-index membership`, scoped to one document revision. Pass App's duplicate
results to Review rather than computing a competing bundle there. Same-rule groups with identical
membership are one logical review group; their detection matches are aliases of the same dismissal.
Different rules or different memberships remain independent. Never retain credential-bearing match keys.

Rename requests carry revision/group/candidate/name and commit `updateItem(..., { name })` only,
after validating target, name and existing draft guard. Delete requests add an exact-candidate/count
confirmation before existing `deleteItems()`/history behavior. Recheck after synchronous prompts.
Do not invoke mutable `current`-based `saveItem()` or count-only `removeItems()` with captured targets.

Ignore/restore updates only the Set and active review counts, never `findDuplicates()` validation,
document fields, `markExported()` or undo. Clears synchronously on document change/undo/redo/import/
close, but not view, sort, search, locale, theme or privacy changes. Changes close or refresh an
open comparison and clear its name draft so an old occupant cannot be edited.

**Rationale**: Review can unmount during view changes, so component-local ignores are insufficient.
Existing commit clones preserve atomic failures and a bounded 30-snapshot undo history. Explicit
name-only changes reuse domain behavior without routing through the broad item editor.

**Alternatives considered**: Persistent ignores violate scope; item annotations alter exports;
opaque credential hashes introduce unnecessary sensitive identifiers; preserving dismissals across
revision changes risks hiding new groups. A broad ItemEditor rename route permits unrelated edits.

## R7 — Verification and compatibility evidence

**Decision**: Use the existing Vitest/component/i18n/security suites with synthetic-only fixtures,
then real-browser downloads, offline/traffic, keyboard/focus, locale/theme, widths and actual zoom.
For scale, record one warm-up/five samples and correctness for 10,000-item subset preparation
and 100-candidate comparison; do not inherit or waive the preceding feature's failed median gate.

Interoperability is route-specific evidence, not implied by passing `parseVault()`/`validateVault()`.
Pin examined importer versions/commits and record any actual local imports separately. A personal
Bitwarden JSON import and an organization-owned JSON import may have different semantics; preserve
ownership records rather than converting them into personal data. Unverified routes remain explicit
compatibility limitations, not unresolved implementation design choices.

**Alternatives considered**: Real-vault fixtures, hosted test imports and unsupported universal
claims violate privacy/honesty. New app networking or import adapters are outside scope.

## R8 — Authoritative format/import analysis and portability limits

**Decision**: Preserve the incoming envelope rather than manufacturing a combined importer
format. Do not add absent structural arrays: `collections: []` is not interchangeable with
an absent `collections` property in the examined importer. Present but emptied understood
lists stay present because removing them would also change source structure.

**Rationale / evidence inspected**:

- Personal export/import: plaintext `{ encrypted: false, folders, items }`, Tools → Import →
  My vault → **Bitwarden (json)**. Personal export excludes organization-owned items.
- Organization export/import: plaintext `{ encrypted: false, collections, items }`, Admin
  Console → Settings → Import → **Bitwarden (json)** with an authorized destination organization.
  A root `organizations` array is not a standardized multi-organization import envelope.
- Examined Bitwarden JSON importer selects collections rather than folders whenever
  `collections != null`, even if empty. Both lists do not receive combined structural handling.
  It resets IDs/ownership, copies supported fields instead of unknown fields, limits password
  history and applies cleanup. Import success is therefore not a lossless round-trip guarantee.
- Organization import assigns the chosen destination owner; it cannot restore multiple source
  organizations automatically. Personal/organization conversion is outside this feature.
- Vaultwarden's endpoints consume client-prepared cipher requests and index relationships,
  not the plaintext JSON root directly. Record both deployed web-client and server versions.
- Zero-item JSON can be structurally valid but rejected by the examined import service when it
  has neither folders nor ciphers. Empty collection-only outputs remain downloadable preservation
  files with an explicit compatibility limitation, not a guarantee of importer acceptance.

Provide static localized route/shape advisories for mixed ownership, combined lists, available
metadata that cannot establish an import guarantee, and zero-item outputs where appropriate.
Those are advisory compatibility diagnostics, not permission to rewrite user data or block a
structurally valid preservation export merely because an importer is unverified.

**Pinned source references** (read-only inspection, **no imports executed**):

- Bitwarden clients commit `245879a5e3269da22197d3306a2f8b0355794095`:
  [personal exporter](https://raw.githubusercontent.com/bitwarden/clients/245879a5e3269da22197d3306a2f8b0355794095/libs/tools/export-vault-core/src/services/individual-vault-export.service.ts),
  [organization exporter](https://raw.githubusercontent.com/bitwarden/clients/245879a5e3269da22197d3306a2f8b0355794095/libs/tools/export-vault-core/src/services/org-vault-export.service.ts),
  [JSON importer](https://raw.githubusercontent.com/bitwarden/clients/245879a5e3269da22197d3306a2f8b0355794095/libs/importer/src/importers/bitwarden/bitwarden-json-importer.ts),
  [import service](https://raw.githubusercontent.com/bitwarden/clients/245879a5e3269da22197d3306a2f8b0355794095/libs/importer/src/services/import.service.ts).
- Vaultwarden commit `f4f1a8e105ec5fd72ec1dd1bed800bcf44deae2b`:
  [personal endpoint](https://raw.githubusercontent.com/dani-garcia/vaultwarden/f4f1a8e105ec5fd72ec1dd1bed800bcf44deae2b/src/api/core/ciphers.rs),
  [organization endpoint](https://raw.githubusercontent.com/dani-garcia/vaultwarden/f4f1a8e105ec5fd72ec1dd1bed800bcf44deae2b/src/api/core/organizations.rs).
- Official route documentation: [export](https://bitwarden.com/help/export-your-data/),
  [import](https://bitwarden.com/help/import-data/),
  [organization export](https://bitwarden.com/help/export-organization-items/),
  [organization import](https://bitwarden.com/help/import-to-org/).
- Filename sources: [Microsoft naming rules](https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file),
  [Linux pathname limits](https://man7.org/linux/man-pages/man7/pathname.7.html),
  [browser download suggestion](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement/download).

The 200-code-point limit is the application rule, not a universal filesystem byte limit. A
valid emoji basename may exceed a filesystem's byte limit. Assert the app's displayed/requested
download name; observe browser-suggested filenames and record OS/browser adjustments rather than promise
an identical on-disk name, collision handling or successful filesystem writes on every platform.
The confirmed specification prohibits an extra byte limit; no transliteration is introduced.

**Alternatives considered**: Clearing ownership, turning collections into folders, adding empty
lists, automatically splitting owners or imitating an upstream parser can hide incompatibility
while destroying preservation. Executing imports against hosted services violates the local-only
validation requirement. Source-derived predictions are not substituted for actual local imports.

## R9 — Confirmed branch-local duplicate-path rejection

**Decision**: Before folder membership is prepared, enumerate actual folder source records at
the captured path and its segment-boundary descendants using the existing hierarchy convention.
Count exact full-path strings in that branch; any count above one blocks folder export with a
localized ambiguity diagnostic, even when both records are empty or have distinct valid IDs.
Virtual/grouping rows are not actual records and do not contribute to duplicate counts.

Perform this check before adding retained ancestor records, so duplicate ancestors outside the
requested branch do not activate this rule. Duplicate paths in siblings/unrelated branches also
do not activate it. Do not choose the first same-path record, combine records, rename folders or
delete entries as a workaround. Full export and selected-item export keep their existing scope
and resulting-validation rules; selected membership is not replaced by branch inference.

**Rationale**: The user's third accepted answer supersedes the earlier same-path combining
policy. Two different folder IDs can share the same display path while owning different items;
combining them guesses user intent. A branch-local path-count scan is sufficient, with no new
hierarchy model, normalized names or persistent index. ID duplication remains a distinct existing
validation concern and must not be confused with equal full-path names.

**Alternatives considered**: Combining all same-path records was explicitly rejected. Choosing
one ID guesses scope; globally blocking unrelated path duplicates exceeds the confirmed rule;
automatic repair modifies the document. Retained ancestor structure remains subject to normal
result validation, not this branch-local ambiguity rule.

**Required evidence**: Actual and virtual roots, duplicate root and descendant paths, empty
duplicates, distinct IDs/equal paths, sibling-only duplicates, duplicate ancestors outside a
nested scope, selected-item exports through the same source and unchanged originals/history.

**Source verification**: `src/domain/vault.ts`'s `withinFolder()` is case-sensitive, preserves
whitespace and tests literal equality or `parent + '/'`; it returns no descendants for an empty
parent. `folderTree()` preserves duplicate actual records, and current validation detects duplicate
IDs/nontext names, not duplicate paths. Reuse those conventions without trimming, normalizing,
comparing leaf labels or altering imported slash sequences.

For an actual folder with the valid textual name `''`, source-index identity retains its direct
items only, with no inferred descendants. Two actual records whose raw names are exactly `''`
trigger ambiguity; missing/null/nontext names must not be coerced into that duplicate-name set.
A nontext actual target is blocked as a structural name error, not treated as a fabricated empty
or localized path. Virtual targets are nonempty existing grouping paths. This closes the existing
empty-parent edge case without changing folder creation rules or imported data.

## Design uncertainty status

All local integration, validation, metadata, filename, comparison and state-lifetime decisions
are resolved. Executed compatibility/browser/scale checks are future acceptance evidence,
not claimed results of planning. No constitution exception or added storage/dependency is needed.
