-- AGREGAR COLUMNA UNIDAD DE MEDIDA EN LA TABLA PRODUCTOS
-- Ejecutar en el SQL Editor de Supabase

ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS unidad_medida TEXT DEFAULT 'lbs';
