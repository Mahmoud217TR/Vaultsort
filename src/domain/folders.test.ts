import { describe, expect, it } from 'vitest'
import { clone, createFolder, deleteFolder, folderTree, mergeFolders, moveFolder, prepareVaultExport, renameFolder, serializeVault, validateVault, type VaultExport } from './vault'
import { useVault } from '../composables/useVault'

const nested = (): VaultExport => ({
  encrypted: false, future: { keep: true },
  folders: [
    { id: 'work', name: 'Work', extra: { keep: 1 } },
    { id: 'dev', name: 'Work/Development', extra: { keep: 2 } },
    { id: 'services', name: 'Work/Development/Services' },
    { id: 'similar', name: 'Workshops' },
    { id: 'personal', name: 'Personal' },
    { id: 'inherited', name: 'Projects/Inherited' },
  ],
  items: [
    { id: '1', type: 2, folderId: 'work', notes: 'secret', unknown: { keep: true } },
    { id: '2', type: 2, folderId: 'dev', organizationId: 'org', collectionIds: ['collection'] },
    { id: '3', type: 2, folderId: 'services' },
    { id: '4', type: 2, folderId: 'similar' },
    { id: '5', type: 2 },
  ],
})

describe('folder branch export', () => {
  it('retains exact recursive and nested members/empty records without inventing ancestors', () => {
    const doc = nested(); doc.folders!.push({ id: 'empty', name: 'Work/Empty' })
    const before = serializeVault(doc)
    const parent = prepareVaultExport(doc, { kind: 'folder', path: 'Work', folderIndex: 0 })
    expect(parent.itemSources).toEqual([0, 1, 2]); expect(parent.folderSources).toEqual([0, 1, 2, 6])
    const child = prepareVaultExport(doc, { kind: 'folder', path: 'Work/Development', folderIndex: 1 })
    expect(child.itemSources).toEqual([1, 2]); expect(child.folderSources).toEqual([0, 1, 2])
    const virtual = prepareVaultExport(doc, { kind: 'folder', path: 'Projects', folderIndex: null })
    expect(virtual.document.folders).toEqual([doc.folders![5]])
    expect(virtual.document.items).toEqual([])
    expect(serializeVault(doc)).toBe(before)
    expect(prepareVaultExport({ folders: [{ id: 'empty', name: 'Empty' }] }, { kind: 'folder', path: 'Empty', folderIndex: 0 }).document).toEqual({ folders: [{ id: 'empty', name: 'Empty' }] })
  })
  it('blocks duplicate actual root/descendant paths in actual or virtual branches, not outside them', () => {
    for (const path of ['Work', 'Work/Development']) {
      const doc = nested(); doc.folders!.push({ id: 'different-id', name: path })
      const before = serializeVault(doc)
      expect(() => prepareVaultExport(doc, { kind: 'folder', path: 'Work', folderIndex: 0 })).toThrow('export.ambiguousBranch')
      expect(serializeVault(doc)).toBe(before)
      expect(() => prepareVaultExport(doc, { kind: 'selected', indexes: [0] })).not.toThrow()
    }
    const virtual = { folders: [{ id: 'one', name: 'Virtual/Child' }, { id: 'two', name: 'Virtual/Child' }] }
    expect(() => prepareVaultExport(virtual, { kind: 'folder', path: 'Virtual', folderIndex: null })).toThrow('export.ambiguousBranch')
    const doc = nested(); doc.folders!.push({ id: 'duplicate-parent', name: 'Work' }, { id: 'a', name: 'Work/Other' }, { id: 'b', name: 'Work/Other' }, { id: 'd', name: 'Workshops' })
    const result = prepareVaultExport(doc, { kind: 'folder', path: 'Work/Development', folderIndex: 1 })
    expect(result.folderSources).toEqual([0, 1, 2, 6]); expect(result.itemSources).toEqual([1, 2])
  })
  it('uses literal names, exact empty-name identity and independent structural validation', () => {
    const doc: VaultExport = { folders: [{ id: 'empty', name: '' }, { id: 'bad' }, { id: 'literal', name: ' Work//Child ' }, { id: 'other', name: 'work/Child' }], items: [{ type: 2, folderId: 'empty' }, { type: 2, folderId: 'literal' }, { type: 2 }] }
    expect(prepareVaultExport(doc, { kind: 'folder', path: '', folderIndex: 0 }).itemSources).toEqual([0])
    expect(prepareVaultExport(doc, { kind: 'folder', path: ' Work', folderIndex: null }).itemSources).toEqual([1])
    expect(() => prepareVaultExport(doc, { kind: 'folder', path: '', folderIndex: 1 })).toThrow('validation.folderName')
    doc.folders!.push({ id: 'second-empty', name: '' })
    expect(() => prepareVaultExport(doc, { kind: 'folder', path: '', folderIndex: 0 })).toThrow('export.ambiguousBranch')
    const ids: VaultExport = { folders: [{ id: 'same', name: 'Work' }, { id: 'same', name: 'Other' }], items: [{ type: 2, folderId: 'same' }] }
    expect(validateVault(prepareVaultExport(ids, { kind: 'folder', path: 'Work', folderIndex: 0 }).document).some(issue => issue.message === 'validation.duplicateFolderId')).toBe(true)
    expect(() => prepareVaultExport({ folders: [{ id: 'f', name: 'F' }], collections: {} }, { kind: 'folder', path: 'F', folderIndex: 0 })).toThrow('export.unsafeOwnership')
    for (const request of [{ path: 'Missing', folderIndex: null }, { path: 'Other', folderIndex: 0 }, { path: 'Work', folderIndex: -1 }]) expect(() => prepareVaultExport(ids, { kind: 'folder', ...request })).toThrow('export.invalidScope')
  })
})

