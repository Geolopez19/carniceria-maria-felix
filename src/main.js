import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import router from './router'
import App from './App.vue'

import './index.css'
import 'primeicons/primeicons.css'



try {
  const app = createApp(App)

  app.use(createPinia())
  app.use(router)
  app.use(VueQueryPlugin)
  app.use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
        prefix: 'p',
        darkModeSelector: '.none',
        cssLayer: false
      }
    }
  })
  app.use(ConfirmationService)
  app.use(ToastService)
  app.directive('tooltip', Tooltip)

  app.mount('#app')

} catch (error) {
  console.error('--- Error al montar App Vue:', error)
}
