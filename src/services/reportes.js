import { supabase } from '../lib/supabaseClient'

export async function getVentasPorFecha(fechaInicio, fechaFin) {
  let query = supabase
    .from('sales_orders')
    .select('*')
    .eq('status', 'paid')
  
  const { data: testData } = await supabase
    .from('sales_orders')
    .select('paid_at')
    .eq('status', 'paid')
    .limit(1)
  
  const tienePaidAt = testData && testData.length > 0 && testData[0].paid_at
  
  if (tienePaidAt) {
    query = query.gte('paid_at', fechaInicio).lte('paid_at', fechaFin).order('paid_at', { ascending: false })
  } else {
    query = query.gte('created_at', fechaInicio).lte('created_at', fechaFin).order('created_at', { ascending: false })
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data || []
}

export async function getComprasPorFecha(fechaInicio, fechaFin) {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('status', 'completed')
    .gte('completed_at', fechaInicio)
    .lte('completed_at', fechaFin)
    .order('completed_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getItemsVentasPorFecha(fechaInicio, fechaFin) {
  const { data: testData } = await supabase
    .from('sales_orders')
    .select('paid_at')
    .eq('status', 'paid')
    .limit(1)
  
  const tienePaidAt = testData && testData.length > 0 && testData[0].paid_at
  
  let ordersQuery = supabase
    .from('sales_orders')
    .select('id')
    .eq('status', 'paid')
  
  if (tienePaidAt) {
    ordersQuery = ordersQuery.gte('paid_at', fechaInicio).lte('paid_at', fechaFin)
  } else {
    ordersQuery = ordersQuery.gte('created_at', fechaInicio).lte('created_at', fechaFin)
  }
  
  const { data: orders, error: ordersError } = await ordersQuery
  
  if (ordersError) throw ordersError
  
  if (!orders || orders.length === 0) return []
  
  const orderIds = orders.map(o => o.id)
  
  const { data, error } = await supabase
    .from('sales_order_items')
    .select('*')
    .in('order_id', orderIds)
  
  if (error) throw error
  return data || []
}

export async function getItemsComprasPorFecha(fechaInicio, fechaFin) {
  const { data: purchases, error: purchasesError } = await supabase
    .from('purchase_orders')
    .select('id')
    .eq('status', 'completed')
    .gte('completed_at', fechaInicio)
    .lte('completed_at', fechaFin)
  
  if (purchasesError) throw purchasesError
  
  if (!purchases || purchases.length === 0) return []
  
  const purchaseIds = purchases.map(p => p.id)
  
  const { data, error } = await supabase
    .from('purchase_order_items')
    .select('*')
    .in('purchase_id', purchaseIds)
  
  if (error) throw error
  return data || []
}

export async function getProductosStockBajo(umbral = 10) {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .lte('stock', umbral)
    .order('stock', { ascending: true })
  
  if (error) throw error
  return data || []
}

export async function getResumenFinanciero(fechaInicio, fechaFin) {
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_reportes_completos', {
      p_fecha_inicio: fechaInicio,
      p_fecha_fin: fechaFin
    })
    
    if (!rpcError && rpcData?.resumen) {
      const resumenData = rpcData.resumen
      return {
        ingresos: Number(resumenData.ingresos || 0),
        gastos: Number(resumenData.gastos || 0),
        ganancia: Number(resumenData.ganancia || 0),
        totalVentas: Number(resumenData.totalVentas || resumenData.total_ventas || 0),
        totalCompras: Number(resumenData.totalCompras || resumenData.total_compras || 0)
      }
    }
  } catch (error) {
    console.warn('Función RPC no disponible, usando método antiguo:', error)
  }
  
  const [ventas, compras] = await Promise.all([
    getVentasPorFecha(fechaInicio, fechaFin),
    getComprasPorFecha(fechaInicio, fechaFin)
  ])
  
  const ingresos = ventas.reduce((sum, v) => sum + Number(v.total || 0), 0)
  const gastos = compras.reduce((sum, c) => sum + Number(c.total || 0), 0)
  const ganancia = ingresos - gastos
  
  return {
    ingresos,
    gastos,
    ganancia,
    totalVentas: ventas.length,
    totalCompras: compras.length
  }
}

