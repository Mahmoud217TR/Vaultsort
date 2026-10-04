import { translate as t } from '../i18n'

export interface JsonObject { [key: string]: unknown }
export interface VaultFolder extends JsonObject { id?: string; name?: string }
export interface VaultItem extends JsonObject {
  id?: string
  name?: string
  type?: number
  folderId?: string | null
  organizationId?: string | null
  favorite?: boolean
  notes?: string | null
  login?: JsonObject
}
export interface VaultExport extends JsonObject {
  encrypted?: boolean
  folders?: VaultFolder[]
  items?: VaultItem[]
}
export const isObject = (value: unknown): value is JsonObject =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
export const text = (value: unknown): string => typeof value === 'string' ? value : ''
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
export const items = (doc: VaultExport) => doc.items ?? []
export const folders = (doc: VaultExport) => doc.folders ?? []
export type ItemSort = 'original' | 'name' | 'creationDate' | 'revisionDate'
export type SortDirection = 'asc' | 'desc'
export function sortItemRows(rows: { item: VaultItem; index: number }[], by: ItemSort, direction: SortDirection, locale: string) {
  if (by === 'original') return [...rows].sort((a, b) => a.index - b.index)
  const collator = new Intl.Collator(locale, { sensitivity: 'base', numeric: true })
  const sign = direction === 'asc' ? 1 : -1
  const timestamps = by === 'name' ? null : new Map(rows.map(row => [row.index, Date.parse(text(row.item[by]))]))
  return [...rows].sort((a, b) => {
    if (by === 'name') return sign * collator.compare(text(a.item.name).trim(), text(b.item.name).trim()) || a.index - b.index
    const left = timestamps!.get(a.index)!, right = timestamps!.get(b.index)!
    // Missing/invalid dates stay last in either direction; equal keys keep source order.
    if (!Number.isFinite(left)) return Number.isFinite(right) ? 1 : a.index - b.index
    if (!Number.isFinite(right)) return -1
    return sign * (left - right) || a.index - b.index
  })
}
export const login = (item: VaultItem): JsonObject => isObject(item.login) ? item.login : {}
export const uris = (item: VaultItem): unknown[] => Array.isArray(login(item).uris) ? login(item).uris as unknown[] : []
export const fields = (item: VaultItem): unknown[] => Array.isArray(item.fields) ? item.fields : []
export const knownTypes = [
  { type: 1, label: 'common.login', category: 'nav.logins', icon: 'key' },
  { type: 2, label: 'common.note', category: 'nav.notes', icon: 'note' },
  { type: 3, label: 'common.card', category: 'nav.cards', icon: 'card' },
  { type: 4, label: 'common.identity', category: 'nav.identities', icon: 'user' },
  { type: 5, label: 'common.ssh', category: 'nav.ssh', icon: 'key' },
] as const
export const itemType = (value: unknown) => knownTypes.find(entry => entry.type === value)
export const typeName = (value: unknown) => t(itemType(value)?.label ?? 'common.other')
export const maskUsername = (value: string) => value ? `${value.length > 2 ? value.slice(0, 2) : ''}••••••` : ''
export const scalar = (value: unknown) => value == null ? t('common.dash') : ['string', 'number', 'boolean'].includes(typeof value) ? String(value) : t('common.structured')
export const folderName = (doc: VaultExport, id: unknown) => !id ? t('common.unassigned') : text(folders(doc).find(f => f.id === id)?.name) || t('common.missingFolder')
export const organizationName = (doc: VaultExport, id: unknown) => {
  if (!id) return t('common.personal')
  const organizations = Array.isArray(doc.organizations) ? doc.organizations : []
  return text(organizations.find(o => isObject(o) && o.id === id)?.name) || text(id)
}

