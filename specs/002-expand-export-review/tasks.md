# Tasks: Expand Export and Duplicate Review

**Input**: Design documents in `specs/002-expand-export-review/`.
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/ui-contracts.md`, `quickstart.md`, `.specify/memory/constitution.md`.
**Branch**: `feat/exports`; feature discovery does not authorize a branch switch.
**Tests**: Explicitly required by FR-022 and the constitution. Write synthetic regressions before the corresponding transformation, guard or security implementation; establish that they fail for the intended reason, then make them pass.
**Organization**: One independently verifiable phase per story, in specification priority order. All tasks start unchecked; this file records no implementation or acceptance result.

## Format and paths

`- [ ] Tnnn [P?] [USn?] Description with exact repository-relative paths`

`[P]` identifies disjoint-file work executable concurrently with another task at the same ready dependency frontier, not permission to bypass prerequisites. Story phases require story labels; setup, foundation and polish do not. Use existing dependencies, native controls, locale keys, domain helpers and history. Do not create a backend, store, export framework, merge engine or new persistence.

## Phase 1: Setup

**Goal**: Establish the existing baseline and safe implementation context; no project scaffolding.

- [X] T001 Read `AGENTS.md`, `docs/design-system.md`, `.specify/memory/constitution.md` and `specs/002-expand-export-review/plan.md`; inspect current work with non-destructive git commands, run `npm run lint`, `npm test`, `npm run build` and `git diff --check`, and record baseline/environment and existing failures in `specs/002-expand-export-review/implementation.md` without marking prior-feature gates complete.
- [X] T002 Generate the synthetic fixture using `specs/002-expand-export-review/quickstart.md` section 2 into `/tmp/opencode/vaultsort-export-review-validation/`; verify its hash, 10,000 items, 5,000 Work members, 100 candidates and selected `[103,0,9,4]` source-order expectation `[0,4,9,103]`, and record identities in `specs/002-expand-export-review/implementation.md`; keep fixtures out of production assets and Tailwind inputs.

## Phase 2: Foundational prerequisites

**Goal**: Trace shared boundaries before changing them; retain one source of identity/history.

- [X] T003 Trace every export/download, `requestExport()`, `inspectIssue()`, document revision and draft/mutation caller in `src/App.vue`, `src/composables/useVault.ts`, `src/domain/vault.ts`, `src/components/ReviewPanel.vue` and `src/components/ItemEditor.vue`; record reuse points and result-index-to-source navigation constraints in `specs/002-expand-export-review/implementation.md`, including why preparation cannot use `run()`/`discardDraft()` and captured candidate actions cannot call unguarded broad editor handlers.
- [X] T004 Trace existing assertion/mount patterns in `src/domain/vault.test.ts`, `src/domain/folders.test.ts`, `src/components/usability.test.ts`, `src/components/security.test.ts` and `src/i18n/i18n.test.ts`; record the test-to-contract mapping for EX-01–03, DR-01–03 and CC-01 in `specs/002-expand-export-review/implementation.md`, reusing existing harnesses and synthetic builders rather than adding a test framework.

**Checkpoint**: Setup and foundation complete before any story. Subsequent tasks describe required boundaries, not permission to loosen the specification.

## Phase 3: US1 — Name an Edited Export (P1)

**Goal**: Add safe custom names to the existing full-vault export review without changing output bytes or originals.
**Independent test**: Edit a synthetic vault, export under two valid names and compare payloads; invalid names block, displayed/requested names agree, cancellation preserves drafts/state and original download remains byte-exact.
**Contracts**: EX-01; FR-001–004/010–013/020–022; SC-001/003/004/007/008.

- [X] T005 [P] [US1] Add filename resolver/default regression cases in `src/domain/vault.test.ts`: empty/extension-only/path/control/bidi/lone-surrogate/reserved-device/trailing-space-or-dot rejection; case-insensitive `.JSON`, appended `.json`, Arabic/joining/emoji preservation and final 200/201-code-point boundaries; enforce “no extra byte limit” using a valid name above 255 UTF-8 bytes and scope defaults `vault-edited.json`, `vault-selected.json`, `vault-folder.json`.
- [X] T006 [P] [US1] Add full-export integration regressions in `src/components/usability.test.ts` for associated filename errors, unchanged payload across name changes, raw invalid draft retention, cancellation/reset on close/replacement, pending draft/folder-dialog rejection, failed-download baseline preservation and original name/byte equality.
- [X] T007 [US1] Implement pure filename resolution and safe source-derived scope defaults in `src/domain/vault.ts`; obey “Reserved stems are checked before the first dot, case-insensitively”, “`.JSON` remains unchanged; `report.txt` resolves to `report.txt.json`; there is no Unicode normalization” and “Enforce exactly the confirmed 200-code-point ceiling after extension resolution, with no extra byte limit”; sanitize defaults only, never user input.
- [X] T008 [P] [US1] Add English/Arabic filename labels, validation messages, resolved-name/platform-limit explanation, scope/count/plaintext/opaque-metadata copy and full-export review notices in `src/i18n/locales/en.json` and `src/i18n/locales/ar.json`; keep key/interpolation parity and no secret or filename interpolation in history/notices.
- [X] T009 [US1] Extend the existing export Modal/download flow in `src/App.vue` with in-memory raw/resolved filename state and fresh full scope; keep filename changes independent of serialization, show scope/count and disclosures, disable invalid/error/stale downloads, recheck drafts before download without `run()`/`discardDraft()`, request exactly the displayed name, release export-only state on dismiss/replacement/close and preserve original-copy/Blob-revocation behavior.
- [X] T010 [US1] Verify US1 regressions in `src/domain/vault.test.ts` and `src/components/usability.test.ts` plus locale invariants in `src/i18n/i18n.test.ts`; record keyboard/error association/focus checks for full export and any failures in `specs/002-expand-export-review/implementation.md` before handing the shared review to US2/US3.

## Phase 4: US2 — Export Selected Items (P1)

**Goal**: Prepare and review exactly the selected items with conservative structural closure, preserving loaded data and dirty/history state.
**Independent test**: Select items across pages/types/owners; assert exact source-order items, retained referenced structures/unknown values, validation blockers/advisories, correct source warning navigation and unchanged source/original/history.
**Contracts**: EX-01–03; FR-005/008–013/020–022; SC-002–004/006–009.

- [X] T011 [P] [US2] Add pure selected/full preparation regressions in `src/domain/vault.test.ts` for exact membership/order, duplicate/missing imported IDs, deep non-mutation, unknown root/record values, folder ancestry without ancestor items, collection-to-organization closure, matching duplicate structural records, omitted-versus-empty arrays and full unchanged clones; cover classifiable ownership objects with nonempty string `id`, collection `organizationId` absent/null/string, unsafe container/entry/reference shapes blocking both subset scopes and missing metadata remaining advisory.
- [X] T012 [P] [US2] Add selected-export regressions in `src/components/usability.test.ts` for cross-page/filtered selection, zero/invalid selection rejection, selected-membership/revision invalidation including undo/redo/index shifts, draft-safe cancellation, resulting errors versus excluded-only errors, warning source navigation and subset download never calling `markExported()` or changing selection/history/originals.
- [X] T013 [US2] Implement `ExportScope` and pure `prepareVaultExport()` selected/full preparation in `src/domain/vault.ts` with `document`, `itemSources`, `folderSources` and safe diagnostic keys per `specs/002-expand-export-review/data-model.md` sections 1–3; enforce “Canonical selected indexes are unique integers in source order; a zero-length or invalid selected request is rejected, not silently narrowed”, preserve source-relative order/all unknown values/absent arrays and block unsafe ownership narrowing without dropping, coercing, retaining wholesale or inventing records.
- [X] T014 [P] [US2] Add selected-export action, scope/count, ownership/preparation/advisory and export-local/source-numbering copy in `src/i18n/locales/en.json` and `src/i18n/locales/ar.json`; disclose preserved opaque root information and route-specific compatibility limits, keeping localized diagnostic keys and placeholders in sync.
- [X] T015 [US2] Wire Export selected and captured scope review in `src/App.vue`: enable only for nonzero selection, validate integer/in-range targets before guards, prepare a separate snapshot, parse/validate the actual result, invalidate on revision or exact membership change, serialize the prepared document only and never call `markExported()` for subsets; preserve whole-vault validation/drafts/navigation/history and reject download-time stale or blocked requests.
- [X] T016 [US2] Map prepared-result issues through source maps in `src/App.vue` and resolve equivalent current source Issues by message/severity/field/entry/source-index before using revision-bearing `inspectIssue()`; never pass compacted indexes or foreign Issue objects, leave root/preparation/unmapped diagnostics unlinked, close review only after accepted navigation and preserve export/name/item drafts when guards decline.
- [X] T017 [US2] Run EX-02/EX-03 selected/full regressions in `src/domain/vault.test.ts` and `src/components/usability.test.ts`; compare downloaded parsed subsets, loaded document, original bytes, undo/audit and dirty baseline using `specs/002-expand-export-review/quickstart.md`, and record results in `specs/002-expand-export-review/implementation.md`.

## Phase 5: US3 — Export a Folder Branch (P1)

**Goal**: Extend shared preparation/review to exact recursive actual/virtual branches without guessing ambiguous paths.
**Independent test**: Export parent/nested/virtual/empty branches in a synthetic hierarchy; verify exact members/records, zero-item review and unchanged source. In-branch duplicate paths block; unrelated duplicates do not activate that guard.
**Contracts**: EX-01–03; FR-006–013/020–022; SC-002–004/006–009.

- [X] T018 [P] [US3] Add hierarchy/export regressions in `src/domain/folders.test.ts` covering actual/virtual roots, empty branches/descendants, actual ancestor retention without items, absent ancestors, Work versus Workshop, literal case/whitespace/slash behavior, duplicate root/descendant paths with distinct IDs, outside-branch/sibling/ancestor-only duplicates, empty textual versus nontext names and independent duplicate-ID result validation; use the full ambiguity matrix in `specs/002-expand-export-review/quickstart.md`.
- [X] T019 [P] [US3] Add folder-export integration regressions in `src/components/usability.test.ts` for actual/virtual entry points, filters not narrowing membership, zero-item scope/count, localized ambiguity and unsafe metadata blockers, stale removed/changed targets, selection independence, draft-safe cancellation, subset dirty-baseline preservation and selected export through a duplicate-path source retaining its independent rules.
- [X] T020 [US3] Extend `prepareVaultExport()` folder scope in `src/domain/vault.ts` using existing `withinFolder()`/ancestor semantics; count exact actual branch paths before adding ancestors and block any duplicate without choosing/combining records; obey “A valid actual empty-string name uses its source index/direct folder assignment only, with no inferred descendants; duplicate raw empty-string names block that folder export”, “Missing/nontext names are structural errors, not additional empty-name records” and “Virtual paths must be existing nonempty grouping nodes”; preserve empty records/source order and apply US2 closure/validation unchanged.
- [X] T021 [P] [US3] Add folder/virtual/empty-scope labels and localized ambiguity/stale-target diagnostics in `src/i18n/locales/en.json` and `src/i18n/locales/ar.json`; explain zero-item scope without interpolating sensitive raw paths into notices/history and retain locale parity.
- [X] T022 [US3] Add actual/virtual Export folder actions beside existing folder management/navigation in `src/App.vue` and route captured revision/path/source-index targets through the shared export review; reject invalid targets before draft guards, validate actual indexes/paths or current virtual grouping membership, show explicit zero-item review and block ambiguity before any download without changing folders, selection or drafts.
- [X] T023 [US3] Execute folder matrix regressions in `src/domain/folders.test.ts` and `src/components/usability.test.ts` and downloaded-branch checks from `specs/002-expand-export-review/quickstart.md`; record exact membership, ancestors, blockers/advisories, unchanged originals/history and independent selected semantics in `specs/002-expand-export-review/implementation.md`.

## Phase 6: US4 — Compare and Resolve Possible Duplicates (P2)

**Goal**: Compare every candidate with privacy-safe literal differences and explicit guarded rename/delete/review-only ignore.
**Independent test**: Compare seeded nested/ordered/presence differences, including 100 candidates and repeated/missing IDs; inspect masked DOM before/after privacy changes, exercise cancellation/confirmation/undo and ignore lifetime, and reject stale actions without touching new occupants or drafts.
**Contracts**: DR-01–03; FR-014–022; SC-004–009.

- [X] T024 [P] [US4] Add raw comparison regressions in `src/domain/vault.test.ts` for unioned own properties, nested unknown keys/values, absent/null/empty containers, ordered/repeated array entries, object-key-order independence, names/types/folder/ownership/notes/dates/type-specific/URI/custom fields and complete 100-candidate membership; retain stored credential/URI differences without detection normalization or document annotation.
- [X] T025 [P] [US4] Add comparison DOM regressions in `src/components/security.test.ts` with synthetic credentials, notes, private SSH/type/custom/unknown values and sensitive imported keys: privacy-on must exclude raw values/labels/paths/fragments/lengths from visible/hidden text, form values, attributes and accessible descriptions; toggling privacy removes disclosures immediately and HTML/image/link-like content stays literal with no imported-value requests.
- [X] T026 [P] [US4] Add group/candidate integration regressions in `src/components/usability.test.ts` for every candidate/rule, repeated/missing IDs, same-rule identical-membership aliases versus different rules, name/delete/draft guard cancellations, failed mutations, exact rename/delete and undo, fewer-than-two refresh, Back/Escape/focus/name-draft discard, stale-before/after-prompt targets and review-only ignore/restore/reset lifetime without validation/history/export changes.
- [X] T027 [US4] Implement raw recursive comparison and privacy-safe projection helpers in `src/domain/vault.ts` per `specs/002-expand-export-review/data-model.md` section 6; enforce “Row identity: Numeric traversal ordinal”, own-key recursive equality with ordered arrays, fixed protected masks/value-free cues and generic imported-label ordinals, keep complete readable literal values when disclosed and exclude protected raw strings from the masked projection before DOM binding.
- [X] T028 [P] [US4] Add comparison rule/candidate/field/presence/difference labels, rename/delete/back/ignore/restore controls, safe validation/confirmation/audit messages, unavailable-target and ignore-lifetime help in `src/i18n/locales/en.json` and `src/i18n/locales/ar.json`; retain message keys in notices/history and never include protected values in interpolation.
- [X] T029 [US4] Add `src/components/DuplicateComparison.vue` using safe presentation rows only, complete candidate/action access and bounded keyboard-labelled scrolling; use numeric DOM identities, fixed masks/generic labels, literal text bindings, non-color difference cues, public-name bidi isolation and technical LTR values, with one candidate-name draft and revision-bound action events rather than direct writes; keep global Privacy Mode reachable and do not add `v-html`, imported links/images or arbitrary truncation/candidate caps.
- [X] T030 [US4] Extend `src/components/ReviewPanel.vue` with accessible non-nested group activation, inline comparison, active/ignored counts, restore-all and localized lifetime help; accept App-owned current revision/group/ignore state and forward guarded requests without modifying detection rules, validation warnings or creating a second ignore store.
- [X] T031 [US4] Own comparison requests and ignored signatures in `src/App.vue` using “Rule plus canonical source-index membership only, scoped to one revision” and “Must match an existing current group with at least two candidates”; validate revision/current group/candidate before prompts and recheck after them, commit rename only via `updateItem(document, index, { name })`, confirm exact single-candidate deletion via `deleteItems`, preserve cancelled/failed drafts and navigation, refresh/close on mutations, and clear ignores synchronously on commit/undo/redo/import/close but not view/preferences/privacy changes.
- [X] T032 [US4] Complete Back/Escape precedence, dirty comparison-name discard and connected-trigger/fallback focus handling in `src/App.vue` and `src/components/DuplicateComparison.vue`; reject stale requests before any editor draft prompt, preserve empty-name/existing unchanged imported-name semantics, immediately replace disclosure projection on privacy toggle and use restrained logical responsive rules in `src/style.css` only where existing utilities do not suffice.
- [X] T033 [US4] Run comparison/domain/security/integration regressions in `src/domain/vault.test.ts`, `src/components/security.test.ts` and `src/components/usability.test.ts`; confirm exact rename/delete/undo, all candidates/differences, masked DOM and ignore/restore/reset/export invariants and record DR-01–03 results in `specs/002-expand-export-review/implementation.md`.

## Phase 7: Polish and cross-cutting acceptance

**Goal**: Verify delivered stories without substituting source research, emulation or previous-feature evidence for actual gates.

- [X] T034 [P] Extend `src/i18n/i18n.test.ts` for new English/Arabic key/placeholder/fallback parity, translating existing notices/history after language changes and all language/theme combinations; verify only approved preferences restore and no export/comparison/ignore state persists.
- [X] T035 [P] Verify and extend affected preservation checks in `src/components/branding.test.ts` and `src/components/sorting.test.ts` for CSP `connect-src 'none'`, Vite logo/local fonts/license and selection/source-index independence; audit `index.html`, `public/fonts/OFL.txt` and preference readers/writers without changing favicon/bootstrap/storage policy.
- [X] T036 Run the real-browser matrix from `specs/002-expand-export-review/quickstart.md` on the production build: English/Arabic × light/dark, widths 320/768/1280/1440, actual 200% browser zoom, keyboard-only actions, focus/Escape/error labels, contrast, reduced motion and complete long-content/bounded scrolling without page overflow; record browser/window metrics, screenshots, failures/fixes and untested engines/hardware in `specs/002-expand-export-review/implementation.md`.
- [X] T037 Verify offline full/selected/folder export and comparison/rename/delete/ignore after local assets load, inspecting requests, storage and logs per `specs/002-expand-export-review/quickstart.md`; record zero automatic external traffic and only approved preference keys in `specs/002-expand-export-review/implementation.md`, with no raw secrets/filename drafts/group state in evidence outside synthetic fixtures.
- [X] T038 Run the unchanged 10,000-item/100-candidate fixture through selected/folder review, comparison opening and privacy toggle with one warm-up and five completed-interaction samples per `specs/002-expand-export-review/quickstart.md`; record machine/build/browser/hash/times, exact membership/all-candidate completion, draft/source preservation and exclusions in `specs/002-expand-export-review/implementation.md`, without fixed speed claims or marking previous T047/T048/T050 complete.
- [X] T039 Check availability of an already authorized disposable isolated local importer and follow `specs/002-expand-export-review/quickstart.md` section 7 for personal/organization/empty/combined/unsupported-type fixtures; record actual client/server versions/routes/results separately from pinned source analysis in `specs/002-expand-export-review/implementation.md`; if unavailable, record **not import-tested** and leave compatibility acceptance unverified, without deploying a server, using hosted services or promising lossless mixed-ownership import.
- [X] T040 Update implemented-behavior documentation in `README.md` and `CHANGELOG.md` with filename/platform limits, subset-not-sanitization disclosure, preservation/import-route limitations and review-only ignore lifetime; run `npm run lint`, `npm test`, `npm run build` and `git diff --check`, record final FR-001–022/SC-001–009 coverage and explicit exclusions in `specs/002-expand-export-review/implementation.md`, and leave prior-feature/checklist acceptance markers untouched unless their actual gates independently pass.

## Dependencies and execution graph

```text
T001 → T002 → T003 → T004
                    ↓
