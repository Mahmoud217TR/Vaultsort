# Feature Specification: Automated Verification and Optional Hosted Demo

**Feature Branch**: `chore/pages-ci` (existing branch; no branch created or switched)

**Created**: 2026-10-04

**Status**: Draft

**Input**: User description: "Add automated verification and an optional GitHub Pages demo deployment for Vaultsort. Verify pushes and pull requests targeting main with npm ci, npm run lint, npm test and npm run build. Publish the production build from main; clearly identify hosted builds as demos and warn before file selection, once per browser session, about local processing, no intentional vault upload, remotely delivered code, recommended local usage and voluntary continuation. Preserve network restrictions, support subdirectory assets and distinguish demo/local usage in README."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Verify Every Main-Bound Change (Priority: P1)

As a contributor or maintainer, I want each change headed to main to receive the same
automated checks, so I can see whether it is suitable for review and publication without
depending on someone remembering to run checks locally.

**Why this priority**: Automated verification provides immediate value without requiring a
hosted demo and establishes the prerequisite for safe publication.

**Independent Test**: Submit a passing synthetic change and separately introduce a failure
in each required check. Confirm main-bound events produce clear outcomes and failed checks
cannot produce a newly published demo.

**Acceptance Scenarios**:

1. **Given** a push to main or a new/updated pull request whose destination is main,
   **When** automated verification runs, **Then** dependency installation, lint, tests and
   the production build are checked and the overall result is visible on the change.
2. **Given** a failure in installation, lint, tests or build,
   **When** verification finishes, **Then** its outcome is unsuccessful, the failed check is
   identifiable, and no deployment is authorized by that run.
3. **Given** a passing pull request, including one from a fork,
   **When** verification completes, **Then** it reports a result without publishing the demo
   or requiring deployment credentials or write privileges for the contributor's code.
4. **Given** demo publication is disabled,
   **When** a main-bound change is verified, **Then** all required checks still run normally.

---

### User Story 2 - Make an Informed Hosted-Use Choice (Priority: P1)

As a visitor to a hosted Vaultsort demo, I want to know that its remotely delivered code
has a different trust boundary before I choose a vault file, so I can decide whether to
continue or instead use a reviewed local build for sensitive data.

**Why this priority**: A demo must not enable file selection without explaining its trust
model; the disclosure is a prerequisite for publishing a hosted build.

**Independent Test**: Exercise a hosted-marked build without deploying it publicly. Attempt
every file-choice entry point before acknowledgment, decline and then explicitly continue;
test reload, another file and a fresh browsing session using synthetic files only.

**Acceptance Scenarios**:

1. **Given** a hosted demo is open,
   **When** a visitor sees its landing screen or workspace, **Then** an enduring, visible
   demo/hosted-build identification distinguishes it from recommended local usage.
2. **Given** the visitor has not acknowledged the hosted warning in this session,
   **When** any action would open file selection, **Then** a warning appears first and no
   file chooser opens or file is read until the visitor explicitly chooses to continue.
3. **Given** the warning is visible,
   **When** the visitor reads it, **Then** it explains browser-local processing, no intentional
   vault upload, remotely delivered code's different trust model, the recommendation to run
   locally for sensitive real vaults, and that continuing is the visitor's choice.
4. **Given** the warning is visible,
   **When** the visitor cancels, dismisses it or presses Escape, **Then** no acknowledgment is
   recorded, no chooser opens and no vault is read or changed; a later attempt shows the warning.
5. **Given** the visitor explicitly continues,
   **When** they choose another file or reload within the same tab session, **Then** the warning
   does not interrupt them again, while the hosted identification remains visible.
6. **Given** a fresh, unacknowledged tab session,
   **When** file selection is requested, **Then** the warning is required again. If session
   acknowledgment cannot be retained, later requests may warn again rather than bypass the gate.
7. **Given** the visitor uses a normal local build,
   **When** choosing a file, **Then** no hosted-demo acknowledgment is required, and existing
   import/draft/unsaved-work guards remain effective.

---

### User Story 3 - Publish a Verified Demo Deliberately (Priority: P2)

As a maintainer, I want an optional demo published from a verified main revision, so people
can try Vaultsort without changing its local-first design or publishing private files.

**Why this priority**: Publication is useful for demonstration, but is optional and must
depend on verification and the hosted-use disclosure rather than become a requirement
for local users or contributors.

