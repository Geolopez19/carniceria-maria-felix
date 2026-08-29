<template>
  <div class="p-2 sm:p-4 md:p-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-800">Inventario</h1>
      <Button label="Nuevo Producto" icon="pi pi-plus" @click="abrirModal('crear')" class="w-full md:w-auto !text-white" style="color: white !important;" />
    </div>

    <Tabs value="0">
      <TabList>
        <Tab value="0" icon="pi pi-box">Productos</Tab>
        <Tab value="1" icon="pi pi-history" @click="fetchHistorial">Historial</Tab>
      </TabList>
      
      <TabPanels>
        <!-- Pestaña de Productos -->
        <TabPanel value="0">
          <!-- Métricas -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 mt-4">
            <Card class="bg-blue-50 border-none shadow-sm">
              <template #title><span class="text-xs md:text-sm font-medium text-blue-600 uppercase">Total Productos</span></template>
              <template #content><span class="text-xl md:text-2xl font-bold text-blue-900">{{ totalProductos }}</span></template>
            </Card>
            <Card class="bg-green-50 border-none shadow-sm">
              <template #title><span class="text-xs md:text-sm font-medium text-green-600 uppercase">Stock Total</span></template>
              <template #content><span class="text-xl md:text-2xl font-bold text-green-900">{{ metricas.stockTotal }}</span></template>
            </Card>
            <Card class="bg-indigo-50 border-none shadow-sm">
              <template #title><span class="text-xs md:text-sm font-medium text-indigo-600 uppercase">Valor Total</span></template>
              <template #content><span class="text-xl md:text-2xl font-bold text-indigo-900">C${{ metricas.valorTotal.toLocaleString('es-NI') }}</span></template>
            </Card>
            <Card class="bg-red-50 border-none shadow-sm">
              <template #title><span class="text-xs md:text-sm font-medium text-red-600 uppercase">Bajo Stock</span></template>
              <template #content><span class="text-xl md:text-2xl font-bold text-red-600">{{ metricas.bajoStock }}</span></template>
            </Card>
          </div>

          <!-- Filtros -->
          <div class="flex flex-col md:flex-row gap-4 mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <IconField iconPosition="left" class="flex-1 w-full">
              <InputIcon class="pi pi-search" />
              <InputText v-model="busqueda" placeholder="Buscar producto..." class="w-full" />
            </IconField>
            <Select v-model="filtroCategoria" :options="todasLasCategorias" placeholder="Todas las categorías" class="w-full md:w-60" showClear />
          </div>

          <!-- Tabla de Productos -->
          <div class="card shadow-md rounded-lg overflow-hidden border border-gray-200 bg-white">
            <DataTable 
              :value="productos" 
              :loading="loading" 
              paginator
              :rows="20"
              :rowsPerPageOptions="[20, 50, 100]"
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              currentPageReportTemplate="{first} a {last} de {totalRecords}"
              stripedRows 
              scrollable
              class="p-datatable-sm md:p-datatable-md"
            >
              <Column field="codigo" header="Código" sortable></Column>
              <Column field="nombre" header="Nombre" sortable></Column>
              <Column field="categoria" header="Categoría" sortable class="hidden md:table-cell"></Column>
              <Column field="stock" header="Stock" sortable>
                <template #body="{ data }">
                  <Badge :value="data.stock" :severity="data.stock < 10 ? 'danger' : data.stock > 50 ? 'success' : 'warn'" />
                </template>
              </Column>
              <Column field="precio" header="Precio" sortable>
                <template #body="{ data }">
                  {{ formatCurrency(data.precio) }}
                </template>
              </Column>
              <Column header="Acciones">
                <template #body="{ data }">
                  <div class="flex gap-1 md:gap-2">
                    <Button icon="pi pi-plus" severity="success" text rounded @click="abrirModalEntrada(data)" title="Agregar Stock" />
                    <Button icon="pi pi-pencil" severity="info" text rounded @click="abrirModal('editar', data)" />
                    <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmarEliminar(data)" />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </TabPanel>

        <!-- Pestaña de Historial -->
        <TabPanel value="1">
          <div class="card shadow-md rounded-lg overflow-hidden border border-gray-200 bg-white mt-4">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center p-4 gap-4 border-b">
              <h2 class="text-xl font-semibold text-gray-700">Historial de Movimientos</h2>
              <div class="flex gap-2 w-full md:w-auto">
                <IconField iconPosition="left" class="flex-1 md:w-64">
                  <InputIcon class="pi pi-search" />
                  <InputText v-model="busquedaHistorial" placeholder="Filtrar historial..." class="w-full" />
                </IconField>
                <Button icon="pi pi-refresh" text rounded @click="fetchHistorial" :loading="loadingHistorial" />
              </div>
            </div>
            <DataTable 
              :value="movimientosFiltrados" 
              :loading="loadingHistorial" 
              paginator :rows="15"
              stripedRows 
              scrollable
              class="p-datatable-sm"
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              currentPageReportTemplate="{first} a {last} de {totalRecords}"
            >
              <Column field="created_at" header="Fecha" sortable>
                <template #body="{ data }">
                  <span class="text-sm md:text-base">{{ formatFecha(data.created_at) }}</span>
                </template>
              </Column>
              <Column field="producto_nombre" header="Producto" sortable>
                <template #body="{ data }">
                  <span class="font-medium">{{ data.producto_nombre }}</span>
                </template>
              </Column>
              <Column field="tipo" header="Tipo" sortable>
                <template #body="{ data }">
                  <Badge 
                    :value="data.tipo === 'entrada' ? 'Entrada' : 'Salida'" 
                    :severity="data.tipo === 'entrada' ? 'success' : 'danger'" 
                    class="text-xs uppercase"
                  />
                </template>
              </Column>
              <Column field="cantidad" header="Cant." sortable class="text-center"></Column>
              <Column field="stock_nuevo" header="Stock Final" class="text-center font-bold"></Column>
              <Column field="motivo" header="Motivo" class="hidden lg:table-cell"></Column>
            </DataTable>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>

    <!-- Modal Producto (Componente Reutilizable) -->
    <ProductFormDialog
      v-model:visible="modal.visible"
      :mode="modal.modo"
      :initial-data="modal.producto"
      :categories="todasLasCategorias"
      @saved="onProductSaved"
    />

    <!-- Modal Entrada de Stock -->
    <Dialog v-model:visible="modalEntrada.visible" header="Agregar Stock" modal class="w-full max-w-[90vw] md:max-w-sm">
      <div class="flex flex-col gap-4 py-2" v-if="modalEntrada.producto">
        <p class="text-sm text-gray-600 mb-2">
          Producto: <br><span class="font-bold text-gray-800 text-lg">{{ modalEntrada.producto.nombre }}</span>
        </p>
        <div class="flex flex-col gap-2">
          <label for="cantidad_entrada" class="font-semibold">Cantidad a Ingresar</label>
          <InputNumber id="cantidad_entrada" v-model="modalEntrada.cantidad" :min="1" autoFocus fluid />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancelar" text severity="secondary" @click="modalEntrada.visible = false" />
          <Button label="Confirmar Entrada" icon="pi pi-check" severity="success" @click="guardarEntradaStock" :loading="guardando" />
        </div>
      </template>
    </Dialog>

    <!-- Componente de Confirmación Global -->
    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { getProductos, updateProducto, deleteProducto } from '../services/productos'
