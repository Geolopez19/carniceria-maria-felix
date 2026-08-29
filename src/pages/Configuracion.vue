<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Configuración del Negocio</h1>
        <p class="text-slate-500">Administra la información general de tu empresa</p>
      </div>
      <div class="flex gap-3">
        <Button 
          label="Guardar Cambios" 
          icon="pi pi-save" 
          :loading="store.isLoading"
          @click="saveChanges"
          class="p-button-primary"
        />
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Basic Info Card -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden relative">
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          <h2 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <i class="pi pi-building text-indigo-500"></i>
            Información General
          </h2>

          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-700">Nombre del Negocio</label>
                <InputText v-model="form.name" class="w-full" placeholder="Ej. Multiservicios Leiva" />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-700">RUC / ID Fiscal</label>
                <InputText v-model="form.ruc" class="w-full" placeholder="Ej. J0310000000000" />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700">Dirección</label>
              <InputText v-model="form.address" class="w-full" placeholder="Dirección completa del local" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-700">Teléfono</label>
                <InputText v-model="form.phone" class="w-full" placeholder="+505 0000-0000" />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-slate-700">Correo Electrónico</label>
                <InputText v-model="form.email" class="w-full" placeholder="contacto@tuempresa.com" />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700">Sitio Web</label>
              <div class="p-inputgroup flex-1">
                <span class="p-inputgroup-addon">https://</span>
                <InputText v-model="form.website" placeholder="tuempresa.com" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings Card -->
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden relative">
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <h2 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <i class="pi pi-cog text-purple-500"></i>
            Preferencias
          </h2>

          <div class="space-y-4">
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700">Moneda Principal</label>
              <InputText v-model="form.currency" class="w-full" placeholder="Ej. C$" />
              <p class="text-xs text-slate-500">Símbolo de moneda usado en reportes y facturas.</p>
            </div>
          </div>
        </div>

        <!-- Info/Help Card -->
         <div class="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
          <div class="flex items-start gap-3">
            <i class="pi pi-info-circle text-indigo-600 mt-1"></i>
            <div>
              <h3 class="font-semibold text-indigo-900 text-sm">Importante</h3>
              <p class="text-sm text-indigo-800 mt-1">
                Esta información aparecerá automáticamente en el encabezado de las facturas impresas, reportes y documentos generados por el sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useBusinessStore } from '../stores/businessStore'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Toast from 'primevue/toast'

const store = useBusinessStore()
const toast = useToast()

const form = ref({
  name: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  ruc: '',
  currency: ''
})

onMounted(async () => {
  await store.fetchSettings()
  // Copy store values to local form to avoid direct mutation/reactivity issues during edit
  Object.assign(form.value, store.settings)
})

const saveChanges = async () => {
  try {
    await store.saveSettings(form.value)
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Información de la empresa actualizada correctamente', life: 3000 })
  } catch (error) {
    console.error(error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron guardar los cambios. Verifica tu conexión.', life: 3000 })
  }
}
</script>