export function parseVault(source: string): VaultExport {
  let value: unknown
  try { value = JSON.parse(source) } catch {
    // JSON.parse errors can quote secrets from the source. Never expose the native message.
    throw new Error('errors.invalidJson')
  }
  if (!isObject(value)) throw new Error('errors.exportObject')
  if (value.encrypted !== undefined && value.encrypted !== false) throw new Error('errors.encrypted')
  if (value.items === undefined && value.folders === undefined && value.encrypted !== false) throw new Error('errors.notVault')
  for (const key of ['items', 'folders']) {
    if (value[key] !== undefined && (!Array.isArray(value[key]) || !value[key].every(isObject))) {
      throw new Error(`errors.${key}Array`)
    }
  }
  return value as VaultExport
}
export const serializeVault = (doc: VaultExport) => JSON.stringify(doc, null, 2)

const unsafeFilename = /[/\\<>:"|?*\p{Cc}\p{Cs}\u202a-\u202e\u2066-\u2069]/u
export function resolveExportFilename(raw: string): { name: string; error?: never } | { error: string; name?: never } {
  if (!raw || /^\.json$/i.test(raw) || /^[.]+$/.test(raw) || unsafeFilename.test(raw) || /[ .]$/.test(raw)) return { error: 'export.invalidFilename' }
  if (/^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])$/i.test(raw.split('.')[0]!)) return { error: 'export.reservedFilename' }
  const name = /\.json$/i.test(raw) ? raw : `${raw}.json`
  return Array.from(name).length > 200 ? { error: 'export.longFilename' } : { name }
}
export function defaultExportFilename(source: string, scope: 'full' | 'selected' | 'folder'): string {
  const suffix = `-${scope === 'full' ? 'edited' : scope}.json`
  const stem = Array.from(source.replace(/\.json$/i, '').replace(new RegExp(unsafeFilename.source, 'gu'), '').replace(/^[ .]+|[ .]+$/g, '')).slice(0, 200 - suffix.length).join('')
  const proposed = `${stem}${suffix}`
  return stem && !/^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])$/i.test(stem.split('.')[0]!) && resolveExportFilename(proposed).name ? proposed : `vault${suffix}`
}

