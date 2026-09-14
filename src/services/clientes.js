import { getActiveSupabase } from '../lib/supabaseClient'

export function normalizeCedula(n) {
  return (n || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '')
}

const getCustomersTable = () => {
  const activeCompany = localStorage.getItem('active_company_id') || 'carniceria'
  return activeCompany === 'mototech' ? 'clientes' : 'customers'
}

export async function searchCustomers(q, limit = 8) {
  const supabase = getActiveSupabase()
  const table = getCustomersTable()
  const isMoto = (table === 'clientes')

  let query = isMoto 
    ? supabase.from(table).select('id,nombre,telefono,email,direccion').limit(limit)
    : supabase.from(table).select('id,name,phone,email,address,national_id').limit(limit)

  if (q && q.trim()) {
    const s = q.trim().replace(/"/g, '')
    if (isMoto) {
      query = query.or(`nombre.ilike."%${s}%",email.ilike."%${s}%",telefono.ilike."%${s}%"`)
    } else {
      query = query.or(`name.ilike."%${s}%",email.ilike."%${s}%",phone.ilike."%${s}%",national_id.ilike."%${s}%"`)
    }
  }
  const { data, error } = await query
  if (error) throw error

  // Normalizar estructura devuelta
  return (data || []).map(c => ({
    id: c.id,
    name: c.nombre || c.name || '',
    phone: c.telefono || c.phone || '',
    email: c.email || '',
    address: c.direccion || c.address || '',
    national_id: c.national_id || ''
  }))
}

export async function listCustomers() {
  const supabase = getActiveSupabase()
  const table = getCustomersTable()
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error

  return (data || []).map(c => ({
    id: c.id,
    name: c.nombre || c.name || '',
    phone: c.telefono || c.phone || '',
    email: c.email || '',
    address: c.direccion || c.address || '',
    national_id: c.national_id || '',
    created_at: c.created_at
  }))
}

export async function getCustomer(id) {
  const supabase = getActiveSupabase()
  const table = getCustomersTable()
  const isMoto = (table === 'clientes')

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    name: data.nombre || data.name || '',
    phone: data.telefono || data.phone || '',
    email: data.email || '',
    address: data.direccion || data.address || '',
    national_id: data.national_id || ''
  }
}

export async function createCustomer({ name, national_id, phone, email, address }) {
  const supabase = getActiveSupabase()
  const table = getCustomersTable()
  const isMoto = (table === 'clientes')

  if (national_id && !isMoto) {
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

  const payload = isMoto ? {
    nombre: name?.trim(),
    telefono: phone?.trim() || null,
    email: email?.trim() || null,
    direccion: address?.trim() || null
  } : {
    name: name?.trim(),
    national_id: national_id?.trim() || null,
    phone: phone?.trim() || null,
    email: email?.trim() || null,
    address: address?.trim() || null
  }

  const { data, error } = await supabase
    .from(table)
    .insert(payload)
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
  return {
    id: data.id,
    name: data.nombre || data.name || '',
    phone: data.telefono || data.phone || '',
    email: data.email || '',
    address: data.direccion || data.address || '',
    national_id: data.national_id || ''
  }
}

export async function updateCustomer(id, { name, national_id, phone, email, address }) {
  if (!id) throw new Error('ID no válido para actualización')
  const supabase = getActiveSupabase()
  const table = getCustomersTable()
  const isMoto = (table === 'clientes')

  if (national_id && !isMoto) {
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

  const payload = isMoto ? {
    nombre: name?.trim(),
    telefono: phone?.trim() || null,
    email: email?.trim() || null,
    direccion: address?.trim() || null
  } : {
    name: name?.trim(),
    national_id: national_id?.trim() || null,
    phone: phone?.trim() || null,
    email: email?.trim() || null,
    address: address?.trim() || null
  }

  const { data, error } = await supabase
    .from(table)
    .update(payload)
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
  return {
    id: data.id,
    name: data.nombre || data.name || '',
    phone: data.telefono || data.phone || '',
    email: data.email || '',
    address: data.direccion || data.address || '',
    national_id: data.national_id || ''
  }
}

export async function deleteCustomer(id) {
  if (!id) throw new Error('ID no válido para eliminación')
  const supabase = getActiveSupabase()
  const table = getCustomersTable()

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)

  if (error) {
    console.error('❌ Error al eliminar cliente:', error.message)
    throw error
  }

  return true
}

export async function findOrCreateCustomer({ name, phone, email, national_id, address }) {
  if (!name || !name.trim()) return null
  const supabase = getActiveSupabase()
  const cleanName = name.trim()
  const cleanPhone = phone?.trim() || null
  const cleanEmail = email?.trim() || null

  // 1. Buscar por teléfono o email si existen
  if (cleanPhone || cleanEmail) {
    const orConditions = []
    if (cleanPhone) orConditions.push(`phone.eq.${cleanPhone}`)
    if (cleanEmail) orConditions.push(`email.eq.${cleanEmail}`)

    const { data: existingByContact, error: err1 } = await supabase
      .from('customers')
      .select('*')
      .or(orConditions.join(','))
      .limit(1)

    if (!err1 && existingByContact && existingByContact.length > 0) {
      return existingByContact[0]
    }
  }

  // 2. Buscar por nombre exacto (case-insensitive)
  const { data: existingByName, error: err2 } = await supabase
    .from('customers')
    .select('*')
    .ilike('name', cleanName)
    .limit(1)

  if (!err2 && existingByName && existingByName.length > 0) {
    return existingByName[0]
  }

  // 3. Si no existe coincidencia, crear un nuevo cliente
  return await createCustomer({
    name: cleanName,
    phone: cleanPhone,
    email: cleanEmail,
    national_id: national_id || null,
    address: address || null
  })
}


