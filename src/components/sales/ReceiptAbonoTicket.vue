<template>
  <div class="receipt-container hidden print:block bg-white text-black font-mono text-sm leading-snug">
    <!-- Header -->
    <div class="text-center mb-3">
      <div class="flex justify-center mb-2" v-if="activeLogo">
        <img 
          :src="activeLogo" 
          alt="Logo" 
          class="receipt-logo w-[58mm] max-w-[85%] h-auto object-contain mx-auto" 
        />
      </div>
      <h2 class="text-base font-extrabold uppercase tracking-wide mb-1">{{ businessName }}</h2>
      <p v-if="business?.ruc" class="text-xs font-semibold text-black">R.U.C: {{ business.ruc }}</p>
      <p v-if="business?.address" class="text-xs text-black">{{ business.address }}</p>
      <p v-if="business?.phone" class="text-xs text-black">Tel: {{ business.phone }}</p>
      <p v-if="business?.email" class="text-xs text-black">{{ business.email }}</p>
      <p v-if="business?.website" class="text-xs text-black">{{ business.website }}</p>
      <div class="mt-2 py-1 px-2 border-y-2 border-black font-black text-center text-xs tracking-wider uppercase">
        *** {{ documentTitle }} ***
      </div>
    </div>

    <!-- Info del Apartado -->
    <div class="mb-3 border-b-2 border-dashed border-black pb-2 text-xs space-y-1">
      <div class="flex justify-between">
        <span class="font-bold">Fecha:</span>
        <span class="font-semibold">{{ formatDate(abono?.created_at || apartado?.created_at || new Date()) }}</span>
      </div>
      <div class="flex justify-between">
        <span class="font-bold">Apartado #:</span>
        <span class="font-extrabold text-sm">{{ apartado?.codigo_apartado || '---' }}</span>
      </div>
      <div class="flex justify-between items-start gap-1">
        <span class="font-bold shrink-0">Cliente:</span>
        <span class="break-words flex-1 text-right font-semibold">{{ apartado?.customer_name || 'Cliente' }}</span>
      </div>
      <div class="flex justify-between" v-if="apartado?.customer_phone">
        <span class="font-bold">Teléfono:</span>
        <span>{{ apartado.customer_phone }}</span>
      </div>
      <div class="flex justify-between" v-if="apartado?.fecha_limite">
        <span class="font-bold">Fecha Límite:</span>
        <span class="font-black">{{ formatDateOnly(apartado.fecha_limite) }}</span>
      </div>
      <div class="flex justify-between">
        <span class="font-bold">Estado:</span>
        <span class="font-bold uppercase">{{ getStatusLabel(apartado?.status) }}</span>
      </div>
    </div>

    <!-- Artículos Apartados (Mismo formato que ReceiptTicket) -->
    <div class="mb-3 border-b-2 border-dashed border-black pb-2">
      <div class="grid grid-cols-12 font-bold mb-1 border-b border-black pb-1 text-xs uppercase">
        <div class="col-span-5 text-left">Desc / P.Unit</div>
        <div class="col-span-3 text-center">Cant</div>
        <div class="col-span-4 text-right">Total</div>
      </div>
      
      <div v-for="item in displayItems" :key="item.id || item.product_id" class="mb-2 border-b border-dotted border-gray-300 pb-1 last:border-0">
        <!-- Nombre del Producto -->
        <div class="font-bold text-xs uppercase leading-tight mb-0.5">
          {{ item.product_name || 'Producto sin nombre' }}
        </div>
        <!-- Desglose: Cantidad x Precio Unitario = Total -->
        <div class="grid grid-cols-12 text-xs text-black font-semibold items-center">
          <div class="col-span-5 text-left pl-1">
            <span class="text-[11px] text-gray-700">P.U:</span> {{ formatCurrency(item.unit_price) }}
          </div>
          <div class="col-span-3 text-center font-bold">
            x {{ item.qty || 1 }}
          </div>
          <div class="col-span-4 text-right font-extrabold text-black">
            {{ formatCurrency((item.qty || 1) * (item.unit_price || 0)) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Desglose Financiero -->
    <div class="mb-4 text-xs space-y-1">
      <div class="flex justify-between" v-if="totalQuantity > 0">
        <span>Total Artículos:</span>
        <span class="font-bold">{{ totalQuantity }}</span>
      </div>

      <div class="flex justify-between">
        <span>Precio Total del Apartado:</span>
        <span class="font-bold">{{ formatCurrency(apartado?.total || totalItemsAmount) }}</span>
      </div>

      <!-- Caso: Recibo de Abono / Prima Específica -->
      <template v-if="abono?.monto">
        <div class="flex justify-between text-gray-700" v-if="abono?.saldo_anterior !== undefined">
          <span>Saldo Anterior:</span>
          <span>{{ formatCurrency(abono.saldo_anterior) }}</span>
        </div>
        <div class="flex justify-between font-extrabold text-sm border-y border-black py-1 my-1">
          <span>{{ Number(abono?.numero_abono) === 1 || isPrima ? 'PRIMA / ABONO INICIAL:' : 'MONTO ABONADO:' }}</span>
          <span>{{ formatCurrency(abono.monto) }}</span>
        </div>
        <div class="flex justify-between" v-if="abono?.payment_method">
          <span>Método de Pago:</span>
          <span class="uppercase font-semibold">{{ abono.payment_method }}</span>
        </div>
        <div class="flex justify-between" v-if="abono?.amount_received > 0">
          <span>Efectivo Recibido:</span>
          <span class="font-extrabold">{{ formatCurrency(abono.amount_received) }}</span>
        </div>
        <div class="flex justify-between" v-if="abono?.amount_received > 0">
          <span>Vuelto:</span>
          <span class="font-extrabold">{{ formatCurrency(abono.change_given || 0) }}</span>
        </div>
      </template>

      <!-- Caso: Consulta General / Resumen de Deuda -->
      <template v-else>
        <div class="flex justify-between text-gray-700">
          <span>Total Abonado a la Fecha:</span>
          <span class="font-bold text-black">{{ formatCurrency(apartado?.total_abonado || 0) }}</span>
        </div>
      </template>
      
      <!-- Saldo Restante / Deuda en Grande -->
      <div class="flex justify-between font-extrabold text-base mt-2 border-t-2 border-dashed border-black pt-2">
        <span>SALDO RESTANTE (DEUDA):</span>
        <span>{{ formatCurrency(currentSaldoPendiente) }}</span>
      </div>

      <div v-if="currentSaldoPendiente > 0 && proximaCuota > 0" class="flex justify-between font-bold text-xs pt-1">
        <span>CUOTA ESTIMADA:</span>
        <span class="font-extrabold">{{ formatCurrency(proximaCuota) }}</span>
      </div>

      <div v-if="currentSaldoPendiente <= 0" class="text-center font-black text-xs uppercase py-1 bg-gray-100 mt-1 border border-black">
        *** PRODUCTO LIQUIDADO AL 100% ***
      </div>
    </div>

    <!-- Footer -->
    <div class="text-center text-xs space-y-1">
      <p class="font-bold">*** {{ currentSaldoPendiente <= 0 ? 'GRACIAS POR SU COMPRA' : 'GRACIAS POR SU PREFERENCIA' }} ***</p>
      <p class="text-[11px]">Conserve este recibo para su próximo abono o retiro.</p>
      <p v-if="business?.website" class="text-[11px]">Visítenos en: {{ business.website }}</p>
      <p class="mt-2 text-[10px] text-black font-medium">Desarrollado por: GL Solutions</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCompanyStore } from '../../stores/companyStore'
import { formatDateTime, formatDateOnly as formatDateOnlyHelper } from '../../utils/dateUtils'
import { extractPlazos } from '../../services/apartados'

const companyStore = useCompanyStore()

const props = defineProps({
  apartado: {
    type: Object,
    default: () => ({})
  },
  abono: {
    type: Object,
    default: () => null
  },
  items: {
    type: Array,
    default: () => []
  },
  business: {
    type: Object,
    default: () => ({})
  }
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
  return isMotoTech.value ? 'JyG MotoTech' : 'Carnicería María Félix'
})

const isPrima = computed(() => {
  return props.abono && (props.abono.numero_abono === 1 || props.abono.is_prima)
})

const documentTitle = computed(() => {
  if (props.abono?.monto) {
    if (isPrima.value || props.abono.numero_abono === 1) {
      return 'COMPROBANTE DE PRIMA / APARTADO'
    }
    return `RECIBO DE ABONO #${props.abono.numero_abono || ''}`.trim()
  }
  return 'ESTADO DE CUENTA - APARTADO'
})

const displayItems = computed(() => {
  if (Array.isArray(props.items) && props.items.length > 0) return props.items
  if (Array.isArray(props.apartado?.items) && props.apartado.items.length > 0) return props.apartado.items
  return []
})

const totalItemsAmount = computed(() => {
  return displayItems.value.reduce((sum, item) => sum + (Number(item.qty || 1) * Number(item.unit_price || 0)), 0)
})

const totalQuantity = computed(() => {
  return displayItems.value.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
})

const currentSaldoPendiente = computed(() => {
  if (props.abono && props.abono.saldo_nuevo !== undefined && props.abono.saldo_nuevo !== null) {
    return Number(props.abono.saldo_nuevo || 0)
  }
  return Number(props.apartado?.saldo_pendiente ?? (props.apartado?.total || 0))
})

const proximaCuota = computed(() => {
  const saldo = currentSaldoPendiente.value
  if (saldo <= 0) return 0
  const plazos = extractPlazos(props.apartado)
  
  let abonosHechos = 0
  if (Array.isArray(props.apartado?.abonos) && props.apartado.abonos.length > 0) {
    abonosHechos = props.apartado.abonos.length
  } else if (Number(props.apartado?.total_abonado || 0) > 0 || (props.abono && props.abono.monto)) {
    abonosHechos = 1
  }

  const plazosRestantes = Math.max(1, plazos - abonosHechos)
  const cuotaBase = Math.round((saldo / plazosRestantes) * 100) / 100
  return Math.min(saldo, cuotaBase)
})

const getStatusLabel = (st) => ({
  activo: 'Activo (En pagos)',
  liquidado: 'Liquidado (100% Pagado)',
  entregado: 'Entregado',
  cancelado: 'Cancelado / Devuelto'
}[st] || st || 'Activo')

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'NIO'
  }).format(value || 0)
}

const formatDate = (dateString) => {
  return formatDateTime(dateString)
}

const formatDateOnly = (dateString) => {
  return formatDateOnlyHelper(dateString)
}
</script>

<style scoped>
@page {
  size: 79mm auto;
  margin: 0;
}

@media print {
  .receipt-container {
    width: 79mm !important;
    max-width: 79mm !important;
    margin: 0 auto;
    padding: 3mm 2mm;
    box-sizing: border-box;
  }

  .receipt-logo {
    filter: contrast(250%) brightness(95%);
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
    width: 58mm !important;
    max-width: 90% !important;
    max-height: none !important;
    height: auto !important;
    display: block !important;
  }

  * {
    color: #000000 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
