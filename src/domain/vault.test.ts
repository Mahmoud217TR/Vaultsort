import { describe, expect, it } from 'vitest'
import { clone, createFolder, defaultExportFilename, deleteFolder, deleteItem, findDuplicates, maskUsername, matchesSearch, mergeFolders, moveItem, moveItems, parseRawItem, parseVault, renameFolder, resolveExportFilename, scalar, serializeVault, sortItemRows, typeName, updateItem, validateVault, type VaultExport, type VaultItem } from './vault'
import { useVault } from '../composables/useVault'
import { compareItems, prepareVaultExport, projectComparison } from './vault'

const fixture = (): VaultExport => ({
  encrypted: false, customTop: { preserved: [1, null, 'x'] },
  folders: [{ id: 'a', name: 'Work', extra: { color: 'purple' } }, { id: 'b', name: 'Personal' }],
  items: [
    { id: '1', type: 1, name: 'Example', folderId: 'a', organizationId: 'org', notes: '<b>notes</b>', fields: [{ name: 'Recovery', value: 'never-search-this', type: 1 }], login: { username: 'person', password: 'secret-password', totp: 'secret-totp', uris: [{ uri: 'https://example.com/', match: null, future: true }], extra: 123 }, future: { data: [true] } },
    { id: '2', type: 1, name: 'Example', folderId: 'a', login: { username: 'person', password: 'secret-password', uris: [{ uri: 'http://EXAMPLE.com#fragment' }] } },
    { type: 9, name: 'Future type', future: { opaque: 'retain me' } },
  ],
})

describe('export filenames', () => {
  it('rejects unsafe raw names without silently repairing them', () => {
    for (const name of ['', '.json', '.JSON', '.', '..', 'dir/file', 'dir\\file', 'a<b', 'a>b', 'a:b', 'a"b', 'a|b', 'a?b', 'a*b', 'a\0b', 'a\nb', 'a\u007fb', 'a\u202eb', 'a\u2066b', '\ud800', '\udfff', 'report ', 'report.', 'CON', 'con.json', 'PrN.txt', 'AUX', 'NUL', 'COM1.json', 'LPT9.txt', 'COM¹', 'LPT²']) expect(resolveExportFilename(name)).toHaveProperty('error')
  })
  it('counts final Unicode code points, not bytes or UTF-16 units', () => {
    for (const [name, resolved] of [['report', 'report.json'], ['report.JSON', 'report.JSON'], ['report.txt', 'report.txt.json'], ['تقرير', 'تقرير.json'], ['a\u200db', 'a\u200db.json']]) expect(resolveExportFilename(name!)).toEqual({ name: resolved })
    const unicode = '😀'.repeat(195)
    expect(resolveExportFilename(unicode)).toEqual({ name: `${unicode}.json` })
    expect(resolveExportFilename('😀'.repeat(196))).toHaveProperty('error')
    expect(resolveExportFilename('a'.repeat(195))).toEqual({ name: `${'a'.repeat(195)}.json` })
    expect(resolveExportFilename('a'.repeat(196))).toHaveProperty('error')
  })
  it('generates safe bounded source-derived defaults and specified fallbacks', () => {
    for (const scope of ['full', 'selected', 'folder'] as const) {
      const suffix = scope === 'full' ? 'edited' : scope
      expect(defaultExportFilename('', scope)).toBe(`vault-${suffix}.json`)
      expect(defaultExportFilename('synthetic.JSON', scope)).toBe(`synthetic-${suffix}.json`)
      for (const source of ['CON.json', '../unsafe\\name.json', '😀'.repeat(300), '\u202e.json']) expect(resolveExportFilename(defaultExportFilename(source, scope))).toHaveProperty('name')
    }
  })
})

