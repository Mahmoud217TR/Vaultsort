---
description: "Executable story-organized tasks for automated verification and an optional hosted demo"
---

# Tasks: Automated Verification and Optional Hosted Demo

**Input**: Design documents from `specs/003-add-ci-pages-demo/`.
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [UI contracts](contracts/ui-contracts.md),
[automation contracts](contracts/automation-contracts.md), [quickstart.md](quickstart.md).

**Tests**: Explicitly required by FR-019 and the constitution. Add regressions first and
record the intended red outcome before implementation; use existing Vitest/native tooling.
**Organization**: User-story phases are independently verifiable increments, not permission
to publish remotely. US3 depends on the verified CI and hosted gate from US1/US2.
**Branch**: Existing `chore/pages-ci`; feature-directory discovery is independent of branch naming.

## Format: `[ID] [P?] [Story] Description`

- Every execution task starts with `- [ ] Tnnn`; story-phase tasks also have `[USn]`.
- `[P]` means disjoint files and no dependency on its parallel partner, after stated prerequisites.
- All paths below are repository-relative unless explicitly under `/tmp/opencode/`.
- Mark only actually completed tasks during implementation. Spec-quality checklists and prior
  performance/participant/import gates are not implementation completion markers.
- No new library, backend, YAML parser, consent store, runtime request or remote setting change
  is needed. No automatic commit, push, branch switch or destructive reset is requested.

## Phase 1: Setup

**Purpose**: Establish current source/tooling baseline and evidence boundaries without altering user work.

- [X] T001 Read `AGENTS.md`, `docs/design-system.md`, `.specify/memory/constitution.md` and `specs/003-add-ci-pages-demo/plan.md`; inspect non-destructive git status and supported Node/lockfile environment, run `npm ci`, `npm run lint`, `npm test`, `npm run build` and `git diff --check`, and create `specs/003-add-ci-pages-demo/implementation.md` recording actual baseline, failures and authorization exclusions without completing prior-feature acceptance gates.
- [X] T002 Trace current file-choice/read/version/abort and every draft/unsaved guard in `src/App.vue` and `src/composables/useVault.ts`, native dialog behavior in `src/components/Modal.vue`, assets in `vite.config.ts`, `index.html` and `public/site.webmanifest`, and storage scans in `src/components/security.test.ts`; revalidate official action pins/Node24 runner compatibility from `specs/003-add-ci-pages-demo/research.md` R4 and record exact reuse points, direct-input bypass and upstream evidence in `specs/003-add-ci-pages-demo/implementation.md` without running hosted code or changing repository settings.

## Phase 2: Foundational prerequisites

**Purpose**: Reconcile the narrow session exception and isolate tests before hosted-state code.
**Blocking**: Complete this phase before any story; retain every existing vault-storage restriction.

- [X] T003 Reconcile storage guidance in `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md` and `README.md` per `specs/003-add-ci-pages-demo/plan.md` Constitution Check: localStorage stays limited to existing language/theme reader/writer; only `src/hostedDemo.ts` may own `vaultsort.hostedDemoAcknowledged:<BASE_URL>` equal to `'1'` in hosted tab-session storage; forbid every vault-derived/other application value and local-build flag access. Do not claim the helper or deployment already exists, broaden consent storage or amend the constitution unnecessarily.
- [X] T004 Extend isolation in `src/test.setup.ts` for session state and env stubs without reading preferences outside their approved modules; prepare synthetic import fixtures/evidence outside builds at `/tmp/opencode/vaultsort-pages-validation/` and record their identity in `specs/003-add-ci-pages-demo/implementation.md`; keep `public/` and `dist/` free of fixture/vault data and reuse current mount/FileReader/dialog test patterns.

**Checkpoint**: Policy permits exactly the specified fixed non-sensitive session decision; existing tests remain isolated and vault storage/network bans remain intact.

## Phase 3: US1 — Verify Every Main-Bound Change (P1) — MVP

