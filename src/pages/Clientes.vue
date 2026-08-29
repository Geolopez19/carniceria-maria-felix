<template>
  <div class="p-2 sm:p-4 md:p-6">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-800 flex items-center gap-3">
        <Users class="w-8 h-8 text-indigo-600" />
        Gestión de Clientes
      </h1>
      <Button 
        label="Nuevo Cliente" 
        icon="pi pi-user-plus" 
        @click="openModal('crear')" 
        class="bg-indigo-600 border-indigo-600 hover:bg-indigo-700 font-bold"
      />
    </div>

    <!-- Search & Filter Area -->
    <div class="mb-6">
      <IconField iconPosition="left" class="w-full md:w-96">
        <InputIcon class="pi pi-search text-slate-400" />
        <InputText 
          v-model="filters['global'].value" 
          placeholder="Buscar por nombre, teléfono, email..." 
          class="w-full rounded-xl border-slate-200"
        />
      </IconField>
    </div>

    <!-- Main Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <DataTable 
        :value="customers" 
        :loading="isLoading" 
        :filters="filters"
        paginator 
        :rows="10"
        :rowsPerPageOptions="[10, 20, 50]"
        stripedRows 
        scrollable 
        class="modern-table"
        :pt="{
          headerRow: { class: 'bg-slate-50 text-slate-700 text-sm' },
          bodyRow: { class: 'hover:bg-slate-50 transition-colors' }
        }"
      >
        <template #empty>
          <div class="p-8 text-center text-slate-500">
            No hay clientes registrados o no coinciden con la búsqueda.
          </div>
        </template>

        <Column field="name" header="Cliente" sortable>
            <template #body="{ data }">
                <div class="font-bold text-slate-800">{{ data.name }}</div>
                <div class="text-xs text-slate-400" v-if="data.national_id">{{ data.national_id }}</div>
            </template>
        </Column>

        <Column field="phone" header="Contacto">
          <template #body="{ data }">
            <div class="flex flex-col gap-1">
              <span v-if="data.phone" class="flex items-center gap-2 text-sm text-slate-600">
                <i class="pi pi-phone text-indigo-400 text-xs"></i> {{ data.phone }}
              </span>
              <span v-if="data.email" class="flex items-center gap-2 text-sm text-slate-600">
                <i class="pi pi-envelope text-indigo-400 text-xs"></i> {{ data.email }}
              </span>
            </div>
          </template>
        </Column>
        
        <Column field="address" header="Dirección">
             <template #body="{ data }">
               <span class="text-sm text-slate-600 truncate max-w-[200px] block" :title="data.address">{{ data.address || '—' }}</span>
             </template>
        </Column>

        <Column field="created_at" header="Registrado" sortable>
          <template #body="{ data }">{{ new Date(data.created_at).toLocaleDateString() }}</template>
        </Column>

        <Column header="Acciones" alignFrozen="right" frozen>
          <template #body="{ data }">
            <div class="flex gap-2 justify-end">
              <Button 
                icon="pi pi-pencil" 
                text 
                rounded 
                severity="info" 
                @click="openModal('editar', data)" 
                v-tooltip.top="'Editar'"
              />
              <Button 
                icon="pi pi-trash" 
                text 
                rounded 
                severity="danger" 
                @click="confirmDelete(data)"
                v-tooltip.top="'Eliminar'" 
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Client Modal -->
    <ClientModal 
      v-model:visible="modal.visible" 
      :customer="modal.customer" 
      @saved="loadCustomers"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { FilterMatchMode } from '@primevue/core/api'
import { listCustomers, deleteCustomer } from '../services/clientes'
import { handleError, showSuccess } from '../utils/errorHandler'
import { Users } from 'lucide-vue-next'

import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import ClientModal from '../components/clients/ClientModal.vue'

// Import Tooltip directive if not globally registered, though typically it is in main.js
// If needed locally: import Tooltip from 'primevue/tooltip'; 

const customers = ref([])
const isLoading = ref(false)
const modal = ref({ visible: false, customer: null })

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

const loadCustomers = async () => {
  try {
    isLoading.value = true
    customers.value = await listCustomers()
  } catch (err) {
    handleError(err)
  } finally {
    isLoading.value = false
  }
}

const openModal = (mode, customer = null) => {
  modal.value = { 
    visible: true, 
    customer: mode === 'editar' ? { ...customer } : null 
  }
}

const confirmDelete = async (customer) => {
  if (!confirm(`¿Estás seguro de eliminar a ${customer.name}? Esta acción no se puede deshacer.`)) return
  
  try {
    await deleteCustomer(customer.id)
    showSuccess('Cliente eliminado correctamente')
    await loadCustomers()
  } catch (err) {
    handleError(err)
  }
}

onMounted(() => {
  loadCustomers()
})
</script>

<style scoped>
.modern-table :deep(.p-datatable-thead > tr > th) {
    background: #f8fafc;
    color: #475569;
    font-weight: 600;
    border-bottom: 1px solid #e2e8f0;
    padding: 1rem;
}

.modern-table :deep(.p-datatable-tbody > tr > td) {
    padding: 1rem;
    border-bottom: 1px solid #f1f5f9;
}
</style>

