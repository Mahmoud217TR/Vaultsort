# Validation Quickstart: Refine Vaultsort Usability

This is an implementation acceptance guide, not a claim that the new interface exists.
Use [UI contracts](contracts/ui-contracts.md) and [data model](data-model.md) for semantics.
Only synthetic data may enter fixtures, screenshots, reports or issues.

## 1. Prerequisites and commands

- Supported Node.js from `package.json`: `^22.13.0 || ^24.0.0 || >=26.0.0`; npm and the lockfile.
- A browser with native dialog support; feature-detected popovers must have a dialog fallback.
  Record browser/version/device, available engines, and exclusions. Do not claim a check ran
  on Firefox/Safari solely because Chromium or jsdom passed.
- Run commands from the repository root. Use separate terminals for long-running servers.

```bash
npm ci
npm run lint
npm test
npm run build
npm run preview -- --port 4173 --strictPort
```

Open `http://127.0.0.1:4173/`. For local iteration instead of acceptance timings:

```bash
npm run dev -- --port 5173 --strictPort
```

Do not weaken CSP or enable HMR traffic to make a test work. jsdom suites cover state and
rendering contracts; native focus/popovers, scrolling and completed-render timings need a real
browser. Browser tooling can remain outside the app dependencies.

## 2. Deterministic synthetic dataset

Generate one 10,000-item vault outside the repository. Use exactly the same file before and
after refinement; record its hash. A 75-item slice of this file is useful for density checks.
This runnable fixture command is validation data, not proposed application implementation.

```bash
mkdir -p /tmp/opencode/vaultsort-refinement-validation
node --input-type=module <<'JS'
import { writeFileSync } from 'node:fs'
const folders = [{ id: 'work', name: 'Work/العمل' }, { id: 'personal', name: 'Personal' }]
const items = Array.from({ length: 10_000 }, (_, i) => {
  const type = [1, 2, 3, 4, 5, 99][i % 6]
  const item = {
    id: `synthetic-${i}`, type,
    name: `Synthetic ${String(9_999 - i).padStart(5, '0')} — حساب تجريبي`,
    folderId: i % 2 ? 'work' : 'personal', favorite: i % 7 === 0,
    creationDate: i % 13 ? `2026-01-${String(i % 28 + 1).padStart(2, '0')}T10:00:00Z` : 'invalid',
    revisionDate: i % 17 ? '2026-03-01T12:00:00Z' : null,
    notes: i % 11 === 0 ? null : `Synthetic note ${i}\nسطر تجريبي\n<script>not executable</script>\n${'long literal note '.repeat(20)}`,
    unknownItemProperty: { retained: i, nested: [true, null] },
  }
  if (type === 1) item.login = {
    username: i % 30 ? `synthetic-${i}@example.test` : '',
    password: `synthetic-secret-${i}`, totp: `synthetic-totp-${i}`,
    uris: [{ uri: 'https://example.test' }],
  }
  if (type === 5) item.sshKey = { privateKey: `synthetic-private-${i}`, publicKey: `synthetic-public-${i}`, keyFingerprint: 'synthetic-fingerprint', unknown: true }
  if (i % 23 === 0) { item.organizationId = 'synthetic-org'; item.collectionIds = ['synthetic-collection'] }
  return item
})
const document = { encrypted: false, folders, items, unknownRootProperty: { retained: true } }
const directory = '/tmp/opencode/vaultsort-refinement-validation'
writeFileSync(`${directory}/synthetic-10000.json`, JSON.stringify(document))
writeFileSync(`${directory}/synthetic-75.json`, JSON.stringify({ ...document, items: items.slice(0, 75) }))
JS
sha256sum /tmp/opencode/vaultsort-refinement-validation/synthetic-10000.json
```

Add a separate small edge-case fixture during implementation testing, based on the same safe
data, with duplicate/missing item IDs, exact duplicate items, malformed login/URI values,
missing/duplicate folder IDs, missing folder references, blank/numeric notes, absent dates,
very long unbroken text, bidi mixtures, and multiple issues on one item. Keep structural-error
fixtures out of the untouched performance fixture so they do not change the measured workload.

## 3. Capture the untouched baseline before application edits

An initial baseline was captured during planning in [baseline.md](baseline.md). Retain its
source/build and full raw report for the implementation comparison; recapture old and new
under identical conditions if the recorded environment cannot be reused.

1. Record `git rev-parse HEAD`, source-tree status and any source diff, lockfile hash, Node/npm
   versions, OS/device/CPU, browser version, viewport, time zone, locale/theme, reduced-motion
   setting, and build command. Save the original production build outside `dist` if needed so
   it cannot be overwritten by a later build. Never use real vault data.
2. Use the 10,000-item file above, 1280 × 800, English/light, Privacy Mode on, all items,
   original ASC, page 1, hidden dates/notes, and no editor. Wait for local fonts and completed
   import; import/summary duration is not part of filter/sort/field timings.
3. Warm up once, then run each operation five times. Restore its canonical starting state
   without timing between repetitions. Record every raw sample, not only the median.
