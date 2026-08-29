import { supabase } from '../lib/supabaseClient'

export async function searchSuppliers(q, limit = 100) {
  let query = supabase
    .from('suppliers')
    .select('id,name,phone,email,address')
    .limit(limit)
  
  if (q && q.trim()) {
    const s = q.trim()
    query = query.or(`name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getSupplier(id) {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id,name,phone,email,address')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createSupplier({ name, phone, email, address }) {
  const { data, error } = await supabase
    .from('suppliers')
    .insert({ name, phone, email, address })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSupplier(id, { name, phone, email, address }) {
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
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id)
  if (error) throw error
  return true
}

