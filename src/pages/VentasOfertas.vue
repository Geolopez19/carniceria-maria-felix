<template>
  <div class="max-w-7xl mx-auto">
    <!-- Receipt Ticket (Hidden on screen, visible on print) -->
    <div class="hidden print:block fixed inset-0 bg-white z-[9999] print-container">
       <ReceiptTicket :order="printingOrder" :items="printingItems" :business="businessStore.settings" />
    </div>

    <!-- Header con gradiente -->
    <!-- Header solido -->
    <!-- Header Gradient -->
    <div
      class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl md:rounded-2xl shadow-md md:shadow-xl p-5 md:p-8 mb-4 md:mb-8 text-white transition-all hover:shadow-2xl"
    >
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        <div>
          <h1 class="text-2xl md:text-4xl font-black mb-1 flex items-center gap-2 md:gap-3">
            <i class="pi pi-file-edit text-2xl md:text-3xl opacity-80"></i>
            Ofertas y Ventas
          </h1>
          <p class="text-indigo-100 font-medium text-sm md:text-base">
            Gestiona tus cotizaciones y facturas
          </p>
        </div>
        <Button
          type="button"
          label="Crear Oferta"
          icon="pi pi-plus"
          @click.prevent="createOffer"
          class="bg-white/20 hover:bg-white/30 !text-white border-white/40 border shadow-lg w-full md:w-auto px-6 font-bold rounded-xl transition-all hover:scale-105 backdrop-blur-md"
          style="color: white !important;"
        />
      </div>
    </div>

    <!-- Historial de Ofertas -->
    <div
      class="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
    >
      <!-- Search Bar -->
      <div
        class="p-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50"
      >
        <IconField iconPosition="left">
          <InputIcon class="pi pi-search text-indigo-400" />
          <InputText
            v-model="searchText"
            placeholder="Buscar por nombre de cliente..."
            class="w-full md:w-96"
          />
        </IconField>
      </div>

      <DataTable
        :value="offers"
        :loading="isLoading"
        v-model:filters="filters"
        :globalFilterFields="['customer_name']"
        paginator
        :rows="15"
        :rowsPerPageOptions="[15, 30, 50]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        stripedRows
        scrollable
        @row-click="onRowClick"
        :rowClass="() => 'cursor-pointer'"
        class="modern-table"
      >
        <Column field="number" header="#" style="width: 100px">
          <template #body="{ data }">
            <span class="font-bold text-slate-800">{{
              data.number ?? "—"
            }}</span>
          </template>
        </Column>
        <Column field="customer_name" header="Cliente">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600"
              >
                {{ data.customer_name?.charAt(0) || "C" }}
              </div>
              <span class="font-medium text-slate-700">{{
                data.customer_name
              }}</span>
            </div>
          </template>
        </Column>
        <Column field="status" header="Estado">
          <template #body="{ data }">
            <Tag
              :value="statusLabel(data.status)"
              :severity="statusSeverity(data.status)"
              class="px-3 py-1 rounded-full uppercase text-[10px]"
            />
          </template>
        </Column>
        <Column field="total" header="Total">
          <template #body="{ data }">
            <span class="font-bold text-indigo-600">{{
              formatCurrency(data.total)
            }}</span>
          </template>
        </Column>
        <Column field="created_at" header="Fecha">
          <template #body="{ data }">
            <div class="flex flex-col">
              <span class="text-sm text-slate-700">{{
                new Date(data.created_at).toLocaleDateString()
              }}</span>
              <span class="text-[10px] text-slate-400">{{
                new Date(data.created_at).toLocaleTimeString()
              }}</span>
            </div>
          </template>
        </Column>
        <Column
          header="Acciones"
          headerClass="text-center"
          bodyClass="text-center"
        >
          <template #body="{ data }">
            <div class="flex justify-center gap-1">
              <Button
                type="button"
                icon="pi pi-pencil"
                severity="info"
                text
                rounded
                @click="
                  (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openOffer(data);
                  }
                "
                v-if="data.status === 'draft'"
                v-tooltip.top="'Editar'"
              />
              <Button
                type="button"
                icon="pi pi-eye"
                severity="secondary"
                text
                rounded
                @click="
                  (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openOffer(data);
                  }
                "
                v-else
                v-tooltip.top="'Ver detalles'"
              />
              <Button
                type="button"
                icon="pi pi-print"
                severity="help"
                text
                rounded
                @click="
                  (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePrint(data, e);
                  }
                "
                v-tooltip.top="'Imprimir'"
              />
               <Button
                type="button"
                icon="pi pi-receipt"
                severity="info"
                text
                rounded
                @click="
                  (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePrintTicket(data, e);
                  }
                "
                v-if="data.status === 'paid'"
                v-tooltip.top="'Imprimir Ticket'"
              />
              <Button
                type="button"
                icon="pi pi-download"
                severity="success"
                text
                rounded
                @click="
                  (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDownloadPDF(data, e);
                  }
                "
                v-tooltip.top="'Descargar PDF'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Drawer Editor de Oferta -->
    <Drawer
      v-model:visible="drawerVisible"
      position="right"
      class="modern-drawer !w-full lg:!w-[80vw] xl:!w-[1100px]"
      :blockScroll="true"
      :modal="true"
    >
      <template #header>
        <div class="flex items-center gap-4">
          <div
            class="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200"
          >
            <i
              :class="
                currentOrder?.status === 'paid'
                  ? 'pi pi-receipt'
                  : 'pi pi-file-edit'
              "
              class="text-white text-2xl"
            ></i>
          </div>
          <div>
            <h2 class="text-2xl font-black text-slate-800">
              {{ currentOrder?.status === "paid" ? "Factura" : "Oferta" }} #{{
                currentOrder?.number ?? "Nueva"
              }}
            </h2>
            <div class="flex items-center gap-2 mt-1">
              <Tag
                :value="statusLabel(currentOrder?.status)"
                :severity="statusSeverity(currentOrder?.status)"
                class="px-2 py-0.5 rounded-md uppercase text-[10px]"
              />
              <span
                v-if="currentOrder?.created_at"
                class="text-xs text-slate-400"
              >
                {{ new Date(currentOrder.created_at).toLocaleString() }}
              </span>
            </div>
          </div>
        </div>
      </template>

      <div class="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white">
        <div class="flex-1 overflow-y-auto p-3 md:p-8 space-y-4 md:space-y-8">
          <!-- Cliente -->
          <SalesCustomerForm
            v-model="customer"
            :readOnly="readOnly"
            @select="customerId = $event.id"
          />

          <!-- Productos -->
          <SalesItemsTable v-model:items="items" :readOnly="readOnly" />

          <!-- Resumen de Totales -->
          <SalesTotals :totals="totals" />
        </div>

        <!-- Acciones Fijas en la parte inferior -->
        <div class="p-4 border-t border-indigo-100 bg-white">
          <div class="flex gap-2 flex-wrap justify-center">
            <template v-if="currentOrder?.status === 'draft'">
              <Button
                type="button"
                label="Generar Oferta"
                icon="pi pi-save"
                size="small"
                :loading="isSaving"
                @click.prevent="saveOffer"
                class="bg-indigo-600 !text-white hover:bg-indigo-700 border-0 shadow-md"
                style="color: white !important"
              />
              <Button
                type="button"
                label="Facturar Ahora"
                icon="pi pi-check-circle"
                severity="success"
                size="small"
                :loading="isSaving"
                @click.prevent="handleFacturar"
                class="shadow-md bg-green-600 !text-white hover:bg-green-700 border-0"
                style="color: white !important"
              />
            </template>
            <template v-else-if="currentOrder?.status === 'paid'">
              <Button
                type="button"
                label="Cancelar Venta"
                icon="pi pi-ban"
                severity="danger"
                size="small"
                @click.prevent="handleCancelar"
                class="shadow-md !text-white"
                style="color: white !important"
              />
            </template>
            <Button
              type="button"
              label="Imprimir"
              icon="pi pi-print"
              size="small"
              @click="
                (e) => {
                  e.preventDefault();
                  handlePrint(currentOrder, e);
                }
              "
              v-if="currentOrder?.id"
              class="bg-blue-500 hover:bg-blue-600 border-0 !text-white"
              style="color: white !important"
            />
            <Button
              type="button"
              label="Ticket"
              icon="pi pi-receipt"
              size="small"
              @click="
                (e) => {
                  e.preventDefault();
                  handlePrintTicket(currentOrder, e);
                }
              "
              v-if="currentOrder?.id && currentOrder?.status === 'paid'"
              class="bg-cyan-600 hover:bg-cyan-700 border-0 !text-white shadow-md mx-2"
              style="color: white !important"
            />
            <Button
              type="button"
              label="PDF"
              icon="pi pi-download"
              size="small"
              @click="
                (e) => {
                  e.preventDefault();
                  handleDownloadPDF(currentOrder, e);
                }
              "
              v-if="currentOrder?.id"
              class="bg-blue-600 !text-white hover:bg-blue-700 border-0 shadow-md"
              style="color: white !important"
            />
          </div>
        </div>
      </div>
    </Drawer>

    <!-- Confirmation Dialog -->
    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { useConfirm } from "primevue/useconfirm";
