-- Script para registrar el efectivo entregado por el cliente y el vuelto en las ventas
ALTER TABLE public.sales_orders 
ADD COLUMN IF NOT EXISTS amount_received NUMERIC DEFAULT 0;

ALTER TABLE public.sales_orders 
ADD COLUMN IF NOT EXISTS change_given NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.sales_orders.amount_received IS 'Monto en efectivo recibido del cliente (billete)';
COMMENT ON COLUMN public.sales_orders.change_given IS 'Monto de vuelto o cambio entregado al cliente';