describe('nested folders without a new export structure', () => {
  it('derives ordered hierarchy and virtual parents without touching the document', () => {
    const doc = nested()
    const before = clone(doc)
    const rows = folderTree(doc)
    expect(rows.map(row => row.path)).toEqual(['Personal', 'Projects', 'Projects/Inherited', 'Work', 'Work/Development', 'Work/Development/Services', 'Workshops'])
    expect(rows.find(row => row.path === 'Projects')).toMatchObject({ index: null, id: '', depth: 0 })
    expect(rows.find(row => row.id === 'services')).toMatchObject({ label: 'Services', depth: 2, index: 2 })
    expect(doc).toEqual(before)
    doc.folders!.push({ id: 'duplicate-name', name: 'Work' })
    expect(folderTree(doc).filter(row => row.path === 'Work')).toHaveLength(2)
  })
  it('creates under real and implicit parents without inventing parentId metadata', () => {
    const doc = nested()
    const before = clone(doc.items)
    expect(createFolder(doc, 'New child', 'Work').name).toBe('Work/New child')
    expect(createFolder(doc, 'Sibling', 'Projects').name).toBe('Projects/Sibling')
    expect(createFolder(doc, 'New/Deep/Path').name).toBe('New/Deep/Path')
    expect(doc.folders!.some(folder => folder.name === 'New')).toBe(false)
    expect(doc.folders!.every(folder => !Object.hasOwn(folder, 'parentId'))).toBe(true)
    expect(doc.items).toEqual(before)
  })
  it('renames a parent and descendants, not lookalike prefixes, IDs, items, or metadata', () => {
    const doc = nested()
    const before = clone(doc)
    renameFolder(doc, 'work', 'Office')
    expect(doc.folders!.map(folder => folder.name)).toEqual(['Office', 'Office/Development', 'Office/Development/Services', 'Workshops', 'Personal', 'Projects/Inherited'])
    expect(doc.items).toEqual(before.items)
    expect(doc.future).toEqual(before.future)
    expect(doc.folders!.map(({ name: _name, ...rest }) => rest)).toEqual(before.folders!.map(({ name: _name, ...rest }) => rest))
  })
  it('moves branches under another folder or back to top level, preserving assignments', () => {
    const doc = nested()
    const before = clone(doc.items)
    moveFolder(doc, 'work', 'Personal')
    expect(doc.folders![0]!.name).toBe('Personal/Work')
    expect(doc.folders![2]!.name).toBe('Personal/Work/Development/Services')
    moveFolder(doc, 'dev')
    expect(doc.folders![1]!.name).toBe('Development')
    expect(doc.folders![2]!.name).toBe('Development/Services')
    expect(doc.items).toEqual(before)
    moveFolder(doc, 'dev', 'Projects')
    expect(doc.folders![1]!.name).toBe('Projects/Development')
  })
  it('keeps imported leaf names byte-for-byte when only the parent changes', () => {
    const doc = nested()
    doc.folders![0]!.name = ' Work '
    doc.folders![1]!.name = ' Work /Development '
    doc.folders![2]!.name = ' Work /Development /Services'
    moveFolder(doc, 'work', 'Personal')
    expect(doc.folders![0]!.name).toBe('Personal/ Work ')
    expect(doc.folders![2]!.name).toBe('Personal/ Work /Development /Services')
    moveFolder(doc, 'dev')
    expect(doc.folders![1]!.name).toBe('Development ')
    expect(doc.folders![2]!.name).toBe('Development /Services')
  })
  it('rejects collisions, empty path segments, missing parents, and self/descendant moves atomically', () => {
    const doc = nested()
    doc.folders!.push({ id: 'collision', name: 'Personal/Work/Development' })
    const before = clone(doc)
    for (const operation of [
      () => createFolder(doc, 'Work'), () => createFolder(doc, 'Development', 'Work'),
      () => createFolder(doc, 'Bad//Path'), () => createFolder(doc, '/Leading'), () => createFolder(doc, 'Trailing/'),
      () => createFolder(doc, 'Name', 'Missing'), () => moveFolder(doc, 'work', 'Missing'),
      () => moveFolder(doc, 'work', 'Work'), () => moveFolder(doc, 'work', 'Work/Development'),
      () => renameFolder(doc, 'work', 'Work/Child'), () => renameFolder(doc, 'work', 'Personal'),
      () => moveFolder(doc, 'work', 'Personal'),
    ]) {
      expect(operation).toThrow()
      expect(doc).toEqual(before)
    }
  })
  it('deletes only the selected folder by default, retaining nested paths as groups', () => {
    const doc = nested()
    deleteFolder(doc, 'work')
    expect(doc.items![0]!.folderId).toBeNull()
    expect(doc.items![1]!.folderId).toBe('dev')
    expect(doc.folders!.some(folder => folder.name === 'Work/Development')).toBe(true)
    expect(folderTree(doc).find(row => row.path === 'Work')).toMatchObject({ index: null })
    expect(doc.items).toHaveLength(5)
  })
  it('deletes or merges a branch with explicit reassignment and no credential deletion', () => {
    for (const operation of [deleteFolder, mergeFolders]) {
      const doc = nested()
      const before = clone(doc.items)
      operation(doc, 'work', 'personal', true)
      expect(doc.folders!.map(folder => folder.id)).toEqual(['similar', 'personal', 'inherited'])
      expect(doc.items).toHaveLength(5)
      expect(doc.items!.slice(0, 3).every(item => item.folderId === 'personal')).toBe(true)
      expect(doc.items!.map(({ folderId: _id, ...rest }) => rest)).toEqual(before!.map(({ folderId: _id, ...rest }) => rest))
    }
    const unassigned = nested()
    deleteFolder(unassigned, 'work', null, true)
    expect(unassigned.items!.slice(0, 3).every(item => item.folderId === null)).toBe(true)
  })
  it('rejects destinations inside a removed branch, duplicate IDs, and ambiguous parent names', () => {
    const doc = nested()
    const before = clone(doc)
    expect(() => deleteFolder(doc, 'work', 'dev', true)).toThrow()
    expect(doc).toEqual(before)
    doc.folders!.push({ id: 'dev', name: 'Other' })
    expect(() => deleteFolder(doc, 'work', null, true)).toThrow()
    expect(doc.folders).toHaveLength(7)
    const ambiguous = nested()
    ambiguous.folders!.push({ id: 'duplicate', name: 'Work' })
    expect(() => renameFolder(ambiguous, 'work', 'Office')).toThrow('ambiguous')
    expect(() => deleteFolder(ambiguous, 'work', null, true)).toThrow('ambiguous')
  })
  it('undoes and redoes complete branch operations with an immutable original', () => {
    for (const operation of [
      (doc: VaultExport) => renameFolder(doc, 'work', 'Office'),
      (doc: VaultExport) => moveFolder(doc, 'work', 'Personal'),
      (doc: VaultExport) => deleteFolder(doc, 'work', null, true),
      (doc: VaultExport) => createFolder(doc, 'Child', 'Work'),
    ]) {
      const vault = useVault()
      const original = nested()
      vault.load(new TextEncoder().encode(serializeVault(original)).buffer as ArrayBuffer, 'nested.json')
      vault.commit('Folder branch changed', operation)
      const changed = clone(vault.workingDocument.value)
      expect(vault.originalDocument.value).toEqual(original)
      expect(vault.changes.value).toEqual(['Folder branch changed'])
      vault.undo()
      expect(vault.workingDocument.value).toEqual(original)
      vault.redo()
      expect(vault.workingDocument.value).toEqual(changed)
    }
  })
})
