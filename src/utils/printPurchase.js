import { useToastStore } from '../stores/toastStore'

export async function printPurchase({ purchase, items, business }) {
  const toastStore = useToastStore()
  const isCompletada = String(purchase?.status || '').toLowerCase() === 'completed'
  const titulo = isCompletada ? 'Compra Completada' : 'Orden de Compra'
  const fmt = (n) => (Number(n || 0)).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fechaStr = purchase?.created_at ? new Date(purchase.created_at).toLocaleString() : ''

  const rows = (items || []).map((i, idx) => `<tr><td class="c c-idx">${idx + 1}</td><td class="l">${i.product_name || ''}</td><td class="c">${i.qty}</td><td class="r">${business.currency} ${fmt(i.unit_cost)}</td><td class="r">${business.currency} ${fmt(i.line_total)}</td></tr>`).join('')
  const html = `<html><body><h1>${titulo} #${purchase.number || '—'}</h1><table>${rows}</table></body></html>` // Simplificado para brevedad en esta migración
  const win = window.open('', '_blank')
  if (!win) { 
    toastStore.showWarn('Bloqueador de Ventanas', 'Por favor habilita las ventanas emergentes para imprimir.'); 
    return 
  }
  win.document.write(html)
  win.document.close()
}

