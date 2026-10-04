import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import ItemEditor from './ItemEditor.vue'
import App from '../App.vue'
import NoteInspector from './NoteInspector.vue'
import { type VaultExport, type VaultItem } from '../domain/vault'
import { translate, type Message } from '../i18n'

const item: VaultItem = { id: '1', type: 1, name: 'Example', notes: '<img src="https://evil.test/steal" onerror="alert(1)"><script>bad()</script>', login: { username: 'user@example.test', password: 'old-secret', totp: 'totp-secret', uris: [{ uri: 'https://example.test', match: null, opaque: 42 }] }, opaque: { retain: true } }
const doc: VaultExport = { encrypted: false, folders: [{ id: 'a', name: 'Work' }], items: [item, { type: 2, name: 'Note', notes: 'safe' }], extra: 'keep me' }
let wrapper: VueWrapper | undefined
beforeEach(() => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
})
afterEach(() => { wrapper?.unmount(); wrapper = undefined; vi.restoreAllMocks(); vi.unstubAllGlobals() })

async function importSource(source: VaultExport) {
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
  wrapper ??= mount(App, { attachTo: document.body })
  const input = wrapper.get('input[type=file]')
  Object.defineProperty(input.element, 'files', { configurable: true, value: [new File([''], 'synthetic.json')] })
  await input.trigger('change'); await flushPromises()
  await wrapper.get('dialog .primary').trigger('click')
}

