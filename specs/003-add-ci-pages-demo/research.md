# Research: Automated Verification and Optional Hosted Demo

**Date**: 2026-10-04 | **Spec**: [spec.md](spec.md)

Read-only source inspection and official upstream documentation research. No application,
workflow, policy, repository setting, deployment or executed acceptance result is introduced here.

## R1 — Keep CI mandatory and Pages opt-in in one workflow

**Decision**: `.github/workflows/ci.yml` handles push/main and pull_request/base-main.
`verify` uses Node 24, read-only checkout with `persist-credentials: false`, and separate ordered
steps `npm ci`, `npm run lint`, `npm test`, `npm run build`. Do not use path filters,
`pull_request_target` or privileged `workflow_run`. Publication opt-in is the exact repository
variable `VAULTSORT_PAGES_ENABLED == 'true'`; missing/other values are disabled.

**Rationale**: Existing engines support Node 24 and lockfile supplies dependencies. CI remains
useful without Pages. An exact comparison avoids treating the nonempty string `'false'` as true.

**Alternatives considered**: Multiple CI platforms, version matrices and separate privileged
publication workflows add no requested value and complicate provenance/PR trust.

## R2 — Separate verified/demo build from publication authority

**Decision**: Three jobs: verify → demo-build → deploy. Eligible main/nonfork pushes rebuild
demo output from the exact `github.sha`, not moving main. Demo-build receives contents/read and
pages/read only; it installs/builds with no Pages write/OIDC authority. Deploy receives only
needed read/pages-write/id-token-write authority, executes no checkout/npm/artifact content,
and publishes that run's `github-pages` artifact through the Pages environment.

**Rationale**: A demo-specific build must be successful too; its source SHA must match the
verified run. Fork PRs never enter privileged publication and published code is static output.

**Alternatives considered**: Giving every CI job Pages write permission, deploying arbitrary
downloaded PR artifacts or a PAT-driven branch-push publisher widens authority unnecessarily.

## R3 — Serialize deployment, then check current main inside the lock

**Decision**: Verification can run independently in parallel. Only deploy jobs share
`vaultsort-pages-publication` concurrency with `cancel-in-progress: false`, `queue: max`.
After acquiring that job's lock and environment approval, read current main from GitHub's
read-only ref API with the job token and compare exact SHA to `GITHUB_SHA`. Fresh deploys;
stale skips explicitly; network/status/shape errors fail closed. The guard runs again on every
deployment attempt, including job-only reruns, immediately before the official deploy step.

**Rationale**: GitHub concurrency queues by arrival, not commit order. If A is deploying,
B cannot publish ahead of A while A holds the lock. If A arrives/reruns after B, A no longer
matches current main and skips. Freshness outside the lock would be stale by publication time.
Node's built-in fetch supports this workflow-only check; it is not a browser API request.

**Alternatives considered**: Cancel-in-progress is not a remote transaction and an old rerun
can cancel new work. Whole-main workflow serialization is unnecessary for correctness and
delays ordinary verification; deploy-only serialization plus inside-lock guard is sufficient.
Durable ancestry/high-water tracking adds state beyond this small forward-only-main workflow.

**Operational limits**: Require forward-only main history; rollback uses a new verified revert
commit. The guard does not cover intentional force resets to previously published old SHAs or
unrelated publication workflows; all feature publications use this same group. If main advances
to a failing revision before A deploys, A skips and the existing published demo stays. `queue: max`
has 100 pending capacity; platform saturation/manual cancellation/outages must be reported,
not called passing verification. Opt-out stops future eligibility, not automatic unpublication
or cancellation of an already running deployment.

## R4 — Use current official action pins and native Pages artifacts

**Decision**: Use full immutable upstream commit pins with readable version comments:

| Action | Researched release | Commit pin |
| --- | --- | --- |
| actions/checkout | v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| actions/setup-node | v7.0.0 | `820762786026740c76f36085b0efc47a31fe5020` |
| actions/configure-pages | v6.0.0 | `45bfe0192ca1faeb007ade9deae92b16b8254a0d` |
| actions/upload-pages-artifact | v5.0.0 | `fc324d3547104276b827a68afc52ff2a11cc49c9` |
| actions/deploy-pages | v5.0.1 | `368f82528645a54fb793d4d04e342629a3f51346` |

**Rationale**: Resolved upstream releases/tags/action metadata during research, rather than
assuming old tutorial versions remain current. JavaScript action runtime is Node 24, which
is separate from explicitly selecting project Node 24. Intended runners are current GitHub-hosted
Ubuntu; upstream Node24 actions require runner v2.327.1+. Revalidate upstream pins at implementation.

Upload only `dist/`, reject unexpected symlinks in it (uploader dereferences links), and do not
package test fixtures, vaults, dependencies or the checkout. Deploy uses artifact lookup within
the same workflow run. Do not reuse unrelated cross-run artifacts.

**Alternatives considered**: Floating latest action refs, community Pages publishers, direct
gh-pages commits and personal tokens provide less constrained or reproducible publication.

## R5 — Explicit build distinction and Pages-derived asset prefix

**Decision**: `VITE_HOSTED_DEMO=true` explicitly marks demo output. Normal dev/local build is
false unless requested. Keep current Vite `base: './'` local default; for demo publication use
`configure-pages` with enablement false, obtain `base_path`, then build with
`npm run build -- --base "${PAGES_BASE_PATH}/"`. Empty base path becomes `/`, `/repository`
becomes `/repository/`; no hardcoded Vaultsort name or runtime host guess.

