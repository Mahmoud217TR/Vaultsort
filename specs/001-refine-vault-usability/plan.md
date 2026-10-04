# Implementation Plan: Refine Vaultsort Usability

**Branch**: `001-refine-vault-usability` | **Date**: 2026-10-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-refine-vault-usability/spec.md`

**Status**: Phase 0 research and Phase 1 design complete. Application implementation,
acceptance testing, and the Phase 2 task breakdown are not performed by this plan.

## Summary

Refine the incumbent Azure desktop utility without changing vault workflows, data, or privacy.
Keep search visible and disclose Filters, Sort, and Fields through labelled compact controls.
Replace the paired date toggle with three independent session-only fields; inspect full notes
through one privacy-gated native popover with the existing dialog as its compatibility fallback.

Extend current validation issues with typed field hints and revision-stamped navigation requests,
routing table/review/export warnings through one guarded App-level handler. Recognize SSH type 5
consistently in the existing domain helpers, navigation, filters, labels, and validation. Reuse
the preference bootstrap/module, semantic CSS tokens, bundled assets, and in-memory history.
No dependencies, UI framework migration, backend, or new persistence are planned.

The pre-refinement 10,000-item browser baseline is recorded in [baseline.md](baseline.md).
Comparable operations must meet its five-run medians, not an invented time limit. Browser
diagnosis traced the reported overflow to an absolute-positioned hidden Notes label escaping
the editor scroll region; establish that region's positioning context instead of global clipping.

## Technical Context

**Language/Version**: TypeScript `~5.9.2`, Vue single-file components, browser JavaScript/CSS.
Development Node.js follows `package.json`: `^22.13.0 || ^24.0.0 || >=26.0.0`.

**Primary Dependencies**: Existing Vue `^3.5.22`, vue-i18n `^11.4.13`, Vite `^7.1.7`,
Tailwind CSS `^4.1.13`; package ranges are reported here, not asserted installed versions.
Use the lockfile with `npm ci`. Native forms, dialog, Intl, and feature-detected Popover API.

**Storage**: In-memory vault/original bytes/drafts/history/view state only. Existing LocalStorage
keys `vaultsort.language` and `vaultsort.theme` remain the sole persisted state for this feature;
only `public/preferences.js` reads and `src/preferences.ts` writes them. No session storage.

**Testing**: Existing Vitest `^5.0.3`, Vue Test Utils `^2.4.6`, jsdom `^27.0.0`, ESLint,
and vue-tsc/Vite build. Real-browser checks cover rendering, focus, native popovers and timings.
Browser automation may be used as an external validation tool; no new app/test dependency
or CI/deployment system is required by this feature.

**Target Platform**: Static local/hosted browser application; desktop-first, usable at widths
320, 768, 1024, 1280, and 1440 pixels. Validate current stable Chromium, Firefox, and Safari
where available, recording exact versions and any unavailable engines as verification gaps.
Exercise the dialog fallback even on browsers with native popovers. This is a verification
matrix, not a new claim of audited browser compatibility.

**Project Type**: Single Vue frontend application; no server API or separate backend project.

**Performance Goals**: Synthetic 10,000-item vault; median completed-render time over five
repetitions of filtering, sorting, and comparable date visibility changes must not exceed the
pre-refinement median under identical conditions (SC-011–012). Record new Notes interaction
timings without fabricating a baseline. Preserve 75-row pagination; no speculative virtualization.

**Constraints**: CSP `connect-src 'none'`, no HMR socket, no imported HTML or remote images,
Privacy Mode on by default and no sensitive DOM values while masked. Preserve opaque JSON,
original bytes, export guards, bounded history, and discard confirmations. English/Arabic,
LTR/RTL, both themes, WCAG AA contrast, keyboard access, and reduced motion are mandatory.
At 1280 × 800, show at least eight complete default rows and keep collapsed list controls
within 112 pixels. Do not suppress overflow by hiding unreachable content globally.

**Scale/Scope**: One active in-memory vault; 10,000 items is an acceptance dataset, not an import
limit. Six user stories, 26 functional requirements, 12 measurable outcomes. Work is limited
to the existing import/workspace/sidebar/table/editor/review/dialog flows and requested links.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / boundary | Pre-research gate | Post-design gate and evidence |
| --- | --- | --- |
| I. Privacy | PASS: no transmission or new persistence is needed | PASS: notes are conditionally mounted; transient state stays local; fixed links require explicit navigation |
| II. Preserve user data | PASS: changes are view-only except existing explicit edits | PASS: source-index identity is retained, stale requests expire, originals/history/export validation remain intact |
| III. Honest security claims | PASS: warning placement may change without weakening guarantees | PASS: import/summary/export retain plaintext guidance; import explains hosted trust; no secure-erasure claim |
| IV. Consistent accessible UI | PASS: canonical incumbent design remains binding | PASS: tokens, branding, Inter, locales, RTL, native controls and focus/dismissal contracts are preserved |
| V. Simplest correct solution | PASS: current stack covers the feature | PASS: two focused presentation components at most; no global overlay manager, registry framework, new store or dependency |
| VI. Verifiable changes | PASS: existing checks and synthetic test data cover the scope | PASS: quickstart and contracts define regression, browser, density and comparative performance evidence |
| Product boundaries | PASS: no accounts, synchronization, backend or new credential editing | PASS: SSH discovery only; GitHub anchors are not external runtime integrations |

All gates pass at design level; this does not mean implementation acceptance has passed.
No amendment or exception is needed. The constitution's pending ratification date and broader
storage-guidance reconciliation are existing governance follow-ups, not feature blockers:
this design uses neither additional preferences nor session storage.

## Project Structure

### Documentation (this feature)

```text
specs/001-refine-vault-usability/
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── baseline.md
└── contracts/ui-contracts.md
```

### Source Code (repository root)

```text
index.html                         # Existing CSP/bootstrap integration; keep intact
public/preferences.js              # Existing preference reader
public/fonts/OFL.txt               # Existing distributed font licence; keep intact
src/
├── App.vue                        # View state, guarded navigation, toolbar/links
├── style.css                      # Shared tokens, density, scroll ownership
├── preferences.ts                 # Existing preference writer and reactive state
├── branding/vaultsort-logo.svg     # Existing immutable branding
├── domain/
│   ├── vault.ts                    # Existing types/validation/sort; extend locally
│   └── vault.test.ts
├── composables/useVault.ts         # Existing snapshots; no replacement store
├── components/
│   ├── ItemEditor.vue
│   ├── ReviewPanel.vue
│   ├── Modal.vue                   # Existing fallback dialog
│   ├── Icon.vue
│   ├── Tooltip.vue                 # Planned small shared action-help component
│   ├── NoteInspector.vue           # Planned single full-note popover/fallback
│   ├── usability.test.ts           # Planned focused cross-component regressions
│   ├── sorting.test.ts
│   ├── security.test.ts
│   └── branding.test.ts
└── i18n/
    ├── index.ts
    ├── i18n.test.ts
    └── locales/{en,ar}.json
