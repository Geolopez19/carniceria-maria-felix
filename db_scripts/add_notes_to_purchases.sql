-- ==============================================================================
-- SCRIPT OPCIONAL: AGREGAR CAMPOS DE NOTAS Y CONTACTO A COMPRAS
-- Ejecuta este script en el SQL Editor de Supabase si deseas almacenar notas
-- y datos de contacto directos en la cabecera de las órdenes de compra.
-- ==============================================================================

-- 1. Para Carnicería (esquema public)
ALTER TABLE IF EXISTS public.purchase_orders
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS supplier_phone TEXT,
ADD COLUMN IF NOT EXISTS supplier_email TEXT;

-- 2. Para MotoTech (esquema mototech)
ALTER TABLE IF EXISTS mototech.purchase_orders
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS supplier_phone TEXT,
ADD COLUMN IF NOT EXISTS supplier_email TEXT;