**Independent Test**: With publication disabled, verify no deployment occurs. Enable it in
an authorized test repository, verify a main build can publish, and load its root and
repository-subdirectory URLs to check all assets and synthetic offline workflows.

**Acceptance Scenarios**:

1. **Given** the maintainer has explicitly enabled demo publication and configured Pages,
   **When** a main revision passes all required verification, **Then** its production output
   can be published with hosted identification and the pre-file-choice warning enabled.
2. **Given** publication is disabled, or the change is a pull request/non-main revision,
   **When** verification runs, **Then** the change cannot publish a demo.
3. **Given** verification or publication fails,
   **When** the result is reported, **Then** the failure is visible, no failed verification
   result is presented as a verified deployment, and no partial output replaces a working demo.
4. **Given** Vaultsort is published under a repository subdirectory,
   **When** users open or reload it, **Then** application assets, brand images, icons, fonts,
   translations and startup preferences load correctly without referencing unrelated root paths.
5. **Given** demo assets have loaded,
   **When** a user imports, edits, compares and exports synthetic data with the network disabled,
   **Then** the local workflows remain usable with no intentional vault transmission.

---

### User Story 4 - Find the Recommended Local Path (Priority: P2)

As someone evaluating Vaultsort, I want the README to distinguish the convenient demo from
recommended local use, so I can choose the appropriate trust model without interpreting
deployment configuration or mistaking a demo for a secure hosted vault service.

**Why this priority**: Documentation makes the same security boundary discoverable before
visitors open the app and gives maintainers a clear publication decision.

**Independent Test**: Review README instructions against an enabled and disabled demo setup.
Confirm a reader can find local setup, identify the demo's limitations and understand how
publication is enabled without any unsupported live-deployment claim.

**Acceptance Scenarios**:

1. **Given** a reader opens the README,
   **When** looking for how to use Vaultsort, **Then** recommended local usage is clearly
   separated from optional hosted-demo usage, with review/build/serve guidance for sensitive vaults.
2. **Given** the README describes the demo,
   **When** the reader reviews its trust boundary, **Then** it explains ordinary hosted asset
   requests, possible host logging, the delivered-code risk and lack of intentional vault upload,
   without asserting that a compromised host/build is unable to read or transmit secrets.
3. **Given** Pages is not enabled or no deployment has been verified,
   **When** documentation is updated, **Then** it explains the optional setup without claiming
   that an active, verified demo exists.

### Edge Cases

- Pull requests from forks, updated pull requests, pushes outside main and failing checks
  must not inherit publication authority or bypass required verification.
- Two successful main revisions completing out of order must not replace a newer demo with
  an older revision; failed publication must be distinguishable from failed verification.
- Pages disabled, missing publication permissions or repository settings: verification
  remains independent, and deployment must not be reported as successful.
- A repository name or deployment prefix differs from the current one, including root
  hosting versus repository-subdirectory hosting and direct reload under that prefix.
- First import versus replacement import, keyboard activation, alternate picker controls,
  direct access to file inputs or any existing file/drop import path must not bypass the warning.
- Closing the warning without continuation, canceling the browser chooser after continuation,
  closing a vault and changing language/theme must not trigger another warning after an
  acknowledgment in the same session; an unacknowledged request must still warn.
- Reloaded tabs, independently opened tabs, browser-restored sessions and unavailable session
  retention must follow the documented session definition without permanent acknowledgment.
- English/Arabic, light/dark, narrow widths and keyboard-only interaction must retain warning
  readability, explicit actions, visible focus and access to the recommended local alternative.
- Host asset requests and host logs are not vault uploads; CSP is not proof that remotely
  delivered code cannot be altered. No warning may overstate protection against a compromised build.
- Local production previews must not be mislabeled as public demos merely because they are
  served over HTTP; a demo build preview must retain its demo identity for verification.
- Publication content must not include synthetic test fixtures, real vaults, private files,
  dependency directories or unrelated checkout contents.

## Requirements *(mandatory)*

### Functional Requirements

#### Automated verification and optional publication

- **FR-001**: GitHub Actions MUST verify pushes to `main` and pull requests targeting `main`,
  including updated pull requests. Verification MUST not depend on enabling Pages.
- **FR-002**: Required verification MUST perform `npm ci`, `npm run lint`, `npm test` and
  `npm run build` in that order, using the project's declared supported environment and
  locked dependencies. Any failure MUST make the run unsuccessful with an identifiable outcome.