**Goal**: Mandatory read-only main-bound CI independent of Pages activation.
**Independent test**: Inspect/test the real workflow for both event types and ordered fail-stop checks; locally run the four commands. Actual hosted runs/failure injection require authorization and are recorded separately.
**Contracts**: CI-01; FR-001–002/005/019; SC-001/008.

### Tests before implementation

- [X] T005 [US1] Add CI contract regressions in `src/ci/workflows.test.ts` for `.github/workflows/ci.yml`: push/main and pull_request/base-main updates including forks, no path filters/privileged triggers, exact ordered `npm ci`/lint/test/build, Node24, read-only verification and nonpersistent checkout credentials. Quote the run constraint “Failure or cancellation grants no publication eligibility”; assert no continue-on-error/publication bypass, use Node fs/Vitest rather than a YAML parser, and record intended missing-workflow/red failures.

### Implementation and checkpoint

- [X] T006 [US1] Create the verification-only increment of `.github/workflows/ci.yml` per CI-01: GitHub-hosted Ubuntu, researched full checkout/setup-node SHA pins with version comments, event-SHA checkout with `persist-credentials: false`, explicit Node24 and separate ordered required steps; keep permissions contents/read and PRs free of secrets/Pages authority, with no publication jobs, path filters or privileged triggers at this MVP stage.
- [X] T007 [US1] Run `src/ci/workflows.test.ts` and the required local checks; validate `.github/workflows/ci.yml` with actionlint if already available, otherwise document syntax-validation exclusion, and record CI-01 outcomes in `specs/003-add-ci-pages-demo/implementation.md`. Do not represent text assertions/local command success as executed GitHub runs or remotely inject failures without authorization.

**Checkpoint**: US1 is independently deliverable; Pages remains absent/disabled and no hosted acceptance is claimed.

## Phase 4: US2 — Make an Informed Hosted-Use Choice (P1)

**Goal**: Explicit demo identity and a session-scoped five-point warning before every unacknowledged picker/read path, with unchanged local behavior and drafts.
**Independent test**: Build demo output locally; test both visible callers/direct input, cancel/continue/reload/new session/storage failure and exact original/history/draft preservation without publicly deploying anything.
**Contracts**: HD-01–04; FR-007–017/019; SC-003–006/008.

### Tests before implementation

- [X] T008 [P] [US2] Add `src/hostedDemo.test.ts` for exact demo env recognition, local zero-session-access, base-scoped key isolation, valid/invalid/missing flag, reload/remount and read/write exceptions. Enforce data-model constraints “Only the exact constant `1` means acknowledged; other/missing values mean unacknowledged”, “Tab-scoped sessionStorage; no localStorage/cookies/IndexedDB acknowledgment”, and “Explicit Continue authorizes only the immediate picker attempt if storage access throws; subsequent attempts/reload warn again”; tests must not introduce visitor IDs/timestamps/vault payloads.
- [ ] T009 [P] [US2] Add App regressions in `src/components/hostedDemo.test.ts` for landing/header callers, hidden-input native click/change, warning-before-chooser/FileReader, Cancel/Escape/header/backdrop/local-use refusal, continuation/repeated picks/close/reload/fresh sessions and storage-error one-attempt cleanup. Cover “it must not capture a File, stale document callback or a promise to discard a draft later”, no replay of blocked files, all four dirty states, unsaved cancellation/current-state recheck, retained underlying dialogs, unique labels/focus/shortcut precedence and unchanged local/original/history/privacy behavior.
- [X] T010 [P] [US2] Add source/security regressions in `src/components/security.test.ts` for HD-04's exact future helper exception and fixed key/value, local-build storage isolation, no vault-derived flag contents/network/logging and unchanged CSP/preference/font/markup bans; retain the global sessionStorage prohibition until T012 introduces the helper and narrow exemption together, rather than allowing arbitrary new storage code. Record intended red assertions against missing hosted behavior.

### Implementation and checkpoint

