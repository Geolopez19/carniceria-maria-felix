-- Migración: Agregar campo costo a la tabla public.productos
ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS costo NUMERIC(12, 2) DEFAULT 0 CHECK (costo >= 0);
