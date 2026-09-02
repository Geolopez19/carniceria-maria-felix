<template>
  <Dialog
    v-model:visible="visible"
    modal
    class="w-full max-w-3xl modern-dialog"
    :dismissableMask="true"
    :pt="{
      header: { class: isPurple ? 'py-3 px-4' : 'py-3 px-4' },
      content: { class: 'p-0' },
    }"
  >
    <template #header>
      <div class="flex items-center gap-3 flex-1 overflow-hidden pr-2">
        <div :class="[isPurple ? 'bg-purple-600' : 'bg-indigo-600', 'hidden sm:block p-2 rounded-lg shadow-md shrink-0']">
          <i class="pi pi-box text-white text-xl"></i>
        </div>
        <div class="flex flex-col min-w-0">
          <h3 class="text-base sm:text-xl font-bold text-slate-800 truncate">
            Catálogo
          </h3>
          <p class="text-[11px] sm:text-sm text-slate-500 truncate">
            Toca para seleccionar
          </p>
        </div>
        <Button
          label="Nuevo"
          icon="pi pi-plus"
          size="small"
          class="ml-auto shrink-0"
          :class="isPurple ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-0' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0'"
          @click="openCreateModal"
        />
      </div>
    </template>

    <div class="space-y-4 pt-4">
      <div class="px-4">
        <IconField iconPosition="left" class="w-full">
          <InputIcon :class="[isPurple ? 'text-purple-500' : 'text-indigo-500', 'pi pi-search z-10']" />
          <InputText
            v-model="searchText"
            placeholder="Buscar productos por nombre, código..."
            class="w-full pl-10 py-3 text-lg bg-slate-50 border-0 ring-1 ring-slate-200 focus:ring-2 rounded-xl transition-all shadow-sm"
            :class="isPurple ? 'focus:ring-purple-500' : 'focus:ring-indigo-500'"
            @input="onSearch"
            autofocus
          />
        </IconField>
      </div>

      <div
        v-if="foundProducts.length > 0"
        class="bg-white border-y border-slate-200 overflow-hidden"
      >
        <div class="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">{{ foundProducts.length }} productos encontrados</span>
        </div>
        <Listbox
          :options="foundProducts"
          optionLabel="nombre"
          class="w-full max-h-[50vh] overflow-auto custom-scrollbar"
          @change="selectProduct"
          listStyle="padding: 0"
          :pt="{
            item: { class: 'p-0 border-0 focus:bg-transparent w-full' },
            list: { class: 'p-0 w-full' },
          }"
        >
          <template #option="{ option, selected }">
            <div
              class="w-full p-3 px-4 transition-all duration-200 cursor-pointer border-b border-slate-100 last:border-0 group relative border-l-4"
              :class="[
                selected
                  ? (isPurple ? 'bg-purple-50 border-l-purple-500' : 'bg-indigo-50 border-l-indigo-500')
                  : 'bg-white hover:bg-slate-50 border-l-transparent',
              ]"
            >
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 w-full">
                <!-- Info Column -->
                <div class="flex-1 w-full min-w-0">
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      class="font-bold text-slate-900 text-sm sm:text-base transition-colors truncate"
                      :class="isPurple ? 'group-hover:text-purple-700' : 'group-hover:text-indigo-700'"
                      >{{ option.nombre }}</span
                    >
                    <span
                      v-if="option.codigo"
                      class="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-mono border border-slate-200 shrink-0"
                    >
                      {{ option.codigo }}
                    </span>
                  </div>
                  <p
                    v-if="option.descripcion"
                    class="text-[11px] sm:text-xs text-slate-500 line-clamp-1"
                  >
                    {{ option.descripcion }}
                  </p>
                </div>

                <!-- Actions/Price Column -->
                <div class="flex items-center justify-between w-full sm:w-auto mt-1 sm:mt-0">
                  <div class="flex sm:flex-col items-center sm:items-end w-full sm:w-auto gap-3 sm:gap-1">
                    <span
                      class="text-base sm:text-lg font-bold bg-opacity-10 px-2 py-0.5 rounded-lg border border-opacity-20 flex-1 sm:flex-none"
                      :class="isPurple ? 'text-purple-600 bg-purple-50 border-purple-100' : 'text-indigo-600 bg-indigo-50 border-indigo-100'"
                    >
                      {{ formatCurrency(option.precio) }} / {{ option.unidad_medida || 'lb' }}
                    </span>

                    <div
                      :class="[
                        'flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border shrink-0',
                        option.stock > 0
                          ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                          : 'text-rose-600 bg-rose-50 border-rose-100',
                      ]"
                    >
                      <i
                        class="pi text-[10px]"
                        :class="
                          option.stock > 0
                            ? 'pi-check-circle'
                            : 'pi-times-circle'
                        "
                      ></i>
                      <span>Stock: {{ option.stock }} {{ option.unidad_medida || 'lbs' }}</span>
                    </div>
                  </div>

                  <!-- Add Indicator -->
                  <div
                    class="hidden sm:flex w-8 h-8 rounded-full text-white items-center justify-center shadow-md opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 ml-4 shrink-0"
                    :class="isPurple ? 'bg-purple-600' : 'bg-indigo-600'"
                  >
                    <i class="pi pi-plus text-sm"></i>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Listbox>
      </div>

      <!-- Empty States -->
      <div
        v-else-if="searchText.length >= 2"
        class="flex flex-col items-center justify-center py-12 text-center"
      >
        <div class="bg-slate-100 p-4 rounded-full mb-3">
          <i class="pi pi-box text-4xl text-slate-400"></i>
        </div>
        <p class="text-lg font-medium text-slate-600">
          No encontramos productos
        </p>
        <p class="text-slate-400 mb-4">Intenta con otros términos de búsqueda</p>
        <Button 
          label="Crear nuevo producto" 
          icon="pi pi-plus" 
          :link="true"
          @click="openCreateModal"
        />
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center py-12 text-center"
      >
        <div class="p-4 rounded-full mb-3 animate-pulse" :class="isPurple ? 'bg-purple-50' : 'bg-indigo-50'">
          <i class="pi pi-search text-4xl" :class="isPurple ? 'text-purple-300' : 'text-indigo-300'"></i>
        </div>
        <p class="text-lg font-medium text-slate-600">
          Busca en el inventario
        </p>
        <p class="text-slate-400">Escribe nombre o código del producto</p>
      </div>
    </div>

    <!-- Create Product Dialog -->
    <ProductFormDialog
      v-model:visible="showCreateModal"
      mode="crear"
      :initial-data="initialCreateData"
      @saved="onProductCreated"
    />
  </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getProductos } from '../../services/productos'
