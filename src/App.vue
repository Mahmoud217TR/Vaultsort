<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { errorMessage, languages, translate, type Message } from './i18n'
import { setLanguage, setTheme, theme } from './preferences'
import Icon from './components/Icon.vue'
import vaultsortLogo from './branding/vaultsort-logo.svg'
import ItemEditor from './components/ItemEditor.vue'
import Modal from './components/Modal.vue'
import ReviewPanel from './components/ReviewPanel.vue'
import { useVault } from './composables/useVault'
import { createFolder, deleteFolder, deleteItems, domain, duplicateLabel, findDuplicates, folderLeaf, folderName, folderParent, folders, folderTree, isObject, items, login, maskUsername, matchesSearch, mergeFolders, moveFolder, moveItems, organizationName, renameFolder, replaceItem, serializeVault, text, typeName, uris, validateVault, withinFolder, type VaultExport, type VaultItem } from './domain/vault'

const { t, locale } = useI18n()
const number = (value: number) => new Intl.NumberFormat(locale.value).format(value)
const { originalBytes, originalName, workingDocument: doc, changes, dirty, canUndo, canRedo, load, commit, undo, redo, markExported, close } = useVault()
const fileInput = ref<HTMLInputElement>()
const searchInput = ref<HTMLInputElement>()
const privacy = ref(true)
const importing = ref(false)
const importError = ref<Message | null>(null)
const notice = ref<Message | null>(null)
const view = ref('all')
const query = ref('')
const folderFilter = ref('all')
const typeFilter = ref('all')
const organizationFilter = ref('all')
const qualityFilter = ref('all')
const showFilters = ref(false)
const selected = ref<number[]>([])
const selectedSet = computed(() => new Set(selected.value))
const current = ref<number | null>(null)
const editorVersion = ref(0)
const draftDirty = ref(false)
const page = ref(1)
const pageSize = 75
const modal = ref<'summary' | 'folders' | 'folder' | 'export' | 'changes' | 'help' | null>(null)
const folderAction = ref<'create' | 'rename' | 'move' | 'delete' | 'merge'>('create')
const activeFolder = ref('')
const folderLabel = ref('')
const parentFolderPath = ref('')
const folderDestination = ref('')
const includeSubfolders = ref(false)
const returnToFolders = ref(false)
const folderError = ref<Message | null>(null)
let reader: FileReader | null = null
let readVersion = 0
let noticeTimer: ReturnType<typeof setTimeout> | undefined
const objectUrls = new Set<string>()

