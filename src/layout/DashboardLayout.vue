<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50 flex relative pb-16 lg:pb-0">
    <Sidebar :isCollapsed="isCollapsed" class="hidden lg:flex" @toggle="toggleSidebar" />
    <div 
      class="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out w-full max-w-full overflow-x-hidden"
      :class="isCollapsed ? 'lg:ml-20' : 'lg:ml-64'"
    >
      <!-- Top App Bar -->
      <header class="h-14 lg:h-16 bg-white/90 backdrop-blur-md border-b border-indigo-100 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="text-base lg:text-sm text-indigo-900 lg:text-slate-600 font-bold lg:font-semibold flex items-center gap-2">
            <!-- Mobile Título Corto / Logo Reducido -->
            <Package class="w-6 h-6 lg:hidden" :class="companyStore.isMotoTech ? 'text-amber-600' : 'text-indigo-600'" />
            <span class="lg:hidden capitalize">{{ ($route.name || companyStore.currentCompany.shortName).replace('-', ' ') }}</span>
            <span class="hidden lg:block">{{ companyStore.currentCompany.name }}</span>
          </div>

          <!-- Selector de Empresa (Switch Multi-empresa) -->
          <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              v-for="c in companyStore.COMPANIES"
              :key="c.id"
              @click="companyStore.setCompany(c.id)"
              class="px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
              :class="companyStore.activeCompanyId === c.id 
                ? (c.id === 'mototech' ? 'bg-amber-600 text-white shadow-sm' : 'bg-indigo-600 text-white shadow-sm')
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'"
              :title="`Cambiar a ${c.name}`"
            >
              <span>{{ c.badge }}</span>
            </button>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right hidden sm:block">
            <div class="text-sm font-bold text-slate-800">{{ displayName }}</div>
            <div class="text-xs capitalize font-medium" :class="companyStore.isMotoTech ? 'text-amber-600' : 'text-indigo-600'">{{ userRole }}</div>
          </div>
          <div 
            class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
            :class="companyStore.isMotoTech ? 'bg-gradient-to-br from-slate-800 to-amber-600' : 'bg-gradient-to-br from-indigo-500 to-indigo-600'"
          >
            {{ userInitial }}
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 p-2 sm:p-4 lg:p-6 w-full overflow-x-hidden">
        <router-view />
      </main>
    </div>

    <!-- Navegación Inferior (Sólo en teléfonos) -->
    <MobileNav />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import MobileNav from '../components/MobileNav.vue'
import { supabase } from '../lib/supabaseClient'
import { getUserByAuthId } from '../services/usuarios'
import { Package } from 'lucide-vue-next'
import { useCompanyStore } from '../stores/companyStore'

const companyStore = useCompanyStore()
const user = ref(null)
const userProfile = ref(null)
const isCollapsed = ref(false)

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const isLoadingProfile = ref(true)

onMounted(async () => {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    user.value = authUser
    
    if (authUser) {
      userProfile.value = await getUserByAuthId(authUser.id)
    }
  } catch (e) {
    console.error('Error fetching user profile:', e)
  } finally {
    isLoadingProfile.value = false
  }
})

const displayName = computed(() => {
  if (isLoadingProfile.value) return '...' // Or return '' to show nothing while loading
  if (userProfile.value?.nombre) return userProfile.value.nombre
  return user.value?.email || '...'
})

const userEmail = computed(() => user.value?.email || '...')
const userInitial = computed(() => user.value?.email?.[0].toUpperCase() || '?')
const userRole = computed(() => user.value?.user_metadata?.rol || 'Usuario')
</script>
