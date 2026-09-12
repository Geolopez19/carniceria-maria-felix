<template>
  <div
    class="bg-white rounded-xl shadow-md border border-indigo-200 overflow-hidden"
  >
    <div
      class="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-3 sm:px-5 py-3 flex justify-between items-center border-b border-indigo-200"
    >
      <div class="flex items-center gap-2">
        <div class="bg-indigo-100 p-1.5 rounded-md">
          <i class="pi pi-user text-indigo-600 text-lg"></i>
        </div>
        <h3 class="text-lg font-bold text-slate-800">
          Información del Cliente
        </h3>
      </div>
      <Button
        type="button"
        v-if="!readOnly"
        label="Buscar Lista"
        icon="pi pi-search"
        size="small"
        @click.prevent="showCustomerModal = true"
        class="bg-indigo-600 !text-white hover:bg-indigo-700 border-0 shadow-sm text-sm"
        style="color: white !important"
      />
    </div>
    <div class="p-3 sm:p-4 bg-white">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <!-- Campo Nombre Completo con Autocompletado Integrado -->
        <div class="flex flex-col gap-1.5">
          <label
            class="text-xs font-bold text-indigo-600 flex items-center gap-1.5"
          >
            <i class="pi pi-user text-xs"></i>
            Nombre Completo (Buscar o Nuevo)
          </label>
          <AutoComplete
            v-model="customerNameInput"
            :suggestions="suggestions"
            optionLabel="name"
            :disabled="readOnly"
            placeholder="Escribe para buscar cliente existente..."
            class="w-full text-sm"
            inputClass="p-2 text-sm w-full font-medium"
            @complete="handleCustomerSearch"
            @option-select="handleOptionSelect"
            @input="handleNameInput"
            @clear="handleClear"
            fluid
          >
            <template #option="{ option }">
              <div class="flex flex-col py-1">
                <span class="font-bold text-slate-800 text-sm">{{ option.name }}</span>
                <div class="text-xs text-slate-500 flex flex-wrap gap-3 mt-0.5" v-if="option.phone || option.email">
                  <span v-if="option.phone"><i class="pi pi-phone text-[10px] text-indigo-500 mr-1"></i>{{ option.phone }}</span>
                  <span v-if="option.email"><i class="pi pi-envelope text-[10px] text-indigo-500 mr-1"></i>{{ option.email }}</span>
                </div>
              </div>
            </template>
          </AutoComplete>
        </div>
        <div class="flex flex-col gap-1.5">
          <label
            class="text-xs font-bold text-indigo-600 flex items-center gap-1.5"
          >
            <i class="pi pi-phone text-xs"></i>
            Teléfono
          </label>
          <InputText
            v-model="internalCustomer.phone"
            :disabled="readOnly"
            placeholder="Teléfono"
            class="p-2 text-sm w-full"
            @input="onFieldInput"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label
            class="text-xs font-bold text-indigo-600 flex items-center gap-1.5"
          >
            <i class="pi pi-envelope text-xs"></i>
            Correo Electrónico
          </label>
          <InputText
            v-model="internalCustomer.email"
            :disabled="readOnly"
            placeholder="Email"
            class="p-2 text-sm w-full"
            @input="onFieldInput"
          />
        </div>
      </div>
    </div>

    <!-- Modal de Búsqueda Avanzada -->
    <Dialog
      v-model:visible="showCustomerModal"
      modal
      class="w-full max-w-3xl modern-dialog"
      :dismissableMask="true"
      :pt="{
        header: { class: 'py-3 px-4' },
        content: { class: 'p-0' },
      }"
    >
      <template #header>
        <div class="flex items-center gap-3 flex-1 overflow-hidden pr-2">
            <div class="hidden sm:block bg-indigo-600 p-2 rounded-lg shadow-md shrink-0">
                <i class="pi pi-users text-white text-xl"></i>
            </div>
            <div class="flex flex-col min-w-0">
                <h3 class="text-base sm:text-lg font-bold text-slate-800 truncate">
                Clientes
                </h3>
                <p class="text-[11px] sm:text-sm text-slate-500 truncate">
                Toca para seleccionar
                </p>
            </div>
             <Button 
                label="Nuevo" 
                icon="pi pi-plus" 
                class="ml-auto shrink-0 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0"
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
              v-model="customerSearchText"
              placeholder="Buscar por nombre, teléfono o email..."
              class="w-full pl-10 py-3 text-lg bg-slate-50 border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-xl transition-all shadow-sm"
              @input="onCustomerSearch"
              autofocus
            />
          </IconField>
        </div>

        <div
          v-if="foundCustomers.length > 0"
          class="bg-white border-y border-slate-200 overflow-hidden"
        >
          <Listbox
            :options="foundCustomers"
            optionLabel="name"
            class="w-full max-h-[50vh] overflow-auto custom-scrollbar"
            @change="selectCustomer"
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
                  selected
                    ? 'bg-indigo-50 border-l-indigo-500'
                    : 'bg-white hover:bg-slate-50 border-l-transparent',
                ]"
              >
                <div class="flex items-center gap-3 sm:gap-4 w-full">
                  <div
                    class="bg-indigo-100 text-indigo-600 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-110 transition-transform shrink-0"
                  >
                    {{ option.name.charAt(0).toUpperCase() }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div
                      class="font-bold text-slate-800 text-base sm:text-lg group-hover:text-indigo-700 transition-colors truncate"
                    >
                      {{ option.name }}
                    </div>
                    <div
                      class="text-xs sm:text-sm text-slate-500 flex flex-wrap gap-x-3 sm:gap-x-6 gap-y-1 mt-1"
                    >
                      <span
                        v-if="option.phone"
                        class="flex items-center gap-1.5"
                        ><i class="pi pi-phone text-indigo-400 text-[10px] sm:text-xs"></i>
                        <span class="truncate">{{ option.phone }}</span></span
                      >
                      <span
                        v-if="option.email"
                        class="flex items-center gap-1.5"
                        ><i class="pi pi-envelope text-indigo-400 text-[10px] sm:text-xs"></i>
                        <span class="truncate">{{ option.email }}</span></span
                      >
                      <span v-if="option.ruc" class="flex items-center gap-1.5"
                        ><i class="pi pi-id-card text-indigo-400 text-[10px] sm:text-xs"></i>
                        <span class="truncate">{{ option.ruc }}</span></span
                      >
                    </div>
                  </div>
                  <i
                    class="pi pi-chevron-right text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0 hidden sm:block"
                  ></i>
                </div>
              </div>
            </template>
          </Listbox>
        </div>

        <!-- Empty States Elegantes -->
        <div
          v-else-if="customerSearchText.length >= 2"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <div class="bg-slate-100 p-4 rounded-full mb-3">
            <i class="pi pi-search-minus text-4xl text-slate-400"></i>
          </div>
          <p class="text-lg font-medium text-slate-600">
            No encontramos coincidencias
          </p>
          <p class="text-slate-400 mb-4">Intenta con otro nombre o crea uno nuevo</p>
           <Button 
                label="Crear Nuevo Cliente" 
                icon="pi pi-plus" 
                class="bg-indigo-600 border-indigo-600 !text-white" 
                style="color: white !important"
                @click="openCreateModal"
            />
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <div class="bg-indigo-50 p-4 rounded-full mb-3 animate-pulse">
            <i class="pi pi-search text-4xl text-indigo-300"></i>
          </div>
          <p class="text-lg font-medium text-slate-600">Empieza a escribir</p>
          <p class="text-slate-400">Busca tus clientes rápidamente</p>
        </div>
      </div>
    </Dialog>

    <!-- Modal de Creación Manual -->
    <Dialog 
        v-model:visible="showCreateModal" 
        modal 
        header="Nuevo Cliente" 
        class="w-full max-w-lg"
        :pt="{
            header: { class: 'bg-slate-50 border-b border-slate-200' }
        }"
    >
        <div class="flex flex-col gap-4 pt-4">
            <div class="flex flex-col gap-2">
                <label class="font-bold text-slate-700">Nombre Completo <span class="text-red-500">*</span></label>
                <InputText v-model="newCustomer.name" placeholder="Ej: Juan Pérez" autofocus />
            </div>
            <div class="flex flex-col gap-2">
                <label class="text-slate-700">Cédula / RUC</label>
                <InputText v-model="newCustomer.national_id" placeholder="Ej: 001-000000-0000A" />
            </div>
            <div class="flex flex-col gap-2">
                <label class="text-slate-700">Teléfono</label>
                <InputText v-model="newCustomer.phone" placeholder="Ej: 8888-8888" />
            </div>
             <div class="flex flex-col gap-2">
                <label class="text-slate-700">Email</label>
                <InputText v-model="newCustomer.email" placeholder="cliente@email.com" />
            </div>
            <div class="flex flex-col gap-2">
                <label class="text-slate-700">Dirección</label>
                <InputText v-model="newCustomer.address" placeholder="Ej: Managua, Nicaragua" />
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="showCreateModal = false" class="p-button-secondary" />
            <Button 
                label="Guardar Cliente" 
                icon="pi pi-check" 
                @click="handleCreateCustomer" 
                :loading="isCreating"
                class="bg-indigo-600 border-indigo-600 !text-white"
                style="color: white !important"
                :disabled="!newCustomer.name"
            />
        </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { searchCustomers, createCustomer } from "../../services/clientes";
