<template>
  <div class="p-2 sm:p-4 md:p-6">

    <!-- Estado de Carga Inicial -->
    <div v-if="checkingAuth" class="flex items-center justify-center h-[60vh]">
      <div class="flex flex-col items-center gap-4">
        <i class="pi pi-spin pi-spinner text-4xl text-indigo-600"></i>
      </div>
    </div>

    <!-- Acceso Denegado -->
    <div v-else-if="!isAdmin" class="flex items-center justify-center h-[60vh]">
      <div class="text-center p-8 bg-white rounded-2xl shadow-sm border border-red-100 max-w-md">
        <div class="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock class="w-8 h-8 text-red-500" />
        </div>
        <h2 class="text-2xl font-bold text-slate-800 mb-2">Acceso Restringido</h2>
        <p class="text-slate-500 mb-6">Solo los administradores pueden acceder a los reportes financieros.</p>
        <Button label="Ir al Inventario" @click="$router.push('/inventario')" />
      </div>
    </div>

    <template v-else>
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
          <BarChart3 class="w-8 h-8" />
          Reportes y Estadísticas
        </h1>
        <div class="flex flex-col sm:flex-row gap-3 items-stretch w-full md:w-auto">
          <Select v-model="periodo" :options="periodoOptions" optionLabel="label" optionValue="value" class="w-48" />
          <template v-if="periodo === 'personalizado'">
            <DatePicker v-model="fechaInicio" placeholder="Inicio" dateFormat="yy-mm-dd" />
            <DatePicker v-model="fechaFin" placeholder="Fin" dateFormat="yy-mm-dd" />
          </template>
        </div>
      </div>

      <!-- Métricas -->
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <Card class="shadow-sm border border-gray-100">
          <template #title><span class="text-sm text-gray-500 uppercase">Ingresos</span></template>
          <template #content>
            <div class="text-2xl font-bold text-green-600">{{ formatCurrency(resumen.ingresos) }}</div>
          </template>
        </Card>
        <Card class="shadow-sm border border-gray-100">
          <template #title><span class="text-sm text-gray-500 uppercase">Gastos</span></template>
          <template #content>
            <div class="text-2xl font-bold text-red-600">{{ formatCurrency(resumen.gastos) }}</div>
          </template>
        </Card>
        <Card class="shadow-sm border border-gray-100">
          <template #title><span class="text-sm text-gray-500 uppercase">Ganancia Neta</span></template>
          <template #content>
            <div class="text-2xl font-bold" :class="resumen.ganancia >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ formatCurrency(resumen.ganancia) }}
            </div>
          </template>
        </Card>
        <Card class="shadow-sm border border-gray-100">
          <template #title><span class="text-sm text-gray-500 uppercase">Ventas</span></template>
          <template #content>
            <div class="text-2xl font-bold text-indigo-600">{{ resumen.totalVentas }}</div>
          </template>
        </Card>
        <Card class="shadow-sm border border-gray-100">
          <template #title><span class="text-sm text-gray-500 uppercase">Compras</span></template>
          <template #content>
            <div class="text-2xl font-bold text-blue-600">{{ resumen.totalCompras }}</div>
          </template>
        </Card>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Gráfico Ventas vs Compras -->
        <Card class="shadow-sm border border-gray-100 col-span-1 lg:col-span-2">
          <template #title>
            <div class="flex items-center justify-between">
              <span>Tendencia de Ingresos vs Gastos</span>
            </div>
          </template>
          <template #content>
            <div class="h-[24rem]">
              <Chart type="bar" :data="chartData" :options="chartOptions" class="h-full w-full" />
            </div>
          </template>
        </Card>

        <!-- Productos Más Vendidos -->
        <Card class="shadow-sm border border-gray-100">
          <template #title>🏆 Más Vendidos</template>
          <template #content>
            <DataTable :value="productosMasVendidos" class="p-datatable-sm" :rows="5" scrollable>
              <Column field="product_name" header="Producto"></Column>
              <Column field="cantidad" header="Cant." class="md:text-right">
                <template #body="{ data }">
                  {{ Number(data.cantidad || 0).toLocaleString('es-NI', { maximumFractionDigits: 2 }) }}
                </template>
              </Column>
              <Column field="ingresos" header="Ingresos" class="md:text-right">
                <template #body="{ data }">{{ formatCurrency(data.ingresos) }}</template>
              </Column>
            </DataTable>
          </template>
        </Card>

        <!-- Stock Bajo -->
        <Card class="shadow-sm border border-gray-100">
          <template #title><span class="text-red-600">⚠️ Alerta de Stock Bajo</span></template>
          <template #content>
            <DataTable :value="productosStockBajo" stripedRows class="p-datatable-sm" :rows="5" paginator scrollable>
              <Column field="nombre" header="Producto"></Column>
              <Column field="stock" header="Stock" class="md:text-right font-bold md:w-20">
                <template #body="{ data }">
                  <span :class="data.stock <= 5 ? 'text-red-600' : 'text-orange-500'">{{ Number(data.stock || 0).toLocaleString('es-NI', { maximumFractionDigits: 2 }) }}</span>
                </template>
              </Column>
              <Column header="Estado" class="w-24 text-center">
                <template #body="{ data }">
                  <Tag :value="data.stock <= 5 ? 'Crítico' : 'Bajo'" :severity="data.stock <= 5 ? 'danger' : 'warn'" class="text-[10px]" />
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { 
  getReportesCompletos, 
  getProductosStockBajo,
  getFechaInicioMes,
  getFechaFinMes,
  getFechaInicioMesAnterior,
  getFechaFinMesAnterior
} from '../services/reportes'
import { isCurrentUserAdmin } from '../services/usuarios'
import { formatCurrency } from '../utils/calculations'
import { handleError } from '../utils/errorHandler'
import { BarChart3, Lock } from 'lucide-vue-next'

