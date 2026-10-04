# Implementation evidence

Reviewer-owned checklists remain read-only. Evidence requested by tasks is recorded here
instead of `checklists/implementation.md`, following the implementation command's gate rules.

## Setup — T001–T002

- Node v24.21.0; existing installed lockfile dependencies reused; private npm package, no publishing ignore needed.
- Original build, fixture and raw report from baseline.md retained outside the repository.
- Initial lint, all 63 tests and production build passed.
- Existing user-staged specification/governance files left intact; no commits or resets.
- Git/ESLint ignore patterns verified; added missing build/editor/coverage/minified patterns.
- No Docker/Prettier/Terraform/Helm configuration detected; no unnecessary ignore files created.

## Acceptance status

Source implementation covers the six stories, but complete acceptance is **not signed off**.
Unchecked tasks are performance, representative-user acceptance and final sign-off; passing
automated checks do not replace those gates. Earlier progress messages describing
whole task ranges as complete were checkpoint summaries, not proof of every task's full matrix;
the checked markers in tasks.md are the authoritative completed subset.
SC-001 requires five real representative participants; unavailable in this agent session.
Firefox/Safari and real touch hardware availability must be reported, not inferred from Chromium.

## Executed evidence (synthetic data only)

Latest automated checks: `npm run lint` passed; `npm test` passed **97 tests in 8 suites**;
`npm run build` passed; `git diff --check` passed. Final production browser story/layout/
preference/help scripts passed their scoped assertions. `tasks.md` records **47 complete,
3 pending** tasks. `.specify/extensions.yml` was absent before and after execution;
no extension hooks were registered or dispatched. This is a partial implementation report,
not full acceptance or completion of T050's final sign-off.

Evidence directory: `/tmp/opencode/vaultsort-refinement-validation/`; browser scripts:
`/tmp/opencode/vaultsort-ui-tools/refinement-{story-check,issues,layout,preferences-help,performance}.mjs`.
These external paths are local retained evidence, not portable repository fixtures or CI jobs.

- `story1.json`: all four language/theme pairs × native popover/dialog fallback. Independent
  fields, literal notes, DOM masking, Escape and connected-invoker focus passed in Chromium.
- `story2.json`: table/Review/export warning entry points, export-dialog removal before focus,
  masked fields and cancelled draft navigation passed across the four pairs.
- `layout-new.json`: 28 cases covering 320/768/1024/1280/1440 widths, 800/900/600 heights,
  long/mixed-script content and optional fields. Desktop scroll bounds and editor/list footers
  passed; the hidden Notes label's offset parent is `.editor-scroll`. Narrow return focus passed.
  The 720 × 450 case is a zoom-equivalent CSS viewport, **not actual browser 200% zoom**.
- At 1280 × 800, collapsed controls measure **58 px**, with **8 fully visible rows**, in all pairs.
- `preferences-help.json`: 1,666 SSH items, all Personal/zero Work in the fixed fixture;
  per-key failing restoration, saved combinations, blocked-write session changes preserving
  drafts/selection/privacy/fields, tooltip Escape, fixed links and zero automatic external
  requests passed. A jsdom case separately puts SSH in both Work and Personal folders.
- App tests verify unchanged original bytes after edits and export, unknown-value preservation,
  no imported HTML evaluation, approved preference keys only and locale placeholder parity.
- `design-detector.json`: only the incumbent Inter font was flagged; it is explicitly required
  by AGENTS.md/design-system.md and was retained, with its distributed license.

## Performance gate — pending

Same 10,000-item fixture/hash, Chromium 153.0.8010.12, headless, UTC, English/light,
1280 × 800, reduced motion, no throttling, one warm-up/five completed-render samples per operation.
Original `baseline.json` and old production build remain untouched. `performance-first.json`
retains the first comparison; `performance-new.json` retains the later comparison.
Repeated date parsing was measurably expensive; timestamps are now parsed once per row.
The measured comparison after that change met 8/11 original medians; modified ASC/DESC and
paired-date hiding remained above their old medians by approximately 0.2/0.1/0.3 ms respectively.
No tolerance or fixed time budget is substituted for the specified no-regression requirement.
T047 therefore remains unchecked. Independent field-show samples have no fabricated old comparator.

