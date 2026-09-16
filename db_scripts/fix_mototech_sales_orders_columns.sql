-- ==============================================================================
-- SCRIPT PARA GARANTIZAR COLUMNAS EN mototech.sales_orders
-- ==============================================================================

ALTER TABLE mototech.sales_orders 
ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2) DEFAULT 0;

ALTER TABLE mototech.sales_orders 
ADD COLUMN IF NOT EXISTS is_gym BOOLEAN DEFAULT false;

ALTER TABLE mototech.sales_orders 
ADD COLUMN IF NOT EXISTS amount_received NUMERIC(12, 2) DEFAULT 0;

ALTER TABLE mototech.sales_orders 
ADD COLUMN IF NOT EXISTS change_given NUMERIC(12, 2) DEFAULT 0;

ALTER TABLE mototech.sales_orders 
ADD COLUMN IF NOT EXISTS apply_tax BOOLEAN DEFAULT false;

ALTER TABLE mototech.sales_orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT;
