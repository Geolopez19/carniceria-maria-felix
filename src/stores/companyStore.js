import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabaseClient'

export const COMPANIES = [
  {
    id: 'carniceria',
    name: 'Carnicería María Félix',
    shortName: 'María Félix',
    type: 'Carnicería',
    schema: 'public',
    badge: '🥩 Carnicería',
    themeColor: 'indigo',
    accentClass: 'from-indigo-600 to-indigo-800',
    icon: 'pi pi-shopping-bag'
  },
  {
    id: 'mototech',
    name: 'JyG MotoTech',
    shortName: 'JyG MotoTech',
    type: 'Cascos & Accesorios',
    schema: 'mototech',
    badge: '🏍️ MotoTech',
    themeColor: 'amber',
    accentClass: 'from-slate-800 to-amber-600',
    icon: 'pi pi-compass'
  }
]

export const useCompanyStore = defineStore('company', () => {
  const savedCompany = localStorage.getItem('active_company_id') || 'carniceria'
  const activeCompanyId = ref(savedCompany)

  const currentCompany = computed(() => {
    return COMPANIES.find((c) => c.id === activeCompanyId.value) || COMPANIES[0]
  })

  const currentSchema = computed(() => currentCompany.value.schema)

  const isCarniceria = computed(() => activeCompanyId.value === 'carniceria')
  const isMotoTech = computed(() => activeCompanyId.value === 'mototech')

  // Obtener cliente Supabase apuntando al esquema activo
  const getClient = () => {
    const schema = currentSchema.value
    if (!schema || schema === 'public') {
      return supabase
    }
    return supabase.schema(schema)
  }

  const setCompany = (companyId) => {
    if (activeCompanyId.value === companyId) return
    activeCompanyId.value = companyId
    localStorage.setItem('active_company_id', companyId)
    // Recargar página suavemente para resetear queries de Vue Query limpiamente
    window.location.reload()
  }

  return {
    COMPANIES,
    activeCompanyId,
    currentCompany,
    currentSchema,
    isCarniceria,
    isMotoTech,
    getClient,
    setCompany
  }
})
