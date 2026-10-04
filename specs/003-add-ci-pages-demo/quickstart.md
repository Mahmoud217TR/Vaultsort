# Quickstart Validation: Automated Verification and Optional Hosted Demo

**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)
**Contracts**: [UI](contracts/ui-contracts.md), [automation](contracts/automation-contracts.md)

This is a future implementation validation guide, not a claim these features/tests already
exist or that CI/Pages ran. No real vault files may be used. Planning does not authorize
pushes, credentials, repository-settings changes or public deployment.

## 1. Prerequisites and baseline

- Use the declared supported Node environment; Node 24 matches planned CI. Use the checked-in lockfile.
- Read AGENTS.md, design-system.md and the policy reconciliation in [plan.md](plan.md#constitution-check).
- Keep synthetic inputs/evidence outside public/dist, preferably
  `/tmp/opencode/vaultsort-pages-validation/`. Never publish that directory.
- An already available real-browser tool may be used for acceptance; do not add app dependencies
  solely to automate this guide. Optional actionlint checks syntax, not live behavior.
- Preserve existing work; use separate output directories for base/identity cases, not git resets.

From repository root run each command in order:

```bash
npm ci
npm run lint
npm test
npm run build
git diff --check
```

Expected: all required gates pass. Record actual counts/versions/failures in the feature's
future implementation.md. Do not use prior feature results as proof of these gates.

## 2. Automated contract checks

After their implementation, run the proposed focused suites and then the full suite:

```bash
npm test -- src/hostedDemo.test.ts src/components/hostedDemo.test.ts src/ci/workflows.test.ts src/components/security.test.ts src/components/branding.test.ts src/i18n/i18n.test.ts
npm test
```

Check local zero-session-access, demo flag exactness, fixed-value/prefix scope, missing/invalid
flag, storage errors, all dismissal routes and before-picker/before-FileReader ordering.
Stub env and storage with isolation; no real vault payload in errors/fixtures. Preserve
existing security scan bans except the exact hosted helper with explicit assertions.

Exercise direct input native click/change as well as both visible callers. Unsaved committed
work, item/folder/comparison drafts and cancelled guard responses must remain intact. Unexpected
unacknowledged file changes are refused, not cached for later replay. Continue cannot bypass
atomic load/version/abort semantics or grant permanent consent.

Workflow tests inspect actual triggers, command order, pins, permissions, exact opt-in,
needs/immutable SHA/artifact scope and embedded freshness guard. Run current/stale/error
responses against the actual guard and model both completion orders/old reruns. If available:

```bash
actionlint .github/workflows/ci.yml
```

If actionlint is unavailable, record that exclusion; do not label string assertions as
workflow-platform validation or invent a replacement YAML parser.

## 3. Build ordinary local, root-demo and subdirectory-demo output

Use Vite CLI output/base overrides so outputs remain separate and no prior dist is deleted:

```bash
npm run build -- --outDir /tmp/opencode/vaultsort-pages-validation/local
VITE_HOSTED_DEMO=true npm run build -- --base / --outDir /tmp/opencode/vaultsort-pages-validation/root-demo
VITE_HOSTED_DEMO=true npm run build -- --base /demo-check/ --outDir /tmp/opencode/vaultsort-pages-validation/subdir-demo/demo-check
```

Expect ordinary local output to be unmarked with no hosted flag storage access. Both demo
outputs must be marked, including when served locally. Inspect generated index/CSS/manifest
and asset tree: preferences script before styles, correct module/preload/font/icon URLs,
one favicon integration, unchanged CSP, bundled font/license and no fixtures/private files
or symlinks. A fresh ordinary local build should not inherit a shell-exported demo environment.

Serve each output using an available local static server, for example in separate terminals:

```bash
python3 -m http.server 4180 --bind 127.0.0.1 --directory /tmp/opencode/vaultsort-pages-validation/local
python3 -m http.server 4181 --bind 127.0.0.1 --directory /tmp/opencode/vaultsort-pages-validation/root-demo
python3 -m http.server 4182 --bind 127.0.0.1 --directory /tmp/opencode/vaultsort-pages-validation/subdir-demo
```

Open `http://127.0.0.1:4180/`, `http://127.0.0.1:4181/` and
`http://127.0.0.1:4182/demo-check/`. The third server's parent directory deliberately tests
a genuine prefix, not a server that pretends the subdirectory is site root. No file:// tests.

Record all application asset requests/statuses and assert no unintended origin-root asset
URLs under the subdirectory. Include manifest icons/start/scope, favicon variants, preference
startup, app/CSS/font, translations and `/demo-check/fonts/OFL.txt`. Verify direct reload and
Arabic/dark preference restoration before paint. Do not fetch manifest/license files dynamically
in the application to make this test pass.

## 4. Synthetic browser import/session scenarios

Create a small unencrypted JSON fixture outside the build output, for example two login
items sharing a synthetic username and `https://example.test`, with distinct synthetic
passwords, one folder and an opaque root property. Use explicit fictional names/secrets.

1. Ordinary local output: import/export/original-copy unchanged; no demo identity or warning,
   no hosted acknowledgment session read/write, no new storage or network behavior.
2. Fresh demo tab: label visible; activate Select JSON with keyboard. All five trust statements
   must precede the actual browser filechooser event. No FileReader or chooser before Continue.
3. Cancel, Escape, header close, backdrop, local-use alternative: no acknowledgment/read or
   mutation. Retry shows warning. Local guidance must be accessible without accepting demo use.
4. Continue: session decision only; actual picker opens from an allowed user action. Cancel the
   picker then retry: no repeated warning with working retention. Import a synthetic file;
   label remains. Close/reopen, replace and reload in the same session: no repeated warning.
5. Independent fresh tab/new unacknowledged session: warning appears. Browser restore/duplicate
   semantics may retain inherited flag as documented; do not claim stronger reset guarantees.
6. Set malformed acknowledgment values and deny storage reads/writes in test context: no bypass,
   no private error/logging. Explicit immediate Continue still works; later attempts warn again.
7. Direct hidden-input click/change before acknowledgment: chooser/read blocked and unsolicited
   payload not retained. Native keyboard activation must also obey the gate.
8. On a loaded dirty vault with item/folder/comparison-name drafts, test replacement warning,
   cancellation and unsaved-confirm refusal. Retain form values, page/selection/original/history.
   Stacked dialogs have unique headings; focus/trapping/global shortcut precedence remain correct.

Repeat warning/label/actions in English/Arabic × light/dark, CSS widths 320/768/1280/1440,
native 100% and 200% browser zoom, reduced motion and keyboard-only navigation. Record engine,
native zoom/window metrics, focus/Escape, AA contrast, bounded scroll/no page overflow and
synthetic screenshots. CSS transforms or device emulation alone are not native zoom evidence.

## 5. Offline, request, storage and preservation checks

After all local assets load, disable the network through the browser tool. Complete Continue,
import, edit/apply, undo, duplicate comparison, full/selected/folder export and original-copy
download with synthetic data. Inspect request/console/storage logs without recording real data.

Expected:

- No automatic third-party requests, APIs, telemetry, vault uploads, remote assets or imported HTML.
- Only language/theme localStorage and hosted-only constant session decision under its exact
  base-scoped key. Local output has no hosted session state; no timestamps/IDs/file metadata.
- Warning/acknowledgment do not alter source semantics, original bytes, privacy defaults,
  working/history or exported data. Existing deliberate edits remain reversible.
- Hosted initial asset requests/IP logging are documented honestly, not claimed to be zero
  network activity during page loading or protection against a malicious delivered build.

## 6. Optional authorized GitHub execution

Do not perform these remote actions without separate repository-owner authorization.
Local planning/builds do not activate Pages. For an authorized disposable nonfork test repo:

1. Leave `VAULTSORT_PAGES_ENABLED` unset: exercise main push and PR/base-main (including fork PR)
   and confirm only verification runs. Introduce each check failure separately using synthetic
   disposable changes; no required failure produces artifact/publication eligibility.
2. Maintainer configures Pages Source: GitHub Actions and the github-pages environment/main
   protection; then sets repository variable `VAULTSORT_PAGES_ENABLED=true`.
3. Trigger an authorized eligible main push or rerun the current eligible main run. Confirm
   exact same-SHA demo build, Pages-derived base, dist-only artifact and least-privilege jobs.
4. Verify successful page_url in the real run and load that URL/assets before claiming a live
   demo. Test stale SHA, old rerun after newer publication and failures at the guard/build/deploy;
   guard failure is not success and out-of-order runs do not roll back under forward-only main.
5. Opt out: remove/set variable false and verify future publication skips while CI stays on.
   Explain that an existing site is not unpublished automatically and in-flight remote work
   requires separate administration. Rollbacks use new verified revert commits, not force resets.

Record run URLs/IDs/attempts, revision/artifact hashes, permissions/environment results and
observed site behavior separately from local tests. If unavailable: state **CI/Pages not
live-executed**, with remote permission/concurrency/publication cases unverified. Never deploy
real/private fixtures, use a hosted vault upload destination or imply a security audit.

## 7. Completion evidence

Record feature FR-001–019/SC-001–008 coverage, commands/tests/builds, exact artifact/browser
versions, warning/session/path/offline outcomes and unavailable remote/browser/hardware checks
in implementation.md. Align README/CONTRIBUTING/SECURITY/AGENTS storage/trust wording and remove
stale "no configured automation" claims only once implemented. README must not advertise an
unobserved live demo. Keep previous performance/participant/import acceptance markers untouched.