docs/design-system.md              # Canonical visual authority
README.md / CHANGELOG.md            # Update implemented behavior during implementation
```

**Structure Decision**: Extend the existing files rather than extracting an application shell,
new state framework, or generic control library. Keep disclosure forms in App.vue. The two
planned components isolate repeated accessible help and the sensitive note lifetime; they do
not introduce a general overlay platform. Keep domain and navigation regression tests beside
the existing suites. `tasks.md` is intentionally absent until `/speckit.tasks`.

### Phase 0 — Research decisions

[research.md](research.md) resolves control disclosure, native note inspection/fallback,
tooltip semantics, issue targeting/freshness, SSH classification, preference restoration,
scroll diagnostics, GitHub boundaries, and the baseline method. Research is based on current
source plus native-platform/upstream references. [baseline.md](baseline.md) records real-browser
pre-refinement timing and the bounded temporary-style overflow diagnosis; no feature is implemented.

### Phase 1 — Design outputs

- [data-model.md](data-model.md): view-only fields, issue hints and revision envelope, existing
  identity/snapshot invariants, note lifetime, and preference state transitions.
- [contracts/ui-contracts.md](contracts/ui-contracts.md): seven user-facing/internal UI contracts,
  including event payloads, keyboard behavior and unchanged import/export boundaries; no API.
- [quickstart.md](quickstart.md): runnable setup/fixtures, regression scenarios, real-browser
  measurements, performance comparison, and evidence required before implementation completion.
- [baseline.md](baseline.md): recorded old-build source/environment/dataset identifiers, five-run
  timing samples, overflow reproduction/root-cause evidence and verification exclusions.

Design dependencies: retain the untouched baseline/build before source edits; retain fixed selection
semantics when changing controls; route all warning entry points before field-focus polish;
clear note/issue state on document replacement and privacy transitions. Fix the demonstrated
hidden-label containing block first, then verify the full matrix rather than blindly clipping.

No source files or tests are implemented in this planning phase. There are no unresolved
technical decisions requiring another clarification round.

## Complexity Tracking

No constitution violations or complexity exceptions. Pagination, full-document history, and
linear search remain in place; only change a demonstrated hot path if measured baseline
comparison shows a regression. Do not add workers, virtualization, persistent identity, or
cross-snapshot remapping preemptively.
