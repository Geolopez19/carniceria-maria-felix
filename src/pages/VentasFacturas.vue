<template>
  <component :is="activeComponent" />
</template>

<script setup>
import { computed } from 'vue'
import { useCompanyStore } from '../stores/companyStore'
import VentasFacturasCarniceria from '../apps/carniceria/pages/VentasFacturasCarniceria.vue'
import VentasFacturasMototech from '../apps/mototech/pages/VentasFacturasMototech.vue'

const companyStore = useCompanyStore()

const activeComponent = computed(() => {
  return companyStore.isMotoTech ? VentasFacturasMototech : VentasFacturasCarniceria
})
</script>
