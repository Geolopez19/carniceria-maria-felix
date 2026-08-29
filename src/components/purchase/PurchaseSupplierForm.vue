<template>
  <div class="bg-white rounded-xl shadow-md border border-indigo-200 overflow-hidden">
    <div class="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 px-5 py-3 flex justify-between items-center border-b border-indigo-200">
      <div class="flex items-center gap-2">
        <div class="bg-indigo-100 p-1.5 rounded-md">
          <i class="pi pi-truck text-indigo-600 text-lg"></i>
        </div>
        <h3 class="text-lg font-bold text-slate-800">Información del Proveedor</h3>
      </div>
      <Button
        type="button"
        v-if="!readOnly"
        label="Buscar"
        icon="pi pi-search"
        size="small"
        @click.prevent="showSupplierModal = true"
        class="bg-indigo-600 text-white hover:bg-indigo-700 border-0 shadow-sm text-sm"
        :pt="{
            label: { class: 'text-white' },
            icon: { class: 'text-white' }
        }"
      />
    </div>
    <div class="p-4 bg-white">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-indigo-600 flex items-center gap-1.5 uppercase tracking-wider">
            <i class="pi pi-briefcase text-xs"></i>
            Nombre / Empresa
          </label>
          <InputText
            v-model="internalSupplier.name"
            :disabled="readOnly"
            placeholder="Nombre del proveedor"
            class="p-2 text-sm w-full border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
            @input="emit('update:modelValue', internalSupplier)"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-indigo-600 flex items-center gap-1.5 uppercase tracking-wider">
            <i class="pi pi-phone text-xs"></i>
            Teléfono
          </label>
          <InputText
            v-model="internalSupplier.phone"
            :disabled="readOnly"
            placeholder="Teléfono"
            class="p-2 text-sm w-full border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
            @input="emit('update:modelValue', internalSupplier)"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-indigo-600 flex items-center gap-1.5 uppercase tracking-wider">
            <i class="pi pi-envelope text-xs"></i>
            Correo Electrónico
          </label>
          <InputText
            v-model="internalSupplier.email"
            :disabled="readOnly"
            placeholder="Email"
            class="p-2 text-sm w-full border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
            @input="emit('update:modelValue', internalSupplier)"
          />
        </div>
      </div>
    </div>

    <!-- Modal de Búsqueda -->
    <Dialog
      v-model:visible="showSupplierModal"
      modal
      class="w-full max-w-3xl modern-dialog"
      :dismissableMask="true"
      :pt="{
        header: { class: 'py-4 px-5 bg-gradient-to-r from-indigo-600 to-blue-600 border-b border-indigo-500' },
        content: { class: 'p-0' },
      }"
    >
      <template #header>
        <div class="flex items-center gap-3 flex-1 overflow-hidden pr-2">
            <div class="hidden sm:block bg-white/20 p-2 rounded-lg backdrop-blur-sm border border-white/20 shrink-0">
                <i class="pi pi-truck text-white text-xl"></i>
            </div>
            <div class="flex flex-col min-w-0">
                <h3 class="text-base sm:text-xl font-bold text-white truncate">Proveedores</h3>
                <p class="text-[11px] sm:text-sm text-indigo-100 truncate">Busca por nombre o RUC</p>
            </div>
            <Button 
                label="Nuevo" 
                icon="pi pi-plus" 
                class="ml-auto shrink-0 bg-white text-indigo-600 border-white hover:bg-slate-100 font-bold"
                size="small"
                @click="openCreateModal"
            />
        </div>
      </template>

      <div class="space-y-4 pt-4">
        <div class="px-4">
          <IconField iconPosition="left" class="w-full">
            <InputIcon class="pi pi-search text-indigo-500 z-10" />
            <InputText
              v-model="supplierSearchText"
              placeholder="Buscar proveedor... (ej: Distribuidora, 8888-8888)"
              class="w-full pl-10 py-3 text-lg bg-indigo-50/50 border-0 ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-500 rounded-xl transition-all shadow-sm"
              @input="onSupplierSearch"
              autofocus
            />
          </IconField>
        </div>

        <div v-if="foundSuppliers.length > 0" class="bg-white border-y border-slate-200 overflow-hidden">
          <Listbox
            :options="foundSuppliers"
            optionLabel="name"
            class="w-full max-h-[50vh] overflow-auto custom-scrollbar"
            @change="selectSupplier"
            listStyle="padding: 0"
            :pt="{
              item: { class: 'p-0 border-0 focus:bg-transparent w-full' },
              list: { class: 'p-0 w-full' },
            }"
          >
            <template #option="{ option, selected }">
              <div
                class="w-full p-4 sm:p-5 px-4 sm:px-6 transition-all duration-200 cursor-pointer border-b border-slate-100 last:border-0 group border-l-4"
                :class="[
                  selected ? 'bg-indigo-50 border-l-indigo-500' : 'bg-white hover:bg-slate-50 border-l-transparent',
                ]"
              >
                <div class="flex items-center gap-3 sm:gap-4 w-full">
                  <div class="bg-indigo-100 text-indigo-600 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-110 transition-transform shrink-0">
                    {{ option.name.charAt(0).toUpperCase() }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-bold text-slate-800 text-base sm:text-lg group-hover:text-indigo-700 transition-colors truncate">
                      {{ option.name }}
                    </div>
                    <div class="text-xs sm:text-sm text-slate-500 flex flex-wrap gap-x-3 sm:gap-x-6 gap-y-1 mt-1">
                      <span v-if="option.phone" class="flex items-center gap-1"
                        ><i class="pi pi-phone text-indigo-400 text-[10px] sm:text-xs"></i> <span class="truncate">{{ option.phone }}</span></span
                      >
                      <span v-if="option.email" class="flex items-center gap-1"
                        ><i class="pi pi-envelope text-indigo-400 text-[10px] sm:text-xs"></i> <span class="truncate">{{ option.email }}</span></span
                      >
                      <span v-if="option.ruc" class="flex items-center gap-1"
                        ><i class="pi pi-id-card text-indigo-400 text-[10px] sm:text-xs"></i> <span class="truncate">{{ option.ruc }}</span></span
                      >
                    </div>
                  </div>
                  <i class="pi pi-chevron-right text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0 hidden sm:block"></i>
                </div>
              </div>
            </template>
          </Listbox>
        </div>

        <div v-else-if="supplierSearchText.length >= 2" class="flex flex-col items-center justify-center py-12 text-center">
            <div class="bg-slate-100 p-4 rounded-full mb-3">
                <i class="pi pi-search-minus text-4xl text-slate-400"></i>
            </div>
            <p class="text-lg font-medium text-slate-600">No encontramos coincidencias</p>
            <p class="text-slate-400 mb-4">Intenta con otro nombre o crea uno nuevo</p>
            <Button 
                label="Crear Nuevo Proveedor" 
                icon="pi pi-plus" 
                class="bg-indigo-600 border-indigo-600" 
                @click="openCreateModal"
            />
        </div>

        <div v-else class="flex flex-col items-center justify-center py-12 text-center">
          <div class="bg-indigo-50 p-4 rounded-full mb-3 animate-pulse">
            <i class="pi pi-search text-4xl text-indigo-300"></i>
          </div>
          <p class="text-lg font-medium text-slate-600">Empieza a escribir</p>
          <p class="text-slate-400">Busca tus proveedores rápidamente</p>
        </div>
      </div>
    </Dialog>

    <!-- Modal de Creación -->
    <Dialog 
        v-model:visible="showCreateModal" 
        modal 
        header="Nuevo Proveedor" 
        class="w-full max-w-lg"
        :pt="{
            header: { class: 'bg-slate-50 border-b border-slate-200' }
        }"
    >
        <div class="flex flex-col gap-4 pt-4">
            <div class="flex flex-col gap-2">
                <label class="font-bold text-slate-700">Nombre / Razón Social <span class="text-red-500">*</span></label>
                <InputText v-model="newSupplier.name" placeholder="Ej: Distribuidora ABC" autofocus />
            </div>
            <div class="flex flex-col gap-2">
                <label class="text-slate-700">Teléfono</label>
                <InputText v-model="newSupplier.phone" placeholder="Ej: 8888-8888" />
            </div>
             <div class="flex flex-col gap-2">
                <label class="text-slate-700">Email</label>
                <InputText v-model="newSupplier.email" placeholder="contacto@empresa.com" />
            </div>
             <div class="flex flex-col gap-2">
                <label class="text-slate-700">RUC / Identificación</label>
                <InputText v-model="newSupplier.ruc" placeholder="Ej: 123456789" />
            </div>
            <div class="flex flex-col gap-2">
                <label class="text-slate-700">Dirección</label>
                <InputText v-model="newSupplier.address" placeholder="Ej: Managua, Nicaragua" />
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="showCreateModal = false" class="p-button-secondary" />
            <Button 
                label="Guardar Proveedor" 
                icon="pi pi-check" 
                @click="handleCreateSupplier" 
                :loading="isCreating"
                class="bg-indigo-600 border-indigo-600"
                :disabled="!newSupplier.name"
            />
        </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { searchSuppliers, createSupplier } from '../../services/proveedores'
