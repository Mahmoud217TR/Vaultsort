import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import App from '../App.vue'
import ItemEditor from './ItemEditor.vue'
import { i18n } from '../i18n'
import { setLanguage, setTheme } from '../preferences'
import { type VaultExport } from '../domain/vault'

let wrapper: VueWrapper
beforeEach(() => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
})
afterEach(() => { wrapper?.unmount(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

async function openVault(source: VaultExport) {
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
  wrapper = mount(App, { attachTo: document.body })
  const input = wrapper.get('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: [new File([''], 'synthetic.json')] })
  await input.trigger('change'); await flushPromises()
  await wrapper.get('dialog .primary').trigger('click')
}
const control = (key: string) => wrapper.get(`[aria-label="${i18n.global.t(`workspace.${key}`)}"]`)
const names = () => wrapper.findAll('.name-cell bdi').map(cell => cell.text())

describe('item sorting controls', () => {
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
    await control('showDates').setValue(true)
    const format = (date: string) => new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(Date.parse(date))
    expect(wrapper.findAll('.date-cell').map(cell => cell.text())).toEqual([
      format('2026-01-01T00:00:00Z'), format('2026-03-01T00:00:00Z'),
      format('2026-02-01T00:00:00Z'), format('2026-01-01T00:00:00Z'), '—', '—',
    ])
    expect(wrapper.get('.item-table thead').text()).toContain(i18n.global.t('workspace.created'))
    expect(wrapper.get('.item-table thead').text()).toContain(i18n.global.t('workspace.modified'))
    await control('showDates').setValue(false)
    expect(wrapper.find('.date-cell').exists()).toBe(false)
    expect(control('sortDirection').attributes('disabled')).toBeDefined()
    await control('sortBy').setValue('name')
    expect(names()).toEqual(['Alpha', 'Beta', 'Zebra'])
    await control('showDates').setValue(true)
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
    await wrapper.get('.sidebar-footer button:nth-child(2)').trigger('click')
    await wrapper.get('input[type="file"]').trigger('change'); await flushPromises()
    await wrapper.get('dialog .primary').trigger('click')
    expect((control('sortBy').element as HTMLSelectElement).value).toBe('original')
    expect((control('sortDirection').element as HTMLSelectElement).value).toBe('asc')
    expect((control('showDates').element as HTMLInputElement).checked).toBe(false)
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
    await control('showDates').setValue(true)
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
