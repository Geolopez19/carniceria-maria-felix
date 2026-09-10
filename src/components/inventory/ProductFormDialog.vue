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
        <label for="nombre" class="font-semibold text-sm">
          {{ companyStore.isMotoTech ? 'Nombre del Producto (Ej. Casco Shaft 582, Guantes ProBiker)' : 'Nombre del Producto' }}
        </label>
        <InputText id="nombre" v-model="form.nombre" :placeholder="companyStore.isMotoTech ? 'Ej. Casco Integral LS2 Storm FF800' : 'Ej. Lomo de Cerdo, Carne Molida...'" />
      </div>

      <!-- CAMPOS ESPECÍFICOS PARA MOTOTECH (Marca, Modelo, Talla, Color) -->
      <div v-if="companyStore.isMotoTech" class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-200/70">
        <div class="flex flex-col gap-1.5">
          <label for="marca" class="font-semibold text-xs text-slate-700">Marca</label>
          <InputText id="marca" v-model="form.marca" placeholder="Ej. LS2, Shaft, Bell" class="p-inputtext-sm" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="modelo" class="font-semibold text-xs text-slate-700">Modelo</label>
          <InputText id="modelo" v-model="form.modelo" placeholder="Ej. Rookie, Storm" class="p-inputtext-sm" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="talla" class="font-semibold text-xs text-slate-700">Talla</label>
          <Select 
            id="talla" 
            v-model="form.talla" 
            :options="['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Universal', 'N/A']" 
            editable 
            placeholder="Talla" 
            class="w-full text-xs"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="color" class="font-semibold text-xs text-slate-700">Color</label>
          <InputText id="color" v-model="form.color" placeholder="Ej. Negro Mate" class="p-inputtext-sm" />
        </div>
      </div>

      <!-- Categoría, Tipo Venta y Unidad de Medida -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="flex flex-col gap-2">
          <label for="categoria" class="font-semibold text-sm">Categoría</label>
          <Select 
            id="categoria" 
            v-model="form.categoria" 
            :options="categoriesList" 
            editable 
            :placeholder="companyStore.isMotoTech ? 'Ej. Cascos, Guantes...' : 'Ej. Res, Cerdo...'" 
            class="w-full"
          />
        </div>
        <div class="flex flex-col gap-2" v-if="!companyStore.isMotoTech">
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
            :options="unidadOptionsList" 
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

      <!-- Opción para actualizar paquetes en inventario si el precio cambió -->
      <div 
        v-if="mode === 'editar' && form.tipo_venta === 'PAQUETE' && (initialData.precio !== form.precio)" 
        class="flex items-center gap-3 bg-amber-50 p-3 rounded-xl border border-amber-200"
      >
        <input 
          id="sync_paquetes" 
          type="checkbox" 
          v-model="syncPackagesPrice" 
          class="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
        />
        <label for="sync_paquetes" class="text-xs text-amber-900 font-medium cursor-pointer">
          Actualizar automáticamente el precio de todos los <strong>paquetes disponibles</strong> en inventario con este nuevo precio unitario
        </label>
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
import { actualizarPreciosPaquetesProducto } from '../../services/paquetes'
import { handleError, showSuccess } from '../../utils/errorHandler'

import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Button from 'primevue/button'
import { useCompanyStore } from '../../stores/companyStore'
import { computed } from 'vue'

const companyStore = useCompanyStore()

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
const syncPackagesPrice = ref(true)

const tipoVentaOptions = [
  { label: 'Por Unidad', value: 'UNIDAD' },
  { label: 'Por Peso (Granel)', value: 'PESO' },
  { label: 'Por Paquete (Peso Variable)', value: 'PAQUETE' },
]

const carniceriaUnidades = [
  { label: 'Libras (lbs)', value: 'lbs' },
  { label: 'Cajas (cajas)', value: 'cajas' },
  { label: 'Kilos (kg)', value: 'kg' },
  { label: 'Unidades (pzas)', value: 'unidades' },
]

const motoUnidades = [
  { label: 'Unidades (und)', value: 'und' },
  { label: 'Pares (par)', value: 'par' },
  { label: 'Kits / Juegos (kit)', value: 'kit' },
]

const unidadOptionsList = computed(() => {
  return companyStore.isMotoTech ? motoUnidades : carniceriaUnidades
})

const defaultMotoCategories = [
  'Cascos Integrales',
  'Cascos Abiertos',
  'Cascos Abatibles',
  'Guantes',
  'Chaquetas / Protectores',
  'Impermeables',
  'Accesorios & Intercoms',
  'Mantenimiento & Limpieza',
  'Repuestos'
]

const categoriesList = computed(() => {
  if (companyStore.isMotoTech) {
    return defaultMotoCategories
  }
  return props.categories.length > 0 ? props.categories : ['Res', 'Cerdo', 'Pollo', 'Embutidos', 'Mariscos', 'Otros']
})

const getUnidadLabel = (val) => {
  const found = unidadOptionsList.value.find(u => u.value === val)
  return found ? found.label.split(' ')[0] : 'Unidad'
}

const form = ref({
  codigo: '',
  nombre: '',
  marca: '',
  modelo: '',
  talla: '',
  color: '',
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
  syncPackagesPrice.value = true
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
    marca: '',
    modelo: '',
    talla: '',
    color: '',
    categoria: '', 
    tipo_venta: 'UNIDAD',
    unidad_medida: companyStore.isMotoTech ? 'und' : 'lbs',
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
  if (!form.value.nombre || !form.value.nombre.trim()) {
    handleError(new Error('El nombre del producto es obligatorio'))
    return
  }

  try {
    loading.value = true
    let result
    
    if (props.mode === 'crear') {
      result = await addProducto(form.value)
      showSuccess('Producto creado correctamente')
    } else {
      const precioCambio = Number(props.initialData?.precio) !== Number(form.value.precio)
      result = await updateProducto(form.value.id, form.value)

      if (props.initialData?.tipo_venta === 'PAQUETE' && precioCambio && syncPackagesPrice.value) {
        try {
          const syncRes = await actualizarPreciosPaquetesProducto(form.value.id, form.value.precio)
          if (syncRes.count > 0) {
            showSuccess(`Producto actualizado y se sincronizaron ${syncRes.count} paquetes disponibles`)
          } else {
            showSuccess('Producto actualizado correctamente')
          }
        } catch (syncErr) {
          console.error('Error sincronizando paquetes al guardar producto:', syncErr)
          showSuccess('Producto actualizado, pero ocurrió un problema al sincronizar los paquetes')
        }
      } else {
        showSuccess('Producto actualizado correctamente')
      }
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
