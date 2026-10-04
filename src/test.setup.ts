import { beforeEach, vi } from 'vitest'
import { config } from '@vue/test-utils'
import { i18n } from './i18n'
import { theme } from './preferences'

config.global.plugins = [i18n]
beforeEach(() => {
  vi.unstubAllEnvs()
  i18n.global.locale.value = 'en'
  theme.value = 'light'
  localStorage.clear()
  sessionStorage.clear()
})
