// Blocking head script: preferences apply before styles or the application can paint.
(() => {
  let language = 'en'
  let theme = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  try {
    const savedLanguage = localStorage.getItem('vaultsort.language')
    const savedTheme = localStorage.getItem('vaultsort.theme')
    if (savedLanguage === 'en' || savedLanguage === 'ar') language = savedLanguage
    if (savedTheme === 'light' || savedTheme === 'dark') theme = savedTheme
  } catch { /* Storage may be disabled; defaults still work. */ }
  document.documentElement.lang = language
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#020617' : '#f8fafc'
})()
