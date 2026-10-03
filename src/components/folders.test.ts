import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import App from '../App.vue'
import { type VaultExport } from '../domain/vault'

const source: VaultExport = {
  encrypted: false,
  folders: [{ id: 'work', name: 'Work' }, { id: 'dev', name: 'Work/Development' }, { id: 'tools', name: 'Work/Development/Tools' }, { id: 'personal', name: 'Personal' }],
  items: [{ type: 2, name: 'Work note', folderId: 'work' }, { type: 2, name: 'Development note', folderId: 'dev' }, { type: 2, name: 'Tools note', folderId: 'tools' }],
}
let wrapper: VueWrapper
beforeEach(() => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
})
afterEach(() => { wrapper?.unmount(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

async function openVault() {
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
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: [new File([''], 'folders.json')] })
  await input.trigger('change')
  await flushPromises()
  await wrapper.find('dialog .primary').trigger('click')
}
const submit = () => wrapper.find('#folder-form').trigger('submit')
const nameInput = () => wrapper.find('#folder-form input:not([type="checkbox"])')

describe('folder manager workflow', () => {
  it('creates folders/subfolders, edits and moves branches, deletes safely, and undoes', async () => {
    await openVault()
    await wrapper.find('[aria-label="Manage folders"]').trigger('click')
    expect(wrapper.find('dialog').text()).toContain('Manage folders')
    await wrapper.find('.folder-manager-toolbar .primary').trigger('click')
    await nameInput().setValue('Projects')
    await submit()
    expect(wrapper.find('.folder-manager-list').text()).toContain('Projects')

    await wrapper.find('[aria-label="Create subfolder in folder 1"]').trigger('click')
    expect((wrapper.find('[aria-label="Parent folder"]').element as HTMLSelectElement).value).toBe('Work')
    await nameInput().setValue('Operations')
    expect(wrapper.find('.folder-path-preview').text()).toContain('Work/Operations')
    await submit()

    await wrapper.find('[aria-label="Edit folder 1"]').trigger('click')
    await nameInput().setValue('Office')
    await submit()
    expect(wrapper.find('.folder-manager-list').text()).toContain('Office/Development/Tools')
    expect(wrapper.find('.folder-manager-list').text()).toContain('Office/Operations')

    await wrapper.find('[aria-label="Move folder 1"]').trigger('click')
    const options = wrapper.find('[aria-label="Parent folder"]').findAll('option').map(option => option.attributes('value'))
    expect(options).not.toContain('Office')
    expect(options).not.toContain('Office/Development')
    await wrapper.find('[aria-label="Parent folder"]').setValue('Projects')
    await submit()
    expect(wrapper.find('.folder-manager-list').text()).toContain('Projects/Office/Development/Tools')

    await wrapper.find('[aria-label="Move folder 2"]').trigger('click')
    await wrapper.find('[aria-label="Parent folder"]').setValue('')
    await submit()
    expect(wrapper.find('.folder-manager-list').text()).toContain('Development/Tools')
    await wrapper.find('.modal-footer .button').trigger('click')
    await wrapper.find('[aria-label="Undo"]').trigger('click')
    expect(wrapper.find('[title="Projects/Office/Development/Tools"]').exists()).toBe(true)

    await wrapper.find('[aria-label="Manage folders"]').trigger('click')
    await wrapper.find('[aria-label="Delete folder 1"]').trigger('click')
    const checkbox = wrapper.find('#folder-form input[type="checkbox"]')
    expect((checkbox.element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.find('.folder-impact').text()).toContain('0 items deleted')
    await checkbox.setValue(true)
    await wrapper.find('[aria-label="Folder item destination"]').setValue('personal')
    expect(wrapper.find('.folder-impact').text()).toContain('4 folders removed')
    expect(wrapper.find('.folder-impact').text()).toContain('3 items reassigned')
    await submit()
    expect(wrapper.find('.folder-manager-list').text()).not.toContain('Office')
    expect(wrapper.findAll('.item-table tbody tr')).toHaveLength(3)
    expect(wrapper.findAll('.item-table .folder-cell').every(cell => cell.text() === 'Personal')).toBe(true)
    await wrapper.find('.modal-footer .button').trigger('click')
    await wrapper.find('[aria-label="Undo"]').trigger('click')
    expect(wrapper.find('[title="Projects/Office/Development/Tools"]').exists()).toBe(true)
    expect(wrapper.findAll('.item-table tbody tr')).toHaveLength(3)
    await wrapper.find('[aria-label="Redo"]').trigger('click')
    expect(wrapper.find('[title="Projects/Office/Development/Tools"]').exists()).toBe(false)
  })

  it('rejects collisions, warns for unsaved folder drafts, and clears invalid branch destinations', async () => {
    await openVault()
    await wrapper.find('[aria-label="Manage folders"]').trigger('click')
    await wrapper.find('[aria-label="Edit folder 1"]').trigger('click')
    await nameInput().setValue('Personal')
    await submit()
    expect(wrapper.find('dialog [role="alert"]').text()).toContain('already exists')
    expect(wrapper.find('.changes-button').text()).toBe('0 changes')
    const unload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(unload)
    expect(unload.defaultPrevented).toBe(true)
    vi.mocked(window.confirm).mockReturnValueOnce(false)
    await wrapper.find('.modal-footer .button').trigger('click')
    expect(wrapper.find('#folder-form').exists()).toBe(true)
    await wrapper.find('.modal-footer .button').trigger('click')
    expect(wrapper.find('.folder-manager-list').text()).toContain('Work/Development')

    await wrapper.find('[aria-label="Delete folder 1"]').trigger('click')
    await wrapper.find('[aria-label="Folder item destination"]').setValue('dev')
    await wrapper.find('#folder-form input[type="checkbox"]').setValue(true)
    expect((wrapper.find('[aria-label="Folder item destination"]').element as HTMLSelectElement).value).toBe('')
    expect(wrapper.find('[aria-label="Folder item destination"]').findAll('option').map(o => o.attributes('value'))).not.toContain('dev')
    await wrapper.find('#folder-form input[type="checkbox"]').setValue(false)
    await submit()
    const group = wrapper.findAll('.folder-manager-row').find(row => row.text().includes('Work') && row.text().includes('grouping path only'))
    expect(group).toBeDefined()
    expect(wrapper.find('[title="Work/Development/Tools"]').exists()).toBe(true)
    expect(wrapper.findAll('.item-table tbody tr')).toHaveLength(3)
    expect(wrapper.findAll('.item-table .folder-cell')[0]!.text()).toBe('Unassigned')
    expect(wrapper.findAll('.item-table .folder-cell')[1]!.text()).toBe('Work/Development')
    expect(wrapper.find('.changes-button').text()).toBe('1 changes')
  })
})
