<template>
  <div class="p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
    <!-- Ticket Térmico Imprimible Oculto -->
    <ReceiptAbonoTicket
      :apartado="printData.apartado"
      :abono="printData.abono"
      :items="printData.items"
      :business="businessStore.settings"
    />

    <!-- Header Principal -->
    <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-700 rounded-2xl p-6 mb-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/30 text-amber-300 font-bold text-xs uppercase tracking-wider">
            🏍️ Plan Separe / Cascos & Accesorios
          </span>
        </div>
        <h1 class="text-2xl md:text-3xl font-black tracking-tight">Sistema de Apartados</h1>
        <p class="text-slate-300 text-sm">Gestiona reservas de cascos y recibe abonos periódicos de los clientes</p>
      </div>

      <div class="flex flex-wrap gap-2 w-full md:w-auto">
        <Button
          label="Nuevo Apartado"
          icon="pi pi-plus"
          class="!bg-amber-600 hover:!bg-amber-700 !border-0 !text-white font-bold !px-5 !py-2.5 !rounded-xl !shadow-lg"
          @click="openNuevoApartadoModal"
        />
      </div>
    </div>

    <!-- Métricas del Sistema -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
      <Card class="bg-white border border-slate-200 shadow-xs">
        <template #title>
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Apartados</span>
        </template>
        <template #content>
          <div class="text-2xl font-black text-slate-800">{{ stats.total }}</div>
        </template>
      </Card>
      <Card class="bg-emerald-50/50 border border-emerald-200 shadow-xs">
        <template #title>
          <span class="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Recaudado</span>
        </template>
        <template #content>
          <div class="text-2xl font-black text-emerald-700">{{ formatCurrency(stats.totalAbonado) }}</div>
        </template>
      </Card>
      <Card class="bg-amber-50/50 border border-amber-200 shadow-xs">
        <template #title>
          <span class="text-xs font-bold text-amber-700 uppercase tracking-wider">Saldo por Cobrar</span>
        </template>
        <template #content>
          <div class="text-2xl font-black text-amber-700">{{ formatCurrency(stats.saldoPendiente) }}</div>
        </template>
      </Card>
      <Card class="bg-blue-50/50 border border-blue-200 shadow-xs">
        <template #title>
          <span class="text-xs font-bold text-blue-700 uppercase tracking-wider">Activos / Pendientes</span>
        </template>
        <template #content>
          <div class="text-2xl font-black text-blue-700">{{ stats.activos }}</div>
        </template>
      </Card>
    </div>

    <!-- Filtros y Búsqueda -->
    <div class="bg-white p-4 rounded-xl shadow-xs border border-slate-200 mb-4 flex flex-col md:flex-row gap-3 justify-between items-center">
      <IconField iconPosition="left" class="w-full md:w-80">
        <InputIcon class="pi pi-search text-slate-400" />
        <InputText v-model="searchQuery" placeholder="Buscar por cliente, código o teléfono..." class="w-full text-sm" />
      </IconField>

      <div class="flex items-center gap-2 w-full md:w-auto">
        <Select
          v-model="statusFilter"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Estado"
          class="w-full md:w-44 text-sm"
        />
      </div>
    </div>

    <!-- Tabla Principal de Apartados -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <DataTable
        :value="filteredApartados"
        :loading="isLoading"
        paginator
        :rows="10"
        stripedRows
        class="p-datatable-sm"
      >
        <template #empty>
          <div class="p-8 text-center text-slate-400">
            <i class="pi pi-inbox text-3xl mb-2 block"></i>
            No hay apartados registrados con los criterios seleccionados.
          </div>
        </template>

        <Column field="codigo_apartado" header="Código" style="width: 110px">
          <template #body="{ data }">
            <span class="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded border border-slate-200">
              {{ data.codigo_apartado }}
            </span>
          </template>
        </Column>

        <Column field="customer_name" header="Cliente">
          <template #body="{ data }">
            <div class="font-bold text-slate-800">{{ data.customer_name }}</div>
            <div class="text-xs text-slate-400" v-if="data.customer_phone">{{ data.customer_phone }}</div>
          </template>
        </Column>

        <Column header="Productos">
          <template #body="{ data }">
            <div class="space-y-0.5 max-w-[200px]">
              <div v-for="item in data.items" :key="item.id" class="text-xs truncate text-slate-700 font-medium">
                • {{ item.product_name }} (x{{ item.qty }})
              </div>
            </div>
          </template>
        </Column>

        <Column header="Progreso de Pago" style="min-width: 180px">
          <template #body="{ data }">
            <div class="space-y-1">
              <div class="flex justify-between text-[11px] font-bold">
                <span class="text-emerald-700">{{ formatCurrency(data.total_abonado) }}</span>
                <span class="text-slate-500">de {{ formatCurrency(data.total) }}</span>
              </div>
              <!-- Barra de progreso -->
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="getProgressColor(data)"
                  :style="{ width: `${Math.min(100, Math.round((data.total_abonado / (data.total || 1)) * 100))}%` }"
                ></div>
              </div>
              <div class="flex justify-between text-[10px] text-slate-400">
                <span>{{ Math.round((data.total_abonado / (data.total || 1)) * 100) }}% pagado</span>
                <span v-if="data.saldo_pendiente > 0" class="font-bold text-amber-700">Resta: {{ formatCurrency(data.saldo_pendiente) }}</span>
                <span v-else class="font-bold text-emerald-600">¡Completado!</span>
              </div>
            </div>
          </template>
        </Column>

        <Column field="fecha_limite" header="Límite" style="width: 110px">
          <template #body="{ data }">
            <span class="text-xs font-semibold text-slate-600" v-if="data.fecha_limite">
              {{ formatDateOnly(data.fecha_limite) }}
            </span>
            <span v-else class="text-xs text-slate-400">—</span>
          </template>
        </Column>

        <Column field="status" header="Estado" style="width: 110px">
          <template #body="{ data }">
            <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" class="text-[10px] uppercase font-bold" />
          </template>
        </Column>

        <Column header="Acciones" style="width: 160px" class="text-right">
          <template #body="{ data }">
            <div class="flex gap-1 justify-end">
              <!-- Botón Abonar -->
              <Button
                v-if="data.status === 'activo'"
                icon="pi pi-plus-circle"
                severity="success"
                text
                rounded
                @click="openAbonarModal(data)"
                title="Registrar Abono"
              />

              <!-- Botón Entregar -->
              <Button
                v-if="data.status === 'liquidado'"
                icon="pi pi-check-circle"
                severity="help"
                text
                rounded
                @click="confirmarEntrega(data)"
                title="Entregar Producto al Cliente"
              />

              <!-- Ver Detalle / Historial -->
              <Button
                icon="pi pi-eye"
                severity="info"
                text
                rounded
                @click="openDetalleModal(data)"
                title="Ver Historial de Abonos"
              />

              <!-- Cancelar -->
              <Button
                v-if="data.status === 'activo'"
                icon="pi pi-times"
                severity="danger"
                text
                rounded
                @click="confirmarCancelar(data)"
                title="Cancelar Apartado"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- MODAL 1: NUEVO APARTADO -->
    <Dialog
      v-model:visible="nuevoModalVisible"
      header="Crear Nuevo Apartado de Casco / Accesorio"
      modal
      class="w-full max-w-xl"
    >
      <div class="space-y-4 py-2">
        <!-- Cliente -->
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-700 uppercase">Cliente</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <InputText v-model="nuevoForm.customerName" placeholder="Nombre completo del cliente *" class="w-full" />
            <InputText v-model="nuevoForm.customerPhone" placeholder="Teléfono / WhatsApp" class="w-full" />
          </div>
        </div>

        <!-- Selección de Casco/Producto -->
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-700 uppercase">Seleccionar Producto del Inventario</label>
          <div class="flex gap-2">
            <Select
              v-model="selectedProduct"
              :options="productosList"
              optionLabel="nombre"
              filter
              placeholder="Buscar casco o accesorio..."
              class="w-full"
            >
              <template #option="{ option }">
                <div class="flex justify-between items-center w-full">
                  <div>
                    <span class="font-bold text-sm">{{ option.nombre }}</span>
                    <span v-if="option.talla" class="text-xs text-slate-400 ml-2">Talla: {{ option.talla }}</span>
                  </div>
                  <span class="font-bold text-emerald-700 text-xs">{{ formatCurrency(option.precio) }}</span>
                </div>
              </template>
            </Select>
            <Button icon="pi pi-plus" @click="addItemToNuevo" :disabled="!selectedProduct" />
          </div>
        </div>

        <!-- Lista de productos agregados -->
        <div v-if="nuevoForm.items.length > 0" class="border border-slate-200 rounded-xl overflow-hidden">
          <div v-for="(item, idx) in nuevoForm.items" :key="idx" class="flex justify-between items-center p-3 border-b last:border-0 bg-slate-50">
            <div>
              <div class="font-bold text-sm text-slate-800">{{ item.product_name }}</div>
              <div class="text-xs text-slate-500">Cant: {{ item.qty }} x {{ formatCurrency(item.unit_price) }}</div>
            </div>
            <div class="flex items-center gap-3">
              <span class="font-black text-slate-800">{{ formatCurrency(item.qty * item.unit_price) }}</span>
              <Button icon="pi pi-trash" severity="danger" text rounded size="small" @click="removeItemFromNuevo(idx)" />
            </div>
          </div>
        </div>

        <!-- Total y Prima Inicial -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/60 p-3 rounded-xl border border-amber-200">
          <div>
            <span class="text-xs font-bold text-slate-600 block uppercase">Total del Apartado:</span>
            <span class="text-2xl font-black text-slate-800">{{ formatCurrency(nuevoTotal) }}</span>
          </div>
          <div>
            <label class="text-xs font-bold text-slate-700 block uppercase">Prima / Abono Inicial:</label>
            <InputNumber
              v-model="nuevoForm.primaMonto"
              mode="currency"
              currency="NIO"
              locale="es-NI"
              :max="nuevoTotal"
              fluid
              class="mt-1 font-bold"
              placeholder="C$ 0.00"
            />
          </div>
        </div>

        <!-- Fecha Límite -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-bold text-slate-700 uppercase block mb-1">Fecha Límite para Retirar</label>
            <InputText type="date" v-model="nuevoForm.fechaLimite" class="w-full text-sm" />
          </div>
          <div>
            <label class="text-xs font-bold text-slate-700 uppercase block mb-1">Método de Pago de Prima</label>
            <Select
              v-model="nuevoForm.paymentMethod"
              :options="paymentOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full text-sm"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="nuevoModalVisible = false" />
        <Button
          label="Crear Apartado"
          icon="pi pi-check"
          severity="success"
          :loading="isSaving"
          :disabled="nuevoForm.items.length === 0 || !nuevoForm.customerName"
          @click="handleGuardarApartado"
          class="!font-bold !px-5"
        />
      </template>
    </Dialog>

    <!-- MODAL 2: REGISTRAR ABONO -->
    <Dialog
      v-model:visible="abonoModalVisible"
      header="Registrar Abono a Cuenta"
      modal
      class="w-full max-w-md"
    >
      <div class="space-y-4 py-2" v-if="selectedApartado">
        <!-- Info del Apartado -->
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div class="flex justify-between items-center text-sm">
            <span class="font-bold text-slate-800">{{ selectedApartado.customer_name }}</span>
            <span class="font-mono text-xs bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">
              {{ selectedApartado.codigo_apartado }}
            </span>
          </div>
          <div class="flex justify-between items-center text-xs mt-2 text-slate-600">
            <span>Saldo Pendiente:</span>
            <span class="font-black text-rose-600 text-base">{{ formatCurrency(selectedApartado.saldo_pendiente) }}</span>
          </div>
        </div>

        <!-- Monto a Abonar -->
        <div>
          <label class="text-xs font-bold text-slate-700 uppercase block mb-1">Monto a Abonar (C$)</label>
          <InputNumber
            v-model="abonoForm.monto"
            mode="currency"
            currency="NIO"
            locale="es-NI"
            :max="selectedApartado.saldo_pendiente"
            fluid
            class="text-xl font-black"
            placeholder="C$ 0.00"
          />
        </div>

        <!-- Efectivo y Vuelto si aplica -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[11px] font-bold text-slate-600 block uppercase mb-1">Método de Pago</label>
            <Select
              v-model="abonoForm.paymentMethod"
              :options="paymentOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full text-xs"
            />
          </div>
          <div v-if="abonoForm.paymentMethod === 'efectivo'">
            <label class="text-[11px] font-bold text-slate-600 block uppercase mb-1">Billete Recibido</label>
            <InputNumber
              v-model="abonoForm.amountReceived"
              mode="currency"
              currency="NIO"
              locale="es-NI"
              fluid
              class="text-xs"
              placeholder="C$ 0.00"
            />
          </div>
        </div>

        <!-- Vuelto Calculado -->
        <div
          v-if="abonoForm.paymentMethod === 'efectivo' && abonoForm.amountReceived > abonoForm.monto"
          class="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex justify-between items-center text-xs"
        >
          <span class="font-bold text-emerald-800">Vuelto al cliente:</span>
          <span class="font-black text-emerald-700 text-sm">
            {{ formatCurrency(abonoForm.amountReceived - abonoForm.monto) }}
          </span>
        </div>

        <!-- Saldo Nuevo Calculado -->
        <div class="flex justify-between items-center border-t border-slate-200 pt-3 text-sm">
          <span class="font-bold text-slate-600">Nuevo Saldo Restante:</span>
          <span class="font-black text-slate-800">
            {{ formatCurrency(Math.max(0, selectedApartado.saldo_pendiente - (abonoForm.monto || 0))) }}
          </span>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="abonoModalVisible = false" />
        <Button
          label="Confirmar Abono e Imprimir"
          icon="pi pi-print"
          severity="success"
          :loading="isSaving"
          :disabled="!abonoForm.monto || abonoForm.monto <= 0"
          @click="handleGuardarAbono"
          class="!font-bold !px-5"
        />
      </template>
    </Dialog>

    <!-- MODAL 3: HISTORIAL DETALLADO DEL APARTADO -->
    <Dialog
      v-model:visible="detalleModalVisible"
      header="Detalle e Historial de Abonos"
      modal
      class="w-full max-w-lg"
    >
      <div v-if="selectedApartado" class="space-y-4 py-2">
        <div class="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            <div class="font-bold text-slate-800">{{ selectedApartado.customer_name }}</div>
            <div class="text-xs text-slate-400">Creado el: {{ formatDateOnly(selectedApartado.created_at) }}</div>
          </div>
          <Tag :value="getStatusLabel(selectedApartado.status)" :severity="getStatusSeverity(selectedApartado.status)" />
        </div>

        <!-- Lista de Abonos -->
        <div>
          <h4 class="text-xs font-bold uppercase text-slate-500 mb-2">Historial de Pagos Realizados</h4>
          <div class="space-y-2 max-h-56 overflow-y-auto">
            <div
              v-for="abono in selectedApartado.abonos"
              :key="abono.id"
              class="flex justify-between items-center p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
            >
              <div>
                <span class="font-bold text-slate-700">Abono #{{ abono.numero_abono }}</span>
                <span class="text-slate-400 block text-[10px]">{{ formatDate(abono.created_at) }} ({{ abono.payment_method }})</span>
              </div>
              <div class="text-right">
                <span class="font-black text-emerald-600 block text-sm">{{ formatCurrency(abono.monto) }}</span>
                <span class="text-[10px] text-slate-400">Saldo: {{ formatCurrency(abono.saldo_nuevo) }}</span>
              </div>
            </div>
            <div v-if="!selectedApartado.abonos || selectedApartado.abonos.length === 0" class="text-xs text-slate-400 text-center py-2">
              No hay abonos registrados.
            </div>
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Confirm Dialog -->
    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { listApartados, crearApartado, registrarAbono, cancelarApartado, marcarEntregado } from '../services/apartados'
