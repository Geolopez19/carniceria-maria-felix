import { getActiveSupabase } from '../lib/supabaseClient'
import { registrarMovimiento } from './inventarioMovimientos'
import { crearLote, crearPaquete } from './paquetes'

export async function listPurchases(options = {}) {
  const supabase = getActiveSupabase()
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
  const supabase = getActiveSupabase()
  const { data, error } = await supabase
    .from('purchase_order_items')
    .select('*')
    .eq('purchase_id', purchaseId)
  if (error) throw error

  return (data || []).map(i => {
    let extra = {}
    if (i.paquetes_data) {
      try {
        extra = typeof i.paquetes_data === 'string' ? JSON.parse(i.paquetes_data) : i.paquetes_data
      } catch (e) {
        extra = {}
      }
    }
    return {
      ...i,
      tipo_ingreso: i.tipo_ingreso || extra.tipo_ingreso || 'granel',
      peso_caja: i.peso_caja ?? extra.peso_caja ?? null,
      codigo_lote: i.codigo_lote || extra.codigo_lote || null,
      paquetes_list: i.paquetes_list || extra.paquetes_list || []
    }
  })
}

export async function createDraftPurchase() {
  const supabase = getActiveSupabase()
  const { data, error } = await supabase
    .from('purchase_orders')
    .insert({ status: 'draft' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function upsertPurchaseItems(items) {
  if (!items || items.length === 0) return []
  const supabase = getActiveSupabase()

  // 1. Payload completo
  const fullPayload = items.map(i => ({
    id: i.id || crypto.randomUUID(),
    purchase_id: i.purchase_id,
    product_id: i.product_id,
    product_name: i.product_name,
    qty: Number(i.qty) || 1,
    unit_cost: Number(i.unit_cost) || 0,
    line_total: Number(i.line_total) || 0,
    tipo_ingreso: i.tipo_ingreso || 'granel',
    peso_caja: i.peso_caja ? Number(i.peso_caja) : null,
    codigo_lote: i.codigo_lote || null,
    paquetes_data: JSON.stringify({
      tipo_ingreso: i.tipo_ingreso || 'granel',
      peso_caja: i.peso_caja || null,
      codigo_lote: i.codigo_lote || null,
      paquetes_list: i.paquetes_list || []
    })
  }))

  try {
    const { data, error } = await supabase
      .from('purchase_order_items')
      .upsert(fullPayload)
      .select()

    if (!error && data) return data
    if (error) {
      console.warn('Upsert con metadatos falló, intentando con campos básicos:', error.message)
    }
  } catch (err) {
    console.warn('Excepción en upsert completo:', err.message)
  }

  // 2. Fallback con campos básicos
  const cleanPayload = items.map(i => ({
    id: i.id || crypto.randomUUID(),
    purchase_id: i.purchase_id,
    product_id: i.product_id,
    product_name: i.product_name,
    qty: Number(i.qty) || 1,
    unit_cost: Number(i.unit_cost) || 0,
    line_total: Number(i.line_total) || 0
  }))

  const { data: fallbackData, error: fallbackError } = await supabase
    .from('purchase_order_items')
    .upsert(cleanPayload)
    .select()

  if (fallbackError) {
    console.error('Error final en upsertPurchaseItems:', fallbackError)
    throw fallbackError
  }
  return fallbackData || []
}

export async function patchPurchase(purchaseId, patch) {
  const supabase = getActiveSupabase()
  
  // Filtrar solo campos existentes en purchase_orders para evitar error PGRST204
  const allowed = ['supplier_id', 'supplier_name', 'status', 'total', 'completed_at', 'created_at', 'created_by']
  const clean = {}
  for (const k of allowed) {
    if (patch[k] !== undefined) clean[k] = patch[k]
  }

  // Sanitizar supplier_id: debe ser un UUID válido o null
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!clean.supplier_id || typeof clean.supplier_id !== 'string' || !uuidRegex.test(clean.supplier_id.trim())) {
    clean.supplier_id = null
  } else {
    clean.supplier_id = clean.supplier_id.trim()
  }

  const { data, error } = await supabase
    .from('purchase_orders')
    .update(clean)
    .eq('id', purchaseId)
    .select()
    .single()
    
  if (error) {
    console.error('Error en patchPurchase:', error)
    throw error
  }
  return data
}

export async function finalizePurchase(purchaseId, memoryItems = null, customDate = null) {
  try {
    const supabase = getActiveSupabase()

    // 1. Candado de seguridad: verificar que no esté ya completada para evitar duplicar stock
    const { data: currentOrder, error: checkError } = await supabase
      .from('purchase_orders')
      .select('id, status')
      .eq('id', purchaseId)
      .single()

    if (checkError) throw checkError
    if (currentOrder && currentOrder.status === 'completed') {
      console.warn(`[compras] La orden ${purchaseId} ya fue finalizada previamente. Se previene duplicidad de stock.`)
      return currentOrder
    }

    // Si pasamos los items en memoria con su desglose de paquetes, los usamos prioritariamente
    let items = memoryItems
    if (!items || items.length === 0) {
      items = await getPurchaseItems(purchaseId)
    }

    for (const item of items) {
      if (!item.product_id || item.qty <= 0) continue

      // Actualizar el costo del producto al último costo de compra si es válido
      if (item.unit_cost && Number(item.unit_cost) > 0) {
        try {
          await supabase
            .from('productos')
            .update({ costo: Number(item.unit_cost) })
            .eq('id', item.product_id)
        } catch (cErr) {
          console.warn('⚠️ No se pudo actualizar el costo del producto:', cErr)
        }
      }

      const isPackage = item.tipo_ingreso === 'paquete' || (item.paquetes_list && item.paquetes_list.length > 0)

      if (isPackage) {
        // 1. Crear el Lote
        const loteCode = item.codigo_lote || `LOTE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`
        const pesoRecibido = Number(item.peso_caja || item.qty || 0)

        let lote = null
        try {
          lote = await crearLote({
            codigo_lote: loteCode,
            codigo_caja: item.codigo_caja || null,
            producto_id: item.product_id,
            peso_recibido: pesoRecibido
          })
        } catch (loteErr) {
          console.warn('Advertencia al crear lote (posible duplicado de código):', loteErr.message)
        }

        // 2. Crear los Paquetes individuales
        const pkgs = item.paquetes_list || []

        if (pkgs.length > 0) {
          for (const p of pkgs) {
            await crearPaquete({
              productoId: item.product_id,
              loteId: lote?.id || null,
              peso: Number(p.peso),
              precioPorUnidad: Number(item.unit_cost || 0),
              fechaEmpaque: p.fecha_empaque || new Date().toISOString(),
              fechaVencimiento: p.fecha_vencimiento || null,
              descontarGranel: false
            })
          }
        } else {
          await crearPaquete({
            productoId: item.product_id,
            loteId: lote?.id || null,
            peso: Number(item.peso_caja || item.qty),
            precioPorUnidad: Number(item.unit_cost || 0),
            fechaEmpaque: new Date().toISOString(),
            fechaVencimiento: null,
            descontarGranel: false
          })
        }

      } else {
        // Ingreso a Granel o por Pieza -> Cargar a stock
        const isMotoTech = (localStorage.getItem('active_company_id') === 'mototech')
        const selectQuery = isMotoTech ? 'id, nombre, stock' : 'id, nombre, stock, stock_granel'

        const { data: producto } = await supabase
          .from('productos')
          .select(selectQuery)
          .eq('id', item.product_id)
          .single()

        if (producto) {
          const stockAnterior = isMotoTech ? Number(producto.stock || 0) : Number(producto.stock_granel || producto.stock || 0)
          const stockNuevo = stockAnterior + Number(item.qty)

          const updatePayload = isMotoTech
            ? { stock: stockNuevo }
            : { stock_granel: stockNuevo, stock: stockNuevo }

          await supabase
            .from('productos')
            .update(updatePayload)
            .eq('id', item.product_id)

          const { data: productoActualizado } = await supabase
            .from('productos')
            .select('stock')
            .eq('id', item.product_id)
            .single()

          await registrarMovimiento({
            producto_id: item.product_id,
            producto_nombre: item.product_name || producto.nombre,
            tipo: 'entrada',
            cantidad: Number(item.qty),
            stock_anterior: producto.stock || 0,
            stock_nuevo: productoActualizado?.stock || stockNuevo,
            motivo: `Compra - Orden #${purchaseId}`
          })
        }
      }
    }

    // Marcar compra como completada
    const completedTimestamp = customDate ? new Date(customDate).toISOString() : new Date().toISOString()
    const { data, error } = await supabase
      .from('purchase_orders')
      .update({ 
        status: 'completed', 
        completed_at: completedTimestamp,
        created_at: completedTimestamp 
      })
      .eq('id', purchaseId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error finalizando compra:', error)
    throw error
  }
}

export async function deletePurchase(purchaseId) {
  const supabase = getActiveSupabase()
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
  const supabase = getActiveSupabase()
  const isMotoTech = (localStorage.getItem('active_company_id') === 'mototech')
  const selectQuery = isMotoTech ? 'id, nombre, stock' : 'id, nombre, stock, stock_granel'
  const items = await getPurchaseItems(purchaseId)

  for (const item of items) {
    if (item.product_id && item.qty > 0) {
      const { data: producto, error: prodError } = await supabase
        .from('productos')
        .select(selectQuery)
        .eq('id', item.product_id)
        .single()

      if (prodError || !producto) {
        console.error('Error al obtener producto para reversión:', item.product_id, prodError)
        continue
      }

      const stockAnterior = isMotoTech ? Number(producto.stock || 0) : Number(producto.stock_granel || producto.stock || 0)
      const qty = Number(item.qty)
      const stockNuevo = Math.max(0, stockAnterior - qty)

      // Actualizar stock
      const updatePayload = isMotoTech
        ? { stock: stockNuevo }
        : { stock_granel: stockNuevo, stock: stockNuevo }

      const { error: updateError } = await supabase
        .from('productos')
        .update(updatePayload)
        .eq('id', item.product_id)

      if (updateError) {
        console.error('Error actualizando stock:', updateError)
        throw updateError
      }

      // Obtener stock total actualizado
      const { data: prodActualizado } = await supabase
        .from('productos')
        .select('stock')
        .eq('id', item.product_id)
        .single()

      // Registrar movimiento de salida
      try {
        await registrarMovimiento({
          producto_id: item.product_id,
          producto_nombre: item.product_name || producto.nombre,
          tipo: 'salida',
          cantidad: qty,
          stock_anterior: producto.stock || 0,
          stock_nuevo: prodActualizado?.stock || 0,
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






