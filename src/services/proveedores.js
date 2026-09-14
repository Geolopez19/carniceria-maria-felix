import { getActiveSupabase } from '../lib/supabaseClient'

export async function searchSuppliers(q, limit = 100) {
  try {
    const supabase = getActiveSupabase()
    let query = supabase
      .from('suppliers')
      .select('id,name,phone,email,address')
      .limit(limit)
    
    if (q && q.trim()) {
      const s = q.trim().replace(/"/g, '')
      query = query.or(`name.ilike."%${s}%",email.ilike."%${s}%",phone.ilike."%${s}%"`)
    }
    
    const { data, error } = await query
    if (error) {
      console.warn('Error al buscar proveedores:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.warn('Error en searchSuppliers:', err)
    return []
  }
}

export async function getSupplier(id) {
  const supabase = getActiveSupabase()
  const { data, error } = await supabase
    .from('suppliers')
    .select('id,name,phone,email,address')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createSupplier({ name, phone, email, address }) {
  const supabase = getActiveSupabase()
  const { data, error } = await supabase
    .from('suppliers')
    .insert({ name, phone, email, address })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSupplier(id, { name, phone, email, address }) {
  const supabase = getActiveSupabase()
  const { data, error } = await supabase
    .from('suppliers')
    .update({
      name: name?.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      address: address?.trim() || null
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSupplier(id) {
  const supabase = getActiveSupabase()
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id)
  if (error) throw error
  return true
}

