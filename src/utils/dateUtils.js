/**
 * Utilidad para el manejo correcto de zonas horarias (Nicaragua / Centroamérica UTC-6)
 */

/**
 * Parsea una fecha asegurando que las marcas de tiempo UTC se conviertan correctamente
 * a la hora local sin desfasarse al día siguiente.
 */
export function parseDate(dateInput) {
  if (!dateInput) return null
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput

  let str = String(dateInput).trim()

  // Si es formato solo fecha "YYYY-MM-DD", construir en fecha local
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  // Si viene de Postgres/Supabase como ISO sin 'Z' ni offset "+00", agregar 'Z' (UTC)
  if (!str.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
    str = str.replace(' ', 'T') + 'Z'
  }

  const d = new Date(str)
  return isNaN(d.getTime()) ? new Date(dateInput) : d
}

/**
 * Formatea fecha y hora completa en formato local nicaragüense (ej: 15 sep 2026, 07:29 PM)
 */
export function formatDateTime(dateInput, options = {}) {
  const d = parseDate(dateInput)
  if (!d) return ''

  try {
    if (options.dateStyle || options.timeStyle) {
      return d.toLocaleString('es-NI', options)
    }

    const defaultOpts = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      ...options,
    }
    return d.toLocaleString('es-NI', defaultOpts)
  } catch (err) {
    console.warn('Error formatting date:', err)
    return d.toLocaleString('es-NI')
  }
}

/**
 * Formatea solo fecha (ej: 15/09/2026)
 */
export function formatDateOnly(dateInput, options = {}) {
  const d = parseDate(dateInput)
  if (!d) return ''

  try {
    if (options.dateStyle) {
      return d.toLocaleDateString('es-NI', options)
    }
    return d.toLocaleDateString('es-NI', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...options,
    })
  } catch (err) {
    return d.toLocaleDateString('es-NI')
  }
}

/**
 * Obtiene la fecha actual en formato local YYYY-MM-DD (sin desfase UTC)
 */
export function getLocalDateString(dateInput = new Date()) {
  const d = parseDate(dateInput) || new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