4. Measure inside the page with `performance.now()` from the native input change/click to the
   expected final rows/column state plus two animation frames. Confirm the visible results and
   counts before accepting a sample. Do not time automation transport, opening disclosure panels,
   file import, screenshots, or arbitrary sleeps. Do not instrument production app source.
5. Keep operations, initial states, device/browser, build mode, dataset, rendering checkpoint,
   viewport and environment identical afterward. Record missing engines or noise explicitly.

| Operation | Untouched starting state → final state | Expected result |
| --- | --- | --- |
| Search filtering | Empty query → `Synthetic 099` | Exactly 100 items with matching names |
| Type filtering | All → Logins (type 1) | Exactly 1,667 login items |
| Folder filtering | All → Work | Exactly 5,000 work items |
| Alphabetical sort ASC | Original ASC → Name ASC | Names ascending with source-order ties |
| Alphabetical sort DESC | Name ASC → Name DESC | Names descending with source-order ties |
| Created sort ASC | Original ASC → Created ASC | Valid dates ascending; invalid dates last |
| Created sort DESC | Created ASC → Created DESC | Valid dates descending; invalid dates still last |
| Modified sort ASC/DESC | Equivalent canonical states | Same missing-date and tie guarantees |
| Date fields visible | Both hidden → both shown | Created and modified columns appear |
| Date fields hidden | Both shown → both hidden | Neither date column remains |

The old date toggle is the comparator for the **same final two-column state**. In the new UI,
change the two native date checkboxes as a single measured visibility operation: timestamp the
first change, apply the second immediately, and await the final rendered state. This compares
render/update cost, not the new control's discovery/interaction count, which SC-002 checks
separately. Time each newly independent date choice and new Notes actions too, but do not invent
a pre-change equivalent. Do not substitute the 75-row layout fixture for this baseline.

For each comparable operation, sort its five samples and take the third sample. Acceptance
requires the post-refinement median to be **no greater** than that operation's baseline median;
there is no absolute millisecond budget. New Notes visibility/open/close interactions record
five-run samples and correct completion only. Do not average unrelated operations or silently
waive a regression: investigate and rerun both builds under identical conditions if results
are noisy. Keep timing evidence in the implementation review alongside synthetic dataset hashes.

## 4. Regression and end-to-end scenarios

### A. Fields, notes, privacy and preservation — UI-01/02 (SC-002, SC-008, SC-011)

1. Import the mixed vault. Verify Privacy Mode on and all optional fields hidden.
2. Enable each field independently using at most three activations from the default list.
   Notes while masked shows no note values in visible text, hidden elements, attributes,
   accessible descriptions, or form values. Dates remain independent of privacy.
3. Disable privacy using the existing confirmation flow. Verify single-line previews ≤100
   Unicode code points, ellipsis for truncation, and dashes for non-text/blank notes.
4. Open full notes by pointer, keyboard and touch. Confirm complete literal text/line breaks,
   bounded scrolling, no rendered script/HTML/image/link, Close/Escape dismissal and focus return.
   Test native outside dismissal and forced no-popover fallback. Escape must not close the editor.
5. Open a note, enable Privacy Mode, and verify inspector target/full text are removed. Also test
   hiding Notes, filtering away the trigger, committing/deleting/undoing, replacement and close.
6. Change language/theme with fields enabled and a draft open: retain the fields and draft,
   translate UI only, and reformat dates without mutation. Replace/close/reimport: fields reset.
7. Download original bytes and an untouched working export; compare byte-for-byte original
   and parsed working values/array order to the imported file. Include unknown/SSH fields.

### B. Exact warning destinations — UI-03 (SC-003)

1. Use the small warning fixture with repeated/missing IDs, malformed URI/login data, multiple
   issues, folder/document issues, and exact duplicates. Sort, filter and move to another page.
2. Activate an item warning from table, review and export. It must open the exact source item
   in one activation plus any existing discard confirmation, even outside the active results.
   The existing field receives focus inside the editor; unavailable fields get item-specific
   context. Privacy never changes and Raw JSON never auto-reveals protected content.
3. Activate another issue on the same current item. Its field/context updates; other issues
   remain reachable. Existing unapplied changes are not reset just to move focus.
4. With an unapplied draft on another item, decline navigation. Assert draft, current item,
   view, filters, page, selection and originating modal stay unchanged. Then accept and verify.
5. Keep an old revision-stamped request, delete its item or shift source indices, and invoke it.
   Show unavailable-target notice; do not open a new occupant or discard a draft. Repeat after
   undo/redo and replacement. Fresh results must remain navigable.
6. Folder/document-only issues have context but no fabricated item destination. Structural
   errors still block modified export; warning navigation does not bypass export validation.

### C. SSH, filters and sorting — UI-01/04 (SC-009)

1. Verify 1,666 SSH items and matching category/type-filter results in the 10,000-item fixture.
   Combine with Personal: expect 1,666; combine with Work: expect zero (this fixture's alternating
   folder assignment places SSH at even source indices). Other must not include SSH; unknown
   type 99 remains available. Use the small fixture to cover SSH spread across both folders.
