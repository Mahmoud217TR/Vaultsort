# Quickstart Validation: Expand Export and Duplicate Review

**Spec**: [spec.md](spec.md) | **Contracts**: [contracts/ui-contracts.md](contracts/ui-contracts.md)
**Model**: [data-model.md](data-model.md)

This is a post-implementation validation guide, not evidence that the feature is implemented.
Use only synthetic data. Preserve reviewer-owned checklists; record implementation evidence
outside them in a future `implementation.md` alongside this guide.

## 1. Prerequisites and commands

Use the project-supported Node version and existing lockfile. From the repository root:

```bash
npm ci
npm run lint
npm test
npm run build
git diff --check
npm run preview -- --port 4173 --strictPort
```

Open `http://127.0.0.1:4173/`. Keep CSP/network restrictions intact; do not enable HMR or a
backend to validate. Native downloads/focus/layout require a real browser, not jsdom dimensions.
Record exact build, engine/version, OS, fixture hash, locale/theme and test exclusions. Browser
automation can remain outside app dependencies. Never use a real vault or a hosted test import.

## 2. Runnable synthetic base fixture

This generator is validation data, not application or test-suite implementation. It creates
10,000 items, a 100-candidate credential group, actual/empty/virtual-ancestor folders,
two ownership structures and opaque metadata deliberately containing excluded-scope information.

```bash
mkdir -p /tmp/opencode/vaultsort-export-review-validation
node --input-type=module <<'JS'
import { writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const folders = [
  { id: 'w', name: 'Work', opaque: { keep: true } },
  { id: 's', name: 'Work/Servers' }, { id: 'l', name: 'Work/Servers/Linux' },
  { id: 'x', name: 'Workshop' }, { id: 'p', name: 'Personal' },
  { id: 'e', name: 'Work/Empty' }, { id: 'v', name: 'Virtual/Child' },
]
const items = [
  { id: 'repeated', type: 1, name: 'Synthetic work', folderId: 'w', organizationId: 'oa', collectionIds: ['ca'], login: { username: 'synthetic-owner', password: 'synthetic-only', uris: [{ uri: 'https://example.test' }] } },
  { id: 'repeated', type: 2, name: 'Synthetic server', folderId: 's', notes: '<script>literal only</script>\nالعربية' },
  { type: 5, name: 'Synthetic SSH', folderId: 'l', sshKey: { privateKey: 'synthetic-key', opaque: [7] } },
  { type: 2, name: 'Synthetic sibling', folderId: 'x' },
  { type: 99, name: 'Synthetic future', folderId: 'p', organizationId: 'ob', collectionIds: ['cb'], opaque: { keep: true } },
  { type: 2, name: 'Synthetic unassigned' },
  { type: 3, name: 'Synthetic card', folderId: 's', card: { number: 'synthetic-not-a-card' } },
  { type: 2, name: 'Synthetic virtual child', folderId: 'v' },
]
for (let i = 0; i < 9992; i++) items.push({
  id: `synthetic-${i}`, type: 1, name: `Synthetic generated ${i}`,
  folderId: i % 2 ? 'p' : 's', notes: `Synthetic note ${i}\nالعربية`,
  login: { username: i < 100 ? 'synthetic-group' : `synthetic-user-${i}`,
    password: `synthetic-secret-${i}`, uris: [{ uri: 'https://example.test' }] },
  fields: [{ name: 'synthetic-label', value: `synthetic-field-${i}`, type: 1 }],
  opaque: { orderIndependent: { a: 1, b: 2 }, position: i },
})
const document = { encrypted: false, folders, items,
  organizations: [{ id: 'oa', name: 'Synthetic A', opaque: 1 }, { id: 'ob', name: 'Synthetic B' }],
  collections: [{ id: 'ca', organizationId: 'oa', name: 'Synthetic collection A', opaque: [2] },
    { id: 'cb', organizationId: 'ob', name: 'Synthetic collection B' }],
  opaqueRoot: { outsideSelectedScope: 'synthetic-only information', keep: [true, null] },
}
const bytes = JSON.stringify(document)
const out = '/tmp/opencode/vaultsort-export-review-validation'
writeFileSync(`${out}/synthetic-10000.json`, bytes)
writeFileSync(`${out}/synthetic-small.json`, JSON.stringify({ ...document, items: items.slice(0, 12) }))
console.log(createHash('sha256').update(bytes).digest('hex'))
console.log('Expected: selected [103,0,9,4] -> source order [0,4,9,103]; Work branch -> 5000 items; credential group -> 100 candidates.')
JS
```

Create additional small **synthetic** variants in domain/component tests for malformed retained
login/URI/folder records, excluded-item errors, missing owners, malformed metadata containers,
duplicate folder IDs/paths, absent arrays, `collections: []`, object key order, absent/null/empty
values, secret property labels and literal image/link-like text. Include deep/long values and
prototype-like keys without exposing real data. Do not modify the base fixture for scale timings.

