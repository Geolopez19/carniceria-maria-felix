<template>
  <div class="max-w-7xl mx-auto p-2 sm:p-4 md:p-6">
    <!-- Receipt Ticket (Hidden on screen, visible on print) -->
    <div class="hidden print:block fixed inset-0 bg-white z-[9999] print-container">
       <ReceiptTicket :order="printingOrder" :items="printingItems" :business="businessStore.settings" />
    </div>

    <!-- Header solido/gradiente -->
    <div
      class="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl md:rounded-2xl shadow-md md:shadow-xl p-5 md:p-8 mb-4 md:mb-8 text-white transition-all hover:shadow-2xl"
    >
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        <div>
          <h1 class="text-2xl md:text-4xl font-black mb-1 flex items-center gap-2 md:gap-3">
            <i class="pi pi-receipt text-2xl md:text-3xl opacity-80"></i>
            Facturas de Venta
          </h1>
          <p class="text-emerald-100 font-medium text-sm md:text-base">
            Historial de ventas completadas
          </p>
        </div>
        <div class="flex flex-wrap justify-start gap-3 w-full md:w-auto">
          <Select
            v-model="statusFilter"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full sm:w-48 bg-white/10 border-white/20 text-white rounded-xl backdrop-blur-md"
            placeholder="Filtrar por estado"
          />
        </div>
      </div>
    </div>

    <!-- Tabla de Facturas -->
    <div
      class="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
    >
      <DataTable
        :value="filteredOrders"
        :loading="isLoading"
        paginator
        :rows="15"
        stripedRows
        scrollable
        @row-click="onRowClick"
        :rowClass="() => 'cursor-pointer'"
        class="modern-table"
      >
        <Column field="invoice_number" header="#" style="width: 100px">
          <template #body="{ data }">
            <span class="font-bold text-slate-800">{{
              data.invoice_number ?? data.number ?? "—"
            }}</span>
          </template>
        </Column>
        <Column field="customer_name" header="Cliente">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600"
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
        <Column field="payment_method" header="Pago" style="min-width: 130px">
          <template #body="{ data }">
            <span v-if="data.payment_method" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <i :class="getPaymentMethodIcon(data.payment_method)" class="text-emerald-600 text-[11px]"></i>
              {{ getPaymentMethodLabel(data.payment_method) }}
            </span>
            <span v-else class="text-xs text-slate-400 italic">—</span>
          </template>
        </Column>
        <Column field="total" header="Total">
          <template #body="{ data }">
            <span class="font-bold text-emerald-600">{{
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
                icon="pi pi-eye"
                severity="secondary"
                text
                rounded
                @click="stopAndOpen(data, $event)"
                v-tooltip.top="'Ver detalles'"
              />
              <Button
                type="button"
                icon="pi pi-print"
                severity="help"
                text
                rounded
                @click="handlePrint(data, $event)"
                v-tooltip.top="'Imprimir'"
              />
              <Button
                type="button"
                icon="pi pi-download"
                severity="success"
                text
                rounded
                @click="handleDownloadPDF(data, $event)"
                v-tooltip.top="'Descargar PDF'"
              />
               <Button
                type="button"
                icon="pi pi-receipt"
                severity="info"
                text
                rounded
                @click="handlePrintTicket(data, $event)"
                v-tooltip.top="'Imprimir Ticket'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Drawer de Detalle -->
    <Drawer
      v-model:visible="drawerVisible"
      position="right"
      :blockScroll="true"
      :modal="true"
      class="modern-drawer !w-full lg:!w-[80vw] xl:!w-[1100px]"
    >
      <template #header>
        <div class="flex items-center gap-4">
          <div
            class="bg-emerald-600 p-3 rounded-xl shadow-lg shadow-emerald-200"
          >
            <i class="pi pi-receipt text-white text-2xl"></i>
          </div>
          <div>
            <h2 class="text-2xl font-black text-slate-800">
              Factura #{{
                currentOrder?.invoice_number ?? currentOrder?.number ?? "—"
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
        <div
          class="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 space-y-4 md:space-y-8 custom-scrollbar"
        >
          <!-- Cliente Card style similar to form but read-only -->
          <div
            class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div
              class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <i class="pi pi-user text-emerald-600 font-bold"></i>
                <span class="font-bold text-slate-700">Cliente</span>
              </div>
            </div>
            <div class="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label
                  class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1"
                  >Nombre</label
                >
                <p class="text-slate-800 font-medium text-lg">
                  {{ currentOrder?.customer_name || "—" }}
                </p>
              </div>
              <div>
                <label
                  class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1"
                  >Teléfono</label
                >
                <p class="text-slate-800 font-medium">
                  {{ currentOrder?.customer_phone || "—" }}
                </p>
              </div>
              <div>
                <label
                  class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1"
                  >Email</label
                >
                <p class="text-slate-800 font-medium">
                  {{ currentOrder?.customer_email || "—" }}
                </p>
              </div>
              <div>
                <label
                  class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1"
                  >Método de Pago</label
                >
                <p class="text-slate-800 font-bold flex items-center gap-1.5 mt-0.5">
                  <i :class="getPaymentMethodIcon(currentOrder?.payment_method)" class="text-emerald-600"></i>
                  {{ getPaymentMethodLabel(currentOrder?.payment_method) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Productos Grid/Table -->
          <div
            class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div
              class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2"
            >
              <i class="pi pi-list text-slate-500"></i>
              <span class="font-bold text-slate-700">Productos Facturados</span>
            </div>
            <div class="p-0">
              <DataTable
                :value="items"
                class="modern-table"
                :loading="loadingItems"
                stripedRows
              >
                <Column field="product_name" header="Producto">
                  <template #body="{ data }">
                    <span class="font-medium text-slate-700">{{
                      data.product_name
                    }}</span>
                  </template>
                </Column>
                <Column
                  field="qty"
                  header="Cant."
                  headerClass="text-center"
                  bodyClass="text-center w-24"
                >
                  <template #body="{ data }">
                    <span
                      class="bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono font-bold"
                      >{{ data.qty }}</span
                    >
                  </template>
                </Column>
                <Column
                  field="unit_price"
                  header="Precio"
                  headerClass="text-right"
                  bodyClass="text-right"
                >
                  <template #body="{ data }">{{
                    formatCurrency(data.unit_price)
                  }}</template>
                </Column>
                <Column
                  field="tax_rate"
                  header="Imp"
                  headerClass="text-center"
                  bodyClass="text-center w-16"
                >
                  <template #body="{ data }">
                    <span class="text-xs text-slate-400"
                      >{{ data.tax_rate }}%</span
                    >
                  </template>
                </Column>
                <Column
                  field="line_total"
                  header="Total"
                  headerClass="text-right"
                  bodyClass="text-right"
                >
                  <template #body="{ data }">
                    <span class="font-bold text-emerald-600">{{
                      formatCurrency(data.line_total)
                    }}</span>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Notas -->
            <div
              class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit"
            >
              <div
                class="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center gap-2"
              >
                <i class="pi pi-align-left text-slate-500"></i>
                <span class="font-bold text-slate-700">Notas</span>
              </div>
              <div class="p-5">
                <p
                  v-if="currentOrder?.notes"
                  class="text-slate-600 text-sm leading-relaxed whitespace-pre-line"
                >
                  {{ currentOrder.notes }}
                </p>
                <p v-else class="text-slate-400 italic text-sm">
                  Sin notas adicionales.
                </p>
              </div>
            </div>

            <!-- Totales -->
            <div
              class="bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-3"
            >
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">Subtotal</span>
                <span class="text-slate-900 font-semibold">{{
                  formatCurrency(currentOrder?.subtotal || 0)
                }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">Impuestos</span>
                <span class="text-slate-900 font-semibold">{{
                  formatCurrency(currentOrder?.tax_total || 0)
                }}</span>
              </div>
              <div
                class="border-t border-slate-200 my-2 pt-3 flex justify-between items-center"
              >
                <span class="text-lg font-bold text-slate-800">Total</span>
                <span class="text-2xl font-black text-emerald-600">{{
                  formatCurrency(currentOrder?.total || 0)
                }}</span>
              </div>

              <!-- Desglose de Efectivo y Vuelto si aplica -->
              <div v-if="currentOrder?.amount_received > 0" class="pt-2 border-t border-dashed border-slate-300 space-y-1">
                <div class="flex justify-between text-xs text-slate-600">
                  <span>Efectivo Recibido:</span>
                  <span class="font-bold text-slate-800">{{ formatCurrency(currentOrder.amount_received) }}</span>
                </div>
                <div class="flex justify-between text-xs text-slate-600">
                  <span>Vuelto Entregado:</span>
                  <span class="font-bold text-emerald-700">{{ formatCurrency(currentOrder.change_given || 0) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer del Drawer -->
        <div
          class="p-6 border-t border-slate-200 bg-white flex flex-wrap justify-center md:justify-end items-center gap-3"
        >
          <Button
            type="button"
            v-if="currentOrder?.status === 'paid'"
            label="Cancelar Venta"
            icon="pi pi-ban"
            severity="danger"
            class="shadow-md py-2 px-6 rounded-xl font-bold hover:bg-red-600"
            @click.prevent="confirmCancelOrder"
          />
          <Button
            type="button"
            label="Imprimir"
            icon="pi pi-print"
            severity="secondary"
            variant="outlined"
            class="py-2 px-6 rounded-xl font-bold"
            @click="handlePrint(currentOrder, $event)"
          />
          <Button
            type="button"
            label="Ticket"
            icon="pi pi-receipt"
            severity="info"
            variant="outlined"
            class="py-2 px-6 rounded-xl font-bold"
            @click="handlePrintTicket(currentOrder, $event)"
          />
          <Button
            type="button"
            label="Descargar PDF"
            icon="pi pi-download"
            severity="success"
            class="shadow-md py-2 px-6 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 border-0"
            @click="handleDownloadPDF(currentOrder, $event)"
          />
          <Button
            icon="pi pi-times"
            text
            rounded
            class="ml-2"
            @click.prevent="drawerVisible = false"
            v-tooltip.top="'Cerrar'"
          />
        </div>
      </div>
    </Drawer>

    <!-- Confirm Dialog -->
    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { listOffers, getOrderItems, cancelOrder } from "../services/ventas";
import { formatCurrency } from "../utils/calculations";
import { handleError, showSuccess } from "../utils/errorHandler";
import { useBusinessStore } from "../stores/businessStore";
import { printInvoice } from "../utils/printInvoice";
import { downloadInvoicePDF } from "../utils/downloadPDF";
import { useConfirm } from "primevue/useconfirm";
import { nextTick } from "vue";
import ReceiptTicket from "../components/sales/ReceiptTicket.vue";

import Button from "primevue/button";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Drawer from "primevue/drawer";
import Tag from "primevue/tag";
import Select from "primevue/select";
import Tooltip from "primevue/tooltip";
import ConfirmDialog from "primevue/confirmdialog";

const queryClient = useQueryClient();
const confirm = useConfirm();
const businessStore = useBusinessStore();

// Directivas
const vTooltip = Tooltip;

// Opciones de métodos de pago
const paymentMethodOptions = [
  { label: "Efectivo", value: "efectivo", icon: "pi pi-money-bill" },
  { label: "Tarjeta", value: "tarjeta", icon: "pi pi-credit-card" },
  { label: "Transferencia bancaria", value: "transferencia", icon: "pi pi-send" },
  { label: "Otro", value: "otro", icon: "pi pi-ellipsis-h" },
];

const getPaymentMethodLabel = (val) => {
  const opt = paymentMethodOptions.find((o) => o.value === val);
  return opt ? opt.label : (val || "—");
};

const getPaymentMethodIcon = (val) => {
  const opt = paymentMethodOptions.find((o) => o.value === val);
  return opt ? opt.icon : "pi pi-wallet";
};

// Estados de la lista
const statusFilter = ref("paid");
const statusOptions = [
  { label: "Todas", value: "all" },
  { label: "Pagadas", value: "paid" },
  { label: "Canceladas", value: "cancelled" },
];

// Fetch de órdenes
const { data: orders = [], isLoading } = useQuery({
  queryKey: ["sales-orders"],
  queryFn: () => listOffers({ limit: 500 }),
});

const filteredOrders = computed(() => {
  if (!orders.value || !Array.isArray(orders.value)) return [];
  const filtered = orders.value.filter(
    (o) => o.status === "paid" || o.status === "cancelled"
  );
  if (statusFilter.value === "all") return filtered;
  return filtered.filter((o) => o.status === statusFilter.value);
});

// Estados del detalle
const drawerVisible = ref(false);
const currentOrder = ref(null);
const items = ref([]);
const loadingItems = ref(false);

// Estado para impresión de ticket
const printingOrder = ref(null);
const printingItems = ref([]);

// Funciones
const statusLabel = (s) =>
  ({
    paid: "Pagada",
    cancelled: "Cancelada",
    draft: "Oferta",
  }[s] || s);

const statusSeverity = (s) =>
  ({
    paid: "success",
    cancelled: "danger",
    draft: "warn",
  }[s] || "info");

const onRowClick = (e) => {
  if (e.originalEvent) {
    e.originalEvent.preventDefault();
  }
  openOrder(e.data);
};

// Helper for buttons in row to avoid bubbling issues
const stopAndOpen = (data, event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  openOrder(data);
};

const openOrder = async (order) => {
  try {
    currentOrder.value = order;
    drawerVisible.value = true;
    loadingItems.value = true;

    const its = await getOrderItems(order.id);
    items.value = its;
  } catch (err) {
    handleError(err, "No se pudieron cargar los detalles de la factura");
  } finally {
    loadingItems.value = false;
  }
};

const confirmCancelOrder = () => {
    confirm.require({
        message: '¿Estás seguro de cancelar esta venta? El stock se repondrá automáticamente.',
        header: 'Confirmar Cancelación',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, cancelar venta',
        rejectLabel: 'No, regresar',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await cancelOrder(currentOrder.value.id);
                showSuccess("Venta cancelada correctamente");
                drawerVisible.value = false;
                queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
            } catch (err) {
                handleError(err);
            }
        }
    });
};

const handlePrintTicket = async (order, event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  try {
    // 1. Set the order to print
    printingOrder.value = order;
    
    // 2. Fetch items if needed
    const its = await getOrderItems(order.id);
    printingItems.value = its;

    // 3. Wait for DOM update so ReceiptTicket renders with new data
    await nextTick();

    // 4. Trigger print
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
  if (!order) return;
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
  if (!order) return;
  try {
    const its = await getOrderItems(order.id);
    await downloadInvoicePDF({ order, items: its, business: businessStore.settings });
    showSuccess("PDF descargado correctamente");
  } catch (err) {
    handleError(err);
  }
};


onMounted(() => {
  businessStore.fetchSettings();
});
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