export type ExportScope = { kind: 'full' } | { kind: 'selected'; indexes: number[] } | { kind: 'folder'; path: string; folderIndex: number | null }
export interface PreparedExport { document: VaultExport; itemSources: number[]; folderSources: number[]; diagnostics: Issue[] }
export function prepareVaultExport(source: VaultExport, scope: ExportScope): PreparedExport {
  const document = clone(source)
  let itemSources = items(source).map((_, index) => index)
  let folderSources = folders(source).map((_, index) => index)
  const diagnostics: Issue[] = []
  if (scope.kind !== 'full') {
    const branch = new Set<number>()
    if (scope.kind === 'selected') {
      if (!scope.indexes.length || new Set(scope.indexes).size !== scope.indexes.length || scope.indexes.some(index => !Number.isInteger(index) || index < 0 || index >= items(source).length)) throw new Error('export.invalidScope')
      itemSources = [...scope.indexes].sort((a, b) => a - b)
    } else {
      if (scope.folderIndex === null) {
        if (!scope.path || !folderTree(source).some(row => row.index === null && row.path === scope.path)) throw new Error('export.invalidScope')
      } else {
        if (!Number.isInteger(scope.folderIndex) || scope.folderIndex < 0 || !folders(source)[scope.folderIndex]) throw new Error('export.invalidScope')
        if (typeof folders(source)[scope.folderIndex]!.name !== 'string') throw new Error('validation.folderName')
        if (folders(source)[scope.folderIndex]!.name !== scope.path) throw new Error('export.invalidScope')
      }
      const seen = new Set<string>()
      folders(source).forEach((folder, index) => {
        if (typeof folder.name !== 'string' || !(scope.path ? withinFolder(folder.name, scope.path) : folder.name === '')) return
        if (seen.has(folder.name)) throw new Error('export.ambiguousBranch')
        seen.add(folder.name); branch.add(index)
      })
      const ids = new Set([...branch].map(index => folders(source)[index]!.id).filter(id => typeof id === 'string' && id))
      itemSources = items(source).flatMap((item, index) => typeof item.folderId === 'string' && !!item.folderId && ids.has(item.folderId) ? [index] : [])
    }
    const chosen = itemSources.map(index => items(source)[index]!)
    const folderIds = new Set(chosen.map(item => item.folderId).filter(id => typeof id === 'string' && id))
    const paths = new Set<string>()
    folders(source).forEach((folder, index) => { if (folderIds.has(folder.id) || branch.has(index)) {
      let parent = folderParent(text(folder.name))
      while (parent) { paths.add(parent); parent = folderParent(parent) }
    } })
    folderSources = folders(source).flatMap((folder, index) => branch.has(index) || folderIds.has(folder.id) || paths.has(text(folder.name)) ? [index] : [])
    if (Object.hasOwn(document, 'items')) document.items = itemSources.map(index => document.items![index]!)
    if (Object.hasOwn(document, 'folders')) document.folders = folderSources.map(index => document.folders![index]!)

    const organizationIds = new Set<string>(), collectionIds = new Set<string>()
    for (const item of chosen) {
      if (item.organizationId != null && typeof item.organizationId !== 'string' || item.collectionIds != null && (!Array.isArray(item.collectionIds) || item.collectionIds.some(id => typeof id !== 'string' || !id))) throw new Error('export.unsafeOwnership')
      if (item.organizationId) organizationIds.add(item.organizationId)
      for (const id of (item.collectionIds ?? []) as string[]) collectionIds.add(id)
    }
    for (const key of ['collections', 'organizations'] as const) {
      if (!Object.hasOwn(source, key)) continue
      const records = source[key]
      if (!Array.isArray(records) || records.some(record => !isObject(record) || typeof record.id !== 'string' || !record.id || key === 'collections' && record.organizationId != null && typeof record.organizationId !== 'string')) throw new Error('export.unsafeOwnership')
      const ids = key === 'collections' ? collectionIds : organizationIds
      const retained = (records as JsonObject[]).filter(record => ids.has(record.id as string))
      if (key === 'collections') for (const record of retained) if (record.organizationId) organizationIds.add(record.organizationId as string)
      document[key] = clone(retained)
    }
    if ([...collectionIds].some(id => !Array.isArray(document.collections) || !document.collections.some(record => isObject(record) && record.id === id)) || [...organizationIds].some(id => !Array.isArray(document.organizations) || !document.organizations.some(record => isObject(record) && record.id === id))) diagnostics.push({ severity: 'warning', message: 'export.missingOwnership' })
  }
  if (items(document).some(item => item.organizationId || Array.isArray(item.collectionIds) && item.collectionIds.length)) diagnostics.push({ severity: 'warning', message: 'export.ownershipRoute' })
  if (Object.hasOwn(document, 'folders') && Object.hasOwn(document, 'collections')) diagnostics.push({ severity: 'warning', message: 'export.combinedLists' })
  if (!items(document).length) diagnostics.push({ severity: 'warning', message: 'export.emptyCompatibility' })
  return { document, itemSources, folderSources, diagnostics }
}

export function parseRawItem(source: string): VaultItem {
  let value: unknown
  try { value = JSON.parse(source) } catch { throw new Error('errors.rawJson') }
  if (!isObject(value)) throw new Error('errors.itemObject')
  if (value.type !== undefined && (!Number.isInteger(value.type) || typeof value.type !== 'number')) throw new Error('errors.itemType')
  if (value.name !== undefined && typeof value.name !== 'string') throw new Error('errors.itemName')
  if (value.folderId !== undefined && value.folderId !== null && typeof value.folderId !== 'string') throw new Error('errors.folderId')
  if (value.login !== undefined && value.login !== null && !isObject(value.login)) throw new Error('errors.loginObject')
  return value as VaultItem
}