const nav = [
  { id: 'all', label: 'nav.all', icon: 'grid' }, { id: 'favorites', label: 'nav.favorites', icon: 'star' },
  { id: 'unassigned', label: 'nav.unassigned', icon: 'folder' }, { id: '1', label: 'nav.logins', icon: 'key' },
  { id: '2', label: 'nav.notes', icon: 'note' }, { id: '3', label: 'nav.cards', icon: 'card' }, { id: '4', label: 'nav.identities', icon: 'user' },
]
const allItems = computed(() => doc.value ? items(doc.value) : [])
const allFolders = computed(() => doc.value ? folders(doc.value).map(folder => ({ id: text(folder.id), name: text(folder.name) })) : [])
const folderRows = computed(() => doc.value ? folderTree(doc.value) : [])
const activeFolderPath = computed(() => allFolders.value.find(folder => folder.id === activeFolder.value)?.name ?? '')
const parentPaths = computed(() => [...new Set(folderRows.value.map(row => row.path).filter(path => path && (folderAction.value === 'create' || !withinFolder(path, activeFolderPath.value))))])
const folderTarget = computed(() => [parentFolderPath.value, folderAction.value === 'move' ? folderLabel.value : folderLabel.value.trim()].filter(Boolean).join('/'))
const folderDraftDirty = computed(() => modal.value === 'folder' && (folderAction.value === 'create' ? !!folderLabel.value.trim() : ['rename', 'move'].includes(folderAction.value) && folderTarget.value !== activeFolderPath.value))
const subfolderCount = computed(() => allFolders.value.filter(folder => activeFolderPath.value && folder.name.startsWith(`${activeFolderPath.value}/`)).length)
const affectedFolderIds = computed(() => new Set(allFolders.value.filter(folder => folder.id === activeFolder.value || (includeSubfolders.value && activeFolderPath.value && folder.name.startsWith(`${activeFolderPath.value}/`))).map(folder => folder.id)))
const affectedItemCount = computed(() => allItems.value.filter(item => affectedFolderIds.value.has(text(item.folderId))).length)
const destinationFolders = computed(() => allFolders.value.filter(folder => !affectedFolderIds.value.has(folder.id)))
watch(affectedFolderIds, ids => { if (ids.has(folderDestination.value)) folderDestination.value = '' })
const folderCounts = computed(() => {
  const counts = new Map<string, number>()
  for (const item of allItems.value) if (item.folderId) counts.set(item.folderId, (counts.get(item.folderId) ?? 0) + 1)
  return counts
})
const duplicates = computed(() => doc.value ? findDuplicates(doc.value) : [])
const issues = computed(() => doc.value ? validateVault(doc.value) : [])
const errorCount = computed(() => issues.value.filter(issue => issue.severity === 'error').length)
const warningItems = computed(() => new Set(issues.value.flatMap(issue => issue.itemIndex === undefined ? [] : [issue.itemIndex])))
const organizations = computed(() => [...new Set(allItems.value.map(item => text(item.organizationId)).filter(Boolean))])
const heading = computed(() => folderFilter.value !== 'all' ? folderName(doc.value!, folderFilter.value === '__unassigned' ? null : folderFilter.value) : t(nav.find(n => n.id === view.value)?.label ?? 'nav.all'))
const currentItem = computed(() => current.value === null ? null : allItems.value[current.value] ?? null)
const filtered = computed(() => {
  if (!doc.value) return []
  const duplicateIndexes = new Set(duplicates.value.filter(group => group.kind === qualityFilter.value).flatMap(group => group.indexes))
  return allItems.value.map((item, index) => ({ item, index })).filter(({ item, index }) => {
    if (view.value === 'favorites' && item.favorite !== true) return false
    if (view.value === 'unassigned' && item.folderId) return false
    if (['1', '2', '3', '4'].includes(view.value) && item.type !== Number(view.value)) return false
    if (folderFilter.value !== 'all' && (folderFilter.value === '__unassigned' ? !!item.folderId : item.folderId !== folderFilter.value)) return false
    if (typeFilter.value !== 'all' && (typeFilter.value === 'other' ? [1, 2, 3, 4].includes(item.type!) : item.type !== Number(typeFilter.value))) return false
    if (organizationFilter.value !== 'all' && (organizationFilter.value === '__personal' ? !!item.organizationId : item.organizationId !== organizationFilter.value)) return false
    if (qualityFilter.value === 'favorites' && item.favorite !== true) return false
    if (qualityFilter.value === 'no-username' && (item.type !== 1 || text(login(item).username))) return false
    if (qualityFilter.value === 'no-uri' && (item.type !== 1 || uris(item).some(u => isObject(u) && text(u.uri)))) return false
    if (qualityFilter.value === 'warnings' && !warningItems.value.has(index)) return false
    if (['exact', 'credential', 'name', 'username', 'domain'].includes(qualityFilter.value) && !duplicateIndexes.has(index)) return false
    return matchesSearch(doc.value!, item, query.value)
  })
})
const visible = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const allSelected = computed(() => filtered.value.length > 0 && filtered.value.every(row => selectedSet.value.has(row.index)))
const activeFilters = computed(() => [typeFilter.value, organizationFilter.value, qualityFilter.value].filter(v => v !== 'all').length)
watch([view, query, folderFilter, typeFilter, organizationFilter, qualityFilter], () => { page.value = 1; selected.value = [] })
watch(pages, value => { if (page.value > value) page.value = value })
const summary = computed(() => [
  { value: allItems.value.length, label: 'import.totalItems' }, { value: allFolders.value.length, label: 'import.folders' },
  { value: allItems.value.filter(i => i.type === 1).length, label: 'import.logins' }, { value: allItems.value.filter(i => i.type === 2).length, label: 'import.notes' },
  { value: allItems.value.filter(i => i.organizationId).length, label: 'import.organizationItems' },
])
function notify(message: Message | string) {
  notice.value = typeof message === 'string' ? { key: message } : message
  if (noticeTimer) clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { notice.value = null }, 6500)
}
function discardDraft(): boolean {
  if (draftDirty.value && !window.confirm(t('confirm.discardItem'))) return false
  draftDirty.value = false
  editorVersion.value++
  return true
}
function selectItem(index: number) {
  if (index === current.value) return
  if (!discardDraft()) return
  current.value = index
}
function closeEditor() { if (discardDraft()) current.value = null }
function changeView(id: string, folder = 'all') {
  view.value = id
  folderFilter.value = folder
  typeFilter.value = 'all'
  organizationFilter.value = 'all'
  qualityFilter.value = 'all'
  query.value = ''
}
function togglePrivacy() { if (discardDraft()) privacy.value = !privacy.value }
function unsavedConfirm() { return !(dirty.value || draftDirty.value || folderDraftDirty.value) || window.confirm(t('confirm.unsaved')) }
function resetUI() {
  current.value = null
  selected.value = []
  draftDirty.value = false
  query.value = ''
  view.value = 'all'
  folderFilter.value = typeFilter.value = organizationFilter.value = qualityFilter.value = 'all'
  privacy.value = true
  modal.value = null
  folderLabel.value = parentFolderPath.value = folderDestination.value = activeFolder.value = ''
  folderError.value = null
  includeSubfolders.value = returnToFolders.value = false
  notice.value = importError.value = null
  showFilters.value = false
  page.value = 1
  editorVersion.value++
}
function closeVault() {
  if (!unsavedConfirm()) return
  readVersion++
  reader?.abort()
  reader = null
  importing.value = false
  close()
  resetUI()
  if (fileInput.value) fileInput.value.value = ''
  for (const url of objectUrls) URL.revokeObjectURL(url)
  objectUrls.clear()
}
function chooseFile() {
  if (!unsavedConfirm()) return
  fileInput.value?.click()
}
function importFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.json')) { importError.value = { key: 'errors.selectJson' }; return }
  const version = ++readVersion
  reader?.abort()
  const localReader = new FileReader()
  reader = localReader
  importing.value = true
  importError.value = null
  localReader.onload = () => {
    if (version !== readVersion) return
    try {
      if (!(localReader.result instanceof ArrayBuffer)) throw new Error('errors.read')
      load(localReader.result, file.name)
      resetUI()
      modal.value = 'summary'
    } catch (e) { importError.value = e instanceof TypeError ? { key: 'errors.utf8' } : errorMessage(e, 'errors.open') }
    importing.value = false
    reader = null
    localReader.onload = localReader.onerror = null
    if (fileInput.value) fileInput.value.value = ''
  }
  localReader.onerror = () => { if (version === readVersion) { importing.value = false; importError.value = { key: 'errors.retry' }; reader = null } }
  localReader.readAsArrayBuffer(file)
}
function download(data: BlobPart, name: string) {
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
  objectUrls.add(url)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => { URL.revokeObjectURL(url); objectUrls.delete(url) }, 1000)
}
function downloadOriginal() { if (originalBytes.value) download(originalBytes.value, `original-${originalName.value}`) }
function requestExport() {
  if (!doc.value) return
  if (modal.value === 'folder') { notify('notice.folderBeforeExport'); return }
  if (draftDirty.value) { notify('notice.itemBeforeExport'); return }
  modal.value = 'export'
}
function exportVault() {
  if (!doc.value || errorCount.value) return
  try {
    download(serializeVault(doc.value), `bitwarden-cleaned-${new Date().toISOString().slice(0, 10)}.json`)
    markExported()
    modal.value = null
    notify('notice.download')
  } catch { notify('notice.downloadFailed') }
}
function run(description: Message, operation: (document: VaultExport) => void, clearEditor = false) {
  if (!discardDraft()) return false
  try {
    commit(description, operation)
    if (clearEditor) current.value = null
    return true
  } catch (e) { notify(errorMessage(e, 'errors.apply')); return false }
}
function saveItem(item: VaultItem, description: Message) {
  if (current.value === null) return
  try {
    commit(description, document => replaceItem(document, current.value!, item))
    draftDirty.value = false
    notify('notice.applied')
  } catch { notify('notice.applyFailed') }
}
function toggleSelected(index: number) { selected.value = selected.value.includes(index) ? selected.value.filter(i => i !== index) : [...selected.value, index] }
function toggleAll() { selected.value = allSelected.value ? [] : filtered.value.map(row => row.index) }
function bulkMove(event: Event) {
  const destination = (event.target as HTMLSelectElement).value
  if (destination === '__choose') return
  run({ key: 'audit.bulkMove', params: { count: selected.value.length } }, document => moveItems(document, selected.value, destination || null))
  ;(event.target as HTMLSelectElement).value = '__choose'
}
function bulkFavorite(value: boolean) { run({ key: value ? 'audit.bulkFavorite' : 'audit.bulkUnfavorite', params: { count: selected.value.length } }, document => { for (const index of selected.value) items(document)[index]!.favorite = value }) }
function removeItems(indexes: number[]) {
  if (!indexes.length || !window.confirm(t('confirm.delete', { count: indexes.length }, indexes.length))) return
  if (run({ key: 'audit.deleted', params: { count: indexes.length } }, document => deleteItems(document, indexes), true)) selected.value = []
}
function historyAction(action: 'undo' | 'redo') { if (discardDraft()) { if (action === 'undo') undo(); else redo(); current.value = null; selected.value = [] } }
function manageFolders() { if (discardDraft()) modal.value = 'folders' }
function folderDialog(action: typeof folderAction.value, id = '', parent = '', name = '') {
  if (!discardDraft()) return
  if (folderDraftDirty.value && !window.confirm(t('confirm.discardFolder'))) return
  returnToFolders.value = modal.value === 'folders' || (modal.value === 'folder' && returnToFolders.value)
  const path = text(allFolders.value.find(f => f.id === id)?.name)
  folderAction.value = action
  activeFolder.value = id
  folderLabel.value = action === 'create' ? name : folderLeaf(path)
  parentFolderPath.value = action === 'create' ? parent : folderParent(path)
  folderDestination.value = ''
  includeSubfolders.value = false
  folderError.value = null
  modal.value = 'folder'
}
function finishFolderDialog() {
  modal.value = returnToFolders.value ? 'folders' : null
  folderLabel.value = parentFolderPath.value = folderDestination.value = activeFolder.value = ''
  folderError.value = null
  includeSubfolders.value = false
}
function closeFolderDialog() {
  if (folderDraftDirty.value && !window.confirm(t('confirm.discardFolder'))) return
  finishFolderDialog()
}
function submitFolder() {
  try {
    const action = folderAction.value
    const removedIds = affectedFolderIds.value
    commit({ key: `audit.${action}` }, document => {
      if (action === 'create') createFolder(document, folderLabel.value, parentFolderPath.value)
      if (action === 'rename') renameFolder(document, activeFolder.value, folderLabel.value, parentFolderPath.value)
      if (action === 'move') moveFolder(document, activeFolder.value, parentFolderPath.value)
      if (action === 'delete') deleteFolder(document, activeFolder.value, folderDestination.value || null, includeSubfolders.value)
      if (action === 'merge') mergeFolders(document, activeFolder.value, folderDestination.value, includeSubfolders.value)
    })
    if (['delete', 'merge'].includes(action) && removedIds.has(folderFilter.value)) folderFilter.value = 'all'
    finishFolderDialog()
  } catch (e) { folderError.value = errorMessage(e, 'errors.folder') }
}
function username(item: VaultItem) {
  const value = text(login(item).username)
  return value ? privacy.value ? maskUsername(value) : value : t('common.dash')
}
function firstUri(item: VaultItem) { const first = uris(item).find(u => isObject(u) && text(u.uri)); return isObject(first) ? text(first.uri) : '' }
function beforeUnload(event: BeforeUnloadEvent) { if (dirty.value || draftDirty.value || folderDraftDirty.value) { event.preventDefault(); event.returnValue = '' } }
function shortcuts(event: KeyboardEvent) {
  if (!doc.value || importing.value) return
  const target = event.target as HTMLElement
  const editing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable
  if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 's') { event.preventDefault(); requestExport(); return }
  if (modal.value) return
  if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'k') { event.preventDefault(); view.value = 'all'; nextTick(() => searchInput.value?.focus()); return }
  if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'z' && !editing) { event.preventDefault(); historyAction(event.shiftKey ? 'redo' : 'undo'); return }
  if (event.key === 'Delete' && !editing) { event.preventDefault(); removeItems(selected.value.length ? [...selected.value] : current.value === null ? [] : [current.value]); return }
  if (event.key === 'Escape' && target.tagName !== 'SELECT') closeEditor()
}
onMounted(() => { window.addEventListener('beforeunload', beforeUnload); window.addEventListener('keydown', shortcuts) })
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnload)
  window.removeEventListener('keydown', shortcuts)
  reader?.abort()
  if (noticeTimer) clearTimeout(noticeTimer)
  for (const url of objectUrls) URL.revokeObjectURL(url)
  close()
})
</script>

