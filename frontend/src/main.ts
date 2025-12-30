import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'
import { loadTheme } from './services/theme'

loadTheme()

const app = createApp(App)
app.use(router)
app.mount('#app')