- [X] T011 [P] [US2] Add matching English/Arabic keys in `src/i18n/locales/en.json` and `src/i18n/locales/ar.json` for enduring demo label, all five HD-03 trust statements, explicit Continue/Cancel/local-use guidance and safe retention/blocked-import notices; do not interpolate filenames/secrets, imply guaranteed protection against compromised JavaScript or use remote guidance fetching.
- [X] T012 [US2] Implement the minimal `src/hostedDemo.ts` boundary and integrate its exact exception in `src/components/security.test.ts`: `import.meta.env.VITE_HOSTED_DEMO === 'true'`, fixed `vaultsort.hostedDemoAcknowledged:${import.meta.env.BASE_URL}` key/value `'1'`, caught reads/writes and no storage access in ordinary local builds. Enforce “True only for explicitly marked demo output; false for ordinary local builds” and “Browser ends that tab session; not vault close, replacement, language/theme change or chooser cancellation”; keep preference modules unchanged and prevent page-wide/permanent consent fallback.
- [X] T013 [US2] Update `src/components/Modal.vue` to use per-instance heading IDs/aria-labelledby when warning and existing dialogs coexist; preserve native open/close/Escape behavior, bounded body/actions and existing callers, and verify stacked-dialog label/retained-form expectations in `src/components/hostedDemo.test.ts` without replacing a dirty folder modal's state.
- [X] T014 [US2] Integrate persistent hosted identity and the localized warning UI in `src/App.vue` using separate transient warning/picker-intent state and existing Modal; show demo label on landing/workspace, retain local-build behavior, route every dismissal/local-use choice to nonacknowledging cancellation, restore connected-trigger/fallback focus, and give warning keyboard actions priority over global mutations/export/close shortcuts. Never use `run()`/`discardDraft()` to prepare or dismiss the warning.
- [X] T015 [US2] Gate `chooseFile()`, hidden-input activation and `importFile()` in `src/App.vue` per HD-02 before chooser/read; Continue acknowledges only the specified decision then re-evaluates current unsaved/draft guards from a fresh user gesture. Reject/clear unsolicited changes without retaining/replaying Files; direct reads cannot inherit stale guard approval, normal unchanged approved picker flow avoids redundant prompts, storage failure authorization clears on chooser cancel/read completion/failure/next request, and atomic load/readVersion/abort/extension/parser behavior stays intact.
- [X] T016 [P] [US2] Extend `src/i18n/i18n.test.ts` for new component/template keys, English fallback and all locale/theme warning/label/action/notices/storage combinations; apply only necessary semantic logical responsive rules in `src/style.css` for label/warning with AA contrast, reduced motion and no competing palette/font/animation. Preserve pre-paint preference restoration and test that existing language/theme switches do not clear acknowledgment.
- [ ] T017 [US2] Run `src/hostedDemo.test.ts`, `src/components/hostedDemo.test.ts`, `src/components/security.test.ts` and `src/i18n/i18n.test.ts`, plus an actual locally served demo browser smoke test for filechooser-before/after-Continue, Escape/focus and repeated picks; record red→green, native versus jsdom evidence, unchanged drafts/original/history and storage fallback outcomes in `specs/003-add-ci-pages-demo/implementation.md` before permitting US3 publication wiring.

**Checkpoint**: US2 works without CI/Pages publication; only a marked demo output warns. No unguarded hosted build may be published later.

## Phase 5: US3 — Publish a Verified Demo Deliberately (P2)

**Goal**: Optional same-SHA production/demo artifact and least-privilege, serialized latest-main Pages publication with correct resources.
**Independent test**: Test the actual workflow/embedded guard and locally served root/subdirectory demo assets. A live deployment requires separately authorized repository execution; unavailable remote evidence is not a passing deployment.
**Contracts**: PG-01–04 and HD-04; FR-003–006/014–016/019; SC-002/005/008.

### Tests before implementation

