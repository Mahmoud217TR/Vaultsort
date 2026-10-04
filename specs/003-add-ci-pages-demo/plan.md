# Implementation Plan: Automated Verification and Optional Hosted Demo

**Branch**: `chore/pages-ci` | **Date**: 2026-10-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-add-ci-pages-demo/spec.md`.
Discovery uses `.specify/feature.json`. Setup reports `003-add-ci-pages-demo` as `BRANCH`;
the actual branch is `chore/pages-ci`. No branch switch is part of planning.

**Status**: Phase 0 research and Phase 1 design complete. No workflow/application/policy
implementation, publication, repository-setting changes or executed acceptance is claimed.

## Summary

Add one GitHub Actions workflow with mandatory verification and two isolated opt-in Pages
jobs. Verify every main push and main-targeting PR with Node 24 and the existing four commands.
Only a verified nonfork main push with `VAULTSORT_PAGES_ENABLED == 'true'` may build demo output
and deploy it. Use official SHA-pinned Pages actions, exact-SHA checkout, Pages-derived base,
`dist/`-only artifacts and a serialized, fresh-main-checked publication. No privileged PR trigger.

Mark demo output explicitly with `VITE_HOSTED_DEMO=true`; ordinary local builds stay unchanged.
Reuse App's picker, Modal, locales and header. Gate both picker activation and file reads,
require explicit Continue before choosing a file, preserve all draft guards, and retain only
one fixed acknowledgment flag in tab-scoped sessionStorage. Reconcile policy wording narrowly
before implementation; keep the existing preference reader/writer and network CSP unchanged.

## Technical Context

**Language/Version**: TypeScript 5.9.3, Vue SFCs, JavaScript/CSS and GitHub workflow YAML.
Project engines remain `^22.13.0 || ^24.0.0 || >=26.0.0`; select Node 24 for GitHub-hosted CI.

**Primary Dependencies**: Existing lockfile: Vue 3.5.43, vue-i18n 11.4.13, Vite 7.3.6,
Tailwind 4.3.3. Native FileReader/dialog/file input/sessionStorage; no app dependencies added.
Use researched official checkout/setup-node/configure-pages/upload-pages-artifact/deploy-pages
actions at full commit pins recorded in [research.md](research.md).

**Storage**: Vaults/originals/history/drafts remain memory-only. Persistent localStorage
remains only language/theme through current modules. One hosted-only sessionStorage flag,
scoped to deployment base and equal to `'1'`, is the narrow new exception. Storage failure
grants only immediate explicit continuation; subsequent attempts warn again. No browser
storage for files, paths, warning analytics, IDs, timestamps, searches or derived vault state.

**Testing**: Vitest 5.0.3, Vue Test Utils 2.5.1, jsdom 27.4.0; existing security/i18n/branding
and workflow regression patterns. New hosted-helper, App gate and workflow-text tests use
existing tools; optional actionlint validates workflow syntax if available. Real browsers
are needed for filechooser ordering, dialog focus, subdirectory requests, native zoom and offline
behavior. Static tests do not prove GitHub permissions, remote concurrency or live Pages activation.

**Target Platform**: Static desktop/mobile browser app, offline after initial local assets
load; GitHub-hosted Ubuntu automation and GitHub Pages root/project/custom-domain deployments.
English/Arabic × light/dark at 320/768/1280/1440 and actual 200% zoom. Record untested engines.

**Project Type**: Single frontend application plus repository verification/publication automation.
No backend, user API, service worker, vault upload service or credential integration.

**Performance Goals**: Warning uses fixed local content with no network wait or vault scan;
acknowledgment is constant-size. Retain existing import/edit/export responsiveness and offline
availability. No new latency/SLA claim or unrelated scale optimization.

**Constraints**: Preserve `connect-src 'none'`, original data/history/privacy, startup preference
order, bundled fonts/license, single favicon integration and semantic Azure/RTL styling. Pages
requires maintainer activation; unset opt-in means no publication. Publish latest eligible main
under forward-only main history; use revert commits for rollback, not force resets/old-run replay.

**Scale/Scope**: Four stories, FR-001–019 and SC-001–008. One workflow, one small hosted helper,
existing App/Modal/locales, regression tests and aligned project docs. One flag per tab/base;
one Pages publication at a time. GitHub deployment queue has a documented 100-pending ceiling.

## Constitution Check

*GATE: Pre-research review passed against the spec; post-design review also passes with the
explicit documentation prerequisite below. No constitutional prohibition is relaxed.*

| Principle | Design and validation | Gate |
| --- | --- | --- |
| I. Privacy is non-negotiable | No vault storage/transmission/logging; retain CSP. Only constant non-sensitive hosted session flag; local builds never access it | PASS |
| II. Preserve user data | Warning is independent of domain/history. Recheck unsaved guards before picker/read; blocked reads retain no File. Keep atomic load/read-version/abort behavior | PASS |
| III. Honest security claims | Persistent demo identification; five trust statements; local recommendation; no compromised-host protection or unexecuted deployment claim | PASS |
| IV. Consistent accessible UI | Existing Modal/tokens/locales/brand; unique dialog labels if stacked; keyboard/RTL/theme/zoom/focus acceptance | PASS |
| V. Simplest correct solution | One workflow, native sessionStorage, exact build flag, small helper, existing tests. No YAML parser, consent platform, store or runtime service added | PASS |
| VI. Verifiable change | Required command order, hosted gate/session tests, workflow guard tests, root/subdirectory production/browser/offline checks and explicit remote evidence limits | PASS |

**Required policy reconciliation before code**: AGENTS.md, CONTRIBUTING.md, SECURITY.md and
README currently say only two preferences may be stored. Proposed wording permits exactly
`vaultsort.hostedDemoAcknowledged:<BASE_URL>` with value `'1'` in sessionStorage for hosted
tab sessions, owned solely by `src/hostedDemo.ts`; localStorage/preferences remain unchanged.
All vault-derived data and every other application state remain forbidden in browser storage.
The constitution already permits non-sensitive session flags and FR-012 expressly bounds this
one. Implementation must update the narrower guidance and exact security scan together before
adding the helper; planning itself does not edit policy or broadly authorize persistence.

Post-design checks confirm flag scope, storage-error recovery, demo-only identity, picker/read
gates, separate job permissions and artifact provenance satisfy the same principles. No unresolved
research decision, constitutional amendment or unjustified gate failure remains.

## Project Structure

### Documentation (this feature)

```text
specs/003-add-ci-pages-demo/
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   ├── ui-contracts.md
│   └── automation-contracts.md
├── quickstart.md
└── tasks.md                      # Future /speckit.tasks output; not generated by this plan
```

### Source Code (repository root; existing and planned touched files)

```text
.github/workflows/ci.yml           # New: verify → eligible demo-build → serialized deploy
src/
├── hostedDemo.ts                  # New: build flag and narrowly scoped session decision
├── hostedDemo.test.ts             # New: flag/retention/failure/local isolation
├── App.vue                       # Existing: label, warning, picker and read gates
├── components/
│   ├── Modal.vue                  # Existing: unique per-dialog title ID if warning stacks
│   ├── hostedDemo.test.ts         # New: App import gate and draft/picker regressions
│   ├── security.test.ts           # Existing: exact helper exception, no global storage weakening
│   └── branding.test.ts           # Existing: assets/font/CSP/license invariants
├── ci/workflows.test.ts           # New: actual workflow and inline freshness-guard contract
├── i18n/
│   ├── i18n.test.ts               # Existing: locale/theme/text/persistence coverage
│   └── locales/{en,ar}.json       # Existing: demo/warning/actions/local-use guidance
├── test.setup.ts                  # Existing: isolate session state/env stubs between tests
└── style.css                     # Existing: only necessary semantic responsive warning/label rules
vite.config.ts                    # Keep base './' local default; demo build overrides base via CLI
index.html                        # Audit built URL rewriting and preference-before-style order
public/{preferences.js,site.webmanifest,fonts/OFL.txt} # Unchanged startup/resources/privacy contracts
AGENTS.md                         # Narrow storage policy reconciliation before helper work
CONTRIBUTING.md                    # Verification and session exception guidance
SECURITY.md                        # Session exception and hosted trust distinction
README.md                         # Recommended local use, optional Pages setup and evidence limits
CHANGELOG.md                      # Implemented behavior only, after implementation
```

**Structure Decision**: Extend the existing single app rather than introducing an environment
store or import service. App owns pending warning intent; the helper accepts no vault payload.
All domain/composable operations remain unchanged. Automation contracts are repository interfaces,
not permission to create remote resources or third-party browser dependencies.

## Phase 0 — Research completed

Resolved build identification, storage policy and recovery, import bypass/draft/dialog behavior,
Pages base handling, current official action versions, CI permission separation, publication
freshness/order and evidence boundaries. Decisions/rationale/alternatives and upstream references
are in [research.md](research.md). Sources and current code were inspected read-only; no tests,
workflow runs, live publication or settings changes occurred during planning.

## Phase 1 — Design completed

- [data-model.md](data-model.md): immutable build context, run/artifact identity, publication
  eligibility/lifetime, exact session decision and warning/picker transitions.
- [UI contracts](contracts/ui-contracts.md): identity, pre-picker/read gate, five-point warning,
  cancellation/focus/draft semantics, policy/resource/security boundaries.
- [Automation contracts](contracts/automation-contracts.md): command/event order, jobs and pins,
  opt-in/main provenance, deploy-time freshness, failure/queue limits and validation cases.
- [quickstart.md](quickstart.md): runnable local verification/demo/base builds, automated/browser
  scenarios, authorized live evidence procedure and clear unavailable-evidence handling.

## Implementation handoff

Default sequence: narrow policy/test reconciliation → mandatory CI → test-first hosted identity/
session gate → eligible demo build/publication → docs and full local/browser verification.
The shipped workflow must never publish unguarded demo output. Tests precede their behavior;
shared App/security/i18n files are edited sequentially. Final implementation records exact
commands, artifact hashes, browsers, request/storage checks and remote execution exclusions.
Do not mark previous feature gates or quality checklist items as implementation acceptance.

## Complexity Tracking

No constitutional violations require justification. Permission-separated jobs and one
deploy-time freshness guard address actual publication/security requirements; no speculative
infrastructure or new app dependency is planned. Forward-only main history is an explicit
operational prerequisite, not a claim that freshness guards prevent deliberate history resets.
