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
  notas = null
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
  const { data, error } = await supabase
    .from('apartados')
    .update({ status: 'entregado', entregado_at: new Date().toISOString() })
    .eq('id', apartadoId)
    .select()
    .single()

  if (error) throw error
  return data
}