- [ ] T018 [US3] Extend `src/ci/workflows.test.ts` for explicit `VAULTSORT_PAGES_ENABLED == 'true'`, main-push/nonfork eligibility, `needs` failure/cancellation propagation, immutable same-SHA demo checkout, Pages base/enablement false, dist-only packaging/symlink rejection, isolated write/OIDC authority and deploy-only concurrency. Exercise the actual inline guard extracted from `.github/workflows/ci.yml` with current/stale/HTTP/transport/missing-ref/malformed-shape responses, both A/B completion orders and old/job-only reruns; enforce “Artifact identity: this run's verified SHA and demo production output” and test failures before deploy rather than an unrelated fake helper.
- [ ] T019 [US3] Add eligible `demo-build` to `.github/workflows/ci.yml` after successful verify, using the researched full configure-pages/upload-pages-artifact pins, exact `github.sha`, Node24/npm ci, contents/read plus pages/read only and `enablement: false`; rebuild with `VITE_HOSTED_DEMO=true` and `npm run build -- --base "${PAGES_BASE_PATH}/"`, reject unexpected symlinks and upload only `dist/` as this run's github-pages artifact. Enforce “Relative local default, or explicit trailing-slash root/repository prefix for demo output”; leave local Vite base and required verification independent of opt-in.
- [ ] T020 [US3] Add `deploy` to `.github/workflows/ci.yml` requiring demo-build and repeated eligibility, github-pages environment, contents/read/pages-write/id-token-write and no checkout/npm/artifact execution. Serialize only publication with `vaultsort-pages-publication`, `cancel-in-progress: false`, `queue: max`; after lock/approval run the tested inline read-only current-main guard using env inputs, fail closed on API/shape errors, explicitly skip stale SHAs and deploy immediately only when fresh. Keep guard on every rerun and only report page_url after official deploy success; preserve forward-only-main/100-pending/opt-out limits from PG-02–03.
- [ ] T021 [P] [US3] Extend `src/components/branding.test.ts` for configured-base resource/startup invariants around `index.html`, `vite.config.ts`, `public/site.webmanifest` and `public/fonts/OFL.txt`: single favicon, preference script before styles, bundled font/license, relative manifest icons/start/scope and unchanged CSP. Keep tests/root/subdirectory assertions separate from source-only scans and do not add runtime requests to verify assets.
- [ ] T022 [US3] Build and serve ordinary local, root-demo and `/demo-check/` demo outputs exactly as `specs/003-add-ci-pages-demo/quickstart.md` section 3 under `/tmp/opencode/vaultsort-pages-validation/`; inspect actual HTML/CSS/manifest/resource requests and startup restoration, artifact contents/no symlinks and demo/local identity. Fix `index.html`, `vite.config.ts` or `public/site.webmanifest` only for demonstrated URL failures, reading `docs/favicon.md` before touching favicon integration, and record artifact hashes/base/resource outcomes in `specs/003-add-ci-pages-demo/implementation.md`.
- [ ] T023 [US3] Run actual workflow/freshness/branding regression cases in `src/ci/workflows.test.ts` and `src/components/branding.test.ts`, available actionlint on `.github/workflows/ci.yml` and fresh root/subdirectory builds; record current/stale/failure/ordering and eligibility/provenance results in `specs/003-add-ci-pages-demo/implementation.md`. Label static/mocked/local results accurately; no live Pages success, force-reset safety or permission proof may be inferred from them.

**Checkpoint**: Optional publication is configured but disabled by default; local path/guard tests pass. Public activation is not part of automatic implementation authorization.

## Phase 6: US4 — Find the Recommended Local Path (P2)

**Goal**: Distinguish convenient demo from recommended reviewed local use, with actionable maintainer setup and honest limits.
**Independent test**: Read/run local instructions, inspect disabled/enabled publication instructions and verify all five trust points without requiring a live demo or any vault file.
**Contracts**: HD-03–04, PG-03–04; FR-018; SC-007.

