import { supabase } from '../lib/supabaseClient'
import { registrarMovimiento } from './inventarioMovimientos'

export async function listOffers(options = {}) {
  const { limit = 50, offset = 0 } = typeof options === 'number' ? { limit: options } : options
  const { data, error } = await supabase.from('sales_orders').select('*').order('created_at', { ascending: false }).range(offset, offset + limit - 1)
  if (error) throw error
  return data || []
}

export async function getOrderItems(orderId) {
  const { data, error } = await supabase.from('sales_order_items').select('*').eq('order_id', orderId)
  if (error) throw error
  return data || []
}

export async function createDraftOrder() {
  const { data, error } = await supabase.from('sales_orders').insert({ status: 'draft' }).select().single()
  if (error) throw error
  return data
}

export async function upsertItems(items) {
  const clean = items.map(i => ({ id: i.id, order_id: i.order_id, product_id: i.product_id, product_name: i.product_name, qty: i.qty, unit_price: i.unit_price, discount: i.discount || 0, tax_rate: i.tax_rate || 0, line_total: i.line_total }))
  const { data, error } = await supabase.from('sales_order_items').upsert(clean).select()
  if (error) throw error
  return data
}

export async function patchOrder(orderId, patch) {
  const { data, error } = await supabase.from('sales_orders').update(patch).eq('id', orderId).select().single()
  if (error) throw error
  return data
}

export async function searchProducts(q, limit = 8) {
  const { data, error } = await supabase.from('productos').select('id,nombre,precio,stock').ilike('nombre', `%${q}%`).limit(limit)
  if (error) throw error
  return data || []
}

export async function deleteItem(itemId) {
  const { error } = await supabase.from('sales_order_items').delete().eq('id', itemId)
  if (error) throw error
}

export async function deleteOrder(orderId) {
  const { data, error } = await supabase.from('sales_orders').delete().eq('id', orderId).select()
  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('No se pudo eliminar la factura (verifique sus permisos).')
  }
}

export async function finalizeOrder(orderId) {
  const { data, error } = await supabase.rpc('fn_finalize_order', { p_order_id: orderId })
  if (error) throw error
  try {
    const items = await getOrderItems(orderId)
    for (const item of items) {
      if (item.product_id && item.qty > 0) {
        const { data: producto } = await supabase.from('productos').select('stock, nombre').eq('id', item.product_id).single()
        if (producto) {
          const stockAnterior = producto.stock + item.qty
          const stockNuevo = producto.stock
          await registrarMovimiento({ producto_id: item.product_id, producto_nombre: item.product_name || producto.nombre, tipo: 'salida', cantidad: item.qty, stock_anterior: stockAnterior, stock_nuevo: stockNuevo, motivo: `Venta - Factura #${data?.invoice_number || orderId}` })
        }
      }
    }
  } catch (err) { console.warn(err) }
  return data
}

export async function cancelOrder(orderId) {
  const { data, error } = await supabase.rpc('fn_cancel_order', { p_order_id: orderId })
  if (error) throw error
  return data
}

