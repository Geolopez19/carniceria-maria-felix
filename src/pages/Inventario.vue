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
              <Column field="codigo" header="Código" sortable>
                <template #body="{ data }">
                  <span class="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {{ data.codigo || '—' }}
                  </span>
                </template>
              </Column>
              <Column field="nombre" header="Nombre" sortable></Column>
              <Column field="categoria" header="Categoría" sortable class="hidden md:table-cell"></Column>
              <Column field="tipo_venta" header="Venta" sortable class="hidden lg:table-cell">
                <template #body="{ data }">
                  <Badge :value="getTipoVentaLabel(data.tipo_venta)" :severity="getTipoVentaSeverity(data.tipo_venta)" class="text-[10px] uppercase font-bold" />
                </template>
              </Column>
              <Column field="stock" header="Stock" sortable>
                <template #body="{ data }">
                  <div class="flex flex-col gap-1">
                    <Badge :value="`${data.stock || 0} ${data.unidad_medida || 'lbs'}`" :severity="data.stock < 10 ? 'danger' : data.stock > 50 ? 'success' : 'warn'" />
                    <span v-if="data.tipo_venta === 'PAQUETE'" class="text-[9px] text-slate-500 font-mono font-medium">
                      Granel: {{ data.stock_granel || 0 }} | Emp: {{ data.stock_empacado || 0 }}
                    </span>
                  </div>
                </template>
              </Column>
              <Column field="precio" header="Precio" sortable>
                <template #body="{ data }">
                  <span class="font-bold text-slate-800">{{ formatCurrency(data.precio) }}</span>
                  <span class="text-[10px] text-slate-500 font-medium"> / {{ data.unidad_medida || 'lb' }}</span>
                </template>
              </Column>
              <Column header="Acciones">
                <template #body="{ data }">
                  <div class="flex gap-1 md:gap-2">
                    <Button icon="pi pi-qrcode" severity="secondary" text rounded @click="abrirModalEtiqueta(data)" title="Ver / Imprimir Código de Barras / QR" />
                    <Button icon="pi pi-plus" severity="success" text rounded @click="abrirModalEntrada(data)" title="Agregar Stock" />
                    <Button v-if="data.tipo_venta === 'PAQUETE'" icon="pi pi-box" severity="warn" text rounded @click="abrirModalVerPaquetes(data)" title="Ver Paquetes" />
                    <Button v-if="data.tipo_venta === 'PAQUETE'" icon="pi pi-tags" severity="help" text rounded @click="navegarAEmpacar(data)" title="Empacar Producto" />
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

    <!-- Modal Etiqueta (Código de Barras y QR) -->
    <Dialog v-model:visible="modalEtiqueta.visible" header="Etiqueta del Producto" modal class="w-full max-w-[90vw] md:max-w-md">
      <div class="flex flex-col items-center gap-4 py-4" v-if="modalEtiqueta.producto" id="etiqueta-imprimible">
        <div class="text-center">
          <h3 class="font-black text-xl text-slate-800 uppercase tracking-tight">{{ modalEtiqueta.producto.nombre }}</h3>
          <p class="text-xs text-slate-500 font-medium mt-0.5">Carnicería María Félix</p>
          <div class="text-lg font-bold text-indigo-600 mt-1">
            {{ formatCurrency(modalEtiqueta.producto.precio) }} / {{ modalEtiqueta.producto.unidad_medida || 'lb' }}
          </div>
        </div>

        <!-- Renderizado Código de Barras -->
        <div class="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs w-full flex flex-col items-center">
          <svg id="barcode-canvas" class="max-w-full h-16"></svg>
        </div>

        <!-- Renderizado Código QR -->
        <div v-if="modalEtiqueta.qrUrl" class="flex flex-col items-center bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <img :src="modalEtiqueta.qrUrl" alt="QR" class="w-28 h-28 object-contain" />
          <span class="text-[10px] font-mono text-slate-400 mt-1">Código QR</span>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-between items-center w-full">
          <Button label="Cerrar" text severity="secondary" @click="modalEtiqueta.visible = false" />
          <Button label="Imprimir Etiqueta" icon="pi pi-print" severity="primary" @click="imprimirEtiqueta" class="!text-white" style="color: white !important;" />
        </div>
      </template>
    </Dialog>

    <!-- Modal Ver Paquetes -->
    <Dialog v-model:visible="modalPaquetes.visible" :header="`Paquetes - ${modalPaquetes.producto?.nombre || ''}`" modal class="w-full max-w-[90vw] md:max-w-4xl">
      <div class="flex flex-col gap-4 py-2">
        <div class="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div class="text-sm text-slate-700">
            <strong>Stock Total:</strong> {{ modalPaquetes.producto?.stock }} {{ modalPaquetes.producto?.unidad_medida }}
          </div>
          <div class="text-sm text-slate-700">
            <strong>Granel:</strong> {{ modalPaquetes.producto?.stock_granel }} {{ modalPaquetes.producto?.unidad_medida }}
          </div>
          <div class="text-sm text-slate-700">
            <strong>Empacado:</strong> {{ modalPaquetes.producto?.stock_empacado }} {{ modalPaquetes.producto?.unidad_medida }}
          </div>
        </div>

        <!-- Barra de acciones masivas -->
        <div class="flex justify-between items-center mb-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200" v-if="modalPaquetes.paquetes.length > 0">
          <span class="text-xs font-semibold text-slate-600">
            {{ selectedPackages.length }} paquetes seleccionados
          </span>
          <Button 
            v-if="selectedPackages.length > 0"
            label="Imprimir Selección (102x51mm)" 
            icon="pi pi-print" 
            severity="primary" 
            size="small" 
            @click="imprimirSeleccionados" 
            class="!text-white"
            style="color: white !important;"
          />
        </div>

        <DataTable v-model:selection="selectedPackages" :value="modalPaquetes.paquetes" :loading="modalPaquetes.loading" class="p-datatable-sm bg-white" stripedRows paginator :rows="10">
          <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
          <Column field="sub_codigo" header="Código" sortable>
            <template #body="{ data }">
              <span class="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {{ data.sub_codigo }}
              </span>
            </template>
          </Column>
          <Column field="codigo_barras" header="Código Barras" sortable class="font-mono text-xs"></Column>
          <Column field="peso" header="Peso" sortable>
            <template #body="{ data }">
              <span class="font-bold font-mono">{{ data.peso }} {{ modalPaquetes.producto?.unidad_medida }}</span>
            </template>
          </Column>
          <Column field="precio_total" header="Total" sortable>
            <template #body="{ data }">
              <span class="font-bold text-green-600">{{ formatCurrency(data.precio_total) }}</span>
            </template>
          </Column>
          <Column field="estado" header="Estado" sortable>
            <template #body="{ data }">
              <Tag :value="data.estado" :severity="getEstadoSeverity(data.estado)" />
            </template>
          </Column>
          <Column header="Acciones">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button icon="pi pi-print" severity="secondary" text rounded @click="imprimirEtiquetaPaquete(data)" title="Imprimir Etiqueta" />
                <Button v-if="data.estado === 'DISPONIBLE'" icon="pi pi-trash" severity="danger" text rounded @click="confirmarMermaPaquete(data)" title="Reportar como Merma" />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
      <template #footer>
        <Button label="Cerrar" text severity="secondary" @click="modalPaquetes.visible = false" />
      </template>
    </Dialog>

    <!-- Dialog para registrar Merma del Paquete -->
    <Dialog v-model:visible="modalMerma.visible" header="Registrar Merma de Paquete" modal class="w-full max-w-[90vw] md:max-w-sm">
      <div class="flex flex-col gap-4 py-2" v-if="modalMerma.paquete">
        <p class="text-sm text-slate-600 mb-2">
          Paquete: <strong>{{ modalMerma.paquete.sub_codigo }}</strong> ({{ modalMerma.paquete.peso }} {{ modalPaquetes.producto?.unidad_medida }})
        </p>
        <div class="flex flex-col gap-2">
          <label for="motivo_merma" class="font-semibold text-sm">Motivo de Merma</label>
          <Textarea id="motivo_merma" v-model="modalMerma.motivo" placeholder="Ej. Empaque roto, fecha de vencimiento pasada, etc." rows="3" fluid />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancelar" text severity="secondary" @click="modalMerma.visible = false" />
          <Button label="Registrar Merma" icon="pi pi-check" severity="danger" @click="guardarMermaPaquete" :loading="modalMerma.saving" />
        </div>
      </template>
    </Dialog>

    <!-- Componente de Confirmación Global -->
    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import { getProductos, updateProducto, deleteProducto } from '../services/productos'
