import { supabase } from '../lib/supabaseClient'

export async function getPaquetesByProducto(productoId) {
  if (!productoId) return []
  const { data, error } = await supabase
    .from('paquetes')
    .select('*')
    .eq('producto_id', productoId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching packages for product:', error.message)
    throw error
  }
  return data || []
}

export async function getLotesByProducto(productoId) {
  if (!productoId) return []
  const { data, error } = await supabase
    .from('lotes')
    .select('*')
    .eq('producto_id', productoId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching lots for product:', error.message)
    throw error
  }
  return data || []
}

export async function crearLote(lote) {
  if (!lote.codigo_lote || !lote.producto_id || !lote.peso_recibido) {
    throw new Error('Código de lote, producto y peso recibido son requeridos')
  }

  const { data, error } = await supabase
    .from('lotes')
    .insert([{
      codigo_lote: lote.codigo_lote.trim(),
      codigo_caja: lote.codigo_caja?.trim() || null,
      producto_id: lote.producto_id,
      peso_recibido: Number(lote.peso_recibido)
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating lot:', error.message)
    throw error
  }
  return data
}

export async function crearPaquete({ productoId, loteId, peso, precioPorUnidad, fechaEmpaque, fechaVencimiento, descontarGranel = true }) {
  if (!productoId || !peso || !precioPorUnidad) {
    throw new Error('Producto, peso y precio por unidad son requeridos')
  }

  const { data, error } = await supabase.rpc('fn_crear_paquete', {
    p_producto_id: productoId,
    p_lote_id: loteId || null,
    p_peso: Number(peso),
    p_precio_por_unidad: Number(precioPorUnidad),
    p_fecha_empaque: fechaEmpaque || null,
    p_fecha_vencimiento: fechaVencimiento || null,
    p_descontar_granel: descontarGranel
  })

  if (error) {
    console.error('Error calling fn_crear_paquete RPC:', error.message)
    throw error
  }
  return data
}

export async function registrarMermaPaquete(paqueteId, motivo) {
  if (!paqueteId) throw new Error('ID de paquete es requerido')

  const { data, error } = await supabase.rpc('fn_registrar_merma_paquete', {
    p_paquete_id: paqueteId,
    p_motivo: motivo?.trim() || null
  })

  if (error) {
    console.error('Error calling fn_registrar_merma_paquete RPC:', error.message)
    throw error
  }
  return data
}

export async function getPaqueteByCodigo(codigoBarras) {
  if (!codigoBarras) return null
  const cleanCode = codigoBarras.trim()
  
  const { data, error } = await supabase
    .from('paquetes')
    .select('*, producto:productos(nombre, codigo, unidad_medida)')
    .eq('codigo_barras', cleanCode)
    .maybeSingle()

  if (error) {
    console.error('Error fetching package by barcode:', error.message)
    throw error
  }
  return data
}

export async function getDetalleVentaPaquete(paqueteId) {
  if (!paqueteId) return null
  
  const { data, error } = await supabase
    .from('sales_order_items')
    .select('qty, unit_price, order:sales_orders(invoice_number, paid_at, created_at, status)')
    .eq('package_id', paqueteId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching package sale detail:', error.message)
    throw error
  }
  return data
}

export async function updatePaquetePrecio(paqueteId, { precioPorUnidad, precioTotal }) {
  if (!paqueteId) throw new Error('ID de paquete es requerido')
  const unitPrice = Number(precioPorUnidad)
  const total = precioTotal !== undefined ? Number(precioTotal) : null

  const updatePayload = {
    precio_por_unidad: unitPrice
  }
  if (total !== null && !isNaN(total)) {
    updatePayload.precio_total = total
  }

  const { data, error } = await supabase
    .from('paquetes')
    .update(updatePayload)
    .eq('id', paqueteId)
    .eq('estado', 'DISPONIBLE')
    .select()
    .single()

  if (error) {
    console.error('Error updating package price:', error.message)
    throw error
  }
  return data
}

export async function actualizarPreciosPaquetesProducto(productoId, nuevoPrecioPorUnidad) {
  if (!productoId) throw new Error('ID de producto es requerido')
  const unitPrice = Number(nuevoPrecioPorUnidad)
  if (isNaN(unitPrice) || unitPrice <= 0) {
    throw new Error('El precio por unidad debe ser un número mayor a cero')
  }

  // 1. Obtener todos los paquetes disponibles de este producto
  const { data: paquetesDisponibles, error: fetchError } = await supabase
    .from('paquetes')
    .select('id, peso')
    .eq('producto_id', productoId)
    .eq('estado', 'DISPONIBLE')

  if (fetchError) {
    console.error('Error fetching available packages:', fetchError.message)
    throw fetchError
  }

  if (!paquetesDisponibles || paquetesDisponibles.length === 0) {
    return { count: 0, updated: [] }
  }

  // 2. Actualizar cada paquete disponible con su nuevo precio_total = round(peso * unitPrice, 2)
  const updatePromises = paquetesDisponibles.map(pkg => {
    const nuevoTotal = Number((Number(pkg.peso) * unitPrice).toFixed(2))
    return supabase
      .from('paquetes')
      .update({
        precio_por_unidad: unitPrice,
        precio_total: nuevoTotal
      })
      .eq('id', pkg.id)
      .eq('estado', 'DISPONIBLE')
  })

  const results = await Promise.all(updatePromises)
  const failed = results.filter(r => r.error)
  if (failed.length > 0) {
    console.error('Some packages failed to update:', failed)
    throw new Error(`Ocurrió un error al actualizar algunos paquetes (${failed.length} fallos)`)
  }

  return { count: paquetesDisponibles.length }
}

export async function updatePaqueteCodigo(paqueteId, customCode) {
  if (!paqueteId || !customCode) return null
  const { data, error } = await supabase
    .from('paquetes')
    .update({ codigo_barras: customCode.trim() })
    .eq('id', paqueteId)
    .select()
    .single()

  if (error) {
    console.warn('Error updating package code:', error.message)
    return null
  }
  return data
}
