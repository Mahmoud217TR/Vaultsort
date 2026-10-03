import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import ar from './locales/ar.json'

export const languages = [{ code: 'en', direction: 'ltr' }, { code: 'ar', direction: 'rtl' }] as const
export const i18n = createI18n({
  legacy: false,
  locale: document.documentElement.lang === 'ar' ? 'ar' : 'en',
  fallbackLocale: 'en',
  messages: { en, ar },
})

// Store message keys, not rendered text, so open notices and history translate on switching.
export interface Message { key: string; params?: Record<string, string | number>; fields?: string[] }
export function translate(message: Message | string): string {
  if (typeof message === 'string') return i18n.global.t(message)
  const params = { ...message.params }
  if (typeof params.count === 'number') params.count = new Intl.NumberFormat(i18n.global.locale.value).format(params.count)
  if (typeof params.index === 'number') params.index = new Intl.NumberFormat(i18n.global.locale.value).format(params.index)
  if (message.fields) params.fields = message.fields.map(key => i18n.global.t(key)).join(i18n.global.t('common.listSeparator'))
  return typeof message.params?.count === 'number' ? i18n.global.t(message.key, params, message.params.count) : i18n.global.t(message.key, params)
}
export function errorMessage(error: unknown, fallback: string): Message {
  const key = error instanceof Error ? error.message : ''
  // Never expose arbitrary native errors: JSON/DOM errors can quote private values.
  return { key: key.startsWith('errors.') && i18n.global.te(key, 'en') ? key : fallback }
}