import { showSuccess, handleError } from '../../utils/errorHandler'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Listbox from 'primevue/listbox'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'select'])

const internalSupplier = ref({ ...props.modelValue })
const showSupplierModal = ref(false)
const supplierSearchText = ref('')
const foundSuppliers = ref([])

// Nuevo estado para creación
const showCreateModal = ref(false)
const newSupplier = ref({ name: '', phone: '', email: '', ruc: '', address: '' })
const isCreating = ref(false)

watch(
  () => props.modelValue,
  (newVal) => {
    internalSupplier.value = { ...newVal }
  },
  { deep: true }
)

const onSupplierSearch = async () => {
  if (supplierSearchText.value.length < 2) return
  foundSuppliers.value = await searchSuppliers(supplierSearchText.value)
}

const selectSupplier = (e) => {
  const s = e.value || e 
  if (!s) return
  internalSupplier.value = {
    name: s.name,
    phone: s.phone || '',
    email: s.email || '',
  }
  emit('update:modelValue', internalSupplier.value)
  emit('select', s)
  showSupplierModal.value = false
  supplierSearchText.value = ''
  foundSuppliers.value = []
}

const openCreateModal = () => {
  newSupplier.value = { name: '', phone: '', email: '', ruc: '', address: '' }
  // Pre-fill name if user typed something in search
  if (supplierSearchText.value) {
    newSupplier.value.name = supplierSearchText.value
  }
  showCreateModal.value = true
}

const handleCreateSupplier = async () => {
  if (!newSupplier.value.name) return
  
  try {
    isCreating.value = true
    const created = await createSupplier(newSupplier.value)
    showSuccess('Proveedor creado exitosamente')
    
    // Auto-select
    selectSupplier(created)
    
    // Close modals
    showCreateModal.value = false
    showSupplierModal.value = false
  } catch (err) {
    handleError(err)
  } finally {
    isCreating.value = false
  }
}
</script>