import { getProductos } from '../services/productos'
import { formatCurrency } from '../utils/calculations'
import { handleError, showSuccess } from '../utils/errorHandler'
import { useBusinessStore } from '../stores/businessStore'
import { useConfirm } from 'primevue/useconfirm'

import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Select from 'primevue/select'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import ConfirmDialog from 'primevue/confirmdialog'
import ReceiptAbonoTicket from '../components/sales/ReceiptAbonoTicket.vue'

const businessStore = useBusinessStore()
const confirm = useConfirm()

const apartados = ref([])
const productosList = ref([])
const isLoading = ref(false)
const isSaving = ref(false)

const searchQuery = ref('')
const statusFilter = ref('all')

const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Activos', value: 'activo' },
  { label: 'Liquidados (Listos para entregar)', value: 'liquidado' },
  { label: 'Entregados', value: 'entregado' },
  { label: 'Cancelados', value: 'cancelado' },
]

const paymentOptions = [
  { label: 'Efectivo', value: 'efectivo' },
  { label: 'Tarjeta', value: 'tarjeta' },
  { label: 'Transferencia', value: 'transferencia' },
]

// Modal Nuevo
const nuevoModalVisible = ref(false)
const selectedProduct = ref(null)
const nuevoForm = ref({
  customerName: '',
  customerPhone: '',
  fechaLimite: '',
  paymentMethod: 'efectivo',
  primaMonto: 0,
  notas: '',
  items: []
})