## 3. Filename and full export — EX-01

1. Apply one synthetic item edit. Full export opens with a safe edited basename, scope/count,
   plaintext guidance and result validation. Download once with the default and once renamed;
   compare serialized content byte-for-byte between these two working downloads.
2. Check valid `report`, `report.JSON`, `report.txt`, Arabic text and emoji names; verify displayed
   final name equals the app-requested name (`report.json`, unchanged `.JSON`, `report.txt.json`).
   Observe the browser-suggested/saved name separately and record any platform adjustments.
3. Check invalid empty/`.json`/`.`/`..`, `../report`, `a\\b`, forbidden punctuation, C0/C1 controls,
   bidi override/isolate controls, lone-surrogate input, `NUL.tar.gz`, `com1.json`, `LPT²`, and
   raw trailing dot/space. Download is blocked, entered text retained and error associated.
4. Exercise final names of exactly 200 and 201 code points; count after `.json` is appended.
   Include a valid emoji name below 200 code points but above 255 UTF-8 bytes: the app must not
   reject it due to byte count. Joining characters and valid Unicode remain supported. Record
   browser/OS byte-limit or filename-adjustment limitations separately; app acceptance is not a
   universal filesystem guarantee.
5. Cancel with a filename draft: no item draft/selection/page/undo/original change. Item/folder
   drafts block export without discarding them. Inject a concurrent draft in a regression test
   to verify the download-time guard too. Original copy retains its existing name and exact bytes.

## 4. Exact selected/folder subsets — EX-02/03

1. Select source indexes `[103,0,9,4]` across pages with view-only sorting. Expect exactly
   `[0,4,9,103]` in source-relative order; every retained nested value matches its source.
   Keep required Work/Servers/Personal folders and both referenced ownership structures, with
   the same source ordering. No unselected item is included. Zero selection cannot export selected.
2. Export Work while unrelated search/type filters are active. Expect **5,000** items, Work,
   Servers, Linux and empty Work/Empty folder records; no Workshop/Personal/Virtual/unassigned items.
   Export Servers: retain existing Work ancestor but no items assigned directly to Work.
3. Export virtual `Virtual`: retain existing Child and its one item, without synthesizing Virtual.
   Export Work/Empty: valid explicit zero-item review with its folder and existing Work ancestor.
4. Assert root opaque metadata unchanged and disclosure visible. Assert absent structural arrays
   remain absent and present emptied arrays remain present. Do not normalize folder names or owners.
5. Validate each prepared result; retained structural errors block, excluded-item-only errors do
   not. Malformed ownership containers block subset preparation rather than disappearing; missing
   owner records produce advisories, not fabricated records or ownership reassignment. Exercise
   both selected-item and folder exports; malformed metadata cannot be retained wholesale as a bypass.
6. Inspect a subset issue: the exact original source item/field opens, not its compacted export
   index. Decline a draft confirmation and verify filename/modal/draft/navigation state is preserved.
7. Capture export reviews then change selection, commit/delete/undo/redo/replace. Old download
   requests are rejected; no stale occupant or new membership is silently substituted.
8. Compare loaded parsed document, originals, selection and undo/audit before/after prepare,
   cancel and download. Subset download must leave the whole-vault dirty baseline unchanged.

### Confirmed folder-ambiguity matrix

Use separate small synthetic variants, not changes to the scale fixture. Give equal-path
records distinct valid IDs where indicated so path ambiguity is tested independently of ID errors.
For every blocked case, verify localized feedback, no download and unchanged source/original/history.

| Synthetic variant / request | Expected result |
| --- | --- |
| Two actual `Work` paths with distinct IDs; export Work | Block; do not combine or choose, even with no items |
| Two `Work/Servers` paths; export actual Work | Block repeated descendant path, including empty folders |
| Two `Virtual/Child` paths with Virtual absent; export virtual Virtual | Block; virtual grouping is not an extra actual record |
| Duplicate Work ancestors; export Work/Servers | No branch-ambiguity blocker; retain existing ancestors in source order and use normal result validation |
| Duplicate Work/Other paths; export Work/Servers | No branch-ambiguity blocker; sibling records excluded |
| Duplicate Workshop paths; export Work | No branch-ambiguity blocker; segment boundary excludes Workshop |
| Work/Servers and Personal/Servers | Same leaf is not same full path; do not normalize or equate them |
| Duplicate paths; export explicit selected source items | Do not apply folder-branch guard; exact selected membership and normal result validation still apply |
| Same ID on distinct retained paths | Existing duplicate-ID validation blocks; do not silently choose one record |
| One valid actual empty-string name | Direct-folder items only, no inferred descendants |
| Two valid actual empty-string names with distinct IDs | Block empty-path ambiguity; no combining |
| Missing/nontext name beside one empty-string name | Not two textual empty paths; malformed retained names fail structural validation |

