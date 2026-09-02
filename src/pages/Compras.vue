<template>
  <div class="max-w-7xl mx-auto p-4 md:p-6">
    <!-- Header solido -->
    <div class="bg-indigo-600 rounded-xl md:rounded-2xl shadow-md md:shadow-xl p-5 md:p-8 mb-4 md:mb-8 text-white transition-all hover:shadow-2xl">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        <div>
          <h1 class="text-2xl md:text-4xl font-black mb-1 flex items-center gap-2 md:gap-3">
            <i class="pi pi-shopping-bag text-2xl md:text-3xl opacity-80"></i>
            Compras
          </h1>
          <p class="text-indigo-100 font-medium text-sm md:text-base">Gestión de abastecimiento e ingreso de mercancía</p>
        </div>
        <div class="flex flex-col sm:flex-row flex-wrap justify-start gap-3 w-full md:w-auto">
          <Select 
            v-model="statusFilter" 
            :options="statusOptions" 
            optionLabel="label" 
            optionValue="value" 
            class="w-full sm:w-48 bg-white/10 border-white/20 text-white rounded-xl backdrop-blur-md" 
            placeholder="Filtrar por estado"
          />
          <Button 
            type="button" 
            label="Nueva Compra" 
            icon="pi pi-plus-circle" 
            @click.prevent="createPurchase" 
            class="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/20 shadow-lg px-6 font-bold rounded-xl backdrop-blur-md"
            style="color: white !important;"
          />
        </div>
      </div>
    </div>

    <!-- Tabla de Compras -->
    <div class="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <DataTable 
        :value="filteredPurchases" 
        :loading="isLoading" 
        paginator 
        :rows="15"
        stripedRows 
        scrollable 
        class="modern-table"
        @row-click="(e) => openPurchase(e.data)"
        :rowClass="() => 'cursor-pointer'"
      >
        <Column field="number" header="#" style="width: 80px">
          <template #body="{ data }">
            <span class="font-bold text-slate-800">{{ data.number ?? '—' }}</span>
          </template>
        </Column>
        <Column field="supplier_name" header="Proveedor">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                {{ data.supplier_name?.charAt(0) || '?' }}
              </div>
              <span class="font-medium text-slate-700">{{ data.supplier_name }}</span>
            </div>
          </template>
        </Column>
        <Column field="status" header="Estado">
          <template #body="{ data }">
            <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" class="px-3 py-1 rounded-full uppercase text-[10px]" />
          </template>
        </Column>
        <Column field="total" header="Total">
          <template #body="{ data }">
            <span class="font-bold text-indigo-600">{{ formatCurrency(data.total) }}</span>
          </template>
        </Column>
        <Column field="created_at" header="Fecha">
          <template #body="{ data }">
            <div class="flex flex-col">
              <span class="text-sm text-slate-700">{{ new Date(data.created_at).toLocaleDateString() }}</span>
              <span class="text-[10px] text-slate-400">{{ new Date(data.created_at).toLocaleTimeString() }}</span>
            </div>
          </template>
        </Column>
        <Column header="Acciones" headerClass="text-center" bodyClass="text-center">
          <template #body="{ data }">
            <div class="flex justify-center gap-1">
              <Button 
                type="button"
                :icon="data.status === 'draft' ? 'pi pi-pencil' : 'pi pi-eye'" 
                :severity="data.status === 'draft' ? 'info' : 'secondary'" 
                text rounded 
                @click.stop="openPurchase(data)" 
                v-tooltip.top="data.status === 'draft' ? 'Editar' : 'Visualizar'"
              />
              <Button 
                type="button" 
                icon="pi pi-print" 
                severity="help" 
                text rounded 
                @click.stop="handlePrint(data)" 
                v-tooltip.top="'Imprimir'"
                v-if="false"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Drawer de Detalle/Edición -->
    <Drawer 
      v-model:visible="drawerVisible" 
      position="right" 
      class="modern-drawer !w-full lg:!w-[80vw] xl:!w-[1100px]" 
      :modal="true"
      :blockScroll="true"
    >
      <template #header>
        <div class="flex items-center gap-4">
          <div class="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200">
            <i class="pi pi-shopping-cart text-white text-2xl"></i>
          </div>
          <div>
            <h2 class="text-2xl font-black text-slate-800">
              {{ currentPurchase?.id ? 'Compra #' + (currentPurchase?.number || '...') : 'Nueva Compra' }}
            </h2>
            <div class="flex items-center gap-2 mt-1">
              <Tag :value="statusLabel(currentPurchase?.status)" :severity="statusSeverity(currentPurchase?.status)" class="px-2 py-0.5 rounded-md uppercase text-[10px]" />
              <span v-if="currentPurchase?.created_at" class="text-xs text-slate-400">
                {{ new Date(currentPurchase.created_at).toLocaleString() }}
              </span>
            </div>
          </div>
        </div>
      </template>

      <div class="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white">
        <div class="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 space-y-4 md:space-y-8 custom-scrollbar">
          <!-- Componente de Proveedor -->
          <PurchaseSupplierForm
            v-model="supplier"
            :readOnly="readOnly"
            @select="(s) => supplierId = s.id"
          />

          <!-- Componente de Tabla de Items -->
          <PurchaseItemsTable
            v-model:items="items"
            :readOnly="readOnly"
          />

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <!-- Notas -->
            <div class="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
               <div class="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
                 <i class="pi pi-align-left text-slate-500"></i>
                 <span class="font-bold text-slate-700">Observaciones</span>
               </div>
               <div class="p-4">
                 <Textarea 
                  v-model="notes" 
                  :disabled="readOnly" 
                  rows="4" 
                  class="w-full border-slate-200 focus:border-indigo-500 rounded-lg text-sm" 
                  placeholder="Escribe aquí cualquier nota relevante sobre esta compra..." 
                 />
               </div>
            </div>

            <!-- Totales -->
            <PurchaseTotals :totals="totals" />
          </div>
        </div>

        <!-- Footer del Drawer -->
        <div class="p-6 border-t border-slate-200 bg-white flex flex-wrap justify-center md:justify-end items-center gap-3">
          <template v-if="currentPurchase?.status === 'draft'">
            <Button 
              label="Guardar Borrador" 
              icon="pi pi-save" 
              class="bg-indigo-600 text-white hover:bg-indigo-700 border-0 shadow-md py-2 px-6 rounded-xl font-bold"
              :loading="isSaving" 
              @click.prevent="savePurchase" 
              :pt="{
                  label: { class: 'text-white' },
                  icon: { class: 'text-white' }
              }"
            />
            <Button 
              v-if="currentPurchase.id" 
              label="Finalizar Compra" 
              icon="pi pi-check-circle" 
              severity="success" 
              class="shadow-md py-2 px-6 rounded-xl font-bold"
              :loading="isSaving" 
              @click.prevent="confirmFinalize" 
            />
            <Button 
              v-if="currentPurchase.id" 
              icon="pi pi-trash" 
              severity="danger" 
              text 
              rounded
              class="hover:bg-red-50"
              @click.prevent="confirmDeletePurchase" 
              v-tooltip.top="'Eliminar borrador'"
            />
          </template>
          <template v-else>
            <Button 
              label="Convertir a Borrador (Editar)" 
              icon="pi pi-pencil" 
              severity="warning" 
              class="shadow-md py-2 px-6 rounded-xl font-bold"
              @click.prevent="revertToDraft" 
            />
            <Button 
              label="Cerrar" 
              icon="pi pi-times" 
              severity="secondary" 
              variant="outlined"
              class="py-2 px-6 rounded-xl font-bold"
              @click.prevent="drawerVisible = false" 
            />
          </template>
        </div>
      </div>
    </Drawer>

    <!-- Diálogo de confirmación global -->
    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { 
  listPurchases, 
  getPurchaseItems, 
  createDraftPurchase, 
  upsertPurchaseItems, 
  patchPurchase, 
  finalizePurchase,
  deletePurchase,
  revertPurchaseToDraft
} from '../services/compras'
import { formatCurrency, calculatePurchaseTotals } from '../utils/calculations'
import { handleError, showSuccess, showWarning } from '../utils/errorHandler'
import { useConfirm } from 'primevue/useconfirm'
import { useBusinessStore } from '../stores/businessStore'
import { printPurchase } from '../utils/printPurchase'

