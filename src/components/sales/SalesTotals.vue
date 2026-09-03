<template>
  <div class="bg-white rounded-xl shadow-md border border-emerald-300 overflow-hidden">
    <div class="bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-3 flex items-center justify-between border-b border-emerald-200">
      <div class="flex items-center gap-2">
        <div class="bg-emerald-100 p-1.5 rounded-md text-emerald-600">
          <i class="pi pi-calculator text-lg"></i>
        </div>
        <h3 class="text-base font-bold text-slate-800">Resumen de Totales</h3>
      </div>
      <span v-if="applyTax" class="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-1">
        <i class="pi pi-check text-[10px]"></i> IVA {{ IVA_PORCENTAJE }}% Aplicado
      </span>
      <span v-else class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
        <i class="pi pi-minus text-[10px]"></i> Sin IVA (Exento)
      </span>
    </div>
    <div class="p-4 space-y-2 bg-white">
      <div class="flex justify-between items-center py-1.5 border-b border-slate-100">
        <span class="font-semibold text-slate-600 text-sm">Subtotal:</span>
        <span class="text-base font-bold text-slate-800">{{ formatCurrency(totals.subtotal) }}</span>
      </div>

      <div v-if="totals.discount_total > 0" class="flex justify-between items-center py-1.5 border-b border-slate-100 text-amber-600">
        <span class="font-semibold text-sm">Descuento:</span>
        <span class="text-base font-bold">-{{ formatCurrency(totals.discount_total) }}</span>
      </div>

      <div class="flex justify-between items-center py-1.5 border-b border-slate-100">
        <div class="flex items-center gap-1.5">
          <span class="font-semibold text-slate-600 text-sm">IVA ({{ IVA_PORCENTAJE }}%):</span>
          <span v-if="!applyTax" class="text-[11px] text-slate-400 font-medium">(No aplica)</span>
        </div>
        <span class="text-base font-bold" :class="applyTax && totals.tax_total > 0 ? 'text-slate-800' : 'text-slate-400'">
          {{ formatCurrency(applyTax ? totals.tax_total : 0) }}
        </span>
      </div>

      <div class="flex justify-between items-center py-3 bg-emerald-50 rounded-xl px-4 mt-3 border border-emerald-100">
        <div>
          <span class="text-lg font-black text-slate-800">Total a Pagar:</span>
          <p class="text-[11px] text-slate-500 font-medium">
            {{ applyTax ? 'Incluye IVA' : 'Sin recargo de IVA' }}
          </p>
        </div>
        <span class="text-2xl font-black text-emerald-600">{{ formatCurrency(totals.total) }}</span>
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
    default: () => ({ subtotal: 0, tax_total: 0, discount_total: 0, total: 0 })
  },
  applyTax: {
    type: Boolean,
    default: false
  }
})
</script>
