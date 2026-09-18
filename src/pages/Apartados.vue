<template>
  <div class="p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
    <!-- Ticket Térmico Imprimible Oculto -->
    <ReceiptAbonoTicket
      :apartado="printData.apartado"
      :abono="printData.abono"
      :items="printData.items"
      :business="businessStore.settings"
    />

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

    <!-- Header Principal -->
    <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-700 rounded-2xl p-6 mb-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/30 text-amber-300 font-bold text-xs uppercase tracking-wider">
            🏍️ Plan Separe / Cascos & Accesorios
          </span>
        </div>
        <h1 class="text-2xl md:text-3xl font-black tracking-tight">Sistema de Apartados</h1>
        <p class="text-slate-300 text-sm">Gestiona reservas de cascos y recibe abonos periódicos de los clientes</p>
      </div>

      <div class="flex flex-wrap gap-2 w-full md:w-auto">
        <Button
          label="Nuevo Apartado"
          icon="pi pi-plus"
          class="!bg-amber-600 hover:!bg-amber-700 !border-0 !text-white font-bold !px-5 !py-2.5 !rounded-xl !shadow-lg"
          @click="openNuevoApartadoModal"
        />
      </div>
    </div>

    <!-- Métricas del Sistema -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
      <Card class="bg-white border border-slate-200 shadow-xs">
        <template #title>
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Apartados</span>
        </template>
        <template #content>
          <div class="text-2xl font-black text-slate-800">{{ stats.total }}</div>
        </template>
      </Card>
      <Card class="bg-emerald-50/50 border border-emerald-200 shadow-xs">
        <template #title>
          <span class="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Recaudado</span>
        </template>
        <template #content>
          <div class="text-2xl font-black text-emerald-700">{{ formatCurrency(stats.totalAbonado) }}</div>
        </template>
      </Card>
      <Card class="bg-amber-50/50 border border-amber-200 shadow-xs">
        <template #title>
          <span class="text-xs font-bold text-amber-700 uppercase tracking-wider">Saldo por Cobrar</span>
        </template>
        <template #content>
          <div class="text-2xl font-black text-amber-700">{{ formatCurrency(stats.saldoPendiente) }}</div>
        </template>
      </Card>
      <Card class="bg-blue-50/50 border border-blue-200 shadow-xs">
        <template #title>
          <span class="text-xs font-bold text-blue-700 uppercase tracking-wider">Activos / Pendientes</span>
        </template>
        <template #content>
          <div class="text-2xl font-black text-blue-700">{{ stats.activos }}</div>
        </template>
      </Card>
    </div>

    <!-- Filtros y Búsqueda -->
    <div class="bg-white p-4 rounded-xl shadow-xs border border-slate-200 mb-4 flex flex-col md:flex-row gap-3 justify-between items-center">
      <IconField iconPosition="left" class="w-full md:w-80">
        <InputIcon class="pi pi-search text-slate-400" />
        <InputText v-model="searchQuery" placeholder="Buscar por cliente, código o teléfono..." class="w-full text-sm" />
      </IconField>

      <div class="flex items-center gap-2 w-full md:w-auto">
        <Select
          v-model="statusFilter"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Estado"
          class="w-full md:w-44 text-sm"
        />
      </div>
    </div>

    <!-- Tabla Principal de Apartados -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <DataTable
        :value="filteredApartados"
        :loading="isLoading"
        paginator
        :rows="10"
        stripedRows
        class="p-datatable-sm"
      >
        <template #empty>
          <div class="p-8 text-center text-slate-400">
            <i class="pi pi-inbox text-3xl mb-2 block"></i>
            No hay apartados registrados con los criterios seleccionados.
          </div>
        </template>

        <Column field="codigo_apartado" header="Código" style="width: 110px">
          <template #body="{ data }">
            <span class="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded border border-slate-200">
              {{ data.codigo_apartado }}
            </span>
          </template>
        </Column>

        <Column field="customer_name" header="Cliente">
          <template #body="{ data }">
            <div class="font-bold text-slate-800">{{ data.customer_name }}</div>
            <div class="text-xs text-slate-400" v-if="data.customer_phone">{{ data.customer_phone }}</div>
          </template>
        </Column>

        <Column header="Productos">
          <template #body="{ data }">
            <div class="space-y-0.5 max-w-[200px]">
              <div v-for="item in data.items" :key="item.id" class="text-xs truncate text-slate-700 font-medium">
                • {{ item.product_name }} (x{{ item.qty }})
              </div>
            </div>
          </template>
        </Column>

        <Column header="Progreso de Pago" style="min-width: 180px">
          <template #body="{ data }">
            <div class="space-y-1">
              <div class="flex justify-between text-[11px] font-bold">
                <span class="text-emerald-700">{{ formatCurrency(data.total_abonado) }}</span>
                <span class="text-slate-500">de {{ formatCurrency(data.total) }}</span>
              </div>
              <!-- Barra de progreso -->
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="getProgressColor(data)"
                  :style="{ width: `${Math.min(100, Math.round((data.total_abonado / (data.total || 1)) * 100))}%` }"
                ></div>
              </div>
              <div class="flex justify-between text-[10px] text-slate-400">
                <span>{{ Math.round((data.total_abonado / (data.total || 1)) * 100) }}% pagado</span>
                <span v-if="data.saldo_pendiente > 0" class="font-bold text-amber-700">Resta: {{ formatCurrency(data.saldo_pendiente) }}</span>
                <span v-else class="font-bold text-emerald-600">¡Completado!</span>
              </div>
            </div>
          </template>
        </Column>

        <Column field="fecha_limite" header="Límite" style="width: 110px">
          <template #body="{ data }">
            <span class="text-xs font-semibold text-slate-600" v-if="data.fecha_limite">
              {{ formatDateOnly(data.fecha_limite) }}
            </span>
            <span v-else class="text-xs text-slate-400">—</span>
          </template>
        </Column>

        <Column field="status" header="Estado" style="width: 110px">
          <template #body="{ data }">
            <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" class="text-[10px] uppercase font-bold" />
          </template>
        </Column>

        <Column header="Acciones" style="width: 230px" class="text-right">
          <template #body="{ data }">
            <div class="flex gap-1 justify-end items-center">
              <!-- Botón Descargar Imagen PNG -->
              <Button
                icon="pi pi-image"
                severity="info"
                text
                rounded
                @click="descargarComprobanteImagen(data)"
                title="Descargar Comprobante como Imagen (PNG)"
              />

              <!-- Botón Imprimir Comprobante General / Deuda -->
              <Button
                icon="pi pi-print"
                severity="secondary"
                text
                rounded
                @click="imprimirComprobante(data)"
                title="Imprimir Comprobante de Apartado / Total de Deuda"
              />

              <!-- Botón Enviar WhatsApp -->
              <Button
                icon="pi pi-whatsapp"
                severity="success"
                text
                rounded
                @click="compartirWhatsApp(data)"
                title="Enviar Detalle de Deuda por WhatsApp"
              />

              <!-- Botón Editar Apartado -->
              <Button
                v-if="data.status === 'activo' || data.status === 'liquidado'"
                icon="pi pi-pencil"
                severity="warn"
                text
                rounded
                @click="openEditarModal(data)"
                title="Editar Apartado / Modificar Cascos"
              />

              <!-- Botón Abonar -->
              <Button
                v-if="data.status === 'activo'"
                icon="pi pi-plus-circle"
                severity="success"
                text
                rounded
                @click="openAbonarModal(data)"
                title="Registrar Abono"
              />

              <!-- Botón Entregar -->
              <Button
                v-if="data.status === 'liquidado'"
                icon="pi pi-check-circle"
                severity="help"
                text
                rounded
                @click="confirmarEntrega(data)"
                title="Entregar Producto al Cliente"
              />

              <!-- Ver Detalle / Historial -->
              <Button
                icon="pi pi-eye"
                severity="info"
                text
                rounded
                @click="openDetalleModal(data)"
                title="Ver Historial de Abonos"
              />

              <!-- Cancelar -->
              <Button
                v-if="data.status === 'activo'"
                icon="pi pi-times"
                severity="danger"
                text
                rounded
                @click="confirmarCancelar(data)"
                title="Cancelar Apartado"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- MODAL 1: NUEVO / EDITAR APARTADO -->
    <Dialog
      v-model:visible="nuevoModalVisible"
      :header="isEditMode ? ('Editar Apartado ' + (editingApartado?.codigo_apartado || '')) : 'Crear Nuevo Apartado de Casco / Accesorio'"
      modal
      class="w-full max-w-3xl"
    >
      <div class="space-y-4 py-2">
        <!-- Cliente -->
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-700 uppercase">Cliente</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <InputText v-model="nuevoForm.customerName" placeholder="Nombre completo del cliente *" class="w-full" />
            <InputText v-model="nuevoForm.customerPhone" placeholder="Teléfono / WhatsApp" class="w-full" />
          </div>
        </div>

        <!-- Selección de Casco/Producto -->
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-700 uppercase">Seleccionar Producto del Inventario</label>
          <div class="flex gap-2">
            <Select
              v-model="selectedProduct"
              :options="productosList"
              optionLabel="nombre"
              filter
              placeholder="Buscar casco o accesorio por nombre o código..."
              class="w-full"
            >
              <template #option="{ option }">
                <div class="flex justify-between items-center w-full">
                  <div>
                    <span class="font-bold text-sm">{{ option.nombre }}</span>
                    <span v-if="option.talla" class="text-xs text-slate-500 ml-2 bg-slate-100 px-1.5 py-0.5 rounded">Talla: {{ option.talla }}</span>
                  </div>
                  <span class="font-bold text-emerald-700 text-xs">{{ formatCurrency(option.precio || option.precio_taller || 0) }}</span>
                </div>
              </template>
            </Select>
            <Button 
              label="Agregar" 
              icon="pi pi-plus" 
              @click="addItemToNuevo" 
              :disabled="!selectedProduct" 
              class="bg-amber-600 border-0 text-white font-bold shrink-0" 
            />
          </div>
        </div>

        <!-- Lista de productos agregados con edición de precio y cantidad -->
        <div v-if="nuevoForm.items.length > 0" class="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div class="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 uppercase flex justify-between items-center border-b border-slate-200">
            <span>Productos a Apartar ({{ nuevoForm.items.length }})</span>
            <span class="text-[11px] text-amber-700 font-semibold italic">Puedes modificar el precio unitario si aplica</span>
          </div>
          <div class="divide-y divide-slate-200 bg-white">
            <div v-for="(item, idx) in nuevoForm.items" :key="idx" class="p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
              <div class="flex-1 min-w-0 w-full md:w-auto">
                <label class="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Descripción / Casco</label>
                <InputText 
                  v-model="item.product_name" 
                  placeholder="Nombre / Detalle del casco" 
                  class="w-full text-xs font-bold text-slate-800 p-2" 
                />
              </div>
              <div class="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                <div class="flex flex-col items-center">
                  <span class="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Cant</span>
                  <InputNumber
                    v-model="item.qty"
                    :min="1"
                    :maxFractionDigits="0"
                    class="w-16"
                    inputClass="text-center font-bold text-xs p-2 w-16"
                  />
                </div>
                <div class="flex flex-col items-end">
                  <span class="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Precio Unit. (C$)</span>
                  <InputNumber
                    v-model="item.unit_price"
                    mode="currency"
                    currency="NIO"
                    locale="es-NI"
                    :min="0"
                    class="w-28"
                    inputClass="text-right font-bold text-xs p-2 w-28 text-emerald-700"
                  />
                </div>
                <div class="flex flex-col items-end min-w-[85px]">
                  <span class="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Subtotal</span>
                  <span class="font-black text-slate-800 text-sm mt-1">{{ formatCurrency((item.qty || 1) * (item.unit_price || 0)) }}</span>
                </div>
                <Button 
                  icon="pi pi-trash" 
                  severity="danger" 
                  text 
                  rounded 
                  size="small" 
                  @click="removeItemFromNuevo(idx)" 
                  class="mt-3 hover:bg-rose-50"
                  title="Eliminar producto"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Total, Prima Inicial y Saldo -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200">
          <div>
            <span class="text-xs font-bold text-slate-600 block uppercase">Total del Apartado:</span>
            <span class="text-2xl font-black text-slate-800">{{ formatCurrency(nuevoTotal) }}</span>
          </div>
          <div>
            <label class="text-xs font-bold text-slate-700 block uppercase">
              {{ isEditMode ? 'Total Abonado a la Fecha:' : 'Prima / Abono Inicial:' }}
            </label>
            <div v-if="isEditMode" class="text-2xl font-black text-emerald-700 mt-1">
              {{ formatCurrency(editingApartado?.total_abonado || 0) }}
            </div>
            <InputNumber
              v-else
              v-model="nuevoForm.primaMonto"
              mode="currency"
              currency="NIO"
              locale="es-NI"
              :min="0"
              :max="nuevoTotal"
              fluid
              class="mt-1 font-black text-emerald-700"
              placeholder="C$ 0.00"
            />
          </div>
          <div>
            <span class="text-xs font-bold text-slate-600 block uppercase">Saldo Restante:</span>
            <span class="text-2xl font-black text-amber-700">
              {{ formatCurrency(Math.max(0, nuevoTotal - (isEditMode ? Number(editingApartado?.total_abonado || 0) : (nuevoForm.primaMonto || 0)))) }}
            </span>
          </div>
        </div>

        <!-- Fecha Límite, Plazos y Método de Pago -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="text-xs font-bold text-slate-700 uppercase block mb-1">Fecha Límite</label>
            <InputText type="date" v-model="nuevoForm.fechaLimite" class="w-full text-sm" />
          </div>
          <div>
            <label class="text-xs font-bold text-slate-700 uppercase block mb-1">Cantidad de Plazos</label>
            <InputNumber
              v-model="nuevoForm.numeroPlazos"
              :min="1"
              :max="12"
              fluid
              class="w-full text-sm font-bold"
              placeholder="Ej: 3"
            />
          </div>
          <div v-if="!isEditMode">
            <label class="text-xs font-bold text-slate-700 uppercase block mb-1">Método de Prima</label>
            <Select
              v-model="nuevoForm.paymentMethod"
              :options="paymentOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full text-sm"
            />
          </div>
          <div v-else>
            <label class="text-xs font-bold text-slate-700 uppercase block mb-1">Observaciones</label>
            <InputText v-model="nuevoForm.notas" placeholder="Notas adicionales..." class="w-full text-sm" />
          </div>
        </div>

        <!-- Calculadora Resumen Cuota Estimada -->
        <div v-if="nuevoForm.numeroPlazos > 0 && nuevoTotal > 0" class="bg-cyan-50/80 p-3 rounded-xl border border-cyan-200 flex justify-between items-center text-xs">
          <div>
            <span class="font-bold text-cyan-900 block">Cuota Sugerida por Plazo ({{ nuevoForm.numeroPlazos }} plazos):</span>
            <span class="text-[11px] text-cyan-700">Dividido equitativamente entre los {{ nuevoForm.numeroPlazos }} plazos acordados</span>
          </div>
          <span class="font-black text-cyan-950 text-base font-mono">
            {{ formatCurrency((nuevoTotal - (nuevoForm.primaMonto || 0)) / Math.max(1, (nuevoForm.primaMonto > 0 ? (nuevoForm.numeroPlazos - 1) : (nuevoForm.numeroPlazos || 1)))) }}
          </span>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="nuevoModalVisible = false" />
        <Button
          :label="isEditMode ? 'Guardar Cambios' : 'Crear Apartado'"
          :icon="isEditMode ? 'pi pi-save' : 'pi pi-check'"
          severity="success"
          :loading="isSaving"
          :disabled="nuevoForm.items.length === 0 || !nuevoForm.customerName || nuevoTotal <= 0"
          @click="handleGuardarApartado"
          class="!font-bold !px-5"
        />
      </template>
    </Dialog>

    <!-- MODAL 2: REGISTRAR ABONO -->
    <Dialog
      v-model:visible="abonoModalVisible"
      header="Registrar Abono a Cuenta"
      modal
      class="w-full max-w-md"
    >
      <div class="space-y-4 py-2" v-if="selectedApartado">
        <!-- Info del Apartado -->
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div class="flex justify-between items-center text-sm">
            <span class="font-bold text-slate-800">{{ selectedApartado.customer_name }}</span>
            <span class="font-mono text-xs bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">
              {{ selectedApartado.codigo_apartado }}
            </span>
          </div>
          <div class="flex justify-between items-center text-xs mt-2 text-slate-600">
            <span>Saldo Pendiente:</span>
            <span class="font-black text-rose-600 text-base">{{ formatCurrency(selectedApartado.saldo_pendiente) }}</span>
          </div>
        </div>

        <!-- Monto a Abonar -->
        <div>
          <label class="text-xs font-bold text-slate-700 uppercase block mb-1">Monto a Abonar (C$)</label>
          <InputNumber
            v-model="abonoForm.monto"
            mode="currency"
            currency="NIO"
            locale="es-NI"
            :max="selectedApartado.saldo_pendiente"
            fluid
            class="text-xl font-black"
            placeholder="C$ 0.00"
          />
        </div>

        <!-- Fecha del Abono y Método de Pago -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[11px] font-bold text-slate-600 block uppercase mb-1">Fecha del Abono</label>
            <InputText
              type="date"
              v-model="abonoForm.fechaAbono"
              class="w-full text-xs font-bold"
            />
          </div>
          <div>
            <label class="text-[11px] font-bold text-slate-600 block uppercase mb-1">Método de Pago</label>
            <Select
              v-model="abonoForm.paymentMethod"
              :options="paymentOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full text-xs"
            />
          </div>
        </div>

        <!-- Billete Recibido si es Efectivo -->
        <div v-if="abonoForm.paymentMethod === 'efectivo'">
          <label class="text-[11px] font-bold text-slate-600 block uppercase mb-1">Monto Entregado por Cliente (Ej: 3 billetes de C$500 = C$1500)</label>
          <InputNumber
            v-model="abonoForm.amountReceived"
            mode="currency"
            currency="NIO"
            locale="es-NI"
            fluid
            class="text-xs font-bold"
            placeholder="C$ 0.00"
          />
          <small class="text-[10px] text-slate-500 mt-0.5 block">
            Ingresa el total que te entregó el cliente para calcular el vuelto exacto.
          </small>
        </div>

        <!-- Vuelto Calculado -->
        <div
          v-if="abonoForm.paymentMethod === 'efectivo' && abonoForm.amountReceived > abonoForm.monto"
          class="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex justify-between items-center text-xs"
        >
          <span class="font-bold text-emerald-800">Vuelto al cliente:</span>
          <span class="font-black text-emerald-700 text-sm">
            {{ formatCurrency(abonoForm.amountReceived - abonoForm.monto) }}
          </span>
        </div>

        <!-- Saldo Nuevo Calculado -->
        <div class="flex justify-between items-center border-t border-slate-200 pt-3 text-sm">
          <span class="font-bold text-slate-600">Nuevo Saldo Restante:</span>
          <span class="font-black text-slate-800">
            {{ formatCurrency(Math.max(0, selectedApartado.saldo_pendiente - (abonoForm.monto || 0))) }}
          </span>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="abonoModalVisible = false" />
        <Button
          label="Confirmar Abono e Imprimir"
          icon="pi pi-print"
          severity="success"
          :loading="isSaving"
          :disabled="!abonoForm.monto || abonoForm.monto <= 0"
          @click="handleGuardarAbono"
          class="!font-bold !px-5"
        />
      </template>
    </Dialog>

    <!-- MODAL 3: HISTORIAL DETALLADO DEL APARTADO -->
    <Dialog
      v-model:visible="detalleModalVisible"
      header="Detalle e Historial de Abonos"
      modal
      class="w-full max-w-lg"
    >
      <div v-if="selectedApartado" class="space-y-4 py-2">
        <div class="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            <div class="font-bold text-slate-800">{{ selectedApartado.customer_name }}</div>
            <div class="text-xs text-slate-400">Creado el: {{ formatDateOnly(selectedApartado.created_at) }}</div>
          </div>
          <Tag :value="getStatusLabel(selectedApartado.status)" :severity="getStatusSeverity(selectedApartado.status)" />
        </div>

        <!-- Lista de Abonos -->
        <div>
          <h4 class="text-xs font-bold uppercase text-slate-500 mb-2">Historial de Pagos Realizados</h4>
          <div class="space-y-2 max-h-56 overflow-y-auto">
            <div
              v-for="abono in selectedApartado.abonos"
              :key="abono.id"
              class="flex justify-between items-center p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
            >
              <div>
                <span class="font-bold text-slate-700">Abono #{{ abono.numero_abono }}</span>
                <span class="text-slate-400 block text-[10px]">{{ formatDate(abono.created_at) }} ({{ abono.payment_method }})</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-right">
                  <span class="font-black text-emerald-600 block text-sm">{{ formatCurrency(abono.monto) }}</span>
                  <span class="text-[10px] text-slate-400">Saldo: {{ formatCurrency(abono.saldo_nuevo) }}</span>
                </div>
                <Button 
                  icon="pi pi-image" 
                  text 
                  rounded 
                  severity="info" 
                  size="small"
                  @click="descargarComprobanteImagen(selectedApartado, abono)" 
                  title="Descargar este Recibo de Abono como Imagen (PNG)" 
                />
                <Button 
                  icon="pi pi-print" 
                  text 
                  rounded 
                  severity="secondary" 
                  size="small"
                  @click="imprimirAbono(selectedApartado, abono)" 
                  title="Reimprimir Recibo de este Abono" 
                />
              </div>
            </div>
            <div v-if="!selectedApartado.abonos || selectedApartado.abonos.length === 0" class="text-xs text-slate-400 text-center py-2">
              No hay abonos registrados.
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex flex-wrap justify-between items-center w-full gap-2">
          <div class="flex gap-2">
            <Button
              label="WhatsApp"
              icon="pi pi-whatsapp"
              severity="success"
              text
              @click="compartirWhatsApp(selectedApartado)"
            />
            <Button
              label="Descargar Imagen (PNG)"
              icon="pi pi-image"
              severity="info"
              @click="descargarComprobanteImagen(selectedApartado)"
            />
          </div>
          <div class="flex gap-2">
            <Button label="Cerrar" text severity="secondary" @click="detalleModalVisible = false" />
            <Button
              label="Imprimir Ticket"
              icon="pi pi-print"
              severity="warn"
              @click="imprimirComprobante(selectedApartado)"
            />
          </div>
        </div>
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
  marcarEntregado 
} from '../services/apartados'
import { getProductos } from '../services/productos'
import { formatCurrency } from '../utils/calculations'
import { handleError, showSuccess, showWarning } from '../utils/errorHandler'
import { useBusinessStore } from '../stores/businessStore'
import { useConfirm } from 'primevue/useconfirm'

