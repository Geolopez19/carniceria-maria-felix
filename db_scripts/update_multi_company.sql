-- ==============================================================================
-- SCRIPT DE MIGRACIÓN: AISLAMIENTO MULTIEMPRESA
-- Agrega soporte para acceso múltiple por usuario a través de un arreglo de empresas
-- y actualiza el RLS para reforzar la seguridad a nivel de base de datos.
-- ==============================================================================

-- 1. Agregar columna de empresas autorizadas a usuarios
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS empresas_autorizadas TEXT[] DEFAULT '{carniceria}';

-- Asegurar que el admin inicial tenga acceso a ambas por defecto para evitar bloqueos
UPDATE public.usuarios 
SET empresas_autorizadas = '{carniceria, mototech}' 
WHERE rol IN ('admin', 'administrador') AND (empresas_autorizadas = '{carniceria}' OR empresas_autorizadas IS NULL);

-- 2. Función auxiliar segura para RLS (Security Definer para que pueda leer la tabla de usuarios saltando sus propias RLS)
CREATE OR REPLACE FUNCTION public.is_user_authorized_for_company(company_id text)
RETURNS BOOLEAN AS $$
DECLARE
    v_empresas TEXT[];
BEGIN
    SELECT empresas_autorizadas INTO v_empresas
    FROM public.usuarios
    WHERE auth_id = auth.uid();
    
    RETURN company_id = ANY(v_empresas);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Actualizar Políticas RLS para Esquema PUBLIC (Carnicería)
-- Reemplazaremos las políticas demasiado permisivas (using true) por la validación de empresa.

-- a. business_config
DROP POLICY IF EXISTS "Enable read access for all users" ON public.business_config;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.business_config;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.business_config;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.business_config;

CREATE POLICY "public_config_select" ON public.business_config FOR SELECT TO authenticated USING (public.is_user_authorized_for_company('carniceria'));
CREATE POLICY "public_config_all" ON public.business_config FOR ALL TO authenticated USING (public.is_user_authorized_for_company('carniceria')) WITH CHECK (public.is_user_authorized_for_company('carniceria'));

-- b. productos
DROP POLICY IF EXISTS "Enable read access for all users" ON public.productos;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.productos;

CREATE POLICY "public_productos_select" ON public.productos FOR SELECT TO authenticated USING (public.is_user_authorized_for_company('carniceria'));
CREATE POLICY "public_productos_all" ON public.productos FOR ALL TO authenticated USING (public.is_user_authorized_for_company('carniceria')) WITH CHECK (public.is_user_authorized_for_company('carniceria'));

-- c. customers
DROP POLICY IF EXISTS "Enable read access for all users" ON public.customers;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Allow Staff to insert customers" ON public.customers;
DROP POLICY IF EXISTS "Allow Staff to update customers" ON public.customers;
DROP POLICY IF EXISTS "Allow Staff to delete customers" ON public.customers;

CREATE POLICY "public_customers_select" ON public.customers FOR SELECT TO authenticated USING (public.is_user_authorized_for_company('carniceria'));
CREATE POLICY "public_customers_all" ON public.customers FOR ALL TO authenticated USING (public.is_user_authorized_for_company('carniceria')) WITH CHECK (public.is_user_authorized_for_company('carniceria'));

-- d. sales_orders / sales_order_items
DROP POLICY IF EXISTS "Enable read access for all users" ON public.sales_orders;
DROP POLICY IF EXISTS "Allow Staff to insert transactions" ON public.sales_orders;
DROP POLICY IF EXISTS "Allow Staff to update transactions" ON public.sales_orders;
DROP POLICY IF EXISTS "Allow Staff to delete transactions" ON public.sales_orders;

CREATE POLICY "public_transactions_all" ON public.sales_orders FOR ALL TO authenticated USING (public.is_user_authorized_for_company('carniceria')) WITH CHECK (public.is_user_authorized_for_company('carniceria'));

DROP POLICY IF EXISTS "Enable read access for all users" ON public.sales_order_items;
DROP POLICY IF EXISTS "Allow Staff to insert items" ON public.sales_order_items;
DROP POLICY IF EXISTS "Allow Staff to update items" ON public.sales_order_items;
DROP POLICY IF EXISTS "Allow Staff to delete items" ON public.sales_order_items;

CREATE POLICY "public_transaction_items_all" ON public.sales_order_items FOR ALL TO authenticated USING (public.is_user_authorized_for_company('carniceria')) WITH CHECK (public.is_user_authorized_for_company('carniceria'));

-- 4. Actualizar Políticas RLS para Esquema MOTOTECH

DROP POLICY IF EXISTS "mototech_config_all" ON mototech.business_config;
CREATE POLICY "mototech_config_all" ON mototech.business_config FOR ALL TO authenticated USING (public.is_user_authorized_for_company('mototech')) WITH CHECK (public.is_user_authorized_for_company('mototech'));

DROP POLICY IF EXISTS "mototech_prod_all" ON mototech.productos;
CREATE POLICY "mototech_prod_all" ON mototech.productos FOR ALL TO authenticated USING (public.is_user_authorized_for_company('mototech')) WITH CHECK (public.is_user_authorized_for_company('mototech'));

DROP POLICY IF EXISTS "mototech_orders_all" ON mototech.sales_orders;
CREATE POLICY "mototech_orders_all" ON mototech.sales_orders FOR ALL TO authenticated USING (public.is_user_authorized_for_company('mototech')) WITH CHECK (public.is_user_authorized_for_company('mototech'));

DROP POLICY IF EXISTS "mototech_items_all" ON mototech.sales_order_items;
CREATE POLICY "mototech_items_all" ON mototech.sales_order_items FOR ALL TO authenticated USING (public.is_user_authorized_for_company('mototech')) WITH CHECK (public.is_user_authorized_for_company('mototech'));

DROP POLICY IF EXISTS "mototech_movs_all" ON mototech.inventario_movimientos;
CREATE POLICY "mototech_movs_all" ON mototech.inventario_movimientos FOR ALL TO authenticated USING (public.is_user_authorized_for_company('mototech')) WITH CHECK (public.is_user_authorized_for_company('mototech'));

DROP POLICY IF EXISTS "mototech_clientes_all" ON mototech.clientes;
CREATE POLICY "mototech_clientes_all" ON mototech.clientes FOR ALL TO authenticated USING (public.is_user_authorized_for_company('mototech')) WITH CHECK (public.is_user_authorized_for_company('mototech'));
