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

## Implementation completed after validation waiver

The user explicitly requested skipping validation and finishing implementation. This waives
the T017 browser prerequisite for publication wiring only; it does not convert any unexecuted
validation into a pass. The earlier checkpoint above is historical.

- Added demo-build/deploy to `.github/workflows/ci.yml`, with explicit opt-in/main/nonfork
  eligibility, default fail-stop dependencies, pinned official actions, exact event SHA,
  Node24, Pages-derived build base and demo flag, dist-only same-run artifact and symlink guard.
  Only deploy has Pages write/OIDC authority; no checkout/npm/artifact code executes there.
- Publication lock uses the planned group, queue:max/cancel-in-progress:false. Its inline
  read-only main-ref check executes on every attempt after lock/environment approval; exact
  commit/ref/SHA shape errors, HTTP and transport failures fail closed without response/token
  logging. Valid stale revisions write a skip summary; only fresh output runs deploy-pages.
- Added eight initial workflow regressions before code: expected red for missing jobs/guard,
  then green. Actual inline guard (not a substitute helper) is exercised with fresh/stale,
  malformed/missing ref, HTTP/transport failures and repeated stale/rerun checks. These model
  ordering under a lock, not GitHub's live scheduler or permissions.
- Completed T009's remaining jsdom checks for initiating focus, close/reopen retention and
  read-error storage-fallback cleanup. Branding tests check startup ordering/local-base default
  and manifest-relative root/subdirectory resolution; actual browser/resource requests are deferred.
- README separates recommended reviewed local use from optional demo and supplies maintainer
  Pages/environment/variable setup, default-disabled behavior, limits and new-revert recovery.
  CONTRIBUTING/SECURITY/CHANGELOG match the fixed hosted-session exception, unchanged preference
  boundary and CSP; documents make no live site/audit claim. Relative documentation links and
  commands agree with existing scripts and workflow. No app dependencies/assets/palette added.
- T009, T018–T021, T024–T026 and T029 are now complete: 24/30 tasks checked. Remaining
  T017/T022/T023/T027/T028/T030 are validation/evidence tasks, intentionally unchecked rather
  than relabeled successful. Required lint/tests/build still run; full acceptance is not claimed.
- No commit/push/settings changes, credentials, public publication, browser/offline matrix,
  fresh root/subdirectory serving checks or actionlint execution performed in this continuation.
  **CI/Pages not live-executed.** Live source/artifact provenance, forks/failure injection,
  permissions/environment/concurrency and deployed URL remain unverified.

### Left for the maintainer

Final required local checks after `npm ci`: lint passed, 179 tests across 11 suites passed,
TypeScript/Vite production build passed, and `git diff --check` passed. No lockfile/dependency
change. Optional actionlint remains unavailable/not executed; browser/live validation skipped.
Post-implementation hook check again found no `.specify/extensions.yml`.

Review/commit/merge the changes into main; enable Actions and Pages Source: GitHub Actions;
protect github-pages for main; set repository variable VAULTSORT_PAGES_ENABLED to exact true;
trigger an eligible main push or rerun current eligible main. Inspect the first deployment run
and page_url before advertising it. Deferred browser/root/subdirectory/offline/live acceptance
is still recommended, particularly before using real vaults. Opt-out does not take down a site.

## Retained evidence exclusions

**CI/Pages not live-executed.** No remote settings, credentials, push, commit, environment
activation or publication is authorized/performed. Fork events, hosted failures, actual
permissions/provenance/concurrency/URL remain unverified. Prior usability/participant/import
and cross-browser/hardware gates are untouched.