import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Select from 'primevue/select'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
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
      const storedPlazos = localStorage.getItem(`apt_plazos_${a.id}`)
      return {
        ...a,
        numero_plazos: Number(a.numero_plazos || storedPlazos || 3)
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
    fechaLimite: getLocalDateString(nextMonth),
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

  const storedPlazos = localStorage.getItem(`apt_plazos_${apartado.id}`)
  nuevoForm.value = {
    customerName: apartado.customer_name || '',
    customerPhone: apartado.customer_phone || '',
    fechaLimite: apartado.fecha_limite || '',
    numeroPlazos: Number(apartado.numero_plazos || storedPlazos || 3),
    paymentMethod: 'efectivo',
    primaMonto: Number(apartado.total_abonado || 0),
    notas: apartado.notas || '',
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
            saldo_anterior: result.total,
            saldo_nuevo: result.saldo_pendiente,
            payment_method: nuevoForm.value.paymentMethod,
            created_at: new Date()
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

    const abonoTarget = { ...result.abono }
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

const confirmarCancelar = (apartado) => {
  confirm.require({
    message: '¿Cancelar apartado? El casco reservado volverá al stock del inventario.',
    header: 'Confirmar Cancelación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, cancelar apartado',
    rejectLabel: 'No',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await cancelarApartado(apartado.id, 'Cancelación voluntaria')
        showSuccess('Apartado cancelado y stock reincorporado al inventario')
        await fetchApartados()
      } catch (err) {
        handleError(err)
      }
    }
  })
}

const getStatusLabel = (st) => ({
  activo: 'Activo (En pagos)',
  liquidado: 'Listo para entregar',
  entregado: 'Entregado',
  cancelado: 'Cancelado'
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
</script>