import { getHistorialMovimientos } from '../services/inventarioMovimientos'
import { getPaquetesByProducto, registrarMermaPaquete } from '../services/paquetes'
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
import Tag from 'primevue/tag'
import Select from 'primevue/select'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import ConfirmDialog from 'primevue/confirmdialog'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

// Router
const router = useRouter()

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

// Estados para Modales de Paquetes y Merma
const modalPaquetes = ref({
  visible: false,
  producto: null,
  paquetes: [],
  loading: false
})

const selectedPackages = ref([])

const modalMerma = ref({
  visible: false,
  paquete: null,
  motivo: '',
  saving: false
})

// Estado para Modal de Etiqueta
const modalEtiqueta = ref({ visible: false, producto: null, qrUrl: '' })

const abrirModalEtiqueta = async (producto) => {
  modalEtiqueta.value = {
    visible: true,
    producto,
    qrUrl: ''
  }

  await nextTick()

  const code = producto.codigo || producto.nombre || '00000'
  try {
    JsBarcode("#barcode-canvas", code, {
      format: "CODE128",
      lineColor: "#000",
      width: 2,
      height: 50,
      displayValue: true
    })
  } catch (e) {
    console.warn("Error rendering barcode:", e)
  }

  try {
    modalEtiqueta.value.qrUrl = await QRCode.toDataURL(code, { width: 200, margin: 1 })
  } catch (e) {
    console.warn("Error rendering QR code:", e)
  }
}