## Action-help inventory

Static, localized Tooltip descriptions cover compact Fields/Sort/Filters, help, privacy,
undo/redo (including disabled states), original backup, folder-create/manage icons, bulk actions,
row favorite/warning, pagination, notices/errors, editor Close/Apply/Reset/reveal/copy/delete,
Review issue inspection, dialog/note Close, and blocked export. Existing visible labels/context
remain on text actions and form controls. Tooltips contain no imported values; disabled wrappers
are keyboard reachable, hoverable descriptions stay in their owning dialog, and Escape does not
discard a draft. Native/fallback note inspection owns Escape before Close-button help.

## Remaining release/acceptance boundaries

- Regression, actual Chromium zoom and integrated browser matrices are complete; performance,
  representative-user acceptance and final sign-off remain pending.
- Resolve the exact-median performance gate; retain all runs rather than selecting a passing rerun.
- Conduct SC-001 with actual participants; no study or user clarity rating is claimed.
- No Firefox/Safari, real touch hardware, independent security audit, or GitHub private-reporting
  configuration verification is claimed. No commit, push, dependency, persistence or CSP change.

## Requirement evidence ledger

“Covered checks” describes only the evidence above; “pending matrix” is not acceptance sign-off.

| Requirement | Current evidence / remaining gate |
| --- | --- |
| FR-001 | Incumbent tokens/assets/workflows retained; full integrated regression pending. |
| FR-002 | Labels, filter count and collapsed sort state; component and browser checks. |
| FR-003 | Filter reset retains category/search/fields/sort; selection/page and bulk regressions pass. |
| FR-004 | Existing sort/preservation tests; per-row date parsing retains stable ties/invalid-last. |
| FR-005 | Three false defaults, eight field combinations and replacement/close resets pass. |
| FR-006 | Session-only choices survive sort/filter/preferences; exports and originals remain unchanged. |
| FR-007 | Login/note/SSH/unknown, malformed/blank and 150-emoji truncation cases pass. |
| FR-008 | Literal native/fallback rendering, keyboard focus and touch-emulated opening pass. |
| FR-009 | Masking and hide/replace/delete/undo/redo/close invalidation regressions pass. |
| FR-010 | Locale/invalid-date tests pass, including America/New_York local-time execution. |
| FR-011 | All warning entry points, URI entry positions and safe fallback focus checked. |
| FR-012 | Page/filter/sort/selection/modal/draft cancellation and stale shift/undo/redo/replacement pass. |
| FR-013 | SSH classification/counts/folders/ownership/active-zero/deletion/undo checks pass. |
| FR-014 | Desktop scroll bounds/footer checks passed; no global clipping introduced. |
| FR-015 | Tested widths have no horizontal page overflow; actual zoom/touch workflow matrix pending. |
| FR-016 | Native values/root state and blocked-write draft retention checked across all pairs. |
| FR-017 | Independent per-key restoration/defaults, blocked writes and approved storage keys checked. |
| FR-018 | Static help inventory and scoped hover/focus/Escape/disabled/touch-emulated checks pass. |
| FR-019 | Banner removed; import/summary/all export states retain guidance; backup byte check passed. |
| FR-020 | Fixed repository footer destination/new-tab attributes checked. |
| FR-021 | Fixed import/workspace Issues destinations and explicit keyboard/touch navigation pass. |
| FR-022 | Independent tagline/home anchors; new-tab activation retains desktop drafts/workspace. |
| FR-023 | Zero automatic external requests in tested workflows; CSP unchanged. |
| FR-024 | Four pairs, scoped rendered contrast, keyboard/focus/reduced motion and actual Chromium zoom pass. |
| FR-025 | Existing storage/privacy/security checks; no extra dependency or persistence. |
| FR-026 | Expanded preservation, metadata, SSH, note-lifetime and navigation regressions pass. |
| SC-001 | Pending actual representative participants; T048 remains unchecked. |
| SC-002 | Independent columns/defaults/reset variants and two-activation browser flows pass. |
| SC-003 | Expanded item-target, stale-request, cancellation and fallback matrices pass. |
| SC-004 | Desktop/narrow long-content bounds and actual Chromium 200% zoom pass; physical touch and other engines unverified. |
| SC-005 | Measured pass: eight rows, 58 px collapsed controls across all pairs. |
| SC-006 | Keyboard/tooltip/focus regressions and integrated keyboard editing/layout checks pass. |
| SC-007 | Saved pairs/per-key failures/defaults/blocked writes covered; passing scoped evidence T037. |
| SC-008 | Expanded masking/invalidation, all field combinations and original/export preservation pass. |
| SC-009 | Counts/classification/folders/ownership/deletion/undo/active-zero matrix passes. |
| SC-010 | Explicit new-tab navigation, draft retention and offline edit/export/undo/backup pass. |
| SC-011 | 10,000-item filter/sort/field/note inspection timings and exact preservation verified. |
| SC-012 | Pending exact median gate; latest final-build comparison passes 7/11, not full acceptance. |

