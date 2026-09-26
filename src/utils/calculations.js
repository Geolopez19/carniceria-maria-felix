import { IVA_PORCENTAJE } from '../constants'

export function calculateOrderTotals(items, discountPercent = 0, posFeePercent = 0) {
  const subtotal = (items || []).reduce((acc, item) => {
    const qty = Number(item.qty) || 0
    const price = Number(item.unit_price) || 0
    const itemDiscount = Number(item.discount) || 0
    return acc + (qty * price - itemDiscount)
  }, 0)

  const pct = typeof discountPercent === 'number' ? Math.max(0, discountPercent) : 0
  const discount_total = subtotal * (pct / 100)
  const baseAfterDiscount = Math.max(0, subtotal - discount_total)

  const feePct = Math.max(0, Number(posFeePercent) || 0)
  const pos_fee_total = baseAfterDiscount * (feePct / 100)

  const tax_total = 0
  const total = baseAfterDiscount + pos_fee_total

  return {
    subtotal,
    discount_percent: pct,
    discount_total,
    tax_total,
    pos_fee_percent: feePct,
    pos_fee_total,
    total,
  }
}

export function calculatePurchaseTotal(items) {
  return items.reduce((acc, item) => acc + (Number(item.line_total) || 0), 0)
}

export function calculatePurchaseTotals(items) {
  return items.reduce((acc, item) => {
    const qty = Number(item.qty) || 0
    const cost = Number(item.unit_cost) || 0
    const base = qty * cost
    const tax = base * ((item.tax_rate || 0) / 100)
    
    acc.subtotal += base
    acc.tax_total += tax
    acc.total = acc.subtotal + acc.tax_total
    
    return acc
  }, { subtotal: 0, tax_total: 0, total: 0 })
}

export function calculateLineTotal(item) {
  const base = (item.qty || 0) * (item.unit_price || 0) - (item.discount || 0)
  const tax = base * ((item.tax_rate || 0) / 100)
  return base + tax
}

export function applyTax(price, taxRate = IVA_PORCENTAJE) {
  return price * (1 + taxRate / 100)
}

export function formatCurrency(amount, currency = 'C$', locale = 'es-NI') {
  return `${currency}${Number(amount || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

