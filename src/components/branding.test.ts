import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import App from '../App.vue'
import vaultsortLogo from '../branding/vaultsort-logo.svg'

describe('local branding and design system', () => {
  it('uses the supplied logo unchanged, with its aspect ratio and accessible link', () => {
    const wrapper = mount(App)
    try {
      const logo = wrapper.get('.brand-mark')
      expect(logo.attributes('src')).toBe(vaultsortLogo)
      expect(logo.attributes('alt')).toBe('')
      expect(wrapper.get('.brand').attributes('aria-label')).toBe('Vaultsort home')
      expect(createHash('sha256').update(readFileSync('src/branding/vaultsort-logo.svg')).digest('hex')).toBe('30a42a0f31ff1bcad46abf65ce09bf9c95fc51da98d2abd0eaabb6c934720cba')
    } finally { wrapper.unmount() }
  })

  it('integrates favicon assets once, using Vite and manifest-relative paths', () => {
    expect(existsSync('assets')).toBe(false)
    const html = readFileSync('index.html', 'utf8')
    for (const file of ['favicon-96x96.png', 'favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'site.webmanifest']) {
      expect(html.match(new RegExp(`href="%BASE_URL%${file.replaceAll('.', '\\.')}"`, 'g'))).toHaveLength(1)
      expect(existsSync(`public/${file}`)).toBe(true)
    }
    expect(html).not.toContain('data:image/svg+xml')
    expect(html).toContain("manifest-src 'self'")
    expect(html).toContain("connect-src 'none'")
    const manifest = JSON.parse(readFileSync('public/site.webmanifest', 'utf8'))
    expect(manifest.name).toBe('Vaultsort')
    expect(manifest.start_url).toBe('./')
    expect(manifest.scope).toBe('./')
    expect(manifest.icons).toHaveLength(2)
    for (const icon of manifest.icons) {
      expect(icon.src).toMatch(/^\.\/web-app-manifest-(192x192|512x512)\.png$/)
      expect(existsSync(`public/${icon.src}`)).toBe(true)
    }
    expect(readFileSync('public/favicon.svg', 'utf8')).toContain('prefers-color-scheme: dark')
  })

  it('bundles licensed Inter and keeps light/dark, focus, and reduced-motion styles centralized', () => {
    const css = readFileSync('src/style.css', 'utf8')
    expect(css).toContain('url("./fonts/InterVariable.woff2")')
    expect(readFileSync('src/fonts/InterVariable.woff2').subarray(0, 4).toString()).toBe('wOF2')
    expect(readFileSync('public/fonts/OFL.txt', 'utf8')).toContain('SIL OPEN FONT LICENSE Version 1.1')
    for (const rule of [':root[data-theme="dark"]', 'prefers-reduced-motion: reduce', ':focus-visible', '--bg-selected: #e0f2fe', '--brand: #0284c7', '--text-muted: #64748b']) expect(css).toContain(rule)
    expect(readFileSync('AGENTS.md', 'utf8')).toContain('docs/design-system.md')
    expect(readFileSync('docs/design-system.md', 'utf8')).toContain('Vaultsort Design System')
  })
})
