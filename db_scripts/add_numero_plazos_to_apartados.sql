-- Script para agregar columna numero_plazos a mototech.apartados si no existe
ALTER TABLE IF EXISTS mototech.apartados 
ADD COLUMN IF NOT EXISTS numero_plazos INT DEFAULT 3;

COMMENT ON COLUMN mototech.apartados.numero_plazos IS 'Cantidad de plazos o cuotas acordadas para liquidar el apartado';
