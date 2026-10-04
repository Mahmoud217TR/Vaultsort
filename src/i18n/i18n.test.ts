import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { parse as parseSfc } from '@vue/compiler-sfc'
import { parse, type TemplateChildNode } from '@vue/compiler-dom'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import App from '../App.vue'
import { i18n, errorMessage, translate } from './index'
import { setLanguage, setTheme, theme } from '../preferences'
import { typeName, scalar, validateVault } from '../domain/vault'
import en from './locales/en.json'
import ar from './locales/ar.json'

let wrapper: VueWrapper | undefined
afterEach(() => { wrapper?.unmount(); wrapper = undefined; vi.restoreAllMocks(); vi.unstubAllGlobals() })

function flatten(value: object, prefix = ''): Record<string, string> {
  return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof entry === 'string' ? [[path, entry]] : Object.entries(flatten(entry, path))
  }))
}

describe('locale coverage', () => {
  it('has matching keys and interpolation parameters, and renders every message in both languages', () => {
    const english = flatten(en), arabic = flatten(ar)
    expect(Object.keys(arabic).sort()).toEqual(Object.keys(english).sort())
    for (const [key, message] of Object.entries(english)) {
      const placeholders = (value: string) => [...new Set(value.match(/\{\w+\}/g))].sort()
      expect(placeholders(arabic[key]!)).toEqual(placeholders(message))
      expect(arabic[key]!.trim()).not.toBe('')
      for (const locale of ['en', 'ar'] as const) {
        i18n.global.locale.value = locale
        expect(i18n.global.t(key, { count: 3, index: 1, fields: 'x', name: 'x', type: 'x', path: 'x', rule: 'x', start: 1, end: 3, total: 3, current: 1 })).not.toBe(key)
      }
    }
  })

  it('has no hardcoded UI text or accessible labels in Vue templates', () => {
    for (const file of ['src/App.vue', 'src/components/ItemEditor.vue', 'src/components/ReviewPanel.vue', 'src/components/DuplicateComparison.vue', 'src/components/Modal.vue', 'src/components/Icon.vue']) {
      const template = parseSfc(readFileSync(file, 'utf8')).descriptor.template!.content
      const visit = (node: TemplateChildNode) => {
        if (node.type === 2) expect(node.content.trim(), file).toBe('')
        if (node.type === 1) {
          for (const prop of node.props) if (prop.type === 6 && ['aria-label', 'placeholder', 'title', 'alt'].includes(prop.name)) expect(prop.value?.content ?? '', file).toBe('')
          node.children.forEach(visit)
        }
      }
      parse(template).children.forEach(visit)
    }
  })
})

describe('pre-paint preference restoration', () => {
  const boot = readFileSync('public/preferences.js', 'utf8')
  function restore(saved: Record<string, string>, systemDark = false, blocked: boolean | string = false) {
    const root = { lang: '', dir: '', dataset: {} as Record<string, string> }
    const meta = { content: '' }
    runInNewContext(boot, {
      matchMedia: () => ({ matches: systemDark }),
      localStorage: { getItem: (key: string) => { if (blocked === true || blocked === key) throw new Error('blocked'); return saved[key] ?? null } },
      document: { documentElement: root, querySelector: () => meta },
    })
    return { root, meta }
  }
  it.each(['light', 'dark'])('restores Arabic and saved %s before application execution', savedTheme => {
    const { root, meta } = restore({ 'vaultsort.language': 'ar', 'vaultsort.theme': savedTheme }, savedTheme === 'light')
    expect(root).toMatchObject({ lang: 'ar', dir: 'rtl', dataset: { theme: savedTheme } })
    expect(meta.content).toBe(savedTheme === 'dark' ? '#020617' : '#f8fafc')
    const html = readFileSync('index.html', 'utf8')
    const script = html.match(/<script src="\/preferences\.js"><\/script>/)!
    expect(script).not.toBeNull()
    expect(html.indexOf(script[0])).toBeLessThan(html.indexOf('<link'))
    expect(html.indexOf(script[0])).toBeLessThan(html.indexOf('type="module"'))
    expect(html).toContain("script-src 'self'")
    expect(html).toContain("connect-src 'none'")
  })
  it('defaults to English and native theme, validates preferences, and tolerates unavailable storage', () => {
    expect(restore({}, true).root).toMatchObject({ lang: 'en', dir: 'ltr', dataset: { theme: 'dark' } })
    expect(restore({ 'vaultsort.language': 'invalid', 'vaultsort.theme': 'invalid' }).root).toMatchObject({ lang: 'en', dir: 'ltr', dataset: { theme: 'light' } })
    expect(restore({}, true, true).root).toMatchObject({ lang: 'en', dir: 'ltr', dataset: { theme: 'dark' } })
    expect(() => setLanguage('invalid')).not.toThrow()
    expect(() => setTheme('invalid')).not.toThrow()
    expect(localStorage.length).toBe(0)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    expect(() => { setLanguage('ar'); setTheme('dark') }).not.toThrow()
    expect(document.documentElement.dir).toBe('rtl')
    expect(theme.value).toBe('dark')
  })
  it('restores valid preferences independently when the other read fails', () => {
    const saved = { 'vaultsort.language': 'ar', 'vaultsort.theme': 'dark' }
    expect(restore(saved, false, 'vaultsort.language').root).toMatchObject({ lang: 'en', dataset: { theme: 'dark' } })
    expect(restore(saved, false, 'vaultsort.theme').root).toMatchObject({ lang: 'ar', dataset: { theme: 'light' } })
    expect(restore({ ...saved, 'vaultsort.language': 'invalid' }).root).toMatchObject({ lang: 'en', dataset: { theme: 'dark' } })
    expect(restore({ ...saved, 'vaultsort.theme': 'invalid' }).root).toMatchObject({ lang: 'ar', dataset: { theme: 'light' } })
    for (const language of ['en', 'ar']) for (const value of ['light', 'dark']) expect(restore({ 'vaultsort.language': language, 'vaultsort.theme': value }).root).toMatchObject({ lang: language, dir: language === 'ar' ? 'rtl' : 'ltr', dataset: { theme: value } })
  })
})

