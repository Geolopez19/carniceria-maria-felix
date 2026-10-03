<template>
  <div class="p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
    <!-- Ticket Térmico Imprimible Oculto -->
    <div class="hidden print:block fixed inset-0 bg-white z-[9999] print-container">
      <ReceiptAbonoTicket
        :apartado="printData.apartado"
        :abono="printData.abono"
        :items="printData.items"
        :business="businessStore.settings"
      />
    </div>

    <!-- Contenedor Oculto para Generación de Imagen PNG en Alta Resolución -->
    <div class="fixed -left-[9999px] -top-[9999px] pointer-events-none" style="width: 440px;">
      <ApartadoDigitalVoucher
        ref="digitalVoucherRef"
        v-if="voucherData.apartado"
        :apartado="voucherData.apartado"
        :abono="voucherData.abono"
        :items="voucherData.items"
        :business="businessStore.settings"
      />
    </div>

    <div class="ap flex flex-col gap-3">
      <!-- Plan Separe v3 — encabezado de módulo con indicadores integrados (3a escritorio / 3b móvil) -->
      <div class="ap-panel">
        <div class="flex items-center gap-3 px-3 py-3 md:px-4">
          <div class="ap-badge"><i class="pi pi-shield"></i></div>
          <div class="flex flex-col min-w-0">
            <span class="ap-eyebrow">Plan Separe / Cascos &amp; Accesorios</span>
            <span class="ap-title">Sistema de Apartados</span>
          </div>
          <span class="ap-desc hidden lg:block">Gestiona reservas de cascos y recibe abonos periódicos de los clientes.</span>
          <button class="ap-btn-primary ml-auto shrink-0" @click="openNuevoApartadoModal" title="Nuevo Apartado">
            <i class="pi pi-plus text-xs"></i><span class="hidden sm:inline">Nuevo Apartado</span><span class="sm:hidden">Nuevo</span>
          </button>
        </div>
        <div class="px-3 pb-3 text-xs ap-muted lg:hidden">Gestiona reservas de cascos y recibe abonos periódicos de los clientes.</div>
        <div class="ap-kpis grid grid-cols-2 md:grid-cols-4">
          <div class="ap-kpi"><span class="ap-kpi-l">Total apartados</span><span class="ap-kpi-v">{{ stats.total }}</span></div>
          <div class="ap-kpi"><span class="ap-kpi-l">Total recaudado</span><span class="ap-kpi-v">{{ formatCurrency(stats.totalAbonado) }}</span></div>
          <div class="ap-kpi"><span class="ap-kpi-l">Saldo por cobrar</span><span class="ap-kpi-v ap-blue">{{ formatCurrency(stats.saldoPendiente) }}</span></div>
          <div class="ap-kpi"><span class="ap-kpi-l">Activos / pendientes</span><span class="ap-kpi-v">{{ stats.activos }}</span></div>
        </div>
      </div>

      <!-- Vista de lista -->
      <div class="ap-panel overflow-hidden">
        <div class="ap-toolbar">
          <div class="hidden md:flex flex-col mr-auto">
            <span class="text-sm font-bold">Apartados</span>
            <span class="text-[11px] ap-muted">{{ countLabel }}</span>
          </div>
          <div class="relative flex items-center flex-1 md:flex-none md:w-[300px]">
            <i class="pi pi-search absolute left-2.5 text-xs ap-icon"></i>
            <input v-model="searchQuery" class="ap-input pl-8" placeholder="Buscar por cliente, código o teléfono" />
          </div>
          <div class="relative flex items-center w-[120px] md:w-[190px]">
            <select v-model="statusFilter" class="ap-input pr-7 appearance-none cursor-pointer">
              <option v-for="o in statusOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
            <i class="pi pi-chevron-down absolute right-2.5 text-[10px] ap-icon pointer-events-none"></i>
          </div>
        </div>

        <!-- 3a · Tabla (escritorio ancho) -->
        <table class="ap-table hidden min-[1360px]:table">
          <thead>
            <tr>
              <th style="width:132px" class="!pl-4">Código · Estado</th>
              <th style="width:160px">Cliente</th>
              <th>Productos</th>
              <th style="width:190px">Progreso de pago</th>
              <th style="width:104px" class="text-right">Saldo</th>
              <th style="width:126px" class="!pl-5">Límite</th>
              <th style="width:232px" class="!pr-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="isLoading">
              <tr v-for="s in 5" :key="'sk' + s"><td colspan="7" class="!px-4 !py-3.5"><div class="ap-sk h-3 w-full"></div></td></tr>
            </template>
            <template v-else>
              <tr v-for="r in rowsView" :key="r.id">
                <td class="!pl-4">
                  <div class="ap-code">{{ r.code }}</div>
                  <span class="ap-pill mt-1" :class="r.pillClass">{{ r.statusLabel }}</span>
                </td>
                <td>
                  <div class="truncate font-semibold" :title="r.client">{{ r.client }}</div>
                  <div class="text-xs ap-muted">{{ r.phone || '—' }}</div>
                </td>
                <td>
                  <div v-for="(p, i) in r.products.slice(0, 2)" :key="i" class="truncate" :title="p">{{ p }}</div>
                  <div v-if="r.moreLabel" class="text-xs ap-muted">{{ r.moreLabel }}</div>
                </td>
                <td>
                  <div class="flex justify-between gap-2 text-xs mb-1 tabular-nums">
                    <span class="truncate"><b class="font-semibold">{{ formatCurrency(r.paid) }}</b> <span class="ap-muted">de {{ formatCurrency(r.total) }}</span></span>
                    <span class="font-semibold">{{ r.pct }}%</span>
                  </div>
                  <div class="ap-bar"><div :style="{ width: r.pct + '%', background: r.barColor }"></div></div>
                </td>
                <td class="text-right font-bold tabular-nums whitespace-nowrap" :style="{ color: r.saldoColor }">{{ formatCurrency(r.saldo) }}</td>
                <td class="!pl-5">
                  <div class="font-semibold tabular-nums">{{ r.due }}</div>
                  <div class="text-[11px] leading-tight" :style="{ color: r.dueColor, fontWeight: r.dueWeight }">{{ r.dueHint }}</div>
                  <div class="text-[11px] ap-muted tabular-nums">Emitido {{ r.issued }}</div>
                </td>
                <td class="!pr-4">
                  <div class="ap-actions">
                    <template v-for="a in r.acts" :key="a.key">
                      <span v-if="a.sep" class="ap-sep"></span>
                      <button class="ap-act" :class="{ 'ap-act-danger': a.danger }" :title="a.label" :aria-label="a.label" @click="a.run"><i :class="a.icon"></i></button>
                    </template>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <!-- 3b · Lista de registros (móvil, tablet y laptop) -->
        <div class="min-[1360px]:hidden">
          <div class="px-3 pt-2.5 text-[11px] ap-muted md:hidden">{{ countLabel }}</div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 p-2.5 md:p-3">
            <template v-if="isLoading">
              <div v-for="s in 4" :key="'skm' + s" class="ap-rec p-3 flex flex-col gap-2">
                <div class="ap-sk h-3 w-1/3"></div><div class="ap-sk h-4 w-2/3"></div><div class="ap-sk h-2 w-full"></div><div class="ap-sk h-9 w-full"></div>
              </div>
            </template>
            <template v-else>
              <div v-for="r in rowsView" :key="r.id" class="ap-rec flex flex-col">
                <div class="px-3 py-2.5 flex flex-col gap-1.5 flex-1">
                  <div class="flex items-center justify-between gap-2">
                    <span class="ap-code">{{ r.code }}</span>
                    <span class="ap-pill" :class="r.pillClass">{{ r.statusLabel }}</span>
                  </div>
                  <div class="min-w-0">
                    <span class="text-[15px] font-bold">{{ r.client }}</span>
                    <span v-if="r.phone" class="text-xs ap-muted"> · {{ r.phone }}</span>
                  </div>
                  <div class="ap-muted">
                    <div v-for="(p, i) in r.products" :key="i" class="truncate" :title="p">{{ p }}</div>
                  </div>
                  <div class="mt-0.5">
                    <div class="flex justify-between gap-2 text-xs mb-1 tabular-nums">
                      <span><b class="font-semibold">{{ formatCurrency(r.paid) }}</b> <span class="ap-muted">de {{ formatCurrency(r.total) }} · {{ r.pct }}%</span></span>
                      <span class="whitespace-nowrap">Saldo <b class="font-bold" :style="{ color: r.saldoColor }">{{ formatCurrency(r.saldo) }}</b></span>
                    </div>
                    <div class="ap-bar"><div :style="{ width: r.pct + '%', background: r.barColor }"></div></div>
                  </div>
                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <div><span class="ap-muted">Emisión</span><div>{{ r.issued }}</div></div>
                    <div>
                      <span class="ap-muted">Límite</span>
                      <div class="font-semibold">{{ r.due }} <span v-if="r.dueHint" :style="{ color: r.dueColor, fontWeight: r.dueWeight }">· {{ r.dueHint }}</span></div>
                    </div>
                  </div>
                </div>
                <div class="ap-rec-acts">
                  <button v-for="a in r.acts" :key="a.key" class="ap-act-m" :class="{ 'ap-act-danger': a.danger }" :title="a.label" :aria-label="a.label" @click="a.run"><i :class="a.icon"></i></button>
                </div>
              </div>
            </template>
          </div>
        </div>

        <div v-if="!isLoading && rowsView.length === 0" class="ap-empty">
          <i class="pi pi-search text-2xl ap-icon"></i>
          <span class="font-bold text-sm">No se encontraron apartados</span>
          <span class="ap-muted">Prueba con otro nombre, código o teléfono.</span>
          <button class="ap-btn-secondary mt-1" @click="clearFilters">Limpiar búsqueda</button>
        </div>
      </div>
    </div>

    <!-- MODAL 1: NUEVO / EDITAR APARTADO (diseño 4a / 4b) -->
    <Dialog
      v-model:visible="nuevoModalVisible"
      modal
      :showHeader="false"
      :style="{ width: '680px' }"
      :breakpoints="{ '720px': '95vw' }"
      :pt="apmPt"
    >
      <div class="apm">
        <div class="apm-head">
          <div class="flex flex-col min-w-0">
            <span class="apm-eyebrow">Plan Separe / Cascos &amp; Accesorios</span>
            <span v-if="isEditMode" class="apm-title">Editar Apartado <span class="apm-blue">{{ editingApartado?.codigo_apartado }}</span></span>
            <span v-else class="apm-title">Crear Nuevo Apartado de Casco / Accesorio</span>
          </div>
          <button class="apm-close" title="Cerrar" aria-label="Cerrar" @click="nuevoModalVisible = false"><i class="pi pi-times"></i></button>
        </div>

        <div class="apm-body">
          <!-- Cliente -->
          <div class="apm-section">
            <span class="apm-sec-title">Cliente</span>
            <div class="grid grid-cols-1 gap-3" :class="isEditMode ? 'sm:grid-cols-[2fr_1fr]' : 'sm:grid-cols-2'">
              <label class="apm-field">
                <span class="apm-lbl"><span v-if="!isEditMode" class="apm-req">*</span> {{ isEditMode ? 'Nombre' : 'Nombre completo del cliente' }}</span>
                <input v-model="nuevoForm.customerName" class="apm-input" placeholder="Nombre completo del cliente" />
              </label>
              <label class="apm-field">
                <span class="apm-lbl">{{ isEditMode ? 'Teléfono' : 'Teléfono / WhatsApp' }}</span>
                <input v-model="nuevoForm.customerPhone" class="apm-input tabular-nums" placeholder="Teléfono / WhatsApp" />
              </label>
            </div>
          </div>

          <!-- Productos -->
          <div class="apm-section apm-sep">
            <div class="flex items-baseline justify-between gap-2">
              <span class="apm-sec-title">Productos a apartar ({{ nuevoForm.items.length }})</span>
              <span v-if="nuevoForm.items.length > 0" class="text-[11px] apm-muted hidden sm:inline">Puedes modificar el precio unitario si aplica</span>
            </div>
            <div class="apm-field">
              <span class="apm-lbl">Seleccionar producto del inventario</span>
              <div class="flex gap-2">
                <Select
                  v-model="selectedProduct"
                  :options="productosList"
                  optionLabel="nombre"
                  filter
                  placeholder="Buscar casco o accesorio por nombre o código..."
                  class="apm-pselect flex-1 min-w-0"
                >
                  <template #option="{ option }">
                    <div class="flex justify-between items-center w-full gap-3">
                      <div class="min-w-0">
                        <span class="font-semibold text-sm">{{ option.nombre }}</span>
                        <span v-if="option.talla" class="text-xs text-slate-500 ml-2 bg-slate-100 px-1.5 py-0.5 rounded">Talla: {{ option.talla }}</span>
                      </div>
                      <span class="font-semibold text-xs whitespace-nowrap" style="color:#0B6BCB">{{ formatCurrency(option.precio || option.precio_taller || 0) }}</span>
                    </div>
                  </template>
                </Select>
                <button class="apm-btn-secondary shrink-0" :disabled="!selectedProduct" @click="addItemToNuevo"><i class="pi pi-plus text-xs"></i>Agregar</button>
              </div>
            </div>

            <div v-if="nuevoForm.items.length === 0" class="apm-empty-dashed">
              Aún no hay productos. Selecciona uno del inventario y pulsa Agregar.
            </div>
            <div v-else class="apm-box overflow-hidden">
              <div class="apm-items-row apm-items-head hidden sm:grid">
                <span>Descripción / casco</span><span class="text-center">Cant</span><span>Precio unit. (C$)</span><span class="text-right">Subtotal</span><span></span>
              </div>
              <div v-for="(item, idx) in nuevoForm.items" :key="idx" class="apm-items-row apm-items-line">
                <input v-model="item.product_name" class="apm-input apm-item-desc" placeholder="Nombre / Detalle del casco" />
                <input v-model.number="item.qty" type="number" min="1" step="1" class="apm-input text-center" aria-label="Cantidad" />
                <input v-model.number="item.unit_price" type="number" min="0" step="0.01" class="apm-input text-right tabular-nums" aria-label="Precio unitario" />
                <span class="text-right font-bold tabular-nums whitespace-nowrap">{{ formatCurrency((item.qty || 1) * (item.unit_price || 0)) }}</span>
                <button class="apm-icon-btn apm-icon-danger" title="Eliminar producto" aria-label="Eliminar producto" @click="removeItemFromNuevo(idx)"><i class="pi pi-trash"></i></button>
              </div>
            </div>
          </div>

          <!-- Resumen de pago -->
          <div class="apm-section apm-sep">
            <span class="apm-sec-title">Resumen de pago</span>
            <div class="apm-box apm-soft">
              <div class="grid grid-cols-1 sm:grid-cols-3 apm-cells">
                <div class="apm-cell">
                  <div class="apm-cell-l">Total del apartado</div>
                  <div class="apm-cell-v">{{ formatCurrency(nuevoTotal) }}</div>
                </div>
                <div v-if="isEditMode" class="apm-cell">
                  <div class="apm-cell-l">Total abonado a la fecha</div>
                  <div class="apm-cell-v">{{ formatCurrency(editingApartado?.total_abonado || 0) }}</div>
                </div>
                <label v-else class="apm-cell flex flex-col gap-1">
                  <span class="apm-cell-l">Prima / abono inicial</span>
                  <div class="relative flex items-center">
                    <span class="absolute left-2.5 font-semibold apm-muted">C$</span>
                    <input v-model.number="nuevoForm.primaMonto" type="number" min="0" step="0.01" class="apm-input !pl-8 font-bold text-sm tabular-nums" placeholder="0.00" />
                  </div>
                </label>
                <div class="apm-cell">
                  <div class="apm-cell-l">Saldo restante</div>
                  <div class="apm-cell-v apm-blue">{{ formatCurrency(nuevoSaldoRestante) }}</div>
                </div>
              </div>
              <div v-if="isEditMode" class="px-3.5 pb-2.5 flex items-center gap-2.5">
                <div class="apm-bar flex-1"><div :style="{ width: editPct + '%' }"></div></div>
                <span class="text-xs font-semibold">{{ editPct }}% pagado</span>
              </div>
            </div>
            <span v-if="isEditMode && nuevoTotal < Number(editingApartado?.total_abonado || 0)" class="apm-error">El total del apartado no puede ser menor que lo ya abonado.</span>
            <span v-if="!isEditMode && primaExcede" class="apm-error">La prima no puede superar el total del apartado.</span>
          </div>

          <!-- Plazo -->
          <div class="apm-section apm-sep">
            <span class="apm-sec-title">{{ isEditMode ? 'Plazo' : 'Plazo y método' }}</span>
            <div class="grid grid-cols-2 gap-3" :class="isEditMode ? 'sm:grid-cols-3' : 'sm:grid-cols-4'">
              <label class="apm-field">
                <span class="apm-lbl">Fecha emisión</span>
                <input v-model="nuevoForm.fechaEmision" type="date" class="apm-input" />
              </label>
              <label class="apm-field">
                <span class="apm-lbl apm-lbl-strong">Fecha límite</span>
                <input v-model="nuevoForm.fechaLimite" type="date" class="apm-input font-semibold" />
              </label>
              <label class="apm-field">
                <span class="apm-lbl">Cantidad de plazos</span>
                <input v-model.number="nuevoForm.numeroPlazos" type="number" min="1" max="12" class="apm-input" placeholder="Ej: 3" />
              </label>
              <label v-if="!isEditMode" class="apm-field">
                <span class="apm-lbl">Método de prima</span>
                <div class="relative flex items-center">
                  <select v-model="nuevoForm.paymentMethod" class="apm-input apm-select">
                    <option v-for="o in paymentOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
                  </select>
                  <i class="pi pi-chevron-down apm-chev"></i>
                </div>
              </label>
            </div>
            <label v-if="isEditMode" class="apm-field">
              <span class="apm-lbl">Observaciones</span>
              <input v-model="nuevoForm.notas" class="apm-input" placeholder="Notas adicionales..." />
            </label>
            <div v-if="nuevoForm.numeroPlazos > 0 && nuevoTotal > 0" class="apm-info">
              <i class="pi pi-info-circle apm-blue"></i>
              <div class="flex flex-col min-w-0">
                <span class="font-semibold">Cuota sugerida por plazo ({{ nuevoForm.numeroPlazos }} plazos)</span>
                <span class="text-xs apm-muted">Dividido equitativamente entre los {{ nuevoForm.numeroPlazos }} plazos acordados</span>
              </div>
              <span class="ml-auto text-base font-bold tabular-nums whitespace-nowrap" style="color:#08467F">
                {{ formatCurrency((nuevoTotal - (nuevoForm.primaMonto || 0)) / Math.max(1, (nuevoForm.primaMonto > 0 ? (nuevoForm.numeroPlazos - 1) : (nuevoForm.numeroPlazos || 1)))) }}
              </span>
            </div>
          </div>
        </div>

        <div class="apm-foot">
          <span v-if="!isEditMode && nuevoHint" class="text-xs apm-muted mr-auto">{{ nuevoHint }}</span>
          <button class="apm-btn-secondary" :class="{ 'ml-auto': isEditMode || !nuevoHint }" @click="nuevoModalVisible = false">Cancelar</button>
          <button
            class="apm-btn-primary"
            :disabled="isSaving || nuevoForm.items.length === 0 || !nuevoForm.customerName || nuevoTotal <= 0 || (!isEditMode && primaExcede)"
            @click="handleGuardarApartado"
          >
            <i :class="isSaving ? 'pi pi-spin pi-spinner' : (isEditMode ? 'pi pi-save' : 'pi pi-check')" class="text-xs"></i>
            {{ isEditMode ? 'Guardar Cambios' : 'Crear Apartado' }}
          </button>
        </div>
      </div>
    </Dialog>

    <!-- MODAL 2: REGISTRAR ABONO (diseño 4c) -->
    <Dialog
      v-model:visible="abonoModalVisible"
      modal
      :showHeader="false"
      :style="{ width: '500px' }"
      :breakpoints="{ '540px': '95vw' }"
      :pt="apmPt"
    >
      <div class="apm" v-if="selectedApartado">
        <div class="apm-head">
          <div class="flex flex-col min-w-0">
            <span class="apm-eyebrow">Plan Separe / Cascos &amp; Accesorios</span>
            <span class="apm-title">Registrar Abono a Cuenta</span>
          </div>
          <button class="apm-close" title="Cerrar" aria-label="Cerrar" @click="abonoModalVisible = false"><i class="pi pi-times"></i></button>
        </div>

        <div class="apm-body !gap-4">
          <div class="apm-box apm-soft px-3.5 py-3 flex flex-col gap-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[15px] font-bold truncate">{{ selectedApartado.customer_name }}</span>
              <span class="apm-chip">{{ selectedApartado.codigo_apartado }}</span>
            </div>
            <div class="flex items-baseline justify-between">
              <span class="apm-muted">Saldo pendiente</span>
              <span class="text-xl font-bold apm-blue tabular-nums">{{ formatCurrency(selectedApartado.saldo_pendiente) }}</span>
            </div>
            <div class="flex items-center gap-2.5">
              <div class="apm-bar apm-bar-dual flex-1">
                <div class="apm-bar-next" :style="{ width: abonoPct.after + '%' }"></div>
                <div :style="{ width: abonoPct.now + '%' }"></div>
              </div>
              <span class="text-xs apm-muted whitespace-nowrap">{{ abonoPct.now }}% → <b class="text-[#181818]">{{ abonoPct.after }}%</b></span>
            </div>
          </div>

          <label class="apm-field">
            <span class="apm-lbl apm-lbl-strong">Monto a abonar (C$)</span>
            <div class="relative flex items-center">
              <span class="absolute left-3 text-base font-semibold apm-muted">C$</span>
              <input v-model.number="abonoForm.monto" type="number" min="0" step="0.01" class="apm-input apm-input-lg tabular-nums" placeholder="0.00" />
            </div>
            <span v-if="abonoExcede" class="apm-error">El abono no puede superar el saldo pendiente ({{ formatCurrency(selectedApartado.saldo_pendiente) }}).</span>
          </label>

          <div class="grid grid-cols-2 gap-3">
            <label class="apm-field">
              <span class="apm-lbl">Fecha del abono</span>
              <input v-model="abonoForm.fechaAbono" type="date" class="apm-input" />
            </label>
            <label class="apm-field">
              <span class="apm-lbl">Método de pago</span>
              <div class="relative flex items-center">
                <select v-model="abonoForm.paymentMethod" class="apm-input apm-select">
                  <option v-for="o in paymentOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
                <i class="pi pi-chevron-down apm-chev"></i>
              </div>
            </label>
          </div>

          <label v-if="abonoForm.paymentMethod === 'efectivo'" class="apm-field">
            <span class="apm-lbl">Monto entregado por cliente <span class="text-[#706E6B]">(ej: 3 billetes de C$500 = C$1500)</span></span>
            <div class="relative flex items-center">
              <span class="absolute left-2.5 font-semibold apm-muted">C$</span>
              <input v-model.number="abonoForm.amountReceived" type="number" min="0" step="0.01" class="apm-input !pl-8 font-semibold text-sm tabular-nums" placeholder="0.00" />
            </div>
            <span class="text-[11px] apm-muted">Ingresa el total que te entregó el cliente para calcular el vuelto exacto.</span>
            <span v-if="abonoForm.amountReceived > 0 && abonoForm.amountReceived < (abonoForm.monto || 0)" class="apm-error">El monto entregado es menor que el abono.</span>
          </label>

          <div class="apm-box flex flex-col">
            <div v-if="abonoForm.paymentMethod === 'efectivo' && abonoForm.amountReceived > abonoForm.monto" class="flex justify-between items-baseline px-3.5 py-2.5 border-b border-[#E5E5E5]">
              <span class="apm-muted">Vuelto a entregar</span>
              <span class="text-[15px] font-bold tabular-nums">{{ formatCurrency(abonoForm.amountReceived - abonoForm.monto) }}</span>
            </div>
            <div class="flex justify-between items-baseline px-3.5 py-2.5">
              <span class="font-bold">Nuevo saldo restante</span>
              <span class="text-lg font-bold tabular-nums">{{ formatCurrency(Math.max(0, selectedApartado.saldo_pendiente - (abonoForm.monto || 0))) }}</span>
            </div>
          </div>
        </div>

        <div class="apm-foot">
          <button class="apm-btn-secondary ml-auto" @click="abonoModalVisible = false">Cancelar</button>
          <button class="apm-btn-primary" :disabled="isSaving || !abonoForm.monto || abonoForm.monto <= 0 || abonoExcede" @click="handleGuardarAbono">
            <i :class="isSaving ? 'pi pi-spin pi-spinner' : 'pi pi-print'" class="text-xs"></i>Confirmar Abono e Imprimir
          </button>
        </div>
      </div>
    </Dialog>

    <!-- MODAL 3: HISTORIAL DETALLADO DEL APARTADO (diseño 4d) -->
    <Dialog
      v-model:visible="detalleModalVisible"
      modal
      :showHeader="false"
      :style="{ width: '560px' }"
      :breakpoints="{ '600px': '95vw' }"
      :pt="apmPt"
    >
      <div class="apm" v-if="selectedApartado">
        <div class="apm-head">
          <div class="flex flex-col min-w-0">
            <span class="apm-eyebrow">Plan Separe / Cascos &amp; Accesorios</span>
            <span class="apm-title">Detalle e Historial de Abonos</span>
          </div>
          <button class="apm-close" title="Cerrar" aria-label="Cerrar" @click="detalleModalVisible = false"><i class="pi pi-times"></i></button>
        </div>

        <div class="apm-body !gap-4">
          <div class="apm-box apm-soft">
            <div class="px-3.5 py-3 flex items-start justify-between gap-3">
              <div class="flex flex-col min-w-0">
                <span class="text-[15px] font-bold">{{ selectedApartado.customer_name }}</span>
                <span class="text-xs apm-muted"><span class="apm-blue font-semibold">{{ selectedApartado.codigo_apartado }}</span> · Creado el {{ formatDateOnly(selectedApartado.created_at) }}</span>
              </div>
              <span class="apm-pill" :class="'apm-pill-' + selectedApartado.status">{{ getStatusLabel(selectedApartado.status) }}</span>
            </div>
            <div class="grid grid-cols-3 border-t border-[#E5E5E5]">
              <div class="px-3.5 py-2"><div class="apm-cell-l">Total</div><div class="font-bold tabular-nums">{{ formatCurrency(selectedApartado.total) }}</div></div>
              <div class="px-3.5 py-2 border-l border-[#E5E5E5]"><div class="apm-cell-l">Pagado</div><div class="font-bold tabular-nums">{{ formatCurrency(selectedApartado.total_abonado) }}</div></div>
              <div class="px-3.5 py-2 border-l border-[#E5E5E5]"><div class="apm-cell-l">Saldo</div><div class="font-bold apm-blue tabular-nums">{{ formatCurrency(selectedApartado.saldo_pendiente) }}</div></div>
            </div>
            <div class="px-3.5 pb-2.5 flex items-center gap-2.5">
              <div class="apm-bar flex-1"><div :style="{ width: detallePct + '%', background: detallePct >= 100 ? '#2E844A' : '#0B6BCB' }"></div></div>
              <span class="text-xs font-semibold">{{ detallePct }}% pagado</span>
            </div>
          </div>

          <div class="apm-section">
            <span class="apm-sec-title">Historial de pagos realizados</span>
            <div class="apm-box overflow-hidden">
              <div class="apm-hist-row apm-items-head">
                <span>Abono</span><span class="text-right">Monto</span><span class="text-right">Saldo</span><span></span>
              </div>
              <div class="max-h-64 overflow-y-auto">
                <div v-for="abono in selectedApartado.abonos" :key="abono.id" class="apm-hist-row apm-hist-line">
                  <div class="flex flex-col min-w-0">
                    <span class="font-bold">Abono #{{ abono.numero_abono }}</span>
                    <span class="text-xs apm-muted truncate">{{ formatDate(abono.created_at) }} · {{ abono.payment_method }}</span>
                  </div>
                  <span class="text-right text-[15px] font-bold tabular-nums">{{ formatCurrency(abono.monto) }}</span>
                  <span class="text-right apm-muted tabular-nums">{{ formatCurrency(abono.saldo_nuevo) }}</span>
                  <div class="apm-seg justify-self-end">
                    <button title="Descargar imagen del abono" aria-label="Descargar imagen del abono" @click="descargarComprobanteImagen(selectedApartado, abono)"><i class="pi pi-image"></i></button>
                    <span></span>
                    <button title="Imprimir abono" aria-label="Imprimir abono" @click="imprimirAbono(selectedApartado, abono)"><i class="pi pi-print"></i></button>
                  </div>
                </div>
                <div v-if="!selectedApartado.abonos || selectedApartado.abonos.length === 0" class="px-3 py-4 text-center apm-muted border-t border-[#E5E5E5]">
                  No hay abonos registrados.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="apm-foot flex-wrap">
          <button class="apm-btn-neutral" @click="compartirWhatsApp(selectedApartado)"><i class="pi pi-whatsapp text-xs"></i>WhatsApp</button>
          <button class="apm-btn-neutral" @click="descargarComprobanteImagen(selectedApartado)"><i class="pi pi-image text-xs"></i>Descargar Imagen (PNG)</button>
          <button class="apm-btn-secondary sm:ml-auto" @click="detalleModalVisible = false">Cerrar</button>
          <button class="apm-btn-primary" @click="imprimirComprobante(selectedApartado)"><i class="pi pi-print text-xs"></i>Imprimir Ticket</button>
        </div>
      </div>
    </Dialog>

    <!-- MODAL 4: DEVOLUCIÓN COMPLETA DE APARTADO -->
    <Dialog
      v-model:visible="devolucionModalVisible"
      header="Devolución Completa de Apartado"
      modal
      class="w-full max-w-lg"
    >
      <div v-if="devolucionApartado" class="space-y-4 py-2">
        <div class="bg-rose-50 p-4 rounded-xl border border-rose-200">
          <div class="flex items-center gap-2 text-rose-800 font-bold text-sm mb-1">
            <i class="pi pi-exclamation-triangle text-lg"></i>
            <span>¿Procesar Devolución del Apartado {{ devolucionApartado.codigo_apartado }}?</span>
          </div>
          <p class="text-xs text-rose-700">
            Al confirmar la devolución, los cascos y accesorios apartados se reincorporarán automáticamente al inventario (aumentando su stock disponible).
          </p>
          <div v-if="devolucionApartado.status === 'entregado'" class="mt-2 pt-2 border-t border-rose-200 text-xs text-amber-900 font-bold flex items-center gap-1.5">
            <i class="pi pi-box text-amber-700"></i>
            <span>Apartado figura como <strong>ENTREGADO</strong>: El cliente devuelve los productos físicos para reincorporarlos al stock del inventario.</span>
          </div>
        </div>

        <!-- Resumen del Cliente y Reembolso -->
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-slate-500 font-medium">Cliente:</span>
            <span class="font-bold text-slate-800">{{ devolucionApartado.customer_name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 font-medium">Total del Apartado:</span>
            <span class="font-bold text-slate-800">{{ formatCurrency(devolucionApartado.total) }}</span>
          </div>
          <div class="flex justify-between items-center border-t border-slate-200 pt-2 text-sm">
            <span class="font-bold text-slate-700">Dinero a Reembolsar al Cliente:</span>
            <span class="font-black text-emerald-700 text-base">
              {{ formatCurrency(devolucionApartado.total_abonado) }}
            </span>
          </div>
        </div>

        <!-- Productos que vuelven al inventario -->
        <div>
          <label class="text-xs font-bold text-slate-700 uppercase block mb-1.5">
            📦 Productos que reingresan al stock (+ Stock):
          </label>
          <div class="bg-slate-50 rounded-xl border border-slate-200 p-2.5 space-y-1.5 max-h-36 overflow-y-auto">
            <div
              v-for="it in (devolucionApartado.items || [])"
              :key="it.id || it.product_id"
              class="flex justify-between items-center text-xs bg-white p-2 rounded-lg border border-slate-100"
            >
              <div class="font-bold text-slate-700 truncate max-w-[280px]">
                • {{ it.product_name }}
              </div>
              <span class="font-bold text-emerald-700 shrink-0 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                +{{ it.qty }} al stock
              </span>
            </div>
            <div v-if="!devolucionApartado.items || devolucionApartado.items.length === 0" class="text-xs text-slate-400 italic">
              Casco / Accesorio registrado
            </div>
          </div>
        </div>

        <!-- Motivo de la Devolución -->
        <div>
          <label class="text-xs font-bold text-slate-700 uppercase block mb-1">Motivo de la Devolución</label>
          <Select
            v-model="devolucionMotivoPreset"
            :options="motivosDevolucionOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full text-xs mb-2"
          />
          <InputText
            v-if="devolucionMotivoPreset === 'otro'"
            v-model="devolucionMotivoCustom"
            placeholder="Escribe el motivo de la devolución..."
            class="w-full text-xs"
          />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="devolucionModalVisible = false" />
        <Button
          label="Confirmar Devolución y Reingresar Stock"
          icon="pi pi-undo"
          severity="danger"
          :loading="isSaving"
          @click="handleEjecutarDevolucion"
          class="!font-bold !px-4"
        />
      </template>
    </Dialog>

    <!-- Confirm Dialog -->
    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { 
  listApartados, 
  crearApartado, 
  actualizarApartado, 
  registrarAbono, 
  cancelarApartado, 
  marcarEntregado,
  extractPlazos,
  cleanNotas
} from '../services/apartados'
import { getProductos } from '../services/productos'
import { formatCurrency } from '../utils/calculations'
import { handleError, showSuccess, showWarning } from '../utils/errorHandler'
import { useBusinessStore } from '../stores/businessStore'
import { useConfirm } from 'primevue/useconfirm'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import ConfirmDialog from 'primevue/confirmdialog'
import ReceiptAbonoTicket from '../components/sales/ReceiptAbonoTicket.vue'
import ApartadoDigitalVoucher from '../components/sales/ApartadoDigitalVoucher.vue'
import { downloadElementAsImage } from '../utils/downloadImage'
import { formatDateTime, formatDateOnly as formatDateOnlyHelper, getLocalDateString } from '../utils/dateUtils'

const businessStore = useBusinessStore()
const confirm = useConfirm()

const digitalVoucherRef = ref(null)
const voucherData = ref({
  apartado: null,
  abono: null,
  items: []
})

const apartados = ref([])
const productosList = ref([])
const isLoading = ref(false)
const isSaving = ref(false)

const searchQuery = ref('')
const statusFilter = ref('all')

const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Activos', value: 'activo' },
  { label: 'Liquidados (Listos para entregar)', value: 'liquidado' },
  { label: 'Entregados', value: 'entregado' },
  { label: 'Cancelados', value: 'cancelado' },
]

const paymentOptions = [
  { label: 'Efectivo', value: 'efectivo' },
  { label: 'Tarjeta', value: 'tarjeta' },
  { label: 'Transferencia', value: 'transferencia' },
]

// Modal Nuevo / Editar
const nuevoModalVisible = ref(false)
const isEditMode = ref(false)
const editingApartado = ref(null)
const selectedProduct = ref(null)
const nuevoForm = ref({
  customerName: '',
  customerPhone: '',
  fechaLimite: '',
  numeroPlazos: 3,
  paymentMethod: 'efectivo',
  primaMonto: 0,
  notas: '',
  items: []
})

// Modal Abono
const abonoModalVisible = ref(false)
const selectedApartado = ref(null)
const abonoForm = ref({
  monto: 0,
  paymentMethod: 'efectivo',
  amountReceived: 0
})

// Modal Detalle
const detalleModalVisible = ref(false)

// Modal Devolución Completa
const devolucionModalVisible = ref(false)
const devolucionApartado = ref(null)
const devolucionMotivoPreset = ref('Desistimiento / Cancelación voluntaria del cliente')
const devolucionMotivoCustom = ref('')

const motivosDevolucionOptions = [
  { label: 'Desistimiento / Cancelación voluntaria del cliente', value: 'Desistimiento / Cancelación voluntaria del cliente' },
  { label: 'Cliente no pudo continuar con los pagos', value: 'Cliente no pudo continuar con los pagos' },
  { label: 'Cambio de opinión / Solicitó reembolso', value: 'Cambio de opinión / Solicitó reembolso' },
  { label: 'Vencimiento de fecha límite de apartado', value: 'Vencimiento de fecha límite de apartado' },
  { label: 'Otro motivo (especificar)', value: 'otro' },
]

// Estado para impresión térmica
const printData = ref({
  apartado: null,
  abono: null,
  items: []
})

const fetchApartados = async () => {
  try {
    isLoading.value = true
    const res = await listApartados({ status: statusFilter.value })
    apartados.value = res.map(a => {
      const plazos = extractPlazos(a)
      return {
        ...a,
        numero_plazos: plazos
      }
    })
  } catch (err) {
    handleError(err)
  } finally {
    isLoading.value = false
  }
}

const fetchProductos = async () => {
  try {
    const res = await getProductos({ limit: 200 })
    productosList.value = res.data || []
  } catch (err) {
    console.warn('Error al cargar productos:', err)
  }
}

onMounted(() => {
  businessStore.fetchSettings()
  fetchApartados()
  fetchProductos()
})

const stats = computed(() => {
  const total = apartados.value.length
  const totalAbonado = apartados.value.reduce((acc, a) => acc + Number(a.total_abonado || 0), 0)
  const saldoPendiente = apartados.value.filter(a => a.status === 'activo').reduce((acc, a) => acc + Number(a.saldo_pendiente || 0), 0)
  const activos = apartados.value.filter(a => a.status === 'activo').length
  return { total, totalAbonado, saldoPendiente, activos }
})

const filteredApartados = computed(() => {
  let list = apartados.value
  if (statusFilter.value !== 'all') {
    list = list.filter(a => a.status === statusFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(a =>
      a.customer_name?.toLowerCase().includes(q) ||
      a.codigo_apartado?.toLowerCase().includes(q) ||
      a.customer_phone?.toLowerCase().includes(q)
    )
  }
  return list
})

const nuevoTotal = computed(() => {
  return nuevoForm.value.items.reduce((sum, item) => sum + (Number(item.qty || 1) * Number(item.unit_price || 0)), 0)
})

const openNuevoApartadoModal = () => {
  isEditMode.value = false
  editingApartado.value = null
  const nextMonth = new Date()
  nextMonth.setDate(nextMonth.getDate() + 30)

  nuevoForm.value = {
    customerName: '',
    customerPhone: '',
    fechaEmision: getLocalDateString(new Date()),
    fechaLimite: getLocalDateString(nextMonth),
    numeroPlazos: 3,
    paymentMethod: 'efectivo',
    primaMonto: 0,
    notas: '',
    items: []
  }
  selectedProduct.value = null
  nuevoModalVisible.value = true
}

const openEditarModal = (apartado) => {
  isEditMode.value = true
  editingApartado.value = apartado

  const plazos = extractPlazos(apartado)
  nuevoForm.value = {
    customerName: apartado.customer_name || '',
    customerPhone: apartado.customer_phone || '',
    fechaEmision: getLocalDateString(apartado.created_at || new Date()),
    fechaLimite: apartado.fecha_limite || '',
    numeroPlazos: plazos,
    paymentMethod: 'efectivo',
    primaMonto: Number(apartado.total_abonado || 0),
    notas: cleanNotas(apartado.notas),
    items: (apartado.items || []).map(i => ({
      product_id: i.product_id,
      product_name: i.product_name,
      qty: Number(i.qty || 1),
      unit_price: Number(i.unit_price || 0)
    }))
  }
  selectedProduct.value = null
  nuevoModalVisible.value = true
}

const addItemToNuevo = () => {
  if (!selectedProduct.value) return
  const prod = selectedProduct.value
  const price = Number(prod.precio || prod.precio_taller || prod.costo || 0)
  
  nuevoForm.value.items.push({
    product_id: prod.id,
    product_name: `${prod.nombre}${prod.talla ? ' (Talla: ' + prod.talla + ')' : ''}`,
    qty: 1,
    unit_price: price
  })
  selectedProduct.value = null
}

const removeItemFromNuevo = (idx) => {
  nuevoForm.value.items.splice(idx, 1)
}

const handleGuardarApartado = async () => {
  if (!nuevoForm.value.customerName?.trim()) {
    showWarning('Ingresa el nombre del cliente')
    return
  }
  if (nuevoForm.value.items.length === 0) {
    showWarning('Agrega al menos un casco o accesorio al apartado')
    return
  }
  if (nuevoTotal.value <= 0) {
    showWarning('El monto total del apartado debe ser mayor a 0')
    return
  }

  const invalidPriceItem = nuevoForm.value.items.find(i => !i.unit_price || Number(i.unit_price) <= 0)
  if (invalidPriceItem) {
    showWarning(`El producto "${invalidPriceItem.product_name}" tiene un precio de C$0.00. Ingresa un precio válido.`)
    return
  }

  try {
    isSaving.value = true
    const sanitizedItems = nuevoForm.value.items.map(i => ({
      product_id: i.product_id,
      product_name: i.product_name,
      qty: Number(i.qty || 1),
      unit_price: Number(i.unit_price || 0)
    }))

    if (isEditMode.value && editingApartado.value) {
      // 1. Modo Edición
      await actualizarApartado({
        apartadoId: editingApartado.value.id,
        customerName: nuevoForm.value.customerName.trim(),
        customerPhone: nuevoForm.value.customerPhone?.trim() || null,
        fechaEmision: nuevoForm.value.fechaEmision || null,
        fechaLimite: nuevoForm.value.fechaLimite || null,
        numeroPlazos: Number(nuevoForm.value.numeroPlazos || 3),
        notas: nuevoForm.value.notas?.trim() || null,
        items: sanitizedItems
      })

      localStorage.setItem(`apt_plazos_${editingApartado.value.id}`, String(nuevoForm.value.numeroPlazos || 3))

      showSuccess('Apartado actualizado y stock ajustado correctamente')
      nuevoModalVisible.value = false
      await fetchApartados()
    } else {
      // 2. Modo Creación
      const result = await crearApartado({
        customerId: null,
        customerName: nuevoForm.value.customerName.trim(),
        customerPhone: nuevoForm.value.customerPhone?.trim() || null,
        fechaEmision: nuevoForm.value.fechaEmision || null,
        fechaLimite: nuevoForm.value.fechaLimite || null,
        numeroPlazos: Number(nuevoForm.value.numeroPlazos || 3),
        notas: nuevoForm.value.notas?.trim() || null,
        items: sanitizedItems,
        primaMonto: Number(nuevoForm.value.primaMonto || 0),
        paymentMethod: nuevoForm.value.paymentMethod || 'efectivo',
        amountReceived: Number(nuevoForm.value.primaMonto || 0),
        changeGiven: 0
      })

      // Guardar localmente la configuración de plazos si la base de datos devuelve el apartado
      if (result) {
        if (typeof result === 'object') {
          result.numero_plazos = Number(nuevoForm.value.numeroPlazos || 3)
        }
        localStorage.setItem(`apt_plazos_${result?.id || result}`, String(nuevoForm.value.numeroPlazos || 3))
      }

      showSuccess('Apartado creado y casco reservado con éxito')
      nuevoModalVisible.value = false
      await fetchApartados()

      // Si hubo prima, imprimir recibo
      if (Number(nuevoForm.value.primaMonto) > 0) {
        printData.value = {
          apartado: result,
          abono: {
            monto: Number(nuevoForm.value.primaMonto),
            saldo_anterior: Number(result.total || nuevoTotal.value),
            saldo_nuevo: Number(result.saldo_pendiente ?? (Number(result.total || nuevoTotal.value) - Number(nuevoForm.value.primaMonto))),
            payment_method: nuevoForm.value.paymentMethod,
            amount_received: Number(nuevoForm.value.primaMonto),
            change_given: 0,
            numero_abono: 1,
            is_prima: true,
            created_at: result.created_at || new Date()
          },
          items: sanitizedItems
        }
        await nextTick()
        window.print()
      }
    }
  } catch (err) {
    handleError(err, 'Error al guardar el apartado')
  } finally {
    isSaving.value = false
  }
}

const openAbonarModal = (apartado) => {
  selectedApartado.value = apartado
  abonoForm.value = {
    monto: Math.min(500, apartado.saldo_pendiente),
    paymentMethod: 'efectivo',
    amountReceived: Math.min(500, apartado.saldo_pendiente),
    fechaAbono: getLocalDateString(new Date())
  }
  abonoModalVisible.value = true
}

const handleGuardarAbono = async () => {
  try {
    isSaving.value = true
    const apt = selectedApartado.value
    const monto = Number(abonoForm.value.monto)
    const amountReceived = Number(abonoForm.value.amountReceived || monto)
    const changeGiven = Math.max(0, amountReceived - monto)

    const result = await registrarAbono({
      apartadoId: apt.id,
      monto,
      paymentMethod: abonoForm.value.paymentMethod,
      amountReceived,
      changeGiven,
      fechaAbono: abonoForm.value.fechaAbono || null
    })

    showSuccess('Abono registrado exitosamente')
    abonoModalVisible.value = false
    await fetchApartados()

    const abonoTarget = { 
      ...result.abono,
      amount_received: amountReceived,
      change_given: changeGiven
    }
    if (abonoForm.value.fechaAbono) {
      abonoTarget.created_at = abonoForm.value.fechaAbono
    }

    // Imprimir Comprobante de Abono
    printData.value = {
      apartado: result.apartado,
      abono: abonoTarget,
      items: apt.items || []
    }
    await nextTick()
    window.print()
  } catch (err) {
    handleError(err)
  } finally {
    isSaving.value = false
  }
}

const openDetalleModal = (apartado) => {
  selectedApartado.value = apartado
  detalleModalVisible.value = true
}

const imprimirComprobante = async (apartado) => {
  if (!apartado) return
  printData.value = {
    apartado,
    abono: null,
    items: apartado.items || []
  }
  await nextTick()
  window.print()
}

const imprimirAbono = async (apartado, abono) => {
  if (!apartado || !abono) return
  printData.value = {
    apartado,
    abono,
    items: apartado.items || []
  }
  await nextTick()
  window.print()
}

const descargarComprobanteImagen = async (apartado, abono = null) => {
  if (!apartado) return
  try {
    voucherData.value = {
      apartado,
      abono,
      items: apartado.items || []
    }
    await nextTick()
    
    // Pequeña pausa para asegurar el renderizado de estilos y fuentes
    await new Promise((resolve) => setTimeout(resolve, 150))
    
    const voucherEl = digitalVoucherRef.value?.voucherRef || digitalVoucherRef.value?.$el
    if (!voucherEl) {
      throw new Error('No se pudo encontrar el comprobante para generar la imagen')
    }

    const tipoDoc = abono ? 'RECIBO_ABONO' : 'COMPROBANTE_APARTADO'
    const cod = (apartado.codigo_apartado || 'MT').replace(/[^a-zA-Z0-9-_]/g, '')
    const cliente = (apartado.customer_name || 'cliente').replace(/\s+/g, '_')
    const fileName = `${tipoDoc}_${cod}_${cliente}.png`

    await downloadElementAsImage(voucherEl, fileName)
  } catch (err) {
    handleError(err, 'Error al generar imagen del comprobante')
  }
}

const compartirWhatsApp = (apartado) => {
  if (!apartado) return
  const phone = (apartado.customer_phone || '').replace(/[^0-9]/g, '')
  const itemsList = (apartado.items || [])
    .map(i => `• ${i.product_name} (x${i.qty}) - ${formatCurrency(i.line_total || i.unit_price * i.qty)}`)
    .join('\n')
  
  const msg = `*🏍️ JY G MOTOTECH - COMPROBANTE DE APARTADO*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📌 *Apartado:* #${apartado.codigo_apartado}\n` +
    `👤 *Cliente:* ${apartado.customer_name}\n` +
    (apartado.fecha_limite ? `📅 *Fecha Límite:* ${formatDateOnly(apartado.fecha_limite)}\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📦 *Producto(s) Reservado(s):*\n${itemsList || '• Casco / Accesorio'}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 *Precio Total:* ${formatCurrency(apartado.total)}\n` +
    `💵 *Total Abonado:* ${formatCurrency(apartado.total_abonado)}\n` +
    `⚠️ *SALDO PENDIENTE (DEUDA):* ${formatCurrency(apartado.saldo_pendiente)}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    (Number(apartado.saldo_pendiente) <= 0 
      ? `🎉 *¡PRODUCTO LIQUIDADO AL 100%!* Puede pasar a retirarlo.\n` 
      : `Conserve este comprobante para realizar sus próximos abonos o retirar su producto.\n`) +
    `¡Gracias por su preferencia en JyG MotoTech!`

  const cleanPhone = phone.startsWith('505') ? phone : (phone.length === 8 ? `505${phone}` : phone)
  const url = cleanPhone.length >= 8 
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`

  window.open(url, '_blank')
}

const confirmarEntrega = (apartado) => {
  confirm.require({
    message: `¿Confirmar entrega de los productos a ${apartado.customer_name}?`,
    header: 'Entregar Casco / Accesorio',
    icon: 'pi pi-check-circle',
    acceptLabel: 'Sí, entregar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        await marcarEntregado(apartado.id)
        showSuccess('Apartado finalizado y productos entregados al cliente')
        await fetchApartados()
      } catch (err) {
        handleError(err)
      }
    }
  })
}

const openDevolucionModal = (apartado) => {
  devolucionApartado.value = apartado
  devolucionMotivoPreset.value = 'Desistimiento / Cancelación voluntaria del cliente'
  devolucionMotivoCustom.value = ''
  devolucionModalVisible.value = true
}

const handleEjecutarDevolucion = async () => {
  if (!devolucionApartado.value) return
  const motivo = devolucionMotivoPreset.value === 'otro' 
    ? (devolucionMotivoCustom.value?.trim() || 'Otro motivo')
    : devolucionMotivoPreset.value

  try {
    isSaving.value = true
    await cancelarApartado(devolucionApartado.value.id, motivo)
    showSuccess('Devolución procesada con éxito y stock reincorporado al inventario')
    devolucionModalVisible.value = false
    await fetchApartados()
  } catch (err) {
    handleError(err, 'Error al procesar la devolución')
  } finally {
    isSaving.value = false
  }
}

const confirmarCancelar = (apartado) => {
  openDevolucionModal(apartado)
}

const getStatusLabel = (st) => ({
  activo: 'Activo (En pagos)',
  liquidado: 'Listo para entregar',
  entregado: 'Entregado',
  cancelado: 'Cancelado / Devuelto'
}[st] || st)

const getStatusSeverity = (st) => ({
  activo: 'info',
  liquidado: 'success',
  entregado: 'secondary',
  cancelado: 'danger'
}[st] || 'info')

const getProgressColor = (data) => {
  const pct = (data.total_abonado / (data.total || 1)) * 100
  if (pct >= 100) return 'bg-emerald-500'
  if (pct >= 50) return 'bg-blue-500'
  return 'bg-amber-500'
}

const formatDate = (ds) => formatDateTime(ds)
const formatDateOnly = (ds) => formatDateOnlyHelper(ds)

// ---- Plan Separe: modales (diseño 4a–4d) ----
const apmPt = {
  root: { style: 'border:0;border-radius:4px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.25)' },
  content: { style: 'padding:0' }
}

const pctOf = (paid, total) => Math.max(0, Math.min(100, Math.round((Number(paid || 0) / (Number(total) || 1)) * 100)))

const primaExcede = computed(() => Number(nuevoForm.value.primaMonto || 0) > nuevoTotal.value)

const nuevoSaldoRestante = computed(() => Math.max(0, nuevoTotal.value - (isEditMode.value
  ? Number(editingApartado.value?.total_abonado || 0)
  : Number(nuevoForm.value.primaMonto || 0))))

const editPct = computed(() => pctOf(editingApartado.value?.total_abonado, nuevoTotal.value))

const nuevoHint = computed(() => {
  const faltaCliente = !nuevoForm.value.customerName
  const faltaProducto = nuevoForm.value.items.length === 0
  if (faltaCliente && faltaProducto) return 'Agrega el cliente y al menos un producto'
  if (faltaCliente) return 'Falta el nombre del cliente'
  if (faltaProducto) return 'Agrega al menos un producto'
  return ''
})

const abonoExcede = computed(() =>
  Number(abonoForm.value.monto || 0) > Number(selectedApartado.value?.saldo_pendiente || 0) + 0.001)

const abonoPct = computed(() => {
  const a = selectedApartado.value
  if (!a) return { now: 0, after: 0 }
  const paid = Number(a.total_abonado || 0)
  return { now: pctOf(paid, a.total), after: pctOf(paid + Number(abonoForm.value.monto || 0), a.total) }
})

const detallePct = computed(() => pctOf(selectedApartado.value?.total_abonado, selectedApartado.value?.total))

// ---- Plan Separe: vista de lista (diseño 3a escritorio / 3b móvil) ----
const SOON_DAYS = 14

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
}

