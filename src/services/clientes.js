import { supabase } from '../lib/supabaseClient'

export function normalizeCedula(n) {
  return (n || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '')
}

export async function searchCustomers(q, limit = 8) {
  let query = supabase.from('customers').select('id,name,phone,email,address,national_id').limit(limit)
  if (q && q.trim()) {
    const s = q.trim()
    query = query.or(`name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,national_id.ilike.%${s}%`)
  }
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function listCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getCustomer(id) {
  const { data, error } = await supabase
    .from('customers')
    .select('id,name,phone,email,address,national_id')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createCustomer({ name, national_id, phone, email, address }) {
  if (national_id) {
    const nid = normalizeCedula(national_id)
    const { data: dup, error: e1 } = await supabase
      .from('customers')
      .select('id')
      .eq('national_id_norm', nid)
      .maybeSingle()
    if (!e1 && dup) {
      const err = new Error('DUPLICATE_NATIONAL_ID')
      err.code = 'DUPLICATE_NATIONAL_ID'
      throw err
    }
  }

  const { data, error } = await supabase
    .from('customers')
    .insert({ name, national_id, phone, email, address })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      const err = new Error('DUPLICATE_NATIONAL_ID')
      err.code = 'DUPLICATE_NATIONAL_ID'
      throw err
    }
    throw error
  }
  return data
}

export async function updateCustomer(id, { name, national_id, phone, email, address }) {
  if (!id) throw new Error('ID no válido para actualización')

  if (national_id) {
    const nid = normalizeCedula(national_id)
    const { data: dup, error: e1 } = await supabase
      .from('customers')
      .select('id')
      .eq('national_id_norm', nid)
      .neq('id', id)
      .maybeSingle()
    if (!e1 && dup) {
      const err = new Error('DUPLICATE_NATIONAL_ID')
      err.code = 'DUPLICATE_NATIONAL_ID'
      throw err
    }
  }

  const { data, error } = await supabase
    .from('customers')
    .update({
      name: name?.trim(),
      national_id: national_id?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      address: address?.trim() || null
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      const err = new Error('DUPLICATE_NATIONAL_ID')
      err.code = 'DUPLICATE_NATIONAL_ID'
      throw err
    }
    throw error
  }
  return data
}

export async function deleteCustomer(id) {
  if (!id) throw new Error('ID no válido para eliminación')

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('❌ Error al eliminar cliente:', error.message)
    throw error
  }

  return true
}

