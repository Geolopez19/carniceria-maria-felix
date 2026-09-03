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
      <div class="flex items-center gap-2">
        <Button
          type="button"
          v-if="!readOnly"
          label="Buscar en Catálogo"
          icon="pi pi-search"
          size="small"
          @click.prevent="showProductModal = true"
          class="bg-purple-600 !text-white hover:bg-purple-700 border-0 shadow-sm text-sm"
          style="color: white !important"
        />
      </div>
    </div>

    <!-- Barra de Escáner de Código de Barras -->
    <div v-if="!readOnly" class="p-3 bg-purple-50/70 border-b border-purple-100 flex flex-col sm:flex-row items-center gap-3">
      <div class="relative flex-1 w-full">
        <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-600">
          <i class="pi pi-qrcode text-lg"></i>
        </span>
        <input
          ref="barcodeInputRef"
          v-model="barcodeQuery"
          type="text"
          placeholder="Escanear código de barras o presionar Enter..."
          @keydown.enter.prevent="handleBarcodeScan"
          class="w-full pl-10 pr-24 py-2 text-sm bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono shadow-inner"
        />
        <button
          type="button"
          @click="handleBarcodeScan"
          :disabled="isScanning"
          class="absolute right-1 top-1 bottom-1 px-3 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-md flex items-center gap-1 transition-all"
        >
          <i class="pi pi-spin pi-spinner" v-if="isScanning"></i>
          <i class="pi pi-plus" v-else></i>
          <span>Agregar</span>
        </button>
      </div>
      <span class="text-xs text-purple-700 font-medium hidden md:inline-flex items-center gap-1 shrink-0 bg-white px-2.5 py-1 rounded-md border border-purple-200 shadow-2xs">
        <i class="pi pi-check-circle text-emerald-500"></i> Escáner Listo
      </span>
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
            <div class="flex flex-col">
              <span class="font-semibold text-slate-900 text-sm">{{ data.product_name }}</span>
              <span class="text-[10px] text-purple-600 font-mono font-medium">Unidad: {{ data.unidad_medida || 'lbs' }}</span>
            </div>
          </template>
        </Column>
        <Column field="qty" header="Cant." style="width: 120px">
          <template #body="{ data }">
            <InputNumber
              v-model="data.qty"
              :disabled="readOnly"
              :min="0.01"
              :minFractionDigits="0"
              :maxFractionDigits="2"
              :step="0.5"
              @update:modelValue="updateItemTotal(data)"
              class="w-full p-inputtext-sm font-mono"
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
      @select="processProductSelection"
    />

    <!-- Diálogo para Ingreso de Peso/Cantidad -->
    <Dialog v-model:visible="pesoDialog.visible" header="Ingresar Peso" modal class="w-full max-w-[90vw] md:max-w-sm">
      <div class="flex flex-col gap-4 py-2" v-if="pesoDialog.producto">
        <p class="text-sm text-slate-600 mb-2">
          Producto: <br><span class="font-bold text-slate-800 text-lg">{{ pesoDialog.producto.nombre }}</span>
        </p>
        <div class="flex flex-col gap-2">
          <label for="peso_input" class="font-semibold text-sm">Peso ({{ pesoDialog.producto.unidad_medida || 'lbs' }})</label>
          <InputNumber 
            id="peso_input" 
            v-model="pesoDialog.peso" 
            :min="0.01" 
            :minFractionDigits="2" 
            :maxFractionDigits="3" 
            fluid 
            autoFocus 
            @keydown.enter.prevent="confirmarPeso"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancelar" text severity="secondary" @click="pesoDialog.visible = false" />
          <Button label="Agregar" icon="pi pi-check" class="bg-purple-600 !text-white hover:bg-purple-700 border-0" @click="confirmarPeso" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, nextTick } from "vue";
import { formatCurrency } from "../../utils/calculations";
import { IVA_PORCENTAJE } from "../../constants";
import { getProductoByCodigo } from "../../services/productos";
import { getPaqueteByCodigo, getDetalleVentaPaquete } from "../../services/paquetes";
import { playBeep } from "../../utils/audio";
import { showSuccess, showWarning } from "../../utils/errorHandler";

import Button from "primevue/button";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputNumber from "primevue/inputnumber";
import Tooltip from "primevue/tooltip";
import Select from "primevue/select";
import Dialog from "primevue/dialog";
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
  applyTax: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:items"]);

const vTooltip = Tooltip;

const showProductModal = ref(false);
const barcodeQuery = ref("");
const isScanning = ref(false);
const barcodeInputRef = ref(null);

const pesoDialog = ref({
  visible: false,
  producto: null,
  peso: 1.00
});

const taxOptions = [
    { label: 'Exento (0%)', value: 0 },
    { label: `IVA (${IVA_PORCENTAJE}%)`, value: IVA_PORCENTAJE }
];

