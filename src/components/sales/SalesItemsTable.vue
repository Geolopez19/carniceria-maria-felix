<template>
  <div
    class="bg-white rounded-xl shadow-md border border-purple-200 overflow-hidden"
  >
    <div
      class="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 px-3 sm:px-5 py-3 flex justify-between items-center border-b border-purple-200"
    >
      <div class="flex items-center gap-2">
        <div class="bg-purple-100 p-1.5 rounded-md">
          <i class="pi pi-shopping-cart text-purple-600 text-lg"></i>
        </div>
        <h3 class="text-lg font-bold text-slate-800">Productos</h3>
        <span
          v-if="items.length > 0"
          class="bg-purple-600 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-sm"
        >
          {{ items.length }}
        </span>
      </div>
      <Button
        type="button"
        v-if="!readOnly"
        label="Agregar"
        icon="pi pi-plus"
        size="small"
        @click.prevent="showProductModal = true"
        class="bg-purple-600 !text-white hover:bg-purple-700 border-0 shadow-sm text-sm"
        style="color: white !important"
      />
    </div>
    <div class="p-2 sm:p-4 bg-white">
      <DataTable
        :value="items"
        class="bg-white p-datatable-sm"
        v-if="items.length > 0"
        stripedRows
        size="small"
        scrollable
      >
        <Column field="product_name" header="Producto" class="font-semibold">
          <template #body="{ data }">
            <span class="font-semibold text-slate-900 text-sm">{{
              data.product_name
            }}</span>
          </template>
        </Column>
        <Column field="qty" header="Cant." style="width: 100px">
          <template #body="{ data }">
            <InputNumber
              v-model="data.qty"
              :disabled="readOnly"
              :min="1"
              @update:modelValue="updateItemTotal(data)"
              class="w-full p-inputtext-sm"
            />
          </template>
        </Column>
        <Column field="unit_price" header="Precio" style="width: 140px">
          <template #body="{ data }">
            <InputNumber
              v-model="data.unit_price"
              :disabled="readOnly"
              mode="currency"
              currency="NIO"
              locale="es-NI"
              @update:modelValue="updateItemTotal(data)"
              class="w-full p-inputtext-sm"
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
        <Column field="line_total" header="Total" style="width: 130px">
          <template #body="{ data }">
            <span class="font-bold text-green-600 text-sm">{{
              formatCurrency(data.line_total)
            }}</span>
          </template>
        </Column>
        <Column v-if="!readOnly" header="" style="width: 60px">
          <template #body="{ index }">
            <Button
              type="button"
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              size="small"
              @click.prevent="removeItem(index)"
              v-tooltip.top="'Eliminar'"
              class="hover:bg-red-50"
            />
          </template>
        </Column>
      </DataTable>
      <div
        v-else
        class="flex flex-col items-center py-8 bg-purple-50 rounded-lg border border-dashed border-purple-300"
      >
        <i class="pi pi-shopping-cart text-4xl text-purple-300 mb-2"></i>
        <p class="text-base font-semibold text-slate-700">Carrito vacío</p>
        <Button
          v-if="!readOnly"
          type="button"
          label="Agregar Producto"
          icon="pi pi-plus"
          size="small"
          @click.prevent="showProductModal = true"
          class="bg-purple-600 !text-white hover:bg-purple-700 border-0 shadow-sm mt-3"
          style="color: white !important"
        />
      </div>
    </div>

    <!-- Modal de Productos -->
    <ProductSearchModal
      v-model:visible="showProductModal"
      theme="purple"
      @select="addProduct"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { formatCurrency } from "../../utils/calculations";
import { IVA_PORCENTAJE } from "../../constants";

import Button from "primevue/button";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputNumber from "primevue/inputnumber";
import Tooltip from "primevue/tooltip";
import Select from "primevue/select";
import ProductSearchModal from "../common/ProductSearchModal.vue";

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:items"]);

const vTooltip = Tooltip;

const showProductModal = ref(false);

const taxOptions = [
    { label: 'Exento (0%)', value: 0 },
    { label: `IVA (${IVA_PORCENTAJE}%)`, value: IVA_PORCENTAJE }
];

const addProduct = (p) => {
  if (!p) return;

  const newItems = [...props.items];
  const existing = newItems.find((i) => i.product_id === p.id);

  if (existing) {
    existing.qty++;
    updateItemTotal(existing);
  } else {
    const qty = 1;
    const unit_price = Number(p.precio) || 0;
    const tax_rate = IVA_PORCENTAJE; // Default to 15%
    const base = qty * unit_price;
    newItems.push({
      id: crypto.randomUUID(),
      product_id: p.id,
      product_name: p.nombre,
      qty,
      unit_price,
      tax_rate,
      line_total: base + base * (tax_rate / 100),
    });
  }

  emit("update:items", newItems);
  showProductModal.value = false;
};

const updateItemTotal = (item) => {
  const base = (item.qty || 0) * (item.unit_price || 0);
  item.line_total = base + base * ((item.tax_rate || 0) / 100);
  emit("update:items", [...props.items]);
};

const removeItem = (index) => {
  const newItems = [...props.items];
  newItems.splice(index, 1);
  emit("update:items", newItems);
};
</script>