function destination(doc: VaultExport, id: string | null) {
  if (id !== null && (!id || folders(doc).filter(f => f.id === id).length !== 1)) throw new Error('errors.destination')
}
function uniqueFolder(doc: VaultExport, id: string) {
  const matches = folders(doc).filter(f => f.id === id)
  if (!id || matches.length !== 1) throw new Error('errors.uniqueFolder')
  return matches[0]!
}
export const folderParent = (path: string) => path.slice(0, Math.max(0, path.lastIndexOf('/')))
export const folderLeaf = (path: string) => path.slice(path.lastIndexOf('/') + 1)
export const withinFolder = (path: string, parent: string) => !!parent && (path === parent || path.startsWith(`${parent}/`))

export interface FolderRow { path: string; label: string; depth: number; id: string; index: number | null }
export function folderTree(doc: VaultExport): FolderRow[] {
  const rows = folders(doc).map((folder, index) => ({ path: text(folder.name), label: folderLeaf(text(folder.name)) || t('common.unnamedFolder'), depth: text(folder.name).split('/').length - 1, id: text(folder.id), index })) as FolderRow[]
  const paths = new Set(rows.map(row => row.path))
  for (const row of [...rows]) {
    let parent = folderParent(row.path)
    while (parent) {
      if (!paths.has(parent)) {
        paths.add(parent)
        rows.push({ path: parent, label: folderLeaf(parent) || t('common.unnamedGroup'), depth: parent.split('/').length - 1, id: '', index: null })
      }
      parent = folderParent(parent)
    }
  }
  return rows.sort((a, b) => {
    const left = a.path.split('/'), right = b.path.split('/')
    for (let i = 0; i < Math.min(left.length, right.length); i++) {
      const compared = left[i]!.localeCompare(right[i]!)
      if (compared) return compared
    }
    return left.length - right.length
  })
}
function validateFolderParent(doc: VaultExport, parent: string) {
  if (parent && !folderTree(doc).some(row => row.path === parent)) throw new Error('errors.parent')
  if (parent && parent.split('/').some(part => !part.trim())) throw new Error('errors.parentSegment')
}
function folderPath(doc: VaultExport, name: string, parent?: string) {
  const leaf = name.trim()
  if (!leaf) throw new Error('errors.folderName')
  if (leaf.split('/').some(part => !part.trim())) throw new Error('errors.pathSegment')
  validateFolderParent(doc, parent ?? '')
  return parent ? `${parent}/${leaf}` : leaf
}
export function createFolder(doc: VaultExport, name: string, parent?: string) {
  const path = folderPath(doc, name, parent)
  if (folders(doc).some(folder => folder.name === path)) throw new Error('errors.exists')
  const folder = { id: crypto.randomUUID(), name: path }
  ;(doc.folders ??= []).push(folder)
  return folder
}
function changeFolderPath(doc: VaultExport, source: VaultFolder, nextPath: string) {
  const oldPath = text(source.name)
  if (oldPath === nextPath) return
  if (withinFolder(folderParent(nextPath), oldPath)) throw new Error('errors.selfMove')
  const affected = folders(doc).filter(folder => folder === source || (oldPath && text(folder.name).startsWith(`${oldPath}/`)))
  if (affected.length > 1 && folders(doc).filter(folder => folder.name === oldPath).length > 1) throw new Error('errors.ambiguous')
  const plan = affected.map(folder => ({ folder, path: folder === source ? nextPath : nextPath + text(folder.name).slice(oldPath.length) }))
  const affectedSet = new Set(affected)
  const outside = new Set(folders(doc).filter(folder => !affectedSet.has(folder)).map(folder => text(folder.name)))
  if (new Set(plan.map(entry => entry.path)).size !== plan.length || plan.some(entry => outside.has(entry.path))) throw new Error('errors.pathExists')
  for (const entry of plan) entry.folder.name = entry.path
}
export function renameFolder(doc: VaultExport, id: string, name: string, parent?: string) {
  const source = uniqueFolder(doc, id)
  changeFolderPath(doc, source, folderPath(doc, name, parent))
}
export function moveFolder(doc: VaultExport, id: string, parent: string = '') {
  const source = uniqueFolder(doc, id)
  validateFolderParent(doc, parent)
  const leaf = folderLeaf(text(source.name))
  if (!leaf.trim()) throw new Error('errors.moveName')
  changeFolderPath(doc, source, parent ? `${parent}/${leaf}` : leaf)
}
export function moveItems(doc: VaultExport, indexes: number[], folderId: string | null) {
  destination(doc, folderId)
  if (indexes.some(i => !items(doc)[i])) throw new Error('errors.selectedMissing')
  for (const index of indexes) items(doc)[index]!.folderId = folderId
}
export const moveItem = (doc: VaultExport, index: number, folderId: string | null) => moveItems(doc, [index], folderId)
export function deleteFolder(doc: VaultExport, id: string, destinationId: string | null = null, includeSubfolders = false) {
  const source = uniqueFolder(doc, id)
  const removed = folders(doc).filter(folder => folder === source || (includeSubfolders && text(source.name) && text(folder.name).startsWith(`${source.name}/`)))
  if (removed.length > 1 && folders(doc).filter(folder => folder.name === source.name).length > 1) throw new Error('errors.ambiguous')
  for (const folder of removed) uniqueFolder(doc, text(folder.id))
  const removedIds = new Set(removed.map(folder => folder.id))
  if (removedIds.has(destinationId!)) throw new Error('errors.outside')
  destination(doc, destinationId)
  for (const item of items(doc)) if (removedIds.has(item.folderId!)) item.folderId = destinationId
  doc.folders = folders(doc).filter(folder => !removedIds.has(folder.id))
}
export const mergeFolders = (doc: VaultExport, source: string, target: string, includeSubfolders = false) => deleteFolder(doc, source, target, includeSubfolders)
export function updateItem(doc: VaultExport, index: number, patch: Partial<VaultItem>) {
  if (!items(doc)[index]) throw new Error('errors.itemMissing')
  // Spread uses own data properties, including harmless literal __proto__ keys.
  doc.items![index] = { ...items(doc)[index], ...clone(patch) }
}
export function replaceItem(doc: VaultExport, index: number, item: VaultItem) {
  if (!items(doc)[index]) throw new Error('errors.itemMissing')
  doc.items![index] = clone(item)
}
export function deleteItems(doc: VaultExport, indexes: number[]) {
  const removed = new Set(indexes)
  doc.items = items(doc).filter((_, index) => !removed.has(index))
}
export const deleteItem = (doc: VaultExport, index: number) => deleteItems(doc, [index])

