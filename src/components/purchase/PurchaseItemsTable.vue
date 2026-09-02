<template>
  <div class="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
    <div class="bg-gradient-to-r from-slate-50 to-indigo-50 px-3 sm:px-5 py-3 flex justify-between items-center border-b border-slate-200">
      <div class="flex items-center gap-2">
        <div class="bg-indigo-100 p-1.5 rounded-md">
          <i class="pi pi-box text-indigo-600 text-lg"></i>
        </div>
        <h3 class="text-lg font-bold text-slate-800">Productos en esta Compra</h3>
      </div>
      <Button
        v-if="!readOnly"
        type="button"
        label="Agregar Producto"
        icon="pi pi-plus"
        size="small"
        @click.prevent="showProductModal = true"
        class="bg-indigo-600 text-white hover:bg-indigo-700 border-0 shadow-sm"
        :pt="{
            label: { class: 'text-white' },
            icon: { class: 'text-white' }
        }"
      />
    </div>

    <div class="p-2 sm:p-4 bg-white">
      <DataTable
        v-if="items.length > 0"
        :value="items"
        class="bg-white p-datatable-sm"
        stripedRows
        size="small"
        scrollable
      >
        <Column field="product_name" header="Producto" style="min-width: 200px">
          <template #body="{ data }">
            <div class="flex flex-col">
              <span class="font-semibold text-slate-800">{{ data.product_name }}</span>
              <!-- Si es tipo paquete, mostrar resumen de caja y paquetes -->
              <div v-if="data.tipo_ingreso === 'paquete'" class="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                <span class="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-md font-mono">
                  <i class="pi pi-box mr-1 text-[10px]"></i>Caja: {{ (data.peso_caja || 0).toFixed(2) }} lbs
                </span>
                <span class="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md font-mono">
                  <i class="pi pi-tags mr-1 text-[10px]"></i>{{ data.paquetes_list?.length || 0 }} Paquetes
                </span>
                <button
                  type="button"
                  @click="abrirModalPaquetes(data)"
                  class="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline ml-1"
                >
                  {{ readOnly ? 'Ver Paquetes' : 'Configurar Paquetes' }}
                </button>
              </div>
            </div>
          </template>
        </Column>

        <Column field="tipo_ingreso" header="Formato" style="width: 150px">
          <template #body="{ data }">
            <Select
              v-model="data.tipo_ingreso"
              :options="tipoIngresoOptions"
              optionLabel="label"
              optionValue="value"
              :disabled="readOnly"
              @change="onTipoIngresoChange(data)"
              size="small"
              class="w-full text-xs"
            />
          </template>
        </Column>

        <Column field="qty" header="Cant. / Peso">
          <template #body="{ data }">
            <div class="flex items-center gap-1">
              <InputNumber
                v-model="data.qty"
                :disabled="readOnly || data.tipo_ingreso === 'paquete'"
                :min="0.01"
                :minFractionDigits="data.tipo_ingreso === 'pieza' ? 0 : 2"
                :maxFractionDigits="data.tipo_ingreso === 'pieza' ? 0 : 3"
                @update:modelValue="updateItemTotal(data)"
                size="small"
                class="w-full max-w-[120px]"
                inputClass="p-2 text-center w-full font-mono font-bold"
              />
              <Button
                v-if="data.tipo_ingreso === 'paquete' && !readOnly"
                icon="pi pi-cog"
                severity="info"
                text
                rounded
                size="small"
                @click="abrirModalPaquetes(data)"
                v-tooltip.top="'Configurar paquetes por caja'"
              />
            </div>
          </template>
        </Column>

        <Column field="unit_cost" header="Costo Unit.">
          <template #body="{ data }">
            <InputNumber
              v-model="data.unit_cost"
              :disabled="readOnly"
              mode="currency"
              currency="NIO"
              locale="es-NI"
              @update:modelValue="updateItemTotal(data)"
              size="small"
              class="w-full max-w-[130px]"
              inputClass="p-2 w-full font-mono"
            />
          </template>
        </Column>

        <Column field="tax_rate" header="Impuesto" style="width: 130px" headerClass="text-center">
          <template #body="{ data }">
            <Select 
                v-model="data.tax_rate" 
                :options="taxOptions" 
                optionLabel="label" 
                optionValue="value" 
                :disabled="readOnly"
                @change="updateItemTotal(data)"
                class="w-full"
                size="small"
                :pt="{
                    root: { class: 'text-xs' },
                    label: { class: 'p-1' }
                }"
            />
          </template>
        </Column>

        <Column field="line_total" header="Subtotal">
          <template #body="{ data }">
            <span class="font-bold text-slate-800 font-mono">{{ formatCurrency(data.line_total) }}</span>
          </template>
        </Column>

        <Column v-if="!readOnly" header="" style="width: 50px">
          <template #body="{ index }">
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              @click.prevent="removeItem(index)"
              class="hover:bg-red-50"
            />
          </template>
        </Column>
      </DataTable>
      <div v-else class="flex flex-col items-center justify-center py-12 text-center text-slate-400">
        <div class="bg-slate-50 p-4 rounded-full mb-3">
          <i class="pi pi-shopping-cart text-4xl"></i>
        </div>
        <p class="text-lg font-medium">No hay productos agregados</p>
        <p class="text-sm">Haz clic en "Agregar Producto" para comenzar</p>
      </div>
    </div>

    <!-- Modal de Búsqueda de Productos -->
    <ProductSearchModal
      v-model:visible="showProductModal"
      theme="indigo"
      @select="addProduct"
    />

    <!-- Modal de Configuración de Paquetes -->
    <PurchasePackageModal
      v-model:visible="showPackageModal"
      :item="selectedPackageItem"
      :readOnly="readOnly"
      @save="onPackageSave"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { formatCurrency } from '../../utils/calculations'
