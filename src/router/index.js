import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabaseClient'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/Login.vue')
  },
  {
    path: '/',
    component: () => import('../layout/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/inventario'
      },
      {
        path: 'inventario',
        name: 'Inventario',
        component: () => import('../pages/Inventario.vue')
      },
      {
        path: 'inventario/empaquetar',
        name: 'Empaquetar',
        component: () => import('../pages/Empaquetar.vue')
      },
      {
        path: 'ventas',
        redirect: '/ventas/ofertas'
      },
      {
        path: 'ventas/ofertas',
        name: 'VentasOfertas',
        component: () => import('../pages/VentasOfertas.vue')
      },
      {
        path: 'ventas/facturas',
        name: 'VentasFacturas',
        component: () => import('../pages/VentasFacturas.vue')
      },
      {
        path: 'ventas/clientes',
        name: 'Clientes',
        component: () => import('../pages/Clientes.vue')
      },
      {
        path: 'clientes',
        redirect: '/ventas/clientes'
      },
      {
        path: 'apartados',
        name: 'Apartados',
        component: () => import('../pages/Apartados.vue')
      },
      {
        path: 'compras',
        name: 'Compras',
        component: () => import('../pages/Compras.vue')
      },
      {
        path: 'reportes',
        name: 'Reportes',
        component: () => import('../pages/Reportes.vue')
      },
      {
        path: 'usuarios',
        name: 'Usuarios',
        component: () => import('../pages/Usuarios.vue')
      },
      {
        path: 'configuracion',
        name: 'Configuracion',
        component: () => import('../pages/Configuracion.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const requiresAuth = to.matched.some(record => record.meta?.requiresAuth)

    if (requiresAuth && !session) {
      next('/login')
    } else if (to.path === '/login' && session && !to.query.recovery) {
      next('/')
    } else {
      next()
    }
  } catch (error) {
    console.error('Error en router guard:', error)
    next('/login')
  }
})

router.afterEach(() => {
  // Limpiar posibles bloqueos de scroll residuales
  document.body.classList.remove('p-overflow-hidden', 'overflow-hidden')
  document.body.style.overflow = ''
})

export default router
