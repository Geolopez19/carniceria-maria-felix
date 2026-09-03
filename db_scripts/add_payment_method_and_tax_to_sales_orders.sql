-- ==============================================================================
-- MEJORA DEL MÓDULO DE OFERTAS Y VENTAS:
-- 1. Agregar columna payment_method a sales_orders
-- 2. Agregar columna apply_tax a sales_orders
-- ==============================================================================

ALTER TABLE public.sales_orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT;

ALTER TABLE public.sales_orders 
ADD COLUMN IF NOT EXISTS apply_tax BOOLEAN DEFAULT FALSE;

-- Comentario para documentación
COMMENT ON COLUMN public.sales_orders.payment_method IS 'Método de pago: efectivo, tarjeta, transferencia, otro';
COMMENT ON COLUMN public.sales_orders.apply_tax IS 'Indica si se aplica IVA (15%) a la oferta/factura';
