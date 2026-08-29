import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { business as defaultSettings } from '../config/business'

export const useBusinessStore = defineStore('business', () => {
  const settings = ref({ ...defaultSettings })
  const isLoading = ref(false)
  const lastFetched = ref(null)

  // Mapping to/from database snake_case to app camelCase
  const mapFromDb = (data) => ({
    name: data.name,
    address: data.address,
    phone: data.phone,
    email: data.email,
    website: data.website,
    ruc: data.ruc,
    currency: data.currency
  })

  const mapToDb = (data) => ({
    name: data.name,
    address: data.address,
    phone: data.phone,
    email: data.email,
    website: data.website,
    ruc: data.ruc,
    currency: data.currency
  })

  const fetchSettings = async () => {
    // Avoid re-fetching too often if we just fetched it
    if (lastFetched.value && (Date.now() - lastFetched.value < 60000)) {
      return settings.value
    }

    isLoading.value = true
    try {
      const { data, error } = await supabase
        .from('business_config')
        .select('*')
        .limit(1)
        .maybeSingle()

      if (error) throw error

      if (data) {
        settings.value = { ...defaultSettings, ...mapFromDb(data) }
      }
      lastFetched.value = Date.now()
    } catch (error) {
      console.warn('Error fetching business settings, using defaults:', error.message)
      // On error (e.g. table doesn't exist yet), we keep defaults
    } finally {
      isLoading.value = false
    }
  }

  const saveSettings = async (newSettings) => {
    isLoading.value = true
    try {
      // Check if a record exists
      const { data: existing } = await supabase
        .from('business_config')
        .select('id')
        .limit(1)
        .maybeSingle()

      const payload = mapToDb(newSettings)
      let result

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from('business_config')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single()
        
        if (error) throw error
        result = data
      } else {
        // Insert
        const { data, error } = await supabase
          .from('business_config')
          .insert(payload)
          .select()
          .single()
        
        if (error) throw error
        result = data
      }

      if (result) {
        settings.value = { ...defaultSettings, ...mapFromDb(result) }
        lastFetched.value = Date.now()
        return true
      }
    } catch (error) {
      console.error('Error saving business settings:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  return {
    settings,
    isLoading,
    fetchSettings,
    saveSettings
  }
})
