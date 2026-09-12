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
        :globalFilterFields="['customer_name', 'invoice_number']"
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
        <Column field="payment_method" header="Pago" style="min-width: 130px">
          <template #body="{ data }">
            <span v-if="data.payment_method" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <i :class="getPaymentMethodIcon(data.payment_method)" class="text-indigo-600 text-[11px]"></i>
              {{ getPaymentMethodLabel(data.payment_method) }}
            </span>
            <span v-else class="text-xs text-slate-400 italic">—</span>
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
              <Button
                type="button"
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                @click="
                  (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    confirmDeleteOffer(data);
                  }
                "
                v-if="data.status === 'draft'"
                v-tooltip.top="'Eliminar'"
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
                currentOrder?.invoice_number ?? currentOrder?.number ?? "Nueva"
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

          <!-- Configuración de Oferta: Método de Pago e IVA -->
          <div class="bg-white rounded-xl shadow-md border border-indigo-100 overflow-hidden">
            <div class="bg-gradient-to-r from-slate-50 to-indigo-50/40 px-4 sm:px-6 py-3 border-b border-indigo-100 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="bg-indigo-100 p-1.5 rounded-md text-indigo-600">
                  <i class="pi pi-credit-card text-lg"></i>
                </div>
                <h3 class="text-base font-bold text-slate-800">Condiciones de Venta</h3>
              </div>
              <span class="text-xs text-slate-500 font-medium">Requerido para facturar</span>
            </div>

            <div class="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <!-- Método de Pago -->
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <i class="pi pi-wallet text-indigo-500"></i>
                  Método de Pago <span class="text-xs font-normal text-slate-400 lowercase">(obligatorio para facturar)</span>
                </label>
                <Select
                  v-model="paymentMethod"
                  :options="paymentMethodOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione un método de pago..."
                  :disabled="readOnly"
                  class="w-full"
                  :class="{ 'p-invalid border-rose-400': paymentMethodError }"
                  @change="paymentMethodError = false"
                >
                  <template #value="slotProps">
                    <div v-if="slotProps.value" class="flex items-center gap-2">
                      <i :class="getPaymentMethodIcon(slotProps.value)" class="text-indigo-600"></i>
                      <span class="font-medium text-slate-800">{{ getPaymentMethodLabel(slotProps.value) }}</span>
                    </div>
                    <span v-else class="text-slate-400">{{ slotProps.placeholder }}</span>
                  </template>
                  <template #option="slotProps">
                    <div class="flex items-center gap-2 py-1">
                      <i :class="slotProps.option.icon" class="text-indigo-600 text-base w-5"></i>
                      <span class="font-medium text-slate-700">{{ slotProps.option.label }}</span>
                    </div>
                  </template>
                </Select>
                <small v-if="paymentMethodError" class="text-rose-500 font-medium flex items-center gap-1">
                  <i class="pi pi-exclamation-circle text-xs"></i> Seleccione un método de pago.
                </small>
                <small v-else class="text-slate-400 text-[11px]">
                  Especifique cómo cancelará o cotiza el cliente.
                </small>
              </div>

              <!-- Opción de Descuento (0%, 5%, 10%, 15%) -->
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <i class="pi pi-percentage text-amber-500"></i>
                  Descuento en Oferta
                </label>
                <div class="grid grid-cols-4 gap-2">
                  <button
                    v-for="opt in [0, 5, 10, 15]"
                    :key="opt"
                    type="button"
                    :disabled="readOnly"
                    @click="discountPercent = opt"
                    class="py-2.5 px-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-0.5"
                    :class="[
                      discountPercent === opt
                        ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-105'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300',
                      readOnly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                    ]"
                  >
                    <span>{{ opt === 0 ? '0%' : `${opt}%` }}</span>
                    <span class="text-[10px] font-normal" :class="discountPercent === opt ? 'text-amber-100' : 'text-slate-400'">
                      {{ opt === 0 ? 'Sin desc.' : 'Aplicar' }}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Productos -->
          <SalesItemsTable 
            v-model:items="items" 
            :readOnly="readOnly" 
          />

          <!-- Resumen de Totales -->
          <SalesTotals 
            :totals="totals" 
          />
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
              <Button
                type="button"
                label="Eliminar Oferta"
                icon="pi pi-trash"
                severity="danger"
                size="small"
                :loading="isSaving"
                @click.prevent="confirmDeleteOffer(currentOrder)"
                v-if="currentOrder?.id"
                class="shadow-md !text-white"
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

    <!-- Modal de Cobro en Efectivo -->
    <PaymentCashDialog
      v-model:visible="cashDialogVisible"
      :total="totals.total"
      :isProcessing="isSaving"
      @confirm="onCashPaymentConfirmed"
    />

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
  deleteOrderItemsNotInList,
  patchOrder,
  finalizeOrder,
  cancelOrder,
  deleteOrder,
} from "../services/ventas";
import { formatCurrency, calculateOrderTotals } from "../utils/calculations";
import { handleError, showSuccess, showWarning } from "../utils/errorHandler";
import { useBusinessStore } from "../stores/businessStore";
import { printInvoice } from "../utils/printInvoice";
import { downloadInvoicePDF } from "../utils/downloadPDF";
import { findOrCreateCustomer } from "../services/clientes";