const imprimirEtiqueta = () => {
  const prod = modalEtiqueta.value.producto
  if (!prod) return

  const printWindow = window.open('', '_blank')
  
  const html = `
    <html>
      <head>
        <title>Etiqueta ${prod.nombre}</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
        <style>
          @page {
            size: 102mm 51mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: #fff;
            -webkit-print-color-adjust: exact;
          }
          .label-container {
            width: 102mm;
            height: 51mm;
            box-sizing: border-box;
            padding: 3mm 5mm;
            text-align: center;
            font-family: 'Courier New', Courier, monospace;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          .title {
            font-size: 13px;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
          }
          .subtitle {
            font-size: 8px;
            font-weight: bold;
            margin-top: 1px;
            color: #555;
          }
          .precio {
            font-size: 16px;
            font-weight: bold;
            margin: 4px 0;
          }
          .barcode-wrapper {
            margin-top: 4px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .barcode-svg {
            height: 38px;
            max-width: 90%;
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <h2 class="title">${prod.nombre}</h2>
          <div class="subtitle">CARNICERÍA MARÍA FÉLIX</div>
          <div class="precio">PRECIO: C$${Number(prod.precio || 0).toFixed(2)} / ${prod.unidad_medida || 'lb'}</div>
          <div class="barcode-wrapper">
            <svg id="barcode-svg"></svg>
          </div>
        </div>
        <script>
          window.onload = function() {
            JsBarcode("#barcode-svg", "${prod.codigo || prod.nombre}", {
              format: "CODE128",
              lineColor: "#000",
              width: 1.8,
              height: 35,
              displayValue: true,
              fontSize: 9,
              margin: 0
            });
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 300);
          }
        <\/script>
      </body>
    </html>
  `
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}

// Helpers de Paquetes
const getEstadoSeverity = (estado) => ({
  DISPONIBLE: 'success',
  VENDIDO: 'info',
  ANULADO: 'warn',
  DEVUELTO: 'secondary',
  MERMA: 'danger'
}[estado] || 'info')

const getTipoVentaLabel = (tipo) => ({
  UNIDAD: 'Unidad',
  PESO: 'Peso (Granel)',
  PAQUETE: 'Paquete'
}[tipo] || 'Unidad')

const getTipoVentaSeverity = (tipo) => ({
  UNIDAD: 'secondary',
  PESO: 'info',
  PAQUETE: 'success'
}[tipo] || 'secondary')

const abrirModalVerPaquetes = async (producto) => {
  modalPaquetes.value.producto = producto
  modalPaquetes.value.paquetes = []
  selectedPackages.value = []
  modalPaquetes.value.visible = true
  await cargarPaquetes()
}

const cargarPaquetes = async () => {
  const prod = modalPaquetes.value.producto
  if (!prod) return
  try {
    modalPaquetes.value.loading = true
    const data = await getPaquetesByProducto(prod.id)
    modalPaquetes.value.paquetes = data
  } catch (err) {
    handleError(err, 'Error al cargar paquetes')
  } finally {
    modalPaquetes.value.loading = false
  }
}

const confirmarMermaPaquete = (paquete) => {
  modalMerma.value.paquete = paquete
  modalMerma.value.motivo = ''
  modalMerma.value.saving = false
  modalMerma.value.visible = true
}

