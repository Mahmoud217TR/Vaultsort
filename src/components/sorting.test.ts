import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import App from '../App.vue'
import ItemEditor from './ItemEditor.vue'
import { i18n } from '../i18n'
import { setLanguage, setTheme } from '../preferences'
import { type VaultExport } from '../domain/vault'

let wrapper: VueWrapper
const NativeFileReader = FileReader
beforeEach(() => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
})
afterEach(() => { wrapper?.unmount(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

async function openVault(source: VaultExport, replace = false) {
  const encoded = new TextEncoder().encode(JSON.stringify(source))
  const bytes = new ArrayBuffer(encoded.length)
  new Uint8Array(bytes).set(encoded)
  class Reader {
    result = bytes
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    readAsArrayBuffer() { queueMicrotask(() => this.onload?.()) }
    abort() {}
  }
  vi.stubGlobal('FileReader', Reader)
  if (!replace) wrapper = mount(App, { attachTo: document.body })
  const input = wrapper.get('input[type="file"]')
  Object.defineProperty(input.element, 'files', { configurable: true, value: [new File([''], 'synthetic.json')] })
  await input.trigger('change'); await flushPromises()
  await wrapper.get('dialog .primary').trigger('click')
}
const control = (key: string) => wrapper.get(`[aria-label="${i18n.global.t(`workspace.${key}`)}"]`)
const names = () => wrapper.findAll('.name-cell bdi').map(cell => cell.text())
async function dates(value: boolean) {
  await wrapper.get('[aria-controls="vault-fields"]').trigger('click')
  await wrapper.get('.fields-panel input[data-field="created"]').setValue(value)
  await wrapper.get('.fields-panel input[data-field="modified"]').setValue(value)
}

describe('item sorting controls', () => {
  it('handles every independent column combination, preserves exports and resets on replacement/close', async () => {
    const source: VaultExport = { encrypted: false, opaque: [1, { preserved: true }], items: [{ type: 2, name: 'Zebra', notes: 'Synthetic full note', creationDate: '2026-01-01T00:00:00Z', revisionDate: 'invalid', future: { x: 7 } }, { type: 5, name: 'Alpha', sshKey: { future: true } }] }
    const downloads: Blob[] = []
    vi.stubGlobal('URL', class extends URL { static createObjectURL(blob: Blob) { downloads.push(blob); return 'blob:synthetic' } static revokeObjectURL() {} })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    await openVault(source)
    expect(wrapper.findAll('.fields-panel input')).toHaveLength(3)
    expect(wrapper.findAll('.fields-panel input').every(input => !(input.element as HTMLInputElement).checked)).toBe(true)
    const fields = ['notes', 'created', 'modified']
    for (let mask = 0; mask < 8; mask++) {
      for (const [index, field] of fields.entries()) await wrapper.get(`[data-field="${field}"]`).setValue(!!(mask & (1 << index)))
      const count = fields.filter((_, index) => mask & (1 << index)).length
      expect(wrapper.findAll('thead th')).toHaveLength(7 + count)
      expect(wrapper.findAll('tbody tr')[0]!.findAll('td')).toHaveLength(7 + count)
      expect(wrapper.get('[aria-label="Undo"]').attributes('disabled')).toBeDefined()
    }
    await control('sortBy').setValue('name')
    await control('search').setValue('Zebra')
    setLanguage('ar'); setTheme('dark'); await flushPromises()
    expect(wrapper.findAll('.fields-panel input').every(input => (input.element as HTMLInputElement).checked)).toBe(true)
    await wrapper.get('.name-cell button').trigger('click')
    expect(wrapper.getComponent(ItemEditor).props('document')).toEqual(source)
    await wrapper.get('.original-copy').trigger('click')
    await wrapper.get('.toolbar-actions .primary').trigger('click')
    await wrapper.get('dialog .primary').trigger('click')
    const contents = await Promise.all(downloads.map(blob => new Promise<string>(resolve => { const reader = new NativeFileReader(); reader.onload = () => resolve(reader.result as string); reader.readAsText(blob) })))
    expect(contents[0]).toBe(JSON.stringify(source))
    expect(JSON.parse(contents[1]!)).toEqual(source)
    await openVault({ items: [{ type: 2, name: 'Replacement' }] }, true)
    expect(wrapper.findAll('.fields-panel input').every(input => !(input.element as HTMLInputElement).checked)).toBe(true)
    await wrapper.get('[data-field="notes"]').setValue(true)
    await wrapper.findAll('.sidebar-footer button').find(button => button.text() === i18n.global.t('nav.close'))!.trigger('click')
    await openVault(source, true)
    expect(wrapper.findAll('.fields-panel input').every(input => !(input.element as HTMLInputElement).checked)).toBe(true)
  })
  it('retains SSH category/search/fields on filter reset and preserves active-zero SSH through deletion and undo', async () => {
    await openVault({ folders: [{ id: 'a', name: 'Work' }, { id: 'b', name: 'Personal' }], items: [{ type: 5, name: 'SSH Work', folderId: 'a', organizationId: 'org' }, { type: 5, name: 'SSH Personal', folderId: 'b' }, { type: 9, name: 'Other' }] })
    const ssh = () => wrapper.findAll('.vault-nav button').find(button => button.text().includes('SSH'))!
    await ssh().trigger('click')
    await control('search').setValue('SSH')
    await control('sortBy').setValue('name'); await control('sortDirection').setValue('desc')
    await wrapper.get('[data-field="notes"]').setValue(true)
    await wrapper.get('.filter-button').trigger('click')
    await wrapper.get('#vault-filters label:nth-child(2) select').setValue('5')
    await wrapper.get('#vault-filters label:nth-child(3) select').setValue('org')
    expect(names()).toEqual(['SSH Work'])
    await wrapper.get('#vault-filters .text-button').trigger('click')
    expect(names()).toEqual(['SSH Work', 'SSH Personal'])
    expect(ssh().attributes('aria-current')).toBe('page')
    expect((control('search').element as HTMLInputElement).value).toBe('SSH')
    expect((control('sortDirection').element as HTMLSelectElement).value).toBe('desc')
    expect((wrapper.get('[data-field="notes"]').element as HTMLInputElement).checked).toBe(true)
    await wrapper.get('#vault-filters label:nth-child(2) select').setValue('5')
    await wrapper.get('thead input[type=checkbox]').setValue(true)
    await control('deleteSelected').trigger('click')
    expect(names()).toEqual([])
    expect(ssh().text()).toContain('0')
    await wrapper.get('.filter-button').trigger('click')
    expect(wrapper.find('#vault-filters option[value="5"]').exists()).toBe(true)
    await wrapper.get('[aria-label="Undo"]').trigger('click')
    expect(names()).toEqual(['SSH Work', 'SSH Personal'])
    expect(ssh().text()).toContain('2')
    await openVault({ items: [{ type: 2, name: 'No SSH' }] }, true)
    expect(ssh()).toBeUndefined()
    await wrapper.get('.filter-button').trigger('click')
    expect(wrapper.find('#vault-filters option[value="5"]').exists()).toBe(false)
  })
  it('discloses one labelled panel and discovers SSH without including it in Other', async () => {
    await openVault({ folders: [{ id: 'a', name: 'Work' }, { id: 'b', name: 'Personal' }], items: [{ type: 5, name: 'SSH Work', folderId: 'a' }, { type: 5, name: 'SSH Personal', folderId: 'b' }, { type: 9, name: 'Future' }] })
    const ssh = wrapper.findAll('.vault-nav button').find(button => button.text().includes('SSH'))!
    expect(ssh).toBeDefined(); expect(ssh.text()).toContain('2')
    await ssh.trigger('click'); expect(names()).toEqual(['SSH Work', 'SSH Personal'])
    await wrapper.get('[aria-controls="vault-sort"]').trigger('click')
    await control('sortBy').setValue('name')
    expect(wrapper.get('[aria-controls="vault-sort"]').text()).toContain('Alphabetically')
    await wrapper.get('[aria-controls="vault-fields"]').trigger('click')
    expect(wrapper.get('[aria-controls="vault-sort"]').attributes('aria-expanded')).toBe('false')
    await wrapper.get('[data-field="created"]').setValue(true)
    await wrapper.get('.filter-button').trigger('click')
    await wrapper.get('#vault-filters label:nth-child(1) select').setValue('a')
    expect(names()).toEqual(['SSH Work'])
    expect(wrapper.get('.filter-button .count-pill').text()).toBe('1')
    await wrapper.get('#vault-filters .text-button').trigger('click')
    expect(names()).toEqual(['SSH Personal', 'SSH Work'])
    expect((wrapper.get('[data-field="created"]').element as HTMLInputElement).checked).toBe(true)
    expect((control('sortBy').element as HTMLSelectElement).value).toBe('name')
    await wrapper.get('.vault-nav button').trigger('click')
    await wrapper.get('.filter-button').trigger('click')
    await wrapper.get('#vault-filters label:nth-child(2) select').setValue('other')
    expect(names()).toEqual(['Future'])
  })
  it('returns compact editor focus to the list when the opener disappears', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    await openVault({ items: [{ type: 2, name: 'First' }, { type: 2, name: 'Second' }] })
    ;(wrapper.get('.name-cell button').element as HTMLButtonElement).focus()
    await wrapper.get('.name-cell button').trigger('click')
    await wrapper.get('.search-wrap input').setValue('Second')
    await wrapper.get('[aria-label="Close item editor"]').trigger('click'); await flushPromises()
    expect(document.activeElement).toBe(wrapper.get('.table-scroll').element)
  })
  it('selects fields independently without changing data or losing choices on preference changes', async () => {
    await openVault({ encrypted: false, items: [{ type: 2, name: 'Note', notes: 'Synthetic secret', creationDate: '2026-01-01T00:00:00Z', revisionDate: 'invalid', opaque: [42] }] })
    expect(wrapper.findAll('.fields-panel input').every(input => !(input.element as HTMLInputElement).checked)).toBe(true)
    await wrapper.get('[aria-controls="vault-fields"]').trigger('click')
    await wrapper.get('[data-field="created"]').setValue(true)
    expect(wrapper.findAll('.date-cell')).toHaveLength(1)
    expect(wrapper.findAll('.fields-panel input').filter(input => (input.element as HTMLInputElement).checked)).toHaveLength(1)
    setLanguage('ar'); setTheme('dark'); await flushPromises()
    expect((wrapper.get('[data-field="created"]').element as HTMLInputElement).checked).toBe(true)
    await wrapper.get('.name-cell button').trigger('click')
    expect(wrapper.getComponent(ItemEditor).props('document').items![0]!.opaque).toEqual([42])
    expect(wrapper.get('.changes-button').text()).toContain('0')
  })
  it('keeps the table keyboard-scrollable and restores focus after compact editing', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    await openVault({ encrypted: false, items: [{ type: 2, name: 'Synthetic note' }] })
    expect(wrapper.get('input[type="file"]').attributes('tabindex')).toBe('-1')
    expect(wrapper.get('.table-scroll').attributes()).toMatchObject({ tabindex: '0', role: 'region', 'aria-label': 'Vault items' })
    expect(wrapper.findAll('.item-table th').every(header => header.attributes('scope') === 'col')).toBe(true)
    await control('filters').trigger('click')
    expect(control('filters').attributes('aria-controls')).toBe(wrapper.get('.filters').attributes('id'))
    const trigger = wrapper.get('.name-cell button')
    ;(trigger.element as HTMLButtonElement).focus()
    await trigger.trigger('click')
    expect(document.activeElement).toBe(wrapper.get('.item-editor').element)
    expect(wrapper.get('.item-editor').attributes('aria-label')).toBe('Item editor')
    await wrapper.get('.editor-header button').trigger('click')
    expect(document.activeElement).toBe(trigger.element)
    await wrapper.get('.folder-heading .text-button').trigger('click')
    const dialog = wrapper.get('dialog').element as HTMLDialogElement
    dialog.close = vi.fn()
    await wrapper.get('.modal-header button').trigger('click')
    expect(dialog.close).toHaveBeenCalledOnce()
  })

  it.each([['en', 'light'], ['en', 'dark'], ['ar', 'light'], ['ar', 'dark']])('sorts and filters without changing the vault in %s / %s', async (language, theme) => {
    setLanguage(language); setTheme(theme)
    const source: VaultExport = { encrypted: false, items: [
      { id: 'same', type: 2, name: 'Zebra', creationDate: '2026-01-01T00:00:00Z', revisionDate: '2026-03-01T00:00:00Z' },
      { id: 'same', type: 2, name: 'Alpha', creationDate: '2026-02-01T00:00:00Z', revisionDate: '2026-01-01T00:00:00Z' },
      { type: 2, name: 'Beta', revisionDate: 'invalid', creationDate: { toString: 'invalid' } },
    ] }
    await openVault(source)
    expect(wrapper.find('.date-cell').exists()).toBe(false)
    await dates(true)
    const format = (date: string) => new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(Date.parse(date))
    expect(wrapper.findAll('.date-cell').map(cell => cell.text())).toEqual([
      format('2026-01-01T00:00:00Z'), format('2026-03-01T00:00:00Z'),
      format('2026-02-01T00:00:00Z'), format('2026-01-01T00:00:00Z'), '—', '—',
    ])
    expect(wrapper.get('.item-table thead').text()).toContain(i18n.global.t('workspace.created'))
    expect(wrapper.get('.item-table thead').text()).toContain(i18n.global.t('workspace.modified'))
    await dates(false)
    expect(wrapper.find('.date-cell').exists()).toBe(false)
    expect(control('sortDirection').attributes('disabled')).toBeDefined()
    await control('sortBy').setValue('name')
    expect(names()).toEqual(['Alpha', 'Beta', 'Zebra'])
    await dates(true)
    expect(wrapper.findAll('.date-cell')[0]!.text()).toBe(format('2026-02-01T00:00:00Z'))
    await control('sortDirection').setValue('desc')
    expect(names()).toEqual(['Zebra', 'Beta', 'Alpha'])
    await control('sortBy').setValue('creationDate')
    expect(names()).toEqual(['Alpha', 'Zebra', 'Beta'])
    await control('sortDirection').setValue('asc')
    expect(names()).toEqual(['Zebra', 'Alpha', 'Beta'])
    await control('sortBy').setValue('revisionDate')
    expect(names()).toEqual(['Alpha', 'Zebra', 'Beta'])
    await control('sortDirection').setValue('desc')
    expect(names()).toEqual(['Zebra', 'Alpha', 'Beta'])
    await control('search').setValue('Alpha')
    expect(names()).toEqual(['Alpha'])
    await control('search').setValue('')
    await control('sortBy').setValue('original')
    expect(names()).toEqual(['Zebra', 'Alpha', 'Beta'])
    await wrapper.get('.name-cell button').trigger('click')
    expect(wrapper.getComponent(ItemEditor).props('document')).toEqual(source)
    expect(wrapper.get('[aria-label="' + i18n.global.t('workspace.undo') + '"]').attributes('disabled')).toBeDefined()
    expect(localStorage.length).toBe(2) // Only the explicitly selected language/theme.
    await wrapper.findAll('.sidebar-footer button').find(button => button.text() === i18n.global.t('nav.close'))!.trigger('click')
    await wrapper.get('input[type="file"]').trigger('change'); await flushPromises()
    await wrapper.get('dialog .primary').trigger('click')
    expect((control('sortBy').element as HTMLSelectElement).value).toBe('original')
    expect((control('sortDirection').element as HTMLSelectElement).value).toBe('asc')
    expect(wrapper.findAll('.fields-panel input').every(input => !(input.element as HTMLInputElement).checked)).toBe(true)
    expect(wrapper.find('.date-cell').exists()).toBe(false)
  })

  it('sorts before pagination and retains original indexes for selection, drafts, edits, bulk actions, and undo', async () => {
    const source: VaultExport = { encrypted: false, items: Array.from({ length: 80 }, (_, index) => ({ type: 2, name: `Item ${80 - index}`, opaque: { index } })) }
    await openVault(source)
    await control('next').trigger('click')
    expect(names()).toHaveLength(5)
    await control('sortBy').setValue('name')
    expect(names()).toHaveLength(75)
    expect(names()[0]).toBe('Item 1')
    await dates(true)
    expect(wrapper.findAll('.date-cell').every(cell => cell.text() === '—')).toBe(true)
    await wrapper.get('.item-table tbody tr input[type="checkbox"]').setValue(true)
    await wrapper.get('.name-cell button').trigger('click')
    expect(wrapper.getComponent(ItemEditor).props('index')).toBe(79)
    await wrapper.get('.editor-section input').setValue('Changed')
    await control('sortDirection').setValue('desc')
    expect((wrapper.get('.editor-section input').element as HTMLInputElement).value).toBe('Changed')
    expect(wrapper.get('.bulk-toolbar').text()).toContain('1 selected')
    await wrapper.get('.editor-footer .primary').trigger('click')
    const document = wrapper.getComponent(ItemEditor).props('document') as VaultExport
    expect(document.items![79]).toEqual({ ...source.items![79], name: 'Changed' })
    expect(document.items!.slice(0, 79)).toEqual(source.items!.slice(0, 79))
    await control('favoriteSelected').trigger('click')
    expect(wrapper.getComponent(ItemEditor).props('item').favorite).toBe(true)
    await wrapper.get('[aria-label="Undo"]').trigger('click')
    await wrapper.get('[aria-label="Undo"]').trigger('click')
    await control('sortBy').setValue('original')
    await wrapper.get('.name-cell button').trigger('click')
    expect(wrapper.getComponent(ItemEditor).props('document')).toEqual(source)
    expect(localStorage.length).toBe(0)
  })
})
