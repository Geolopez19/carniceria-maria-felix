import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toastTrigger = ref(null)

  function showSuccess(summary, detail = '') {
    toastTrigger.value = { severity: 'success', summary, detail, life: 3000 }
  }

  function showError(summary, detail = '') {
    toastTrigger.value = { severity: 'error', summary, detail, life: 5000 }
  }

  function showInfo(summary, detail = '') {
    toastTrigger.value = { severity: 'info', summary, detail, life: 3000 }
  }

  function showWarn(summary, detail = '') {
    toastTrigger.value = { severity: 'warn', summary, detail, life: 4000 }
  }

  return { toastTrigger, showSuccess, showError, showInfo, showWarn }
})
