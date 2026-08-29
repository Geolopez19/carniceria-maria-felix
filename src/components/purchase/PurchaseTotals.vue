<template>
  <div class="bg-white rounded-xl shadow-md border border-indigo-200 overflow-hidden">
    <div class="bg-gradient-to-r from-indigo-50 to-blue-50 px-5 py-3 flex items-center gap-2 border-b border-indigo-200">
      <div class="bg-indigo-100 p-1.5 rounded-md">
        <i class="pi pi-calculator text-indigo-600 text-lg"></i>
      </div>
      <h3 class="text-lg font-bold text-slate-800">Resumen de Compra</h3>
    </div>
    <div class="p-4 space-y-2 bg-white">

      <div class="flex justify-between items-center py-1.5 border-b border-slate-100">
        <span class="font-semibold text-slate-600 text-sm">Subtotal:</span>
        <span class="text-base font-bold text-slate-800">{{ formatCurrency(totals.subtotal) }}</span>
      </div>
      <div class="flex justify-between items-center py-1.5 border-b border-slate-100">
        <span class="font-semibold text-slate-600 text-sm">IVA:</span>
        <span class="text-base font-bold text-slate-800">{{ formatCurrency(totals.tax_total) }}</span>
      </div>
      <div class="flex justify-between items-center py-2 bg-indigo-50 rounded-lg px-4 mt-2 border border-indigo-100">
        <span class="text-lg font-bold text-slate-800 uppercase tracking-tighter">Total a Pagar:</span>
        <span class="text-2xl font-bold text-indigo-600">{{ formatCurrency(totals.total) }}</span>
      </div>
      <div class="px-2 pt-2">
        <p class="text-[10px] text-slate-400 italic">
          * Este total representa la suma de los subtotales de todos los productos agregados.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatCurrency } from '../../utils/calculations'

defineProps({
  totals: {
    type: Object,
    required: true,
    default: () => ({ subtotal: 0, tax_total: 0, total: 0 })
  }
})
</script>
