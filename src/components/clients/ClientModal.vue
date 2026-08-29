<template>
  <Dialog
    :visible="visible"
    :header="isEditing ? 'Editar Cliente' : 'Nuevo Cliente'"
    modal
    class="w-full max-w-lg"
    :style="{ width: '90vw', maxWidth: '500px' }"
    :pt="{
        header: { class: 'bg-slate-50 border-b border-slate-200' },
        content: { class: 'p-0' }
    }"
    @update:visible="val => $emit('update:visible', val)"
  >
    <div class="flex flex-col gap-4 p-6">
      <div class="flex flex-col gap-2">
        <label class="font-bold text-slate-700">Nombre Completo <span class="text-red-500">*</span></label>
        <InputText v-model="formData.name" placeholder="Ej: Juan Pérez" autofocus class="w-full" :class="{ 'p-invalid': errors.name }" />
        <small v-if="errors.name" class="text-red-500">{{ errors.name }}</small>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-slate-700 font-medium">Cédula / RUC</label>
        <InputText v-model="formData.national_id" placeholder="Ej: 001-000000-0000A" class="w-full" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label class="text-slate-700 font-medium">Teléfono</label>
          <InputText v-model="formData.phone" placeholder="Ej: 8888-8888" class="w-full" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-slate-700 font-medium">Email</label>
          <InputText v-model="formData.email" placeholder="cliente@email.com" class="w-full" />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-slate-700 font-medium">Dirección</label>
        <Textarea v-model="formData.address" rows="3" placeholder="Dirección completa..." class="w-full resize-none" />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2 p-4 border-t border-slate-100 bg-slate-50">
        <Button label="Cancelar" icon="pi pi-times" text severity="secondary" @click="close" />
        <Button 
          :label="isEditing ? 'Actualizar' : 'Guardar'" 
          icon="pi pi-check" 
          @click="handleSubmit" 
          :loading="loading"
          class="bg-indigo-600 border-indigo-600 hover:bg-indigo-700"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { createCustomer, updateCustomer } from '../../services/clientes'
import { showSuccess, handleError } from '../../utils/errorHandler'

import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'

const props = defineProps({
  visible: Boolean,
  customer: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'saved'])

const formData = ref({
  name: '',
  national_id: '',
  phone: '',
  email: '',
  address: ''
})

const loading = ref(false)
const isEditing = ref(false)
const errors = ref({})

watch(() => props.visible, (newVal) => {
  if (newVal) {
    if (props.customer) {
      isEditing.value = true
      formData.value = { ...props.customer }
    } else {
      isEditing.value = false
      resetForm()
    }
    errors.value = {}
  }
})

const resetForm = () => {
  formData.value = {
    name: '',
    national_id: '',
    phone: '',
    email: '',
    address: ''
  }
}

const validate = () => {
  errors.value = {}
  if (!formData.value.name?.trim()) {
    errors.value.name = 'El nombre es obligatorio'
    return false
  }
  return true
}

const close = () => {
  emit('update:visible', false)
}

const handleSubmit = async () => {
  if (!validate()) return

  loading.value = true
  try {
    if (isEditing.value) {
      await updateCustomer(props.customer.id, formData.value)
      showSuccess('Cliente actualizado correctamente')
    } else {
      await createCustomer(formData.value)
      showSuccess('Cliente creado correctamente')
    }
    emit('saved')
    close()
  } catch (err) {
    handleError(err)
  } finally {
    loading.value = false
  }
}
</script>