import { formatCurrency } from '../../utils/calculations'

import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Listbox from 'primevue/listbox'
import Button from 'primevue/button'
import ProductFormDialog from '../inventory/ProductFormDialog.vue'

const props = defineProps({
  theme: {
    type: String,
    default: 'indigo', // 'indigo' or 'purple'
    validator: (value) => ['indigo', 'purple'].includes(value)
  }
})

const visible = defineModel('visible')
const emit = defineEmits(['select'])

const searchText = ref('')

const foundProducts = ref([])
const showCreateModal = ref(false)
const initialCreateData = ref({})

const isPurple = computed(() => props.theme === 'purple')

const onSearch = async () => {
  if (searchText.value.length < 2) return
  const res = await getProductos({ search: searchText.value })
  foundProducts.value = res.data
}

const selectProduct = (e) => {
  const p = e.value || e // Handle both event from listbox (e.value) and direct call (e)
  if (!p) return
  
  emit('select', p)
  searchText.value = ''
  foundProducts.value = []
  visible.value = false
}

const openCreateModal = () => {
    const text = searchText.value ? searchText.value.trim() : ''
    const isDigits = /^\d+$/.test(text) && text.length >= 4

    initialCreateData.value = {
        codigo: isDigits ? text : '',
        nombre: isDigits ? '' : text,
        categoria: '',
        stock: 0,
        precio: 0,
        descripcion: ''
    }
    showCreateModal.value = true
}

const onProductCreated = (newProduct) => {
    // Select the newly created product
    selectProduct(newProduct)
    showCreateModal.value = false
}
</script>