import SalesCustomerForm from "../components/sales/SalesCustomerForm.vue";
import SalesItemsTable from "../components/sales/SalesItemsTable.vue";
import SalesTotals from "../components/sales/SalesTotals.vue";
import ReceiptTicket from "../components/sales/ReceiptTicket.vue";
import PaymentCashDialog from "../components/sales/PaymentCashDialog.vue";
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

import Select from "primevue/select";
import { IVA_PORCENTAJE } from "../constants";

const businessStore = useBusinessStore();
const queryClient = useQueryClient();
const confirm = useConfirm();
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
  return opt ? opt.label : val;
};

const getPaymentMethodIcon = (val) => {
  const opt = paymentMethodOptions.find((o) => o.value === val);
  return opt ? opt.icon : "pi pi-wallet";
};

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

// Nuevos estados para Método de Pago y Descuento (por defecto desactivados/vacíos)
const paymentMethod = ref(null);
const paymentMethodError = ref(false);
const discountPercent = ref(0);
const cashDialogVisible = ref(false);
const amountReceived = ref(0);
const changeGiven = ref(0);

// Estado para impresión de ticket
const printingOrder = ref(null);
const printingItems = ref([]);

const readOnly = computed(() => currentOrder.value?.status !== "draft");

// Totales usando la nueva utilidad calculada con discountPercent
const totals = computed(() => calculateOrderTotals(items.value, discountPercent.value));

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
  currentOrder.value = { status: "draft", invoice_number: null };
  items.value = [];
  customer.value = { name: "", phone: "", email: "" };
  customerId.value = null;
  // REGLA PRINCIPAL: Ningún método de pago ni descuento seleccionados por defecto
  paymentMethod.value = null;
  paymentMethodError.value = false;
  discountPercent.value = 0;
  amountReceived.value = 0;
  changeGiven.value = 0;
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
    // Cargar método de pago guardado o null
    paymentMethod.value = order.payment_method || null;
    paymentMethodError.value = false;
    amountReceived.value = Number(order.amount_received || 0);
    changeGiven.value = Number(order.change_given || 0);
    
    // Cargar porcentaje de descuento guardado
    if (order.discount_percent !== undefined && order.discount_percent !== null) {
      discountPercent.value = Number(order.discount_percent);
    } else if (order.subtotal > 0 && order.discount > 0) {
      // Si existía un monto de descuento previo, inferir aproximado
      const approx = Math.round((Number(order.discount) / Number(order.subtotal)) * 100);
      discountPercent.value = [5, 10, 15].includes(approx) ? approx : 0;
    } else {
      discountPercent.value = 0;
    }

    drawerVisible.value = true;
    items.value = await getOrderItems(order.id);
  } catch (err) {
    handleError(err);
  }
};

const saveOffer = async (options = { closeDrawerOnSuccess: true }) => {
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

    // Garantizar que el cliente existe o buscarlo/crearlo sin duplicar antes de asociarlo a la oferta
    if (customer.value?.name && customer.value.name.trim()) {
      try {
        const foundOrCreated = await findOrCreateCustomer({
          name: customer.value.name,
          phone: customer.value.phone,
          email: customer.value.email,
        });
        if (foundOrCreated && foundOrCreated.id) {
          customerId.value = foundOrCreated.id;
          customer.value = {
            name: foundOrCreated.name || customer.value.name,
            phone: foundOrCreated.phone || customer.value.phone || "",
            email: foundOrCreated.email || customer.value.email || "",
          };
        }
      } catch (custErr) {
        console.warn("⚠️ No se pudo procesar el cliente automáticamente:", custErr);
      }
    }

    let orderId = currentOrder.value.id;
    if (!orderId) {
      const created = await createDraftOrder();
      orderId = created.id;
      currentOrder.value.id = orderId;
    }

    // Sincronizar ítems: eliminar de la BD los ítems que fueron removidos de la oferta
    const activeItemIds = items.value.map((i) => i.id).filter(Boolean);
    await deleteOrderItemsNotInList(orderId, activeItemIds);

    await upsertItems(items.value.map((i) => ({ ...i, order_id: orderId })));

    const patchPayload = {
      ...totals.value,
      discount: totals.value.discount_total,
      discount_percent: discountPercent.value,
      customer_id: customerId.value,
      customer_name: customer.value.name,
      customer_phone: customer.value.phone,
      customer_email: customer.value.email,
      payment_method: paymentMethod.value || null,
      amount_received: amountReceived.value,
      change_given: changeGiven.value,
    };

    let updated;
    try {
      updated = await patchOrder(orderId, patchPayload);
    } catch (patchErr) {
      // Reintentar descartando columnas que podrían no existir en schemas anteriores
      const fallbackPayload = { ...patchPayload };
      delete fallbackPayload.discount_percent;
      delete fallbackPayload.amount_received;
      delete fallbackPayload.change_given;
      try {
        updated = await patchOrder(orderId, fallbackPayload);
      } catch (secondErr) {
        delete fallbackPayload.apply_tax;
        delete fallbackPayload.payment_method;
        updated = await patchOrder(orderId, fallbackPayload);
      }
    }

    currentOrder.value = {
      ...updated,
      amount_received: amountReceived.value,
      change_given: changeGiven.value,
    };
    showSuccess("Oferta guardada correctamente");
    await queryClient.invalidateQueries({ queryKey: ["sales-offers"] });
    if (options.closeDrawerOnSuccess) {
      drawerVisible.value = false;
    }
    return true;
  } catch (err) {
    handleError(err);
    return false;
  } finally {
    isSaving.value = false;
  }
};

