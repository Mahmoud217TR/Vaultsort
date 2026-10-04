import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import App from '../App.vue'
import ItemEditor from './ItemEditor.vue'
import ReviewPanel from './ReviewPanel.vue'
import Tooltip from './Tooltip.vue'
import { setLanguage, setTheme } from '../preferences'
import { type IssueRequest, type ValidationBundle, type VaultExport } from '../domain/vault'
let wrapper: VueWrapper
beforeEach(() => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
})
afterEach(() => { wrapper?.unmount(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
async function open(source: VaultExport, replace = false) {
  const encoded = new TextEncoder().encode(JSON.stringify(source))
  const bytes = new ArrayBuffer(encoded.length); new Uint8Array(bytes).set(encoded)
  class Reader {
    result = bytes
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    readAsArrayBuffer() { queueMicrotask(() => this.onload?.()) }
    abort() {}
  }
  vi.stubGlobal('FileReader', Reader)
  if (!replace) wrapper = mount(App, { attachTo: document.body })
  const input = wrapper.get('input[type=file]')
  Object.defineProperty(input.element, 'files', { configurable: true, value: [new File([''], 'synthetic.json')] })
  await input.trigger('change'); await flushPromises()
  await wrapper.get('dialog .primary').trigger('click')
}
const source: VaultExport = { encrypted: false, items: [
  { id: 'same', type: 1, name: 'Alpha', login: { password: 'synthetic-password' } },
  { id: 'same', type: 1, name: 'Zebra', login: { username: 'synthetic-user', uris: [{ uri: 'https://example.test' }] } },
] }
describe('contextual issue navigation', () => {
  it.each(['delete', 'undo', 'redo', 'replace'] as const)('rejects a captured request after %s while retaining a new occupant draft', async transition => {
    await open(source)
    await wrapper.get('.review-nav').trigger('click')
    const review = wrapper.getComponent(ReviewPanel)
    const bundle = review.props('validation') as ValidationBundle
    const request: IssueRequest = { revision: bundle.revision, issue: bundle.issues.find(issue => issue.itemIndex === (transition === 'delete' ? 0 : 1))! }
    const inspect = review.vm.$.vnode.props!.onInspectIssue as (request: IssueRequest) => void
    await wrapper.get('.vault-nav button').trigger('click')
    if (transition === 'delete') {
      await wrapper.get('tbody input[type=checkbox]').setValue(true)
      await wrapper.get('[aria-label="Delete selected items"]').trigger('click')
      expect(wrapper.get('.name-cell button').text()).toContain('Zebra')
    } else if (transition === 'replace') await open({ items: [{ type: 2, name: 'Replacement without ID' }] }, true)
    else {
      await wrapper.get('.star-button').trigger('click')
      await wrapper.get('[aria-label="Undo"]').trigger('click')
      if (transition === 'redo') await wrapper.get('[aria-label="Redo"]').trigger('click')
    }
    await wrapper.get('tbody input[type=checkbox]').setValue(true)
    await wrapper.get('.name-cell button').trigger('click')
    await wrapper.get('.editor-section input').setValue('Do not discard stale draft')
    const before = wrapper.getComponent(ItemEditor).props('item')
    const confirmations = vi.mocked(window.confirm).mock.calls.length
    inspect(request); await flushPromises()
    expect(wrapper.getComponent(ItemEditor).props('item')).toBe(before)
    expect(wrapper.getComponent(ItemEditor).props('index')).toBe(0)
    expect((wrapper.get('.editor-section input').element as HTMLInputElement).value).toBe('Do not discard stale draft')
    expect((wrapper.get('tbody input[type=checkbox]').element as HTMLInputElement).checked).toBe(true)
    expect(window.confirm).toHaveBeenCalledTimes(confirmations)
    expect(wrapper.get('[role="status"]').text()).toContain('no longer available')
  })
  it('preserves page, filters, sort, selection and draft when an off-page warning is cancelled, then accepts it', async () => {
    await open({ items: Array.from({ length: 80 }, (_, index) => ({ id: index % 2 ? 'repeated' : undefined, type: 1, name: `Synthetic ${index}`, login: { username: 'synthetic' } })) })
    await wrapper.get('.filter-button').trigger('click')
    await wrapper.get('#vault-filters label:nth-child(3) select').setValue('__personal')
    await wrapper.get('.search-wrap input').setValue('Synthetic')
    await wrapper.get('[aria-label="Sort by"]').setValue('name')
    await wrapper.get('[aria-label="Sort direction"]').setValue('desc')
    await wrapper.get('[aria-label="Next page"]').trigger('click')
    await wrapper.get('tbody input[type=checkbox]').setValue(true)
    await wrapper.get('.name-cell button').trigger('click')
    await wrapper.get('.editor-section input').setValue('Page two draft')
    const editor = wrapper.getComponent(ItemEditor)
    const index = editor.props('index')
    const page = wrapper.get('.pagination').text()
    vi.mocked(window.confirm).mockReturnValue(false)
    await wrapper.findAll('.warning-indicator')[1]!.trigger('click')
    expect(editor.props('index')).toBe(index)
    expect((wrapper.get('.editor-section input').element as HTMLInputElement).value).toBe('Page two draft')
    expect(wrapper.get('.pagination').text()).toBe(page)
    expect(wrapper.get('.bulk-toolbar').text()).toContain('1 selected')
    expect((wrapper.get('.search-wrap input').element as HTMLInputElement).value).toBe('Synthetic')
    expect((wrapper.get('[aria-label="Sort direction"]').element as HTMLSelectElement).value).toBe('desc')
    await wrapper.get('.filter-button').trigger('click')
    expect((wrapper.get('#vault-filters label:nth-child(3) select').element as HTMLSelectElement).value).toBe('__personal')
    vi.mocked(window.confirm).mockReturnValue(true)
    await wrapper.findAll('.warning-indicator')[1]!.trigger('click'); await flushPromises()
    expect(wrapper.getComponent(ItemEditor).props('index')).not.toBe(index)
    expect(wrapper.get('.pagination').text()).toBe(page)
    expect(wrapper.get('.bulk-toolbar').text()).toContain('1 selected')
  })
  it('uses exact URI positions and safe ownership, malformed-login and unsupported-item contexts', async () => {
    await open({ items: [{ type: 1, name: 'URI', login: { username: 'synthetic', password: 'synthetic', uris: [{ uri: 'https://valid.test' }, { uri: 42 }] } }, { type: 1, name: 'Malformed', login: [] }, { type: 9, name: 'Unknown' }, { type: 2, name: 'Owned', collectionIds: ['synthetic'] }] } as unknown as VaultExport)
    await wrapper.get('.review-nav').trigger('click')
    const review = wrapper.getComponent(ReviewPanel)
    const bundle = review.props('validation') as ValidationBundle
    for (const [message, selector] of [['validation.uris', '.uri-input:nth-of-type(2) input'], ['validation.login', '.malformed-login'], ['validation.unsupported', '.issue-context h3'], ['validation.organization', '.metadata summary']] as const) {
      const issue = bundle.issues.find(issue => issue.message === message)!
      review.vm.$emit('inspectIssue', { revision: bundle.revision, issue }); await flushPromises()
      const target = message === 'validation.uris' ? wrapper.findAll('.uri-input input')[1]! : wrapper.get(selector)
      expect(document.activeElement).toBe(target.element)
      expect(wrapper.find('.code-input').exists()).toBe(false)
      if (message === 'validation.organization') expect((wrapper.get('.metadata').element as HTMLDetailsElement).open).toBe(true)
    }
    const issue = bundle.issues.find(issue => issue.message === 'validation.noUri')!
    review.vm.$emit('inspectIssue', { revision: bundle.revision, issue }); await flushPromises()
    expect(document.activeElement).toBe(wrapper.get('.add-uri').element)
  })
  it('keeps static action help hoverable and associates it with keyboard controls', async () => {
    vi.useFakeTimers()
    try {
      wrapper = mount(Tooltip, { props: { text: 'Static synthetic action explanation' }, slots: { default: '<button aria-label="Synthetic action">Action</button>' }, attachTo: document.body })
      expect(wrapper.get('button').attributes('aria-describedby')).toBe(wrapper.get('[role="tooltip"]').attributes('id'))
      await wrapper.trigger('mouseenter')
      expect(wrapper.get('[role="tooltip"]').isVisible()).toBe(true)
      await wrapper.trigger('mouseleave'); vi.advanceTimersByTime(50)
      await wrapper.get('[role="tooltip"]').trigger('mouseenter'); vi.advanceTimersByTime(150)
      expect(wrapper.get('[role="tooltip"]').isVisible()).toBe(true)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
      await flushPromises()
      expect(wrapper.get('[role="tooltip"]').isVisible()).toBe(false)
    } finally { vi.useRealTimers() }
  })
  it('keeps drafts, selection, privacy and optional fields when preference writes fail', async () => {
    await open(source)
    await wrapper.get('[aria-controls="vault-fields"]').trigger('click')
    await wrapper.get('[data-field="created"]').setValue(true)
    await wrapper.get('tbody input[type=checkbox]').setValue(true)
    await wrapper.get('.name-cell button').trigger('click')
    await wrapper.get('.editor-section input').setValue('Preference draft')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('blocked') })
    for (const language of ['en', 'ar']) for (const value of ['light', 'dark']) {
      setLanguage(language); setTheme(value); await flushPromises()
      expect(document.documentElement.lang).toBe(language)
      expect(document.documentElement.dataset.theme).toBe(value)
      expect((wrapper.get('.editor-section input').element as HTMLInputElement).value).toBe('Preference draft')
      expect((wrapper.get('tbody input[type=checkbox]').element as HTMLInputElement).checked).toBe(true)
      expect((wrapper.get('[data-field="created"]').element as HTMLInputElement).checked).toBe(true)
      expect(wrapper.get('.privacy-toggle').attributes('aria-pressed')).toBe('true')
    }
  })
  it('describes disabled actions and consumes tooltip Escape without closing an editor', async () => {
    await open(source)
    await wrapper.get('.name-cell button').trigger('click')
    await wrapper.get('.editor-section input').setValue('Keep tooltip draft')
    const tooltip = wrapper.findAllComponents(Tooltip).find(component => component.find('[aria-label="Undo"]').exists())!
    expect(tooltip).toBeDefined()
    await tooltip.trigger('focusin')
    expect(tooltip.get('[role="tooltip"]').isVisible()).toBe(true)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await flushPromises()
    expect(tooltip.get('[role="tooltip"]').isVisible()).toBe(false)
    expect(wrapper.findComponent(ItemEditor).exists()).toBe(true)
    expect((wrapper.get('.editor-section input').element as HTMLInputElement).value).toBe('Keep tooltip draft')
    expect(wrapper.get('[aria-label="Undo"]').attributes('disabled')).toBeDefined()
  })
  it('focuses exact source fields across sorted rows and keeps them masked', async () => {
    await open(source)
    await wrapper.get('[aria-label="Sort by"]').setValue('name')
    await wrapper.get('[aria-label="Sort direction"]').setValue('desc')
    await wrapper.get('.warning-indicator').trigger('click'); await flushPromises()
    expect(wrapper.getComponent(ItemEditor).props('index')).toBe(1)
    expect(document.activeElement).toBe(wrapper.get('[data-issue-field="login.password"]').element)
    expect(wrapper.find('.review-panel').exists()).toBe(false)
    expect(wrapper.get('[data-issue-field="login.password"]').attributes('readonly')).toBeDefined()
  })
  it('cancels warning navigation without changing any draft or navigation state', async () => {
    await open(source)
    await wrapper.get('.name-cell button').trigger('click')
    await wrapper.get('.editor-section input').setValue('Unapplied synthetic draft')
    vi.mocked(window.confirm).mockReturnValue(false)
    await wrapper.findAll('.warning-indicator')[1]!.trigger('click')
    expect(wrapper.getComponent(ItemEditor).props('index')).toBe(0)
    expect((wrapper.get('.editor-section input').element as HTMLInputElement).value).toBe('Unapplied synthetic draft')
    expect(wrapper.find('.review-panel').exists()).toBe(false)
    expect(wrapper.findAll('.name-cell')).toHaveLength(2)
  })
  it('rejects captured warning requests after undo rather than opening a new occupant', async () => {
    await open(source)
    await wrapper.get('.review-nav').trigger('click')
    const review = wrapper.getComponent(ReviewPanel)
    const bundle = review.props('validation') as { revision: number; issues: unknown[] }
    expect(bundle).toBeDefined()
    review.vm.$emit('inspectIssue', { revision: bundle.revision, issue: bundle.issues[0] })
    await flushPromises()
    await wrapper.get('.editor-section input').setValue('Applied synthetic edit')
    await wrapper.get('.editor-footer .primary').trigger('click')
    await wrapper.get('[aria-label="Undo"]').trigger('click')
    review.vm.$emit('inspectIssue', { revision: bundle.revision, issue: bundle.issues[0] })
    await flushPromises()
    expect(wrapper.findComponent(ItemEditor).exists()).toBe(false)
    expect(wrapper.get('[role="status"]').text()).toContain('no longer available')
  })
  it('preserves a same-item draft while focusing another issue and supports off-list export targets', async () => {
    await open(source)
    await wrapper.get('.warning-indicator').trigger('click'); await flushPromises()
    await wrapper.get('.editor-section input').setValue('Keep this draft')
    const editor = wrapper.getComponent(ItemEditor)
    const issue = editor.props('issues')![1]!
    editor.vm.$emit('inspectIssue', { revision: editor.props('revision'), issue })
    await flushPromises()
    expect((wrapper.get('.editor-section input').element as HTMLInputElement).value).toBe('Keep this draft')
    expect(window.confirm).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(wrapper.get('.add-uri').element)
    await wrapper.get('.editor-footer button').trigger('click')
    await wrapper.get('.search-wrap input').setValue('Alpha')
    await wrapper.get('.toolbar-actions .primary').trigger('click')
    const exportIssue = wrapper.findAll('.export-issues .text-button').find(button => button.text().includes('2'))!
    await exportIssue.trigger('click'); await flushPromises()
    expect(wrapper.getComponent(ItemEditor).props('index')).toBe(1)
    expect(wrapper.findAll('.name-cell')).toHaveLength(1)
    expect(wrapper.find('.export-issues').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.get('[data-issue-field="login.password"]').element)
  })
  it('does not close the originating export dialog on a cancelled discard', async () => {
    await open(source)
    await wrapper.get('.name-cell button').trigger('click')
    await wrapper.get('.toolbar-actions .primary').trigger('click')
    const dialog = wrapper.get('dialog').element
    // Inject a concurrent draft to exercise the shared guard even though a native modal is inert.
    await wrapper.get('.editor-section input').setValue('Concurrent synthetic draft')
    const target = wrapper.findAll('.export-issues .text-button').find(button => button.text().includes('2'))!
    vi.mocked(window.confirm).mockReturnValue(false)
    await target.trigger('click')
    expect(wrapper.get('dialog').element).toBe(dialog)
    expect(wrapper.getComponent(ItemEditor).props('index')).toBe(0)
    expect((wrapper.get('.editor-section input').element as HTMLInputElement).value).toBe('Concurrent synthetic draft')
    vi.mocked(window.confirm).mockReturnValue(true)
    await target.trigger('click'); await flushPromises()
    expect(wrapper.find('.export-issues').exists()).toBe(false)
    expect(wrapper.getComponent(ItemEditor).props('index')).toBe(1)
    expect(document.activeElement).toBe(wrapper.get('[data-issue-field="login.password"]').element)
  })
})
