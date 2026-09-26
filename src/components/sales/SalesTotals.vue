<template>
  <div class="bg-white rounded-xl shadow-md border border-emerald-300 overflow-hidden">
    <div class="bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-3 flex items-center justify-between border-b border-emerald-200">
      <div class="flex items-center gap-2">
        <div class="bg-emerald-100 p-1.5 rounded-md text-emerald-600">
          <i class="pi pi-calculator text-lg"></i>
        </div>
        <h3 class="text-base font-bold text-slate-800">Resumen de Totales</h3>
      </div>
      <span v-if="totals?.pos_fee_total > 0" class="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-300 flex items-center gap-1">
        <i class="pi pi-credit-card text-[10px]"></i> Recargo Tarjeta 5.3%
      </span>
      <span v-else-if="applyTax" class="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-1">
        <i class="pi pi-check text-[10px]"></i> IVA {{ IVA_PORCENTAJE }}% Aplicado
      </span>
      <span v-else class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
        <i class="pi pi-minus text-[10px]"></i> Sin IVA (Exento)
      </span>
    </div>
    <div class="p-4 space-y-2 bg-white">
      <!-- Base/Subtotal display -->
      <div v-if="!applyTax && isGym" class="flex justify-between items-center py-1.5 border-b border-slate-100">
        <span class="font-semibold text-slate-600 text-sm">Precio regular:</span>
        <span class="text-base font-bold text-slate-800">{{ formatCurrency(totals.subtotal * (1 + IVA_PORCENTAJE / 100)) }}</span>
      </div>
      <div v-else class="flex justify-between items-center py-1.5 border-b border-slate-100">
        <span class="font-semibold text-slate-600 text-sm">Subtotal:</span>
        <span class="text-base font-bold text-slate-800">{{ formatCurrency(totals.subtotal) }}</span>
      </div>

      <!-- General discounts -->
      <div v-if="totals.discount_total > 0" class="flex justify-between items-center py-1.5 border-b border-slate-100 text-amber-600">
        <span class="font-semibold text-sm">Descuento:</span>
        <span class="text-base font-bold">-{{ formatCurrency(totals.discount_total) }}</span>
      </div>

      <!-- Beneficio Gym / IVA display -->
      <div v-if="!applyTax && isGym" class="flex justify-between items-center py-1.5 border-b border-slate-100 text-indigo-600">
        <span class="font-semibold text-sm">Beneficio Gym:</span>
        <span class="text-base font-bold">-{{ formatCurrency(totals.subtotal * (IVA_PORCENTAJE / 100)) }}</span>
      </div>
      <div v-else-if="applyTax" class="flex justify-between items-center py-1.5 border-b border-slate-100">
        <div class="flex items-center gap-1.5">
          <span class="font-semibold text-slate-600 text-sm">IVA ({{ IVA_PORCENTAJE }}%):</span>
        </div>
        <span class="text-base font-bold text-slate-800">
          {{ formatCurrency(totals.tax_total) }}
        </span>
      </div>

      <!-- Comisión POS (5.3%) visible solo para el vendedor -->
      <div v-if="totals?.pos_fee_total > 0" class="flex justify-between items-center py-1.5 border-b border-slate-100 text-blue-700 font-medium">
        <div class="flex items-center gap-1.5">
          <i class="pi pi-credit-card text-blue-500 text-xs"></i>
          <span class="font-semibold text-slate-700 text-sm">Comisión Tarjeta POS (5.3%):</span>
        </div>
        <span class="text-base font-bold text-blue-700">
          +{{ formatCurrency(totals.pos_fee_total) }}
        </span>
      </div>

      <div class="flex justify-between items-center py-3 bg-emerald-50 rounded-xl px-4 mt-3 border border-emerald-100">
        <div>
          <span class="text-lg font-black text-slate-800">Total a Pagar:</span>
          <p v-if="totals?.pos_fee_total > 0" class="text-[11px] text-blue-600 font-medium">
            Incluye 5.3% comisión de tarjeta POS
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
  },
  isGym: {
    type: Boolean,
    default: false
  }
})
</script>