- [ ] T024 [US4] Update `README.md` to separate recommended review/build/local serving from optional hosted demo; include all five trust statements, host asset-request/IP logging and compromised-code caveats, ordinary local/demo build commands, session-only lifetime, exact opt-in/Pages/environment prerequisites and current-main/revert recovery. Explain disabled flag does not unpublish an existing site or stop in-flight work; advertise a live URL only with observed authorized deployment evidence.
- [ ] T025 [P] [US4] Update `CONTRIBUTING.md`, `SECURITY.md` and `CHANGELOG.md` with implemented CI/demo behavior, required command order and narrow hosted-session exception consistent with `AGENTS.md`; remove stale no-configured-CI/deployment statements only after implementation, distinguish configured automation from executed live publication and preserve no-vault-upload/audit/compromised-host boundaries without broadening storage authority.
- [ ] T026 [US4] Validate `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `AGENTS.md` and `CHANGELOG.md` together against HD-03/04 and PG-03/04; check local commands/relative links and enabled/disabled instructions, fixed session scope, forward-only main and non-unpublication limits, and record documentation acceptance/exclusions in `specs/003-add-ci-pages-demo/implementation.md` without manufacturing a public site or security guarantee.

## Phase 7: Polish and cross-cutting acceptance

**Purpose**: Verify all delivered stories and document unavailable remote/browser evidence explicitly.

- [ ] T027 Execute the production real-browser matrix in `specs/003-add-ci-pages-demo/quickstart.md` section 4 using local/root/subdirectory outputs: English/Arabic × light/dark × widths 320/768/1280/1440 × native 100%/200% zoom, reduced motion, keyboard-only warning/Continue/Cancel/local-use actions, actual filechooser ordering, focus/Escape/stacked dialogs, AA contrast and bounded scrolling/no page overflow. Record engine/window/zoom metrics, synthetic screenshots, failures/fixes and untested engines/hardware in `specs/003-add-ci-pages-demo/implementation.md`; rerun affected cases after fixes rather than treating jsdom/device emulation as native evidence.
- [ ] T028 Execute offline import/edit/undo/comparison/full-selected-folder/original-download checks and request/log/storage inspection per `specs/003-add-ci-pages-demo/quickstart.md` section 5; verify zero automatic third-party requests/vault transmission, only approved preference keys plus exact hosted-only constant session flag, local zero-hosted-storage and synthetic source/original/history/privacy preservation. Record evidence under `/tmp/opencode/vaultsort-pages-validation/` and summarized results in `specs/003-add-ci-pages-demo/implementation.md`, never logging real vault values.
- [ ] T029 Determine whether separately authorized GitHub execution is available and follow `specs/003-add-ci-pages-demo/quickstart.md` section 6 only within that authority; otherwise record **CI/Pages not live-executed** in `specs/003-add-ci-pages-demo/implementation.md` with remote fork/event/failure/permissions/provenance/concurrency/URL cases unverified. If authorized, record real run IDs/attempts/SHAs/artifact hashes/site-resource outcomes for enabled/disabled/stale/failure cases; do not automatically change settings, push commits, access credentials, deploy infrastructure or test real vaults.
- [ ] T030 Run final `npm ci`, `npm run lint`, `npm test`, `npm run build` and `git diff --check`; audit final `.github/workflows/ci.yml`, `src/hostedDemo.ts`, `src/App.vue`, policy/docs and built resources against FR-001–019/SC-001–008, and record coverage, exact tool/build/browser versions and live-evidence exclusions in `specs/003-add-ci-pages-demo/implementation.md`. Rebuild/rerun affected acceptance if source changes; leave quality checklists and prior-feature gates untouched and report implemented/configured versus actually live-executed status separately.

## Dependencies and execution order

```text
T001 → T002 → T003 → T004
                       ↓
US1: T005 → T006 → T007                          (CI-only MVP)
                       ↓
US2: (T008 ∥ T009 ∥ T010 ∥ T011)
       → T012 → T013 → T014 → (T015 ∥ T016) → T017
                       ↓
US3: T018 → T019 → T020
     T021 may run independently after US2
     (T020 + T021) → T022 → T023
                       ↓
US4: (T024 ∥ T025) → T026
                       ↓
