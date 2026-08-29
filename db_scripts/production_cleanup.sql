-- SCRIPT DE LIMPIEZA PARA PASE A PRODUCCIÓN
-- ----------------------------------------------------
-- ESTE SCRIPT ESTÁ DISEÑADO PARA:
-- 1. Borrar todas las transacciones de prueba (Ventas, Compras).
-- 2. Borrar el historial de movimientos de inventario.
-- 3. (Opcional) Reiniciar el stock de productos a 0.
--
-- MANTIENE:
-- - Usuarios (Tu login)
-- - Productos (El catálogo)
-- - Clientes
-- - Proveedores
-- ----------------------------------------------------

BEGIN;

-- 1. Borrar tablas de movimiento (Transacciones)
-- Usamos CASCADE para borrar dependencias si existen
TRUNCATE TABLE "public"."sales_order_items" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "public"."sales_orders" RESTART IDENTITY CASCADE;

TRUNCATE TABLE "public"."purchase_order_items" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "public"."purchase_orders" RESTART IDENTITY CASCADE;

TRUNCATE TABLE "public"."inventario_movimientos" RESTART IDENTITY CASCADE;

-- 2. Reiniciar Stock de Productos
-- IMPORTANTE: Si borras los movimientos (el historial de cómo llegó el stock),
-- deberías reiniciar el stock a 0 y hacer una carga inicial (Compra o Ajuste) limpio.
-- Si prefieres MANTENER el stock actual (aunque sin historial), COMENTA la siguiente línea:
UPDATE "public"."productos" SET "stock" = 0;

COMMIT;

-- ==========================================
-- OPCIÓN B: SI QUIERES BORRAR ABSOLUTAMENTE TODO (INCLUYENDO PRODUCTOS Y CLIENTES)
-- Descomenta las siguientes líneas:
-- ==========================================
-- TRUNCATE TABLE "public"."productos" RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE "public"."suppliers" RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE "public"."customers" RESTART IDENTITY CASCADE;
