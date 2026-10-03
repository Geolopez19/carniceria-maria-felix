<template>
  <div class="min-h-screen bg-[#F3F3F3] flex relative pb-16 lg:pb-0">
    <Sidebar :isCollapsed="isCollapsed" class="hidden lg:flex" @toggle="toggleSidebar" />
    <div 
      class="flex-1 flex flex-col min-h-screen transition-all duration-200 ease-in-out w-full max-w-full overflow-x-hidden"
      :class="isCollapsed ? 'lg:ml-16' : 'lg:ml-[248px]'"
    >
      <!-- Encabezado: marca · selector de negocio · usuario (diseño 5c) -->
      <header class="topbar h-[52px] px-3 lg:px-5 flex items-center gap-3 lg:gap-4 sticky top-0 z-30">
        <Package class="w-5 h-5 lg:hidden text-[#0B6BCB] flex-shrink-0" />
        <span class="text-[15px] font-bold truncate">
          <span class="lg:hidden">{{ companyStore.currentCompany.shortName }}</span>
          <span class="hidden lg:inline">{{ companyStore.currentCompany.name }}</span>
        </span>

        <template v-if="companyStore.authorizedCompaniesList.length > 1">
          <span class="hidden sm:block w-px h-5 bg-[#E5E5E5] flex-shrink-0"></span>
          <div role="tablist" aria-label="Negocio" class="biz-tabs">
            <button
              type="button"
              role="tab"
              v-for="c in companyStore.authorizedCompaniesList"
              :key="c.id"
              :aria-selected="companyStore.activeCompanyId === c.id"
              @click="companyStore.setCompany(c.id)"
              class="biz-tab"
              :class="{ 'biz-tab-active': companyStore.activeCompanyId === c.id }"
              :title="`Cambiar a ${c.name}`"
            >
              {{ c.id === 'mototech' ? 'MotoTech' : 'Carnicería' }}
            </button>
          </div>
        </template>

        <div class="ml-auto flex items-center gap-2.5 pl-2.5">
          <div class="text-right hidden sm:flex flex-col items-end">
            <span class="text-[13px] font-semibold leading-tight">{{ displayName }}</span>
            <span class="text-[11px] text-[#5C5C5C] capitalize">{{ userRole }}</span>
          </div>
          <div class="w-8 h-8 rounded-full bg-[#0B6BCB] text-white flex items-center justify-center font-bold text-[13px] flex-shrink-0">
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
    const { data: { session } } = await supabase.auth.getSession()
    const authUser = session?.user
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

<style scoped>
.topbar {
  background: #fff;
  border-bottom: 1px solid #E5E5E5;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .04);
  font: 13px/1.4 "Barlow", system-ui, sans-serif;
  color: #181818;
}
.biz-tabs { display: flex; gap: 2px; padding: 2px; background: #F3F3F3; border: 1px solid #E5E5E5; border-radius: 4px; flex-shrink: 0; }
.biz-tab { height: 28px; padding: 0 12px; border: 0; border-radius: 3px; background: transparent; color: #5C5C5C; font: 500 13px "Barlow", system-ui, sans-serif; cursor: pointer; white-space: nowrap; }
.biz-tab:hover { color: #0B6BCB; }
.biz-tab-active { background: #fff; color: #0B6BCB; font-weight: 700; box-shadow: 0 1px 2px rgba(0, 0, 0, .12); }
@media (min-width: 1024px) { .biz-tab { padding: 0 14px; } }
</style>
