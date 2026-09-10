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
        redirect: '/ventas/ofertas',
        children: [
          {
            path: 'ofertas',
            name: 'VentasOfertas',
            component: () => import('../pages/VentasOfertas.vue')
          },
          {
            path: 'facturas',
            name: 'VentasFacturas',
            component: () => import('../pages/VentasFacturas.vue')
          },
          {
            path: 'clientes',
            name: 'Clientes',
            component: () => import('../pages/Clientes.vue')
          }
        ]
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


    if (to.meta.requiresAuth && !session) {

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

export default router
