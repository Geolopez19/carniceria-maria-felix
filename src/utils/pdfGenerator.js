/**
 * Generates the Invoice/Offer PDF using jsPDF.
 * Returns the jsPDF object (does not save it).
 */
export async function getInvoicePDF({ order, items, business }) {
  // Dynamic import for Lazy Loading (Carga Perezosa)
  const { jsPDF } = await import('jspdf')

  // Colores del tema Emerald
  const PRIMARY_COLOR = [5, 150, 105] // #059669 (emerald-600)
  const LIGHT_BG = [236, 253, 245]    // #ecfdf5 (emerald-50)
  const TEXT_GRAY = [75, 85, 99]      // #4b5563 (gray-600)
  const TEXT_DARK = [17, 24, 39]      // #111827 (gray-900)

  const isFactura = String(order?.status || '').toLowerCase() === 'paid'
  const titulo = isFactura ? 'FACTURA' : 'OFERTA'
  const fmt = (n) => (Number(n || 0)).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // Crear nuevo PDF (A4 size)
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.width

  // --- HEADER ---
  // Fondo superior
  pdf.setFillColor(...PRIMARY_COLOR)
  pdf.rect(0, 0, pageWidth, 55, 'F')

  // Nombre del Negocio (Blanco)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(22)
  pdf.setTextColor(255, 255, 255)
  pdf.text(business.name, 20, 18)

  // Info del Negocio (Blanco transp.)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(236, 253, 245) // emerald-50
  pdf.text(business.address, 20, 26)

  // RUC y Tel
  let yInfo = 31
  if (business.ruc) {
    pdf.text(`RUC: ${business.ruc}`, 20, yInfo)
    yInfo += 5
  }
  pdf.text(`Tel: ${business.phone}`, 20, yInfo)
  yInfo += 5

  if (business.email) {
    pdf.text(business.email, 20, yInfo)
    yInfo += 5
  }
  if (business.website) {
    pdf.text(business.website, 20, yInfo)
    yInfo += 5
  }

  // Título del Doc (Derecha, Blanco)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(24) // Más grande
  pdf.setTextColor(255, 255, 255)
  pdf.text(titulo, pageWidth - 20, 18, { align: 'right' })

  // Número y Fecha (Box blanco flotante)
  pdf.setFillColor(255, 255, 255)
  pdf.roundedRect(pageWidth - 70, 25, 50, 20, 3, 3, 'F')

  pdf.setTextColor(...PRIMARY_COLOR)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`# ${order.number || '---'}`, pageWidth - 45, 33, { align: 'center' })

  pdf.setTextColor(...TEXT_GRAY)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  const fecha = new Date(order.created_at).toLocaleDateString('es-NI', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
  pdf.text(fecha, pageWidth - 45, 40, { align: 'center' })

  // --- INFO CLIENTE ---
  let yPos = 70
  pdf.setTextColor(...PRIMARY_COLOR)
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.text('FACTURAR A:', 20, yPos)

  yPos += 7
  pdf.setTextColor(...TEXT_DARK)
  pdf.setFontSize(12)
  pdf.text(order.customer_name || 'Consumidor Final', 20, yPos)

  if (order.customer_phone) {
    yPos += 6
    pdf.setTextColor(...TEXT_GRAY)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Tel: ${order.customer_phone}`, 20, yPos)
  }

  // --- TABLA PRODUCTOS ---
  yPos = 95

  // Header Tabla
  pdf.setFillColor(...PRIMARY_COLOR)
  pdf.rect(20, yPos, 170, 10, 'F')

  pdf.setTextColor(255, 255, 255) // Texto blanco
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text('#', 23, yPos + 6.5)
  pdf.text('DESCRIPCIÓN', 35, yPos + 6.5)
  pdf.text('CANT', 120, yPos + 6.5, { align: 'center' })
  pdf.text('PRECIO', 145, yPos + 6.5, { align: 'right' })
  pdf.text('TOTAL', 185, yPos + 6.5, { align: 'right' })

  yPos += 14

  // Rows
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(...TEXT_DARK)

  items.forEach((item, idx) => {
    // Página nueva
    if (yPos > 240) {
      pdf.addPage()
      yPos = 30
      // Header simple en nueva pag
      pdf.setFillColor(...PRIMARY_COLOR)
      pdf.rect(20, yPos, 170, 10, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.text('CONT...', 23, yPos + 6.5)
      yPos += 14
      pdf.setTextColor(...TEXT_DARK)
      pdf.setFont('helvetica', 'normal')
    }

    // Zebra striping
    if (idx % 2 === 1) {
      pdf.setFillColor(...LIGHT_BG)
      pdf.rect(20, yPos - 4, 170, 8, 'F')
    }

    pdf.text(`${idx + 1}`, 23, yPos + 1.5)

    const productName = item.product_name || ''
    if (productName.length > 45) {
      pdf.text(productName.substring(0, 42) + '...', 35, yPos + 1.5)
    } else {
      pdf.text(productName, 35, yPos + 1.5)
    }

    pdf.text(`${item.qty || 0}`, 120, yPos + 1.5, { align: 'center' })
    pdf.text(fmt(item.unit_price), 145, yPos + 1.5, { align: 'right' })
    pdf.text(fmt(item.line_total), 185, yPos + 1.5, { align: 'right' })

    yPos += 8
  })

  // --- TOTALES ---
  yPos += 5
  const startTotalsX = 110
  const endTotalsX = 190

  // Linea separadora total
  pdf.setDrawColor(...PRIMARY_COLOR)
  pdf.setLineWidth(0.5)
  pdf.line(startTotalsX, yPos, endTotalsX, yPos)
  yPos += 7

  pdf.setFontSize(10)

  // Subtotal
  pdf.setTextColor(...TEXT_GRAY)
  pdf.text('Subtotal:', 140, yPos, { align: 'right' })
  pdf.setTextColor(...TEXT_DARK)
  pdf.text(`${business.currency} ${fmt(order.subtotal)}`, 185, yPos, { align: 'right' })
  yPos += 6

  // Impuestos
  pdf.setTextColor(...TEXT_GRAY)
  pdf.text('Impuestos:', 140, yPos, { align: 'right' })
  pdf.setTextColor(...TEXT_DARK)
  pdf.text(`${business.currency} ${fmt(order.tax_total)}`, 185, yPos, { align: 'right' })
  yPos += 8

  // Total Final (Resaltado)
  pdf.setFillColor(...PRIMARY_COLOR)
  pdf.roundedRect(startTotalsX, yPos - 6, endTotalsX - startTotalsX, 10, 2, 2, 'F')

  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.text('TOTAL:', 140, yPos, { align: 'right' })
  pdf.text(`${business.currency} ${fmt(order.total)}`, 185, yPos, { align: 'right' })

  // --- NOTAS ---
  if (order.notes) {
    yPos += 20
    if (yPos > 260) {
      pdf.addPage()
      yPos = 30
    }

    pdf.setTextColor(...PRIMARY_COLOR)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text('OBSERVACIONES:', 20, yPos)
    yPos += 5

    pdf.setTextColor(...TEXT_GRAY)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(9)
    const lines = pdf.splitTextToSize(order.notes, 170)
    pdf.text(lines, 20, yPos)
  }

  // --- FOOTER ---
  const pageCount = pdf.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(156, 163, 175) // gray-400

    pdf.text(`Gracias por su preferencia`, pageWidth / 2, 285, { align: 'center' })
    pdf.text(`Página ${i} de ${pageCount}`, pageWidth / 2, 290, { align: 'center' })
  }

  return pdf
}