describe('selected export preparation', () => {
  const source = (): VaultExport => ({ encrypted: false, opaque: { excludedInformation: [1, null] },
    folders: [{ id: 'p', name: 'Work', unknown: [7] }, { id: 'c', name: 'Work/Child' }, { id: 'x', name: 'Other' }],
    organizations: [{ id: 'o1', extra: { keep: true } }, { id: 'o2' }, { id: 'other' }],
    collections: [{ id: 'c1', organizationId: 'o2', opaque: [null, 1] }, { id: 'c2' }, { id: 'unrelated', organizationId: 'o1' }],
    items: [{ id: 'same', type: 2, name: 'A', folderId: 'c', organizationId: 'o1', collectionIds: ['c1', 'c2'], opaque: { keep: true } }, { type: 1, name: 'Excluded', folderId: 'missing', login: [] as unknown as Record<string, unknown> }, { id: 'same', type: 5, name: 'C', sshKey: { privateKey: 'synthetic' } }],
  })
  it('clones exact source-order members with conservative structural closure and source maps', () => {
    const doc = source(), before = serializeVault(doc)
    const prepared = prepareVaultExport(doc, { kind: 'selected', indexes: [2, 0] })
    expect(prepared.itemSources).toEqual([0, 2]); expect(prepared.folderSources).toEqual([0, 1])
    expect(prepared.document.items).toEqual([doc.items![0], doc.items![2]])
    expect(prepared.document.folders).toEqual(doc.folders!.slice(0, 2))
    expect(prepared.document.organizations).toEqual((doc.organizations as unknown[]).slice(0, 2))
    expect(prepared.document.collections).toEqual((doc.collections as unknown[]).slice(0, 2))
    expect(prepared.document.opaque).toEqual(doc.opaque)
    expect(validateVault(prepared.document).filter(issue => issue.severity === 'error')).toEqual([])
    prepared.document.items![0]!.name = 'Isolated clone'
    expect(serializeVault(doc)).toBe(before)
    expect(prepareVaultExport(doc, { kind: 'full' }).document).toEqual(doc)
  })
  it('preserves omitted arrays, duplicate matching structural records and advisory missing metadata', () => {
    const doc: VaultExport = { items: [{ type: 2, folderId: 'c', organizationId: 'absent', collectionIds: ['absent'] }], folders: [{ id: 'c', name: 'Child' }, { id: 'c', name: 'Other' }] }
    const prepared = prepareVaultExport(doc, { kind: 'selected', indexes: [0] })
    expect(prepared.document.folders).toEqual(doc.folders)
    expect(Object.hasOwn(prepared.document, 'collections')).toBe(false)
    expect(Object.hasOwn(prepared.document, 'organizations')).toBe(false)
    expect(validateVault(prepared.document).some(issue => issue.message === 'validation.duplicateFolderId')).toBe(true)
    expect(prepared.diagnostics.some(issue => issue.message === 'export.missingOwnership')).toBe(true)
    expect(prepareVaultExport({ items: [{ type: 2 }], collections: [] }, { kind: 'selected', indexes: [0] }).document).toEqual({ items: [{ type: 2 }], collections: [] })
  })
  it('blocks unsafe narrowing and invalid selection without mutation, but does not change full export policy', () => {
    for (const field of ['organizations', 'collections']) for (const bad of [null, {}, 'opaque', [null], [{}], [{ id: 42 }], [{ id: '' }]]) {
      const doc = { items: [{ type: 2 }], [field]: bad }, before = serializeVault(doc)
      expect(() => prepareVaultExport(doc, { kind: 'selected', indexes: [0] })).toThrow('export.unsafeOwnership')
      expect(serializeVault(doc)).toBe(before)
      expect(prepareVaultExport(doc, { kind: 'full' }).document).toEqual(doc)
    }
    for (const patch of [{ organizationId: 42 }, { collectionIds: 'c' }, { collectionIds: [42] }, { collectionIds: [''] }]) expect(() => prepareVaultExport({ items: [{ type: 2, ...patch }] } as VaultExport, { kind: 'selected', indexes: [0] })).toThrow('export.unsafeOwnership')
    expect(() => prepareVaultExport({ items: [{ type: 2 }], collections: [{ id: 'c', organizationId: 42 }] }, { kind: 'selected', indexes: [0] })).toThrow('export.unsafeOwnership')
    for (const indexes of [[], [-1], [0.5], [1], [0, 0]]) expect(() => prepareVaultExport({ items: [{ type: 2 }] }, { kind: 'selected', indexes })).toThrow('export.invalidScope')
  })
})