// Modal Abono
const abonoModalVisible = ref(false)
const selectedApartado = ref(null)
const abonoForm = ref({
  monto: 0,
  paymentMethod: 'efectivo',
  amountReceived: 0
})

// Modal Detalle
const detalleModalVisible = ref(false)

// Estado para impresión térmica
const printData = ref({
  apartado: null,
  abono: null,
  items: []
})

const fetchApartados = async () => {
  try {
    isLoading.value = true
    apartados.value = await listApartados({ status: statusFilter.value })
  } catch (err) {
    handleError(err)
  } finally {
    isLoading.value = false
  }
}

const fetchProductos = async () => {
  try {
    const res = await getProductos({ limit: 200 })
    productosList.value = res.data || []
  } catch (err) {
    console.warn('Error al cargar productos:', err)
  }
}

onMounted(() => {
  businessStore.fetchSettings()
  fetchApartados()
  fetchProductos()
})

const stats = computed(() => {
  const total = apartados.value.length
  const totalAbonado = apartados.value.reduce((acc, a) => acc + Number(a.total_abonado || 0), 0)
  const saldoPendiente = apartados.value.filter(a => a.status === 'activo').reduce((acc, a) => acc + Number(a.saldo_pendiente || 0), 0)
  const activos = apartados.value.filter(a => a.status === 'activo').length
  return { total, totalAbonado, saldoPendiente, activos }
})