T027 → T028 → T029 → T030
```

- Setup/foundation block all stories. Default delivery follows the priority order US1 → US2
  → US3 → US4; within each story, test tasks precede the corresponding implementation.
- US2 has no behavioral dependency on CI and can be developed after foundation independently,
  but the default order provides a verified CI MVP first. US3 cannot publish until US1 and US2
  checkpoints pass. US4 documentation can be drafted earlier but final behavior/URL claims wait
  for the implemented stories and actual evidence.
- T012 depends on T008/T010; T013 consumes T009 expectations; T014 consumes helper/dialog/locales;
  T015/T016 depend on T014 but touch disjoint source files. T017 joins all US2 work.
- T018/019/020 share workflow/test integration and are sequential. T021 depends only on US2
  and can overlap workflow work; T022 follows all workflow/resource checks. T023 joins US3.
- Shared `src/App.vue`, `src/components/security.test.ts`, `src/i18n/i18n.test.ts`, workflow and
  locale edits must not run concurrently across tasks touching the same files. Writes to the
  shared implementation evidence file are sequential/merged, even when source tasks are parallel.
- Browser/offline acceptance is sequential. If fixes affect builds/guards/assets, rerun affected
  cases on the final production output. Unavailable remote execution completes T029's availability
  investigation only; it does not satisfy live CI/Pages acceptance.

## Parallel execution examples per story

| Story | Ready disjoint tasks | Subsequent opportunity |
| --- | --- | --- |
| US1 | None needed: one fixed workflow/test contract is intentionally sequential | Validate after T006, not while rewriting the workflow |
| US2 | T008 helper tests ∥ T009 App tests ∥ T010 source-security tests ∥ T011 locale copy | After T014: T015 App guards ∥ T016 CSS/i18n assertions |
| US3 | After US2: T018 workflow tests ∥ T021 branding/resource tests | T021 may also overlap T019/T020 workflow-only edits |
| US4 | T024 README ∥ T025 CONTRIBUTING/SECURITY/CHANGELOG | T026 reads/validates both after they finish |

Seven tasks carry `[P]` (T008/T009/T010/T011/T016/T021/T025). Markers permit only these
dependency-respecting disjoint opportunities, not automatic subagent dispatch.

## Implementation strategy

1. **MVP first**: foundation → US1 required CI, tested independently. Stop here if only automated
   verification is desired; no deployment or hosted warning is needed to deliver this increment.
2. Add US2 explicit demo flag/session warning and verify locally before wiring any publisher.
3. Add US3 eligible same-SHA artifact/publication with deploy-time freshness; default stays disabled.
4. Complete US4 documentation, then the native browser/offline/resource/preservation matrix.
5. Collect only authorized remote evidence or clearly record its absence; no settings/push/deploy
   inference from this checklist. New dependencies or speculative infrastructure are unnecessary.

## Coverage and format validation

| Requirements / outcomes | Owning tasks |
| --- | --- |
| FR-001–002 / SC-001 | T001, T005–T007, T018–T020, T029–T030 |
| FR-003–006 / SC-002 | T018–T023, T024–T026, T029–T030 |
| FR-007–010 / SC-003 | T009, T011, T013–T017, T027 |
| FR-011–013 / SC-004/008 | T003–T004, T008–T010, T012, T015, T017, T028 |
| FR-014–016 / SC-005 | T010, T016, T019, T021–T023, T028 |
| FR-017 / SC-006 | T009, T011, T013–T017, T027 |
| FR-018 / SC-007 | T003, T024–T026, T029–T030 |
| FR-019 / SC-001–008 | Story test/checkpoint tasks, T027–T030 |
| Actual live CI/Pages permission/concurrency/publication evidence | T029 investigation; unavailable evidence remains unverified |

30 tasks: setup 2, foundation 2, US1 3, US2 10, US3 6, US4 3, polish 4.
All task IDs are sequential and have concrete paths; story labels are restricted to story
phases. Generation asserts no implementation, test success, live run or acceptance completion.