import {
  listOffers,
  getOrderItems,
  createDraftOrder,
  upsertItems,
  patchOrder,
  finalizeOrder,
  cancelOrder,
} from "../services/ventas";
import { formatCurrency, calculateOrderTotals } from "../utils/calculations";
import { handleError, showSuccess, showWarning } from "../utils/errorHandler";
import { useBusinessStore } from "../stores/businessStore";
import { printInvoice } from "../utils/printInvoice";
import { downloadInvoicePDF } from "../utils/downloadPDF";

import SalesCustomerForm from "../components/sales/SalesCustomerForm.vue";
import SalesItemsTable from "../components/sales/SalesItemsTable.vue";
import SalesTotals from "../components/sales/SalesTotals.vue";
import ReceiptTicket from "../components/sales/ReceiptTicket.vue";
import { nextTick } from "vue";

import Button from "primevue/button";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Drawer from "primevue/drawer";
import Tag from "primevue/tag";
import Textarea from "primevue/textarea";
import Tooltip from "primevue/tooltip";
import ConfirmDialog from "primevue/confirmdialog";
import InputText from "primevue/inputtext";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import { FilterMatchMode } from "@primevue/core/api";

const businessStore = useBusinessStore();
const queryClient = useQueryClient();
const confirm = useConfirm();
const vTooltip = Tooltip;

