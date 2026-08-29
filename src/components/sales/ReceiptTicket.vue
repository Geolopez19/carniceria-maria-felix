
<template>
  <div class="receipt-container hidden print:block bg-white text-black font-mono text-xs leading-tight">
    <!-- Header -->
    <div class="text-center mb-2">
      <h2 class="text-sm font-bold uppercase tracking-wider mb-1">{{ business?.name || 'Multiservicios Leiva' }}</h2>
      <p v-if="business?.ruc" class="text-[10px] text-gray-600">R.U.C: {{ business.ruc }}</p>
      <p v-if="business?.address" class="text-[10px]">{{ business.address }}</p>
      <p v-if="business?.phone" class="text-[10px]">Tel: {{ business.phone }}</p>
      <p v-if="business?.email" class="text-[10px]">{{ business.email }}</p>
      <p v-if="business?.website" class="text-[10px]">{{ business.website }}</p>
    </div>

    <!-- Info Orden -->
    <div class="mb-2 border-b border-dashed border-gray-400 pb-2">
      <div class="flex justify-between">
        <span>Fecha:</span>
        <span>{{ formatDate(order?.created_at) }}</span>
      </div>
      <div class="flex justify-between">
        <span>Ticket #:</span>
        <span class="font-bold">{{ order?.invoice_number || '---' }}</span>
      </div>
      <div class="flex justify-between" v-if="order?.customer_name">
        <span>Cliente:</span>
        <span class="truncate max-w-[150px]">{{ order.customer_name }}</span>
      </div>
    </div>

    <!-- Items -->
    <div class="mb-2 border-b border-dashed border-gray-400 pb-2">
      <div class="grid grid-cols-12 font-bold mb-1 border-b border-gray-300">
        <div class="col-span-6 text-left">Desc</div>
        <div class="col-span-2 text-center">Cant</div>
        <div class="col-span-4 text-right">Total</div>
      </div>
      
      <div v-for="item in items" :key="item.id" class="mb-1">
        <div class="grid grid-cols-12">
          <div class="col-span-12 font-medium truncate">
            {{ item.product_name || 'Producto sin nombre' }}
          </div>
        </div>
        <div class="grid grid-cols-12 text-[10px] text-gray-700">
          <div class="col-span-6 pl-2">
            {{ formatCurrency(item.unit_price) }} x
          </div>
          <div class="col-span-2 text-center">{{ item.qty }}</div>
          <div class="col-span-4 text-right font-medium text-black">
            {{ formatCurrency(item.qty * item.unit_price) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Totals -->
    <div class="mb-4">
      <div class="flex justify-between text-[11px]">
        <span>Subtotal:</span>
        <span>{{ formatCurrency(totalAmount) }}</span>
      </div>
      <div class="flex justify-between text-[11px]" v-if="order?.discount > 0">
        <span>Descuento:</span>
        <span>-{{ formatCurrency(order.discount) }}</span>
      </div>
      <div class="flex justify-between text-[11px]" v-if="(order?.tax_total || 0) > 0">
        <span>IVA:</span>
        <span>{{ formatCurrency(order.tax_total) }}</span>
      </div>
      <div class="flex justify-between font-bold text-sm mt-1 border-t border-dashed border-gray-400 pt-1">
        <span>TOTAL:</span>
        <span>{{ formatCurrency(order?.total || 0) }}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="text-center text-[10px] space-y-1">
      <p>*** GRACIAS POR SU COMPRA ***</p>
      <p>No se aceptan devoluciones después de 30 días.</p>
      <p class="mt-2 text-[9px] text-gray-400">Sistema: {{ business?.name || 'Multiservicios Leiva' }}</p>
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
@media print {
  .receipt-container {
    width: 80mm; /* Standard thermal width */
    max-width: 100%;
    margin: 0 auto;
    padding: 10px; /* Safe padding */ 
    page-break-after: always;
  }

  /* Force black text for thermal printers */
  * {
    color: black !important;
  }
}
</style>