describe('editor security', () => {
  it.each(['hide', 'replace', 'delete', 'undo', 'redo', 'close'] as const)('clears all note types on %s without retaining stale detail', async action => {
    const notes = ['Synthetic login secret', '<script>literal()</script>\n<img src="https://literal.test">', '🗝'.repeat(150) + '\nالعربية literal SSH', 'Unknown synthetic note']
    const source: VaultExport = { encrypted: false, opaque: { unchanged: true }, items: [1, 2, 5, 9].map((type, index) => ({ type, name: `Synthetic ${index}`, notes: notes[index] })), folders: [] }
    source.items!.push({ type: 2, name: 'Blank', notes: '   ' }, { type: 2, name: 'Malformed', notes: { opaque: true } } as unknown as VaultItem)
    await importSource(source)
    await wrapper!.get('[aria-controls="vault-fields"]').trigger('click')
    await wrapper!.get('[data-field="notes"]').setValue(true)
    for (const note of notes) expect(wrapper!.html()).not.toContain(note)
    expect(wrapper!.find('.note-preview').exists()).toBe(false)
    await wrapper!.get('.privacy-toggle').trigger('click')
    expect(wrapper!.findAll('.note-preview')).toHaveLength(4)
    const previews = wrapper!.findAll('.note-preview bdi').map(cell => cell.text())
    expect(previews.every(value => Array.from(value).length <= 100)).toBe(true)
    expect(previews[2]).toBe('🗝'.repeat(99) + '…')
    expect(wrapper!.findAll('.notes-cell').slice(4).map(cell => cell.text())).toEqual(['—', '—'])
    if (action === 'undo' || action === 'redo') {
      await wrapper!.get('.star-button').trigger('click')
      if (action === 'redo') await wrapper!.get('[aria-label="Undo"]').trigger('click')
    }
    await wrapper!.findAll('.note-preview')[2]!.trigger('click')
    expect(wrapper!.get('.note-text').text()).toBe(notes[2])
    if (action === 'hide') await wrapper!.get('[data-field="notes"]').setValue(false)
    if (action === 'replace') await importSource({ encrypted: false, items: [{ type: 2, name: 'Replacement', notes: 'New note' }] })
    if (action === 'delete') {
      await wrapper!.findAll('tbody input[type=checkbox]')[2]!.setValue(true)
      await wrapper!.get('[aria-label="Delete selected items"]').trigger('click')
    }
    if (action === 'undo' || action === 'redo') await wrapper!.get(`[aria-label="${action === 'undo' ? 'Undo' : 'Redo'}"]`).trigger('click')
    if (action === 'close') await wrapper!.findAll('.sidebar-footer button').find(button => button.text() === 'Close vault')!.trigger('click')
    await flushPromises()
    expect(wrapper!.findComponent(NoteInspector).exists()).toBe(false)
    expect(wrapper!.find('.note-text').exists()).toBe(false)
    if (!['replace', 'delete', 'close'].includes(action)) {
      await wrapper!.get('.name-cell button').trigger('click')
      expect(wrapper!.getComponent(ItemEditor).props('document').items).toEqual(action === 'redo' ? source.items!.map((item, index) => index === 0 ? { ...item, favorite: true } : item) : source.items)
    }
  })
  it('selects the native note popover when supported and returns focus after dismissal', async () => {
    const show = vi.fn(), hide = vi.fn()
    const originalShow = HTMLElement.prototype.showPopover, originalHide = HTMLElement.prototype.hidePopover
    HTMLElement.prototype.showPopover = show
    HTMLElement.prototype.hidePopover = hide
    const trigger = document.createElement('button'); document.body.append(trigger)
    try {
      wrapper = mount(NoteInspector, { props: { text: 'Synthetic native note', trigger }, attachTo: document.body })
      expect(show).toHaveBeenCalledOnce()
      expect(wrapper.get('[popover="auto"]').attributes('role')).toBe('dialog')
      expect(document.activeElement).toBe(wrapper.get('button').element)
      await wrapper.get('button').trigger('click')
      expect(wrapper.emitted('close')).toHaveLength(1)
      wrapper.unmount(); wrapper = undefined; await flushPromises()
      expect(hide).toHaveBeenCalledOnce()
      expect(document.activeElement).toBe(trigger)
    } finally { HTMLElement.prototype.showPopover = originalShow; HTMLElement.prototype.hidePopover = originalHide; trigger.remove() }
  })
  it.each([false, true])('retains plaintext guidance and fixed links in export with blocked=%s', async blocked => {
    await importSource({ encrypted: false, items: [{ type: 2, name: 'Synthetic', folderId: blocked ? 'missing' : null }] })
    for (const link of wrapper!.findAll('a[target="_blank"]')) {
      expect(link.attributes('href')).toMatch(/^https:\/\/github\.com\/Mahmoud217TR\/Vaultsort(?:\/issues)?$/)
      expect(link.attributes('rel')).toBe('noopener noreferrer')
      expect(link.attributes('aria-label')).toContain('new tab')
    }
    expect(wrapper!.find('.plaintext-banner').exists()).toBe(false)
    expect(wrapper!.get('.original-copy').isVisible()).toBe(true)
    await wrapper!.get('.toolbar-actions .primary').trigger('click')
    expect(wrapper!.get('dialog').text()).toContain('Your vault contains plaintext passwords.')
    expect(wrapper!.get('dialog .primary').attributes('disabled') !== undefined).toBe(blocked)
  })
  it('provides fixed user-activated project links with distinct home branding and no external data', () => {
    wrapper = mount(App)
    expect(wrapper.find('.brand .brand-label').exists()).toBe(false)
    const links = wrapper.findAll('a[target="_blank"]')
    expect(links.length).toBeGreaterThanOrEqual(3)
    for (const link of links) {
      expect(['https://github.com/Mahmoud217TR/Vaultsort', 'https://github.com/Mahmoud217TR/Vaultsort/issues']).toContain(link.attributes('href'))
      expect(link.attributes('rel')).toBe('noopener noreferrer')
      expect(link.attributes('aria-label')).toContain('new tab')
    }
    expect(wrapper.find('.hosted-trust').text()).toContain('hosted')
    const app = readFileSync(resolve('src/App.vue'), 'utf8')
    expect(app).not.toContain('class="plaintext-banner"')
    expect(app).toContain('class="original-copy"')
    expect(app).not.toMatch(/prefetch|preconnect|dns-prefetch/)
  })
  it('contains the accessible hidden Notes label inside the editor scroll region', () => {
    const css = readFileSync(resolve('src/style.css'), 'utf8')
    expect(css).toMatch(/\.editor-scroll\s*\{[^}]*position:\s*relative/)
    wrapper = mount(ItemEditor, { props: { item, index: 0, document: doc, privacy: false } })
    expect(wrapper.get('.editor-scroll label .sr-only').text()).toBe('Notes')
  })
  it('gates literal full-note inspection and clears exposed detail when masked or filtered away', async () => {
    const encoded = new TextEncoder().encode(JSON.stringify(doc))
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
    await wrapper.get('[aria-controls="vault-fields"]').trigger('click')
    await wrapper.get('[data-field="notes"]').setValue(true)
    expect(wrapper.html()).not.toContain('evil.test')
    expect(wrapper.find('.note-preview').exists()).toBe(false)
    await wrapper.get('.privacy-toggle').trigger('click')
    await wrapper.get('.note-preview').trigger('click')
    expect(wrapper.get('.note-text').text()).toBe(item.notes)
    expect(wrapper.find('.note-text img').exists()).toBe(false)
    expect(wrapper.find('.note-text script').exists()).toBe(false)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await flushPromises()
    expect(wrapper.find('.note-text').exists()).toBe(false)
    await wrapper.get('.note-preview').trigger('click')
    await wrapper.get('.privacy-toggle').trigger('click')
    expect(wrapper.find('.note-text').exists()).toBe(false)
    expect(wrapper.html()).not.toContain('evil.test')
    await wrapper.get('.privacy-toggle').trigger('click')
    await wrapper.get('.note-preview').trigger('click')
    await wrapper.get('.search-wrap input').setValue('does not match')
    expect(wrapper.find('.note-text').exists()).toBe(false)
  })
  it('does not evaluate or coerce malformed structured metadata', () => {
    const malformed = { ...item, folderId: { toString: 'not callable' }, creationDate: { toString: 'not callable' }, fields: [{ name: 'Unknown', type: { toString: null } }], login: { ...item.login, uris: [{ uri: 'https://example.test', match: { toString: 'no evaluation' } }] } } as unknown as VaultItem
    const document = { ...doc, folders: [{ id: { toString: null }, name: 'Malformed' }] } as unknown as VaultExport
    expect(() => { wrapper = mount(ItemEditor, { props: { item: malformed, index: 0, document, privacy: false } }) }).not.toThrow()
    expect(wrapper!.text()).toContain('Structured value (see Raw JSON)')
  })
  it('renders notes as escaped textarea content, never HTML or external images', () => {
    wrapper = mount(ItemEditor, { props: { item, index: 0, document: doc, privacy: false } })
    const notes = wrapper.findAll('textarea').find(t => (t.element as HTMLTextAreaElement).value === item.notes)
    expect(notes).toBeDefined()
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('script').exists()).toBe(false)
    expect((notes!.element as HTMLTextAreaElement).value).toBe(item.notes)
    expect(notes!.element.children).toHaveLength(0)
  })
  it('hides passwords, TOTP, usernames, notes, and raw JSON in privacy mode', async () => {
    wrapper = mount(ItemEditor, { props: { item, index: 0, document: doc, privacy: true } })
    expect(wrapper.findAll('input[type="password"]')).toHaveLength(2)
    expect(wrapper.find('input[readonly]').attributes('value')).not.toBe('user@example.test')
    expect((wrapper.find('input[readonly]').element as HTMLInputElement).value).toBe('us••••••')
    expect(wrapper.find('[aria-label="Reveal password"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[aria-label="Copy password"]').attributes('disabled')).toBeDefined()
    for (const input of wrapper.findAll('input[type="password"]')) {
      expect((input.element as HTMLInputElement).value).toBe('••••••••')
      expect(input.attributes('readonly')).toBeDefined()
    }
    expect(wrapper.html()).not.toContain('old-secret')
    expect(wrapper.html()).not.toContain('totp-secret')
    expect(wrapper.html()).not.toContain('&lt;img')
    await wrapper.findAll('.editor-tabs button')[1]!.trigger('click')
    expect(wrapper.find('.code-input').exists()).toBe(false)
  })
  it('never saves DOM masks or custom values while privacy mode is on', async () => {
    const privateItem = { ...item, fields: [{ name: 'Token', value: 'custom-secret', type: 1 }, { name: 'Flag', value: 'true', type: 2 }] }
    wrapper = mount(ItemEditor, { props: { item: privateItem, index: 0, document: doc, privacy: true } })
    expect(wrapper.find('[aria-label="Custom field 1 value"]').attributes('readonly')).toBeDefined()
    expect(wrapper.html()).not.toContain('custom-secret')
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(1) // Only the non-secret favorite flag.
    for (const input of wrapper.findAll('input[readonly]')) await input.setValue('••••••••')
    await wrapper.findAll('input')[0]!.setValue('Renamed')
    await wrapper.find('.editor-footer .primary').trigger('click')
    const saved = wrapper.emitted('save')![0]![0] as VaultItem
    expect(saved.login).toEqual(item.login)
    expect(saved.fields).toEqual(privateItem.fields)
    await wrapper.setProps({ privacy: false })
    expect((wrapper.find('[aria-label="Custom field 1 value"]').element as HTMLInputElement).value).toBe('custom-secret')
    expect(wrapper.findAll('input').some(input => (input.element as HTMLInputElement).value === 'old-secret')).toBe(true)
    await wrapper.setProps({ privacy: true })
    expect(wrapper.html()).not.toContain('custom-secret')
    expect(wrapper.html()).not.toContain('old-secret')
  })
  it('resets reveals on item changes and builds audit messages without secret values', async () => {
    wrapper = mount(ItemEditor, { props: { item, index: 0, document: doc, privacy: false } })
    await wrapper.find('[aria-label="Reveal password"]').trigger('click')
    expect(wrapper.findAll('input').some(i => (i.element as HTMLInputElement).type === 'text' && (i.element as HTMLInputElement).value === 'old-secret')).toBe(true)
    const password = wrapper.findAll('input').find(i => (i.element as HTMLInputElement).value === 'old-secret')!
    await password.setValue('new-secret')
    await wrapper.find('.editor-footer .primary').trigger('click')
    const emitted = wrapper.emitted('save')![0]!
    expect(translate(emitted[1] as Message)).toBe('Item 1: password changed')
    expect(String(emitted[1])).not.toContain('new-secret')
    expect((emitted[0] as VaultItem).opaque).toEqual({ retain: true })
    expect((emitted[0] as VaultItem).login!.uris).toEqual(item.login!.uris)
    await wrapper.setProps({ item: { ...item, name: 'Next' } })
    expect(wrapper.find('[aria-label="Reveal password"]').exists()).toBe(true)
    expect(wrapper.findAll('input[type="password"]')).toHaveLength(2)
  })
  it('never applies invalid raw JSON and preserves unknown properties in valid JSON', async () => {
    wrapper = mount(ItemEditor, { props: { item, index: 0, document: doc, privacy: false } })
    await wrapper.findAll('.editor-tabs button')[1]!.trigger('click')
    await wrapper.find('.code-input').setValue('{"password":"secret-broken" oops}')
    await wrapper.find('.editor-footer .primary').trigger('click')
    expect(wrapper.emitted('save')).toBeUndefined()
    expect(wrapper.find('[role="alert"]').text()).not.toContain('secret-broken')
    await wrapper.find('.code-input').setValue(JSON.stringify({ ...item, future: 123 }))
    await wrapper.find('.editor-footer .primary').trigger('click')
    expect((wrapper.emitted('save')![0]![0] as VaultItem).future).toBe(123)
  })
  it('clears a formatting-only raw draft after apply and tracks subsequent edits', async () => {
    wrapper = mount(ItemEditor, { props: { item, index: 0, document: doc, privacy: false } })
    await wrapper.findAll('.editor-tabs button')[1]!.trigger('click')
    await wrapper.find('.code-input').setValue(JSON.stringify(item))
    expect(wrapper.emitted('dirty')!.at(-1)).toEqual([true])
    await wrapper.find('.editor-footer .primary').trigger('click')
    expect(wrapper.emitted('dirty')!.at(-1)).toEqual([false])
    await wrapper.find('.code-input').setValue(JSON.stringify({ ...item, name: 'Another edit' }))
    expect(wrapper.emitted('dirty')!.at(-1)).toEqual([true])
  })
})