## Continuation — completed regression and browser matrices

- Completed T005/T006/T014/T027/T038, then T012/T021/T032/T045. Documentation T049 is complete.
- `continuation-tests.log`: 97 tests pass. `local-timezone-tests.log`: sorting/field tests also pass
  under `TZ=America/New_York`, not only the UTC browser benchmark environment.
- `story1-complete.json`: 16 language/theme × native/fallback × pointer/touch-emulated cases;
  each verifies exact original bytes and exported values/source order. No real hardware claim.
- `links-offline.json`: eight language/theme × keyboard/touch-emulated cases. All three project
  links open separate fixed-destination tabs; GitHub traffic is intercepted locally, not sent.
  Desktop active drafts survive navigation. Offline editing, export, undo and exact backup pass.
- `preferences-help.json` additionally verifies native keyboard Sort disclosure/value change,
  Escape dismissal and trigger focus return across all four pairs.
- `layout-new.json` rechecks 28 layout cases after test-source CSS exclusion; existing density
  targets and scoped scroll bounds remain satisfied.
- Test-only strings had been adding utility CSS to production. `@source not "./**/*.test.ts"`
  now excludes those fixtures; the font/license/palette and actual component classes are retained.
- The type-category descriptor is now resolved once per filtered-list computation, rather than
  performing descriptor lookup/string conversion for each of the 10,000 items.

## Previous continuation performance and zoom gates

`performance-after-test-exclusion.json` retains the intermediate **4/11** comparison.
`performance-continuation.json` retains the latest five-run comparison after category hoisting,
with asset hashes, fixture hash, actual CPU/Node details, eight new-interaction timing groups,
and exact original/export preservation. **8/11** comparisons meet the unchanged old medians.
Remaining failures (old → new median, milliseconds):

| Operation | Old | New |
| --- | ---: | ---: |
| Modified descending | 31.2 | 31.5 |
| Show both dates | 31.3 | 31.5 |
| Hide both dates | 31.2 | 31.4 |

No rerun is substituted for an earlier failure without recording the changed source and retaining
that earlier evidence. No tolerance is added; T047 remains unchecked.

Actual 200% native zoom was attempted using a local validation-only Chromium extension and
`chrome.tabs.setZoom`, not a fabricated CSS viewport result. Full Chromium was absent; its download
failed with `ETIMEDOUT` after retries. The attempt did not run browser assertions and produced no
`native-zoom.json`. The extension/profile/script remain outside the repository; no application
dependency, permissions or storage policy changed. T025 and the integrated T046/T050 sign-off
remain pending, along with T048's actual representative-user study.

