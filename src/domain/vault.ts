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