const filteredApartados = computed(() => {
  let list = apartados.value
  if (statusFilter.value !== 'all') {
    list = list.filter(a => a.status === statusFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(a =>
      a.customer_name?.toLowerCase().includes(q) ||
      a.codigo_apartado?.toLowerCase().includes(q) ||
      a.customer_phone?.toLowerCase().includes(q)
    )
  }
  return list
})

const nuevoTotal = computed(() => {
  return nuevoForm.value.items.reduce((sum, item) => sum + (item.qty * item.unit_price), 0)
})

const openNuevoApartadoModal = () => {
  const nextMonth = new Date()
  nextMonth.setDate(nextMonth.getDate() + 30)

  nuevoForm.value = {
    customerName: '',
    customerPhone: '',
    fechaLimite: nextMonth.toISOString().slice(0, 10),
    paymentMethod: 'efectivo',
    primaMonto: 0,
    notas: '',
    items: []
  }
  selectedProduct.value = null
  nuevoModalVisible.value = true
}

const addItemToNuevo = () => {
  if (!selectedProduct.value) return
  const prod = selectedProduct.value
  nuevoForm.value.items.push({
    product_id: prod.id,
    product_name: `${prod.nombre} ${prod.talla ? '(' + prod.talla + ')' : ''}`,
    qty: 1,
    unit_price: Number(prod.precio || 0)
  })
  selectedProduct.value = null
}

const removeItemFromNuevo = (idx) => {
  nuevoForm.value.items.splice(idx, 1)
}

const handleGuardarApartado = async () => {
  try {
    isSaving.value = true
    const result = await crearApartado({
      customerId: null,
      customerName: nuevoForm.value.customerName.trim(),
      customerPhone: nuevoForm.value.customerPhone?.trim() || null,
      fechaLimite: nuevoForm.value.fechaLimite || null,
      notas: nuevoForm.value.notas?.trim() || null,
      items: nuevoForm.value.items,
      primaMonto: Number(nuevoForm.value.primaMonto || 0),
      paymentMethod: nuevoForm.value.paymentMethod,
      amountReceived: Number(nuevoForm.value.primaMonto || 0),
      changeGiven: 0
    })

    showSuccess('Apartado creado y casco reservado con éxito')
    nuevoModalVisible.value = false
    await fetchApartados()

    // Si hubo prima, imprimir recibo
    if (Number(nuevoForm.value.primaMonto) > 0) {
      printData.value = {
        apartado: result,
        abono: {
          monto: Number(nuevoForm.value.primaMonto),
          saldo_anterior: result.total,
          saldo_nuevo: result.saldo_pendiente,
          payment_method: nuevoForm.value.paymentMethod,
          created_at: new Date()
        },
        items: nuevoForm.value.items
      }
      await nextTick()
      window.print()
    }
  } catch (err) {
    handleError(err)
  } finally {
    isSaving.value = false
  }
}

const openAbonarModal = (apartado) => {
  selectedApartado.value = apartado
  abonoForm.value = {
    monto: Math.min(500, apartado.saldo_pendiente),
    paymentMethod: 'efectivo',
    amountReceived: Math.min(500, apartado.saldo_pendiente)
  }
  abonoModalVisible.value = true
}

const handleGuardarAbono = async () => {
  try {
    isSaving.value = true
    const apt = selectedApartado.value
    const monto = Number(abonoForm.value.monto)
    const amountReceived = Number(abonoForm.value.amountReceived || monto)
    const changeGiven = Math.max(0, amountReceived - monto)

    const result = await registrarAbono({
      apartadoId: apt.id,
      monto,
      paymentMethod: abonoForm.value.paymentMethod,
      amountReceived,
      changeGiven
    })

    showSuccess('Abono registrado exitosamente')
    abonoModalVisible.value = false
    await fetchApartados()

    // Imprimir Comprobante de Abono
    printData.value = {
      apartado: result.apartado,
      abono: result.abono,
      items: apt.items || []
    }
    await nextTick()
    window.print()
  } catch (err) {
    handleError(err)
  } finally {
    isSaving.value = false
  }
}

const openDetalleModal = (apartado) => {
  selectedApartado.value = apartado
  detalleModalVisible.value = true
}

const confirmarEntrega = (apartado) => {
  confirm.require({
    message: `¿Confirmar entrega de los productos a ${apartado.customer_name}?`,
    header: 'Entregar Casco / Accesorio',
    icon: 'pi pi-check-circle',
    acceptLabel: 'Sí, entregar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        await marcarEntregado(apartado.id)
        showSuccess('Apartado finalizado y productos entregados al cliente')
        await fetchApartados()
      } catch (err) {
        handleError(err)
      }
    }
  })
}

