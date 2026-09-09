<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    modal
    :closable="!isProcessing"
    :dismissableMask="!isProcessing"
    class="cash-payment-modal w-full max-w-md mx-4"
    :pt="{
      root: { class: '!rounded-2xl !overflow-hidden !border-0 !shadow-2xl' },
      header: { class: '!bg-gradient-to-r !from-emerald-700 !to-teal-700 !text-white !p-4 !border-0' },
      content: { class: '!p-5 !bg-slate-50' },
      footer: { class: '!p-4 !bg-white !border-t !border-slate-100 !flex !gap-2 !justify-end' }
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl">
          <i class="pi pi-money-bill"></i>
        </div>
        <div>
          <h3 class="text-lg font-bold text-white leading-tight">Cobro en Efectivo</h3>
          <p class="text-xs text-emerald-100">Ingrese el billete para calcular el vuelto</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Total a cobrar -->
      <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-sm text-center">
        <span class="text-xs uppercase font-bold tracking-wider text-slate-500">Total a Pagar</span>
        <div class="text-3xl font-black text-slate-800 mt-1">
          {{ formatCurrency(total) }}
        </div>
      </div>

      <!-- Billete recibido -->
      <div class="space-y-2">
        <label class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
          <span>¿Con cuánto paga? (Monto Recibido)</span>
          <span class="text-emerald-700 font-semibold text-[11px]">Córdobas (C$)</span>
        </label>
        <div class="relative">
          <InputNumber
            ref="inputReceivedRef"
            v-model="receivedAmount"
            mode="currency"
            currency="NIO"
            locale="es-NI"
            :min="0"
            :max="1000000"
            :step="10"
            fluid
            class="w-full text-xl font-black !rounded-xl overflow-hidden"
            :inputClass="[
              '!text-2xl !font-black !py-3 !px-4 !bg-white !rounded-xl !shadow-inner',
              isSufficient ? '!text-emerald-700 !border-emerald-500' : '!text-rose-600 !border-rose-400'
            ]"
            placeholder="C$ 0.00"
            :disabled="isProcessing"
            @keyup.enter="handleConfirm"
          />
        </div>

        <!-- Botones de billetes comunes -->
        <div class="grid grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            v-for="bill in quickBills"
            :key="bill.label"
            @click="setQuickAmount(bill.value)"
            class="py-2 px-1 rounded-lg text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-0.5 active:scale-95"
            :class="receivedAmount === bill.value 
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'"
            :disabled="isProcessing"
          >
            <span class="text-[10px] text-slate-400 font-medium" :class="receivedAmount === bill.value ? '!text-emerald-100' : ''">
              {{ bill.sub }}
            </span>
            <span class="leading-none">{{ bill.label }}</span>
          </button>
        </div>
      </div>

      <!-- Tarjeta de Vuelto o Alerta de Falta -->
      <div
        v-if="receivedAmount > 0"
        class="rounded-xl p-4 transition-all border"
        :class="isSufficient 
          ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 shadow-sm' 
          : 'bg-rose-50 border-rose-200'"
      >
        <div v-if="isSufficient" class="flex items-center justify-between">
          <div>
            <span class="text-xs uppercase font-extrabold tracking-wider text-emerald-800 block">
              Vuelto a entregar
            </span>
            <span class="text-xs text-emerald-600 font-medium">
              {{ changeAmount === 0 ? 'Pago exacto (Sin cambio)' : 'Entregar en efectivo' }}
            </span>
          </div>
          <div class="text-right">
            <span class="text-2xl font-black text-emerald-700 block">
              {{ formatCurrency(changeAmount) }}
            </span>
          </div>
        </div>

        <div v-else class="flex items-center gap-3 text-rose-700">
          <i class="pi pi-exclamation-triangle text-xl"></i>
          <div>
            <div class="text-xs font-bold uppercase tracking-wide">Monto insuficiente</div>
            <div class="text-sm font-semibold">
              Faltan <span class="font-black">{{ formatCurrency(total - receivedAmount) }}</span> para completar el pago.
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        text
        @click="$emit('update:visible', false)"
        :disabled="isProcessing"
        class="!font-bold"
      />
      <Button
        label="Completar Facturación"
        icon="pi pi-check"
        severity="success"
        :loading="isProcessing"
        :disabled="!isSufficient || isProcessing"
        @click="handleConfirm"
        class="!bg-emerald-600 hover:!bg-emerald-700 !text-white !font-bold !px-5 !py-2.5 !rounded-xl !shadow-md !border-0"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import { formatCurrency } from '../../utils/calculations'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  total: {
    type: Number,
    required: true,
    default: 0
  },
  isProcessing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'confirm'])

const receivedAmount = ref(0)
const inputReceivedRef = ref(null)

// Si abre el modal, sugerir el monto o resetear y enfocar
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      // Sugerir redondeo natural hacia arriba o el total
      receivedAmount.value = props.total > 0 ? props.total : 0
      nextTick(() => {
        const inputEl = inputReceivedRef.value?.$el?.querySelector('input')
        if (inputEl) {
          inputEl.focus()
          inputEl.select()
        }
      })
    }
  }
)

// Botones rápidos inteligentes según el total
const quickBills = computed(() => {
  const currentTotal = props.total || 0
  const standardDenominations = [50, 100, 200, 500, 1000]

  // Encontrar la denominación inmediata superior o igual
  const higherDenoms = standardDenominations.filter((d) => d >= currentTotal)
  const chosen = higherDenoms.slice(0, 3)

  // Si el total es muy alto (ej. > 1000), dar opciones como 1500, 2000 o múltiplos
  if (chosen.length < 3) {
    const nextRound500 = Math.ceil(currentTotal / 500) * 500
    const nextRound1000 = Math.ceil(currentTotal / 1000) * 1000
    if (nextRound500 > currentTotal && !chosen.includes(nextRound500)) {
      chosen.push(nextRound500)
    }
    if (nextRound1000 > currentTotal && !chosen.includes(nextRound1000)) {
      chosen.push(nextRound1000)
    }
  }

  const buttons = [
    { label: 'Exacto', sub: 'Sin vuelto', value: currentTotal }
  ]

  chosen.forEach((val) => {
    buttons.push({
      label: `C$ ${val}`,
      sub: 'Billete',
      value: val
    })
  })

  // Limitar a máximo 4 botones para el grid
  return buttons.slice(0, 4)
})

const changeAmount = computed(() => {
  const diff = (Number(receivedAmount.value) || 0) - (Number(props.total) || 0)
  return diff > 0 ? Math.round(diff * 100) / 100 : 0
})

const isSufficient = computed(() => {
  const diff = (Number(receivedAmount.value) || 0) - (Number(props.total) || 0)
  return diff >= -0.01
})

const setQuickAmount = (val) => {
  receivedAmount.value = val
}

const handleConfirm = () => {
  if (!isSufficient.value || props.isProcessing) return
  emit('confirm', {
    amountReceived: Number(receivedAmount.value) || props.total,
    changeGiven: changeAmount.value
  })
}
</script>

<style scoped>
:deep(.p-inputnumber-input) {
  text-align: center;
}
</style>