<template>
  <div class="app-shell" :class="{ 'vault-open': doc }">
    <input ref="fileInput" type="file" accept=".json,application/json" class="sr-only" :aria-label="t('import.selectFile')" @change="importFile" />
    <header class="app-header">
      <a class="brand" href="#" :aria-label="t('app.home')" @click.prevent="doc ? changeView('all') : undefined"><img class="brand-mark" :src="vaultsortLogo" width="32" height="38" alt="" /><bdi>{{ t('app.name') }}</bdi><span class="brand-label">{{ t('app.tagline') }}</span></a>
      <div class="header-actions">
        <span class="local-status"><span class="status-dot" />{{ t('app.local') }}<span class="status-detail">{{ t('common.dot') }} {{ t('app.device') }}</span></span>
        <label class="preference-control"><span class="sr-only">{{ t('app.language') }}</span><select :value="locale" :aria-label="t('app.language')" @change="setLanguage(($event.target as HTMLSelectElement).value)"><option v-for="language in languages" :key="language.code" :value="language.code" :lang="language.code">{{ t(`app.${language.code}`) }}</option></select></label>
        <label class="preference-control"><span class="sr-only">{{ t('app.theme') }}</span><select :value="theme" :aria-label="t('app.theme')" @change="setTheme(($event.target as HTMLSelectElement).value)"><option value="light">{{ t('app.light') }}</option><option value="dark">{{ t('app.dark') }}</option></select></label>
        <button class="icon-button help-button" :aria-label="t('app.help')" @click="modal = 'help'">{{ t('app.helpSymbol') }}</button>
      </div>
    </header>

    <main v-if="!doc" class="import-page">
      <section class="import-hero"><div class="release-label"><span class="status-dot" />{{ t('import.private') }}<span class="release-divider" />{{ t('import.browser') }}</div><h1>{{ t('import.title') }}<br /><span>{{ t('import.subtitle') }}</span></h1><p class="hero-description">{{ t('import.description') }}</p><div class="hero-features"><span><Icon name="folder" :size="16" />{{ t('import.organize') }}</span><span><Icon name="review" :size="16" />{{ t('import.duplicates') }}</span><span><Icon name="undo" :size="16" />{{ t('import.undo') }}</span></div></section>
      <section class="import-card" aria-labelledby="import-title"><div class="import-card-top"><span class="upload-icon"><Icon name="upload" :size="28" /></span><span class="file-tag" dir="ltr">{{ t('common.json') }}</span></div><h2 id="import-title">{{ t('import.start') }}</h2><p>{{ t('import.open') }}</p><button class="button primary import-button" :disabled="importing" @click="chooseFile"><Icon name="plus" :size="18" />{{ t(importing ? 'import.reading' : 'import.select') }}<Icon name="arrow" :size="18" /></button><p class="file-hint">{{ t('import.original') }}</p><div class="import-warning"><Icon name="lock" :size="18" /><p>{{ t('import.plaintext') }}</p></div><p v-if="importError" role="alert" class="error-message">{{ translate(importError) }}</p></section>
      <section class="how-it-works"><div class="how-heading"><span class="eyebrow">{{ t('import.steps') }}</span><span class="muted text-xs">{{ t('import.noSetup') }}</span></div><div class="steps"><article v-for="step in 3" :key="step"><span class="step-number">{{ number(step) }}</span><div><h3>{{ t(`import.step${step}`) }}</h3><p>{{ t(`import.step${step}Text`) }}</p></div></article></div></section>
      <footer class="import-footer"><span><Icon name="shield" :size="15" />{{ t('import.footer') }}</span><span>{{ t('import.peace') }}</span></footer>
    </main>

    <template v-else>
      <div class="vault-toolbar" :inert="importing"><div class="vault-file"><span class="file-icon"><Icon name="file" :size="20" /></span><div><strong><bdi>{{ originalName }}</bdi></strong><span>{{ t('common.items', { count: number(allItems.length) }) }}<span class="dot-separator">{{ t('common.dot') }}</span>{{ t('common.folders', { count: number(allFolders.length) }) }}<span class="dot-separator">{{ t('common.dot') }}</span><span :class="dirty || draftDirty ? 'unsaved' : 'muted'">{{ t(dirty || draftDirty ? 'workspace.unsaved' : 'workspace.memory') }}</span></span></div></div><div class="toolbar-actions"><button class="privacy-toggle" :class="{ enabled: privacy }" :aria-pressed="privacy" @click="togglePrivacy"><Icon :name="privacy ? 'eyeOff' : 'eye'" :size="16" />{{ t('workspace.privacy') }}<span class="toggle-track"><span /></span></button><span class="toolbar-separator" /><button class="icon-button" :disabled="!canUndo" :title="t('workspace.undoTitle')" :aria-label="t('workspace.undo')" @click="historyAction('undo')"><Icon name="undo" /></button><button class="icon-button" :disabled="!canRedo" :title="t('workspace.redoTitle')" :aria-label="t('workspace.redo')" @click="historyAction('redo')"><Icon name="redo" /></button><button class="changes-button" @click="modal = 'changes'"><span :class="['change-dot', { changed: changes.length }]" />{{ t('workspace.changes', { count: number(changes.length) }) }}</button><button class="button primary small" @click="requestExport"><Icon name="download" :size="16" />{{ t('workspace.export') }}</button></div></div>
      <div class="plaintext-banner"><Icon name="lock" :size="13" /><span>{{ t('import.plaintext') }}</span><button @click="downloadOriginal">{{ t('workspace.original') }}<Icon name="download" :size="12" /></button></div>
      <div class="workspace" :inert="importing">
        <aside class="sidebar"><div class="sidebar-scroll"><span class="section-label">{{ t('nav.vault') }}</span><nav class="vault-nav" :aria-label="t('nav.navigation')"><button v-for="entry in nav" :key="entry.id" :class="{ active: view === entry.id && folderFilter === 'all' }" :aria-current="view === entry.id && folderFilter === 'all' ? 'page' : undefined" @click="changeView(entry.id)"><Icon :name="entry.icon" :size="17" /><span>{{ t(entry.label) }}</span><span class="nav-count">{{ number(allItems.filter(i => entry.id === 'all' || (entry.id === 'favorites' ? i.favorite === true : entry.id === 'unassigned' ? !i.folderId : i.type === Number(entry.id))).length) }}</span></button></nav>
          <div class="folder-heading"><span class="section-label">{{ t('nav.folders') }}</span><button class="text-button" :aria-label="t('folder.manage')" @click="manageFolders">{{ t('folder.manageShort') }}</button><button class="icon-button" :aria-label="t('folder.create')" @click="folderDialog('create')"><Icon name="plus" :size="15" /></button></div>
          <nav class="folder-nav" :aria-label="t('nav.folders')">
            <div v-for="(row, index) in folderRows" :key="index" :class="['folder-entry', { active: row.id && folderFilter === row.id, 'virtual-folder': row.index === null }]" :style="{ paddingInlineStart: `${Math.min(row.depth, 6) * 10}px` }">
              <span v-if="row.index === null" class="folder-select" :title="t('folder.groupTitle', { path: row.path })"><Icon name="folder" :size="16" /><span><bdi>{{ row.label }}</bdi></span></span>
              <button v-else class="folder-select" :title="row.path" :aria-current="row.id && folderFilter === row.id ? 'page' : undefined" @click="changeView('all', row.id || 'all')"><Icon name="folder" :size="16" /><span><bdi>{{ row.label }}</bdi></span><span class="nav-count">{{ number(folderCounts.get(row.id) || 0) }}</span></button>
              <button v-if="row.index !== null" class="folder-menu" :aria-label="t('folder.manageNumber', { index: row.index + 1 })" @click="folderDialog('rename', row.id)"><Icon name="more" :size="15" /></button>
            </div>
            <button class="new-folder" @click="folderDialog('create')"><Icon name="plus" :size="16" />{{ t('folder.new') }}</button>
          </nav>
          <div class="sidebar-divider" /><button class="review-nav" :class="{ active: view === 'review' }" :aria-current="view === 'review' ? 'page' : undefined" @click="changeView('review')"><Icon name="review" :size="18" /><span>{{ t('nav.review') }}</span><span v-if="issues.length" class="review-count">{{ number(issues.length) }}</span></button>
        </div><footer class="sidebar-footer"><button @click="chooseFile"><Icon name="upload" :size="16" />{{ t('nav.open') }}</button><button @click="closeVault"><Icon name="logout" :size="16" />{{ t('nav.close') }}</button><div><span class="status-dot" />{{ t('nav.memory') }}</div></footer></aside>
        <ReviewPanel v-if="view === 'review'" :document="doc" @select="selectItem" />
        <section v-else class="items-panel" :aria-label="t('workspace.items')"><div class="panel-heading"><div><span class="eyebrow">{{ t('workspace.eyebrow') }}</span><h1><bdi>{{ heading }}</bdi><span class="heading-count">{{ number(filtered.length) }}</span></h1><p class="muted">{{ t('workspace.description') }}</p></div><span class="heading-icon"><Icon :name="folderFilter === 'all' ? nav.find(n => n.id === view)?.icon || 'grid' : 'folder'" :size="24" /></span></div>
          <div class="search-toolbar"><label class="search-wrap"><Icon name="search" :size="18" /><input ref="searchInput" v-model="query" :aria-label="t('workspace.search')" :placeholder="t('workspace.searchPlaceholder')" autocomplete="off" spellcheck="false" /><kbd>{{ t('help.searchKey') }}</kbd><button v-if="query" class="icon-button" :aria-label="t('workspace.clearSearch')" @click="query = ''"><Icon name="close" :size="14" /></button></label><button class="button filter-button" :class="{ 'filter-active': showFilters || activeFilters }" :aria-label="t('workspace.filters')" :aria-expanded="showFilters" @click="showFilters = !showFilters"><Icon name="filter" :size="16" />{{ t('workspace.filters') }}<span v-if="activeFilters" class="count-pill">{{ number(activeFilters) }}</span></button></div>
          <div v-if="showFilters" class="filters">
            <label>{{ t('workspace.folder') }}<select v-model="folderFilter"><option value="all">{{ t('workspace.allFolders') }}</option><option value="__unassigned">{{ t('common.unassigned') }}</option><option v-for="(folder, i) in allFolders" :key="i" :value="folder.id" :disabled="!folder.id">{{ folder.name }}</option></select></label>
            <label>{{ t('workspace.type') }}<select v-model="typeFilter"><option value="all">{{ t('workspace.allTypes') }}</option><option v-for="type in 4" :key="type" :value="String(type)">{{ typeName(type) }}</option><option value="other">{{ t('workspace.unsupported') }}</option></select></label>
            <label>{{ t('workspace.organization') }}<select v-model="organizationFilter"><option value="all">{{ t('workspace.allOwnership') }}</option><option value="__personal">{{ t('common.personal') }}</option><option v-for="id in organizations" :key="id" :value="id">{{ organizationName(doc, id) }}</option></select></label>
            <label>{{ t('workspace.inspect') }}<select v-model="qualityFilter"><option value="all">{{ t('workspace.allItems') }}</option><option value="favorites">{{ t('nav.favorites') }}</option><option value="no-username">{{ t('workspace.noUsername') }}</option><option value="no-uri">{{ t('workspace.noUri') }}</option><option value="warnings">{{ t('workspace.withIssues') }}</option><option v-for="(label, kind) in duplicateLabel" :key="kind" :value="kind">{{ t('workspace.duplicate', { rule: t(label) }) }}</option></select></label>
            <button class="text-button" @click="typeFilter = organizationFilter = qualityFilter = folderFilter = 'all'">{{ t('workspace.clearFilters') }}</button>
          </div>
          <div v-if="selected.length" class="bulk-toolbar"><strong>{{ t('workspace.selected', { count: number(selected.length) }) }}</strong><select :aria-label="t('workspace.moveSelected')" value="__choose" @change="bulkMove"><option value="__choose" disabled>{{ t('workspace.moveTo') }}</option><option value="">{{ t('common.unassigned') }}</option><option v-for="(folder, i) in allFolders" :key="i" :value="folder.id" :disabled="!folder.id">{{ folder.name }}</option></select><button class="icon-button" :aria-label="t('workspace.favoriteSelected')" @click="bulkFavorite(true)"><Icon name="star" :size="16" /></button><button class="icon-button" :aria-label="t('workspace.removeFavoriteSelected')" @click="bulkFavorite(false)"><Icon name="star" :size="16" /><span class="mini-minus">{{ t('workspace.minus') }}</span></button><button class="icon-button danger" :aria-label="t('workspace.deleteSelected')" @click="removeItems([...selected])"><Icon name="trash" :size="16" /></button><button class="icon-button" :aria-label="t('workspace.clearSelection')" @click="selected = []"><Icon name="close" :size="15" /></button></div>
          <div class="table-scroll">
            <table class="item-table">
              <thead><tr>
                <th class="select-col"><input type="checkbox" :aria-label="t('workspace.selectAll')" :checked="allSelected" :indeterminate="selected.length > 0 && !allSelected" @change="toggleAll" /></th>
                <th class="star-col"><span class="sr-only">{{ t('workspace.favorite') }}</span></th>
                <th>{{ t('workspace.nameColumn') }}</th><th>{{ t('workspace.usernameColumn') }}</th><th>{{ t('workspace.typeColumn') }}</th><th>{{ t('workspace.folderColumn') }}</th>
                <th v-if="!privacy">{{ t('workspace.uriColumn') }}</th><th v-if="!privacy">{{ t('workspace.organizationColumn') }}</th>
                <th class="warning-col"><span class="sr-only">{{ t('workspace.warningsColumn') }}</span></th>
              </tr></thead>
              <tbody>
                <tr v-for="{ item, index } in visible" :key="index" :class="{ 'row-active': current === index, 'row-checked': selectedSet.has(index) }" @click="selectItem(index)">
                  <td @click.stop><input type="checkbox" :aria-label="t('workspace.selectItem', { index: index + 1 })" :checked="selectedSet.has(index)" @change="toggleSelected(index)" /></td>
                  <td @click.stop><button :class="['star-button', { starred: item.favorite === true }]" :aria-label="t(item.favorite ? 'workspace.unfavoriteItem' : 'workspace.favoriteItem', { index: index + 1 })" @click="run({ key: 'audit.favorite', params: { index: index + 1 } }, document => { items(document)[index]!.favorite = !item.favorite })"><Icon name="star" :size="15" /></button></td>
                  <td class="name-cell"><button :aria-current="current === index ? 'true' : undefined" @click.stop="selectItem(index)">
                    <span :class="['item-avatar', `type-${typeof item.type === 'number' ? item.type : 0}`]"><Icon :name="item.type === 1 ? 'key' : item.type === 2 ? 'note' : item.type === 3 ? 'card' : 'user'" :size="17" /></span>
                    <span><bdi>{{ text(item.name) || t('common.untitled') }}</bdi></span><Icon v-if="item.organizationId" name="lock" :size="11" />
                  </button></td>
                  <td class="username-cell"><bdi>{{ username(item) }}</bdi></td>
                  <td><span class="type-badge">{{ typeName(item.type) }}</span></td>
                  <td class="folder-cell"><span><Icon name="folder" :size="12" /><bdi>{{ folderName(doc, item.folderId) }}</bdi></span></td>
                  <td v-if="!privacy" class="uri-cell" :title="firstUri(item)"><bdi dir="ltr">{{ domain(firstUri(item)) || firstUri(item) || t('common.dash') }}</bdi></td>
                  <td v-if="!privacy" class="organization-cell"><bdi>{{ organizationName(doc, item.organizationId) }}</bdi></td>
                  <td><button v-if="warningItems.has(index)" class="warning-indicator" :aria-label="t('workspace.itemIssues', { index: index + 1 })" :title="t('workspace.issuesTitle')" @click.stop="changeView('review'); selectItem(index)"><Icon name="warning" :size="15" /></button></td>
                </tr>
              </tbody>
            </table>
            <div v-if="!filtered.length" class="empty-state">
              <span class="empty-icon"><Icon :name="query ? 'search' : 'folder'" :size="28" /></span>
              <h3>{{ t(query || activeFilters ? 'workspace.noMatches' : 'workspace.empty') }}</h3>
              <p>{{ t(query || activeFilters ? 'workspace.trySearch' : 'workspace.tryFolder') }}</p>
              <button v-if="query || activeFilters" class="button small" @click="query = ''; typeFilter = organizationFilter = qualityFilter = 'all'">{{ t('workspace.clearAll') }}</button>
            </div>
          </div>
          <footer class="list-footer"><span>{{ t('workspace.range', { start: number(filtered.length ? (page - 1) * pageSize + 1 : 0), end: number(Math.min(page * pageSize, filtered.length)), total: number(filtered.length) }) }}</span><div v-if="pages > 1" class="pagination"><button class="icon-button" :aria-label="t('workspace.previous')" :disabled="page === 1" @click="page--"><Icon name="chevron" class="rotate-180" :size="14" /></button><span>{{ t('workspace.page', { current: number(page), total: number(pages) }) }}</span><button class="icon-button" :aria-label="t('workspace.next')" :disabled="page === pages" @click="page++"><Icon name="chevron" :size="14" /></button></div><span v-else><Icon name="lock" :size="12" />{{ t(privacy ? 'workspace.privacyOn' : 'workspace.local') }}</span></footer>
        </section>
        <ItemEditor v-if="currentItem && current !== null" :key="`${current}-${editorVersion}`" :item="currentItem" :index="current" :document="doc" :privacy="privacy" @save="saveItem" @dirty="draftDirty = $event" @close="closeEditor" @notice="notify" />
        <aside v-else class="editor-empty"><span class="eyebrow">{{ t('editor.title') }}</span><div><span class="editor-empty-icon"><Icon name="key" :size="27" /></span><h3>{{ t('workspace.closer') }}</h3><p>{{ t('workspace.selectDetails') }}</p><span class="editor-empty-hint"><Icon name="eyeOff" :size="13" />{{ t('workspace.hidden') }}</span></div><footer><Icon name="shield" :size="14" />{{ t('workspace.device') }}</footer></aside>
      </div>
      <p v-if="importError" role="alert" class="floating-error">{{ translate(importError) }}<button class="icon-button" :aria-label="t('common.dismissError')" @click="importError = null"><Icon name="close" :size="14" /></button></p>
    </template>
    <div v-if="notice || importing" class="toast" role="status"><Icon :name="importing ? 'file' : 'check'" :size="17" /><span>{{ importing ? t('import.readingLocal') : notice ? translate(notice) : '' }}</span><button v-if="!importing" class="icon-button" :aria-label="t('common.dismiss')" @click="notice = null"><Icon name="close" :size="15" /></button></div>

    <Modal v-if="modal === 'summary'" :title="t('import.ready')" @close="modal = null"><span class="summary-icon"><Icon name="check" :size="26" /></span><i18n-t keypath="import.readyText" tag="p" class="modal-description" scope="global"><template #name><bdi>{{ originalName }}</bdi></template></i18n-t><div class="summary-grid"><div v-for="entry in summary" :key="entry.label"><strong>{{ number(entry.value) }}</strong><span>{{ t(entry.label) }}</span></div></div><p class="inline-warning"><Icon name="lock" :size="16" />{{ t('import.secrets') }}</p><template #footer><button class="button" @click="downloadOriginal"><Icon name="download" :size="16" />{{ t('import.copy') }}</button><button class="button primary" @click="modal = null">{{ t('import.begin') }}<Icon name="arrow" :size="16" /></button></template></Modal>
    <Modal v-if="modal === 'folders'" :title="t('folder.manage')" wide @close="modal = null">
      <p class="modal-description">{{ t('folder.description') }}</p>
      <div class="folder-manager-toolbar"><span>{{ t('common.folders', { count: number(allFolders.length) }) }}<span class="dot-separator">{{ t('common.dot') }}</span>{{ t('folder.counts') }}</span><button class="button primary small" @click="folderDialog('create')"><Icon name="plus" :size="15" />{{ t('folder.new') }}</button></div>
      <div class="folder-manager-list">
        <div v-for="(row, index) in folderRows" :key="index" class="folder-manager-row">
          <div class="folder-manager-name" :style="{ paddingInlineStart: `${Math.min(row.depth, 6) * 12}px` }"><Icon name="folder" :size="17" /><div><strong><bdi>{{ row.label }}</bdi></strong><span><bdi>{{ row.path || t('common.unnamedFolder') }}</bdi><span v-if="row.index === null">{{ t('common.dot') }} {{ t('folder.grouping') }}</span><span v-else>{{ t('common.dot') }} {{ t('common.items', { count: number(folderCounts.get(row.id) || 0) }) }}</span></span></div></div>
          <button v-if="row.index === null" class="text-button" :aria-label="t('folder.createGroup', { index: index + 1 })" @click="folderDialog('create', '', folderParent(row.path), folderLeaf(row.path))"><Icon name="plus" :size="14" />{{ t('folder.create') }}</button>
          <div v-else class="folder-manager-actions">
            <button class="text-button" :aria-label="t('folder.editNumber', { index: row.index + 1 })" :disabled="!row.id" @click="folderDialog('rename', row.id)">{{ t('common.edit') }}</button>
            <button class="text-button" :aria-label="t('folder.moveNumber', { index: row.index + 1 })" :disabled="!row.id" @click="folderDialog('move', row.id)">{{ t('common.move') }}</button>
            <button class="icon-button" :aria-label="t('folder.subfolderNumber', { index: row.index + 1 })" :title="t('folder.subfolder')" :disabled="!row.path" @click="folderDialog('create', '', row.path)"><Icon name="plus" :size="16" /></button>
            <button class="icon-button danger" :aria-label="t('folder.deleteNumber', { index: row.index + 1 })" :title="t('folder.deleteSafely')" :disabled="!row.id" @click="folderDialog('delete', row.id)"><Icon name="trash" :size="15" /></button>
          </div>
        </div>
        <div v-if="!folderRows.length" class="empty-state"><Icon name="folder" :size="28" /><h3>{{ t('folder.none') }}</h3><p>{{ t('folder.first') }}</p></div>
      </div>
      <p class="hint">{{ t('folder.nesting') }}</p>
      <template #footer><button class="button" @click="modal = null">{{ t('common.done') }}</button></template>
    </Modal>
    <Modal v-if="modal === 'folder'" :title="t(folderAction === 'create' ? 'folder.createTitle' : folderAction === 'rename' ? 'folder.edit' : `folder.${folderAction}`)" @close="closeFolderDialog">
      <form id="folder-form" autocomplete="off" @submit.prevent="submitFolder">
        <template v-if="['create', 'rename', 'move'].includes(folderAction)">
          <label class="field-label">{{ t('folder.name') }}<input v-model="folderLabel" dir="auto" :readonly="folderAction === 'move'" autofocus required maxlength="500" /></label>
          <label class="field-label">{{ t(folderAction === 'move' ? 'folder.moveUnder' : 'folder.parent') }}<select v-model="parentFolderPath" :aria-label="t('folder.parent')"><option value="">{{ t('folder.top') }}</option><option v-for="path in parentPaths" :key="path" :value="path">{{ path }}</option></select></label>
          <p class="folder-path-preview">{{ t('folder.path') }}<code><bdi>{{ folderTarget || t('folder.enterName') }}</bdi></code></p>
          <p class="hint">{{ folderAction === 'create' ? t('folder.createHint') : t('folder.moveHint', { count: number(subfolderCount) }) }}</p>
        </template>
        <template v-else>
          <p class="modal-description"><strong><bdi>{{ activeFolderPath || t('common.unnamedFolder') }}</bdi></strong><br />{{ t(folderAction === 'merge' ? 'folder.mergeText' : 'folder.deleteText') }}</p>
          <label v-if="subfolderCount" class="checkbox-label"><input v-model="includeSubfolders" type="checkbox" />{{ t('folder.include', { count: number(subfolderCount) }) }}</label>
          <p v-if="subfolderCount" class="hint">{{ t(includeSubfolders ? 'folder.removeBranch' : 'folder.keepBranch') }}</p>
          <p class="folder-impact">{{ t('folder.removed', { count: number(affectedFolderIds.size) }, affectedFolderIds.size) }}<span class="dot-separator">{{ t('common.dot') }}</span>{{ t('folder.reassigned', { count: number(affectedItemCount) }) }}<span class="dot-separator">{{ t('common.dot') }}</span>{{ t('folder.noDeletion') }}</p>
          <label class="field-label">{{ t('folder.destination') }}<select v-model="folderDestination" :aria-label="t('folder.destinationLabel')" :required="folderAction === 'merge'"><option value="" :disabled="folderAction === 'merge'">{{ t(folderAction === 'merge' ? 'folder.choose' : 'folder.default') }}</option><option v-for="(folder, i) in destinationFolders" :key="i" :value="folder.id" :disabled="!folder.id">{{ folder.name }}</option></select></label>
        </template>
        <div v-if="folderAction === 'rename'" class="folder-extra-actions">
          <button type="button" class="text-button" @click="folderDialog('create', '', activeFolderPath)"><Icon name="plus" :size="15" />{{ t('folder.subfolder') }}</button>
          <button type="button" class="text-button" @click="folderDialog('merge', activeFolder)"><Icon name="folder" :size="15" />{{ t('folder.mergeInto') }}</button>
          <button type="button" class="text-button danger" @click="folderDialog('delete', activeFolder)"><Icon name="trash" :size="15" />{{ t('folder.delete') }}</button>
        </div>
        <p v-if="folderError" class="error-message" role="alert">{{ translate(folderError) }}</p>
      </form>
      <template #footer><button class="button" @click="closeFolderDialog">{{ t('common.cancel') }}</button><button class="button" :class="folderAction === 'delete' ? 'destructive' : 'primary'" type="submit" form="folder-form">{{ t(folderAction === 'create' ? 'folder.create' : folderAction === 'rename' ? 'folder.save' : folderAction === 'move' ? 'folder.move' : folderAction === 'merge' ? 'folder.mergeSubmit' : 'folder.deleteSubmit') }}</button></template>
    </Modal>
    <Modal v-if="modal === 'export'" :title="t('export.title')" wide @close="modal = null">
      <p class="modal-description">{{ t('export.description') }}</p>
      <div class="validation-summary"><span :class="errorCount ? 'error-badge' : 'success-badge'"><Icon :name="errorCount ? 'warning' : 'check'" :size="16" />{{ t('common.errors', { count: number(errorCount) }) }}</span><span class="warning-badge">{{ t('common.warnings', { count: number(issues.length - errorCount) }) }}</span></div>
      <div class="export-issues"><div v-for="(issue, index) in issues.slice(0, 100)" :key="index" :class="['issue-row', issue.severity]"><Icon name="warning" :size="15" /><div><p>{{ t(issue.message) }}</p><button v-if="issue.itemIndex !== undefined" class="text-button" @click="modal = null; selectItem(issue.itemIndex)">{{ t('common.inspectItem', { index: issue.itemIndex + 1 }) }}</button><span v-else-if="issue.folderIndex !== undefined" class="muted text-xs">{{ t('common.folderNumber', { index: issue.folderIndex + 1 }) }}</span></div></div><p v-if="issues.length > 100" class="hint">{{ t('export.more', { count: number(issues.length - 100) }) }}</p><p v-if="!issues.length" class="success-message">{{ t('export.ready') }}</p></div>
      <p class="hint">{{ t(errorCount ? 'export.repair' : 'export.warning') }}</p><template #footer><button class="button" @click="modal = null">{{ t('export.keep') }}</button><button class="button primary" :disabled="!!errorCount" @click="exportVault"><Icon name="download" :size="16" />{{ t('export.download') }}</button></template>
    </Modal>
    <Modal v-if="modal === 'changes'" :title="t('audit.title')" @close="modal = null"><p class="modal-description">{{ t('audit.description') }}</p><ol v-if="changes.length" class="change-list"><li v-for="(change, index) in changes" :key="index"><span>{{ number(index + 1) }}</span>{{ translate(change) }}</li></ol><div v-else class="empty-state"><Icon name="review" :size="28" /><h3>{{ t('audit.empty') }}</h3><p>{{ t('audit.unchanged') }}</p></div><p class="hint">{{ t('audit.hint') }}</p></Modal>
    <Modal v-if="modal === 'help'" :title="t('help.title')" @close="modal = null"><p class="modal-description">{{ t('help.description') }}</p><p class="hint">{{ t('help.saving') }}</p><div class="shortcut-list"><div><span>{{ t('help.search') }}</span><kbd>{{ t('help.searchKey') }}</kbd></div><div><span>{{ t('help.export') }}</span><kbd>{{ t('help.exportKey') }}</kbd></div><div><span>{{ t('help.history') }}</span><kbd>{{ t('help.redoKey') }}</kbd><kbd>{{ t('help.undoKey') }}</kbd></div><div><span>{{ t('help.delete') }}</span><kbd>{{ t('help.deleteKey') }}</kbd></div><div><span>{{ t('help.close') }}</span><kbd>{{ t('help.escapeKey') }}</kbd></div></div><p class="hint">{{ t('help.privacy') }}</p></Modal>
  </div>
</template>
