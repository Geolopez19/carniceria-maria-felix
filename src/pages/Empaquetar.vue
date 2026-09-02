<template>
  <div class="max-w-4xl mx-auto p-4 md:p-6">
    <!-- Header -->
    <div class="bg-indigo-600 rounded-xl md:rounded-2xl shadow-md p-6 mb-6 text-white flex justify-between items-center">
      <div>
        <h1 class="text-2xl md:text-3xl font-black mb-1 flex items-center gap-2">
          <i class="pi pi-tags text-xl md:text-2xl"></i>
          Empaquetar Producto
        </h1>
        <p class="text-indigo-100 text-sm">Transformación de producto a granel en paquetes con peso variable</p>
      </div>
      <Button 
        type="button" 
        icon="pi pi-arrow-left" 
        label="Volver" 
        @click="volverAInventario"
        class="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl backdrop-blur-md px-4 py-2 font-bold"
        style="color: white !important;"
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Formulario de Empaque (Izquierda/Centro) -->
      <div class="md:col-span-2 space-y-6">
        <!-- Tarjeta de Selección -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
            <i class="pi pi-box text-indigo-500"></i> Origen de Mercancía
          </h2>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Producto Selector -->
            <div class="flex flex-col gap-2">
              <label for="producto_empaque" class="font-semibold text-sm text-slate-700">Seleccionar Producto</label>
              <Select 
                id="producto_empaque" 
                v-model="selectedProduct" 
                :options="filteredProducts" 
                optionLabel="nombre" 
                placeholder="Seleccione un producto..."
                class="w-full"
                @change="onProductChange"
                :loading="loadingProducts"
              />
            </div>

            <!-- Lote Selector -->
            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center">
                <label for="lote_empaque" class="font-semibold text-sm text-slate-700">Lote / Caja</label>
                <button 
                  v-if="selectedProduct"
                  type="button" 
                  @click="abrirNuevoLote"
                  class="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 hover:underline"
                >
                  <i class="pi pi-plus-circle"></i> Nuevo Lote
                </button>
              </div>
              <Select 
                id="lote_empaque" 
                v-model="selectedLote" 
                :options="lotes" 
                optionLabel="codigo_lote" 
                placeholder="Seleccione lote..."
                class="w-full"
                :disabled="!selectedProduct"
                :loading="loadingLotes"
              >
                <template #option="slotProps">
                  <div class="flex justify-between items-center w-full">
                    <span>{{ slotProps.option.codigo_lote }}</span>
                    <span v-if="slotProps.option.codigo_caja" class="text-xs text-slate-400 font-mono">({{ slotProps.option.codigo_caja }})</span>
                  </div>
                </template>
              </Select>
            </div>
          </div>

          <!-- Información del stock del producto seleccionado -->
          <div v-if="selectedProduct" class="grid grid-cols-3 gap-2 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 text-xs mt-2">
            <div>
              <span class="text-slate-500 block">Stock a Granel:</span>
              <strong class="text-indigo-900 text-sm font-mono">{{ selectedProduct.stock_granel || 0 }} {{ selectedProduct.unidad_medida }}</strong>
            </div>
            <div>
              <span class="text-slate-500 block">Stock Empacado:</span>
              <strong class="text-indigo-900 text-sm font-mono">{{ selectedProduct.stock_empacado || 0 }} {{ selectedProduct.unidad_medida }}</strong>
            </div>
            <div>
              <span class="text-slate-500 block">Precio por {{ selectedProduct.unidad_medida }}:</span>
              <strong class="text-indigo-900 text-sm font-mono">C${{ selectedProduct.precio?.toFixed(2) }}</strong>
            </div>
          </div>
        </div>

        <!-- Tarjeta de Datos del Paquete -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4" v-if="selectedProduct">
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
            <i class="pi pi-tag text-indigo-500"></i> Datos del Paquete Nuevo
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Peso -->
            <div class="flex flex-col gap-2">
              <label for="peso_paquete" class="font-semibold text-sm text-slate-700">Peso del Paquete ({{ selectedProduct.unidad_medida || 'lbs' }})</label>
              <InputNumber 
                id="peso_paquete" 
                v-model="form.peso" 
                :min="0.01" 
                :minFractionDigits="2" 
                :maxFractionDigits="3" 
                placeholder="Ingresar peso"
                fluid
                ref="pesoInputRef"
                @update:modelValue="calcularTotal"
              />
            </div>

            <!-- Precio por Unidad -->
            <div class="flex flex-col gap-2">
              <label for="precio_unidad" class="font-semibold text-sm text-slate-700">Precio por {{ selectedProduct.unidad_medida || 'lb' }}</label>
              <InputNumber 
                id="precio_unidad" 
                v-model="form.precioPorUnidad" 
                mode="currency" 
                currency="NIO" 
                locale="es-NI" 
                fluid
                @update:modelValue="calcularTotal"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Fecha de Vencimiento -->
            <div class="flex flex-col gap-2">
              <label for="fecha_vencimiento" class="font-semibold text-sm text-slate-700">Fecha de Vencimiento</label>
              <input 
                id="fecha_vencimiento" 
                type="date" 
                v-model="form.fechaVencimiento" 
                class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <!-- Total Calculado -->
            <div class="flex flex-col gap-2 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100 flex-1 justify-center">
              <span class="text-xs text-emerald-800 font-semibold block uppercase">Total Calculado</span>
              <span class="text-2xl font-black text-emerald-700 font-mono">C${{ form.precioTotal.toFixed(2) }}</span>
            </div>
          </div>

          <!-- Código QR Personalizado (Opcional) -->
          <div class="flex flex-col gap-2 bg-indigo-50/30 p-3.5 rounded-xl border border-indigo-100">
            <label for="codigo_qr" class="font-semibold text-sm text-slate-700 flex items-center justify-between">
              <span class="flex items-center gap-1.5"><i class="pi pi-qrcode text-indigo-600"></i> Código QR del Paquete</span>
              <span class="text-xs text-slate-400 font-normal">(Opcional / Externo)</span>
            </label>
            <InputText 
              id="codigo_qr" 
              v-model="form.codigoQr" 
              placeholder="Ej. Escanear o digitar QR del paquete (dejar vacío para autogenerar)" 
              class="font-mono text-sm"
              @input="actualizarQrPreview"
            />
            <p class="text-[11px] text-slate-500">
              Si el paquete ya trae un código QR/barras propio o de proveedor, ingréselo aquí para incluirlo e imprimirlo.
            </p>
          </div>

          <!-- Opción de descontar a granel -->
          <div class="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <input 
              type="checkbox" 
              id="descontar_granel" 
              v-model="form.descontarGranel" 
              class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <label for="descontar_granel" class="font-medium text-slate-700 select-none">
              Descontar del stock a granel (Actual: {{ selectedProduct.stock_granel || 0 }} {{ selectedProduct.unidad_medida }})
            </label>
          </div>
        </div>
      </div>

      <!-- Previsualización de la Etiqueta (Derecha) -->
      <div class="space-y-6">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4 flex flex-col items-center">
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2 w-full">
            <i class="pi pi-qrcode text-indigo-500"></i> Previsualización Etiqueta
          </h2>

          <div 
            id="etiqueta-empaquetado" 
            class="bg-white p-6 border border-slate-200 rounded-xl shadow-2xs w-full max-w-[280px] flex flex-col items-center text-center font-sans tracking-tight"
          >
            <h3 class="font-black text-sm text-slate-800 uppercase tracking-wide leading-none truncate max-w-full">
              {{ selectedProduct ? selectedProduct.nombre : 'PRODUCTO' }}
            </h3>
            <p class="text-[12px] font-black text-indigo-700 tracking-wider uppercase mt-1 mb-1 border-b border-indigo-100 pb-1 w-full">
              CARNICERÍA MARÍA FÉLIX
            </p>
            
            <div class="text-3xl font-black text-slate-900 font-mono mt-3 mb-1">
              {{ form.peso ? form.peso.toFixed(2) : '0.00' }} {{ selectedProduct ? selectedProduct.unidad_medida : 'LB' }}
            </div>
            
            <div class="text-lg font-bold text-indigo-600 leading-none">
              C${{ form.precioTotal ? form.precioTotal.toFixed(2) : '0.00' }}
            </div>

            <div class="text-[9px] text-slate-500 font-mono mt-2">
              Empacado: {{ formatFechaString(new Date()) }} <br>
              Vence: {{ form.fechaVencimiento ? form.fechaVencimiento : 'Sin vencimiento' }}
            </div>
            
            <div class="mt-4 flex items-center justify-between gap-2 w-full bg-slate-50 p-2 rounded border border-slate-100">
              <!-- Código de barras -->
              <div class="flex flex-col items-center flex-1 min-w-0">
                <svg id="barcode-canvas-empaque" class="max-w-full h-10"></svg>
                <span class="text-[8px] text-slate-400 font-mono mt-0.5 truncate max-w-full">
                  Lote: {{ selectedLote ? selectedLote.codigo_lote : '—' }}
                </span>
              </div>
              
              <!-- Código QR -->
              <div v-if="qrPreviewUrl" class="flex flex-col items-center shrink-0 pl-1.5 border-l border-slate-200">
                <img :src="qrPreviewUrl" alt="Código QR" class="w-12 h-12 object-contain" />
                <span class="text-[7px] text-indigo-600 font-mono mt-0.5 max-w-[65px] truncate font-bold text-center" :title="effectiveQrText">
                  {{ effectiveQrText }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2.5 w-full mt-4">
            <Button 
              label="Guardar e Imprimir" 
              icon="pi pi-print" 
              class="w-full bg-indigo-600 hover:bg-indigo-700 !text-white font-bold py-3 rounded-xl border-0 shadow-md transition-all active:scale-[0.98]"
              style="color: white !important"
              :disabled="!isValidForm"
              :loading="saving"
              @click="guardarPaquete(true)"
            />
            <Button 
              label="Guardar sin Imprimir" 
              icon="pi pi-save" 
              class="w-full p-button-secondary font-bold py-2.5 rounded-xl border border-slate-200"
              :disabled="!isValidForm"
              :loading="saving"
              @click="guardarPaquete(false)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Nuevo Lote -->
    <Dialog v-model:visible="loteModal.visible" header="Registrar Nuevo Lote / Caja" modal class="w-full max-w-[90vw] md:max-w-md">
      <div class="flex flex-col gap-4 py-2" v-if="selectedProduct">
        <p class="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
          Asociará esta caja o lote de mercancía entrante al producto principal: <br>
          <strong class="text-indigo-900 text-sm block mt-0.5">{{ selectedProduct.nombre }}</strong>
        </p>

        <div class="flex flex-col gap-2">
          <label for="new_codigo_lote" class="font-semibold text-sm">Código del Lote *</label>
          <div class="flex gap-2">
            <InputText id="new_codigo_lote" v-model="loteModal.form.codigo_lote" placeholder="Ej. LOTE-20260830-001" class="flex-1" />
            <Button label="Auto" icon="pi pi-refresh" severity="secondary" @click="autoGenerarLote" class="shrink-0 text-sm" />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label for="new_codigo_caja" class="font-semibold text-sm">Código de Caja (Opcional)</label>
          <InputText id="new_codigo_caja" v-model="loteModal.form.codigo_caja" placeholder="Ej. CAJA-0125" />
        </div>

        <div class="flex flex-col gap-2">
          <label for="new_peso_recibido" class="font-semibold text-sm">Peso de Caja Recibido *</label>
          <InputNumber id="new_peso_recibido" v-model="loteModal.form.peso_recibido" :min="0" :minFractionDigits="2" :maxFractionDigits="2" placeholder="0.00 lb" fluid />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancelar" text severity="secondary" @click="loteModal.visible = false" />
          <Button label="Registrar Lote" icon="pi pi-check" severity="success" @click="guardarLote" :loading="loteModal.saving" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import { getProductos } from '../services/productos'
import { getLotesByProducto, crearLote, crearPaquete, updatePaqueteCodigo } from '../services/paquetes'
import { showSuccess, showWarning, handleError } from '../utils/errorHandler'

import Button from 'primevue/button'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'

const route = useRoute()
const router = useRouter()

// Estados de productos y lotes
const products = ref([])
const lotes = ref([])
const selectedProduct = ref(null)
const selectedLote = ref(null)
const loadingProducts = ref(false)
const loadingLotes = ref(false)
const saving = ref(false)
const pesoInputRef = ref(null)
const qrPreviewUrl = ref('')

const form = ref({
  peso: null,
  precioPorUnidad: 0,
  precioTotal: 0,
  fechaVencimiento: '',
  descontarGranel: true,
  codigoQr: ''
})

const loteModal = ref({
  visible: false,
  saving: false,
  form: {
    codigo_lote: '',
    codigo_caja: '',
    peso_recibido: null
  }
})

// Computados
const filteredProducts = computed(() => {
  // Mostrar productos de tipo PAQUETE o PESO
  return products.value.filter(p => p.tipo_venta === 'PAQUETE' || p.tipo_venta === 'PESO')
})

const isValidForm = computed(() => {
  return selectedProduct.value !== null &&
         form.value.peso > 0 &&
         form.value.precioPorUnidad > 0 &&
         (!form.value.descontarGranel || (selectedProduct.value.stock_granel || 0) >= form.value.peso)
})

const effectiveQrText = computed(() => {
  if (form.value.codigoQr && form.value.codigoQr.trim()) {
    return form.value.codigoQr.trim()
  }
  if (selectedProduct.value) {
    return `PAQ-${selectedProduct.value.codigo || '000'}-${(form.value.peso || 0).toFixed(2)}`
  }
  return 'PAQUETE-DEMO'
})

const actualizarQrPreview = async () => {
  try {
    const text = effectiveQrText.value
    if (text) {
      qrPreviewUrl.value = await QRCode.toDataURL(text, { width: 120, margin: 1 })
    } else {
      qrPreviewUrl.value = ''
    }
  } catch (e) {
    qrPreviewUrl.value = ''
  }
}

// Cargar productos al montar
const fetchAllProducts = async () => {
  try {
    loadingProducts.value = true
    const res = await getProductos({ limit: 1000 })
    products.value = res.data
    
    // Si viene productoId en query params, seleccionarlo por defecto
    const queryProdId = route.query.productoId
    if (queryProdId) {
      const found = products.value.find(p => p.id === queryProdId)
      if (found) {
        selectedProduct.value = found
        onProductChange()
      }
    }
  } catch (err) {
    handleError(err, 'Error al cargar productos')
  } finally {
    loadingProducts.value = false
  }
}

// Cargar lotes del producto seleccionado
const fetchLotes = async () => {
  if (!selectedProduct.value) {
    lotes.value = []
    selectedLote.value = null
    return
  }
  try {
    loadingLotes.value = true
    const data = await getLotesByProducto(selectedProduct.value.id)
    lotes.value = data
    if (lotes.value.length > 0) {
      selectedLote.value = lotes.value[0] // Seleccionar el más reciente
    } else {
      selectedLote.value = null
    }
  } catch (err) {
    handleError(err, 'Error al cargar lotes')
  } finally {
    loadingLotes.value = false
  }
}

const onProductChange = () => {
  if (selectedProduct.value) {
    form.value.precioPorUnidad = Number(selectedProduct.value.precio) || 0
    form.value.peso = null
    form.value.precioTotal = 0
    form.value.descontarGranel = true
    form.value.codigoQr = ''
    
    // Asignar fecha de vencimiento por defecto (ej. 7 días después)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    form.value.fechaVencimiento = futureDate.toISOString().split('T')[0]
    
    fetchLotes()
    actualizarQrPreview()
    
    nextTick(() => {
      if (pesoInputRef.value && pesoInputRef.value.$el) {
        const input = pesoInputRef.value.$el.querySelector('input')
        if (input) input.focus()
      }
    })
  }
}

const calcularTotal = () => {
  const p = Number(form.value.peso || 0)
  const u = Number(form.value.precioPorUnidad || 0)
  form.value.precioTotal = Number((p * u).toFixed(2))
}

const volverAInventario = () => {
  router.push('/inventario')
}

// Modal Lotes
const abrirNuevoLote = () => {
  loteModal.value.form = {
    codigo_lote: '',
    codigo_caja: '',
    peso_recibido: null
  }
  autoGenerarLote()
  loteModal.value.visible = true
}

const autoGenerarLote = () => {
  const now = new Date()
  const yyyymmdd = now.toISOString().split('T')[0].replace(/-/g, '')
  const random = Math.floor(100 + Math.random() * 900) // 3 digitos
  loteModal.value.form.codigo_lote = `LOTE-${yyyymmdd}-${random}`
}

const guardarLote = async () => {
  const f = loteModal.value.form
  if (!f.codigo_lote || f.peso_recibido <= 0) {
    showWarning('El código de lote y el peso recibido son requeridos.')
    return
  }

  try {
    loteModal.value.saving = true
    const created = await crearLote({
      codigo_lote: f.codigo_lote,
      codigo_caja: f.codigo_caja,
      producto_id: selectedProduct.value.id,
      peso_recibido: f.peso_recibido
    })
    showSuccess(`Lote ${created.codigo_lote} registrado correctamente.`)
    loteModal.value.visible = false
    await fetchLotes()
    // Seleccionar el lote creado
    selectedLote.value = lotes.value.find(l => l.id === created.id) || selectedLote.value
  } catch (err) {
    handleError(err, 'Error al registrar lote')
  } finally {
    loteModal.value.saving = false
  }
}

// Guardado del paquete
const guardarPaquete = async (printAfterSave = false) => {
  if (!isValidForm.value) return

  try {
    saving.value = true
    const result = await crearPaquete({
      productoId: selectedProduct.value.id,
      loteId: selectedLote.value?.id || null,
      peso: form.value.peso,
      precioPorUnidad: form.value.precioPorUnidad,
      fechaEmpaque: new Date().toISOString(),
      fechaVencimiento: form.value.fechaVencimiento ? new Date(form.value.fechaVencimiento).toISOString() : null,
      descontarGranel: form.value.descontarGranel
    })

    const customQr = form.value.codigoQr?.trim()
    if (customQr) {
      result.codigo_qr = customQr
      const updated = await updatePaqueteCodigo(result.id, customQr)
      if (updated) {
        result.codigo_barras = updated.codigo_barras
      }
    } else {
      result.codigo_qr = result.codigo_barras || result.sub_codigo
    }

    showSuccess(`Paquete ${result.sub_codigo} registrado exitosamente.`)

    if (printAfterSave) {
      await nextTick()
      await imprimirEtiquetaLayout(result)
    }

    // Actualizar datos de pantalla
    await fetchAllProducts()
    form.value.peso = null
    form.value.precioTotal = 0
    form.value.codigoQr = ''
    actualizarQrPreview()

  } catch (err) {
    if (err.message && err.message.includes('INSUFFICIENT_BULK_STOCK')) {
      showWarning('Stock a granel insuficiente para el peso solicitado.')
    } else {
      handleError(err, 'Error al crear paquete')
    }
  } finally {
    saving.value = false
  }
}

const imprimirEtiquetaLayout = async (paquete) => {
  const printWindow = window.open('', '_blank')
  const qrContent = paquete.codigo_qr || paquete.codigo_barras || paquete.sub_codigo
  let qrDataUrl = ''
  try {
    qrDataUrl = await QRCode.toDataURL(qrContent, { width: 140, margin: 1 })
  } catch (e) {
    console.error('Error generando QR para impresion:', e)
  }

  const html = `
    <html>
      <head>
        <title>Etiqueta Paquete ${paquete.sub_codigo}</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
        <style>
          @page {
            size: 102mm 51mm;
            margin: 0;
          }
          * {
            -webkit-font-smoothing: none;
            -moz-osx-font-smoothing: grayscale;
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #000;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            image-rendering: pixelated;
            image-rendering: crisp-edges;
          }
          .label-container {
            width: 102mm;
            height: 51mm;
            box-sizing: border-box;
            padding: 2mm 4mm;
            text-align: center;
            font-family: Arial, Helvetica, sans-serif;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
          }
          .title {
            font-size: 14px;
            font-weight: 900;
            margin: 0;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            color: #000;
          }
          .subtitle {
            font-size: 11px;
            font-weight: 900;
            margin-top: 1px;
            margin-bottom: 2px;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1.5px solid #000;
            padding-bottom: 1px;
            width: 100%;
          }
          .peso {
            font-size: 26px;
            font-weight: 900;
            margin: 1px 0;
            font-family: Arial, Helvetica, sans-serif;
            color: #000;
            line-height: 1;
          }
          .precio {
            font-size: 16px;
            font-weight: 900;
            margin: 0 0 2px 0;
            color: #000;
          }
          .fechas {
            font-size: 9px;
            font-weight: bold;
            line-height: 1.2;
            color: #000;
          }
          .codes-row {
            margin-top: 1px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: 0 2mm;
          }
          .barcode-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;
            overflow: hidden;
          }
          .barcode-svg {
            height: 30px;
            max-width: 95%;
          }
          .lote-text {
            font-size: 8px;
            font-weight: bold;
            color: #000;
            margin-top: 1px;
          }
          .qr-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-left: 6px;
            shrink: 0;
          }
          .qr-img {
            width: 14mm;
            height: 14mm;
            object-fit: contain;
          }
          .qr-text {
            font-size: 7px;
            font-weight: bold;
            font-family: Arial, sans-serif;
            color: #000;
            margin-top: 1px;
            max-width: 20mm;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <h2 class="title">${selectedProduct.value.nombre}</h2>
          <div class="subtitle">CARNICERÍA MARÍA FÉLIX</div>
          <div class="peso">${Number(paquete.peso).toFixed(2)} ${selectedProduct.value.unidad_medida || 'lbs'}</div>
          <div class="precio">TOTAL: C$${Number(paquete.precio_total).toFixed(2)}</div>
          <div class="fechas">
            Empacado: ${new Date(paquete.fecha_empaque).toLocaleDateString('es-NI')}<br>
            Vence: ${paquete.fecha_vencimiento ? new Date(paquete.fecha_vencimiento).toLocaleDateString('es-NI') : 'Sin vencimiento'}
          </div>
          <div class="codes-row">
            <div class="barcode-wrapper">
              <svg id="barcode-svg"></svg>
              <div class="lote-text">Lote: ${selectedLote.value ? selectedLote.value.codigo_lote : '—'}</div>
            </div>
            ${qrDataUrl ? `
            <div class="qr-wrapper">
              <img src="${qrDataUrl}" class="qr-img" />
              <div class="qr-text">${qrContent}</div>
            </div>
            ` : ''}
          </div>
        </div>
        <script>
          window.onload = function() {
            JsBarcode("#barcode-svg", "${paquete.codigo_barras}", {
              format: "CODE128",
              lineColor: "#000",
              width: 1.8,
              height: 28,
              displayValue: true,
              fontSize: 9,
              fontOptions: "bold",
              font: "Arial",
              margin: 0
            });
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 300);
          }
        <\/script>
      </body>
    </html>
  `
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}

// Helpers
const formatFechaString = (fecha) => {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-NI')
}

// Dibujar código de barras ficticio en previsualización
const actualizarBarcodePreview = () => {
  nextTick(() => {
    try {
      JsBarcode("#barcode-canvas-empaque", "200000000000", {
        format: "CODE128",
        lineColor: "#000",
        width: 1.5,
        height: 35,
        displayValue: true
      })
    } catch (e) {
      // Ignorar errores iniciales
    }
  })
}

// Watchers
watch([selectedProduct, selectedLote, () => form.value.peso], () => {
  actualizarBarcodePreview()
  actualizarQrPreview()
})

onMounted(() => {
  fetchAllProducts()
  actualizarBarcodePreview()
  actualizarQrPreview()
})
</script>


<style scoped>
input[type="date"] {
  border-color: #cbd5e1;
}
input[type="date"]:focus {
  border-color: #4f46e5;
}
</style>
