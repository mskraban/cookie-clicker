import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { inject } from '@vercel/analytics'
import App from './App.vue'
import './styles/main.scss'

inject() // Vercel Web Analytics: anonymous page views only

createApp(App).use(createPinia()).mount('#app')
