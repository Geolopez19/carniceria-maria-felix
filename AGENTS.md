# Registro para Agentes de IA

## Módulo de Apartados (Exclusivo JyG MotoTech)
- **Servicio:** `src/services/apartados.js`
- **Página de Vista:** `src/pages/Apartados.vue`
- **Características:**
  - Permite la creación y actualización de Apartados de Cascos & Accesorios.
  - Permite la modificación de la **Fecha de Emisión** al crear o editar un apartado, actualizando la fecha en `mototech.apartados` y en el registro de prima inicial.
  - Permite la **Devolución Completa** de cualquier apartado (activo, liquidado o entregado), reincorporando automáticamente las cantidades de cada producto al stock en `productos`, registrando el movimiento de 'entrada' en `inventario_movimientos` y cancelando la venta asociada en `sales_orders` si ya había sido entregado.
  - Exclusivo para J&G MotoTech.