US1: (T005 ∥ T006) → T007; T008 ∥ T007 → T009 → T010
                    ↓
US2: (T011 ∥ T012) → T013; T014 ∥ T013 → T015 → T016 → T017
                    ↓
US3: (T018 ∥ T019) → T020; T021 ∥ T020 → T022 → T023

After foundation, US4 has no behavioral dependency on US1–US3:
US4: (T024 ∥ T025 ∥ T026) → T027; T028 ∥ T027 → T029 → T030 → T031 → T032 → T033

All story checkpoints → (T034 ∥ T035) → T036 → T037 → T038 → T039 → T040
```

- Default delivery order: foundation → US1 → US2 → US3 → US4 → final acceptance. US1 is the MVP; US2 reuses its review, US3 reuses US2 structural closure and source maps. US2/US3 are independently verifiable after their prerequisites, not standalone rewrites of export review.
- US4 can be developed after foundation independently of export behavior, but overlaps `src/domain/vault.ts`, `src/App.vue`, shared test files and both locales. Do not concurrently edit those files across stories; serialize integration or explicitly coordinate disjoint changes. The default sequential story order avoids conflicts.
- Tests precede matching implementation. T029 consumes T027/T028; T030 consumes T029; T031 consumes current group events/projection. T032 finishes integration before T033. T034/T035 depend on implemented stories. Acceptance follows fixes and the final production build, and must be rerun where fixes affect it.
- T039 is an evidence task, not permission for new infrastructure. An unavailable local importer is a documented acceptance gap, never a passing import test. Task completion as an investigation must not be represented as compatibility acceptance.

## Parallel execution examples per story

Only execute after prerequisites are complete; these examples permit parallel work, not automatic agent dispatch.

| Story | Disjoint ready work | Subsequent parallel opportunity |
| --- | --- | --- |
| US1 | T005 `src/domain/vault.test.ts` ∥ T006 `src/components/usability.test.ts` | T007 `src/domain/vault.ts` ∥ T008 both locale files, then T009 |
| US2 | T011 `src/domain/vault.test.ts` ∥ T012 `src/components/usability.test.ts` | T013 `src/domain/vault.ts` ∥ T014 both locale files, then T015 |
| US3 | T018 `src/domain/folders.test.ts` ∥ T019 `src/components/usability.test.ts` | T020 `src/domain/vault.ts` ∥ T021 both locale files, then T022 |
| US4 | T024 `src/domain/vault.test.ts` ∥ T025 `src/components/security.test.ts` ∥ T026 `src/components/usability.test.ts` | T027 `src/domain/vault.ts` ∥ T028 both locale files, then T029 |

Polish T034 and T035 also have disjoint files. Browser/performance checks are sequential to avoid concurrent machine load contaminating timing evidence.

## Implementation strategy

1. Establish baseline and trace shared guards. Ship US1 as the smallest useful MVP: safe naming on existing full export, preserving original downloads and drafts.
2. Add US2 pure structural closure and mapped result review; verify it before adding US3 branch membership/ambiguity. Do not restrict selected exports with folder-only path rules.
3. Add US4 comparison, safe projection and explicit resolution using existing validated mutations/history. No automatic merge or survivor choice; ignore never commits document history.
4. Run final locale/security/browser/offline/scale/compatibility checks and publish honest evidence. Use simple linear scans and recursive comparison first; only measured required-fixture failure justifies added indexing/virtualization.

## Coverage and format validation

| Requirements / criteria | Owning tasks |
| --- | --- |
| FR-001–004; SC-001 | T005–T010, T014–T015, T021–T022, T036, T040 |
| FR-005/008/009; SC-002/003 | T011–T017 |
| FR-006/007; branch-ambiguity SC-002 | T018–T023 |
| FR-010–013; SC-003/004/006 | T006, T009, T011–T023 |
| FR-014/015; SC-005 | T024, T027, T029–T033 |
| FR-016; masked SC-005 | T025, T027, T029, T032–T033, T037 |
| FR-017–019; SC-004/006 | T026, T028, T030–T033 |
| FR-020; SC-007 | Story UI/locale tasks, T034–T036 |
| FR-021; SC-008 | T025, T031, T034–T035, T037 |
| FR-022; SC-009 | Story regressions, T001–T004, T038–T040 |
| FR-011 executed compatibility evidence / exclusions | T039–T040 |

40 tasks total: setup 2, foundation 2, US1 6, US2 7, US3 6, US4 10, polish 7. Each task retains its completion checkbox, sequential ID, exact file path(s), and appropriate story label; `[P]` is limited to disjoint-file opportunities shown above. Executed evidence and explicit acceptance exclusions are recorded in `implementation.md`; task completion is not a claim of downstream import compatibility.