import { getHistorialMovimientos } from '../services/inventarioMovimientos'
import { formatCurrency } from '../utils/calculations'
import { handleError, showSuccess } from '../utils/errorHandler'
import { useConfirm } from "primevue/useconfirm"
import ProductFormDialog from '../components/inventory/ProductFormDialog.vue'

import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Badge from 'primevue/badge'
import Select from 'primevue/select'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import ConfirmDialog from 'primevue/confirmdialog'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

// Servicios de PrimeVue
const confirm = useConfirm()

// Estados
const productos = ref([])
const totalProductos = ref(0)
const busqueda = ref('')
const filtroCategoria = ref(null)
const loading = ref(false)
const guardando = ref(false)
const metricas = ref({ stockTotal: 0, valorTotal: 0, bajoStock: 0 })
const todasLasCategorias = ref([])

const movimientos = ref([])
const busquedaHistorial = ref('')
const loadingHistorial = ref(false)

// Computados
const movimientosFiltrados = computed(() => {
  if (!busquedaHistorial.value) return movimientos.value
  const q = busquedaHistorial.value.toLowerCase()
  return movimientos.value.filter(m => 
    m.producto_nombre?.toLowerCase().includes(q) || 
    m.motivo?.toLowerCase().includes(q) ||
    m.tipo?.toLowerCase().includes(q)
  )
})

