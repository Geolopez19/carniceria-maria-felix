<template>
  <div class="receipt-container hidden print:block bg-white text-black font-mono text-sm leading-snug">
    <!-- Header -->
    <div class="text-center mb-3">
      <div class="flex justify-center mb-2">
        <img 
          src="/logo.png" 
          alt="Logo" 
          class="receipt-logo w-[58mm] max-w-[85%] h-auto object-contain mx-auto" 
        />
      </div>
      <h2 class="text-base font-extrabold uppercase tracking-wide mb-1">{{ business?.name || 'JyG MotoTech' }}</h2>
      <p v-if="business?.ruc" class="text-xs font-semibold text-black">R.U.C: {{ business.ruc }}</p>
      <p v-if="business?.address" class="text-xs text-black">{{ business.address }}</p>
      <p v-if="business?.phone" class="text-xs text-black">Tel: {{ business.phone }}</p>
      <div class="mt-2 py-1 px-2 border-y-2 border-black font-black text-center text-xs tracking-wider uppercase">
        *** COMPROBANTE DE ABONO ***
      </div>
    </div>

    <!-- Info del Apartado -->
    <div class="mb-3 border-b-2 border-dashed border-black pb-2 text-xs space-y-1">
      <div class="flex justify-between">
        <span class="font-bold">Fecha:</span>
        <span class="font-semibold">{{ formatDate(abono?.created_at || new Date()) }}</span>
      </div>
      <div class="flex justify-between">
        <span class="font-bold">Apartado #:</span>
        <span class="font-extrabold text-sm">{{ apartado?.codigo_apartado || '---' }}</span>
      </div>
      <div class="flex justify-between">
        <span class="font-bold">Cliente:</span>
        <span class="truncate max-w-[180px] font-semibold">{{ apartado?.customer_name || 'Cliente' }}</span>
      </div>
      <div class="flex justify-between" v-if="apartado?.customer_phone">
        <span class="font-bold">Teléfono:</span>
        <span>{{ apartado.customer_phone }}</span>
      </div>
      <div class="flex justify-between" v-if="apartado?.fecha_limite">
        <span class="font-bold">Fecha Límite:</span>
        <span class="font-black">{{ formatDateOnly(apartado.fecha_limite) }}</span>
      </div>
    </div>

    <!-- Artículos Apartados -->
    <div class="mb-3 border-b-2 border-dashed border-black pb-2">
      <div class="text-xs font-bold uppercase mb-1 border-b border-black pb-0.5">
        Artículo(s) Apartado(s):
      </div>
      <div v-for="item in items" :key="item.id" class="mb-1 text-xs">
        <div class="font-bold uppercase leading-tight">{{ item.product_name }}</div>
        <div class="flex justify-between text-gray-700">
          <span>Cant: {{ item.qty }} x {{ formatCurrency(item.unit_price) }}</span>
          <span class="font-bold text-black">{{ formatCurrency(item.line_total) }}</span>
        </div>
      </div>
    </div>

    <!-- Desglose Financiero del Abono -->
    <div class="mb-4 text-xs space-y-1">
      <div class="flex justify-between">
        <span>Precio Total del Producto:</span>
        <span class="font-bold">{{ formatCurrency(apartado?.total || 0) }}</span>
      </div>
      <div class="flex justify-between text-gray-700">
        <span>Saldo Anterior:</span>
        <span>{{ formatCurrency(abono?.saldo_anterior || 0) }}</span>
      </div>
      <div class="flex justify-between font-extrabold text-sm border-y border-black py-1 my-1">
        <span>MONTO ABONADO:</span>
        <span>{{ formatCurrency(abono?.monto || 0) }}</span>
      </div>
      <div class="flex justify-between" v-if="abono?.payment_method">
        <span>Método de Pago:</span>
        <span class="uppercase font-semibold">{{ abono.payment_method }}</span>
      </div>
      <div class="flex justify-between" v-if="abono?.amount_received > 0">
        <span>Efectivo Recibido:</span>
        <span>{{ formatCurrency(abono.amount_received) }}</span>
      </div>
      <div class="flex justify-between" v-if="abono?.amount_received > 0">
        <span>Vuelto:</span>
        <span>{{ formatCurrency(abono.change_given || 0) }}</span>
      </div>
      
      <!-- Saldo Restante en Grande -->
      <div class="flex justify-between font-black text-sm border-t-2 border-dashed border-black pt-2 mt-2">
        <span>SALDO RESTANTE:</span>
        <span :class="(abono?.saldo_nuevo || 0) <= 0 ? 'text-black' : ''">
          {{ formatCurrency(abono?.saldo_nuevo ?? apartado?.saldo_pendiente ?? 0) }}
        </span>
      </div>
      <div v-if="(abono?.saldo_nuevo || 0) <= 0" class="text-center font-black text-xs uppercase py-1 bg-gray-100 mt-1">
        *** PRODUCTO LIQUIDADO AL 100% ***
      </div>
    </div>

    <!-- Footer -->
    <div class="text-center text-xs space-y-1">
      <p class="font-bold">*** GRACIAS POR SU ABONO ***</p>
      <p class="text-[11px]">Conserve este recibo para su próximo abono o entrega.</p>
      <p v-if="business?.website" class="text-[11px]">{{ business.website }}</p>
      <p class="mt-2 text-[10px] text-black font-medium">Desarrollado por: GL Solutions</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  apartado: {
    type: Object,
    default: () => ({})
  },
  abono: {
    type: Object,
    default: () => ({})
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

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'NIO'
  }).format(value || 0)
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('es-NI', {
    dateStyle: 'short',
    timeStyle: 'short'
  })
}

const formatDateOnly = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('es-NI', {
    dateStyle: 'medium'
  })
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
