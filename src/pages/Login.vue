<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 p-4 sm:p-6">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-200">
      <div class="flex flex-col items-center mb-8">
        <div class="bg-indigo-600 p-3 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
          <Package class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-slate-800">Carnicería María Félix</h1>
        <p class="text-slate-500">{{ isRecoveryMode ? 'Establece tu nueva contraseña' : 'Bienvenido, ingresa tus credenciales' }}</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div v-if="!isRecoveryMode">
          <label class="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Mail class="w-5 h-5" />
            </span>
            <input 
              v-model="email" 
              type="email" 
              placeholder="admin@ejemplo.com"
              class="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
              required 
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">{{ isRecoveryMode ? 'Nueva Contraseña' : 'Contraseña' }}</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Lock class="w-5 h-5" />
            </span>
            <input 
              v-model="password" 
              type="password" 
              placeholder="••••••••"
              class="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
              required 
              :minlength="isRecoveryMode ? 6 : undefined"
            />
          </div>
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Loader v-if="loading" class="w-5 h-5 animate-spin mr-2" />
          {{ loading ? (isRecoveryMode ? 'Actualizando...' : 'Iniciando sesión...') : (isRecoveryMode ? 'Actualizar Contraseña' : 'Entrar al sistema') }}
        </button>

        <div v-if="errorMessage" class="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p class="text-sm text-red-600">{{ errorMessage }}</p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { useRouter, useRoute } from 'vue-router'
import { Mail, Lock, Package, AlertCircle, Loader } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const isRecoveryMode = ref(false)

onMounted(() => {
  // Check if we are in recovery mode via URL
  if (route.query.recovery === 'true') {
    isRecoveryMode.value = true

  }

  // Check for errors in the hash (Supabase returns errors like #error=access_denied&error_code=403&error_description=Email+link+is+invalid+or+has+expired)
  const hash = window.location.hash
  if (hash && hash.includes('error=')) {
    const params = new URLSearchParams(hash.substring(1)) // Remove the #
    const errorDescription = params.get('error_description')
    if (errorDescription) {
       console.error('Login: Error en el hash:', errorDescription)
       errorMessage.value = 'El enlace es inválido o ha expirado. Por favor solicita uno nuevo.'
       // If there is an error, we likely shouldn't be in recovery mode effectively, effectively disabling the form or showing the error is key.
       // We keep the error message visible.
    }
  }

  // Also listen for auth state change to switching to recovery mode
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      isRecoveryMode.value = true

    }
  })
})

const handleSubmit = async () => {
  if (isRecoveryMode.value) {
    await handlePasswordUpdate()
  } else {
    await handleLogin()
  }
}

const handlePasswordUpdate = async () => {
  try {
    if (password.value.length < 8) {
      errorMessage.value = 'Passwords shorter than this value will be rejected as weak. Minimum 6, recommended 8 or more.' 
      return
    }

    loading.value = true
    errorMessage.value = ''

    
    const { error } = await supabase.auth.updateUser({ 
      password: password.value 
    })

    if (error) throw error

    alert('Contraseña actualizada correctamente. Por favor inicia sesión con tu nueva contraseña.')
    await supabase.auth.signOut()
    isRecoveryMode.value = false
    password.value = ''
    router.push('/login')
    // Reload to ensure clean state if needed, but router push to same route (if already at login) might need force
    if (route.path === '/login') {
      window.location.href = '/login'
    }
    
  } catch (error) {
    console.error('Password Update Error:', error)
    errorMessage.value = 'No se pudo actualizar la contraseña: ' + error.message
  } finally {
    loading.value = false
  }
}

const handleLogin = async () => {
  try {

    loading.value = true
    errorMessage.value = ''
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (error) throw error


    router.push('/')
    
  } catch (error) {
    console.error('Login: Error:', error)
    if (error.message === 'Invalid login credentials' || error.message.includes('Email not confirmed')) {
      errorMessage.value = 'Credenciales inválidas o correo no verificado.'
    } else {
      errorMessage.value = error.message || 'Ocurrió un error al iniciar sesión.'
    }
  } finally {
    loading.value = false
  }
}
</script>
