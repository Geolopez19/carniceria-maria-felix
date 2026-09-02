<template>
    <aside 
    class="bg-gradient-to-b from-indigo-600 to-indigo-800 text-white flex flex-col h-screen fixed left-0 top-0 shadow-2xl z-50 transition-all duration-300 ease-in-out"
    :class="[
      isCollapsed ? 'lg:w-20' : 'lg:w-64',
      isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <!-- Logo/Header -->
    <div class="p-6 flex items-center gap-3 border-b border-indigo-500/30 overflow-hidden min-h-[88px] relative">
      <div 
        class="bg-white p-2 rounded-xl shadow-lg transition-all duration-300 flex-shrink-0"
        :class="isCollapsed ? 'mx-auto' : ''"
      >
        <Package class="w-6 h-6 text-indigo-600" />
      </div>
      <div 
        v-if="!isCollapsed"
        class="flex flex-col whitespace-nowrap transition-opacity duration-300" 
      >
        <span class="text-xl font-bold tracking-tight">María Félix</span>
        <span class="text-xs text-indigo-200">Carnicería</span>
      </div>
    </div>

    <!-- Floating Toggle Button -->
    <button 
      @click="toggleSidebar"
      class="hidden lg:flex absolute -right-3 top-24 bg-white text-indigo-600 p-1.5 rounded-full shadow-lg border border-indigo-100 hover:scale-110 active:scale-95 transition-all duration-300 z-50 items-center justify-center group"
      :title="isCollapsed ? 'Expandir' : 'Colapsar'"
    >
      <ChevronLeft 
        class="w-3 h-3 transition-transform duration-300" 
        :class="isCollapsed ? 'rotate-180' : ''" 
      />
    </button>

    <nav class="flex-1 p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar overflow-x-hidden pt-8">
      <div v-for="(group, index) in navigation" :key="index" class="flex flex-col gap-2">
        <div 
          v-if="group.title && !isCollapsed" 
          class="text-xs font-bold text-indigo-200 uppercase px-4 tracking-widest whitespace-nowrap transition-opacity duration-300"
        >
          {{ group.title }}
        </div>
        <div v-else-if="group.title && isCollapsed" class="h-4 border-b border-indigo-500/30 mb-2 mx-2"></div>
        
        <router-link 
          v-for="item in group.items" 
          :key="item.path" 
          :to="item.path"
          @click="$emit('closeMobile')"
          class="flex items-center gap-3 py-2.5 px-4 rounded-xl transition-all duration-200 text-indigo-100 hover:text-white hover:bg-white/10 group relative"
          active-class="bg-white/10 text-white font-semibold shadow-inner"
          :class="{ 'justify-center px-0': isCollapsed }"
          :title="isCollapsed ? item.name : ''"
        >
          <component 
            :is="item.icon" 
            class="w-5 h-5 transition-transform group-hover:scale-110 flex-shrink-0" 
            :class="{ 'text-white': $route.path.startsWith(item.path), 'text-indigo-200 group-hover:text-white': !$route.path.startsWith(item.path) }"
          />
          
          <span v-if="!isCollapsed" class="font-medium whitespace-nowrap transition-opacity duration-300">{{ item.name }}</span>
          
          <!-- Indicator for active state -->
          <div 
            v-if="$route.path.startsWith(item.path)" 
            class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-md shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          ></div>
          
          <!-- Tooltip on hover when collapsed -->
          <div 
            v-if="isCollapsed"
            class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg"
          >
            {{ item.name }}
          </div>
        </router-link>
      </div>
    </nav>

    <div class="p-4 border-t border-indigo-500/30">
      <button 
        @click="handleLogout" 
        class="w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 hover:bg-red-500/20 text-indigo-100 hover:text-white hover:scale-105 group"
        :class="{ 'justify-center px-0': isCollapsed }"
        :title="isCollapsed ? 'Cerrar Sesión' : ''"
      >
        <LogOut class="w-5 h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
        <span v-if="!isCollapsed" class="font-medium whitespace-nowrap transition-opacity duration-300">Cerrar Sesión</span>
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
  ChevronRight,
  Settings
} from 'lucide-vue-next'
import { supabase } from '../lib/supabaseClient'

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

const navigation = [
  {
    title: 'Principal',
    items: [
      { name: 'Inventario', path: '/inventario', icon: Package },
      { name: 'Compras', path: '/compras', icon: Truck },
    ]
  },
  {
    title: 'Ventas',
    items: [
      { name: 'Ofertas', path: '/ventas/ofertas', icon: ShoppingCart },
      { name: 'Facturas', path: '/ventas/facturas', icon: FileText },
      { name: 'Clientes', path: '/ventas/clientes', icon: Users },
    ]
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

const handleLogout = async () => {
  await supabase.auth.signOut()
}
</script>

