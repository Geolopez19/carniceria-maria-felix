<template>
  <Dialog 
    v-model:visible="visible" 
    :header="mode === 'crear' ? 'Nuevo Producto' : 'Editar Producto'" 
    modal 
    class="w-full max-w-[90vw] md:max-w-md"
  >
    <div class="flex flex-col gap-4 py-2">
      <div class="flex flex-col gap-2">
        <label for="codigo" class="font-semibold">Código</label>
        <InputText id="codigo" v-model="form.codigo" placeholder="Código del producto" />
      </div>
      <div class="flex flex-col gap-2">
        <label for="nombre" class="font-semibold">Nombre</label>
        <InputText id="nombre" v-model="form.nombre" placeholder="Nombre del producto" />
      </div>
      <div class="flex flex-col gap-2">
        <label for="categoria" class="font-semibold">Categoría</label>
        <Select 
          id="categoria" 
          v-model="form.categoria" 
          :options="categories" 
          editable 
          placeholder="Selecciona o escribe una categoría" 
          class="w-full"
        />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label for="stock" class="font-semibold">Stock</label>
          <InputNumber id="stock" v-model="form.stock" fluid />
        </div>
        <div class="flex flex-col gap-2">
          <label for="precio" class="font-semibold">Precio</label>
          <InputNumber id="precio" v-model="form.precio" mode="currency" currency="NIO" locale="es-NI" fluid />
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <label for="descripcion" class="font-semibold">Descripción</label>
        <Textarea id="descripcion" v-model="form.descripcion" rows="3" autoResize />
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancelar" text severity="secondary" @click="visible = false" />
        <Button label="Guardar" @click="save" :loading="loading" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { addProducto, updateProducto } from '../../services/productos'
import { handleError, showSuccess } from '../../utils/errorHandler'

import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Button from 'primevue/button'

const props = defineProps({
  mode: {
    type: String,
    default: 'crear', // 'crear' | 'editar'
  },
  initialData: {
    type: Object,
    default: () => ({}),
  },
  categories: {
    type: Array,
    default: () => [],
  }
})

const emit = defineEmits(['update:visible', 'saved'])

const visible = defineModel('visible')
const loading = ref(false)
const form = ref({
  codigo: '',
  nombre: '',
  categoria: '',
  stock: 0,
  precio: 0,
  descripcion: ''
})

watch(() => props.initialData, (val) => {
  if (val && props.mode === 'editar') {
    form.value = { ...val }
  } else {
    resetForm()
  }
}, { immediate: true })

// Reset form when opening in 'crear' mode if needed, 
// though usually the parent handles passing empty initialData or we watch visible.
watch(visible, (isShown) => {
  if (isShown && props.mode === 'crear') {
    resetForm()
  }
})

function resetForm() {
  form.value = { 
    codigo: '',
    nombre: '', 
    categoria: '', 
    stock: 0, 
    precio: 0, 
    descripcion: '' 
  }
}

async function save() {
  if (!form.value.nombre) return // Simple validation

  try {
    loading.value = true
    let result
    
    if (props.mode === 'crear') {
      result = await addProducto(form.value)
      showSuccess('Producto creado correctamente')
    } else {
      result = await updateProducto(form.value.id, form.value)
      showSuccess('Producto actualizado correctamente')
    }
    
    emit('saved', result)
    visible.value = false
  } catch (err) {
    handleError(err)
  } finally {
    loading.value = false
  }
}
</script>
