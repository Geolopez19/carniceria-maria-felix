<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    header="Configuración de Caja y Paquetes Empacados"
    modal
    class="w-full max-w-[95vw] md:max-w-2xl"
    :blockScroll="true"
  >
    <div class="flex flex-col gap-5 py-2" v-if="item">
      <!-- Info del Producto -->
      <div class="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100 flex flex-wrap justify-between items-center gap-2">
        <div>
          <span class="text-xs text-indigo-600 font-bold uppercase tracking-wide block">Producto Seleccionado</span>
          <h4 class="text-base font-black text-slate-800">{{ item.product_name }}</h4>
        </div>
        <div class="text-right">
          <span class="text-xs text-slate-500 block">Costo Unitario:</span>
          <span class="font-bold text-indigo-700 font-mono">C${{ (item.unit_cost || 0).toFixed(2) }}</span>
        </div>
      </div>

      <!-- Datos de la Caja / Lote -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Peso Exacto de Caja -->
        <div class="flex flex-col gap-1.5">
          <label for="peso_caja" class="font-bold text-sm text-slate-700 flex items-center gap-1">
            <i class="pi pi-box text-indigo-500"></i> Peso Exacto de Caja (lbs) *
          </label>
          <InputNumber
            id="peso_caja"
            v-model="pesoCaja"
            :min="0.01"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            placeholder="Ej. 50.00"
            :disabled="readOnly"
            fluid
          />
          <p class="text-[11px] text-slate-400">Peso nominal o de báscula de la caja completa</p>
        </div>

        <!-- Código de Lote -->
        <div class="flex flex-col gap-1.5">
          <label for="codigo_lote" class="font-bold text-sm text-slate-700 flex items-center gap-1">
            <i class="pi pi-barcode text-indigo-500"></i> Código de Lote / Caja
          </label>
          <div class="flex gap-2">
            <InputText
              id="codigo_lote"
              v-model="codigoLote"
              placeholder="Ej. LOTE-20260901-001"
              :disabled="readOnly"
              class="flex-1 text-sm font-mono"
            />
            <Button
              v-if="!readOnly"
              icon="pi pi-refresh"
              severity="secondary"
              @click="generarLoteAuto"
              v-tooltip.top="'Autogenerar lote'"
              class="shrink-0"
            />
          </div>
        </div>
      </div>

      <!-- Ingreso Rápido de Paquetes -->
      <div v-if="!readOnly" class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <h5 class="text-sm font-bold text-slate-800 flex items-center gap-2">
          <i class="pi pi-plus-circle text-emerald-600"></i> Ingresar Paquete por Paquete
        </h5>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div class="flex flex-col gap-1 sm:col-span-1">
            <label for="nuevo_peso_paquete" class="text-xs font-semibold text-slate-600">Peso Paquete (lbs)</label>
            <InputNumber
              id="nuevo_peso_paquete"
              ref="nuevoPesoRef"
              v-model="nuevoPaquetePeso"
              :min="0.01"
              :minFractionDigits="2"
              :maxFractionDigits="3"
              placeholder="0.00"
              @keydown.enter.prevent="agregarPaquete"
              fluid
            />
          </div>

          <div class="flex flex-col gap-1 sm:col-span-1">
            <label for="fecha_venc" class="text-xs font-semibold text-slate-600">Fecha Vencimiento (Opcional)</label>
            <input
              id="fecha_venc"
              type="date"
              v-model="nuevaFechaVencimiento"
              class="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div class="sm:col-span-1">
            <Button
              label="Agregar Paquete"
              icon="pi pi-check"
              class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 text-xs rounded-lg"
              :disabled="!nuevoPaquetePeso || nuevoPaquetePeso <= 0"
              @click.prevent="agregarPaquete"
              :pt="{ label: { class: 'text-white' }, icon: { class: 'text-white' } }"
            />
          </div>
        </div>
        <p class="text-[11px] text-slate-500">Tip: Escriba el peso del paquete y presione <strong>Enter</strong> para agregar rápidamente.</p>
      </div>

      <!-- Tabla de Paquetes Agregados -->
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <h5 class="text-sm font-bold text-slate-800 flex items-center gap-2">
            <i class="pi pi-tags text-indigo-600"></i> Paquetes Ingresados ({{ paquetes.length }})
          </h5>
          <Button
            v-if="!readOnly && paquetes.length > 0"
            label="Limpiar Todo"
            icon="pi pi-trash"
            severity="danger"
            text
            size="small"
            class="text-xs p-1"
            @click="limpiarPaquetes"
          />
        </div>

        <div class="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto custom-scrollbar">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
              <tr>
                <th class="p-2 text-center w-10">#</th>
                <th class="p-2">Identificador</th>
                <th class="p-2 text-right">Peso (lbs)</th>
                <th class="p-2 text-right">Subtotal C$</th>
                <th v-if="!readOnly" class="p-2 text-center w-12"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(p, index) in paquetes" :key="p.id" class="hover:bg-slate-50 transition-colors">
                <td class="p-2 text-center font-bold text-slate-400">{{ index + 1 }}</td>
                <td class="p-2 font-mono font-medium text-slate-700">{{ p.sub_codigo }}</td>
                <td class="p-2 text-right font-bold text-indigo-900 font-mono">{{ p.peso.toFixed(2) }} lbs</td>
                <td class="p-2 text-right font-semibold text-slate-800 font-mono">C${{ (p.peso * (item.unit_cost || 0)).toFixed(2) }}</td>
                <td v-if="!readOnly" class="p-2 text-center">
                  <button
                    type="button"
                    @click="eliminarPaquete(index)"
                    class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                    title="Eliminar paquete"
                  >
                    <i class="pi pi-times"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="paquetes.length === 0">
                <td colspan="5" class="p-6 text-center text-slate-400">
                  <i class="pi pi-box text-2xl block mb-1"></i>
                  No se han ingresado paquetes individualmente.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Resumen y Comparativa de Pesos -->
      <div class="bg-slate-900 text-white p-4 rounded-xl space-y-2">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div class="bg-white/10 p-2 rounded-lg">
            <span class="text-[10px] text-slate-300 block uppercase font-medium">Paquetes</span>
            <span class="text-lg font-black font-mono">{{ paquetes.length }}</span>
          </div>
          <div class="bg-white/10 p-2 rounded-lg">
            <span class="text-[10px] text-slate-300 block uppercase font-medium">Peso Paquetes</span>
            <span class="text-lg font-black font-mono text-emerald-400">{{ totalPesoPaquetes.toFixed(2) }} lbs</span>
          </div>
          <div class="bg-white/10 p-2 rounded-lg">
            <span class="text-[10px] text-slate-300 block uppercase font-medium">Peso Exacto Caja</span>
            <span class="text-lg font-black font-mono text-indigo-300">{{ (pesoCaja || 0).toFixed(2) }} lbs</span>
          </div>
          <div class="bg-white/10 p-2 rounded-lg">
            <span class="text-[10px] text-slate-300 block uppercase font-medium">Diferencia</span>
            <span :class="['text-lg font-black font-mono', diferenciaPeso === 0 ? 'text-emerald-400' : 'text-amber-400']">
              {{ diferenciaPeso.toFixed(2) }} lbs
            </span>
          </div>
        </div>

        <div v-if="diferenciaPeso !== 0 && pesoCaja > 0" class="text-xs text-amber-300 flex items-center justify-center gap-1 pt-1">
          <i class="pi pi-exclamation-triangle"></i>
          <span>Existe una diferencia entre el peso exacto de la caja y la suma de paquetes ingresados.</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancelar" text severity="secondary" @click="$emit('update:visible', false)" />
        <Button
          v-if="!readOnly"
          label="Guardar Configuración"
          icon="pi pi-check"
          severity="success"
          @click="confirmarYGuardar"
          :disabled="!pesoCaja || pesoCaja <= 0"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object,
    default: () => null
  },
  readOnly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'save'])

