import { createApp } from 'vue'
import App from './App.vue'
import { router } from './app/router'
import '@fontsource-variable/manrope'
import '@fontsource-variable/playfair-display'
import './styles/main.css'
import './styles/mobile-layout.css'
import './styles/charades.css'

createApp(App).use(router).mount('#app')