const countLabel = computed(() => {
  if (isLoading.value) return 'Cargando…'
  const n = filteredApartados.value.length
  return n + (n === 1 ? ' apartado' : ' apartados')
})

const daysUntil = (ds) => {
  if (!ds) return null
  const [y, m, d] = String(ds).slice(0, 10).split('-').map(Number)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((new Date(y, m - 1, d) - today) / 86400000)
}

const rowsView = computed(() => filteredApartados.value.map(a => {
  const total = Number(a.total || 0)
  const paid = Number(a.total_abonado || 0)
  const saldo = Math.max(0, Number(a.saldo_pendiente ?? total - paid))
  const pct = Math.min(100, Math.round((paid / (total || 1)) * 100))
  const enPagos = a.status === 'activo'
  const days = daysUntil(a.fecha_limite)
  const isSoon = enPagos && days !== null && days <= SOON_DAYS

  let dueHint = ''
  if (a.status === 'cancelado') dueHint = 'Devuelto'
  else if (a.status === 'entregado') dueHint = 'Entregado al cliente'
  else if (saldo <= 0) dueHint = 'Pagado en su totalidad'
  else if (days === null) dueHint = ''
  else if (days < 0) dueHint = 'Vencido hace ' + (-days) + ' días'
  else if (days === 0) dueHint = '⚑ Vence hoy'
  else dueHint = (isSoon ? '⚑ Vence en ' : 'en ') + days + ' días'

  const products = (a.items || []).map(i => i.product_name + (Number(i.qty) > 1 ? ` (x${i.qty})` : ''))
  const more = products.length - 2

  const acts = [
    { key: 'comprobante', label: 'Descargar comprobante de pago', icon: 'pi pi-image', run: () => descargarComprobanteImagen(a) },
    { key: 'imprimir', label: 'Imprimir', icon: 'pi pi-print', run: () => imprimirComprobante(a) },
    { key: 'whatsapp', label: 'Enviar mensaje de WhatsApp', icon: 'pi pi-whatsapp', run: () => compartirWhatsApp(a) },
    (a.status === 'activo' || a.status === 'liquidado') && { key: 'editar', label: 'Editar', icon: 'pi pi-pencil', group: 1, run: () => openEditarModal(a) },
    a.status === 'activo' && { key: 'abono', label: 'Registrar abono', icon: 'pi pi-plus-circle', group: 2, run: () => openAbonarModal(a) },
    a.status === 'liquidado' && { key: 'entregar', label: 'Entregar producto al cliente', icon: 'pi pi-check-circle', group: 2, run: () => confirmarEntrega(a) },
    { key: 'historial', label: 'Ver historial de abonos', icon: 'pi pi-eye', group: 2, run: () => openDetalleModal(a) },
    a.status !== 'cancelado' && { key: 'devolucion', label: 'Devolución completa', icon: 'pi pi-undo', group: 3, danger: true, run: () => openDevolucionModal(a) }
  ].filter(Boolean)
  // Separador visual al cambiar de grupo: comprobante·imprimir·WhatsApp | editar | abono·historial | devolución
  acts.forEach((act, i) => { act.sep = i > 0 && (act.group || 0) !== (acts[i - 1].group || 0) })

  return {
    id: a.id,
    code: a.codigo_apartado,
    client: a.customer_name,
    phone: a.customer_phone,
    products,
    moreLabel: more > 0 ? `+${more} producto${more > 1 ? 's' : ''}` : '',
    total, paid, saldo, pct,
    issued: a.created_at ? formatDateOnly(a.created_at) : '—',
    due: a.fecha_limite ? formatDateOnly(a.fecha_limite) : '—',
    dueHint,
    dueColor: isSoon || (days !== null && days < 0 && enPagos) ? '#B45309' : '#5C5C5C',
    dueWeight: isSoon ? 700 : 400,
    saldoColor: saldo <= 0 ? '#706E6B' : '#181818',
    barColor: saldo <= 0 ? '#2E844A' : '#0B6BCB',
    statusLabel: getStatusLabel(a.status),
    pillClass: 'ap-pill-' + (a.status || 'entregado'),
    acts
  }
}))
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&display=swap');

