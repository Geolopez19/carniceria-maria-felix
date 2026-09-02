<template>
  <Dialog 
    v-model:visible="visible" 
    :header="mode === 'crear' ? 'Nuevo Producto' : 'Editar Producto'" 
    modal 
    class="w-full max-w-[90vw] md:max-w-xl"
  >
    <div class="flex flex-col gap-4 py-2">
      <!-- Código de Barras y QR -->
      <div class="flex flex-col sm:flex-row gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div class="flex-1 flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <label for="codigo" class="font-semibold flex items-center gap-1 text-slate-700 text-sm">
              <i class="pi pi-qrcode text-indigo-600"></i> Código de Barras / SKU
            </label>
            <button
              type="button"
              @click="generateBarcode"
              class="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 hover:underline"
            >
              <i class="pi pi-refresh"></i> Generar aleatorio
            </button>
          </div>
          <InputText id="codigo" v-model="form.codigo" placeholder="Escanear o ingresar código de barras" class="font-mono" />
        </div>
        
        <!-- Previsualización QR Code -->
        <div v-if="qrDataUrl" class="flex flex-col items-center justify-center p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <img :src="qrDataUrl" alt="Código QR" class="w-16 h-16 object-contain" />
          <span class="text-[9px] font-mono text-slate-400 mt-1">Vista QR</span>
        </div>
      </div>

      <!-- Nombre -->
      <div class="flex flex-col gap-2">
        <label for="nombre" class="font-semibold text-sm">Nombre del Producto</label>
        <InputText id="nombre" v-model="form.nombre" placeholder="Ej. Lomo de Cerdo, Carne Molida..." />
      </div>

      <!-- Categoría, Tipo Venta y Unidad de Medida -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="flex flex-col gap-2">
          <label for="categoria" class="font-semibold text-sm">Categoría</label>
          <Select 
            id="categoria" 
            v-model="form.categoria" 
            :options="categories" 
            editable 
            placeholder="Ej. Res..." 
            class="w-full"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="tipo_venta" class="font-semibold text-sm">Tipo de Venta</label>
          <Select 
            id="tipo_venta" 
            v-model="form.tipo_venta" 
            :options="tipoVentaOptions" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Seleccionar tipo" 
            class="w-full"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="unidad_medida" class="font-semibold text-sm">Unidad de Medida</label>
          <Select 
            id="unidad_medida" 
            v-model="form.unidad_medida" 
            :options="unidadOptions" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Seleccionar unidad" 
            class="w-full"
          />
        </div>
      </div>

      <!-- Stock y Precio -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4" v-if="mode === 'editar'">
        <div class="flex flex-col gap-2">
          <label for="stock_granel" class="font-semibold text-sm">Stock a Granel ({{ form.unidad_medida || 'lbs' }})</label>
          <InputNumber 
            id="stock_granel" 
            v-model="form.stock_granel" 
            :minFractionDigits="0" 
            :maxFractionDigits="2" 
            placeholder="0.00" 
            fluid 
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="stock_empacado" class="font-semibold text-sm">Stock Empacado ({{ form.unidad_medida || 'lbs' }})</label>
          <InputNumber 
            id="stock_empacado" 
            v-model="form.stock_empacado" 
            disabled 
            placeholder="0.00" 
            fluid 
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="precio" class="font-semibold text-sm">Precio por {{ getUnidadLabel(form.unidad_medida) }}</label>
          <InputNumber 
            id="precio" 
            v-model="form.precio" 
            mode="currency" 
            currency="NIO" 
            locale="es-NI" 
            :minFractionDigits="2" 
            :maxFractionDigits="2" 
            fluid 
          />
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" v-else>
        <div class="flex flex-col gap-2">
          <label for="stock" class="font-semibold text-sm">Stock Inicial ({{ form.unidad_medida || 'lbs' }})</label>
          <InputNumber 
            id="stock" 
            v-model="form.stock" 
            :minFractionDigits="0" 
            :maxFractionDigits="2" 
            placeholder="0.00" 
            fluid 
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="precio" class="font-semibold text-sm">Precio por {{ getUnidadLabel(form.unidad_medida) }}</label>
          <InputNumber 
            id="precio" 
            v-model="form.precio" 
            mode="currency" 
            currency="NIO" 
            locale="es-NI" 
            :minFractionDigits="2" 
            :maxFractionDigits="2" 
            fluid 
          />
        </div>
      </div>

      <!-- Descripción -->
      <div class="flex flex-col gap-2">
        <label for="descripcion" class="font-semibold text-sm">Descripción u Observaciones</label>
        <Textarea id="descripcion" v-model="form.descripcion" rows="2" autoResize placeholder="Detalles sobre presentación o tipo de corte..." />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancelar" text severity="secondary" @click="visible = false" />
        <Button label="Guardar" @click="save" :loading="loading" class="bg-indigo-600 hover:bg-indigo-700 !text-white" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import QRCode from 'qrcode'
