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
    icon: 'pi pi-shopping-bag',
    logo: '/logo.png'
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
    icon: 'pi pi-compass',
    logo: '/mototech_logo.png'
  }
]

export const useCompanyStore = defineStore('company', () => {
  const savedCompany = localStorage.getItem('active_company_id') || 'carniceria'
  const activeCompanyId = ref(savedCompany)
  const authorizedCompanyIds = ref(['carniceria']) // Default fallback

  const loadAuthorizedCompanies = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (user) {
        // Query explicit public schema for the user record
        const { data, error } = await supabase.schema('public').from('usuarios').select('empresas_autorizadas').eq('auth_id', user.id).single()

        if (!error && data?.empresas_autorizadas) {
          authorizedCompanyIds.value = data.empresas_autorizadas
          
          // Validate if current active company is authorized
          if (!authorizedCompanyIds.value.includes(activeCompanyId.value) && authorizedCompanyIds.value.length > 0) {
            setCompany(authorizedCompanyIds.value[0])
          }
        }
      }
    } catch (e) {
      console.error('Error loading authorized companies', e)
    }
  }

  const authorizedCompaniesList = computed(() => {
    return COMPANIES.filter(c => authorizedCompanyIds.value.includes(c.id))
  })

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
    if (!authorizedCompanyIds.value.includes(companyId)) {
      console.warn('Usuario no autorizado para la empresa:', companyId)
      return
    }
    activeCompanyId.value = companyId
    localStorage.setItem('active_company_id', companyId)
    // Recargar página suavemente para resetear queries de Vue Query limpiamente
    window.location.reload()
  }

  return {
    COMPANIES,
    activeCompanyId,
    authorizedCompanyIds,
    authorizedCompaniesList,
    currentCompany,
    currentSchema,
    isCarniceria,
    isMotoTech,
    getClient,
    setCompany,
    loadAuthorizedCompanies
  }
})