/* Plan Separe v3 — módulo empresarial claro (estilo Lightning), acotado a esta vista */
.ap {
  --ap-bg: #F3F3F3;
  --ap-line: #E5E5E5;
  --ap-field: #C9C9C9;
  --ap-text: #181818;
  --ap-muted: #5C5C5C;
  --ap-icon: #706E6B;
  --ap-blue: #0B6BCB;
  --ap-blue-h: #0A5BAD;
  --ap-blue-a: #084B8E;
  --ap-blue-soft: #E3EEFA;
  --ap-row-h: #F3F8FD;
  font: 13px/1.45 "Barlow", system-ui, sans-serif;
  color: var(--ap-text);
}
.ap-muted { color: var(--ap-muted); }
.ap-icon { color: var(--ap-icon); }
.ap-blue { color: var(--ap-blue); }

.ap-panel { background: #fff; border: 1px solid var(--ap-line); border-radius: 4px; box-shadow: 0 2px 2px rgba(0, 0, 0, .05); }
.ap-badge { width: 32px; height: 32px; flex: none; border-radius: 4px; background: var(--ap-blue); color: #fff; display: flex; align-items: center; justify-content: center; }
.ap-eyebrow { font-size: 10px; letter-spacing: .04em; text-transform: uppercase; color: var(--ap-muted); }
.ap-title { font-size: 17px; font-weight: 700; line-height: 1.25; }
.ap-desc { font-size: 13px; color: var(--ap-muted); padding-left: 14px; margin-left: 2px; border-left: 1px solid var(--ap-line); }
@media (min-width: 768px) { .ap-eyebrow { font-size: 11px; } .ap-title { font-size: 18px; } }

.ap-kpis { border-top: 1px solid var(--ap-line); }
.ap-kpi { padding: 8px 12px; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.ap-kpi:nth-child(even) { border-left: 1px solid var(--ap-line); }
.ap-kpi:nth-child(-n+2) { border-bottom: 1px solid var(--ap-line); }
@media (min-width: 768px) {
  .ap-kpi { padding: 10px 16px; }
  .ap-kpi + .ap-kpi { border-left: 1px solid var(--ap-line); }
  .ap-kpi:nth-child(-n+2) { border-bottom: 0; }
}
.ap-kpi-l { font-size: 11px; color: var(--ap-muted); }
.ap-kpi-v { font-size: 16px; font-weight: 700; overflow-wrap: anywhere; }
@media (min-width: 768px) { .ap-kpi-v { font-size: 18px; } }

.ap-btn-primary {
  height: 32px; padding: 0 14px; display: flex; align-items: center; justify-content: center; gap: 6px;
  background: var(--ap-blue); color: #fff; border: 1px solid var(--ap-blue); border-radius: 4px;
  font: 600 13px "Barlow", system-ui, sans-serif; cursor: pointer;
}
.ap-btn-primary:hover { background: var(--ap-blue-h); border-color: var(--ap-blue-h); }
.ap-btn-primary:active { background: var(--ap-blue-a); }
.ap-btn-lg { height: 44px; font-size: 14px; }
.ap-btn-secondary {
  height: 32px; padding: 0 14px; border: 1px solid var(--ap-field); border-radius: 4px; background: #fff;
  color: var(--ap-blue); font: 600 13px "Barlow", system-ui, sans-serif; cursor: pointer;
}
.ap-btn-secondary:hover { background: var(--ap-bg); }

.ap-toolbar { padding: 10px 12px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--ap-line); }
@media (min-width: 768px) { .ap-toolbar { padding: 10px 16px; } }
.ap-input {
  width: 100%; height: 44px; padding: 0 10px; border: 1px solid var(--ap-field); border-radius: 4px;
  background: #fff; font: 14px "Barlow", system-ui, sans-serif; color: var(--ap-text); outline: none;
}
.ap-input.pl-8 { padding-left: 30px; }
.ap-input.pr-7 { padding-right: 26px; }
.ap-input:focus { border-color: var(--ap-blue); box-shadow: 0 0 0 1px var(--ap-blue); }
@media (min-width: 768px) { .ap-input { height: 32px; font-size: 13px; } }

.ap-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.ap-table th { background: var(--ap-bg); text-align: left; font-size: 11px; font-weight: 700; color: var(--ap-muted); padding: 7px 8px; }
.ap-table td { padding: 9px 8px; border-top: 1px solid var(--ap-line); vertical-align: middle; }
.ap-table tbody tr:hover { background: var(--ap-row-h); }
.ap-code { color: var(--ap-blue); font-weight: 600; }

.ap-pill { display: inline-flex; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; line-height: 1.35; max-width: 100%; }
.ap-pill-activo { background: var(--ap-blue-soft); color: #08467F; }
.ap-pill-liquidado { background: #E6F2EA; color: #1F5C33; }
.ap-pill-entregado { background: #EDEDED; color: #444; }
.ap-pill-cancelado { background: #FBE9E7; color: #8C2A1E; }

.ap-bar { height: 6px; background: var(--ap-line); border-radius: 3px; overflow: hidden; }
.ap-bar > div { height: 100%; border-radius: 3px; transition: width .3s; }

.ap-actions { display: inline-flex; border: 1px solid var(--ap-field); border-radius: 4px; overflow: hidden; background: #fff; }
.ap-sep { width: 1px; background: var(--ap-field); }
.ap-act {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border: 0; background: transparent; color: var(--ap-muted); cursor: pointer; font-size: 13px;
}
.ap-act:hover { background: var(--ap-bg); color: var(--ap-blue); }
.ap-act:active { background: var(--ap-blue-soft); }
.ap-act:focus-visible, .ap-act-m:focus-visible { outline: 2px solid var(--ap-blue); outline-offset: -2px; }
.ap-act-danger:hover { background: #FBE9E7; color: #BA0517; }

.ap-rec { background: #fff; border: 1px solid var(--ap-line); border-radius: 4px; box-shadow: 0 2px 2px rgba(0, 0, 0, .05); min-width: 0; }
.ap-rec-acts { display: flex; border-top: 1px solid var(--ap-line); }
.ap-act-m {
  flex: 1; height: 44px; display: flex; align-items: center; justify-content: center;
  border: 0; background: transparent; color: var(--ap-muted); cursor: pointer; font-size: 15px;
}
.ap-act-m:hover, .ap-act-m:active { background: var(--ap-blue-soft); color: var(--ap-blue); }

.ap-empty { padding: 40px 16px; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; border-top: 1px solid var(--ap-line); }

@keyframes ap-sk { 0%, 100% { opacity: .45; } 50% { opacity: 1; } }
.ap-sk { animation: ap-sk 1.4s ease-in-out infinite; background: #EDEDED; border-radius: 2px; }
/* ---- Modales Plan Separe (diseño 4a–4d) ---- */
.apm { font: 13px/1.45 "Barlow", system-ui, sans-serif; color: #181818; background: #fff; display: flex; flex-direction: column; }
.apm-muted { color: #5C5C5C; }
.apm-blue { color: #0B6BCB; }
.apm-head { padding: 14px 16px 14px 20px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #E5E5E5; }
.apm-eyebrow { font-size: 11px; letter-spacing: .04em; text-transform: uppercase; color: #5C5C5C; }
.apm-title { font-size: 18px; font-weight: 700; line-height: 1.25; }
.apm-close {
  margin-left: auto; width: 32px; height: 32px; flex: none; display: flex; align-items: center; justify-content: center;
  border: 1px solid transparent; border-radius: 4px; background: transparent; color: #5C5C5C; cursor: pointer;
}
.apm-close:hover { background: #F3F3F3; border-color: #C9C9C9; }
.apm-body { padding: 16px 20px 20px; display: flex; flex-direction: column; gap: 18px; }
.apm-foot { padding: 12px 20px; display: flex; align-items: center; gap: 8px; background: #F3F3F3; border-top: 1px solid #E5E5E5; }

.apm-section { display: flex; flex-direction: column; gap: 8px; }
.apm-sep { padding-top: 16px; border-top: 1px solid #E5E5E5; }
.apm-sec-title { font-size: 12px; font-weight: 700; }
.apm-field { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.apm-lbl { font-size: 12px; color: #5C5C5C; }
.apm-lbl-strong { color: #181818; font-weight: 600; }
.apm-req { color: #BA0517; }
.apm-error { font-size: 12px; color: #BA0517; }

.apm-input {
  width: 100%; min-width: 0; height: 32px; padding: 0 10px; border: 1px solid #C9C9C9; border-radius: 4px;
  background: #fff; font: inherit; font-size: 13px; color: #181818; outline: none;
}
.apm-input:focus { border-color: #0B6BCB; box-shadow: 0 0 0 1px #0B6BCB; }
.apm-input[type="date"] { padding: 0 8px; }
.apm-input-lg { height: 42px; padding-left: 40px; font-size: 18px; font-weight: 700; }
.apm-select { appearance: none; padding-right: 28px; cursor: pointer; }
.apm-chev { position: absolute; right: 9px; font-size: 10px; color: #706E6B; pointer-events: none; }

.apm-pselect { height: 32px; border-color: #C9C9C9 !important; border-radius: 4px !important; box-shadow: none !important; }
.apm-pselect :deep(.p-select-label) { padding: 0 10px; display: flex; align-items: center; font-size: 13px; }
.apm-pselect.p-focus { border-color: #0B6BCB !important; box-shadow: 0 0 0 1px #0B6BCB !important; }

.apm-btn-primary, .apm-btn-secondary, .apm-btn-neutral {
  height: 32px; padding: 0 14px; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  border-radius: 4px; font: 600 13px "Barlow", system-ui, sans-serif; cursor: pointer; white-space: nowrap;
}
.apm-btn-primary { background: #0B6BCB; color: #fff; border: 1px solid #0B6BCB; }
.apm-btn-primary:hover:not(:disabled) { background: #0A5BAD; border-color: #0A5BAD; }
.apm-btn-primary:active:not(:disabled) { background: #084B8E; }
.apm-btn-primary:disabled { background: #C9C9C9; border-color: #C9C9C9; color: #fff; cursor: not-allowed; }
.apm-btn-secondary { background: #fff; color: #0B6BCB; border: 1px solid #C9C9C9; }
.apm-btn-secondary:hover:not(:disabled) { background: #F3F3F3; }
.apm-btn-secondary:disabled { color: #A0A0A0; cursor: not-allowed; }
.apm-btn-neutral { padding: 0 12px; background: #fff; color: #181818; border: 1px solid #C9C9C9; }
.apm-btn-neutral:hover { background: #F3F3F3; color: #0B6BCB; }

.apm-box { border: 1px solid #E5E5E5; border-radius: 4px; }
.apm-soft { background: #FAFAF9; }
.apm-empty-dashed { padding: 14px 10px; border: 1px dashed #C9C9C9; border-radius: 4px; text-align: center; color: #5C5C5C; }

.apm-items-row { display: grid; gap: 8px; align-items: center; padding: 8px 10px; grid-template-columns: 64px minmax(0, 1fr) auto 32px; }
.apm-items-line { border-top: 1px solid #E5E5E5; }
.apm-items-line:first-child { border-top: 0; }
.apm-item-desc { grid-column: 1 / -1; }
@media (min-width: 640px) {
  .apm-items-row { grid-template-columns: minmax(0, 1fr) 64px 120px 100px 32px; }
  .apm-item-desc { grid-column: auto; }
  .apm-items-line:first-child { border-top: 1px solid #E5E5E5; }
}
.apm-items-head { padding: 6px 10px; background: #F3F3F3; font-size: 11px; font-weight: 700; color: #5C5C5C; }

.apm-icon-btn {
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  border: 1px solid transparent; border-radius: 4px; background: transparent; color: #5C5C5C; cursor: pointer;
}
.apm-icon-danger:hover { background: #FDECEA; color: #BA0517; border-color: #F3C2C2; }

.apm-cell { padding: 10px 14px; min-width: 0; }
.apm-cells > .apm-cell + .apm-cell { border-top: 1px solid #E5E5E5; }
@media (min-width: 640px) { .apm-cells > .apm-cell + .apm-cell { border-top: 0; border-left: 1px solid #E5E5E5; } }
.apm-cell-l { font-size: 11px; color: #5C5C5C; }
.apm-cell-v { font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; }

.apm-bar { height: 6px; background: #E5E5E5; border-radius: 3px; overflow: hidden; position: relative; }
.apm-bar > div { height: 100%; background: #0B6BCB; transition: width .3s; }
.apm-bar-dual > div { position: absolute; left: 0; top: 0; bottom: 0; }
.apm-bar-dual > .apm-bar-next { background: #9CC3EC; }

.apm-info { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid #C7DDF5; border-radius: 4px; background: #F3F8FD; }
.apm-chip { padding: 2px 8px; border: 1px solid #C9C9C9; border-radius: 4px; background: #fff; color: #0B6BCB; font-weight: 600; font-size: 12px; white-space: nowrap; }

.apm-pill { display: inline-flex; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; white-space: nowrap; }
.apm-pill-activo { background: #E3EEFA; color: #08467F; }
.apm-pill-liquidado { background: #E6F2EA; color: #1F5C33; }
.apm-pill-entregado { background: #EDEDED; color: #444; }
.apm-pill-cancelado { background: #FBE9E7; color: #8C2A1E; }

.apm-hist-row { display: grid; grid-template-columns: minmax(0, 1fr) 96px 96px 60px; gap: 8px; align-items: center; padding: 6px 12px; }
.apm-hist-line { padding: 10px 12px; border-top: 1px solid #E5E5E5; }
.apm-hist-line:hover { background: #F3F8FD; }
@media (max-width: 480px) { .apm-hist-row { grid-template-columns: minmax(0, 1fr) 84px 60px; } .apm-hist-row > :nth-child(3) { display: none; } }
.apm-seg { display: inline-flex; border: 1px solid #C9C9C9; border-radius: 4px; overflow: hidden; }
.apm-seg > span { width: 1px; background: #C9C9C9; }
.apm-seg > button { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: 0; background: #fff; color: #5C5C5C; cursor: pointer; font-size: 12px; }
.apm-seg > button:hover { background: #F3F3F3; color: #0B6BCB; }
</style>
