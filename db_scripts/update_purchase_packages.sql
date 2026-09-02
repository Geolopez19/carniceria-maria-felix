-- ==============================================================================
-- SISTEMA CARNICERÍA MARÍA - MIGRACIÓN COLUMNAS DE PAQUETES EN COMPRAS
-- Ejecutar en el SQL Editor de Supabase (Opcional pero recomendado para persistencia directa)
-- ==============================================================================

ALTER TABLE public.purchase_order_items 
ADD COLUMN IF NOT EXISTS tipo_ingreso TEXT DEFAULT 'granel' CHECK (tipo_ingreso IN ('granel', 'pieza', 'paquete'));

ALTER TABLE public.purchase_order_items 
ADD COLUMN IF NOT EXISTS peso_caja NUMERIC;

ALTER TABLE public.purchase_order_items 
ADD COLUMN IF NOT EXISTS codigo_lote TEXT;

ALTER TABLE public.purchase_order_items 
ADD COLUMN IF NOT EXISTS paquetes_data JSONB;
