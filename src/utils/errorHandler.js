import { ERROR_MESSAGES } from '../constants'
import { useToastStore } from '../stores/toastStore'

export function handleError(error, customMessage = null) {
  const toastStore = useToastStore()
  let message = customMessage || ERROR_MESSAGES.LOAD_ERROR
  if (error instanceof Error) message = error.message || message
  else if (typeof error === 'string') message = error
  if (error?.code === 'PGRST116' || error?.message?.includes('does not exist')) message = 'El recurso no existe'
  else if (error?.code === '23505' || error?.message?.includes('duplicate')) message = 'Ya existe un registro con estos datos'
  else if (error?.code === '23503' || error?.message?.includes('foreign key')) message = 'No se puede eliminar porque está en uso'
  else if (error?.code === '42501' || error?.message?.includes('permission')) message = ERROR_MESSAGES.UNAUTHORIZED
  
  toastStore.showError('Error', message)
  if (import.meta.env.DEV) console.error('Error:', error)
}

export function showSuccess(message) {
  const toastStore = useToastStore()
  toastStore.showSuccess('Éxito', message)
}

export function showWarning(message) {
  const toastStore = useToastStore()
  toastStore.showWarn('Advertencia', message)
}