import { showSuccess, handleError } from "../../utils/errorHandler";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Dialog from "primevue/dialog";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import Listbox from "primevue/listbox";
import AutoComplete from "primevue/autocomplete";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "select"]);

const internalCustomer = ref({ ...props.modelValue });
const customerNameInput = ref(props.modelValue?.name || "");
const suggestions = ref([]);

const showCustomerModal = ref(false);
const customerSearchText = ref("");
const foundCustomers = ref([]);

// State for manual creation
const showCreateModal = ref(false);
const newCustomer = ref({ name: '', phone: '', email: '', national_id: '', address: '' });
const isCreating = ref(false);

watch(
  () => props.modelValue,
  (newVal) => {
    internalCustomer.value = { ...newVal };
    if (typeof newVal?.name === 'string') {
      customerNameInput.value = newVal.name;
    }
  },
  { deep: true, immediate: true }
);

const handleCustomerSearch = async (event) => {
  const query = event.query;
  if (!query || query.trim().length < 1) {
    suggestions.value = [];
    return;
  }
  try {
    suggestions.value = await searchCustomers(query.trim());
  } catch (e) {
    console.error(e);
    suggestions.value = [];
  }
};

const handleOptionSelect = (event) => {
  const c = event.value;
  if (!c) return;
  internalCustomer.value = {
    name: c.name,
    phone: c.phone || "",
    email: c.email || "",
  };
  customerNameInput.value = c.name;
  emit("update:modelValue", internalCustomer.value);
  emit("select", c);
};

