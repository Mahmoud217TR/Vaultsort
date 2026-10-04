# Implementation evidence: Expand Export and Duplicate Review

## Baseline and setup — T001–T004

- 2026-10-04, Linux, branch `feat/exports`. Initial git status contained only the untracked new feature directory. No reset, branch switch, commit or push performed.
- Baseline lint, 97 tests in 8 suites and production build pass. Prior usability T047/T048/T050 remain separate and unchecked.
- `.gitignore` and flat ESLint ignores cover dependencies/builds/coverage/environments/logs/temp/editor files. No Docker/Prettier/Terraform/Helm setup detected; not an npm-published library. No ignore additions needed. No extension hook file found.
- Read design system, constitution and feature design artifacts. Quickstart generator re-executed outside production assets in `/tmp/opencode/vaultsort-export-review-validation/`: SHA-256 `25f77e6cc2d9697220939019322e61f5d8da21eb27c82c6fd361e8ddc5113110`, 10,000 items, 5,000 Work members, 100 credential candidates, selection `[103,0,9,4]` yields `[0,4,9,103]`.

### Source boundaries and regression mapping

- EX-01: toolbar/shortcut call `requestExport()`; block item drafts/folder dialogs without resetting them. `download()` owns Blob URLs/requested names; original download retains source bytes/name. Domain name tests and usability FileReader/download stubs cover content/name/guard invariants.
- EX-02/03: pure cloning/hierarchy/validation in domain. `run()` calls `discardDraft()` (increments editor version even without a dirty draft), so cannot prepare exports. `inspectIssue()` requires the exact current source Issue and revision: subset indexes must map to equivalent source issues first. Existing usability stale/cancellation/page/selection harness covers integration.
- DR-01/03: broad save/delete handlers use mutable current/selection and cannot consume captured candidate requests. `useVault.commit()` clones before operation and records only changed successful results; undo/redo replace references. App's synchronous revision identifies source indexes; IDs do not. Review must receive App's duplicate bundle, while validation/quality keep unignored results.
- DR-02: use security DOM/attribute/form assertions and synthetic secrets; masked projections must exclude imported protected keys as well as values. No HTML/link/image rendering.
- Folder helpers preserve actual duplicates, create virtual grouping rows and use literal case-sensitive segment boundaries; empty parent has no descendants. Validation detects duplicate IDs, not duplicate paths.
- CC-01: existing locale/placeholder/theme, branding/CSP/license and sorting suites cover static/runtime invariants. Native downloads, actual zoom, dimensions, offline requests and timings require browser evidence, not jsdom.

## Acceptance status

All 40 implementation/evidence tasks completed. The implemented workflows pass the synthetic regression and Chromium acceptance checks below. **Not import-tested**: downstream compatibility acceptance remains unverified. Source-derived compatibility analysis is not import execution. Checklist and prior-feature acceptance markers remain untouched.

## US1 — T005–T010

- Added six synthetic tests before implementation. Red run: five intended failures (missing filename helpers/input); failed-download/folder-draft baseline check already passed. Green run: 103 tests / 8 suites; lint and production build pass after TypeScript narrowing fixes.
- Full review captures a parsed clone/revision and validates the proposed document. Names are transient, invalid raw input is retained, UTF-8 byte length is not limited, source-derived defaults have bounded suffix space. Full download uses displayed name; original bytes/name remain untouched. Issue links resolve equivalent current source issues rather than forwarding snapshot objects.
- Executed Chromium 153.0.8010.12 on production preview: keyboard open/download, invalid device-name rejection, error-description association, Arabic `تقرير.json` requested/suggested download equality, Escape dismissal and restored trigger focus pass. The first browser probe checked DOM removal before Vue's render settled; corrected probe waits for dialog detachment. No full locale/width/zoom matrix claimed here.

## US2/US3 — T011–T023

- US2 red: six failures for missing preparation helper/action. US3 red: five failures for missing branch handling/action. Added pure closure/omitted arrays/unsafe metadata/source-map and hierarchy/ambiguity/empty-name/independent-ID-validation tests, with integration coverage for selected ordering, result-only errors, mapped warning focus, stale selection, guards, dirty baseline and actual/virtual branches.
- Lint/build pass; 113/114 tests passed initially, with one fixture query selecting alphabetically earlier Virtual/Empty instead of Work. Corrected the query to the exact title Work; all 22 usability tests pass. Domain suites pass (31 vault, 13 folders); no source defect was hidden by changing expectations.
- Chromium production-download validation on the unchanged scale fixture: exact selected order `[0,4,9,103]`, all 5,000 Work items deep-equal in source order, opaque roots equal, original download byte-exact, history remains zero and four selected items retained. Initial validation mistakenly used imported ID lookup and failed on intentional repeated IDs; corrected the validator to explicit source indexes/branch assignments.
- Subsets never mark the whole vault exported. Unsafe ownership narrowing blocks with a source-safe diagnostic; absent lists stay absent. Branch duplicate-path guard runs before ancestor closure, not for selected scope. Route/combined-list/empty-envelope advisories do not claim executed imports.

