<template>
  <div class="mn">
    <!-- Menú Más Opciones (Drawer) -->
    <div
      v-if="isMoreOpen"
      class="fixed inset-0 bg-[#181818]/45 z-[60] lg:hidden"
      @click="isMoreOpen = false"
    ></div>

    <div
      class="mn-sheet fixed inset-x-0 bottom-16 z-[60] transition-transform duration-300 ease-out lg:hidden"
      :class="isMoreOpen ? 'translate-y-0' : 'translate-y-[calc(100%+4rem)]'"
      :style="dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : null"
      role="dialog"
      aria-label="Menú principal"
    >
      <!-- Asa para deslizar hacia abajo y cerrar -->
      <div
        class="pt-2 pb-1 flex justify-center touch-none"
        @touchstart.passive="onDragStart"
        @touchmove.passive="onDragMove"
        @touchend="onDragEnd"
        @click="isMoreOpen = false"
      >
        <span class="mn-handle"></span>
      </div>

      <div class="mn-sheet-head">
        <div class="mn-logo"><Package class="w-5 h-5" /></div>
        <div class="flex flex-col min-w-0">
          <span class="text-base font-bold leading-tight truncate">{{ companyStore.currentCompany.shortName }}</span>
          <span class="text-xs text-[#5C5C5C] truncate">{{ companyStore.currentCompany.type }}</span>
        </div>
        <button @click="isMoreOpen = false" class="mn-close" title="Cerrar" aria-label="Cerrar menú">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="mn-scroll">
        <section v-for="group in navigation" :key="group.title || 'principal'" class="mb-4">
          <span class="mn-group">{{ group.title || 'Principal' }}</span>
          <div class="grid grid-cols-3 gap-2">
            <router-link
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              @click="isMoreOpen = false"
              class="mn-tile"
              :class="{ 'mn-tile-active': isActive(item.path) }"
            >
              <span class="mn-tile-ic"><component :is="item.icon" class="w-[22px] h-[22px]" /></span>
              <span class="mn-tile-lbl">{{ item.short || item.name }}</span>
            </router-link>
          </div>
        </section>

        <button @click="handleLogout" class="mn-logout">
          <LogOut class="w-5 h-5 flex-shrink-0" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>

    <!-- Barra Inferior -->
    <nav class="mn-bottom fixed bottom-0 left-0 right-0 z-[70] flex items-stretch h-16 lg:hidden pb-safe">
      <router-link
        v-for="item in mainItems"
        :key="item.path"
        :to="item.path"
        @click="isMoreOpen = false"
        class="mn-tab"
        :class="{ 'mn-tab-active': isActive(item.path) && !isMoreOpen }"
      >
        <span class="mn-tab-bar"></span>
        <component :is="item.icon" class="w-[22px] h-[22px]" />
        <span class="text-[10px] truncate max-w-full px-1">{{ item.short }}</span>
      </router-link>

      <button
        @click="isMoreOpen = !isMoreOpen"
        class="mn-tab"
        :class="{ 'mn-tab-active': isMoreOpen || moreActive }"
        :aria-expanded="isMoreOpen"
        aria-label="Abrir menú"
      >
        <span class="mn-tab-bar"></span>
        <LayoutGrid class="w-[22px] h-[22px]" />
        <span class="text-[10px]">Menú</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabaseClient'
import { useCompanyStore } from '../stores/companyStore'
import {
  Package,
  ShoppingCart,
  Truck,
  X,
  Users,
  FileText,
  BarChart3,
  Settings,
  LayoutGrid,
  LogOut,
  BookmarkCheck
} from 'lucide-vue-next'

const isMoreOpen = ref(false)
const route = useRoute()
const companyStore = useCompanyStore()

const isActive = (path) => route.path.startsWith(path)