const executeFinalizeOrder = async () => {
  try {
    isSaving.value = true;
    const saved = await saveOffer({ closeDrawerOnSuccess: false });
    if (!saved) return;

    await finalizeOrder(currentOrder.value.id);
    showSuccess("Venta facturada exitosamente");
    cashDialogVisible.value = false;
    drawerVisible.value = false;
    queryClient.invalidateQueries({ queryKey: ["sales-offers"] });

    // Ofrecer impresión automática del ticket con vuelto
    handlePrintTicket({
      ...currentOrder.value,
      status: 'paid',
      amount_received: amountReceived.value,
      change_given: changeGiven.value,
    });
  } catch (err) {
    if (err.message && err.message.includes('INSUFFICIENT_STOCK')) {
      const matches = err.message.match(/for product ([a-f0-9-]+) \(need (\d+(\.\d+)?), have (\d+(\.\d+)?)\)/);
      if (matches) {
        const productId = matches[1];
        const needed = parseFloat(matches[2]);
        const have = parseFloat(matches[4]);
        const productItem = items.value.find((i) => i.product_id === productId);
        const productName = productItem ? productItem.product_name : 'Producto desconocido';
        showWarning(`Stock insuficiente para "${productName}": Necesitas ${needed}, tienes ${have}`);
      } else {
        showWarning('No tienes suficiente stock para realizar esta venta.');
      }
    } else {
      handleError(err);
    }
  } finally {
    isSaving.value = false;
  }
};

const onCashPaymentConfirmed = ({ amountReceived: received, changeGiven: change }) => {
  amountReceived.value = received;
  changeGiven.value = change;
  executeFinalizeOrder();
};

const handleFacturar = async () => {
  if (!customer.value.name) {
    showWarning("Selecciona un cliente");
    return;
  }
  if (items.value.length === 0) {
    showWarning("Agrega productos");
    return;
  }
  if (!paymentMethod.value) {
    paymentMethodError.value = true;
    showWarning("Seleccione un método de pago.");
    return;
  }

  // Si el método es EFECTIVO, abrir el modal interactivo de billete y vuelto
  if (paymentMethod.value === "efectivo") {
    cashDialogVisible.value = true;
    return;
  }

  // Si no es efectivo, confirmar directamente
  confirm.require({
    message: "¿Convertir esta oferta en factura? Se descontará del stock.",
    header: "Confirmar Facturación",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Sí, facturar",
    rejectLabel: "Cancelar",
    accept: async () => {
      await executeFinalizeOrder();
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

const confirmDeleteOffer = (order) => {
  if (!order || !order.id) return;
  if (order.status !== "draft") {
    showWarning("Solo se pueden eliminar ofertas en borrador.");
    return;
  }

  confirm.require({
    message: "¿Estás seguro de que deseas eliminar esta oferta?",
    header: "Confirmar Eliminación",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Sí, eliminar",
    rejectLabel: "Cancelar",
    acceptClass: "p-button-danger",
    accept: async () => {
      try {
        isSaving.value = true;
        await deleteOrder(order.id);
        showSuccess("Oferta eliminada correctamente.");
        if (drawerVisible.value && currentOrder.value?.id === order.id) {
          drawerVisible.value = false;
        }
        await queryClient.invalidateQueries({ queryKey: ["sales-offers"] });
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