const confirmarCancelar = (apartado) => {
  confirm.require({
    message: '¿Cancelar apartado? El casco reservado volverá al stock del inventario.',
    header: 'Confirmar Cancelación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, cancelar apartado',
    rejectLabel: 'No',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await cancelarApartado(apartado.id, 'Cancelación voluntaria')
        showSuccess('Apartado cancelado y stock reincorporado al inventario')
        await fetchApartados()
      } catch (err) {
        handleError(err)
      }
    }
  })
}

const getStatusLabel = (st) => ({
  activo: 'Activo (En pagos)',
  liquidado: 'Listo para entregar',
  entregado: 'Entregado',
  cancelado: 'Cancelado'
}[st] || st)

const getStatusSeverity = (st) => ({
  activo: 'info',
  liquidado: 'success',
  entregado: 'secondary',
  cancelado: 'danger'
}[st] || 'info')

const getProgressColor = (data) => {
  const pct = (data.total_abonado / (data.total || 1)) * 100
  if (pct >= 100) return 'bg-emerald-500'
  if (pct >= 50) return 'bg-blue-500'
  return 'bg-amber-500'
}

const formatDate = (ds) => ds ? new Date(ds).toLocaleString('es-NI') : ''
const formatDateOnly = (ds) => ds ? new Date(ds).toLocaleDateString('es-NI') : ''
</script>