const handleNameInput = (event) => {
  const val = typeof event === 'string' ? event : (event?.target?.value ?? customerNameInput.value);
  const nameVal = typeof val === 'string' ? val : (val?.name || '');
  internalCustomer.value.name = nameVal;
  emit("update:modelValue", internalCustomer.value);
  emit("select", { id: null, ...internalCustomer.value });
};

const handleClear = () => {
  internalCustomer.value = { name: "", phone: "", email: "" };
  customerNameInput.value = "";
  emit("update:modelValue", internalCustomer.value);
  emit("select", { id: null, name: "", phone: "", email: "" });
};

const onFieldInput = () => {
  emit("update:modelValue", internalCustomer.value);
};

const onCustomerSearch = async () => {
  if (customerSearchText.value.length < 2) return;
  foundCustomers.value = await searchCustomers(customerSearchText.value);
};

const selectCustomer = (e) => {
  const c = e.value || e;
  if (!c) return;
  internalCustomer.value = {
    name: c.name,
    phone: c.phone || "",
    email: c.email || "",
  };
  customerNameInput.value = c.name;
  emit("update:modelValue", internalCustomer.value);
  emit("select", c);
  showCustomerModal.value = false;
  customerSearchText.value = "";
  foundCustomers.value = [];
};

const openCreateModal = () => {
    newCustomer.value = { name: '', phone: '', email: '', national_id: '', address: '' };
    if (customerSearchText.value) {
        newCustomer.value.name = customerSearchText.value;
    } else if (customerNameInput.value) {
        newCustomer.value.name = customerNameInput.value;
    }
    showCreateModal.value = true;
};

const handleCreateCustomer = async () => {
    if (!newCustomer.value.name) return;

    try {
        isCreating.value = true;
        const created = await createCustomer(newCustomer.value);
        showSuccess('Cliente creado exitosamente');

        selectCustomer(created);

        showCreateModal.value = false;
        showCustomerModal.value = false;
    } catch (err) {
        handleError(err);
    } finally {
        isCreating.value = false;
    }
};
</script>