// Search and filters
const searchText = ref("");
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

// Watch searchText and update filter
watch(searchText, (newVal) => {
  filters.value.global.value = newVal;
});

// Fetch principal
const { data: offers = [], isLoading } = useQuery({
  queryKey: ["sales-offers"],
  queryFn: () => listOffers({ limit: 500 }),
});

onMounted(() => {
  businessStore.fetchSettings();
});

// Estados Editor
const drawerVisible = ref(false);
const currentOrder = ref(null);
const items = ref([]);
const customer = ref({ name: "", phone: "", email: "" });
const customerId = ref(null);
const isSaving = ref(false);

// Estado para impresión de ticket
const printingOrder = ref(null);
const printingItems = ref([]);

const readOnly = computed(() => currentOrder.value?.status !== "draft");

// Totales usando la nueva utilidad
const totals = computed(() => calculateOrderTotals(items.value));

// Funciones
const statusLabel = (s) =>
  ({
    draft: "Oferta",
    paid: "Pagada",
    cancelled: "Cancelada",
  }[s] || s);

const statusSeverity = (s) =>
  ({
    draft: "warn",
    paid: "success",
    cancelled: "danger",
  }[s] || "info");

const createOffer = () => {
  currentOrder.value = { status: "draft", number: null };
  items.value = [];
  customer.value = { name: "", phone: "", email: "" };
  customerId.value = null;
  drawerVisible.value = true;
};

const onRowClick = (e) => {
  if (e.originalEvent) {
    e.originalEvent.preventDefault();
  }
  openOffer(e.data);
};

const openOffer = async (order) => {
  try {
    currentOrder.value = order;
    customer.value = {
      name: order.customer_name || "",
      phone: order.customer_phone || "",
      email: order.customer_email || "",
    };
    customerId.value = order.customer_id;
    drawerVisible.value = true;

    items.value = await getOrderItems(order.id);
  } catch (err) {
    handleError(err);
  }
};

