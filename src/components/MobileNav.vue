<template>
  <div>
    <!-- Menú Más Opciones (Drawer) -->
    <div 
      v-if="isMoreOpen" 
      class="fixed inset-0 bg-slate-900/50 z-[60] transition-opacity lg:hidden backdrop-blur-sm"
      @click="isMoreOpen = false"
    ></div>

    <div 
      class="fixed inset-x-0 bottom-16 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-[60] transition-transform duration-300 lg:hidden overflow-hidden"
      :class="isMoreOpen ? 'translate-y-0' : 'translate-y-full'"
    >
      <div class="p-4 bg-indigo-50/50 border-b border-indigo-100 flex justify-between items-center rounded-t-3xl">
        <h3 class="font-bold text-indigo-900 tracking-tight ml-2">Menú Principal</h3>
        <button @click="isMoreOpen = false" class="text-indigo-600 hover:bg-indigo-100 p-1.5 rounded-full transition-colors active:scale-95">
          <X class="w-5 h-5" />
        </button>
      </div>
      <div class="p-4 grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pb-8">
        <router-link 
          v-for="item in moreItems" 
          :key="item.path"
          :to="item.path"
          @click="isMoreOpen = false"
          class="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm active:bg-indigo-50 active:border-indigo-200 transition-all active:scale-[0.98]"
        >
          <div class="p-2 rounded-xl" :class="item.colorBg">
            <component :is="item.icon" class="w-5 h-5" :class="item.colorIcon" />
          </div>
          <span class="text-sm font-semibold text-slate-700">{{ item.name }}</span>
        </router-link>

        <button 
          @click="handleLogout"
          class="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-red-50 shadow-sm active:bg-red-50 active:border-red-200 transition-all active:scale-[0.98] col-span-2 mt-2"
        >
          <div class="p-2 rounded-xl bg-red-100">
            <LogOut class="w-5 h-5 text-red-600" />
          </div>
          <span class="text-sm font-bold text-red-600">Cerrar Sesión</span>
        </button>
      </div>
    </div>

    <!-- Barra Inferior -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-[70] flex justify-around items-center h-16 lg:hidden shadow-[0_-5px_15px_rgba(0,0,0,0.03)] pb-safe pt-1">
      <router-link 
        v-for="item in mainItems" 
        :key="item.path"
        :to="item.path"
        @click="isMoreOpen = false"
        class="flex flex-col flex-1 items-center justify-center h-full gap-1 text-slate-400 hover:text-indigo-600 transition-colors relative"
        active-class="text-indigo-600 font-bold"
      >
        <!-- Bolita indicadora superior (opcional - para un toque más app) -->
        <div v-if="$route.path.startsWith(item.path)" class="absolute top-0 w-8 h-1 bg-indigo-600 rounded-b-full shadow-[0_2px_8px_rgba(79,70,229,0.5)]"></div>
        
        <component :is="item.icon" class="w-6 h-6 mb-0.5" :class="{ 'fill-indigo-50': $route.path.startsWith(item.path) }" />
        <span class="text-[10px]">{{ item.name }}</span>
      </router-link>

      <button 
        @click="isMoreOpen = !isMoreOpen"
        class="flex flex-col flex-1 items-center justify-center h-full gap-1 transition-colors relative"
        :class="isMoreOpen ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-indigo-600'"
      >
        <div v-if="isMoreOpen" class="absolute top-0 w-8 h-1 bg-indigo-600 rounded-b-full shadow-[0_2px_8px_rgba(79,70,229,0.5)]"></div>
        <LayoutGrid class="w-6 h-6 mb-0.5" :class="{ 'fill-indigo-50': isMoreOpen }" />
        <span class="text-[10px]">Menú</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabaseClient'
import { 
  Package, 
  ShoppingCart, 
  Truck, 
  Menu,
  X,
  Users,
  FileText,
  BarChart3,
  Settings,
  LayoutGrid,
  LogOut
} from 'lucide-vue-next'

const isMoreOpen = ref(false)
const router = useRouter()

const mainItems = [
  { name: 'Inventario', path: '/inventario', icon: Package },
  { name: 'Ofertas', path: '/ventas/ofertas', icon: ShoppingCart }, 
  { name: 'Compras', path: '/compras', icon: Truck },
]

const moreItems = [
  { name: 'Facturación', path: '/ventas/facturas', icon: FileText, colorBg: 'bg-emerald-100', colorIcon: 'text-emerald-600' },
  { name: 'Clientes', path: '/ventas/clientes', icon: Users, colorBg: 'bg-blue-100', colorIcon: 'text-blue-600' },
  { name: 'Reportes', path: '/reportes', icon: BarChart3, colorBg: 'bg-violet-100', colorIcon: 'text-violet-600' },
  { name: 'Usuarios', path: '/usuarios', icon: Users, colorBg: 'bg-orange-100', colorIcon: 'text-orange-600' },
  { name: 'Configuración', path: '/configuracion', icon: Settings, colorBg: 'bg-slate-100', colorIcon: 'text-slate-600' },
]

const handleLogout = async () => {
  await supabase.auth.signOut()
}
</script>
