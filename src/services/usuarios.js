import { supabase } from '../lib/supabaseClient'

export async function sync_user_after_signup(authId, email, nombre, rol = 'colaborador') {
  const { data, error } = await supabase.rpc('sync_user_after_signup', {
    p_auth_id: authId,
    p_email: email,
    p_nombre: nombre,
    p_rol: rol
  })
  if (error) throw error
  return data
}

export async function listUsers() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getUser(id) {
  const { data, error } = await supabase.from('usuarios').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function getUserByAuthId(authId) {
  if (!authId) return null
  const { data, error } = await supabase.from('usuarios').select('*').eq('auth_id', authId).single()
  if (error) {
    if (error.code === 'PGRST116') {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          const { data: userByEmail, error: emailError } = await supabase.from('usuarios').select('*').eq('email', user.email).single()
          if (!emailError && userByEmail) {
            if (!userByEmail.auth_id) {
              await supabase.from('usuarios').update({ auth_id: authId }).eq('id', userByEmail.id)
            }
            return userByEmail
          }
        }
      } catch (e) { console.error(e) }
    }
    return null
  }
  return data
}

export async function createUser({ email, password, nombre, rol, activo = true }) {
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
  if (authError) throw authError
  const { data, error } = await supabase.from('usuarios').insert({ auth_id: authData.user?.id || null, email, nombre, rol, activo }).select().single()
  if (error) throw error
  return data
}

export async function updateUser(id, { nombre, rol, activo, email }) {
  if (rol !== undefined) {
    try {
      const { data, error } = await supabase.rpc('update_user_role', { p_user_id: id, p_new_rol: rol, p_nombre: nombre || null, p_activo: activo !== undefined ? activo : null, p_email: email || null })
      if (!error) return data
    } catch (rpcError) { console.warn(rpcError) }
  }
  const updates = { nombre, activo }
  if (email) updates.email = email
  if (rol !== undefined) updates.rol = rol
  const { data, error } = await supabase.from('usuarios').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function updateUserPassword(id, newPassword) {
  const user = await getUser(id)
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (user.auth_id !== currentUser?.id) throw new Error('Solo puedes cambiar tu propia contraseña')
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function toggleUserStatus(id, activo) {
  const { data, error } = await supabase.from('usuarios').update({ activo }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteUser(id) {
  const { error } = await supabase.from('usuarios').delete().eq('id', id)
  if (error) throw error
}

export async function getCurrentUserRole() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const usuario = await getUserByAuthId(user.id)
  return usuario?.rol || null
}

export async function isCurrentUserAdmin() {
  const rol = await getCurrentUserRole()
  return rol === 'admin'
}