import Button from 'primevue/button'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Chart from 'primevue/chart'

// Estados
const isAdmin = ref(false)
const checkingAuth = ref(true)
const isLoading = ref(false)
const periodo = ref('mes-actual')
const fechaInicio = ref(null)
const fechaFin = ref(null)

const resumen = ref({ ingresos: 0, gastos: 0, ganancia: 0, totalVentas: 0, totalCompras: 0 })
const productosMasVendidos = ref([])
const productosStockBajo = ref([])

// Chart Data
const chartData = ref({})
const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: '#f3f4f6'
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
})

const periodoOptions = [
  { label: 'Mes Actual', value: 'mes-actual' },
  { label: 'Mes Anterior', value: 'mes-anterior' },
  { label: 'Personalizado', value: 'personalizado' }
]

// Funciones
const loadData = async () => {
  try {
    isLoading.value = true
    let inicio, fin
    
    if (periodo.value === 'mes-actual') {
      inicio = getFechaInicioMes()
      fin = getFechaFinMes()
    } else if (periodo.value === 'mes-anterior') {
      inicio = getFechaInicioMesAnterior()
      fin = getFechaFinMesAnterior()
    } else {
      if (fechaInicio.value) {
        const d = new Date(fechaInicio.value)
        inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString()
      } else {
        inicio = getFechaInicioMes()
      }
      if (fechaFin.value) {
        const d = new Date(fechaFin.value)
        fin = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString()
      } else {
        fin = getFechaFinMes()
      }
    }
    
    const data = await getReportesCompletos(inicio, fin)
    resumen.value = data.resumen
    productosMasVendidos.value = data.productosMasVendidos || []
    
    // Preparar datos para el gráfico
    const ventas = data.ventasPorDia || []
    const compras = data.comprasPorDia || []
    
    // Unificar fechas
    const fechas = [...new Set([...ventas.map(v => v.fecha), ...compras.map(c => c.fecha)])].sort()
    
    chartData.value = {
      labels: fechas.map(f => {
        const parts = f.split('-')
        return parts.length === 3 ? `${parts[2]}/${parts[1]}` : f
      }),
      datasets: [
        {
          label: 'Ingresos (Ventas)',
          backgroundColor: '#4f46e5', // indigo-600
          borderRadius: 4,
          data: fechas.map(f => ventas.find(v => v.fecha === f)?.total || 0)
        },
        {
          label: 'Gastos (Compras)',
          backgroundColor: '#ef4444', // red-500
          borderRadius: 4,
          data: fechas.map(f => compras.find(c => c.fecha === f)?.total || 0)
        }
      ]
    }
    
    const stockBajo = await getProductosStockBajo(15)
    productosStockBajo.value = stockBajo
  } catch (err) {
    handleError(err)
  } finally {
    isLoading.value = false
  }
}

watch([periodo, fechaInicio, fechaFin], () => {
  if (isAdmin.value) {
    loadData()
  }
})

onMounted(async () => {
  try {
    isAdmin.value = await isCurrentUserAdmin()
    if (isAdmin.value) {
      await loadData()
    }
  } catch (e) {
    console.error(e)
  } finally {
    checkingAuth.value = false
  }
})
</script>