**Rationale**: Existing build script forwards trailing arguments to final `vite build`.
Pages metadata accommodates repository prefixes and custom domains. Existing favicon URLs use
`%BASE_URL%`, manifest URLs are relative, and current output rewrites preferences/fonts/modules
relative to production base. Verify output rather than changing favicon/bootstrap speculatively.

**Alternatives considered**: Hostname/HTTP detection mislabels local previews and custom domains.
Remote config fetch violates CSP. A hardcoded repo base breaks forks/renames/root hosting.

## R6 — Gate picker and FileReader, preserve draft guards

**Decision**: Existing App picker callers are landing Select JSON and header Open vault, both
using `chooseFile()`. Add hosted gate there, on hidden input native click and before reads in
`importFile()`. The current read handler bypasses chooseFile's unsaved confirmation, so a
read-boundary check is required too. No new drag/drop path exists or is needed. Unexpected
unacknowledged file changes clear input and do not retain/replay a File.

Continue re-evaluates the current existing unsaved/draft guards and attempts a fresh native
chooser from the user's gesture. Do not invoke run/discardDraft while showing warnings. Keep
readVersion/abort, extension/parser checks and parse-before-replacement load semantics unchanged.

**Rationale**: Checking only visible buttons leaves direct/native input activation and change
unguarded. A separate warning state preserves underlying modal/drafts instead of replacing
`modal = 'folder'` and making folderDraftDirty disappear. Reuse Modal with per-instance title IDs
if dialogs coexist, and give warning dismissal/keyboard precedence without changing vault state.

**Alternatives considered**: Host warning after file read violates pre-choice requirements.
Retaining an unauthorized File for later automatic import or swallowing existing unsaved guards
can lose drafts. A new import service/store or consent library is unnecessary.

## R7 — One narrowly scoped tab-session decision with fail-safe retry

**Decision**: `src/hostedDemo.ts` alone accesses sessionStorage for the exact constant-value
acknowledgment key described in [HD-01](contracts/ui-contracts.md). Scope by immutable BASE_URL
so project sites sharing one host cannot accidentally reuse another project's acknowledgment.
Local builds do not touch the flag. Accept only `'1'`; catch storage errors without logs and
allow only the immediate explicit picker attempt, warning on later attempts/reloads if retention
fails. Do not use permanent localStorage consent or a fallback that suppresses warnings forever.

**Rationale**: The constitution permits non-sensitive session state; the spec expressly limits
the exception. Keep public/preferences.js and src/preferences.ts's validated language/theme
contract unchanged. Browser tab restore/duplication may inherit session state; independent tabs
do not share a guaranteed browser-wide decision. No visitor/timestamp/vault identifier is needed.

**Required reconciliation**: AGENTS.md privacy paragraph, CONTRIBUTING.md storage rules,
SECURITY.md storage statement and README must state exactly this exception. Existing
security.test.ts bans sessionStorage in all app sources: narrow it only for the helper and
add explicit helper assertions, never remove the ban globally. Isolate session state in tests.

**Alternatives considered**: In-memory page-wide consent loses reload lifetime; persistent
consent exceeds one session; broadcasting consent to independent tabs changes specified semantics.

## R8 — Tests reuse existing tooling; local evidence is not a hosted release

**Decision**: Existing Vitest/Node fs tests cover build/env/helper/gate/locales/security and
workflow contracts. Inspect fixed workflow text and test the actual inline freshness code
with mocked API responses; optional actionlint provides YAML/expression validation. No installed
YAML parser is present; do not invent one or add a dependency just for a fixed workflow.
Use real browser tests for native picker/order, stacked-dialog focus, resources at root/non-root,
offline and keyboard/locale/theme/native zoom. Only synthetic vault inputs.

**Rationale**: Source text tests alone cannot prove YAML/platform permissions or publication
behavior. Executed local build checks and browser results must be recorded separately from
authorized live CI/Pages runs. No settings, credentials, pushes or remote infrastructure are
authorized by planning. Missing live evidence must be labeled not executed, not successful.

**Alternatives considered**: A new end-to-end framework dependency, fake deployment logs or
executing PR payloads with privileged triggers expands scope or creates misleading evidence.

## Source references

- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub workflow concurrency and queue limits](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)
- [Workflow reruns](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/re-run-workflows-and-jobs)
- [Variables context](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#vars-context)
- [Secure workflow use](https://docs.github.com/en/actions/reference/security/secure-use)
- [Vite Pages deployment](https://vite.dev/guide/static-deploy.html#github-pages)
- Upstream action releases: [checkout](https://github.com/actions/checkout/releases/tag/v7.0.1),
  [setup-node](https://github.com/actions/setup-node/releases/tag/v7.0.0),
  [configure-pages](https://github.com/actions/configure-pages/releases/tag/v6.0.0),
  [upload-pages-artifact](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0),
  [deploy-pages](https://github.com/actions/deploy-pages/releases/tag/v5.0.1).
- Action contracts/source: [configure-pages](https://github.com/actions/configure-pages/blob/v6.0.0/action.yml),
  [artifact packaging](https://github.com/actions/upload-pages-artifact/blob/v5.0.0/action.yml),
  [deploy cancellation](https://github.com/actions/deploy-pages/blob/v5.0.1/src/index.js),
  [same-run artifact API](https://github.com/actions/deploy-pages/blob/v5.0.1/src/internal/api-client.js).

## Resolution status

All technical decisions are resolved. Planning found no need for a new app dependency,
network-policy change or constitutional amendment. Narrow policy reconciliation is an explicit
first implementation prerequisite, not an unresolved permission to persist vault data. Actual
GitHub settings, live run results, browser results and publication availability remain evidence
to collect during implementation or explicitly record as unavailable.
