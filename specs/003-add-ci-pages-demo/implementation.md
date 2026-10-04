# Implementation evidence: CI and optional Pages demo

## Baseline — 2026-10-04

- Working branch `chore/pages-ci`; initial changes only the untracked feature directory.
- Node v24.21.0. `npm ci`: 241 packages, zero reported vulnerabilities; npm warns about
  esbuild's existing postinstall approval. No dependency/lockfile change requested.
- Lint passed; Vitest 5.0.3: 138 tests in 8 suites passed; production build passed
  (Vite 7.3.6); `git diff --check` passed.
- Existing `.gitignore` and flat ESLint ignores cover dependencies/builds/coverage/env/log/temp.
  No Docker/Prettier/Terraform/Helm config detected; private package is not npm-published.
- Read governance, design and all feature design/contracts/tasks. Quality checklist 16/16,
  unchanged. No extensions.yml or hooks found.

## Source trace / upstream

- Both visible file buttons call chooseFile; direct input change bypasses its unsaved guard.
  Four unsaved sources: committed changes, item draft, folder form, comparison rename.
  Folder dirty status depends on the underlying modal state: warning must be separate.
- FileReader uses readVersion and abort. useVault.load parses/clones before closing the
  previous vault; warning must not call domain operations or discardDraft.
- Modal uses native showModal/cancel with a fixed heading ID; stacked labels need useId.
- Vite local base `./`; manifest resources/start/scope relative; startup preference script
  precedes styles; favicon uses BASE_URL. No speculative asset edits needed.
- Re-fetched all five pinned upstream action.yml files at R4 SHAs: HTTP 200; checkout,
  setup-node, configure-pages and deploy-pages use node24; upload is composite and its
  nested upload-artifact is SHA-pinned. configure-pages supports enablement:false/base_path;
  uploader dereferences symlinks; deploy defaults to same-run github-pages artifact.
  GitHub-hosted Ubuntu is selected for current Node24 runner support (upstream minimum
  runner 2.327.1). No action code was executed by this research.
- actionlint is not installed; workflow text tests are not platform syntax validation.

## Implemented checkpoint

- T001–T008, T010–T016 completed. T009 has 18 App regressions covering both callers,
  refused file no-replay, all dismissal routes, direct click/change, retention/remount,
  storage fallback cancellation/read, dirty state change rechecks, all four dirty kinds,
  preserved underlying folder modal with distinct title IDs, keyboard precedence and
  retained original/history/drafts. Dedicated focus restoration, close/reopen and read-error
  cases remain to complete T009; native behavior cannot be inferred from jsdom.
- T005 first failed twice for missing workflow; after T006, lint, all 140 tests and build
  passed. Fixed ESLint no-regex-spaces in the workflow test before rerunning.
- T008–T010 initially failed for missing helper/warning behavior. After implementation,
  helper/security/gate/localization checks passed. Fixed test fixture ArrayBuffer realm and
  actual localized Open another vault label, plus explicit mock `this` TypeScript annotation.
- Separate warning state, synchronous native-dialog close before Continue's picker, safe
  Cancel autofocus, exact helper storage exception and local zero-access implemented.
  Read approval uses an in-memory revision invalidated by document/draft/input changes;
  no File or stale discard callback is retained. Existing load/abort/parser/domain behavior
  is unchanged. Demo label replaces the local-only header claim in marked builds.
- Synthetic fixture: `/tmp/opencode/vaultsort-pages-validation/synthetic.json` (two fictional
  login items, one folder and opaque root metadata); never placed in public/dist/artifacts.
- Root demo production build passed at `/tmp/opencode/vaultsort-pages-validation/root-demo`.
  Local static server started on 4181 for the planned smoke test.
- T017 BLOCKED: browser.tabs.open returned `[browser.disconnected] No desktop browser is
  connected to this session`. No retries/fake native evidence. Native filechooser ordering,
  dialog focus/Escape/repeated picks and the locale/theme/width/zoom/offline matrix have not
  run. US3 publication wiring deliberately not started: its prerequisite smoke gate is unmet.
- T018–T030 remain unchecked. Optional deployment and final complete-feature acceptance
  are not implemented. README/CONTRIBUTING reflect the delivered CI/UI checkpoint without
  claiming a publication workflow/site; full maintainer/demo documentation remains US4 work.
- Last checkpoint verification: lint passed; 166 tests across 11 suites passed; ordinary
  local production build and `git diff --check` passed. TypeScript required an explicit
  test-only cast for Vue's private setupState used to inject all four dirty-state conditions;
  fixed and rebuilt successfully. This is a partial-checkpoint check, not T030 completion.
- After-implementation hook check: no `.specify/extensions.yml`; no hooks to dispatch.

## Remote and retained exclusions

**CI/Pages not live-executed.** No remote settings, credentials, push, commit, environment
activation or publication is authorized/performed. Fork events, hosted failures, actual
permissions/provenance/concurrency/URL remain unverified. Prior usability/participant/import
and cross-browser/hardware gates are untouched.
