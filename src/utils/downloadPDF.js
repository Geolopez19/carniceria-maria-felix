import { useToastStore } from '../stores/toastStore'
import { getInvoicePDF } from './pdfGenerator'

export async function downloadInvoicePDF({ order, items, business }) {
  const toastStore = useToastStore()
  try {
    const pdf = await getInvoicePDF({ order, items, business })
    
    // Generar nombre de archivo
    const isFactura = String(order?.status || '').toLowerCase() === 'paid'
    const titulo = isFactura ? 'FACTURA' : 'OFERTA'
    const fileName = `${titulo}_${order.number || '000'}_${order.customer_name?.replace(/\s+/g, '_') || 'cliente'}.pdf`
    
    pdf.save(fileName)
    return Promise.resolve()
  } catch (error) {
    console.error('Error al descargar PDF:', error)
    toastStore.showError('Error PDF', error.message)
    return Promise.reject(error)
  }
}