Include imported case/whitespace/double-slash variants and verify literal existing hierarchy
semantics with no export-time normalization. Outside-branch duplicates may still contribute
ordinary result errors if otherwise retained; absence of a path blocker is not a blanket pass.

## 5. Duplicate comparison and resolution — DR-01/02/03

1. Open the credential group in one activation; all **100** candidates are reachable, not just
   the first two. Exercise Back/Escape and focus return, plus rules with identical membership.
2. Seed absent/null/empty/nested differences, ordered arrays and reordered equivalent object keys.
   Every actual difference has a non-color indicator; key ordering alone is not highlighted.
   URI detection normalization must not hide differing stored URI text in comparison.
3. While masked, inspect all visible/hidden content, input properties, attributes/descriptions
   for seeded credentials, notes, SSH/card/custom/unknown values and sensitive imported key labels.
   None is present; fixed masks do not reveal prefixes/lengths. Toggle privacy off/on while
   comparison remains open and confirm immediate removal and no document changes.
4. Rename one candidate and verify only its name changes; undo restores exact values. Delete
   one candidate with explicit name/count confirmation, decline once then accept; undo restores.
   Check existing item/name drafts and selection/page/filter state on cancelled guards.
5. Ignore one rule/group: active count changes, other-rule groups remain visible, validation
   warnings and exported document/dirty/history remain unchanged. Restore all. Ignore again,
   navigate away/back and switch preferences: dismissal survives; commit/undo/redo/import/close resets it.
6. Invoke captured group/candidate actions after deletion/index shift/replacement. Reject before
   discard/delete confirmation and retain a new occupant's draft. Recompute/close invalid groups.

## 6. Browser/locality/scale matrix — CC-01

- Run English/Arabic × light/dark at widths 320/768/1280/1440 and actual browser 200% zoom;
  record CSS and native window metrics, not a zoom-equivalent viewport claim.
- Complete every new action with keyboard only. Verify labels, names, focus/Escape priority,
  bounded cell/group scrolling, visible controls, no horizontal page overflow, contrast and reduced motion.
- After local assets load, go offline and complete all new export/compare/rename/delete/ignore
  operations. Inspect requests and storage: zero automatic external traffic and only the two
  approved preference keys. No filename/group/candidate data appears in logs or notices.
- Use unchanged 10,000-item fixture and 100-candidate group. Record machine/browser/build/hash,
  one warm-up/five completed-interaction samples for selected/folder review, comparison opening
  and privacy toggle. Confirm exact members, all candidates and source preservation per sample.
  Run without concurrent builds/test loads; no arbitrary threshold or inherited passing gate.
- Run `npm run lint`, `npm test`, `npm run build`, `git diff --check` after fixes. Preserve CSP,
  license, unknown data, draft guards, original bytes and existing full-export/undo regressions.

## 7. Compatibility evidence — preserve, do not convert

Keep three evidence levels separate: application validation/preservation tests, pinned upstream
source analysis ([research.md](research.md#r8--authoritative-formatimport-analysis-and-portability-limits)),
and **executed** local imports. Source inspection or a homemade parser is not an actual import test.

If a disposable isolated local Bitwarden/Vaultwarden environment is available, test synthetic:

| Fixture / route | Expected evidence |
| --- | --- |
| Personal-only folders/items → My vault, Bitwarden (json) | Supported types/counts/folder results; record generated destination IDs rather than expect source-ID preservation |
| Single-owner collections/items → authorized organization import | Collection memberships and destination ownership; record permissions and both client/server versions |
| Mixed/two-owner envelope or combined folders/collections | Limitations/advisories; no claim of lossless multi-owner import or silent conversion |
| Personal envelope with `collections: []`, empty collection-only branch | Explicit observed importer behavior, including rejection or folder-branch selection |
| Long password history, SSH/unknown types and opaque properties | Record downstream cleanup, supported-type behavior and unknown-property loss |

Do not install a server or execute imports as a side effect of this plan. If no local environment
is available, record **not import-tested** and leave compatibility acceptance unverified. The
application still preserves source JSON; importer ID remapping or metadata loss does not justify
altering the output or advertising a lossless round trip. Never upload test fixtures to hosted services.

## 8. Evidence handoff

Record FR-001–022/SC-001–009 coverage, filenames, downloaded subsets, source/original equality,
guard/ignore outcomes, browser matrices, observed scale samples and exact compatibility exclusions.
No planning artifact marks implementation tests or import acceptance complete. `tasks.md` is the
next artifact; implementation must add regressions before changing transformation/security paths.