- **FR-003**: GitHub Pages publication MUST be optional and disabled until a maintainer
  deliberately enables it. Its prerequisites, enable/disable procedure and failure states
  MUST be documented; disabling publication MUST not disable verification or local usage.
- **FR-004**: Publication MUST use only production application output from a `main` revision
  that passed all required checks for that revision. Pull requests, forks, non-main revisions
  and failed verification MUST not publish. If creating demo-specific output requires another
  build, failure of that build MUST also block publication.
- **FR-005**: Contributor verification MUST not require publication credentials or deployment
  write authority. Publication authority MUST be limited to the eligible publishing operation;
  unrelated checkout files, vaults and private data MUST not enter the published artifact.
- **FR-006**: Publication MUST report a clear outcome, avoid exposing partial output, and
  prevent an older completed publication from superseding a newer successfully published
  main revision. A publication failure MUST not be disguised as a successful deployment.

#### Hosted identification, warning and session choice

- **FR-007**: A demo/hosted build MUST be visibly identified on both the landing screen and
  working-vault interface throughout use. Its identity MUST not depend on warning acknowledgment
  and MUST not label an ordinary reviewed local build as a hosted demo.
- **FR-008**: Before any hosted file-choice/import entry point can select or read vault data,
  an unacknowledged session MUST display the hosted warning and require explicit continuation.
  Replacement imports and alternate/keyboard entry points MUST use the same gate. An existing
  draft or unsaved-work guard MUST not be weakened or silently answered by acknowledging it.
- **FR-009**: The warning MUST state all five points: processing occurs locally in the
  browser; Vaultsort does not intentionally upload the vault; remotely delivered code has a
  different trust model from a reviewed local build; local use is recommended for sensitive
  real vaults; and continuing with the demo is the user's choice. It MUST not imply that the
  warning or network restrictions guarantee safety against modified/compromised delivered code.
- **FR-010**: The warning MUST offer clear Continue and Cancel/local-use alternatives.
  Dismissal, Escape or cancellation MUST not count as acknowledgment or open file selection.
  Local-use guidance MUST be reachable without selecting a vault or accepting hosted use.
- **FR-011**: Explicit continuation MUST acknowledge the warning only for the current
  tab's browsing session, surviving reloads and subsequent file selections within that session.
  A new unacknowledged session MUST warn again. No permanent or cross-session acceptance is allowed.
  If acknowledgment retention is unavailable, the warning MUST fail safely by appearing again.
- **FR-012**: Session acknowledgment MUST contain only a fixed non-sensitive decision flag,
  never vault contents, filenames, paths, drafts, search, history, comparison/ignore state or
  derived vault information. No timestamp, unique visitor identifier or telemetry is required.
  This narrow session-only exception MUST NOT authorize additional preferences or vault storage.
- **FR-013**: Normal local usage MUST not require hosted acknowledgment. Warning/session state
  MUST not modify imported values, original backup bytes, privacy defaults, exports or undo history.

#### Network, assets, documentation and verification boundaries

- **FR-014**: Hosted publication MUST preserve the existing runtime network restrictions,
  including CSP `connect-src 'none'`. It MUST introduce no telemetry, analytics, external fonts,
  CDN assets, APIs or third-party browser scripts. Necessary delivery of application files from
  the chosen host is distinct from intentional vault transmission and MUST be described honestly.
- **FR-015**: Root and repository-subdirectory hosting MUST load every application asset,
  icon/favicon, font and font license, translation and startup script from its intended
  deployment location. Language/theme restoration before initial rendering MUST remain intact.
  No vault files or runtime remote translation/font dependencies may be added to achieve this.
- **FR-016**: After local assets load, existing vault workflows MUST continue to work offline.
  Only the already approved language/theme preferences and FR-012's narrow session acknowledgment
  may be retained outside vault memory; local builds MUST not create hosted acknowledgment state.
- **FR-017**: All new identification, warning, action and guidance text MUST support English
  and Arabic, light/dark themes, keyboard use, visible focus, screen-reader labels, accessible
  contrast and narrow layouts while preserving the existing visual identity and reduced motion.
- **FR-018**: The README MUST clearly separate optional hosted demo from recommended local
  usage, explain their trust difference, describe verification and optional publication setup,
  and avoid unsupported claims of live deployment, security audits or protection against a
  compromised host/browser. Local setup MUST remain usable without GitHub Pages.
- **FR-019**: Automated regressions and deployment-path checks MUST cover warning ordering,
  cancellation/continuation/session lifetime, unchanged local imports/data, eligible/blocked
  verification/publication cases and subdirectory resources. Browser/offline acceptance MUST
  use synthetic data and document executed results versus unavailable live-deployment evidence.