## Final browser acceptance — T025/T046

- Full Chrome for Testing 153.0.8010.12 installed outside the repository after increasing only
  the validation download timeout. The previous failed attempt remains recorded above.
- `native-zoom.json`: **12 actual 200% Chromium zoom cases**, using `chrome.tabs.setZoom(2)` and
  verifying `getZoom() === 2` and `devicePixelRatio === 2`. Native windows are 1280×800,
  1440×900 and 1440×600 across all four locale/theme pairs. Measured CSS viewports are
  640×356, 720×406 and 720×256 (browser chrome accounts for the difference from half-height).
  Privacy is off, all optional fields are on, and the opened note item has a long mixed-script
  name and 2,000-character literal note. Reset, Apply, Close, filters and return focus pass;
  document scrollWidth equals clientWidth. This is actual page zoom, not CSS scaling.
- `layout-new.json`: the 28-case width/height matrix now explicitly opens the **long-content
  item**, rather than only showing its name in the table. Keyboard Reset/Apply/Close pass;
  expanded Filters are measured with the editor on desktop and after closing the intentionally
  exclusive compact editor at narrow widths. Desktop document/footer bounds pass; narrow
  horizontal page overflow is absent. The earlier scoped matrix is retained as
  `layout-prior-scoped.json`.
- `integrated-workflows.json`: all four pairs pass keyboard edit/close, folder creation, bulk
  move, Review/export, undo of bulk move/folder creation/edit, redo, exact original bytes and
  opaque unknown/SSH data preservation. Existing automated confirmation and navigation checks
  accompany these browser workflows; no production test hooks were introduced.
- `contrast-before.json` records the detected light import badges at **4.34:1**. A failing
  branding regression was added first; `.file-tag` and `.step-number` now reuse
  `--text-secondary`. `contrast.json` checks rendered text against effective ancestor surfaces
  in import, summary, editor, focused help, note inspector, Review and export across all four
  pairs; scoped checks pass. It excludes hidden/offscreen, disabled/opacity, SVG and option
  content and is not a comprehensive independent WCAG certification.
- Native/fallback notes, warning focus/cancellation, preferences/help and offline/new-tab links
  were rerun against the final production assets. Lint, all **97 tests**, production build and
  diff checks pass (`final-acceptance-tests.log`). CSP, local font license and preference-only
  persistence remain checked by the existing security/branding/i18n suites.
- `final-design-detector.json`: only the explicitly required incumbent Inter is flagged.
  Font/branding/palette are retained. Firefox/Safari and physical touch hardware remain
  unverified; touch results are Playwright synthesis, not physical-device observations.

## Final-build timing and sign-off boundaries

`performance-final-contrast.json` records an isolated one-warm-up/five-sample run after the
contrast fix, with production asset hashes, the unchanged fixture/environment, all eleven old
comparators and eight new-interaction groups. Prior runs are retained, including
`performance-before-contrast-fix.json`. Exact original bytes and parsed export/source order pass.
Only **7/11** old medians are met; the strict gate is still **not passed**:

| Failing operation | Old median (ms) | Final median (ms) |
| --- | ---: | ---: |
| Name descending | 30.7 | 30.9 |
| Modified ascending | 31.0 | 31.4 |
| Show both dates | 31.3 | 31.4 |
| Hide both dates | 31.2 | 31.3 |

The failing operations vary across retained runs near the two-frame rendering checkpoint;
this does not authorize a tolerance, a favorable rerun, or a claim of meeting SC-012.
T047 and T048 remain unchecked, and T050's final sign-off remains pending their gates.
FR-001–026 and SC-001–012 were reread against the spec/contracts; the table above records
implemented behavior and exclusions rather than waiving performance or participant acceptance.