export function normalizeUri(value: string): string {
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`)
    url.hash = ''
    return `${url.host.toLowerCase()}${url.pathname.replace(/\/+$/, '')}${url.search}`
  } catch { return value.trim().replace(/\/+$/, '') }
}
export function domain(value: string): string {
  try { return new URL(value.includes('://') ? value : `https://${value}`).hostname.toLowerCase() } catch { return '' }
}
export type DuplicateKind = 'exact' | 'credential' | 'name' | 'username' | 'domain'
export interface DuplicateGroup { kind: DuplicateKind; indexes: number[] }
export interface DuplicateRequest extends DuplicateGroup { revision: number }
export interface CandidateRequest { group: DuplicateRequest; index: number; name?: string }
export const groupSignature = (group: DuplicateGroup) => JSON.stringify([group.kind, [...group.indexes].sort((a, b) => a - b)])
export interface ComparisonRow { id: number; path: (string | number)[]; values: { present: boolean; value?: unknown }[]; different: boolean }
export interface ComparisonViewRow {
  id: number; labelKey: string; label?: string; different: boolean
  values: { state: 'absent' | 'masked' | 'null' | 'emptyString' | 'emptyObject' | 'emptyArray' | 'object' | 'array' | 'value'; text?: string }[]
}
function equalJson(left: unknown, right: unknown): boolean {
  if (left === right) return true
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => equalJson(value, right[index]))
  if (!isObject(left) || !isObject(right)) return false
  const keys = Object.keys(left)
  return keys.length === Object.keys(right).length && keys.every(key => Object.hasOwn(right, key) && equalJson(left[key], right[key]))
}
export function compareItems(candidates: VaultItem[]): ComparisonRow[] {
  const paths = new Map<string, (string | number)[]>()
  function visit(value: unknown, path: (string | number)[]) {
    if (path.length) paths.set(JSON.stringify(path), path)
    if (Array.isArray(value)) value.forEach((entry, index) => visit(entry, [...path, index]))
    else if (isObject(value)) for (const key of Object.keys(value)) visit(value[key], [...path, key])
  }
  for (const candidate of candidates) visit(candidate, [])
  return [...paths.values()].map((path, id) => {
    const values = candidates.map(candidate => {
      let value: unknown = candidate
      for (const key of path) {
        if ((!isObject(value) && !Array.isArray(value)) || !Object.hasOwn(value, key)) return { present: false }
        value = (value as Record<string | number, unknown>)[key]
      }
      return { present: true, value }
    })
    const first = values[0]
    return { id, path, values, different: values.some(value => value.present !== first?.present || !equalJson(value.value, first?.value)) }
  })
}
export function projectComparison(rows: ComparisonRow[], privacy: boolean): ComparisonViewRow[] {
  const labels = new Map([
    ['name', 'editor.name'], ['type', 'editor.type'], ['folderId', 'workspace.folder'], ['organizationId', 'editor.organizationId'],
    ['favorite', 'editor.favorite'], ['creationDate', 'editor.creationDate'], ['revisionDate', 'editor.revisionDate'], ['deletedDate', 'editor.deletedDate'],
  ])
  return rows.map(row => {
    const key = row.path.length === 1 ? labels.get(String(row.path[0])) : undefined
    const publicValue = !!key && row.values.every(value => !isObject(value.value) && !Array.isArray(value.value))
    return { id: row.id, labelKey: key ?? 'comparison.field', ...(privacy ? {} : { label: row.path.map(part => typeof part === 'number' ? `[${part}]` : JSON.stringify(part)).join('.') }), different: row.different,
      values: row.values.map(({ present, value }) => {
        if (!present) return { state: 'absent' as const }
        if (privacy && !publicValue) return { state: 'masked' as const }
        if (value === null) return { state: 'null' as const }
        if (value === '') return { state: 'emptyString' as const }
        if (Array.isArray(value)) return { state: value.length ? 'array' as const : 'emptyArray' as const }
        if (isObject(value)) return { state: Object.keys(value).length ? 'object' as const : 'emptyObject' as const }
        return { state: 'value' as const, text: String(value) }
      }) }
  })
}
export const duplicateLabel: Record<DuplicateKind, string> = {
  exact: 'review.exact', credential: 'review.credential', name: 'review.name', username: 'review.username', domain: 'review.domain',
}
export function findDuplicates(doc: VaultExport): DuplicateGroup[] {
  const groups = new Map<string, DuplicateGroup>()
  const add = (kind: DuplicateKind, key: string, index: number) => {
    const identity = JSON.stringify([kind, key])
    const group = groups.get(identity) ?? { kind, indexes: [] }
    if (group.indexes.at(-1) !== index) group.indexes.push(index)
    groups.set(identity, group)
  }
  items(doc).forEach((item, index) => {
    const name = text(item.name).trim().toLowerCase()
    if (name) add('name', name, index)
    if (item.type !== 1) return
    const username = text(login(item).username)
    const password = text(login(item).password)
    if (username) add('username', username, index)
    for (const entry of uris(item)) {
      const uri = isObject(entry) ? text(entry.uri).trim() : ''
      if (!uri) continue
      const normalized = normalizeUri(uri)
      if (domain(uri)) add('domain', domain(uri), index)
      if (username) add('credential', JSON.stringify([normalized, username]), index)
      if (username && password) add('exact', JSON.stringify([normalized, username, password]), index)
    }
  })
  // Keys containing credential values are only local temporaries, never returned or logged.
  return [...groups.values()].filter(group => group.indexes.length > 1)
}