import { addProducto, updateProducto } from '../../services/productos'
import { handleError, showSuccess } from '../../utils/errorHandler'

import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Button from 'primevue/button'

const props = defineProps({
  mode: {
    type: String,
    default: 'crear', // 'crear' | 'editar'
  },
  initialData: {
    type: Object,
    default: () => ({}),
  },
  categories: {
    type: Array,
    default: () => [],
  }
})

const emit = defineEmits(['update:visible', 'saved'])

const visible = defineModel('visible')
const loading = ref(false)
const qrDataUrl = ref('')

const tipoVentaOptions = [
  { label: 'Por Unidad', value: 'UNIDAD' },
  { label: 'Por Peso (Granel)', value: 'PESO' },
  { label: 'Por Paquete (Peso Variable)', value: 'PAQUETE' },
]

const unidadOptions = [
  { label: 'Libras (lbs)', value: 'lbs' },
  { label: 'Cajas (cajas)', value: 'cajas' },
  { label: 'Kilos (kg)', value: 'kg' },
  { label: 'Unidades (pzas)', value: 'unidades' },
]

const getUnidadLabel = (val) => {
  const found = unidadOptions.find(u => u.value === val)
  return found ? found.label.split(' ')[0] : 'Unidad'
}

const form = ref({
  codigo: '',
  nombre: '',
  categoria: '',
  tipo_venta: 'UNIDAD',
  unidad_medida: 'lbs',
  stock: 0,
  stock_granel: 0,
  stock_empacado: 0,
  precio: 0,
  descripcion: ''
})

watch(() => props.initialData, (val) => {
  if (val && props.mode === 'editar') {
    form.value = { 
      unidad_medida: 'lbs',
      tipo_venta: 'UNIDAD',
      stock_granel: 0,
      stock_empacado: 0,
      ...val 
    }
  } else {
    resetForm()
  }
}, { immediate: true })

watch(() => form.value.codigo, async (newCode) => {
  if (newCode && newCode.trim().length > 0) {
    try {
      qrDataUrl.value = await QRCode.toDataURL(newCode.trim(), { width: 120, margin: 1 })
    } catch (e) {
      qrDataUrl.value = ''
    }
  } else {
    qrDataUrl.value = ''
  }
}, { immediate: true })

watch(visible, (isShown) => {
  if (isShown && props.mode === 'crear') {
    resetForm()
  }
})

function resetForm() {
  form.value = { 
    codigo: '',
    nombre: '', 
    categoria: '', 
    tipo_venta: 'UNIDAD',
    unidad_medida: 'lbs',
    stock: 0, 
    stock_granel: 0,
    stock_empacado: 0,
    precio: 0, 
    descripcion: '' 
  }
  qrDataUrl.value = ''
}

function generateBarcode() {
  const prefix = '7441'
  const random = Math.floor(10000000 + Math.random() * 90000000)
  form.value.codigo = `${prefix}${random}`
}

async function save() {
  if (!form.value.nombre) return // Simple validation

  try {
    loading.value = true
    let result
    
    if (props.mode === 'crear') {
      result = await addProducto(form.value)
      showSuccess('Producto creado correctamente')
    } else {
      result = await updateProducto(form.value.id, form.value)
      showSuccess('Producto actualizado correctamente')
    }
    
    emit('saved', result)
    visible.value = false
  } catch (err) {
    handleError(err)
  } finally {
    loading.value = false
  }
}
</script>