const saveOffer = async () => {
  if (!customer.value.name) {
    showWarning("Selecciona un cliente");
    return false;
  }
  if (items.value.length === 0) {
    showWarning("Agrega productos");
    return false;
  }

  try {
    isSaving.value = true;
    let orderId = currentOrder.value.id;
    if (!orderId) {
      const created = await createDraftOrder();
      orderId = created.id;
      currentOrder.value.id = orderId;
    }

    await upsertItems(items.value.map((i) => ({ ...i, order_id: orderId })));

    const updated = await patchOrder(orderId, {
      ...totals.value,
      customer_id: customerId.value,
      customer_name: customer.value.name,
      customer_phone: customer.value.phone,
      customer_email: customer.value.email,
    });

    currentOrder.value = updated;
    showSuccess("Oferta guardada");
    queryClient.invalidateQueries({ queryKey: ["sales-offers"] });
    return true;
  } catch (err) {
    handleError(err);
    return false;
  } finally {
    isSaving.value = false;
  }
};

const handleFacturar = async () => {
  confirm.require({
    message: "¿Convertir esta oferta en factura? Se descontará del stock.",
    header: "Confirmar Facturación",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Sí, facturar",
    rejectLabel: "Cancelar",
    accept: async () => {
      try {
        isSaving.value = true;
        const saved = await saveOffer();
        if (!saved) return;

        await finalizeOrder(currentOrder.value.id);
        showSuccess("Venta facturada exitosamente");
        drawerVisible.value = false;
        queryClient.invalidateQueries({ queryKey: ["sales-offers"] });
      } catch (err) {
        if (err.message && err.message.includes('INSUFFICIENT_STOCK')) {
             // Extract product ID if possible, or just general message
             // message: 'INSUFFICIENT_STOCK for product UUID (need X, have Y)'
             const matches = err.message.match(/for product ([a-f0-9-]+) \(need (\d+(\.\d+)?), have (\d+(\.\d+)?)\)/)
             if (matches) {
                 const productId = matches[1]
                 const needed = parseFloat(matches[2])
                 const have = parseFloat(matches[4])
                 
                 const productItem = items.value.find(i => i.product_id === productId)
                 const productName = productItem ? productItem.product_name : 'Producto desconocido'
                 
                 showWarning(`Stock insuficiente para "${productName}": Necesitas ${needed}, tienes ${have}`)
             } else {
                 showWarning('No tienes suficiente stock para realizar esta venta.')
             }
        } else {
             handleError(err);
        }
      } finally {
        isSaving.value = false;
      }
    },
  });
};

const handleCancelar = async () => {
  confirm.require({
    message: "¿Cancelar esta venta? Esta acción no se puede deshacer.",
    header: "Confirmar Cancelación",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Sí, cancelar",
    rejectLabel: "No",
    acceptClass: "p-button-danger",
    accept: async () => {
      try {
        isSaving.value = true;
        await cancelOrder(currentOrder.value.id);
        showSuccess("Venta cancelada");
        drawerVisible.value = false;
        queryClient.invalidateQueries({ queryKey: ["sales-offers"] });
      } catch (err) {
        handleError(err);
      } finally {
        isSaving.value = false;
      }
    },
  });
};

const handlePrintTicket = async (order, event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  try {
    printingOrder.value = order;
    
    // Si estamos editando y tenemos items en memoria (caso oferta nueva no guardada), usarlos?
    // Por simplicidad, asumimos que se imprime lo guardado o lo que trae la orden.
    // Para ofertas/facturas, obtenemos items de BD.
    const its = await getOrderItems(order.id);
    printingItems.value = its;

    await nextTick();
    window.print();
  } catch (error) {
    console.error("Error printing receipt:", error);
    handleError(error, "No se pudo preparar la impresión del ticket.");
  }
};

const handlePrint = async (order, event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  try {
    const its = await getOrderItems(order.id);
    await printInvoice({ order, items: its, business: businessStore.settings });
  } catch (err) {
    handleError(err);
  }
};

const handleDownloadPDF = async (order, event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  try {
    const its = await getOrderItems(order.id);
    await downloadInvoicePDF({ order, items: its, business: businessStore.settings });
    showSuccess("PDF descargado correctamente");
  } catch (err) {
    handleError(err);
  }
};
</script>

<style scoped>
:deep(.p-drawer-content) {
  padding: 0 !important;
}

.modern-table :deep(.p-datatable-thead > tr > th) {
  @apply bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider;
}

.modern-table :deep(.p-datatable-tbody > tr > td) {
  @apply py-4 border-b border-slate-50;
}
</style>

