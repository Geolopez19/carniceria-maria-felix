import { supabase } from '../lib/supabaseClient'
import { sync_user_after_signup } from './usuarios'

export async function signUp(email, password, nombre = null, rol = 'colaborador') {
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: {
        nombre: nombre || email.split('@')[0],
        rol: rol
      }
    }
  })
  
  if (error) throw error
  
  if (data.user) {
    try {
      await supabase.rpc('sync_user_after_signup', {
        p_auth_id: data.user.id,
        p_email: email,
        p_nombre: nombre || email.split('@')[0],
        p_rol: rol
      })
    } catch (syncError) {
      console.warn('No se pudo sincronizar usuario en tabla usuarios:', syncError)
    }
  }
  
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  
  if (data.user) {
    try {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('activo, rol')
        .eq('auth_id', data.user.id)
        .single()
      
      if (usuario && !usuario.activo) {
        await supabase.auth.signOut()
        throw new Error('Tu cuenta está desactivada. Contacta al administrador.')
      }
    } catch (checkError) {
      if (checkError.message.includes('desactivada')) {
        throw checkError
      }
      console.warn('Usuario no encontrado en tabla usuarios, pero puede continuar')
    }
  }
  
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