import { IVA_PORCENTAJE } from '../../constants'

import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Tooltip from 'primevue/tooltip'
import ProductSearchModal from '../common/ProductSearchModal.vue'
import PurchasePackageModal from './PurchasePackageModal.vue'

const vTooltip = Tooltip

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:items'])

const showProductModal = ref(false)
const showPackageModal = ref(false)
const selectedPackageItem = ref(null)

const taxOptions = [
    { label: 'Exento (0%)', value: 0 },
    { label: `IVA (${IVA_PORCENTAJE}%)`, value: IVA_PORCENTAJE }
]

const tipoIngresoOptions = [
  { label: 'Granel (lbs)', value: 'granel' },
  { label: 'Pieza (Unid.)', value: 'pieza' },
  { label: 'Paquete / Caja', value: 'paquete' }
]

const addProduct = (p) => {
  if (!p) return

  const newItems = [...props.items]
  const existing = newItems.find((i) => i.product_id === p.id)
  
  if (existing) {
    existing.qty++
    updateItemTotal(existing)
  } else {
    const qty = 1
    const unit_cost = p.precio_compra || 0
    const tax_rate = IVA_PORCENTAJE
    const base = qty * unit_cost

    let defaultTipo = 'granel'
    if (p.tipo_venta === 'PAQUETE') defaultTipo = 'paquete'
    else if (p.tipo_venta === 'UNIDAD') defaultTipo = 'pieza'
    
    const newItem = {
      id: crypto.randomUUID(),
      product_id: p.id,
      product_name: p.nombre,
      qty,
      unit_cost,
      tax_rate,
      tipo_ingreso: defaultTipo,
      peso_caja: null,
      codigo_lote: null,
      paquetes_list: [],
      line_total: base + base * (tax_rate / 100),
    }

    newItems.push(newItem)
    
    // Si es tipo paquete por defecto, sugerir abrir el modal de paquetes inmediatamente
    if (defaultTipo === 'paquete') {
      abrirModalPaquetes(newItem)
    }
  }
  
  emit('update:items', newItems)
  showProductModal.value = false
}

const onTipoIngresoChange = (item) => {
  if (item.tipo_ingreso === 'paquete') {
    abrirModalPaquetes(item)
  } else {
    updateItemTotal(item)
  }
}

const abrirModalPaquetes = (item) => {
  selectedPackageItem.value = item
  showPackageModal.value = true
}

const onPackageSave = (data) => {
  if (!selectedPackageItem.value) return

  selectedPackageItem.value.peso_caja = data.peso_caja
  selectedPackageItem.value.codigo_lote = data.codigo_lote
  selectedPackageItem.value.paquetes_list = data.paquetes_list
  selectedPackageItem.value.qty = data.qty

  updateItemTotal(selectedPackageItem.value)
}

const updateItemTotal = (item) => {
  const base = (item.qty || 0) * (item.unit_cost || 0)
  item.line_total = base + base * ((item.tax_rate || 0) / 100)
  emit('update:items', [...props.items])
}

const removeItem = (index) => {
  const newItems = [...props.items]
  newItems.splice(index, 1)
  emit('update:items', newItems)
}
</script>