const guardarMermaPaquete = async () => {
  const pkg = modalMerma.value.paquete
  if (!pkg) return
  try {
    modalMerma.value.saving = true
    await registrarMermaPaquete(pkg.id, modalMerma.value.motivo)
    showSuccess(`Paquete ${pkg.sub_codigo} registrado como merma.`)
    modalMerma.value.visible = false
    await cargarPaquetes()
    await fetchProductos()
    await cargarMetricasYCategorias()
  } catch (err) {
    handleError(err, 'Error al registrar merma de paquete')
  } finally {
    modalMerma.value.saving = false
  }
}

const imprimirEtiquetaPaquete = (paquete) => {
  imprimirEtiquetasMasivo([paquete])
}

const imprimirSeleccionados = () => {
  imprimirEtiquetasMasivo(selectedPackages.value)
}

const imprimirEtiquetasMasivo = (paquetesSeleccionados) => {
  if (!paquetesSeleccionados || paquetesSeleccionados.length === 0) return

  const prod = modalPaquetes.value.producto
  const printWindow = window.open('', '_blank')
  
  let labelHTML = ''
  
  paquetesSeleccionados.forEach((paquete, index) => {
    labelHTML += `
      <div class="label-container">
        <div style="width:100%">
          <div class="business-name">CARNICERÍA MARÍA FÉLIX</div>
          <h2 class="title">${prod.nombre}</h2>
          <div class="peso">${Number(paquete.peso).toFixed(2)} ${prod.unidad_medida || 'lbs'}</div>
          <div class="precio">TOTAL: C$${Number(paquete.precio_total).toFixed(2)}</div>
        </div>
        <div class="barcode-wrapper">
          <svg class="barcode-svg" data-code="${paquete.codigo_barras}"></svg>
        </div>
      </div>
    `
    if (index < paquetesSeleccionados.length - 1) {
      labelHTML += '<div class="page-break"></div>'
    }
  })

  const html = `
    <html>
      <head>
        <title>Etiquetas Carnicería María Félix</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
        <style>
          @page {
            size: 56.0mm 38.0mm;
            margin: 0;
          }
          @media print {
            .page-break {
              page-break-after: always;
              break-after: page;
              clear: both;
            }
          }
          body {
            margin: 0;
            padding: 0;
            background: #fff;
            -webkit-print-color-adjust: exact;
          }
          .label-container {
            width: 56.0mm;
            height: 38.0mm;
            box-sizing: border-box;
            padding: 1.2mm 2mm;
            text-align: center;
            font-family: Arial, Helvetica, sans-serif;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 1mm;
          }
          .business-name {
            font-size: 7.5px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: normal;
            white-space: nowrap;
            border-bottom: 1px solid #000;
            padding-bottom: 1px;
            margin-bottom: 1px;
            width: 100%;
          }
          .title {
            font-size: 13px;
            font-weight: 900;
            margin: 1px 0 2px 0;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            line-height: 1.1;
          }
          .peso {
            font-size: 23px;
            font-weight: 900;
            margin: 1px 0 0 0;
            font-family: Arial, sans-serif;
            line-height: 1;
          }
          .precio {
            font-size: 14px;
            font-weight: 900;
            margin: 1px 0 0 0;
          }
          .barcode-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            overflow: hidden;
          }
          .barcode-svg {
            height: 24px;
            max-width: 95%;
          }
        </style>
      </head>
      <body>
        ${labelHTML}
        <script>
          window.onload = function() {
            const elms = document.querySelectorAll('.barcode-svg');
            elms.forEach(svg => {
              const code = svg.getAttribute('data-code');
              JsBarcode(svg, code, {
                format: "CODE128",
                lineColor: "#000",
                width: 1.3,
                height: 22,
                displayValue: true,
                fontSize: 8.5,
                fontOptions: "bold",
                font: "Arial",
                margin: 0
              });
            });
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 300);
          }
        <\/script>
      </body>
    </html>
  `
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}

const navegarAEmpacar = (producto) => {
  router.push({ name: 'Empaquetar', query: { productoId: producto.id } })
}

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
    const prod = modalEntrada.value.producto
    
    // Al agregar stock manual, incrementamos el stock a granel (que aplica para todos los tipos de venta)
    const nuevoStockGranel = Number(prod.stock_granel || 0) + Number(modalEntrada.value.cantidad)
    
    await updateProducto(id, { 
      ...prod,
      stock_granel: nuevoStockGranel 
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
