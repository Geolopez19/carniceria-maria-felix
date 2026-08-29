import { supabase } from '../lib/supabaseClient'
import { registrarMovimiento } from './inventarioMovimientos'

export async function listPurchases(options = {}) {
  const { limit = 50, offset = 0 } = typeof options === 'number'
    ? { limit: options }
    : options

  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data || []
}

export async function getPurchaseItems(purchaseId) {
  const { data, error } = await supabase
    .from('purchase_order_items')
    .select('*')
    .eq('purchase_id', purchaseId)
  if (error) throw error
  return data || []
}

export async function createDraftPurchase() {
  const { data, error } = await supabase
    .from('purchase_orders')
    .insert({ status: 'draft' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function upsertPurchaseItems(items) {
  const clean = items.map(i => ({
    id: i.id,
    purchase_id: i.purchase_id,
    product_id: i.product_id,
    product_name: i.product_name,
    qty: i.qty,
    unit_cost: i.unit_cost,
    line_total: i.line_total
  }))
  const { data, error } = await supabase
    .from('purchase_order_items')
    .upsert(clean)
    .select()
  if (error) throw error
  return data
}

export async function patchPurchase(purchaseId, patch) {
  const { data, error } = await supabase
    .from('purchase_orders')
    .update(patch)
    .eq('id', purchaseId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function finalizePurchase(purchaseId) {
  try {
    const { data, error } = await supabase.rpc('finalize_purchase_batch', {
      p_purchase_id: purchaseId
    })

    if (error) {
      console.warn('Función RPC no disponible, usando método antiguo:', error)
      return await finalizePurchaseLegacy(purchaseId)
    }

    const { data: purchase, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', purchaseId)
      .single()

    if (fetchError) throw fetchError
    return purchase
  } catch (error) {
    console.error('Error finalizando compra:', error)
    throw error
  }
}

async function finalizePurchaseLegacy(purchaseId) {
  const items = await getPurchaseItems(purchaseId)

  for (const item of items) {
    if (item.product_id && item.qty > 0) {
      const { data: producto } = await supabase
        .from('productos')
        .select('id, nombre, stock')
        .eq('id', item.product_id)
        .single()

      if (producto) {
        const stockAnterior = producto.stock || 0
        const stockNuevo = stockAnterior + item.qty

        await supabase
          .from('productos')
          .update({ stock: stockNuevo })
          .eq('id', item.product_id)

        await registrarMovimiento({
          producto_id: item.product_id,
          producto_nombre: item.product_name || producto.nombre,
          tipo: 'entrada',
          cantidad: item.qty,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          motivo: `Compra - Orden #${purchaseId}`
        })
      }
    }
  }

  const { data, error } = await supabase
    .from('purchase_orders')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', purchaseId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePurchase(purchaseId) {
  const { data, error } = await supabase
    .from('purchase_orders')
    .delete()
    .eq('id', purchaseId)
    .select()

  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('No se pudo eliminar la compra (verifique sus permisos).')
  }
}

export async function revertPurchaseToDraft(purchaseId) {
  const items = await getPurchaseItems(purchaseId)

  for (const item of items) {
    if (item.product_id && item.qty > 0) {
      const { data: producto, error: prodError } = await supabase
        .from('productos')
        .select('id, nombre, stock')
        .eq('id', item.product_id)
        .single()

      if (prodError || !producto) {
        console.error('Error al obtener producto para reversión:', item.product_id, prodError)
        continue
      }

      const stockAnterior = Number(producto.stock || 0)
      const qty = Number(item.qty)
      const stockNuevo = Math.max(0, stockAnterior - qty)

      // Actualizar stock
      const { error: updateError } = await supabase
        .from('productos')
        .update({ stock: stockNuevo })
        .eq('id', item.product_id)

      if (updateError) {
        console.error('Error actualizando stock:', updateError)
        throw updateError
      }

      // Registrar movimiento de salida
      try {
        await registrarMovimiento({
          producto_id: item.product_id,
          producto_nombre: item.product_name || producto.nombre,
          tipo: 'salida',
          cantidad: qty,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          motivo: `Reversión Compra - Orden #${purchaseId}`
        })
      } catch (movError) {
        console.warn('Error registrando movimiento de reversión:', movError)
      }
    }
  }

  // Cambiar estado a borrador
  const { data, error } = await supabase
    .from('purchase_orders')
    .update({ status: 'draft', completed_at: null })
    .eq('id', purchaseId)
    .select()
    .single()

  if (error) throw error
  return data
}