## US4 — T024–T033

- Seven intended red failures recorded in `us4-red.log`; raw recursive comparison/projection, DOM privacy and guarded resolution then pass. All candidates are retained, including repeated/missing IDs and multi-URI aliases. Same-rule identical memberships coalesce only in review; different rules remain separate, and validation/detection are unchanged.
- Comparison enumerates own nested properties and ordered arrays without credential/URI normalization; object-key ordering is ignored. Numeric row/candidate identity, text Equal/Different and explicit presence/container states retain complete literal values. Protected values and imported keys are masked before component binding; no imported markup, URLs or images are rendered as active content.
- App owns revision/group/candidate checks before and after prompts, exact name-only commits, single-item destructive confirmation and history. Regressions cover cancelled item/name/delete guards, failed mutation with both drafts retained, post-prompt undo, stale callbacks after delete/undo/redo/replacement, fewer-than-two groups, exact undo and ignore/restore.
- Eager safe projection releases disclosed rows on privacy/revision/close even if Review is unmounted; no raw comparison cache is retained. Back/Escape/name-discard and focus fallback reuse native controls. Global Delete is blocked within comparison to prevent accidental broad deletion. Candidate-name input focus and rename-cancel focus are explicit.
- Ignore is App-owned in-memory group/rule state. Remount/view/language/theme changes retain it; any committed document change, undo/redo/replacement/close clears it synchronously. Export/validation/history remain independent.

## Cross-cutting acceptance — T034–T040

### Regression, brand and localization

- Final `npm run lint`, `npm test` (**138 tests / 8 suites**), `npm run build` and `git diff --check` pass. Added locale/template coverage for DuplicateComparison and four full locale/theme export/ignore/rename/translated-notice/history scenarios. Only the approved language/theme keys appear in storage.
- Existing branding (3), sorting (11), security, folder and import/editor suites pass; new cross-page subset assertions extend source-index/sort coverage in the existing usability harness. Logo geometry/hash, favicon/bootstrap, CSP `connect-src 'none'`, local font and preference readers/writers are unchanged. `public/fonts/OFL.txt` and the built `dist/fonts/OFL.txt` share SHA-256 `262481e844521b326f5ecd053e59b98c8b2da78c8ee1bdbb6e8174305e54935a`.
- Final production assets: `index-D4VpWvZR.js` SHA-256 `c0112a0f08657e97781fd494716722e443d48502c733e2bc34f6d1cf2eb6d4f9`; `index-Bu0pkcZR.css` SHA-256 `752293d4332bbae7fe5a7910c05a5c5ff8e349748f543d5f3dc04c2cbb926f8b`. Vite 7.3.6, Node v24.21.0.

### Executed browser matrix

- Chromium **153.0.8010.12**, production preview at loopback, reduced-motion enabled. **32 cases**: English/Arabic × light/dark × measured CSS widths 320/768/1280/1440 × native zoom 1/2. Chrome extension `chrome.tabs.setZoom/getZoom` confirms native 200%; window bounds, DPR, inner dimensions and scroll widths are recorded. No page horizontal overflow; all measured widths equal requested widths.
- Keyboard-only interactive actions after synthetic upload: full filename validation/download, selected/folder export, group activation, privacy toggle, scrolling, rename, declined/accepted exact deletion, ignore and restore pass at every combination. Earlier dedicated browser probe verified Escape dismissal/restored export trigger and associated filename-error descriptions; regression tests cover comparison Escape/draft cancellation and mapped source-warning focus.
- Long mixed-script candidate names/notes/unknown values stay literal and complete in bounded keyboard-focusable scrolling; all three candidates and every action are reachable. Text contrast scan minimum **4.7588:1**, no eligible-text failures in export/comparison. Synthetic screenshots inspected at desktop and native-zoom narrow RTL; screenshots are examples, not a cross-engine claim.
- Artifacts under `/tmp/opencode/vaultsort-export-review-validation/`: `browser-matrix.mjs`, `browser-matrix.json`, `browser-matrix-final.log`, `comparison-*.png`. Initial Playwright screenshot clipping at native zoom was corrected by direct CDP surface capture; no app workaround or CSS zoom was used. Matrix reran on the final production assets.

