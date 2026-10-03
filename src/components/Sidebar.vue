<template>
  <!-- Menú lateral claro (diseño Plan Separe 5a) -->
  <aside
    class="sb flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-200 ease-in-out"
    :class="[
      isCollapsed ? 'lg:w-16' : 'lg:w-[248px]',
      isMobileOpen ? 'translate-x-0 w-[248px]' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <!-- Marca -->
    <div class="sb-brand" :class="{ 'justify-center': isCollapsed }">
      <div class="sb-logo"><Package class="w-[18px] h-[18px]" /></div>
      <div v-if="!isCollapsed" class="flex flex-col min-w-0">
        <span class="truncate text-[15px] font-bold leading-tight">{{ companyStore.currentCompany.shortName }}</span>
        <span class="truncate text-[11px] sb-muted">{{ companyStore.currentCompany.type }}</span>
      </div>
    </div>

    <!-- Botón del borde para colapsar -->
    <button
      @click="toggleSidebar"
      class="sb-toggle hidden lg:flex"
      :title="isCollapsed ? 'Expandir menú' : 'Colapsar menú'"
      :aria-label="isCollapsed ? 'Expandir menú' : 'Colapsar menú'"
    >
      <ChevronLeft class="w-3.5 h-3.5 transition-transform duration-200" :class="{ 'rotate-180': isCollapsed }" />
    </button>

    <nav class="flex-1 px-2 py-2.5 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
      <template v-for="(group, index) in navigation" :key="index">
        <span v-if="group.title && !isCollapsed" class="sb-group">{{ group.title }}</span>
        <span v-else-if="index > 0" class="sb-rule"></span>

        <router-link
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          @click="$emit('closeMobile')"
          class="sb-item"
          :class="{ 'sb-item-active': isActive(item.path), 'justify-center': isCollapsed }"
          :title="item.name"
          :aria-label="item.name"
        >
          <span class="sb-bar"></span>
          <component :is="item.icon" class="w-[18px] h-[18px] flex-shrink-0 sb-ic" />
          <span v-if="!isCollapsed" class="truncate">{{ item.name }}</span>
        </router-link>
      </template>
    </nav>

    <div class="p-2 border-t border-[#E5E5E5]">
      <button
        @click="handleLogout"
        class="sb-logout"
        :class="{ 'justify-center': isCollapsed }"
        title="Cerrar Sesión"
        aria-label="Cerrar Sesión"
      >
        <LogOut class="w-[18px] h-[18px] flex-shrink-0" />
        <span v-if="!isCollapsed">Cerrar Sesión</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import {
  Package,
  ShoppingCart,
  Truck,
  BarChart3,
  Users,
  LogOut,
  FileText,
  ChevronLeft,
  Settings,
  BookmarkCheck
} from 'lucide-vue-next'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabaseClient'
import { useCompanyStore } from '../stores/companyStore'
import { computed } from 'vue'

const companyStore = useCompanyStore()
const route = useRoute()

const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false
  },
  isMobileOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle', 'closeMobile'])

const toggleSidebar = () => {
  emit('toggle')
}

const isActive = (path) => route.path.startsWith(path)

const navigation = computed(() => {
  const ventasItems = [
    { name: 'Ofertas / Cotizar', path: '/ventas/ofertas', icon: ShoppingCart },
    { name: 'Facturas', path: '/ventas/facturas', icon: FileText },
  ]

  // En MotoTech agregar Apartados de Cascos
  if (companyStore.isMotoTech) {
    ventasItems.push({ name: 'Apartados de Cascos', path: '/apartados', icon: BookmarkCheck })
  }

  ventasItems.push({ name: 'Clientes', path: '/ventas/clientes', icon: Users })

  return [
    {
      title: null,
      items: [
        { name: 'Inventario', path: '/inventario', icon: Package },
        { name: 'Compras', path: '/compras', icon: Truck },
      ]
    },
    {
      title: 'Ventas',
      items: ventasItems
    },
    {
      title: 'Administración',
      items: [
        { name: 'Reportes', path: '/reportes', icon: BarChart3 },
        { name: 'Usuarios', path: '/usuarios', icon: Users },
        { name: 'Configuración', path: '/configuracion', icon: Settings },
      ]
    }
  ]
})

const handleLogout = async () => {
  await supabase.auth.signOut()
}
</script>

<style scoped>
.sb {
  background: #fff;
  border-right: 1px solid #E5E5E5;
  font: 13px/1.4 "Barlow", system-ui, sans-serif;
  color: #181818;
}
.sb-muted { color: #5C5C5C; }
.sb-brand { height: 60px; padding: 0 14px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #E5E5E5; flex: none; }
.sb-logo { width: 34px; height: 34px; flex: none; border-radius: 4px; background: #0B6BCB; color: #fff; display: flex; align-items: center; justify-content: center; }
.sb-toggle {
  position: absolute; top: 46px; right: -12px; width: 24px; height: 24px; border-radius: 50%;
  border: 1px solid #C9C9C9; background: #fff; color: #5C5C5C; align-items: center; justify-content: center;
  cursor: pointer; box-shadow: 0 1px 2px rgba(0, 0, 0, .1); z-index: 2;
}
.sb-toggle:hover { color: #0B6BCB; border-color: #0B6BCB; }
.sb-group { padding: 14px 10px 6px; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #706E6B; white-space: nowrap; }
.sb-rule { height: 1px; margin: 10px 8px; background: #E5E5E5; flex: none; }
.sb-item {
  position: relative; height: 36px; padding: 0 10px; display: flex; align-items: center; gap: 10px; flex: none;
  border-radius: 4px; color: #3E3E3C; font-weight: 500; text-decoration: none; white-space: nowrap;
}
.sb-item:hover { background: #F3F3F3; }
.sb-ic { color: #706E6B; }
.sb-bar { position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px; border-radius: 0 2px 2px 0; background: transparent; }
.sb-item-active, .sb-item-active:hover { background: #E3EEFA; color: #0B6BCB; font-weight: 600; }
.sb-item-active .sb-ic { color: #0B6BCB; }
.sb-item-active .sb-bar { background: #0B6BCB; }
.sb-item:focus-visible, .sb-logout:focus-visible, .sb-toggle:focus-visible { outline: 2px solid #0B6BCB; outline-offset: -2px; }
.sb-logout {
  width: 100%; height: 36px; padding: 0 10px; display: flex; align-items: center; gap: 10px;
  border: 0; border-radius: 4px; background: transparent; color: #3E3E3C; font: 500 13px "Barlow", system-ui, sans-serif; cursor: pointer;
}
.sb-logout:hover { background: #FDECEA; color: #BA0517; }
</style>
