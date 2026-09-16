import { getActiveSupabase } from '../lib/supabaseClient'

/**
 * Servicio para la gestión de Apartados y Abonos en JyG MotoTech (schema: mototech)
 */

export async function listApartados({ limit = 100, status = 'all' } = {}) {
  const supabase = getActiveSupabase()
  let query = supabase
    .from('apartados')
    .select(`
      *,
      items:apartados_items(*),
      abonos:apartados_abonos(*)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getApartadoById(id) {
  const supabase = getActiveSupabase()
  const { data, error } = await supabase
    .from('apartados')
    .select(`
      *,
      items:apartados_items(*),
      abonos:apartados_abonos(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function crearApartado({
  customerId,
  customerName,
  customerPhone,
  fechaLimite,
  numeroPlazos = 3,
  notas,
  items,
  primaMonto = 0,
  paymentMethod = 'efectivo',
  amountReceived = 0,
  changeGiven = 0
}) {
  const supabase = getActiveSupabase()
  const { data, error } = await supabase.rpc('fn_crear_apartado', {
    p_customer_id: customerId,
    p_customer_name: customerName,
    p_customer_phone: customerPhone,
    p_fecha_limite: fechaLimite,
    p_notas: notas,
    p_items: items,
    p_prima_monto: primaMonto,
    p_payment_method: paymentMethod,
    p_amount_received: amountReceived,
    p_change_given: changeGiven
  })

  if (error) throw error
  return data
}

export async function registrarAbono({
  apartadoId,
  monto,
  paymentMethod = 'efectivo',
  amountReceived = 0,
  changeGiven = 0,
  notas = null,
  fechaAbono = null
}) {
  const supabase = getActiveSupabase()
  const { data, error } = await supabase.rpc('fn_registrar_abono', {
    p_apartado_id: apartadoId,
    p_monto: monto,
    p_payment_method: paymentMethod,
    p_amount_received: amountReceived,
    p_change_given: changeGiven,
    p_notas: notas
  })

  if (error) throw error

  // Si se especificó una fecha personalizada para el abono, actualizar el registro insertado
  if (fechaAbono && data?.abono?.id) {
    try {
      const fechaIso = new Date(fechaAbono.includes('T') ? fechaAbono : `${fechaAbono}T12:00:00`).toISOString()
      await supabase
        .from('apartados_abonos')
        .update({ created_at: fechaIso })
        .eq('id', data.abono.id)
      data.abono.created_at = fechaIso
    } catch (e) {
      console.warn('Error actualizando fecha del abono:', e)
    }
  }

  return data
}

export async function cancelarApartado(apartadoId, motivo = 'Cancelado por cliente') {
  const supabase = getActiveSupabase()
  const { data, error } = await supabase.rpc('fn_cancelar_apartado', {
    p_apartado_id: apartadoId,
    p_motivo: motivo
  })

  if (error) throw error
  return data
}

export async function marcarEntregado(apartadoId) {
  const supabase = getActiveSupabase()

  // 1. Obtener datos completos del apartado con sus items
  const { data: apt, error: aptErr } = await supabase
    .from('apartados')
    .select('*, items:apartados_items(*)')
    .eq('id', apartadoId)
    .single()

  if (aptErr) throw aptErr

  // 2. Actualizar estado del apartado a 'entregado'
  const { data: updatedApt, error } = await supabase
    .from('apartados')
    .update({ 
      status: 'entregado', 
      saldo_pendiente: 0,
      total_abonado: apt.total,
      entregado_at: new Date().toISOString() 
    })
    .eq('id', apartadoId)
    .select()
    .single()

  if (error) throw error

  // 3. Registrar como Venta Facturada en sales_orders si aún no está registrada
  try {
    const { data: saleOrder, error: saleErr } = await supabase
      .from('sales_orders')
      .insert({
        customer_id: apt.customer_id || null,
        customer_name: `${apt.customer_name} (Apartado ${apt.codigo_apartado || 'AP'})`,
        status: 'paid',
        subtotal: Number(apt.total || 0),
        discount: 0,
        tax: 0,
        total: Number(apt.total || 0),
        paid_at: new Date().toISOString()
      })
      .select()
      .single()

    if (!saleErr && saleOrder && apt.items?.length > 0) {
      const orderItems = apt.items.map(item => ({
        order_id: saleOrder.id,
        product_id: item.product_id || null,
        product_name: item.product_name,
        qty: Number(item.qty || 1),
        unit_price: Number(item.unit_price || 0),
        discount: 0,
        tax_rate: 0,
        line_total: Number(item.line_total || 0)
      }))

      await supabase.from('sales_order_items').insert(orderItems)
    }
  } catch (saleError) {
    console.warn('Advertencia al registrar venta de apartado en sales_orders:', saleError)
  }

  return updatedApt
}

export async function actualizarApartado({
  apartadoId,
  customerName,
  customerPhone,
  fechaLimite,
  numeroPlazos = 3,
  notas,
  items
}) {
  const supabase = getActiveSupabase()

  // 1. Obtener apartado actual con sus items
  const { data: aptActual, error: fetchErr } = await supabase
    .from('apartados')
    .select('*, items:apartados_items(*)')
    .eq('id', apartadoId)
    .single()

  if (fetchErr) throw fetchErr

  const oldItems = aptActual.items || []

  // 2. Gestionar ajuste de inventario para cascos/accesorios
  for (const oldIt of oldItems) {
    if (!oldIt.product_id) continue
    const matchingNew = items.find(n => n.product_id === oldIt.product_id)
    if (!matchingNew) {
      // Producto eliminado del apartado -> Reincorporar al stock
      const { data: prod } = await supabase.from('productos').select('id, nombre, stock').eq('id', oldIt.product_id).single()
      if (prod) {
        const nuevoStock = Number(prod.stock || 0) + Number(oldIt.qty || 0)
        await supabase.from('productos').update({ stock: nuevoStock }).eq('id', prod.id)
        await supabase.from('inventario_movimientos').insert({
          producto_id: prod.id,
          producto_nombre: prod.nombre,
          tipo: 'entrada',
          cantidad: Number(oldIt.qty || 0),
          stock_anterior: prod.stock || 0,
          stock_nuevo: nuevoStock,
          motivo: `Devolución a stock por modificación de Apartado #${aptActual.codigo_apartado}`
        })
      }
    } else if (Number(matchingNew.qty) < Number(oldIt.qty)) {
      // Se redujo la cantidad -> Devolver la diferencia al stock
      const diff = Number(oldIt.qty) - Number(matchingNew.qty)
      const { data: prod } = await supabase.from('productos').select('id, nombre, stock').eq('id', oldIt.product_id).single()
      if (prod) {
        const nuevoStock = Number(prod.stock || 0) + diff
        await supabase.from('productos').update({ stock: nuevoStock }).eq('id', prod.id)
        await supabase.from('inventario_movimientos').insert({
          producto_id: prod.id,
          producto_nombre: prod.nombre,
          tipo: 'entrada',
          cantidad: diff,
          stock_anterior: prod.stock || 0,
          stock_nuevo: nuevoStock,
          motivo: `Devolución de ${diff} unid. por modificación de Apartado #${aptActual.codigo_apartado}`
        })
      }
    }
  }

  for (const newIt of items) {
    if (!newIt.product_id) continue
    const matchingOld = oldItems.find(o => o.product_id === newIt.product_id)
    if (!matchingOld) {
      // Nuevo producto agregado -> Descontar del stock
      const { data: prod } = await supabase.from('productos').select('id, nombre, stock').eq('id', newIt.product_id).single()
      if (prod) {
        const nuevoStock = Number(prod.stock || 0) - Number(newIt.qty || 0)
        await supabase.from('productos').update({ stock: nuevoStock }).eq('id', prod.id)
        await supabase.from('inventario_movimientos').insert({
          producto_id: prod.id,
          producto_nombre: prod.nombre,
          tipo: 'salida',
          cantidad: Number(newIt.qty || 0),
          stock_anterior: prod.stock || 0,
          stock_nuevo: nuevoStock,
          motivo: `Reserva por adición a Apartado #${aptActual.codigo_apartado}`
        })
      }
    } else if (Number(newIt.qty) > Number(matchingOld.qty)) {
      // Se aumentó la cantidad -> Descontar la diferencia adicional
      const diff = Number(newIt.qty) - Number(matchingOld.qty)
      const { data: prod } = await supabase.from('productos').select('id, nombre, stock').eq('id', newIt.product_id).single()
      if (prod) {
        const nuevoStock = Number(prod.stock || 0) - diff
        await supabase.from('productos').update({ stock: nuevoStock }).eq('id', prod.id)
        await supabase.from('inventario_movimientos').insert({
          producto_id: prod.id,
          producto_nombre: prod.nombre,
          tipo: 'salida',
          cantidad: diff,
          stock_anterior: prod.stock || 0,
          stock_nuevo: nuevoStock,
          motivo: `Reserva adicional de ${diff} unid. en Apartado #${aptActual.codigo_apartado}`
        })
      }
    }
  }

  // 3. Reemplazar items en apartados_items
  await supabase.from('apartados_items').delete().eq('apartado_id', apartadoId)

  const itemsToInsert = items.map(i => ({
    apartado_id: apartadoId,
    product_id: i.product_id || null,
    product_name: i.product_name,
    qty: Number(i.qty || 1),
    unit_price: Number(i.unit_price || 0),
    line_total: Number(i.qty || 1) * Number(i.unit_price || 0)
  }))

  const { error: insErr } = await supabase.from('apartados_items').insert(itemsToInsert)
  if (insErr) throw insErr

  // 4. Recalcular total y saldos
  const newTotal = itemsToInsert.reduce((sum, it) => sum + it.line_total, 0)
  const totalAbonado = Number(aptActual.total_abonado || 0)
  const newSaldoPendiente = Math.max(0, newTotal - totalAbonado)

  let newStatus = aptActual.status
  if (newStatus === 'activo' && newSaldoPendiente <= 0 && newTotal > 0) {
    newStatus = 'liquidado'
  } else if (newStatus === 'liquidado' && newSaldoPendiente > 0) {
    newStatus = 'activo'
  }

  // 5. Actualizar encabezado del apartado
  const updatePayload = {
    customer_name: customerName,
    customer_phone: customerPhone,
    fecha_limite: fechaLimite,
    notas: notas,
    total: newTotal,
    saldo_pendiente: newSaldoPendiente,
    status: newStatus,
    updated_at: new Date().toISOString()
  }

  const { data: updatedApt, error: updErr } = await supabase
    .from('apartados')
    .update(updatePayload)
    .eq('id', apartadoId)
    .select('*, items:apartados_items(*), abonos:apartados_abonos(*)')
    .single()

  if (updErr) throw updErr
  return updatedApt
}