const pesoCaja = ref(null)
const codigoLote = ref('')
const paquetes = ref([])

const nuevoPaquetePeso = ref(null)
const nuevaFechaVencimiento = ref('')
const nuevoPesoRef = ref(null)

const totalPesoPaquetes = computed(() => {
  return paquetes.value.reduce((acc, p) => acc + (Number(p.peso) || 0), 0)
})

const diferenciaPeso = computed(() => {
  return Number(((pesoCaja.value || 0) - totalPesoPaquetes.value).toFixed(2))
})

const generarLoteAuto = () => {
  const yyyymmdd = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const rand = Math.floor(100 + Math.random() * 900)
  codigoLote.value = `LOTE-${yyyymmdd}-${rand}`
}

const cargarDatos = () => {
  if (!props.item) return

  pesoCaja.value = props.item.peso_caja ? Number(props.item.peso_caja) : (props.item.qty || null)
  codigoLote.value = props.item.codigo_lote || ''
  paquetes.value = props.item.paquetes_list ? [...props.item.paquetes_list] : []

  if (!codigoLote.value) {
    generarLoteAuto()
  }

  // Fecha de vencimiento por defecto (+7 días)
  const fut = new Date()
  fut.setDate(fut.getDate() + 7)
  nuevaFechaVencimiento.value = fut.toISOString().split('T')[0]
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    cargarDatos()
    nextTick(() => {
      focusInput()
    })
  }
})

const focusInput = () => {
  if (nuevoPesoRef.value && nuevoPesoRef.value.$el) {
    const input = nuevoPesoRef.value.$el.querySelector('input')
    if (input) input.focus()
  }
}

const agregarPaquete = () => {
  const w = Number(nuevoPaquetePeso.value)
  if (!w || w <= 0) return

  const num = paquetes.value.length + 1
  const subCode = `PAQ-${String(num).padStart(3, '0')}`

  paquetes.value.push({
    id: crypto.randomUUID(),
    sub_codigo: subCode,
    peso: w,
    fecha_vencimiento: nuevaFechaVencimiento.value ? new Date(nuevaFechaVencimiento.value).toISOString() : null
  })

  nuevoPaquetePeso.value = null
  nextTick(() => {
    focusInput()
  })
}

const eliminarPaquete = (index) => {
  paquetes.value.splice(index, 1)
  // Reindexar sub codigos
  paquetes.value.forEach((p, idx) => {
    p.sub_codigo = `PAQ-${String(idx + 1).padStart(3, '0')}`
  })
}

const limpiarPaquetes = () => {
  paquetes.value = []
}

const confirmarYGuardar = () => {
  // El peso final que representa la cantidad de este ítem en la compra
  // Si hay paquetes, usamos el total acumulado de paquetes o pesoCaja si no hay paquetes
  const qtyFinal = totalPesoPaquetes.value > 0 ? totalPesoPaquetes.value : Number(pesoCaja.value || 0)

  emit('save', {
    peso_caja: Number(pesoCaja.value || 0),
    codigo_lote: codigoLote.value,
    paquetes_list: [...paquetes.value],
    qty: qtyFinal
  })

  emit('update:visible', false)
}
</script>