### Key Entities *(include if feature involves data)*

- **Verification run**: A main-bound change and its installation, lint, test and build outcomes;
  establishes eligibility for review, not automatic trust in hosted code.
- **Publication decision**: Maintainer-controlled enabled/disabled state and publishing
  prerequisites, independent of mandatory verification and local usage.
- **Published demo**: Static production output for a verified main revision, its deployment
  location and explicit demo identity; never a hosted vault-data service.
- **Hosted warning**: Localized trust-boundary disclosure shown before file choice, with
  explicit continuation, dismissal and local-use guidance.
- **Session acknowledgment**: One non-sensitive decision scoped to a tab session, with no
  vault relationship, permanent user identity or authorization to persist other application state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every supported main-bound change receives the complete required verification
  sequence; each seeded check failure is visibly unsuccessful and yields zero publications.
- **SC-002**: Every published demo corresponds to a successfully verified eligible main
  revision. Disabled publication, contributor review changes and non-main revisions produce
  zero deployments; out-of-order publication cannot roll back a newer successful demo.
- **SC-003**: In every unacknowledged hosted import scenario, all five trust statements are
  accessible before file selection, and no file is selected/read until explicit continuation.
  Every cancellation/dismissal scenario leaves acknowledgment and vault data unchanged.
- **SC-004**: After explicit continuation, repeated file choices and reloads in the same
  session cause zero additional warnings when session retention is available. Fresh sessions
  warn again; unavailable retention never silently bypasses the warning. Retained decision
  state contains zero vault-derived values or identifiers.
- **SC-005**: All tested root/subdirectory resources load successfully, including initial
  language/theme restoration. Synthetic import/edit/review/export workflows complete offline
  after loading assets, with zero automatic third-party requests or intentional vault uploads.
- **SC-006**: Hosted identity and every warning action are readable and keyboard-accessible
  in all four language/theme combinations and at widths 320/768/1280/1440 and 200% zoom,
  with accessible text contrast and no loss of actions through page overflow.
- **SC-007**: Documentation gives both visitors and maintainers a complete local-use path
  and a separate optional-demo path, with all five trust points and enable/disable prerequisites.
  No described live deployment or executed acceptance result lacks supporting evidence.
- **SC-008**: All existing regression checks remain successful; synthetic originals, working
  values, exports and history remain unchanged by hosted identification or acknowledgment.

## Assumptions

- The feature directory is `specs/003-add-ci-pages-demo`; it is independent of the existing
  `chore/pages-ci` branch. This specification creates no workflows, deployment, repository
  settings, application changes or claim that CI or Pages has already run.
- "Optional" means an explicit maintainer opt-in, disabled by default, not optional verification.
  Enabling Pages/permissions requires repository authority; setting those remotely is not
  automatically authorized by specifying this feature. Main is the only publication source.
- "Browser session" means the current tab's browsing session, including reloads. It is not
  a browser-wide acknowledgment shared across independent tabs. Browser-native tab duplication
  or session restoration can preserve an existing session; no stronger reset guarantee is made.
- The user request approves only a non-sensitive, session-scoped hosted acknowledgment.
  The constitution permits non-sensitive session state, while current AGENTS.md/README storage
  wording names only language/theme. Planning must explicitly reconcile that wording for this
  one flag before implementation; no vault storage or broad persistence exception is implied.
- Hosted/demo identity is an explicit build/deployment distinction, not a guess that every
  non-file URL is hosted. A local preview of demo output retains its warning for testing;
  ordinary local builds remain unmarked. Custom-domain deployments of demo output retain it too.
- The production app remains a static local-processing editor, not a backend, synchronization
  service or password manager. Build-time dependency retrieval and automation platform operations
  do not authorize additional browser runtime services or intentional vault transmission.
- Host asset-request logging, delivered-code integrity, browser extensions and OS behavior
  remain outside application guarantees. Local use is recommended, not claimed risk-free.
- Existing project governance, localization, branding, preference startup and privacy rules
  apply. No new dependency, infrastructure service, account feature, offline asset cache,
  credential access, real-vault testing or unrelated workflow redesign is requested.
- Existing verification scripts and lockfile are the baseline. Branch protection changes,
  required-check administration, public deployment activation and previously incomplete
  performance/participant/import-compatibility gates are outside this feature's automatic scope.
