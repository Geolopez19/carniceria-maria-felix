<template>
  <Toast />
  <div v-if="loading" class="flex items-center justify-center h-screen bg-slate-50">
    <div class="flex flex-col items-center gap-4">
      <div class="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-slate-600 font-medium">Iniciando sistema...</p>
    </div>
  </div>
  <router-view v-else />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { supabase } from './lib/supabaseClient'
import { useRouter } from 'vue-router'
import { useToastStore } from './stores/toastStore'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'

const router = useRouter()
const loading = ref(true)
const toastStore = useToastStore()
const toast = useToast()

// Watch for toast triggers in the store
watch(() => toastStore.toastTrigger, (newToast) => {
  if (newToast) {
    toast.add(newToast)
    toastStore.toastTrigger = null // reset after showing
  }
})

onMounted(async () => {

  // Verificamos sesión inicial
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error

  } catch (err) {
    console.error('App: Error al obtener sesión:', err)
  }
  
  // Escuchar cambios de autenticación
  supabase.auth.onAuthStateChange((event, session) => {

    
    // Solo navegar si es un cambio real de estado
    if (event === 'SIGNED_OUT') {
      router.push('/login')
    } else if (event === 'SIGNED_IN' && router.currentRoute.value.path === '/login') {
      // Solo redirigir a inicio si estamos en login
      router.push('/')
    } else if (event === 'PASSWORD_RECOVERY') {

       router.push('/login?recovery=true')
    }
    // Ignorar INITIAL_SESSION y otros eventos que no requieren navegación
  })

  loading.value = false
})
</script>

<style>
/* Estilos globales se cargan en main.js */
</style>
