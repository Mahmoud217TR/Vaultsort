# Implementation Plan: Expand Export and Duplicate Review

**Branch**: `feat/exports` | **Date**: 2026-10-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-expand-export-review/spec.md`.
Feature discovery uses `.specify/feature.json`; setup reported the feature identifier
`002-expand-export-review` as `BRANCH`, but `git branch --show-current` reports `feat/exports`.
No branch change is part of this plan.

**Status**: Phase 0 research and Phase 1 design complete; implementation and acceptance are not performed here.

**Clarification refresh**: Incorporates all three accepted 2026-10-04 answers: block unsafe
ownership-metadata narrowing, keep a 200-code-point filename limit without a byte limit or OS-name
guarantee, and block folder exports with duplicate full paths inside the requested branch.

## Summary

Extend the existing local export review with a validated filename and full/selected/folder
scopes. Prepare a separate document by cloning the source and reducing only understood lists,
retaining referenced folder/ownership structures, source-relative order and opaque root data.
Validate that resulting document, not the unrelated excluded records, and map actionable subset
warnings back to the original source items. Download preparation never commits history or discards drafts.
Before preparing a folder result, check the requested branch for duplicate actual full paths and
reject ambiguity rather than combining folders. Outside-branch duplicates do not trigger this
guard; selected exports retain their exact-membership/result-validation policy.

Turn existing duplicate groups into an inline comparison within Review, with literal field
differences, privacy-gated values and explicit rename/delete/ignore. Reuse current domain operations,
revision-based identity, confirmations, undo, Modal, Tooltip, native controls and locale patterns.
One focused comparison component is sufficient; no new library, store, backend or persistence.

## Technical Context

**Language/Version**: TypeScript 5.9.3 installed (`~5.9.2` package range), Vue single-file
components and browser JavaScript/CSS. Node engine requirement remains
`^22.13.0 || ^24.0.0 || >=26.0.0`; use the existing lockfile.

**Primary Dependencies**: Installed Vue 3.5.43, vue-i18n 11.4.13, Vite 7.3.6 and Tailwind 4.3.3.
Reuse native input/select/dialog/download behavior, Intl, existing semantic CSS and local assets.
No dependency additions or framework changes.

**Storage**: In-memory active vault, originals, history, export review/filename, comparison and
ignored-group state only. Only `vaultsort.language` and `vaultsort.theme` persist through existing
reader/writer modules. No session storage or file persistence other than explicit downloads.

**Testing**: Installed Vitest 5.0.3, Vue Test Utils 2.5.1 and jsdom 27.4.0; existing domain,
component, security, branding and i18n suites. Native focus, downloads, zoom and layouts require
real-browser validation outside app dependencies. Existing lint and vue-tsc/Vite build remain gates.

**Target Platform**: Static desktop-first browser app, usable offline after assets load.
Verify English/Arabic × light/dark at 320/768/1280/1440 widths and actual 200% page zoom.
Record actual Chromium/Firefox/Safari versions and unavailable engines rather than claiming parity.

**Project Type**: Single frontend application with UI and JSON document contracts; no external API.

**Performance Goals**: Operable selected/folder exports from 10,000 synthetic items and complete
comparison of at least 100 candidates, with observed completed-interaction times recorded.
No arbitrary latency threshold or speculative virtualization. Preserve existing 75-row list
pagination. Prior feature performance and participant gates are not waived by this work.

**Constraints**: CSP `connect-src 'none'`; no vault logging, imported HTML, remote images or runtime
requests. Masked comparisons mount no protected values/labels. Preserve originals, unknown JSON,
ownership, source order, drafts, existing export validation and undo. Read `docs/design-system.md`
before UI edits; retain branding, local Inter/license, locale parity and logical RTL styles.
Subset preparation blocks unclassifiable ownership metadata instead of dropping or retaining it
wholesale. Filenames use the confirmed 200-code-point rule with no added byte limit; the displayed
app-requested name is guaranteed, not the OS's eventual saved-name behavior.

**Scale/Scope**: One in-memory vault, four stories, FR-001–022 and SC-001–009. Existing
export modal, bulk actions, folder controls and Review are the integration surfaces. Compatibility
is limited to evidenced JSON/import routes, not universal organization-import acceptance.

## Constitution Check

*GATE: All pre-research constraints were checked before dispatching research. Re-evaluate the
post-design column after the design artifacts are complete; these are design gates, not test results.*

| Principle / boundary | Pre-research gate | Post-design gate |
| --- | --- | --- |
| I. Privacy | PASS: no transmission or extra storage needed | PASS: all transient state stays in memory; comparison projects masked data before rendering; CSP unchanged |
| II. Preserve data | PASS: subset membership is explicit user intent, not cleanup | PASS: source clone, exact retained order/values, source-index mapping, result validation, blocking ambiguous branches/unsafe metadata and guarded undoable edits |
| III. Honest security | PASS: exports remain plaintext; subset is not anonymization | PASS: opaque-root disclosure, app-requested filename boundary and route-specific compatibility evidence; no OS-name, encryption, secure erasure or universal import claims |
| IV. Consistent accessible UI | PASS: incumbent visual system remains binding | PASS: native labelled filename/actions, inline comparison, tokens, both locales/themes, keyboard/zoom/focus contracts |
| V. Simplest correct solution | PASS: installed stack/domain patterns cover scope | PASS: one comparison component and focused pure domain helpers; no store/registry/merge engine/dependency |
| VI. Verifiable changes | PASS: synthetic tests can cover transformations and privacy | PASS: quickstart defines exact membership, filename, stale-target, preservation, browser and compatibility evidence |
| Product boundaries | PASS: no automatic credential edits or remote service | PASS: explicit rename/delete only, review-only ignores, no credential merge or export-format conversion |

No constitutional exception or amendment is required. This plan uses a stricter in-memory-only
policy even where the constitution permits non-sensitive session state. Existing ratification-date
and storage-guidance follow-ups remain untouched. Prior feature acceptance gaps remain separate.

## Project Structure

### Documentation (this feature)

```text
specs/002-expand-export-review/
├── spec.md
├── checklists/requirements.md       # Existing quality checklist; not an implementation marker
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/ui-contracts.md
```

`tasks.md` belongs to `/speckit.tasks` and is intentionally not created here.

### Source Code (repository root; planned integration)

```text
src/
├── App.vue                         # Export/compare requests, freshness, guarded mutations
├── style.css                       # Existing tokens and bounded responsive comparison
├── domain/
│   ├── vault.ts                    # Pure filename/subset/difference helpers, existing validation
│   ├── vault.test.ts               # Synthetic transformation and non-mutation coverage
│   └── folders.test.ts             # Existing hierarchy tests reused/extended where affected
├── composables/useVault.ts         # Reuse commit/undo/revision source, no replacement store
├── components/
│   ├── ReviewPanel.vue             # Group comparison entry, counts/ignore restore
│   ├── DuplicateComparison.vue     # Planned single focused presentation component
│   ├── ItemEditor.vue              # Existing editor/privacy behavior retained
│   ├── Modal.vue                   # Existing export dialog reused
│   ├── Tooltip.vue                 # Existing static localized help reused
│   ├── usability.test.ts           # Export/review/draft/stale integration cases
│   ├── security.test.ts            # DOM secrecy, literal data, external-traffic assertions
│   ├── sorting.test.ts             # Selection/order/identity regression where affected
│   └── branding.test.ts            # Existing CSP/branding/font checks retained
└── i18n/
    ├── locales/{en,ar}.json         # All new copy, validation, help and audit keys
    └── i18n.test.ts                # Locale/placeholder/preference invariants
