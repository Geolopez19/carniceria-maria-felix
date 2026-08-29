<template>
  <div class="p-2 sm:p-4 md:p-6">

    <div v-if="checkingAuth" class="flex items-center justify-center h-[60vh]">
      <div class="flex flex-col items-center gap-4">
        <i class="pi pi-spin pi-spinner text-4xl text-indigo-600"></i>
      </div>
    </div>

    <div v-else-if="!isAdmin" class="flex items-center justify-center h-[60vh]">
      <div class="text-center p-8 bg-white rounded-2xl shadow-sm border border-red-100 max-w-md">
        <div class="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock class="w-8 h-8 text-red-500" />
        </div>
        <h2 class="text-2xl font-bold text-slate-800 mb-2">Acceso Restringido</h2>
        <p class="text-slate-500 mb-6">Solo los administradores pueden gestionar usuarios del sistema.</p>
        <Button label="Ir al Inventario" @click="$router.push('/inventario')" />
      </div>
    </div>

    <template v-else>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Users class="w-8 h-8" />
          Gestión de Usuarios
        </h1>
        <Button label="Nuevo Usuario" icon="pi pi-user-plus" @click="openModal('crear')" />
      </div>

      <!-- Filtros -->
      <div class="mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-4">
        <Select v-model="rolFilter" :options="rolOptions" optionLabel="label" optionValue="value" class="w-48" />
      </div>

      <!-- Tabla -->
      <DataTable 
        :value="filteredUsers" 
        :loading="isLoading" 
        stripedRows 
        scrollable 
        class="shadow-md rounded-lg overflow-hidden border border-gray-200"
      >
        <Column field="nombre" header="Nombre" sortable></Column>
        <Column field="email" header="Email" sortable></Column>
        <Column field="rol" header="Rol" sortable>
          <template #body="{ data }">
            <Tag 
              :value="data.rol === 'admin' ? 'Administrador' : 'Colaborador'" 
              :severity="data.rol === 'admin' ? 'info' : 'success'" 
              :icon="data.rol === 'admin' ? 'pi pi-star-fill' : 'pi pi-user'"
            />
          </template>
        </Column>
        <Column field="activo" header="Estado">
          <template #body="{ data }">
            <Tag 
              :value="data.activo ? 'Activo' : 'Inactivo'" 
              :severity="data.activo ? 'success' : 'danger'" 
            />
          </template>
        </Column>
        <Column field="created_at" header="Registro">
          <template #body="{ data }">{{ new Date(data.created_at).toLocaleDateString() }}</template>
        </Column>
        <Column header="Acciones">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button icon="pi pi-pencil" severity="info" text rounded @click="openModal('editar', data)" />
              <Button 
                :icon="data.activo ? 'pi pi-user-minus' : 'pi pi-user-plus'" 
                :severity="data.activo ? 'warn' : 'success'" 
                text rounded 
                @click="toggleStatus(data)" 
                :title="data.activo ? 'Desactivar' : 'Activar'"
              />
              <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDelete(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </template>

    <!-- Modal Formulario -->
    <Dialog v-model:visible="modal.visible" :header="modal.modo === 'crear' ? 'Nuevo Usuario' : 'Editar Usuario'" modal class="w-full max-w-md">
      <div class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Nombre *</label>
          <InputText v-model="formData.nombre" placeholder="Nombre completo" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Email *</label>
          <InputText v-model="formData.email" type="email" placeholder="usuario@ejemplo.com" :disabled="modal.modo === 'editar'" />
        </div>
        <div class="flex flex-col gap-2" v-if="modal.modo === 'crear'">
          <label class="font-semibold text-sm">Contraseña *</label>
          <InputText v-model="formData.password" type="password" placeholder="••••••••" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold text-sm">Rol</label>
          <Select v-model="formData.rol" :options="rolOptions.filter(o => o.value !== 'all')" optionLabel="label" optionValue="value" />
        </div>
        
        <div v-if="modal.modo === 'editar'" class="flex flex-col gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
           <label class="font-bold text-xs text-blue-800 uppercase">Seguridad</label>
           <Button 
            label="Enviar Correo de Recuperación" 
            icon="pi pi-envelope" 
            severity="info" 
            outlined 
            size="small"
            class="w-full"
            @click="sendRecoveryEmail"
            :loading="isSendingRecovery"
           />
           <small class="text-blue-600 leading-tight">Envía un enlace al usuario para que restablezca su contraseña.</small>
        </div>
        <div class="flex items-center gap-2 mt-2">
          <Checkbox v-model="formData.activo" :binary="true" inputId="activo" />
          <label for="activo" class="text-sm">Usuario Activo</label>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="modal.visible = false" />
        <Button label="Guardar" icon="pi pi-save" :loading="isSaving" @click="saveUser" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { listUsers, deleteUser, toggleUserStatus, isCurrentUserAdmin, createUser, updateUser } from '../services/usuarios'
import { handleError, showSuccess } from '../utils/errorHandler'
import { Users, Lock } from 'lucide-vue-next'
import { supabase } from '../lib/supabaseClient'

import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'

// Estados
const users = ref([])
const isAdmin = ref(false)
const checkingAuth = ref(true)
const isLoading = ref(false)
const isSaving = ref(false)
const isSendingRecovery = ref(false)
const rolFilter = ref('all')

const rolOptions = [
  { label: 'Todos los roles', value: 'all' },
  { label: 'Administrador', value: 'admin' },
  { label: 'Colaborador', value: 'colaborador' }
]

const modal = ref({ visible: false, modo: 'crear', user: null })
const formData = ref({ nombre: '', email: '', password: '', rol: 'colaborador', activo: true })

// Computed
const filteredUsers = computed(() => {
  if (rolFilter.value === 'all') return users.value
  return users.value.filter(u => u.rol === rolFilter.value)
})

// Funciones
const loadUsers = async () => {
  try {
    isLoading.value = true
    const data = await listUsers()
    users.value = data
  } catch (err) {
    handleError(err)
  } finally {
    isLoading.value = false
  }
}

const checkAdmin = async () => {
  try {
    isAdmin.value = await isCurrentUserAdmin()
  } catch (e) {
    console.error(e)
  } finally {
    // checkingAuth.value = false // Removed to prevent double loading
  }
}

const openModal = (modo, user = null) => {
  modal.value = { visible: true, modo, user }
  if (user) {
    formData.value = { 
      nombre: user.nombre, 
      email: user.email, 
      rol: user.rol, 
      activo: user.activo,
      password: '' 
    }
  } else {
    formData.value = { nombre: '', email: '', password: '', rol: 'colaborador', activo: true }
  }
}

const saveUser = async () => {
  try {
    isSaving.value = true
    if (modal.value.modo === 'crear') {
      await createUser(formData.value)
      showSuccess('Usuario creado correctamente')
    } else {
      await updateUser(modal.value.user.id, formData.value)
      showSuccess('Usuario actualizado correctamente')
    }
    modal.value.visible = false
    loadUsers()
  } catch (err) {
    handleError(err)
  } finally {
    isSaving.value = false
  }
}

const toggleStatus = async (user) => {
  try {
    await toggleUserStatus(user.id, !user.activo)
    showSuccess(user.activo ? 'Usuario desactivado' : 'Usuario activado')
    loadUsers()
  } catch (err) {
    handleError(err)
  }
}

const confirmDelete = async (user) => {
  if (!confirm(`¿Estás seguro de eliminar a ${user.nombre}?`)) return
  try {
    await deleteUser(user.id)
    showSuccess('Usuario eliminado')
    loadUsers()
  } catch (err) {
    handleError(err)
  }
}

const sendRecoveryEmail = async () => {
  if (!formData.value.email) return
  
  try {
    isSendingRecovery.value = true
    const { error } = await supabase.auth.resetPasswordForEmail(formData.value.email, {
      redirectTo: (import.meta.env.VITE_APP_URL || window.location.origin) + '/login?recovery=true'
    })
    
    if (error) throw error
    
    showSuccess(`Correo de recuperación enviado a ${formData.value.email}`)
  } catch (err) {
    handleError(err)
  } finally {
    isSendingRecovery.value = false
  }
}

onMounted(async () => {
  checkingAuth.value = true
  try {
    await checkAdmin()
    if (isAdmin.value) {
      await loadUsers()
    }
  } finally {
    checkingAuth.value = false
  }
})
</script>

