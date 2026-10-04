# Verification and Pages Publication Contracts

**Spec**: [spec.md](../spec.md) | **Research**: [research.md](../research.md)

## CI-01 — Mandatory main-bound verification

| Property | Contract |
| --- | --- |
| Workflow | `.github/workflows/ci.yml` |
| Events | Push branch main; pull_request base branch main, including synchronize updates |
| Excluded triggers | No pull_request_target, privileged workflow_run or non-main publication dispatch |
| Runner/project Node | GitHub-hosted Ubuntu, Node 24, existing lockfile/engine requirements |
| Verify authority | contents/read only; checkout persist-credentials false; no Pages write/OIDC or secrets |
| Steps | Checkout → setup-node → npm ci → npm run lint → npm test → npm run build |
| Outcome | Any prerequisite failure/cancellation makes verification unsuccessful and prevents publication |
| Opt-in independence | Verify always runs on eligible events regardless of Pages variable/settings |

No path filters skip code/docs changes or fork PR verification. Default PR event types
include opened/synchronize/reopened. Checks execute on the event revision (PR merge test
revision for normal pull_request); they do not test a moving main checkout. No branch protection
or required-check setting changes are automatically performed by this feature.

## PG-01 — Demo artifact eligibility and content

`demo-build` requires successful `verify` and all of:

- `github.event_name == 'push'`;
- `github.ref == 'refs/heads/main'`;
- event repository is not a fork;
- repository variable `VAULTSORT_PAGES_ENABLED` exactly equals `'true'`.

Absent, empty, false or differently spelled values are disabled. The deploy job repeats these
eligibility checks; no deployment permission is attached to untrusted PR verification.

Demo-build checks out immutable `github.sha` with credentials persistence disabled, uses
Node 24/`npm ci`, obtains Pages metadata with `enablement: false`, and builds that same source
with `VITE_HOSTED_DEMO=true` and base `${base_path}/`. Its production-build failure blocks
packaging. It has contents/read and pages/read, not pages/write or id-token/write.

Only `dist/` becomes the `github-pages` artifact. Reject unexpected output symlinks because
the uploader dereferences them. The checkout, node_modules, tests/fixtures, private files,
vault exports and credentials must never be the artifact source. Preserve expected index,
manifest/icons, preference startup script, built app/CSS/font and font license output.

Use the researched full action SHA pins from [R4](../research.md#r4--use-current-official-action-pins-and-native-pages-artifacts),
with version comments. Revalidate upstream compatibility at implementation rather than
substituting floating tags or old example versions without evidence.

## PG-02 — Protected serialized publication and freshness

- `deploy` requires successful `demo-build`, uses the `github-pages` environment, contents/read,
  pages/write and id-token/write only. No checkout, npm command or app/artifact execution occurs
  here; only trusted inline eligibility/freshness code and official deploy action execute.
- Deploy jobs share one repository publication concurrency group, `vaultsort-pages-publication`,
  with `cancel-in-progress: false`, `queue: max`. Verification does not share that lock.
- After lock acquisition and any environment approval, the trusted workflow guard reads current
  main ref via the read-only GitHub API. Token, repository, API URL, source SHA and output paths
  enter through environment variables, not untrusted interpolation into executable shell source.
- Current valid main SHA equals event SHA: mark fresh and permit immediately following deploy.
  A different valid SHA: explicitly report stale publication skipped, do not deploy. HTTP error,
  transport failure, missing ref or malformed response: fail the job closed, not a success/skip.
- Repeat the guard on job-only reruns; do not reuse a cached verify/demo-build freshness result.
- Official deploy-pages locates this workflow run's artifact and reports page_url after success.
  Failures never imply a new verified URL or successful replacement. Environment URL only has
  a value for a successful deployment; a stale skip is not a newly published demo.

### Ordering and recovery contract

Forward-only main history is an operational prerequisite. All feature publication attempts
use this same group. A deploying before B holds the lock until its action completes; B cannot
publish first then be overwritten by A. If B publishes before old A gets the lock, A fails
current-main equality and skips. A push after A's guard can make A temporarily stale, but B
cannot publish before A exits, so A cannot overwrite an already newer successful publication.

Latest-main policy may skip a passing older A when main has advanced to B, even if B later
fails. Keep the previous published site; do not fall back automatically to A. Rollback is a
new verified revert commit, not forcing main back or replaying an obsolete run. Intentional
force resets, unrelated publishers and manual remote administration are outside this ordering
guarantee; do not call them covered by a SHA-equality check.

GitHub queues up to 100 pending deploys with `queue: max`; exceeding that limit/platform
limits, manual cancellations and outages are visible operational exceptions, not successful
verification/deployment. Concurrency is not a universal remote cancellation transaction.

## PG-03 — Maintainer setup and opt-out

Prerequisites: maintainer authority, eligible Pages repository/account, Actions enabled,
Settings → Pages → Source: GitHub Actions, and an appropriately protected `github-pages`
environment allowing main. No PAT, hosted vault fixture or automatic enablement is required.

Set repository variable `VAULTSORT_PAGES_ENABLED=true` to opt in. An eligible future main
push (or explicitly authorized rerun of the current eligible main run) builds/publishes.
The workflow never enables Pages remotely itself. Missing Pages configuration fails demo
publication without invalidating otherwise successful verification.

Removing/setting the variable to false stops future eligible publication; it does not unpublish
an existing site or guarantee cancellation of an in-flight job. Taking down an existing demo
uses Pages administration separately. README must explain this distinction and identify any
published URL only when its successful execution has been observed.

## PG-04 — Validation and evidence boundary

| Case | Expected result |
| --- | --- |
| PR base main, including fork | Four required verification commands; no demo/deploy job authority |
| Push main, unset/false opt-in | Verify succeeds/fails normally; publication skipped |
| Push main, enabled, any required check fails | No demo artifact/publication |
| Enabled main, demo build fails | Verification result remains identifiable; deployment blocked |
| Enabled verified main, current SHA | Same-SHA demo artifact and successful eligible deployment |
| Enabled verified main, stale SHA / old rerun | Inside-lock stale skip; no publication |
| Ref API transport/status/shape failure | Fail closed; no publication |
| Out-of-order A/B completion | No old run overwrites newer successful demo under forward-only history |
| Wrong Pages settings/permissions | Clear publication failure; no unsupported active-demo claim |
| Root/repository prefix | All required resources resolve under intended prefix; unchanged CSP/startup/font/license |

Vitest reads actual workflow text and exercises actual embedded guard code with deterministic
mocked ref responses. Minimal fixed-shape text assertions are not a YAML parser or a GitHub
runner: optional actionlint and authorized actual run evidence complement them. Do not test
fork safety by executing hostile app code with deployment secrets or privileged event triggers.

Record static/guard/local build/browser checks separately from real GitHub CI/Pages URLs,
run IDs/attempts, source SHA, artifacts and live outcome. If no authorized test repository/run
is available, mark **CI/Pages not live-executed** and list exactly which remote cases remain
unverified. Planning and source documentation do not constitute deployment evidence.
