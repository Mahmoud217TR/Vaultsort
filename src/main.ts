import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { i18n } from './i18n'
import './preferences'

createApp(App).use(i18n).mount('#app')
