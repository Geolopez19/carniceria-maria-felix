import { useToastStore } from '../stores/toastStore'
import { getInvoicePDF } from './pdfGenerator'

export async function printInvoice({ order, items, business }) {
  const toastStore = useToastStore()
  try {
    const pdf = await getInvoicePDF({ order, items, business })
    
    // Auto impresión: abre la ventana de impresión automáticamente
    pdf.autoPrint()
    
    const blobUrl = pdf.output('bloburl')
    window.open(blobUrl, '_blank')
    
    return Promise.resolve()
  } catch (error) {
    console.error('Error en printInvoice:', error)
    toastStore.showError('Error de Impresión', error.message)
    return Promise.reject(error)
  }
}