const modal = ref({ visible: false, modo: 'crear', producto: {} })

const modalEntrada = ref({ visible: false, producto: null, cantidad: 1 })

// Funciones
const fetchProductos = async () => {
  try {
    loading.value = true
    const res = await getProductos({
      search: busqueda.value,
      categoria: filtroCategoria.value
    })
    productos.value = res.data
    totalProductos.value = res.total
  } catch (err) {
    handleError(err, 'No se pudieron cargar los productos')
  } finally {
    loading.value = false
  }
}

const fetchHistorial = async () => {
  try {
    loadingHistorial.value = true
    const data = await getHistorialMovimientos({ limit: 50 })
    movimientos.value = data
  } catch (err) {
    console.error(err)
  } finally {
    loadingHistorial.value = false
  }
}

const cargarMetricasYCategorias = async () => {
  try {
    const res = await getProductos({ limit: 1000 })
    const todos = res.data
    metricas.value.stockTotal = todos.reduce((a, b) => a + Number(b.stock || 0), 0)
    metricas.value.valorTotal = todos.reduce((a, b) => a + Number(b.precio || 0) * Number(b.stock || 0), 0)
    metricas.value.bajoStock = todos.filter(p => (p.stock || 0) < 10).length
    todasLasCategorias.value = [...new Set(todos.map(p => p.categoria).filter(Boolean))]
  } catch (err) {
    console.error(err)
  }
}

const formatFecha = (fecha) => {
  if (!fecha) return ''
  return new Date(fecha).toLocaleString('es-NI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const abrirModal = (modo, producto = null) => {
  modal.value = { 
    visible: true, 
    modo, 
    producto: producto ? { ...producto } : {} 
  }
}

const abrirModalEntrada = (producto) => {
  modalEntrada.value = {
    visible: true,
    producto,
    cantidad: 1
  }
}

const guardarEntradaStock = async () => {
  if (!modalEntrada.value.producto || modalEntrada.value.cantidad <= 0) return

  try {
    guardando.value = true
    const id = modalEntrada.value.producto.id
    const nuevoStock = Number(modalEntrada.value.producto.stock) + Number(modalEntrada.value.cantidad)
    
    await updateProducto(id, { 
      ...modalEntrada.value.producto,
      stock: nuevoStock 
    })
    
    showSuccess(`Se agregaron ${modalEntrada.value.cantidad} unidades a ${modalEntrada.value.producto.nombre}`)
    modalEntrada.value.visible = false
    fetchProductos()
    cargarMetricasYCategorias()
    fetchHistorial() // Actualizar historial
  } catch (err) {
    handleError(err, 'Error al actualizar el stock')
  } finally {
    guardando.value = false
  }
}

const onProductSaved = () => {
    fetchProductos()
    cargarMetricasYCategorias()
    fetchHistorial() // Actualizar historial
}

const confirmarEliminar = (producto) => {
  confirm.require({
    message: `¿Estás seguro de eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`,
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
        label: 'Cancelar',
        severity: 'secondary',
        outlined: true
    },
    acceptProps: {
        label: 'Eliminar',
        severity: 'danger'
    },
    accept: async () => {
      try {
        await deleteProducto(producto.id)
        showSuccess('Producto eliminado')
        fetchProductos()
        cargarMetricasYCategorias()
        fetchHistorial() // Actualizar historial
      } catch (err) {
        handleError(err)
      }
    }
  })
}

// Watchers
watch([busqueda, filtroCategoria], () => {
  fetchProductos()
})

// Init
onMounted(() => {
  fetchProductos()
  cargarMetricasYCategorias()
})
</script>
