<template>
  <div class="bg-white rounded-xl shadow-md border border-indigo-200 overflow-hidden">
    <div class="bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-3 flex items-center justify-between border-b border-indigo-100">
      <div class="flex items-center gap-2">
        <div class="bg-indigo-100 p-1.5 rounded-md text-indigo-600">
          <i class="pi pi-calculator text-lg"></i>
        </div>
        <h3 class="text-base font-bold text-slate-800">Resumen de Totales</h3>
      </div>
      <span v-if="totals.discount_percent > 0" class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
        <i class="pi pi-percentage text-[10px]"></i> Descuento {{ totals.discount_percent }}% Aplicado
      </span>
      <span v-else class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
        <i class="pi pi-minus text-[10px]"></i> Sin Descuento (0%)
      </span>
    </div>
    <div class="p-4 space-y-2 bg-white">
      <div class="flex justify-between items-center py-1.5 border-b border-slate-100">
        <span class="font-semibold text-slate-600 text-sm">Subtotal:</span>
        <span class="text-base font-bold text-slate-800">{{ formatCurrency(totals.subtotal) }}</span>
      </div>

      <div class="flex justify-between items-center py-1.5 border-b border-slate-100" :class="totals.discount_total > 0 ? 'text-amber-600' : 'text-slate-400'">
        <div class="flex items-center gap-1">
          <span class="font-semibold text-sm">Descuento ({{ totals.discount_percent || 0 }}%):</span>
        </div>
        <span class="text-base font-bold">
          {{ totals.discount_total > 0 ? '-' + formatCurrency(totals.discount_total) : formatCurrency(0) }}
        </span>
      </div>

      <div class="flex justify-between items-center py-3 bg-indigo-50/60 rounded-xl px-4 mt-3 border border-indigo-100">
        <div>
          <span class="text-lg font-black text-slate-800">Total a Pagar:</span>
          <p class="text-[11px] text-slate-500 font-medium">
            {{ totals.discount_percent > 0 ? `Con ${totals.discount_percent}% de descuento` : 'Sin porcentaje de descuento' }}
          </p>
        </div>
        <span class="text-2xl font-black text-indigo-600">{{ formatCurrency(totals.total) }}</span>
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
    default: () => ({ subtotal: 0, discount_percent: 0, discount_total: 0, tax_total: 0, total: 0 })
  }
})
</script>