describe('local-only architecture', () => {
  it('has no vault persistence, network calls, logging, dynamic imports, or vault HTML rendering', () => {
    const sources = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
      const path = resolve(directory, entry.name)
      return entry.isDirectory() ? sources(path) : /\.(ts|vue)$/.test(path) && !path.endsWith('.test.ts') && ![resolve('src/test.setup.ts'), resolve('src/preferences.ts')].includes(path) ? [readFileSync(path, 'utf8')] : []
    })
    const source = sources(resolve('src')).join('\n')
    for (const pattern of [/\bfetch\s*\(/, /\bXMLHttpRequest\b/, /\bWebSocket\b/, /\bEventSource\b/, /\bsendBeacon\b/, /\blocalStorage\b/, /\bsessionStorage\b/, /\bindexedDB\b/, /console\s*\./, /v-html/, /import\s*\(/]) expect(source).not.toMatch(pattern)
    // The only image is the trusted, locally imported brand mark; never vault-derived images.
    expect(source.match(/<img\b[^>]*>/g)).toEqual(['<img class="brand-mark" :src="vaultsortLogo" width="32" height="38" alt="" />'])
    expect(source).toContain("import vaultsortLogo from './branding/vaultsort-logo.svg'")
    const html = readFileSync('index.html', 'utf8')
    expect(html).toContain("connect-src 'none'")
    expect(html).toContain("form-action 'none'")
    expect(html).not.toMatch(/(?:src|href)="https?:/)
    expect(readFileSync('vite.config.ts', 'utf8')).toContain('hmr: false')
    expect(readFileSync('src/style.css', 'utf8').match(/url\s*\([^)]*\)/g)).toEqual(['url("./fonts/InterVariable.woff2")'])
    const preferences = readFileSync('src/preferences.ts', 'utf8')
    expect(preferences).toContain("key: 'language' | 'theme'")
    expect(preferences.match(/persist\('[^']+', value\)/g)).toEqual(["persist('language', value)", "persist('theme', value)"])
    expect(preferences).not.toMatch(/getItem|document\.cookie|indexedDB|JSON\.stringify/)
    const boot = readFileSync('public/preferences.js', 'utf8')
    expect(boot.match(/getItem\('[^']+'\)/g)).toEqual(["getItem('vaultsort.language')", "getItem('vaultsort.theme')"])
    expect(boot).not.toMatch(/setItem|document\.cookie|indexedDB/)
  })
})

describe('application workflow', () => {
  it('imports, edits, moves, validates, exports, undoes, and closes without persistence', async () => {
    const originalText = '\ufeff' + JSON.stringify(doc, null, 4) + '\n'
    const NativeFileReader = window.FileReader
    const encoded = new TextEncoder().encode(originalText)
    const bytes = new ArrayBuffer(encoded.byteLength)
    new Uint8Array(bytes).set(encoded)
    class LocalFileReader {
      result: ArrayBuffer | null = null
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      readAsArrayBuffer() { this.result = bytes; queueMicrotask(() => this.onload?.()) }
      abort() {}
    }
    vi.stubGlobal('FileReader', LocalFileReader)
    const createUrl = vi.fn((_blob: Blob) => 'blob:local')
    const revokeUrl = vi.fn()
    URL.createObjectURL = createUrl
    URL.revokeObjectURL = revokeUrl
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    wrapper = mount(App, { attachTo: document.body })
    expect(wrapper.text()).toContain('Your vault contains plaintext passwords.')
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [new File(['unused'], 'vault.json', { type: 'application/json' })] })
    await input.trigger('change')
    await flushPromises()
    expect(wrapper.find('dialog').text()).toContain('Your vault is ready')
    await wrapper.findAll('dialog .button')[0]!.trigger('click')
    expect(createUrl).toHaveBeenCalled()
    const blob = createUrl.mock.calls[0]![0] as unknown as Blob
    const readBlob = new NativeFileReader()
    const blobBytes = await new Promise<ArrayBuffer>(resolve => { readBlob.onload = () => resolve(readBlob.result as ArrayBuffer); readBlob.readAsArrayBuffer(blob) })
    expect(new TextDecoder().decode(blobBytes, { stream: false })).toBe(new TextDecoder().decode(bytes))
    expect(blob.size).toBe(bytes.byteLength)
    expect(new Uint8Array(blobBytes)).toEqual(new Uint8Array(bytes))
    await wrapper.find('dialog .primary').trigger('click')
    expect(wrapper.findAll('.item-table tbody tr')).toHaveLength(2)
    await wrapper.find('.privacy-toggle').trigger('click')
    await wrapper.find('.item-table .name-cell button').trigger('click')
    const editor = wrapper.findComponent(ItemEditor)
    const nameInput = editor.findAll('input')[0]!
    await nameInput.setValue('Renamed')
    await editor.find('.editor-footer .primary').trigger('click')
    expect(wrapper.find('.changes-button').text()).toBe('1 changes')
    expect(wrapper.find('.item-table').text()).toContain('Renamed')
    await wrapper.find('input[aria-label="Select all filtered items"]').setValue(true)
    await wrapper.find('[aria-label="Move selected items to folder"]').setValue('a')
    expect(wrapper.find('.changes-button').text()).toBe('2 changes')
    await wrapper.find('button[aria-label="Undo"]').trigger('click')
    expect(wrapper.find('.changes-button').text()).toBe('1 changes')
    await wrapper.find('.toolbar-actions .primary').trigger('click')
    expect(wrapper.find('dialog').text()).toContain('0 errors')
    expect(wrapper.findAll('dialog [role="tooltip"]').length).toBeGreaterThanOrEqual(2)
    for (const tip of wrapper.findAll('dialog [role="tooltip"]')) {
      expect(tip.text()).not.toContain('old-secret')
      expect(tip.text()).not.toContain('user@example.test')
      expect(tip.text()).not.toContain('evil.test')
    }
    await wrapper.find('dialog .primary').trigger('click')
    expect(createUrl).toHaveBeenCalledTimes(2)
    await wrapper.get('.original-copy').trigger('click')
    const originalReader = new NativeFileReader()
    const originalAfterEdits = await new Promise<ArrayBuffer>(resolve => { originalReader.onload = () => resolve(originalReader.result as ArrayBuffer); originalReader.readAsArrayBuffer(createUrl.mock.calls[2]![0] as unknown as Blob) })
    expect(new Uint8Array(originalAfterEdits)).toEqual(new Uint8Array(bytes))
    const closeButton = wrapper.findAll('.sidebar-footer button').find(button => button.text() === 'Close vault')!
    await closeButton.trigger('click')
    expect(wrapper.find('.workspace').exists()).toBe(false)
    expect(wrapper.find('.import-card').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Renamed')
    expect(revokeUrl).toHaveBeenCalled()
  })
})