const handleBarcodeScan = async () => {
  const code = barcodeQuery.value ? barcodeQuery.value.trim() : "";
  if (!code) return;

  try {
    isScanning.value = true;

    // 1. Buscar si el código es un paquete físico
    const paquete = await getPaqueteByCodigo(code);
    if (paquete) {
      if (paquete.estado === 'DISPONIBLE') {
        playBeep("success");
        addPackageItem(paquete);
        showSuccess(`Paquete añadido: ${paquete.producto.nombre} (${paquete.peso} ${paquete.producto.unidad_medida || 'lbs'})`);
        barcodeQuery.value = "";
      } else {
        playBeep("error");
        // Obtener historial del paquete vendido
        const detalleVenta = await getDetalleVentaPaquete(paquete.id);
        let infoVenta = '';
        if (detalleVenta && detalleVenta.order) {
          const order = detalleVenta.order;
          const fechaStr = new Date(order.paid_at || order.created_at).toLocaleDateString('es-NI');
          infoVenta = `\nVenta: #${order.invoice_number || '—'}\nFecha: ${fechaStr}`;
        }
        showWarning(`Paquete no disponible (${paquete.estado}).\nProducto: ${paquete.producto.nombre}\nPeso: ${paquete.peso} ${paquete.producto.unidad_medida || 'lbs'}${infoVenta}`);
        barcodeQuery.value = "";
      }
      return;
    }

    // 2. Si no es paquete, buscar en el catálogo de productos
    const producto = await getProductoByCodigo(code);
    if (producto) {
      playBeep("success");
      barcodeQuery.value = "";
      processProductSelection(producto);
    } else {
      playBeep("error");
      showWarning(`No se encontró producto ni paquete con el código "${code}". Se abrirá el catálogo.`);
      showProductModal.value = true;
    }
  } catch (err) {
    playBeep("error");
    showWarning(`Error buscando código de barras: ${err.message || err}`);
  } finally {
    isScanning.value = false;
    await nextTick();
    if (barcodeInputRef.value) {
      barcodeInputRef.value.focus();
    }
  }
};

const processProductSelection = (p) => {
  if (p.tipo_venta === 'PESO' || p.tipo_venta === 'PAQUETE') {
    pesoDialog.value.producto = p;
    pesoDialog.value.peso = 1.00;
    pesoDialog.value.visible = true;
  } else {
    addProduct(p);
  }
};

const addProduct = (p) => {
  if (!p) return;

  const newItems = [...props.items];
  const existing = newItems.find((i) => i.product_id === p.id && !i.package_id);

  if (existing) {
    existing.qty++;
    updateItemTotal(existing);
  } else {
    const qty = 1;
    const unit_price = Number(p.precio) || 0;
    const tax_rate = props.applyTax ? IVA_PORCENTAJE : 0;
    const base = qty * unit_price;
    newItems.push({
      id: crypto.randomUUID(),
      product_id: p.id,
      product_name: p.nombre,
      unidad_medida: p.unidad_medida || 'lbs',
      qty,
      unit_price,
      tax_rate,
      line_total: base + base * (tax_rate / 100),
    });
  }

  emit("update:items", newItems);
  showProductModal.value = false;
};

const addPackageItem = (pkg) => {
  const newItems = [...props.items];
  
  // No permitir duplicar el mismo paquete físico en el carrito
  const existing = newItems.find((i) => i.package_id === pkg.id);
  if (existing) {
    showWarning(`El paquete ${pkg.sub_codigo} ya está en el carrito.`);
    return;
  }

  const qty = Number(pkg.peso);
  const unit_price = Number(pkg.precio_por_unidad);
  const tax_rate = props.applyTax ? IVA_PORCENTAJE : 0;
  const base = qty * unit_price;

  newItems.push({
    id: crypto.randomUUID(),
    product_id: pkg.producto_id,
    product_name: `${pkg.producto.nombre} (${pkg.sub_codigo})`,
    unidad_medida: pkg.producto.unidad_medida || 'lbs',
    qty,
    unit_price,
    tax_rate,
    line_total: base + base * (tax_rate / 100),
    package_id: pkg.id
  });

  emit("update:items", newItems);
};

const confirmarPeso = () => {
  const p = pesoDialog.value.producto;
  const peso = pesoDialog.value.peso;
  if (!p || peso <= 0) return;

  const newItems = [...props.items];
  const existing = newItems.find((i) => i.product_id === p.id && !i.package_id);

  if (existing) {
    existing.qty += peso;
    updateItemTotal(existing);
  } else {
    const qty = peso;
    const unit_price = Number(p.precio) || 0;
    const tax_rate = props.applyTax ? IVA_PORCENTAJE : 0;
    const base = qty * unit_price;
    newItems.push({
      id: crypto.randomUUID(),
      product_id: p.id,
      product_name: p.nombre,
      unidad_medida: p.unidad_medida || 'lbs',
      qty,
      unit_price,
      tax_rate,
      line_total: base + base * (tax_rate / 100),
    });
  }

  emit("update:items", newItems);
  pesoDialog.value.visible = false;
  showSuccess(`Añadido: ${p.nombre} (${peso} ${p.unidad_medida || 'lbs'})`);
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