### Offline and scale

- `offline-scale.mjs`, `offline.json` and `offline-scale.log`: after local assets load, network is disabled. Full/selected/folder exports match expected JSON; comparison privacy/rename/delete/ignore/restore/undo complete. External request list, console/page-error list, localStorage and sessionStorage are empty. Locale tests separately verify only `vaultsort.language`/`vaultsort.theme` persist when explicitly selected. No real vault data used.
- Final scale run: Linux 7.0.0-34-generic, Intel Core i7-14700HX, Chromium 153.0.8010.12, 1440×900, English/light. Unchanged fixture hash as above, 10,000 items/5,000 Work members/100 candidates. One warm-up, five samples per interaction, measured around click-to-completed render plus two animation frames; browser automation overhead is included.

| Interaction | Five observed samples (ms, rounded) | Median (ms, rounded) |
| --- | --- | ---: |
| Selected review | 97.09, 80.72, 85.17, 74.77, 85.23 | 85.17 |
| Folder review | 114.10, 118.30, 118.41, 114.18, 117.80 | 117.80 |
| Comparison open | 101.02, 118.11, 102.18, 102.09, 98.37 | 102.09 |
| Privacy toggle | 97.24, 97.70, 97.09, 97.54, 97.53 | 97.53 |

- `scale.json` holds unrounded timings/environment/hash. Actual selected download equals `[0,4,9,103]`; actual Work download equals all 5,000 source-assigned items in order. All 100 candidates render repeatedly, an existing item draft survives comparison/back, full export equals the source, original bytes equal the uploaded bytes, history stays zero. Startup/import/disk writes/correctness assertions are excluded from timings; no fixed speed threshold or prior timing gate is asserted.

### Compatibility availability and exclusions

- Read-only `command -v docker podman bw` / Docker image-list availability check found no running Bitwarden/Vaultwarden importer and no `bw` or Podman executable. No already authorized disposable isolated import destination was supplied. No infrastructure was deployed, unrelated services contacted, credentials used or hosted import attempted.
- **Not import-tested** for personal, organization, empty, combined-list or unsupported-type routes. No executed client/server versions or import results exist. Source pins from research remain Bitwarden clients `245879a5e3269da22197d3306a2f8b0355794095` and Vaultwarden `f4f1a8e105ec5fd72ec1dd1bed800bcf44deae2b`; these are analysis only. Lossless mixed-ownership import has no demonstrated route.
- Firefox, Safari, physical touch hardware, filesystem-specific name limits and representative-user studies remain unverified. Native browser suggested-name checks do not prove browser/OS on-disk name equality. This feature does not complete prior usability T047/T048/T050.
- Pre/post implementation hook checks: `.specify/extensions.yml` absent; no extension hooks registered/executed. Read-only quality checklist remains 16/16, unmodified. No commit, push, reset or branch switch performed.

### Final requirement / success-criterion coverage

| Coverage | Implemented evidence | Boundary |
| --- | --- | --- |
| FR-001–004 / SC-001 | Filename domain and named-review regressions, keyboard/native downloads, filename/content/original equality | Saved-name/byte-limit outcomes remain browser/filesystem-controlled |
| FR-005–009 / SC-002 | Pure selected/folder closure, literal hierarchy/duplicate-branch matrix, actual selected and 5,000-member downloads | Opaque root metadata intentionally retains out-of-scope information |
| FR-010–013 / SC-003–004 | Prepared-output parse/validation, blockers/advisories, source maps, dirty/history/draft guards and revision invalidation | FR-011 format/preservation verified; downstream import compatibility **unverified** |
| FR-014–016 / SC-005 | Own-value recursive comparison, literal/masked DOM checks, all 100 candidates | No automatic merge; privacy does not modify the source |
| FR-017–019 / SC-004/006 | Exact rename/delete/undo, failed/cancelled/stale actions, group/rule ignore/restore/reset | Ignore remains review-only and never suppresses validation |
| FR-020 / SC-007 | Four locale/theme regressions and 32 native-zoom keyboard/contrast/width cases | Chromium only; other engines/touch unverified |
| FR-021 / SC-008 | Offline exports/resolution, empty network/log/storage evidence, approved preference restoration | No vault persistence or external runtime assets |
| FR-022 / SC-009 | 138 passing synthetic tests, production build, source/original/draft/history checks and scale completion | No fixed performance guarantee, security audit or participant/sign-off claim |

README and CHANGELOG describe delivered behavior and the same limitations. All tasks are execution/evidence completion markers, not downstream compatibility or prior-feature acceptance sign-off.