describe('raw duplicate comparison', () => {
  it('compares own values, ordered arrays and presence without normalizing or mutating', () => {
    const candidates: VaultItem[] = [
      { name: 'Same', type: 1, notes: null, login: { password: 'Synthetic', uris: [{ uri: 'https://example.test/' }, { uri: 'https://other.test' }] }, opaque: { a: 1, b: [null, ''] }, empty: {} },
      { name: 'Same', type: 1, notes: '', login: { password: 'synthetic', uris: [{ uri: 'https://other.test' }, { uri: 'https://example.test/' }] }, opaque: { b: [null, ''], a: 1 }, empty: [] },
      { name: 'Same', type: 5, sshKey: { privateKey: 'synthetic-private' } },
    ]
    const before = JSON.stringify(candidates), rows = compareItems(candidates)
    expect(rows.find(row => JSON.stringify(row.path) === '["name"]')?.different).toBe(false)
    for (const path of [['type'], ['notes'], ['login', 'password'], ['login', 'uris', 0, 'uri'], ['empty'], ['sshKey', 'privateKey']]) expect(rows.find(row => JSON.stringify(row.path) === JSON.stringify(path))?.different).toBe(true)
    expect(rows.find(row => JSON.stringify(row.path) === '["notes"]')?.values.map(value => value.present)).toEqual([true, true, false])
    const reordered = compareItems([candidates[0]!, { ...candidates[0], opaque: { b: [null, ''], a: 1 } }])
    expect(reordered.every(row => !row.different)).toBe(true)
    expect(JSON.stringify(candidates)).toBe(before)
  })
  it('projects no protected strings or labels while preserving complete disclosed values', () => {
    const candidates = [{ name: 'Public', type: 2, 'synthetic-key-secret': { value: 'synthetic-value-secret' }, notes: '<img src="https://literal.test">' }, { name: 'Public', type: 2, notes: null }]
    const rows = compareItems(candidates)
    const masked = JSON.stringify(projectComparison(rows, true))
    for (const secret of ['synthetic-key-secret', 'synthetic-value-secret', 'https://literal.test']) expect(masked).not.toContain(secret)
    const disclosed = JSON.stringify(projectComparison(rows, false))
    expect(disclosed).toContain('synthetic-key-secret'); expect(disclosed).toContain('synthetic-value-secret')
    expect(projectComparison(rows, true).every(row => !Object.hasOwn(row, 'path'))).toBe(true)
  })
  it('includes every candidate and nested literal prototype property without pollution', () => {
    const candidates = Array.from({ length: 100 }, (_, index) => JSON.parse(`{"name":"Group","opaque":{"__proto__":"synthetic-${index}"}}`) as VaultItem)
    const rows = compareItems(candidates)
    expect(rows.every(row => row.values.length === 100)).toBe(true)
    expect(rows.some(row => row.path.includes('__proto__') && row.different)).toBe(true)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})

describe('import and preservation', () => {
  it('recognizes only numeric SSH while preserving opaque SSH data', () => {
    const source = { items: [{ type: 5, name: 'SSH', sshKey: { privateKey: 'synthetic', future: [7] } }, { type: '5' }, { type: 9 }] } as unknown as VaultExport
    expect(typeName(5)).toBe('SSH key')
    expect(typeName('5')).toBe(typeName(9))
    expect(validateVault(source).filter(issue => issue.message === 'validation.unsupported').map(issue => issue.itemIndex)).toEqual([1, 2])
    expect(parseVault(serializeVault(source))).toEqual(source)
  })
  it('identifies validation fields and offending URI entries without copying values', () => {
    const issues = validateVault({ items: [{ type: 1, folderId: 'missing', organizationId: 'org', login: { username: 42, password: [], totp: {}, uris: [{ uri: 'valid' }, { uri: 7 }] } }] })
    for (const field of ['folderId', 'ownership', 'login.username', 'login.password', 'login.totp', 'login.uris']) expect(issues.some(issue => issue.field === field)).toBe(true)
    expect(issues.find(issue => issue.message === 'validation.uris')).toMatchObject({ field: 'login.uris', entryIndex: 1, itemIndex: 0 })
    expect(issues.every(issue => issue.folderIndex === undefined)).toBe(true)
    expect(validateVault({ items: [{ type: 1, login: [] } as unknown as VaultItem] }).find(issue => issue.message === 'validation.login')).toMatchObject({ field: 'login', itemIndex: 0 })
  })
  it('round-trips without rebuilding or adding properties', () => {
    const source = fixture()
    expect(JSON.parse(serializeVault(parseVault(JSON.stringify(source))))).toEqual(source)
  })
  it('tolerates missing arrays without adding them on export', () => {
    expect(parseVault('{"items":[]}')).toEqual({ items: [] })
    expect(parseVault('{"folders":[]}')).toEqual({ folders: [] })
    expect(parseVault('{"encrypted":false}')).toEqual({ encrypted: false })
    expect(serializeVault(parseVault('{"items":[]}'))).not.toContain('folders')
  })
  it('preserves unknown and literal prototype properties without pollution', () => {
    const doc = parseVault('{"items":[{"__proto__":{"polluted":true},"constructor":"literal"}],"__proto__":{"secret":"keep"}}')
    updateItem(doc, 0, { name: 'Changed' })
    const out = JSON.parse(serializeVault(doc))
    expect(Object.hasOwn(out.items[0], '__proto__')).toBe(true)
    expect(out.items[0].constructor).toBe('literal')
    expect(out.__proto__).toEqual({ secret: 'keep' })
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
  it('rejects malformed JSON and export structures without quoting secret data', () => {
    expect(() => parseVault('{"password":"plaintext-leak" garbage}')).toThrow('errors.invalidJson')
    try { parseVault('{"password":"plaintext-leak" garbage}') } catch (e) { expect(String(e)).not.toContain('plaintext-leak') }
    for (const source of ['null', '[]', '{}', '{"items":{}}', '{"items":[null]}', '{"folders":[4]}', '{"encrypted":true,"items":[]}', '{"encrypted":"false","items":[]}']) expect(() => parseVault(source)).toThrow()
  })
  it('keeps malformed login content available for repair', () => {
    const doc = parseVault('{"items":[{"type":1,"login":"broken","extra":42}]}')
    expect(doc.items![0]!.login).toBe('broken')
    expect(validateVault(doc).some(i => i.severity === 'error')).toBe(true)
  })
  it('accepts valid raw objects and refuses invalid replacements', () => {
    expect(parseRawItem('{"type":1,"login":{"future":true},"newField":42}').newField).toBe(42)
    for (const source of ['{', '[]', 'null', '{"type":"1"}', '{"name":4}', '{"login":5}', '{"folderId":3}']) expect(() => parseRawItem(source)).toThrow()
  })
})

describe('folder operations', () => {
  it('creates and renames only the folder object', () => {
    const doc = fixture()
    const before = clone(doc.items)
    const folder = createFolder(doc, '  New folder  ')
    expect(folder.name).toBe('New folder')
    expect(folder.id).toMatch(/^[0-9a-f-]{36}$/)
    renameFolder(doc, 'a', 'Development')
    expect(doc.folders![0]).toEqual({ id: 'a', name: 'Development', extra: { color: 'purple' } })
    expect(doc.items).toEqual(before)
    expect(() => createFolder(doc, '  ')).toThrow()
  })
  it('deletes a folder without deleting items; default is unassigned', () => {
    const doc = fixture()
    deleteFolder(doc, 'a')
    expect(doc.items).toHaveLength(3)
    expect(doc.items![0]!.folderId).toBeNull()
    expect(doc.items![1]!.folderId).toBeNull()
    expect(doc.items![2]).not.toHaveProperty('folderId')
    expect(doc.folders!.map(f => f.id)).toEqual(['b'])
  })
  it('supports deletion with reassignment and merging', () => {
    for (const operation of [deleteFolder, mergeFolders]) {
      const doc = fixture()
      operation(doc, 'a', 'b')
      expect(doc.items![0]!.folderId).toBe('b')
      expect(doc.items![1]!.folderId).toBe('b')
      expect(doc.items![0]!.organizationId).toBe('org')
      expect(doc.folders).toHaveLength(1)
    }
  })
  it('validates destinations and duplicate IDs before mutating', () => {
    const doc = fixture()
    const before = clone(doc)
    expect(() => deleteFolder(doc, 'a', 'missing')).toThrow()
    expect(() => mergeFolders(doc, 'a', 'a')).toThrow()
    expect(doc).toEqual(before)
    doc.folders!.push({ id: 'a', name: 'Bad' })
    expect(() => renameFolder(doc, 'a', 'New')).toThrow()
    expect(() => deleteFolder(doc, 'a')).toThrow()
  })
})

describe('items and review', () => {
  it('safely displays malformed metadata and masks short usernames', () => {
    expect(typeName('__proto__')).toBe('Other')
    expect(typeName({ toString: 'not callable' })).toBe('Other')
    expect(scalar({ toString: 'not callable', valueOf: null })).toBe('Structured value (see Raw JSON)')
    expect(maskUsername('a')).toBe('••••••')
    expect(maskUsername('ab')).toBe('••••••')
  })
  it('moves one or many, edits login with unknown keys, and deletes', () => {
    const doc = fixture()
    moveItem(doc, 0, 'b')
    expect(doc.items![0]!.folderId).toBe('b')
    moveItems(doc, [0, 1], null)
    expect(doc.items![0]!.folderId).toBeNull()
    expect(doc.items![1]!.folderId).toBeNull()
    const originalLogin = doc.items![0]!.login!
    updateItem(doc, 0, { login: { ...originalLogin, password: 'replacement' } })
    expect(doc.items![0]!.login!.extra).toBe(123)
    expect(doc.items![0]!.future).toEqual({ data: [true] })
    expect(doc.customTop).toEqual(fixture().customTop)
    deleteItem(doc, 0)
    expect(doc.items).toHaveLength(2)
    expect(() => moveItem(doc, 999, null)).toThrow()
  })
  it('does not search passwords, TOTP, or custom field values', () => {
    const doc = fixture()
    const item = doc.items![0]!
    for (const query of ['example', 'person', 'EXAMPLE.com', '<b>notes', 'recovery', 'work']) expect(matchesSearch(doc, item, query)).toBe(true)
    for (const query of ['secret-password', 'secret-totp', 'never-search-this']) expect(matchesSearch(doc, item, query)).toBe(false)
  })
  it('returns duplicate positions, never credential keys', () => {
    const result = findDuplicates(fixture())
    for (const kind of ['exact', 'credential', 'name', 'username', 'domain']) expect(result).toContainEqual({ kind, indexes: [0, 1] })
    expect(JSON.stringify(result)).not.toContain('secret-password')
    expect(JSON.stringify(result)).not.toContain('person')
  })
  it('keeps URI paths and username case significant', () => {
    const doc = fixture()
    doc.items![1]!.login!.uris = [{ uri: 'https://example.com/other' }]
    expect(findDuplicates(doc).some(g => g.kind === 'exact')).toBe(false)
    doc.items![1]!.login!.uris = [{ uri: 'https://example.com/' }]
    doc.items![1]!.login!.username = 'PERSON'
    expect(findDuplicates(doc).some(g => g.kind === 'credential')).toBe(false)
  })
  it('finds malformed structures, broken references, unsupported types, and advisories', () => {
    const doc = fixture()
    doc.folders!.push({ id: 'a', name: 'Duplicate' })
    doc.items!.push({ type: 1, folderId: 'missing', login: { username: 123, uris: 'bad' } })
    const issues = validateVault(doc)
    for (const key of ['duplicateFolderId', 'missingFolder', 'username', 'uris', 'noPassword', 'noUri', 'emptyFolder', 'organization', 'unsupported', 'unknown', 'duplicate']) expect(issues.some(i => i.message === `validation.${key}`)).toBe(true)
    expect(JSON.stringify(issues)).not.toContain('secret-password')
  })
})

describe('view-only item sorting', () => {
  it('sorts names naturally in both directions, keeps ties stable, and preserves rows/documents', () => {
    const source: VaultItem[] = [{ name: 'Item 10', id: 'duplicate' }, { name: 'item 2', id: 'duplicate' }, { name: 'ITEM 2' }, { name: 'Alpha' }]
    const before = JSON.stringify(source)
    const rows = source.map((item, index) => ({ item, index }))
    const indexes = (by: 'original' | 'name', direction: 'asc' | 'desc') => sortItemRows(rows, by, direction, 'en').map(row => row.index)
    expect(indexes('name', 'asc')).toEqual([3, 1, 2, 0])
    expect(indexes('name', 'desc')).toEqual([0, 1, 2, 3])
    expect(indexes('original', 'desc')).toEqual([0, 1, 2, 3])
    expect(rows.map(row => row.index)).toEqual([0, 1, 2, 3])
    expect(JSON.stringify(source)).toBe(before)
    expect(sortItemRows(rows, 'name', 'asc', 'en')[0]!.item).toBe(source[3])
    const arabic = ['جيم', 'باء', 'ألف'].map((name, index) => ({ item: { name }, index }))
    expect(sortItemRows(arabic, 'name', 'asc', 'ar').map(row => row.index)).toEqual([2, 1, 0])
    expect(sortItemRows([{ item: { name: 42 } as unknown as VaultItem, index: 0 }, { item: {}, index: 1 }], 'name', 'asc', 'en').map(row => row.index)).toEqual([0, 1])
  })

  it('compares timestamps rather than strings and keeps absent/malformed dates last in both directions', () => {
    for (const by of ['creationDate', 'revisionDate'] as const) {
      const values = ['2026-02-01T00:00:00Z', '2026-01-01T00:00:00Z', '2025-12-31T19:00:00-05:00', undefined, null, 'invalid', '', 0, { toString: 'invalid' }]
      const rows = values.map((date, index) => ({ item: { [by]: date }, index }))
      const before = JSON.stringify(rows)
      expect(sortItemRows(rows, by, 'asc', 'en').map(row => row.index)).toEqual([1, 2, 0, 3, 4, 5, 6, 7, 8])
      expect(sortItemRows(rows, by, 'desc', 'en').map(row => row.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
      expect(JSON.stringify(rows)).toBe(before)
      expect(sortItemRows([], by, 'asc', 'en')).toEqual([])
    }
  })
})

describe('in-memory session', () => {
  const bytes = () => new TextEncoder().encode(JSON.stringify(fixture())).buffer as ArrayBuffer
  it('keeps original bytes/document immutable and undo/redo restores applied actions', () => {
    const vault = useVault()
    vault.load(bytes(), 'vault.json')
    vault.commit('Item 1: password changed', doc => { doc.items![0]!.login!.password = 'new-secret' })
    expect(vault.originalDocument.value).toEqual(fixture())
    expect(new TextDecoder().decode(vault.originalBytes.value!)).toBe(JSON.stringify(fixture()))
    expect(vault.changes.value).toEqual(['Item 1: password changed'])
    expect(JSON.stringify(vault.changes.value)).not.toContain('new-secret')
    expect(vault.dirty.value).toBe(true)
    vault.undo()
    expect(vault.workingDocument.value).toEqual(fixture())
    expect(vault.dirty.value).toBe(false)
    vault.redo()
    expect(vault.workingDocument.value!.items![0]!.login!.password).toBe('new-secret')
    vault.markExported()
    expect(vault.dirty.value).toBe(false)
    vault.undo()
    expect(vault.dirty.value).toBe(true)
  })
  it('undoes deletion, rename, bulk assignment, and folder deletion', () => {
    for (const operation of [
      (doc: VaultExport) => deleteItem(doc, 0), (doc: VaultExport) => renameFolder(doc, 'a', 'Renamed'),
      (doc: VaultExport) => moveItems(doc, [0, 1], 'b'), (doc: VaultExport) => deleteFolder(doc, 'a'),
    ]) {
      const vault = useVault()
      vault.load(bytes(), 'vault.json')
      vault.commit('Applied action', operation)
      vault.undo()
      expect(vault.workingDocument.value).toEqual(fixture())
    }
  })
  it('keeps failed operations atomic and caps snapshots', () => {
    const vault = useVault()
    vault.load(bytes(), 'vault.json')
    expect(() => vault.commit('Failed', doc => { doc.items = []; throw new Error('Failure') })).toThrow()
    expect(vault.workingDocument.value).toEqual(fixture())
    expect(vault.changes.value).toEqual([])
    for (let i = 0; i < 35; i++) vault.commit('Name changed', doc => { doc.items![0]!.name = String(i) })
    let count = 0
    while (vault.canUndo.value) { vault.undo(); count++ }
    expect(count).toBe(30)
  })
  it('clears originals, vault, audit, redo, undo, bytes, and export snapshot', () => {
    const vault = useVault()
    vault.load(bytes(), 'vault.json')
    vault.commit('Deleted', doc => deleteItem(doc, 0))
    vault.markExported()
    vault.undo()
    vault.close()
    expect(vault.workingDocument.value).toBeNull()
    expect(vault.originalDocument.value).toBeNull()
    expect(vault.originalBytes.value).toBeNull()
    expect(vault.originalName.value).toBe('')
    expect(vault.changes.value).toEqual([])
    expect(vault.canUndo.value).toBe(false)
    expect(vault.canRedo.value).toBe(false)
    expect(vault.dirty.value).toBe(false)
    vault.redo()
    expect(vault.workingDocument.value).toBeNull()
  })
  it('keeps the current vault intact when another import fails', () => {
    const vault = useVault()
    vault.load(bytes(), 'vault.json')
    vault.commit('Item 1: name changed', doc => { doc.items![0]!.name = 'Edited' })
    expect(() => vault.load(new TextEncoder().encode('not json').buffer as ArrayBuffer, 'bad.json')).toThrow()
    expect(vault.originalName.value).toBe('vault.json')
    expect(vault.workingDocument.value!.items![0]!.name).toBe('Edited')
    expect(vault.canUndo.value).toBe(true)
  })
})
