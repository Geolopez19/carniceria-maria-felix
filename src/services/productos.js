import { supabase } from '../lib/supabaseClient'
import { registrarMovimiento } from './inventarioMovimientos'

export async function getProductos({
  search = '',
  orderBy = 'created_at',
  ascending = false,
  limit = null,
  offset = 0,
  categoria = null
} = {}) {
  let query = supabase
    .from('productos')
    .select('*', { count: 'exact' })

  if (search) {
    query = query.ilike('nombre', `%${search}%`)
  }

  if (categoria) {
    query = query.eq('categoria', categoria)
  }

  query = query.order(orderBy, { ascending })

  if (limit) {
    query = query.range(offset, offset + limit - 1)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('❌ Error al obtener productos:', error.message)
    throw error
  }

  return {
    data: data || [],
    total: count || 0
  }
}

export async function addProducto(producto) {
  if (!producto.nombre) throw new Error('El producto debe tener nombre')

  const { data, error } = await supabase
    .from('productos')
    .insert([{
      nombre: producto.nombre.trim(),
      codigo: producto.codigo?.trim() || null,
      categoria: producto.categoria?.trim() || null,
      stock: producto.stock ? Number(producto.stock) : 0,
      precio: producto.precio ? Number(producto.precio) : 0,
      descripcion: producto.descripcion?.trim() || null
    }])
    .select()

  if (error) {
    console.error('❌ Error al agregar producto:', error.message)
    throw error
  }

  const productoCreado = data?.[0]

  if (productoCreado && productoCreado.stock > 0) {
    try {
      await registrarMovimiento({
        producto_id: productoCreado.id,
        producto_nombre: productoCreado.nombre,
        tipo: 'entrada',
        cantidad: productoCreado.stock,
        stock_anterior: 0,
        stock_nuevo: productoCreado.stock,
        motivo: 'Ingreso inicial'
      })
    } catch (err) {
      console.warn('⚠️ No se pudo registrar el movimiento:', err)
    }
  }

  return productoCreado
}

export async function updateProducto(id, producto) {
  if (!id) throw new Error('ID no válido para actualización')

  const { data: productoAnterior } = await supabase
    .from('productos')
    .select('stock, nombre')
    .eq('id', id)
    .single()

  const stockAnterior = productoAnterior?.stock || 0
  const stockNuevo = producto.stock ? Number(producto.stock) : 0
  const diferencia = stockNuevo - stockAnterior

  const { data, error } = await supabase
    .from('productos')
    .update({
      nombre: producto.nombre?.trim(),
      codigo: producto.codigo?.trim() || null,
      categoria: producto.categoria?.trim(),
      stock: stockNuevo,
      precio: producto.precio ? Number(producto.precio) : 0,
      descripcion: producto.descripcion?.trim() || null
    })
    .eq('id', id)
    .select()

  if (error) {
    console.error('❌ Error al actualizar producto:', error.message)
    throw error
  }

  const productoActualizado = data?.[0]

  if (diferencia !== 0 && productoActualizado) {
    try {
      await registrarMovimiento({
        producto_id: id,
        producto_nombre: productoActualizado.nombre,
        tipo: diferencia > 0 ? 'entrada' : 'salida',
        cantidad: Math.abs(diferencia),
        stock_anterior: stockAnterior,
        stock_nuevo: stockNuevo,
        motivo: diferencia > 0 ? 'Ajuste de inventario (entrada)' : 'Ajuste de inventario (salida)'
      })
    } catch (err) {
      console.warn('⚠️ No se pudo registrar el movimiento:', err)
    }
  }

  return productoActualizado
}

export async function deleteProducto(id) {
  if (!id) throw new Error('ID no válido para eliminación')

  const { data: producto } = await supabase
    .from('productos')
    .select('id, nombre, stock')
    .eq('id', id)
    .single()

  const { data: deletedData, error, count } = await supabase
    .from('productos')
    .delete({ count: 'exact' })
    .eq('id', id)
    .select()

  if (error) {
    console.error('❌ Error al eliminar producto:', error.message)
    throw error
  }

  // Checking if actual deletion happened (RLS might return success but count 0)
  if (!deletedData || deletedData.length === 0) {
    throw new Error('No tienes permisos para eliminar este producto o el producto no existe.')
  }

  if (producto && producto.stock > 0) {
    try {
      await registrarMovimiento({
        producto_id: id,
        producto_nombre: producto.nombre,
        tipo: 'salida',
        cantidad: producto.stock,
        stock_anterior: producto.stock,
        stock_nuevo: 0,
        motivo: 'Producto eliminado'
      })
    } catch (err) {
      console.warn('⚠️ No se pudo registrar el movimiento:', err)
    }
  }

  return true
}

