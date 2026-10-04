# Data Model: Automated Verification and Optional Hosted Demo

**Spec**: [spec.md](spec.md) | **Date**: 2026-10-04

This feature introduces build/publication context and one non-sensitive acknowledgment.
It introduces no vault schema changes, backend, account, telemetry or persistent vault state.

## 1. Build context

| Field | Values / validation | Lifetime |
| --- | --- | --- |
| hostedDemo | True only for explicitly marked demo output; false for ordinary local builds | Immutable for loaded build |
| baseUrl | Relative local default, or explicit trailing-slash root/repository prefix for demo output | Immutable for loaded build |
| revision | Source commit verified for publication; not a browser visitor identifier | Automation/publication provenance |

Demo identity and warning behavior derive from build context, never imported documents,
current hostname, HTTP versus file URLs, user language or preferences. Demo output retains
its identity in a local preview or custom-domain deployment. Ordinary local builds never
read or write hosted acknowledgment.

## 2. Verification run

- Identity: repository, workflow run/attempt and immutable tested source SHA.
- Trigger: push to `main`, or pull request with base `main`.
- Ordered outcomes: installation → lint → tests → production build.
- States: queued → running → successful / failed / cancelled.
- Failure or cancellation grants no publication eligibility. Later checks may be skipped
  after a failed prerequisite; the overall result is unsuccessful, not an all-checks pass.
- Pull request code may be tested but must never receive Pages publication credentials,
  write authority, or a privileged follow-up that executes its artifact as trusted code.

## 3. Publication decision and artifact

- Enablement: explicit repository opt-in; absent or any value other than the documented
  enabled value is disabled. Enablement affects publication only, never required CI.
- Eligibility: successful required verification, push from `refs/heads/main`, enabled
  publication, demo build success and matching current eligible source revision.
- Artifact identity: this run's verified SHA and demo production output. No other run's
  pull request artifact, dependency tree, checkout contents or synthetic/private vault files.
- Publishing states: disabled/ineligible → skipped; eligible → build demo → package output
  → queued deployment → stale/skipped or deploying → published/failed.
- Deployment ordering: serialized publication plus a freshness check prevents an older run
  or rerun from replacing a newer successful main publication. No partial output is exposed
  as a new successful demo. See [automation contracts](contracts/automation-contracts.md).
- Repository settings and deployment URL are maintainer/platform state, not vault data.
  Local planning does not activate them or claim a public URL is verified.

## 4. Hosted acknowledgment

| Field | Rule |
| --- | --- |
| key scope | Fixed application key scoped to the build's base URL, not any vault value |
| retained value | Only the exact constant `1` means acknowledged; other/missing values mean unacknowledged |
| storage | Tab-scoped sessionStorage; no localStorage/cookies/IndexedDB acknowledgment |
| fallback | Explicit Continue authorizes only the immediate picker attempt if storage access throws; subsequent attempts/reload warn again |
| reset | Browser ends that tab session; not vault close, replacement, language/theme change or chooser cancellation |

Session reads and writes are restricted to a small hosted-only boundary. No filenames,
paths, hashes of vaults, search, timestamps, IDs, documents, comparisons, history or consent
analytics are included. Build base URL is public configuration, not vault-derived identity.
The existing language/theme reader and writer retain their separate two-key contract.

Browser-native tab duplication or restore may inherit a session; independently opened
unacknowledged tabs warn. No browser-wide or forensic session-reset guarantee is made.

## 5. Warning and pending import intent

The warning has fixed localized content, not a vault-dependent message. It carries no file,
filename or document payload. A pending picker intent may be a boolean in App memory only;
it must not capture a File, stale document callback or a promise to discard a draft later.

| Current state | Event | Next state / effects |
| --- | --- | --- |
| Local build | Request file choice | Existing import guards and chooser; no hosted state |
| Demo unacknowledged | Request file choice | Warning open; chooser/read blocked |
| Warning open | Cancel, Escape, close, local-use choice | Warning closed; no acknowledgment, chooser or mutation |
| Warning open | Continue | Acknowledge session; re-evaluate existing unsaved/draft guards before picker |
| Demo acknowledged | Request another file | Existing import guards and chooser, no warning |
| Demo unacknowledged | Unexpected file-input change/drop | Reject read; clear input/payload and show warning; do not retain the file for automatic replay |
| Any state | Failed/cancelled unsaved guard or chooser | No vault mutation; acknowledgment remains if Continue was explicitly chosen |
| Demo acknowledged | Reload | Read session flag; no warning if retention works |
| Storage unavailable, immediate attempt authorized | Chooser cancel, read completion/failure, next request or reload | Clear the one-attempt authorization; warning required again |

Only successful existing import can replace a vault. The warning is not authorization to
bypass unsaved work; guards are checked again at the actual picker/read boundary. Closing
or replacing a vault releases vault state normally without clearing session acknowledgment.

## 6. Unchanged entities

Working/original documents and bytes, undo snapshots, selection, item/folder/name drafts,
privacy state, comparison/ignore state and export files remain governed by their existing
in-memory boundaries. No domain mutation or stored preference is needed for warning/demo UI.
The feature does not change Bitwarden/Vaultwarden JSON compatibility or export semantics.