export type IssueField = 'folderId' | 'login' | 'login.username' | 'login.password' | 'login.totp' | 'login.uris' | 'ownership'
export interface Issue { severity: 'error' | 'warning'; message: string; itemIndex?: number; folderIndex?: number; field?: IssueField; entryIndex?: number }
export interface IssueRequest { revision: number; issue: Issue }
export interface ValidationBundle { revision: number; issues: Issue[] }
export function validateVault(doc: VaultExport): Issue[] {
  const result: Issue[] = []
  const add = (severity: Issue['severity'], message: string, itemIndex?: number, folderIndex?: number, field?: IssueField, entryIndex?: number) => result.push({ severity, message, itemIndex, folderIndex, field, entryIndex })
  const counts = new Map<string, number>()
  const references = new Map<string, number>()
  for (const f of folders(doc)) if (text(f.id)) counts.set(f.id!, (counts.get(f.id!) ?? 0) + 1)
  for (const item of items(doc)) if (text(item.folderId)) references.set(item.folderId!, (references.get(item.folderId!) ?? 0) + 1)
  folders(doc).forEach((folder, index) => {
    if (!text(folder.id)) add('error', 'validation.folderId', undefined, index)
    else if (counts.get(folder.id!)! > 1) add('error', 'validation.duplicateFolderId', undefined, index)
    if (typeof folder.name !== 'string') add('error', 'validation.folderName', undefined, index)
    if (!references.has(folder.id!)) add('warning', 'validation.emptyFolder', undefined, index)
  })
  items(doc).forEach((item, index) => {
    if (item.folderId && !counts.has(text(item.folderId))) add('error', 'validation.missingFolder', index, undefined, 'folderId')
    if (item.organizationId || (Array.isArray(item.collectionIds) && item.collectionIds.length)) add('warning', 'validation.organization', index, undefined, 'ownership')
    if (!itemType(item.type)) add('warning', 'validation.unsupported', index)
    if (item.type !== 1) return
    const l = login(item)
    if (!isObject(item.login)) add('error', 'validation.login', index, undefined, 'login')
    for (const key of ['username', 'password', 'totp'] as const) if (l[key] !== undefined && l[key] !== null && typeof l[key] !== 'string') add('error', `validation.${key}`, index, undefined, `login.${key}`)
    if (l.uris !== undefined && l.uris !== null) {
      const invalid = Array.isArray(l.uris) ? l.uris.findIndex(u => !isObject(u) || (u.uri !== null && typeof u.uri !== 'string')) : -1
      if (!Array.isArray(l.uris) || invalid >= 0) add('error', 'validation.uris', index, undefined, 'login.uris', invalid >= 0 ? invalid : undefined)
    }
    if (!text(l.username)) add('warning', 'validation.noUsername', index, undefined, 'login.username')
    if (!text(l.password)) add('warning', 'validation.noPassword', index, undefined, 'login.password')
    if (!uris(item).some(u => isObject(u) && text(u.uri))) add('warning', 'validation.noUri', index, undefined, 'login.uris')
  })
  for (const group of findDuplicates(doc)) if (group.kind === 'exact') for (const index of group.indexes) add('warning', 'validation.duplicate', index)
  if (Object.keys(doc).some(key => !['encrypted', 'folders', 'items', 'organizations', 'collections'].includes(key))) add('warning', 'validation.unknown')
  return result
}

export function matchesSearch(doc: VaultExport, item: VaultItem, query: string): boolean {
  // ponytail: linear folder lookup per item; index folder names if very large vaults make search slow.
  const values = [text(item.name), text(login(item).username), text(item.notes), folderName(doc, item.folderId),
    ...uris(item).map(u => isObject(u) ? text(u.uri) : ''), ...fields(item).map(f => isObject(f) ? text(f.name) : '')]
  return values.some(value => value.toLowerCase().includes(query.toLowerCase().trim()))
}