describe('language and theme combinations', () => {
  it.each([['en', 'light'], ['en', 'dark'], ['ar', 'light'], ['ar', 'dark']])('localizes export/comparison and existing resolution messages in %s / %s with only preference storage', async (language, selectedTheme) => {
    const source = { encrypted: false, folders: [{ id: 'f', name: 'Work' }], items: [0, 1].map(index => ({ type: 1, name: 'Synthetic same', folderId: 'f', login: { username: 'synthetic', password: `synthetic-private-${index}`, uris: [{ uri: 'https://example.test' }] } })) }
    const encoded = new TextEncoder().encode(JSON.stringify(source)), bytes = new ArrayBuffer(encoded.length)
    new Uint8Array(bytes).set(encoded)
    class Reader {
      result = bytes
      onload: (() => void) | null = null
      readAsArrayBuffer() { queueMicrotask(() => this.onload?.()) }
      abort() {}
    }
    vi.stubGlobal('FileReader', Reader); vi.spyOn(window, 'confirm').mockReturnValue(true)
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
    setLanguage(language); setTheme(selectedTheme)
    wrapper = mount(App, { attachTo: document.body })
    Object.defineProperty(wrapper.get('input[type=file]').element, 'files', { value: [new File([''], 'synthetic.json')] })
    await wrapper.get('input[type=file]').trigger('change'); await flushPromises(); await wrapper.get('dialog .primary').trigger('click')
    await wrapper.get('tbody input[type=checkbox]').setValue(true); await wrapper.get('.export-selected').trigger('click')
    expect(wrapper.get('dialog').text()).toContain(i18n.global.t('export.filename'))
    await wrapper.get('#export-filename').setValue('CON.json')
    expect(wrapper.get('#export-filename-error').text()).toBe(i18n.global.t('export.reservedFilename'))
    await wrapper.get('dialog footer .button').trigger('click')
    await wrapper.get('.review-nav').trigger('click'); await wrapper.get('.compare-group').trigger('click')
    expect(wrapper.get('.comparison-back').text()).toBe(i18n.global.t('comparison.back'))
    expect(wrapper.get('.duplicate-comparison').text()).not.toContain('synthetic-private-')
    await wrapper.get('.ignore-group').trigger('click'); await wrapper.get('.restore-groups').trigger('click'); await wrapper.get('.compare-group').trigger('click')
    await wrapper.get('.rename-candidate').trigger('click'); await wrapper.get('.comparison-name-input').setValue('اسم اصطناعي')
    await wrapper.get('.comparison-name-form .primary').trigger('click')
    expect(wrapper.get('[role=status]').text()).toContain(i18n.global.t('comparison.renamed'))
    setLanguage(language === 'ar' ? 'en' : 'ar'); await flushPromises()
    expect(wrapper.get('[role=status]').text()).toContain(i18n.global.t('comparison.renamed'))
    await wrapper.get('.changes-button').trigger('click')
    expect(wrapper.get('.change-list').text()).toContain(translate({ key: 'audit.item', params: { index: 1 }, fields: ['audit.name'] }))
    expect(localStorage.length).toBe(2)
    expect(Object.keys(localStorage).sort()).toEqual(['vaultsort.language', 'vaultsort.theme'])
    expect(source.items[0]!.name).toBe('Synthetic same')
  })
  it('uses the canonical theme tokens and logical RTL layout rules', () => {
    const css = readFileSync('src/style.css', 'utf8')
    const style = document.createElement('style')
    style.textContent = css.match(/:root(?:\[data-theme="dark"\])? \{[\s\S]*?\n\}/g)!.join('\n')
    document.head.append(style)
    try {
      for (const language of ['en', 'ar']) for (const value of ['light', 'dark']) {
        setLanguage(language); setTheme(value)
        const computed = getComputedStyle(document.documentElement)
        expect(computed.getPropertyValue('--bg-app').trim()).toBe(value === 'dark' ? '#020617' : '#f8fafc')
        expect(computed.getPropertyValue('--text-primary').trim()).toBe(value === 'dark' ? '#f8fafc' : '#0f172a')
        expect(computed.colorScheme).toBe(value)
      }
      expect(css).not.toMatch(/(?:padding|margin|border)-(?:left|right)\s*:/)
      expect(css).toContain('border-inline-end: 1px solid var(--border-default)')
      expect(css).toContain('border-inline-start: 1px solid var(--border-default)')
      expect(css).toContain('inset-inline-end: 0')
      expect(css).toContain('text-align: start')
      expect(css).toContain(':root[dir="rtl"] .directional-icon > path { transform: scaleX(-1)')
      expect(css).toContain('kbd, .code-input { direction: ltr; unicode-bidi: isolate')
    } finally { style.remove() }
  })

  it.each([['en', 'light'], ['en', 'dark'], ['ar', 'light'], ['ar', 'dark']])('works in %s / %s without changing or storing vault contents', async (language, selectedTheme) => {
    const source = { encrypted: false, folders: [{ id: 'a', name: 'Work/العمل' }], items: [{ type: 1, name: 'Example', folderId: 'a', login: { username: 'user@example.test', password: 'private-password', totp: 'private-totp', uris: [{ uri: 'https://example.test' }] }, notes: 'private-notes', unknown: { retain: true } }], unknown: { keep: 42 } }
    const encoded = new TextEncoder().encode(JSON.stringify(source))
    const bytes = new ArrayBuffer(encoded.byteLength)
    new Uint8Array(bytes).set(encoded)
    class Reader {
      result = bytes
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      readAsArrayBuffer() { queueMicrotask(() => this.onload?.()) }
      abort() {}
    }
    vi.stubGlobal('FileReader', Reader)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
    wrapper = mount(App, { attachTo: document.body })
    expect(wrapper.text()).toContain(en.import.title)
    await wrapper.get('[aria-label="Language"]').setValue(language)
    await wrapper.get(`[aria-label="${i18n.global.t('app.theme')}"]`).setValue(selectedTheme)
    expect(document.documentElement.lang).toBe(language)
    expect(document.documentElement.dir).toBe(language === 'ar' ? 'rtl' : 'ltr')
    expect(document.documentElement.dataset.theme).toBe(selectedTheme)
    expect(document.title).toBe(i18n.global.t('app.title'))
    expect(wrapper.text()).toContain(i18n.global.t('import.title'))
    const input = wrapper.get('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [new File([''], 'synthetic.json')] })
    await input.trigger('change'); await flushPromises()
    expect(wrapper.find('dialog').exists()).toBe(true)
    expect(wrapper.get('dialog').text()).toContain(i18n.global.t('import.ready'))
    await wrapper.get('dialog .primary').trigger('click')
    expect(wrapper.get('.item-table th:nth-child(3)').text()).toBe(i18n.global.t('workspace.nameColumn'))
    await wrapper.get('.item-table .name-cell button').trigger('click')
    expect(wrapper.get('.item-editor').attributes('aria-label')).toBe(i18n.global.t('editor.label'))
    expect(wrapper.html()).not.toContain('private-password')
    expect(wrapper.html()).not.toContain('private-totp')
    expect(wrapper.html()).not.toContain('private-notes')
    expect(wrapper.get('.uri-input input').attributes('dir')).toBe('ltr')
    expect(wrapper.get('.editor-section input').attributes('dir')).toBe('auto')
    await wrapper.get('.editor-section input').setValue('اسم جديد')
    await wrapper.get('.editor-footer .primary').trigger('click')
    await wrapper.get('.changes-button').trigger('click')
    expect(wrapper.get('.change-list').text()).toContain(translate({ key: 'audit.item', params: { index: 1 }, fields: ['audit.name'] }))
    setLanguage(language === 'ar' ? 'en' : 'ar')
    await flushPromises()
    expect(wrapper.get('.change-list').text()).toContain(translate({ key: 'audit.item', params: { index: 1 }, fields: ['audit.name'] }))
    await wrapper.get('.modal-header .icon-button').trigger('click')
    await wrapper.get('.review-nav').trigger('click')
    await wrapper.get('.review-tabs button:nth-child(2)').trigger('click')
    expect(wrapper.get('.review-content').text()).toContain(i18n.global.t('validation.unknown'))
    expect(typeName(1)).toBe(i18n.global.t('common.login'))
    expect(scalar({})).toBe(i18n.global.t('common.structured'))
    expect(validateVault(source).every(issue => i18n.global.te(issue.message, 'ar'))).toBe(true)
    await wrapper.findAll('.sidebar-footer button').find(button => button.text() === i18n.global.t('nav.close'))!.trigger('click')
    expect(wrapper.find('.workspace').exists()).toBe(false)
    expect(localStorage.length).toBe(2)
    expect(localStorage.getItem('vaultsort.language')).toBe(language === 'ar' ? 'en' : 'ar')
    expect(localStorage.getItem('vaultsort.theme')).toBe(selectedTheme)
    expect(JSON.stringify(source)).toContain('private-password')
    expect(source.items[0]!.name).toBe('Example')
    expect(errorMessage(new Error('private-password'), 'errors.apply')).toEqual({ key: 'errors.apply' })
  })
})
