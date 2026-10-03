import { ref, watch } from 'vue'
import { i18n, languages } from './i18n'

export const theme = ref(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
function persist(key: 'language' | 'theme', value: string) {
  try { localStorage.setItem(`vaultsort.${key}`, value) } catch { /* Preferences still work in memory. */ }
}
export function setLanguage(value: string) {
  if (!languages.some(language => language.code === value)) return
  i18n.global.locale.value = value as 'en' | 'ar'
  persist('language', value)
}
export function setTheme(value: string) {
  if (value !== 'light' && value !== 'dark') return
  theme.value = value
  persist('theme', value)
}
watch(i18n.global.locale, language => {
  document.documentElement.lang = language
  document.documentElement.dir = languages.find(entry => entry.code === language)!.direction
  document.title = i18n.global.t('app.title')
}, { immediate: true, flush: 'sync' })
watch(theme, value => {
  document.documentElement.dataset.theme = value
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = value === 'dark' ? '#020617' : '#f8fafc'
}, { immediate: true, flush: 'sync' })