// Mismas opciones que el menú lateral de escritorio (Sidebar.vue)
const navigation = computed(() => {
  const ventasItems = [
    { name: 'Ofertas / Cotizar', short: 'Ofertas', path: '/ventas/ofertas', icon: ShoppingCart },
    { name: 'Facturas', path: '/ventas/facturas', icon: FileText },
  ]
  if (companyStore.isMotoTech) {
    ventasItems.push({ name: 'Apartados de Cascos', short: 'Apartados', path: '/apartados', icon: BookmarkCheck })
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
    { title: 'Ventas', items: ventasItems },
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

// Accesos directos de la barra inferior (en MotoTech se incluye Apartados)
const mainItems = computed(() => {
  const items = [
    { short: 'Inventario', path: '/inventario', icon: Package },
    { short: 'Ofertas', path: '/ventas/ofertas', icon: ShoppingCart },
  ]
  if (companyStore.isMotoTech) {
    items.push({ short: 'Apartados', path: '/apartados', icon: BookmarkCheck })
  } else {
    items.push({ short: 'Compras', path: '/compras', icon: Truck })
  }
  return items
})

// Resalta "Menú" cuando la página actual no tiene acceso directo en la barra
const moreActive = computed(() => !mainItems.value.some(i => isActive(i.path)))

// Deslizar el panel hacia abajo para cerrarlo
const dragStart = ref(null)
const dragY = ref(0)
const onDragStart = (e) => { dragStart.value = e.touches[0].clientY }
const onDragMove = (e) => {
  if (dragStart.value === null) return
  dragY.value = Math.max(0, e.touches[0].clientY - dragStart.value)
}
const onDragEnd = () => {
  if (dragY.value > 80) isMoreOpen.value = false
  dragStart.value = null
  dragY.value = 0
}

// Cerrar el panel al cambiar de página
watch(() => route.path, () => { isMoreOpen.value = false })

const handleLogout = async () => {
  await supabase.auth.signOut()
}
</script>

<style scoped>
.mn { font: 13px/1.4 "Barlow", system-ui, sans-serif; color: #181818; }

.mn-sheet { background: #fff; border-radius: 16px 16px 0 0; box-shadow: 0 -6px 24px rgba(0, 0, 0, .18); overflow: hidden; }
.mn-handle { width: 40px; height: 5px; border-radius: 3px; background: #C9C9C9; }
.mn-sheet-head { padding: 6px 12px 12px 16px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #E5E5E5; }
.mn-logo { width: 40px; height: 40px; flex: none; border-radius: 8px; background: #0B6BCB; color: #fff; display: flex; align-items: center; justify-content: center; }
.mn-close { margin-left: auto; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 50%; background: #F3F3F3; color: #3E3E3C; }
.mn-close:active { background: #E5E5E5; }
.mn-scroll { max-height: 62vh; overflow-y: auto; overscroll-behavior: contain; padding: 14px 14px calc(14px + env(safe-area-inset-bottom)); }

.mn-group { display: block; padding: 0 2px 8px; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #706E6B; }
.mn-tile {
  min-height: 84px; padding: 12px 6px 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  border: 1px solid #E5E5E5; border-radius: 10px; background: #fff; color: #3E3E3C; text-decoration: none; text-align: center;
  -webkit-tap-highlight-color: transparent; transition: transform .1s, background .1s;
}
.mn-tile:active { transform: scale(.96); background: #F3F3F3; }
.mn-tile-ic { width: 42px; height: 42px; border-radius: 10px; background: #F3F3F3; color: #5C5C5C; display: flex; align-items: center; justify-content: center; }
.mn-tile-lbl { font-size: 12.5px; font-weight: 600; line-height: 1.2; }
.mn-tile-active { border-color: #0B6BCB; background: #F3F8FD; color: #0B6BCB; }
.mn-tile-active .mn-tile-ic { background: #0B6BCB; color: #fff; }

.mn-logout {
  width: 100%; height: 48px; margin-top: 2px; display: flex; align-items: center; justify-content: center; gap: 10px;
  border: 1px solid #F3C2C2; border-radius: 10px; background: #fff; color: #BA0517; font: 600 14px "Barlow", system-ui, sans-serif; cursor: pointer;
}
.mn-logout:active { background: #FDECEA; }

.mn-bottom { background: #fff; border-top: 1px solid #E5E5E5; box-shadow: 0 -1px 2px rgba(0, 0, 0, .04); }
.mn-tab {
  position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  border: 0; background: transparent; color: #706E6B; font-weight: 500; text-decoration: none; cursor: pointer;
}
.mn-tab-bar { position: absolute; top: 0; width: 32px; height: 3px; border-radius: 0 0 2px 2px; background: transparent; }
.mn-tab-active { color: #0B6BCB; font-weight: 700; }
.mn-tab-active .mn-tab-bar { background: #0B6BCB; }
.mn-tile:focus-visible, .mn-tab:focus-visible, .mn-close:focus-visible, .mn-logout:focus-visible { outline: 2px solid #0B6BCB; outline-offset: -2px; }
</style>
