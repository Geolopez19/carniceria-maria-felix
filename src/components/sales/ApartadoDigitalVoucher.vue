<template>
  <div
    ref="voucherRef"
    class="voucher-card w-full max-w-[390px] mx-auto bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden text-slate-800"
    style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"
  >
    <!-- Encabezado Compacto de Factura -->
    <div class="px-4 py-3.5 text-center border-b border-slate-200 bg-slate-50/50">
      <div class="flex justify-center mb-1.5" v-if="activeLogo">
        <img
          :src="activeLogo"
          :alt="businessName"
          class="h-10 w-auto max-w-[130px] object-contain mx-auto"
        />
      </div>
      <div v-else class="text-2xl mb-0.5">
        {{ isMotoTech ? '🏍️' : '🥩' }}
      </div>

      <h1 class="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight">
        {{ businessName }}
      </h1>
      <p class="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
        <span v-if="business?.ruc">RUC: {{ business.ruc }} • </span>
        <span>Tel: {{ business?.phone || '+505 8675-8928' }}</span>
      </p>
      <p v-if="business?.address" class="text-[10px] text-slate-400 leading-tight">
        {{ business.address }}
      </p>

      <!-- Badge Tipo Documento -->
      <div class="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between">
        <span class="text-[11px] font-black uppercase tracking-wide text-slate-800">
          {{ isLiquidado ? 'FACTURA DE VENTA' : 'COMPROBANTE DE APARTADO' }}
        </span>
        <span class="text-[11px] font-mono font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded border border-amber-300">
          #{{ apartado?.codigo_apartado || 'MT-APT' }}
        </span>
      </div>
    </div>

    <!-- Datos del Cliente y Fechas (Flexible sin cortes) -->
    <div class="px-4 py-2.5 bg-white border-b border-slate-200 text-[11px] space-y-1.5">
      <div class="flex justify-between items-start gap-2">
        <span class="text-slate-400 font-medium shrink-0">Cliente:</span>
        <span class="font-bold text-slate-900 text-right break-words flex-1">{{ apartado?.customer_name || 'Cliente General' }}</span>
      </div>
      <div class="flex justify-between items-center gap-2" v-if="apartado?.customer_phone">
        <span class="text-slate-400 font-medium shrink-0">Teléfono:</span>
        <span class="font-semibold text-slate-700 font-mono text-right">{{ apartado.customer_phone }}</span>
      </div>
      <div class="flex justify-between items-center gap-2">
        <span class="text-slate-400 font-medium shrink-0">Fecha Emisión:</span>
        <span class="font-medium text-slate-600 text-right">{{ formatDateHeader(abono?.created_at || apartado?.created_at || new Date()) }}</span>
      </div>
      <div class="flex justify-between items-center gap-2" v-if="apartado?.fecha_limite">
        <span class="text-slate-400 font-medium shrink-0">Fecha Límite:</span>
        <span class="font-bold text-amber-700 font-mono text-right">{{ formatDateOnly(apartado.fecha_limite) }}</span>
      </div>
    </div>

    <!-- Tabla Compacta de Artículos -->
    <div class="px-4 py-2.5 border-b border-slate-200">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
            <th class="py-1 text-center w-7">Cant</th>
            <th class="py-1 text-left pl-1">Descripción</th>
            <th class="py-1 text-right whitespace-nowrap pl-1">P.U.</th>
            <th class="py-1 text-right whitespace-nowrap pl-1">Total</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-[11px]">
          <tr v-for="item in displayItems" :key="item.id || item.product_id">
            <td class="py-1.5 font-bold font-mono text-slate-700 text-center align-top">
              {{ item.qty }}
            </td>
            <td class="py-1.5 pl-1 align-top break-words">
              <div class="font-bold text-slate-900 leading-tight">{{ item.product_name }}</div>
            </td>
            <td class="py-1.5 text-right font-mono text-slate-500 whitespace-nowrap align-top pl-1">
              {{ formatCurrency(item.unit_price) }}
            </td>
            <td class="py-1.5 text-right font-bold font-mono text-slate-900 whitespace-nowrap align-top pl-1">
              {{ formatCurrency(item.line_total || (item.qty * item.unit_price)) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Desglose de Totales y Saldo (Junto y Directo) -->
    <div class="px-4 py-3 bg-slate-50/80 space-y-1.5 text-xs">
      <div class="flex justify-between text-slate-600">
        <span class="font-medium">Total Facturado:</span>
        <span class="font-mono font-bold text-slate-900">{{ formatCurrency(apartado?.total || 0) }}</span>
      </div>

      <div class="flex justify-between text-emerald-700">
        <span class="font-medium">Total Abonado:</span>
        <span class="font-mono font-bold">- {{ formatCurrency(apartado?.total_abonado || 0) }}</span>
      </div>

      <!-- Abono específico realizado en esta transacción si existe -->
      <div v-if="abono?.monto" class="flex justify-between items-center text-emerald-800 bg-emerald-100/60 px-2 py-1 rounded text-[11px] font-medium">
        <span>Abono Recibido ({{ abono.payment_method || 'Efectivo' }}):</span>
        <span class="font-mono font-bold">{{ formatCurrency(abono.monto) }}</span>
      </div>

      <!-- Saldo Pendiente Destacado pero Compacto -->
      <div
        class="mt-2 p-2.5 rounded-lg flex items-center justify-between border"
        :class="currentSaldo <= 0 
          ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
          : 'bg-amber-50 border-amber-300 text-amber-950'"
      >
        <div>
          <span class="font-black text-[10px] uppercase tracking-wider block">
            {{ currentSaldo <= 0 ? 'ESTADO: LIQUIDADO' : 'SALDO PENDIENTE' }}
          </span>
          <span class="text-[9px] font-medium" :class="currentSaldo <= 0 ? 'text-emerald-700' : 'text-amber-800'">
            {{ currentSaldo <= 0 ? 'Listo para entrega' : 'Restante por pagar' }}
          </span>
        </div>
        <span class="font-mono font-black text-lg" :class="currentSaldo <= 0 ? 'text-emerald-700' : 'text-amber-900'">
          {{ formatCurrency(currentSaldo) }}
        </span>
      </div>
    </div>

    <!-- Pie Compacto -->
    <div class="px-4 py-2.5 text-center bg-white text-slate-400 text-[10px] border-t border-slate-200 space-y-0.5">
      <p class="font-semibold text-slate-600">¡Gracias por su preferencia!</p>
      <p class="text-[9px]">Presente este comprobante digital para sus abonos o retiro.</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useCompanyStore } from '../../stores/companyStore'
import { formatDateTime, formatDateOnly } from '../../utils/dateUtils'

const companyStore = useCompanyStore()
const voucherRef = ref(null)

const props = defineProps({
  apartado: {
    type: Object,
    required: true,
  },
  abono: {
    type: Object,
    default: null,
  },
  items: {
    type: Array,
    default: () => [],
  },
  business: {
    type: Object,
    default: () => ({}),
  },
})

defineExpose({
  voucherRef,
})

const isMotoTech = computed(() => {
  return companyStore.isMotoTech || localStorage.getItem('active_company_id') === 'mototech'
})

const activeLogo = computed(() => {
  if (props.business?.logo) return props.business.logo
  return isMotoTech.value ? '/mototech_logo.png' : '/logo.png'
})

const businessName = computed(() => {
  if (props.business?.name) return props.business.name
  return isMotoTech.value ? 'J&G MOTOTECH' : 'Carnicería María Félix'
})

const displayItems = computed(() => {
  if (props.items && props.items.length > 0) return props.items
  if (props.apartado?.items && props.apartado.items.length > 0) return props.apartado.items
  return []
})

const currentSaldo = computed(() => {
  if (props.abono && props.abono.saldo_nuevo !== undefined && props.abono.saldo_nuevo !== null) {
    return Number(props.abono.saldo_nuevo || 0)
  }
  return Number(props.apartado?.saldo_pendiente ?? (props.apartado?.total || 0))
})

const isLiquidado = computed(() => {
  return currentSaldo.value <= 0 || props.apartado?.status === 'liquidado' || props.apartado?.status === 'entregado'
})

const formatCurrency = (val) => {
  return new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'NIO',
  }).format(Number(val) || 0)
}

const formatDateHeader = (d) => {
  return formatDateTime(d)
}
</script>

<style scoped>
.voucher-card {
  box-sizing: border-box;
}
</style>
