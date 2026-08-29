import { supabase } from '../lib/supabaseClient'

export async function registrarMovimiento({ producto_id, producto_nombre, tipo, cantidad, stock_anterior, stock_nuevo, motivo = null }) {
  try {
    const { data, error } = await supabase
      .from('inventario_movimientos')
      .insert([{
        producto_id,
        producto_nombre,
        tipo,
        cantidad: Math.abs(cantidad),
        stock_anterior,
        stock_nuevo,
        motivo: motivo || null
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('⚠️ Tabla inventario_movimientos no existe. Ejecuta el SQL de creación primero.')
        return null
      }
      console.error('❌ Error al registrar movimiento:', error.message)
      throw error
    }

    return data
  } catch (err) {
    console.warn('⚠️ No se pudo registrar el movimiento:', err.message || err)
    return null
  }
}

export async function getHistorialMovimientos({ producto_id = null, limit = 100 } = {}) {
  try {
    let query = supabase
      .from('inventario_movimientos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (producto_id) {
      query = query.eq('producto_id', producto_id)
    }

    const { data, error } = await query

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('⚠️ Tabla inventario_movimientos no existe. Ejecuta el SQL de creación primero.')
        return []
      }
      console.error('❌ Error al obtener historial:', error.message)
      throw error
    }

    return data || []
  } catch (err) {
    console.warn('⚠️ No se pudo obtener el historial:', err.message || err)
    return []
  }
}