import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Drawer from 'primevue/drawer'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import ConfirmDialog from 'primevue/confirmdialog'
import Tooltip from 'primevue/tooltip'

// Nuevos componentes
import PurchaseSupplierForm from '../components/purchase/PurchaseSupplierForm.vue'
import PurchaseItemsTable from '../components/purchase/PurchaseItemsTable.vue'
import PurchaseTotals from '../components/purchase/PurchaseTotals.vue'

const queryClient = useQueryClient()
const confirm = useConfirm()
const vTooltip = Tooltip

// Estados de la lista
const statusFilter = ref('all')
const statusOptions = [
  { label: 'Todas las compras', value: 'all' },
  { label: 'Sólo Borradores', value: 'draft' },
  { label: 'Completadas', value: 'completed' }
]

// Fetch de compras
const { data: purchases = [], isLoading } = useQuery({
  queryKey: ['purchases'],
  queryFn: () => listPurchases({ limit: 100 })
})

const filteredPurchases = computed(() => {
  if (statusFilter.value === 'all') return purchases.value
  return purchases.value.filter(p => p.status === statusFilter.value)
})

const businessStore = useBusinessStore()
// Estados del detalle
const drawerVisible = ref(false)
const currentPurchase = ref(null)
const items = ref([])
const supplier = ref({ name: '', phone: '', email: '' })
const supplierId = ref(null)
const notes = ref('')
const isSaving = ref(false)

