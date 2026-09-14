<template>
  <component :is="activeComponent" />
</template>

<script setup>
import { computed } from 'vue'
import { useCompanyStore } from '../stores/companyStore'
import InventarioCarniceria from '../apps/carniceria/pages/InventarioCarniceria.vue'
import InventarioMototech from '../apps/mototech/pages/InventarioMototech.vue'

const companyStore = useCompanyStore()

const activeComponent = computed(() => {
  return companyStore.isMotoTech ? InventarioMototech : InventarioCarniceria
})
</script>
