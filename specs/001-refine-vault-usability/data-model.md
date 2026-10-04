# Data Model: Refine Vaultsort Usability

All new state is in memory. No vault schema migration, backend entity, persistence format,
new audit payload, or change to exported source structure is introduced.

## 1. Existing Vault Document and Item

`VaultExport`, `VaultItem`, original bytes, snapshots, and edit drafts remain the existing
types in `src/domain/vault.ts` and `src/composables/useVault.ts`.

| Attribute | Contract |
| --- | --- |
| Imported item properties | Unknown values, IDs, ownership and opaque type-specific data remain untouched by presentation |
| `notes` | Untrusted value; only a string is displayable, blank/non-text means no preview |
| `creationDate`, `revisionDate` | Existing imported values; valid strings display through locale/time-zone formatting, otherwise a dash |
| `type` | Numeric known types 1–5; numeric 5 is SSH; other values remain opaque/unknown |
| Source index | Existing numeric position, retained across view-only sorting/filtering; scoped to one document revision |

Imported ID/name/content are not unique application identities. No missing ID is synthesized
and no malformed value is coerced. The 10,000-item dataset is a test target, not a maximum.

## 2. List View State and Optional Fields

Keep the existing App refs for query, filters, sort, page, selection, and current item.
Replace only the paired date-visibility flag.

| Field | Values / default | Relationship |
| --- | --- | --- |
| `visibleFields.notes` | Boolean, false | Shows preview/mask column, never changes search/export |
| `visibleFields.created` | Boolean, false | Reads existing `creationDate` |
| `visibleFields.modified` | Boolean, false | Reads existing `revisionDate` |
| `openControl` | `filters`, `sort`, `fields`, or null; default null | At most one disclosed form panel |
| Existing filter values | Folder, type, ownership, inspection | Clear filters resets these values only |
| Existing sort values | Original/name/creation/revision; asc/desc | Independent of filter reset/field visibility |

Field choices survive list sorting/filtering, edits/undo, language/theme changes, and editor
opening. Import/replacement/close resets them to false and closes disclosures. They never
create history entries, change dirty state, or become persisted preferences.

Filtering continues to reset selection/page as today; sorting retains selection/drafts and
resets pagination. An existing category navigation choice is not an implicit extra filter
reset. Count explicit non-default folder/type/ownership/inspection values for filter status.

## 3. Validation Issue

Extend the existing Issue rather than replacing all consumers with a new domain hierarchy.

| Field | Type / meaning |
| --- | --- |
| `severity` | Existing `error` or `warning` |
| `message` | Existing untranslated localization key; never imported secret text |
| `itemIndex` | Optional source item position |
| `folderIndex` | Optional source folder position |
| `field` | Optional typed hint from the table below; item issues only |
| `entryIndex` | Optional non-negative URI entry position; only for `login.uris` |

At most one item/folder index may be set. Neither means document-level. Indices and entry
positions must be valid for the revision where validation occurred. A field hint never adds
a corrective operation; it only chooses an existing focus destination.

| Validation family | Field hint | Destination |
| --- | --- | --- |
| Missing folder | `folderId` | Existing folder select |
| Malformed login object | `login` | Credentials/context explanation |
| Missing/malformed username | `login.username` | Username input, still masked/readonly when privacy is on |
| Missing/malformed password | `login.password` | Password input without reveal |
| Malformed TOTP | `login.totp` | TOTP input without reveal |
| Missing/malformed URIs | `login.uris` | First relevant/offending input, or existing Add button with context |
| Ownership advisory | `ownership` | Open metadata and focus its summary |
| Duplicate/unsupported item | None | Item-specific issue context, not generic review |
| Folder/document issue | None | Existing contextual explanation, no invented item target |

Populate hints at the validation rule; never infer them from translated messages. Preserve
warning/error classification and structural export blocking except recognizing SSH as a known
type. URI targeting may identify the first malformed entry without changing the imported array.

## 4. Document Revision and Issue Navigation Request

| Field | Meaning |
| --- | --- |
| `documentRevision` | Monotonically increasing App-local integer whenever the working-document reference changes |
| `validationBundle` | Current revision plus current Issue list; one computed source shared with review/export |
| `issuesByItem` | Derived source-index → Issue list map for rows, filtering and editor context |
| `issueRequest` | Revision plus selected Issue; transient, not part of the exported document |
| `issueContext` | Accepted current item issue(s), retaining message keys and no copied sensitive values |
| Focus trigger | Temporary connected-element reference or stable action fallback |

Revision increases on import, commit replacement, undo, redo, and close; it is not reset by
`resetUI()` within the same mounted app. A no-op commit does not invalidate the reference.
Update it synchronously with document-reference changes, before a stale callback can run;
a default deferred watcher is not a sufficient freshness boundary.
Every request receives its revision when results are derived, not from the current state
at click time. This prevents an old index from opening a new occupant after deletion/undo.

Navigation transition:

1. Reject a stale revision, invalid index, or no-longer-current issue before touching a draft.
2. Obtain existing discard confirmation if navigation resets/switches the editor.
3. Cancellation leaves current item, modal, filters, page, selection and draft unchanged.
4. Acceptance closes the originating export dialog, selects the source item, and sets context.
5. After editor mount/dialog removal, recheck revision and focus the existing target/fallback.
6. Document changes invalidate context/pending focus; refreshed validation creates new requests.

Same-item warning activation must not be dropped by the existing `selectItem` early return.
Use the shared guarded issue handler; do not invent cross-snapshot identity remapping.

## 5. Known Item Type Descriptor

One small static descriptor list in the existing domain module supplies numeric type,
singular label key, category label key, and existing icon name for types 1–5.
It replaces divergent hardcoded lists, not the domain export schema.

SSH uses type 5 and the existing key icon. Its category/filter option is available when
present or when it remains the active zero-result choice. Counts derive from the working
document, so deletion/undo changes counts automatically. Unknown types stay separate;
SSH-specific fields are preserved through the existing generic editor/Raw JSON boundary.

## 6. Note Inspection Target and Lifetime

| Field | Meaning |
| --- | --- |
| `noteTarget` | Null or current document revision plus source item index |
| Trigger | Temporary invoker element reference for focus restoration |
| Display text | Derived from the current item only while Notes is enabled and privacy is off |

Do not copy full notes into tooltip state, DOM attributes, validation messages, or history.
Only one full-note inspector is mounted. Previewing never changes the selected editor item.

Open requires an explicit action, current target, non-blank string note, enabled Notes,
and Privacy Mode off. Display full original text literally with line breaks and bidi-safe
wrapping. Close/Escape unmount it and return focus; outside activation preserves its focus.
If the trigger disappears through list changes, close and use a connected logical fallback.

Privacy enablement, hidden Notes, any document replacement, import/reset/close, and inspector
dismissal clear the target and remove full text from the DOM. Language/theme changes update
chrome without translating the note; they do not invalidate a still-current target.

## 7. Display Preferences and Tooltip State

Existing `en`/`ar` and `light`/`dark` preference state remains authoritative. Each saved value
is validated independently at startup; default English and native OS theme apply per invalid
or missing value. Failed reads/writes cannot block in-memory selection. No optional-field,
privacy, search, disclosure, or note state enters storage.

Tooltips retain only localized action-help keys, trigger/description association, and visible
or Escape-dismissed state. They contain no vault values and are not interactive controls.
Their dismissal must not bubble into editor-close behavior. All transient elements are
removed on owning-component teardown; no global overlay/session registry is added.
