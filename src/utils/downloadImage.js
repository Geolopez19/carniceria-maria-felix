import html2canvas from 'html2canvas'
import { showSuccess, handleError } from './errorHandler'

/**
 * Convierte un elemento HTML en imagen PNG de alta resolución y lo descarga.
 * Sanitiza automáticamente cualquier función de color moderna (oklch, lab, color-mix)
 * que no sea soportada nativamente por el parser de html2canvas.
 * 
 * @param {HTMLElement} element - Elemento DOM a capturar
 * @param {string} fileName - Nombre del archivo PNG de salida
 */
export async function downloadElementAsImage(element, fileName = 'comprobante.png') {
  if (!element) {
    handleError(new Error('No se encontró el elemento para generar la imagen'))
    return
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2.5, // Alta resolución para nitidez
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#0f172a',
      windowWidth: element.scrollWidth || 440,
      windowHeight: element.scrollHeight || 750,
      onclone: (clonedDoc) => {
        // Sanitizar todas las etiquetas <style> para evitar errores con funciones oklch()
        const styleTags = clonedDoc.querySelectorAll('style')
        styleTags.forEach((styleTag) => {
          if (styleTag.innerHTML && styleTag.innerHTML.includes('oklch')) {
            styleTag.innerHTML = styleTag.innerHTML.replace(/oklch\([^)]+\)/g, '#d97706')
          }
        })

        // Sanitizar elementos inline y atributos style
        const allClonedElements = clonedDoc.querySelectorAll('*')
        allClonedElements.forEach((el) => {
          const styleAttr = el.getAttribute('style')
          if (styleAttr && styleAttr.includes('oklch')) {
            el.setAttribute('style', styleAttr.replace(/oklch\([^)]+\)/g, '#d97706'))
          }
        })
      },
    })

    const imageURL = canvas.toDataURL('image/png', 1.0)
    const link = document.createElement('a')
    link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`
    link.href = imageURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showSuccess('Comprobante descargado como imagen con éxito')
    return imageURL
  } catch (err) {
    console.error('Error al capturar imagen:', err)
    handleError(err, 'No se pudo descargar la imagen del comprobante')
    throw err
  }
}
