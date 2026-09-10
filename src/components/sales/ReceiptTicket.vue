
<template>
  <div class="receipt-container hidden print:block bg-white text-black font-mono text-sm leading-snug">
    <!-- Header -->
    <div class="text-center mb-3">
      <!-- Logo -->
      <div class="flex justify-center mb-2">
        <img 
          src="/logo.png" 
          alt="Logo" 
          class="receipt-logo w-[58mm] max-w-[85%] h-auto object-contain mx-auto" 
        />
      </div>
      <h2 class="text-base font-extrabold uppercase tracking-wide mb-1">{{ business?.name || 'Carnicería María Félix' }}</h2>
      <p v-if="business?.ruc" class="text-xs font-semibold text-black">R.U.C: {{ business.ruc }}</p>
      <p v-if="business?.address" class="text-xs text-black">{{ business.address }}</p>
      <p v-if="business?.phone" class="text-xs text-black">Tel: {{ business.phone }}</p>
      <p v-if="business?.email" class="text-xs text-black">{{ business.email }}</p>
      <p v-if="business?.website" class="text-xs text-black">{{ business.website }}</p>
    </div>

    <!-- Info Orden -->
    <div class="mb-3 border-b-2 border-dashed border-black pb-2 text-xs space-y-1">
      <div class="flex justify-between">
        <span class="font-bold">Fecha:</span>
        <span class="font-semibold">{{ formatDate(order?.created_at) }}</span>
      </div>
      <div class="flex justify-between">
        <span class="font-bold">Ticket #:</span>
        <span class="font-extrabold text-sm">{{ order?.invoice_number || order?.number || '---' }}</span>
      </div>
      <div class="flex justify-between" v-if="order?.customer_name">
        <span class="font-bold">Cliente:</span>
        <span class="truncate max-w-[180px] font-semibold">{{ order.customer_name }}</span>
      </div>
      <div class="flex justify-between" v-if="order?.payment_method">
        <span class="font-bold">Pago:</span>
        <span class="font-semibold uppercase">{{ order.payment_method }}</span>
      </div>
    </div>

    <!-- Items -->
    <div class="mb-3 border-b-2 border-dashed border-black pb-2">
      <div class="grid grid-cols-12 font-bold mb-1 border-b border-black pb-1 text-xs uppercase">
        <div class="col-span-5 text-left">Desc / P.Unit</div>
        <div class="col-span-3 text-center">Cant</div>
        <div class="col-span-4 text-right">Total</div>
      </div>
      
      <div v-for="item in items" :key="item.id" class="mb-2 border-b border-dotted border-gray-300 pb-1 last:border-0">
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
            x {{ item.qty }}
          </div>
          <div class="col-span-4 text-right font-extrabold text-black">
            {{ formatCurrency(item.qty * item.unit_price) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Totals -->
    <div class="mb-4 text-xs space-y-1">
      <div class="flex justify-between">
        <span>Subtotal:</span>
        <span class="font-bold">{{ formatCurrency(totalAmount) }}</span>
      </div>
      <div class="flex justify-between" v-if="order?.discount > 0">
        <span>Descuento:</span>
        <span class="font-bold">-{{ formatCurrency(order.discount) }}</span>
      </div>
      <div class="flex justify-between" v-if="(order?.tax_total || 0) > 0">
        <span>IVA:</span>
        <span class="font-bold">{{ formatCurrency(order.tax_total) }}</span>
      </div>
      <div class="flex justify-between font-extrabold text-base mt-2 border-t-2 border-dashed border-black pt-2">
        <span>TOTAL:</span>
        <span>{{ formatCurrency(order?.total || 0) }}</span>
      </div>

      <!-- Desglose de Efectivo y Vuelto si aplica -->
      <div v-if="order?.amount_received > 0 || order?.payment_method === 'efectivo'" class="border-t border-dotted border-gray-400 pt-1 mt-1 space-y-0.5">
        <div class="flex justify-between" v-if="order?.amount_received > 0">
          <span class="font-bold">Efectivo Recibido:</span>
          <span class="font-extrabold">{{ formatCurrency(order.amount_received) }}</span>
        </div>
        <div class="flex justify-between" v-if="order?.amount_received > 0">
          <span class="font-bold">Vuelto:</span>
          <span class="font-extrabold">{{ formatCurrency(order.change_given || 0) }}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="text-center text-xs space-y-1">
      <p class="font-bold">*** GRACIAS POR SU COMPRA ***</p>
      <p class="text-[11px]">Revise sus productos antes de salir.</p>
      <p v-if="business?.website" class="text-[11px]">Visítenos en: {{ business.website }}</p>
      <p class="mt-2 text-[10px] text-black font-medium">Desarrollado por: GL Solutions</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  order: {
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

const totalAmount = computed(() => {
  if (!props.items) return 0
  return props.items.reduce((sum, item) => sum + (item.qty * item.unit_price), 0)
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

  /* Optimización para imprimir logo en impresora térmica (Blanco y Negro puro) */
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

  /* Force pure black for sharp thermal printing */
  * {
    color: #000000 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
