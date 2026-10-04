import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import App from '../App.vue'
import { i18n } from '../i18n'
import { setTheme } from '../preferences'

// Build identity is immutable in production; dynamic getter permits isolated App test cases.
vi.mock('../hostedDemo', () => ({
  get hostedDemo() { return import.meta.env.VITE_HOSTED_DEMO === 'true' },
  demoAcknowledged: () => {
    if (import.meta.env.VITE_HOSTED_DEMO !== 'true') return true
    try { return sessionStorage.getItem('vaultsort.hostedDemoAcknowledged:./') === '1' } catch { return false }
  },
  acknowledgeDemo: () => { try { sessionStorage.setItem('vaultsort.hostedDemoAcknowledged:./', '1') } catch { /* refused storage */ } },
}))
let wrapper: VueWrapper
let reads = 0
let picks = 0
beforeEach(() => {
  reads = picks = 0
  vi.stubEnv('VITE_HOSTED_DEMO', 'true')
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
  vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
    if (this.type === 'file' && this.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))) picks++
  })
  class Reader {
    result = new ArrayBuffer(0)
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    readAsArrayBuffer() {
      const encoded = new TextEncoder().encode(JSON.stringify({ encrypted: false, items: [{ type: 2, name: 'Synthetic' }], opaque: true }))
      this.result = new ArrayBuffer(encoded.length)
      new Uint8Array(this.result).set(encoded)
      reads++; queueMicrotask(() => this.onload?.())
    }
    abort() {}
  }
  vi.stubGlobal('FileReader', Reader)
  wrapper = mount(App, { attachTo: document.body })
})
afterEach(() => { wrapper.unmount(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs() })
const warning = () => wrapper.get('.hosted-warning')
async function change() {
  const input = wrapper.get('input[type=file]')
  Object.defineProperty(input.element, 'files', { configurable: true, value: [new File(['{}'], 'synthetic.json')] })
  await input.trigger('change'); await flushPromises()
}
async function proceed() {
  await wrapper.get('.import-button').trigger('click')
  await warning().get('.demo-continue').trigger('click')
}
describe('hosted import gates', () => {
  it('warns before selection, never caches a refused file, and retains a fixed session choice', async () => {
    expect(wrapper.get('.demo-label').text()).toBe('Hosted demo')
    await change()
    expect(reads).toBe(0); expect(picks).toBe(0)
    expect(warning().findAll('li')).toHaveLength(5)
    await warning().get('.demo-continue').trigger('click')
    expect(picks).toBe(1); expect(reads).toBe(0)
    await change()
    expect(reads).toBe(1); expect(wrapper.find('.demo-label').exists()).toBe(true)
    await wrapper.get('dialog .primary').trigger('click')
    const open = wrapper.findAll('.sidebar-footer button').find(button => button.text() === 'Open another vault')!
    await open.trigger('click')
    expect(picks).toBe(2); expect(wrapper.find('.hosted-warning').exists()).toBe(false)
    wrapper.unmount(); wrapper = mount(App, { attachTo: document.body })
    await wrapper.get('.import-button').trigger('click')
    expect(picks).toBe(3)
  })
  it.each(['cancel', 'escape', 'close', 'backdrop', 'local'])('dismisses %s without acknowledgment or picker', async action => {
    await wrapper.get('.import-button').trigger('click')
    if (action === 'cancel') await warning().get('.demo-cancel').trigger('click')
    if (action === 'escape') await warning().trigger('cancel')
    if (action === 'close') await warning().get('.modal-header button').trigger('click')
    if (action === 'backdrop') await warning().trigger('click')
    if (action === 'local') await warning().get('.demo-local').trigger('click')
    expect(sessionStorage.length).toBe(0); expect(picks).toBe(0); expect(reads).toBe(0)
    expect(wrapper.find('.hosted-warning').exists()).toBe(false)
    await wrapper.get('.import-button').trigger('click')
    expect(wrapper.find('.hosted-warning').exists()).toBe(true)
  })
  it('blocks direct native clicks before acknowledgment', async () => {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    expect(wrapper.get('input[type=file]').element.dispatchEvent(event)).toBe(false)
    await flushPromises(); expect(wrapper.find('.hosted-warning').exists()).toBe(true)
  })
  it('storage failure grants one attempt only, cleared by cancel or read', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    await proceed(); expect(picks).toBe(1)
    await wrapper.get('input[type=file]').trigger('cancel')
    await change(); expect(reads).toBe(0)
    await warning().get('.demo-continue').trigger('click')
    await change(); expect(reads).toBe(1)
    await wrapper.get('dialog .primary').trigger('click')
    await wrapper.findAll('.sidebar-footer button').find(b => b.text() === 'Open another vault')!.trigger('click')
    expect(wrapper.find('.hosted-warning').exists()).toBe(true)
  })
  it('rechecks dirty current state on direct changes and after selection approval', async () => {
    await proceed(); await change(); await wrapper.get('dialog .primary').trigger('click')
    await wrapper.get('.star-button').trigger('click')
    vi.mocked(window.confirm).mockReturnValue(false)
    await change(); expect(reads).toBe(1)
    expect(wrapper.get('.item-table').text()).toContain('Synthetic')
    vi.mocked(window.confirm).mockReturnValue(true)
    await wrapper.findAll('.sidebar-footer button').find(b => b.text() === 'Open another vault')!.trigger('click')
    await wrapper.get('.star-button').trigger('click')
    await wrapper.get('.star-button').trigger('click')
    vi.mocked(window.confirm).mockReturnValue(false)
    await change(); expect(reads).toBe(1)
  })
  it.each(['committed', 'item', 'folder', 'comparison'])('preserves %s work through warning/cancel/refused continuation', async kind => {
    await proceed(); await change(); await wrapper.get('dialog .primary').trigger('click')
    const state = (wrapper.vm.$ as unknown as { setupState: Record<string, unknown> }).setupState
    if (kind === 'committed') await wrapper.get('.star-button').trigger('click')
    if (kind === 'item') state.draftDirty = true
    if (kind === 'folder') { state.modal = 'folder'; state.folderLabel = 'Synthetic pending folder' }
    if (kind === 'comparison') state.comparisonNameDirty = true
    await flushPromises()
    const before = JSON.stringify([state.doc, state.changes, state.originalName, state.folderLabel, state.draftDirty, state.comparisonNameDirty])
    const original = state.originalBytes
    sessionStorage.clear()
    await change()
    expect(reads).toBe(1)
    if (kind === 'folder') {
      const dialogs = wrapper.findAll('dialog')
      expect(dialogs).toHaveLength(2)
      expect(new Set(dialogs.map(dialog => dialog.attributes('aria-labelledby'))).size).toBe(2)
    }
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, cancelable: true }))
    expect(state.modal).toBe(kind === 'folder' ? 'folder' : null)
    await warning().get('.demo-cancel').trigger('click')
    expect(JSON.stringify([state.doc, state.changes, state.originalName, state.folderLabel, state.draftDirty, state.comparisonNameDirty])).toBe(before)
    await change()
    vi.mocked(window.confirm).mockReturnValue(false)
    const previousPicks = picks
    await warning().get('.demo-continue').trigger('click')
    expect(picks).toBe(previousPicks); expect(reads).toBe(1)
    expect(state.originalBytes).toBe(original)
    expect(JSON.stringify([state.doc, state.changes, state.originalName, state.folderLabel, state.draftDirty, state.comparisonNameDirty])).toBe(before)
    // Direct changes cannot reuse an earlier decision, even after acknowledgment.
    await change(); expect(reads).toBe(1)
  })
  it.each([['en', 'light'], ['en', 'dark'], ['ar', 'light'], ['ar', 'dark']] as const)('keeps %s/%s labels translated without clearing acknowledgment', async (locale, theme) => {
    i18n.global.locale.value = locale; setTheme(theme)
    await proceed()
    expect(wrapper.text()).not.toContain('hostedDemo.')
    expect(sessionStorage.length).toBe(1)
    i18n.global.locale.value = locale === 'en' ? 'ar' : 'en'; setTheme(theme === 'light' ? 'dark' : 'light')
    await wrapper.get('.import-button').trigger('click')
    expect(wrapper.find('.hosted-warning').exists()).toBe(false)
  })
  it('leaves ordinary local import unchanged and storage untouched', async () => {
    wrapper.unmount(); vi.stubEnv('VITE_HOSTED_DEMO', 'false'); wrapper = mount(App)
    expect(wrapper.find('.demo-label').exists()).toBe(false)
    await wrapper.get('.import-button').trigger('click'); expect(picks).toBe(1)
    await change(); expect(reads).toBe(1); expect(sessionStorage.length).toBe(0)
  })
  it('restores the initiating focus after cancellation', async () => {
    const button = wrapper.get('.import-button').element as HTMLButtonElement
    button.focus()
    await wrapper.get('.import-button').trigger('click')
    await warning().get('.demo-cancel').trigger('click')
    await flushPromises()
    expect(document.activeElement).toBe(button)
  })
  it('retains acknowledgment through close/reopen without retaining vault data', async () => {
    await proceed(); await change(); await wrapper.get('dialog .primary').trigger('click')
    await wrapper.findAll('.sidebar-footer button').find(button => button.text() === 'Close vault')!.trigger('click')
    expect(wrapper.find('.item-table').exists()).toBe(false)
    expect(sessionStorage.length).toBe(1)
    await wrapper.get('.import-button').trigger('click')
    expect(wrapper.find('.hosted-warning').exists()).toBe(false)
    expect(picks).toBe(2)
  })
  it('clears storage-failure authorization even when the selected file cannot be read', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    class FailedReader {
      onload = null
      onerror: (() => void) | null = null
      readAsArrayBuffer() { queueMicrotask(() => this.onerror?.()) }
      abort() {}
    }
    vi.stubGlobal('FileReader', FailedReader)
    await proceed(); await change()
    expect(wrapper.get('[role=alert]').text()).toContain('Could not read')
    await wrapper.get('.import-button').trigger('click')
    expect(wrapper.find('.hosted-warning').exists()).toBe(true)
    expect(picks).toBe(1)
  })
})
