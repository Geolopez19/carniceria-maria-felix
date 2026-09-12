-- Agregar columna discount_percent a la tabla sales_orders
ALTER TABLE sales_orders 
ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0;
