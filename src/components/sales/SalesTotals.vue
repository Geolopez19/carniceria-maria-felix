<template>
  <div class="bg-white rounded-xl shadow-md border border-green-300 overflow-hidden">
    <div class="bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-3 flex items-center gap-2 border-b border-green-300">
      <div class="bg-green-100 p-1.5 rounded-md">
        <i class="pi pi-calculator text-green-600 text-lg"></i>
      </div>
      <h3 class="text-lg font-bold text-slate-800">Resumen de Totales</h3>
    </div>
    <div class="p-4 space-y-2 bg-white">
      <div class="flex justify-between items-center py-1.5 border-b border-slate-100">
        <span class="font-semibold text-slate-600 text-sm">Subtotal:</span>
        <span class="text-base font-bold text-slate-800">{{ formatCurrency(totals.subtotal) }}</span>
      </div>
      <div class="flex justify-between items-center py-1.5 border-b border-slate-100">
        <span class="font-semibold text-slate-600 text-sm">IVA ({{ IVA_PORCENTAJE }}%):</span>
        <span class="text-base font-bold text-slate-800">{{ formatCurrency(totals.tax_total) }}</span>
      </div>
      <div class="flex justify-between items-center py-2 bg-green-50 rounded-lg px-4 mt-2">
        <span class="text-lg font-bold text-slate-800">Total:</span>
        <span class="text-2xl font-bold text-green-600">{{ formatCurrency(totals.total) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatCurrency } from '../../utils/calculations'
import { IVA_PORCENTAJE } from '../../constants'

defineProps({
  totals: {
    type: Object,
    required: true,
    default: () => ({ subtotal: 0, tax_total: 0, total: 0 })
  }
})
</script>