index.html / public/fonts/OFL.txt    # Preserve CSP/bootstrap and production license
README.md / CHANGELOG.md             # Update only once behavior is implemented
```

**Structure Decision**: Reuse App's existing modal/download and guarded mutation paths. Keep
transformations in `src/domain/vault.ts`, as project instructions require. One inline comparison
component separates privacy-sensitive rendering from Review group navigation; no standalone
export framework, ownership adapter, new composable or generalized JSON editor is justified.

### Phase 0 — Research

[research.md](research.md) records source-flow and authoritative-format research, filename
rules, metadata closure, result-to-source warning mapping, safe draft handling, comparison
equality/masking, ignore lifetime and route-specific compatibility limitations. All design
uncertainties are resolved there; future executed compatibility checks remain evidence gates.
The refresh retains existing technology choices and source pins, with focused research on the
confirmed branch-local duplicate-path guard rather than redoing unrelated upstream research.

### Phase 1 — Design outputs

- [data-model.md](data-model.md): export scope/prepared document/filename state, candidate/group
  identity, difference projection and revision-bound ignore lifetimes.
- [contracts/ui-contracts.md](contracts/ui-contracts.md): UI action boundaries, pure helper
  semantics, privacy/focus/cancellation behavior and result validation/source mapping.
- [quickstart.md](quickstart.md): runnable checks, synthetic fixture inventory, exact expected
  subsets, browser/offline/zoom/difference matrices and compatibility evidence procedure.

Stop after design. Tests precede implementation in the next task breakdown. No feature source
code, test suite, compatibility import run or acceptance completion is produced by this plan.

## Complexity Tracking

No constitution violations or exceptions. Linear subset scans and recursive comparison of
JSON data are bounded by actual imported data; add indexing/virtualization only if the required
10,000-item/100-candidate checks demonstrate a need. No speculative abstraction is approved.