export async function getReportesCompletos(fechaInicio, fechaFin) {
  // Intentar usar RPC primero
  try {
    const { data, error } = await supabase.rpc('get_reportes_completos', {
      p_fecha_inicio: fechaInicio,
      p_fecha_fin: fechaFin
    })
    
    if (!error && data) {
      const resumenData = data.resumen || {}
      return {
        resumen: {
          ingresos: Number(resumenData.ingresos || 0),
          gastos: Number(resumenData.gastos || 0),
          ganancia: Number(resumenData.ganancia || 0),
          totalVentas: Number(resumenData.totalVentas || 0),
          totalCompras: Number(resumenData.totalCompras || 0)
        },
        ventasPorDia: data.ventas_por_dia || data.ventasPorDia || [],
        comprasPorDia: data.compras_por_dia || data.comprasPorDia || [],
        productosMasVendidos: data.productos_mas_vendidos || data.productosMasVendidos || []
      }
    }
  } catch (err) {
    console.warn('RPC get_reportes_completos falló, usando cálculo manual:', err)
  }

  // Fallback: Cálculo manual cliente-side
  try {
    const [ventas, compras, ventasPorDia, comprasPorDia, productosMasVendidos, stockBajo] = await Promise.all([
      getVentasPorFecha(fechaInicio, fechaFin),
      getComprasPorFecha(fechaInicio, fechaFin),
      getVentasPorDia(fechaInicio, fechaFin),
      getComprasPorDia(fechaInicio, fechaFin),
      getProductosMasVendidos(fechaInicio, fechaFin),
      getProductosStockBajo(15)
    ])

    const ingresos = ventas.reduce((sum, v) => sum + Number(v.total || 0), 0)
    const gastos = compras.reduce((sum, c) => sum + Number(c.total || 0), 0)

    return {
      resumen: {
        ingresos,
        gastos,
        ganancia: ingresos - gastos,
        totalVentas: ventas.length,
        totalCompras: compras.length
      },
      ventasPorDia,
      comprasPorDia,
      productosMasVendidos
    }
  } catch (error) {
    console.error('Error generando reportes manuales:', error)
    throw error
  }
}

export async function getProductosMasVendidos(fechaInicio, fechaFin, limit = 10) {
  const items = await getItemsVentasPorFecha(fechaInicio, fechaFin)
  const productos = {}
  items.forEach(item => {
    const key = item.product_id || item.product_name
    if (!productos[key]) {
      productos[key] = {
        product_id: item.product_id,
        product_name: item.product_name,
        cantidad: 0,
        ingresos: 0
      }
    }
    productos[key].cantidad += Number(item.qty || 0)
    productos[key].ingresos += Number(item.line_total || 0)
  })
  return Object.values(productos).sort((a, b) => b.cantidad - a.cantidad).slice(0, limit)
}

export async function getVentasPorDia(fechaInicio, fechaFin) {
  const ventas = await getVentasPorFecha(fechaInicio, fechaFin)
  const porDia = {}
  ventas.forEach(venta => {
    const fechaVenta = venta.paid_at || venta.created_at
    if (!fechaVenta) return
    const fecha = new Date(fechaVenta).toISOString().split('T')[0]
    if (!porDia[fecha]) {
      porDia[fecha] = { fecha, cantidad: 0, total: 0 }
    }
    porDia[fecha].cantidad += 1
    porDia[fecha].total += Number(venta.total || 0)
  })
  return Object.values(porDia).sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export async function getComprasPorDia(fechaInicio, fechaFin) {
  const compras = await getComprasPorFecha(fechaInicio, fechaFin)
  const porDia = {}
  compras.forEach(compra => {
    if (!compra.completed_at) return
    const fecha = new Date(compra.completed_at).toISOString().split('T')[0]
    if (!porDia[fecha]) {
      porDia[fecha] = { fecha, cantidad: 0, total: 0 }
    }
    porDia[fecha].cantidad += 1
    porDia[fecha].total += Number(compra.total || 0)
  })
  return Object.values(porDia).sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export function getFechaInicioMes(fecha = new Date()) {
  const año = fecha.getFullYear()
  const mes = fecha.getMonth()
  return new Date(año, mes, 1).toISOString().split('T')[0]
}

export function getFechaFinMes(fecha = new Date()) {
  const año = fecha.getFullYear()
  const mes = fecha.getMonth()
  const ultimoDia = new Date(año, mes + 1, 0).getDate()
  const fechaFin = new Date(año, mes, ultimoDia)
  fechaFin.setHours(23, 59, 59, 999)
  return fechaFin.toISOString()
}

export function getFechaInicioMesAnterior() {
  const fecha = new Date()
  fecha.setMonth(fecha.getMonth() - 1)
  return getFechaInicioMes(fecha)
}

export function getFechaFinMesAnterior() {
  const fecha = new Date()
  fecha.setMonth(fecha.getMonth() - 1)
  return getFechaFinMes(fecha)
}

