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
        <Column field="product_name" header="Producto">
          <template #body="{ data }">
            <span class="font-semibold text-slate-700">{{ data.product_name }}</span>
          </template>
        </Column>
        <Column field="qty" header="Cant.">
          <template #body="{ data }">
            <InputNumber
              v-model="data.qty"
              :disabled="readOnly"
              :min="1"
              @update:modelValue="updateItemTotal(data)"
              size="small"
              class="w-full max-w-[100px]"
              inputClass="p-2 text-center w-full"
            />
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
              class="w-full max-w-[150px]"
              inputClass="p-2 w-full"
            />
          </template>
        </Column>
        <Column field="tax_rate" header="Impuesto" style="width: 140px" headerClass="text-center">
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
            <span class="font-bold text-slate-800">{{ formatCurrency(data.line_total) }}</span>
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
import ProductSearchModal from '../common/ProductSearchModal.vue'

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

const taxOptions = [
    { label: 'Exento (0%)', value: 0 },
    { label: `IVA (${IVA_PORCENTAJE}%)`, value: IVA_PORCENTAJE }
];

const addProduct = (p) => {
  if (!p) return

  // Create a copy of the items array to avoid direct prop mutation issues
  const newItems = [...props.items]
  const existing = newItems.find((i) => i.product_id === p.id)
  
  if (existing) {
    existing.qty++
    updateItemTotal(existing)
  } else {
    const qty = 1
    const unit_cost = p.precio_compra || 0
    const tax_rate = IVA_PORCENTAJE // Default to 15%
    const base = qty * unit_cost
    
    newItems.push({
      id: crypto.randomUUID(),
      product_id: p.id,
      product_name: p.nombre,
      qty,
      unit_cost,
      tax_rate,
      line_total: base + base * (tax_rate / 100),
    })
  }
  
  emit('update:items', newItems)
  showProductModal.value = false
}

const updateItemTotal = (item) => {
  // item is a reactive object from the prop, so modifying it mutates the prop deeply.
  // However, we emit a new array reference to trigger updates.
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