2. Check zero-SSH import, deletion of the last SSH item, retained active zero state, and undo.
   Counts and heading/results agree. String `"5"` is not silently treated as numeric type 5.
3. Clear filters with sort/fields selected: reset filter values only, preserve independent
   controls, and retain existing selection/page behavior. Sort with a selected item/draft:
   preserve item identity, selection and draft. Verify invalid-date-last and stable ties.
4. Export untouched mixed types: preserve opaque SSH/private/type-specific properties. No new
   SSH editor, validation rule, or imported-image behavior is added.

### D. Layout, help and keyboard matrix — UI-05 (SC-004–006)

1. Run English/light, English/dark, Arabic/light, Arabic/dark at widths 320, 768, 1024, 1280,
   1440. Include desktop 1280 × 800 and 1440 × 900, a short 1440 × 600 window, and 200% zoom.
2. Reproduce privacy-off/open-editor behavior with long values, all fields, and disclosed
   controls. Record document/workspace/table/editor/footer rectangles and scroll dimensions.
   At desktop require document scrollWidth ≤ clientWidth and scrollHeight ≤ clientHeight;
   no hidden offscreen actions count as passing. Narrow vertical page/table horizontal scroll
   is intentional; horizontal page overflow is not.
3. Reach Apply, Reset, Close and pagination through their intended regions. Open/close the
   compact editor using only keyboard and confirm logical return focus. Test long RTL/mixed
   text, technical LTR values, no overlapping header controls, and reduced-motion settings.
4. With the 75-item fixture at 1280 × 800, count eight fully visible default rows and measure
   collapsed control area ≤112 pixels, excluding heading/table header. Expanded controls must
   leave reachable rows and pagination on the short desktop window.
5. Inventory changed icon-only/ambiguous actions, including disabled ones. Every action has
   localized hover/focus help plus an accessible name. Verify hover persistence, Escape
   dismissal, tooltip placement, native-dialog accessibility, and no vault data in help.
6. Check text contrast against actual surfaces: WCAG AA (4.5:1 normal text; 3:1 qualifying large
   text). Verify focus and status cues in all combinations, not only brand-token contrast.

### E. Preferences and trust/link boundaries — UI-06/07 (SC-007, SC-010)

1. Save and reload each language/theme pair on import and workspace. First usable screen,
   native select values, root attributes and appearance agree without a wrong-theme flash.
2. Test missing/invalid values independently, blocked storage reads/writes, and one-key read
   failures. English/OS defaults apply only where needed; session controls still function.
   Run existing i18n/restoration suites and assert no additional saved keys/state.
3. With an open vault/draft/selection, change each preference; preserve all vault/view state.
   Notices/history translate their keys; imported names/notes do not change.
4. Confirm permanent yellow banner absent and original-copy action still discoverable beyond
   the summary. Import provides plaintext/local and hosted-trust guidance; both valid and
   blocked export states retain plaintext guidance. No encrypted/secure-erasure claim is added.
5. On import/workspace/narrow screens, keyboard-activate repository/tagline/Issues links.
   Inspect fixed URLs, new-tab identification and `noopener noreferrer`; preserve original
   workspace/draft. No prefilled data or nested anchors. Logo/name home behavior stays intact.
6. Inspect runtime traffic after local assets load: no automatic external requests. Go offline
   and edit/export locally; only deliberately following a GitHub link requires connectivity.
   Keep CSP `connect-src 'none'`, local logo/fonts and production font licence unchanged.

## 5. Representative usability check — SC-001

Use at least five representative users and synthetic data only. Without coaching, ask each to
find filtering, change ordering, and enable a named optional field from the normal list.
Record success within 60 seconds, first-action confusion, and a 1–5 clarity/ease rating.
At least 80% must complete the task unaided and at least 80% must rate it ≥4/5. Browser
automation/agent judgment cannot substitute for these participants. If participants are not
available, mark SC-001 unverified rather than declaring full acceptance.

## 6. Completion evidence

- Record passing `npm run lint`, `npm test`, `npm run build`, and `git diff --check` results.
- Automated regressions cover sensitive DOM removal, navigation cancellation/stale identity,
  SSH classification, preservation, and independent preference restoration. Reuse existing
  security/sorting/i18n/branding/domain suites; add focused usability checks only where needed.
- Attach browser/layout/keyboard/privacy observations and synthetic-only screenshots for all
  four locale/theme pairs, tested widths/zoom, native/fallback note inspection, and offline links.
- Attach baseline/post five-run timing tables with source/environment/dataset identifiers;
  no unmeasured performance or cross-browser claims. Record usability participant outcomes.
- Update actual behavior in README/CHANGELOG only after implementation. Report exclusions and
  remaining acceptance gaps explicitly; missing evidence is not a pass.

Planning ends before implementing these scenarios. `tasks.md` is the next workflow artifact;
capture the baseline before application edits even if task breakdown is generated first.