const readOnly = computed(() => currentPurchase.value?.status !== 'draft')
const totals = computed(() => calculatePurchaseTotals(items.value))

// Funciones
const statusLabel = (s) => ({
  draft: 'Borrador',
  completed: 'Completada',
  cancelled: 'Cancelada'
}[s] || s)

const statusSeverity = (s) => ({
  draft: 'warn',
  completed: 'success',
  cancelled: 'danger'
}[s] || 'info')

const createPurchase = () => {
  currentPurchase.value = { status: 'draft', number: null }
  items.value = []
  supplier.value = { name: '', phone: '', email: '' }
  supplierId.value = null
  notes.value = ''
  drawerVisible.value = true
}

const openPurchase = async (p) => {
  try {
    currentPurchase.value = p
    supplierId.value = p.supplier_id
    supplier.value = { 
      name: p.supplier_name || '', 
      phone: p.supplier_phone || '', 
      email: p.supplier_email || '' 
    }
    notes.value = p.notes || ''
    drawerVisible.value = true
    
    // Cargar items
    const its = await getPurchaseItems(p.id)
    items.value = its
  } catch (err) {
    handleError(err, 'No se pudo abrir la compra')
  }
}

const savePurchase = async () => {
  if (!supplier.value.name) {
    showWarning('Selecciona un proveedor')
    return false
  }
  
  try {
    isSaving.value = true
    let purchaseId = currentPurchase.value.id
    
    if (!purchaseId) {
      const created = await createDraftPurchase()
      purchaseId = created.id
      currentPurchase.value = created
    }
    
    await upsertPurchaseItems(items.value.map(i => ({ ...i, purchase_id: purchaseId })))
    
    const updated = await patchPurchase(purchaseId, {
      total: totals.value.total,
      supplier_id: supplierId.value,
      supplier_name: supplier.value.name,
      supplier_phone: supplier.value.phone,
      supplier_email: supplier.value.email,
      notes: notes.value
    })
    
    currentPurchase.value = updated
    showSuccess('Compra guardada correctamente')
    queryClient.invalidateQueries({ queryKey: ['purchases'] })
    return true
  } catch (err) {
    handleError(err)
    return false
  } finally {
    isSaving.value = false
  }
}

const confirmFinalize = () => {
  confirm.require({
    message: '¿Deseas completar la compra? Esto actualizará el stock de los productos.',
    header: 'Confirmar Abastecimiento',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, finalizar ingreso',
    rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        isSaving.value = true
        const saved = await savePurchase()
        if (!saved) return

        await finalizePurchase(currentPurchase.value.id, items.value)
        currentPurchase.value.status = 'completed'
        showSuccess('Abastecimiento completado exitosamente')
        queryClient.invalidateQueries({ queryKey: ['purchases'] })
      } catch (err) {
        handleError(err)
      } finally {
        isSaving.value = false
      }
    }
  })
}

const revertToDraft = () => {
  confirm.require({
    message: '¿Convertir a borrador para editar? Ten en cuenta que el stock regresará a su estado anterior si eliminas productos, pero no automáticamente hoy.',
    header: 'Confirmar Edición',
    icon: 'pi pi-info-circle',
    severity: 'warn',
    acceptLabel: 'Activar Edición',
    rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        const updated = await revertPurchaseToDraft(currentPurchase.value.id)
        currentPurchase.value = updated
        showSuccess('La compra ahora es un borrador y puede ser editada')
        queryClient.invalidateQueries({ queryKey: ['purchases'] })
      } catch (err) {
        handleError(err)
      }
    }
  })
}

const confirmDeletePurchase = async () => {
  confirm.require({
    message: '¿Eliminar este borrador de compra permanentemente?',
    header: 'Borrar Borrador',
    icon: 'pi pi-trash',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'No',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await deletePurchase(currentPurchase.value.id)
        showSuccess('Borrador eliminado')
        drawerVisible.value = false
        queryClient.invalidateQueries({ queryKey: ['purchases'] })
      } catch (err) {
        handleError(err)
      }
    }
  })
}

const handlePrint = async (p) => {
  try {
    const its = await getPurchaseItems(p.id)
    printPurchase({ purchase: p, items: its, business: businessStore.settings })
  } catch (err) {
    handleError(err)
  }
}

onMounted(() => {
  businessStore.fetchSettings()
})
</script>

<style scoped>
:deep(.p-drawer-content) {
  padding: 0 !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
}

.modern-table :deep(.p-datatable-thead > tr > th) {
  @apply bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider;
}

.modern-table :deep(.p-datatable-tbody > tr > td) {
  @apply py-4;
}
</style>

