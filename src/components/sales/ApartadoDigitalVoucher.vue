<template>
  <div
    ref="voucherRef"
    class="voucher-card w-full max-w-[420px] mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden text-slate-800"
    style="font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;"
  >
    <!-- Encabezado Elegante Premium con Fondo Oscuro -->
    <div class="px-5 py-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white text-center relative border-b-4 border-amber-500">
      <div class="flex justify-center mb-2" v-if="activeLogo">
        <img
          :src="activeLogo"
          :alt="businessName"
          class="h-12 w-auto max-w-[160px] object-contain mx-auto drop-shadow-md"
        />
      </div>
      <div v-else class="text-3xl mb-1">
        {{ isMotoTech ? '🏍️' : '🥩' }}
      </div>

      <h1 class="text-base font-black uppercase tracking-wider text-cyan-400 leading-tight drop-shadow-sm">
        {{ businessName }}
      </h1>
      <p class="text-[11px] text-slate-300 font-medium leading-tight mt-1">
        <span v-if="business?.ruc">RUC: {{ business.ruc }} • </span>
        <span>Tel: {{ business?.phone || '+505 8675-8928' }}</span>
      </p>
      <p v-if="business?.address" class="text-[10px] text-slate-400 leading-tight mt-0.5 max-w-[340px] mx-auto break-words">
        {{ business.address }}
      </p>

      <!-- Tipo Documento y Código -->
      <div class="mt-3 pt-2 flex items-center justify-between">
        <span class="text-xs font-black uppercase tracking-wider text-slate-200">
          {{ isLiquidado ? 'FACTURA DE VENTA' : 'COMPROBANTE DE APARTADO' }}
        </span>
        <span class="text-sm font-mono font-black text-amber-400">
          #{{ apartado?.codigo_apartado || 'MT-APT' }}
        </span>
      </div>
    </div>

    <!-- Datos del Cliente y Fechas -->
    <div class="px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs space-y-2">
      <div class="flex justify-between items-start gap-2">
        <span class="text-slate-500 font-semibold shrink-0">Cliente:</span>
        <span class="font-extrabold text-slate-900 text-right leading-tight break-words flex-1">{{ apartado?.customer_name || 'Cliente General' }}</span>
      </div>
      <div class="flex justify-between items-center gap-2" v-if="apartado?.customer_phone">
        <span class="text-slate-500 font-semibold shrink-0">Teléfono:</span>
        <span class="font-bold text-slate-800 font-mono text-right">{{ apartado.customer_phone }}</span>
      </div>
      <div class="flex justify-between items-center gap-2">
        <span class="text-slate-500 font-semibold shrink-0">Fecha Emisión:</span>
        <span class="font-semibold text-slate-700 text-right">{{ formatDateHeader(abono?.created_at || apartado?.created_at || new Date()) }}</span>
      </div>
      <div class="flex justify-between items-center gap-2" v-if="apartado?.fecha_limite">
        <span class="text-slate-500 font-semibold shrink-0">Fecha Límite:</span>
        <span class="font-black text-amber-700 font-mono text-right">{{ formatDateOnly(apartado.fecha_limite) }}</span>
      </div>
      <!-- Plazos Acordados y Próxima Cuota si aplica -->
      <div v-if="numPlazos > 1 && currentSaldo > 0" class="flex justify-between items-center gap-2 pt-1 border-t border-slate-200/80">
        <span class="text-slate-500 font-semibold shrink-0">Plan de Pagos:</span>
        <span class="font-extrabold text-slate-800 text-right">{{ numPlazos }} Plazos acordados</span>
      </div>
      <div v-if="numPlazos > 1 && currentSaldo > 0" class="flex justify-between items-center gap-2">
        <span class="text-slate-500 font-semibold shrink-0">Próxima Cuota Sugerida:</span>
        <span class="font-black text-cyan-700 font-mono text-right text-xs">
          {{ formatCurrency(proximaCuota) }}
        </span>
      </div>
    </div>

    <!-- Tabla Detallada de Artículos (Amplia sin recortes) -->
    <div class="px-5 py-3 border-b border-slate-200">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b-2 border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wide">
            <th class="py-1.5 text-center w-8">Cant</th>
            <th class="py-1.5 text-left pl-2">Descripción</th>
            <th class="py-1.5 text-right whitespace-nowrap pl-2">P.U.</th>
            <th class="py-1.5 text-right whitespace-nowrap pl-2">Total</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-[12px]">
          <tr v-for="item in displayItems" :key="item.id || item.product_id">
            <td class="py-2.5 font-black font-mono text-slate-800 text-center align-top bg-slate-50/50 rounded">
              {{ item.qty }}
            </td>
            <td class="py-2.5 pl-2 align-top break-words">
              <div class="font-bold text-slate-900 leading-snug text-xs sm:text-sm">{{ item.product_name }}</div>
            </td>
            <td class="py-2.5 text-right font-mono font-medium text-slate-600 whitespace-nowrap align-top pl-2 text-xs">
              {{ formatCurrency(item.unit_price) }}
            </td>
            <td class="py-2.5 text-right font-black font-mono text-slate-900 whitespace-nowrap align-top pl-2 text-xs">
              {{ formatCurrency(item.line_total || (item.qty * item.unit_price)) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Desglose de Totales y Saldo -->
    <div class="px-5 py-3.5 bg-slate-50/90 space-y-2 text-xs border-b border-slate-200">
      <div class="flex justify-between items-center text-slate-600">
        <span class="font-semibold">Total Facturado:</span>
        <span class="font-mono font-black text-sm text-slate-900">{{ formatCurrency(apartado?.total || 0) }}</span>
      </div>

      <div class="flex justify-between items-center text-emerald-700">
        <span class="font-semibold">Total Acumulado Abonado:</span>
        <span class="font-mono font-black text-sm text-emerald-800">- {{ formatCurrency(apartado?.total_abonado || 0) }}</span>
      </div>

      <!-- Abono específico realizado en esta transacción si existe -->
      <div v-if="abono?.monto" class="flex justify-between items-center text-emerald-900 bg-emerald-100/90 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm">
        <span>Abono Recibido ({{ abono.payment_method || 'Efectivo' }}):</span>
        <span class="font-mono font-black text-emerald-950 text-sm">{{ formatCurrency(abono.monto) }}</span>
      </div>

      <!-- Saldo Pendiente Destacado -->
      <div
        class="mt-3 p-3 rounded-xl flex items-center justify-between border-2 shadow-sm"
        :class="currentSaldo <= 0 
          ? 'bg-emerald-50 border-emerald-400 text-emerald-950' 
          : 'bg-amber-50 border-amber-400 text-amber-950'"
      >
        <div>
          <span class="font-black text-xs uppercase tracking-wider block">
            {{ currentSaldo <= 0 ? 'ESTADO: LIQUIDADO' : 'SALDO PENDIENTE' }}
          </span>
          <span class="text-[10px] font-bold" :class="currentSaldo <= 0 ? 'text-emerald-700' : 'text-amber-800'">
            {{ currentSaldo <= 0 ? '¡Listo para entrega!' : 'Restante por cancelar' }}
          </span>
        </div>
        <span class="font-mono font-black text-xl" :class="currentSaldo <= 0 ? 'text-emerald-700' : 'text-amber-900'">
          {{ formatCurrency(currentSaldo) }}
        </span>
      </div>

      <!-- Detalle de la Próxima Cuota Estimada si hay saldo restante -->
      <div v-if="currentSaldo > 0" class="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center text-slate-700 text-[11px]">
        <span class="font-bold">Próxima Cuota Recomendada:</span>
        <span class="font-mono font-black text-slate-900 text-xs">{{ formatCurrency(proximaCuota) }}</span>
      </div>
    </div>

    <!-- Pie del Comprobante -->
    <div class="px-5 py-3 text-center bg-white text-slate-500 text-xs space-y-1">
      <p class="font-extrabold text-slate-800 tracking-wide uppercase text-[11px]">¡Gracias por su preferencia!</p>
      <p class="text-[10px] text-slate-400 font-medium leading-tight">
        Conserve o presente este comprobante digital en imagen para sus próx. abonos o retiro del producto.
      </p>
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

const numPlazos = computed(() => {
  return Number(props.apartado?.numero_plazos || props.apartado?.plazos || 3)
})

const proximaCuota = computed(() => {
  const total = Number(props.apartado?.total || 0)
  const saldo = currentSaldo.value
  if (saldo <= 0) return 0
  const plazos = numPlazos.value > 0 ? numPlazos.value : 3
  const cuotaBase = Math.round((total / plazos) * 100) / 100
  return Math.min(saldo, cuotaBase)
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
