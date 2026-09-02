-- ==============================================================================
-- CORRECCIÓN DE ERROR DE RECURSIÓN INFINITA EN SUPABASE (RLS FIX)
-- Ejecutar este script en el SQL Editor de tu proyecto en Supabase para solucionar el error 500.
-- ==============================================================================

-- 1. Crear funciones con SECURITY DEFINER (bypassean RLS para evitar bucles infinitos)

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE auth_id = auth.uid() 
          AND COALESCE(activo, true) = true
    );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE auth_id = auth.uid() 
          AND rol = 'admin' 
          AND COALESCE(activo, true) = true
    );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 2. Eliminar políticas antiguas que generaban la recursión

DROP POLICY IF EXISTS "user_select_self" ON public.usuarios;
DROP POLICY IF EXISTS "user_update_self" ON public.usuarios;
DROP POLICY IF EXISTS "admin_all_usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.usuarios;

DROP POLICY IF EXISTS "business_select" ON public.business_config;
DROP POLICY IF EXISTS "business_admin_modify" ON public.business_config;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.business_config;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.business_config;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.business_config;

DROP POLICY IF EXISTS "prod_select" ON public.productos;
DROP POLICY IF EXISTS "prod_staff_insert" ON public.productos;
DROP POLICY IF EXISTS "prod_staff_update" ON public.productos;
DROP POLICY IF EXISTS "prod_admin_delete" ON public.productos;
DROP POLICY IF EXISTS "Enable insert for all staff" ON public.productos;
DROP POLICY IF EXISTS "Enable update for all staff" ON public.productos;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.productos;

DROP POLICY IF EXISTS "cust_select" ON public.customers;
DROP POLICY IF EXISTS "cust_staff_insert" ON public.customers;
DROP POLICY IF EXISTS "cust_staff_update" ON public.customers;
DROP POLICY IF EXISTS "cust_admin_delete" ON public.customers;
DROP POLICY IF EXISTS "Enable read access for all staff" ON public.customers;
DROP POLICY IF EXISTS "Enable insert for all staff" ON public.customers;
DROP POLICY IF EXISTS "Enable update for all staff" ON public.customers;

DROP POLICY IF EXISTS "supp_select" ON public.suppliers;
DROP POLICY IF EXISTS "supp_staff_insert" ON public.suppliers;
DROP POLICY IF EXISTS "supp_staff_update" ON public.suppliers;
DROP POLICY IF EXISTS "supp_staff_delete" ON public.suppliers;
DROP POLICY IF EXISTS "Enable insert for all staff" ON public.suppliers;
DROP POLICY IF EXISTS "Enable update for all staff" ON public.suppliers;
DROP POLICY IF EXISTS "Enable delete for all staff" ON public.suppliers;

DROP POLICY IF EXISTS "inv_select" ON public.inventario_movimientos;
DROP POLICY IF EXISTS "inv_insert" ON public.inventario_movimientos;
DROP POLICY IF EXISTS "inv_admin_update" ON public.inventario_movimientos;
DROP POLICY IF EXISTS "inv_admin_delete" ON public.inventario_movimientos;
DROP POLICY IF EXISTS "Enable read access for all staff" ON public.inventario_movimientos;
DROP POLICY IF EXISTS "Enable insert for all staff" ON public.inventario_movimientos;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.inventario_movimientos;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.inventario_movimientos;

DROP POLICY IF EXISTS "so_staff_all" ON public.sales_orders;
DROP POLICY IF EXISTS "soi_staff_all" ON public.sales_order_items;
DROP POLICY IF EXISTS "po_staff_all" ON public.purchase_orders;
DROP POLICY IF EXISTS "poi_staff_all" ON public.purchase_order_items;
DROP POLICY IF EXISTS "pay_staff_all" ON public.payments;
DROP POLICY IF EXISTS "Enable all access for staff" ON public.sales_orders;
DROP POLICY IF EXISTS "Enable all access for staff" ON public.sales_order_items;
DROP POLICY IF EXISTS "Enable all access for staff" ON public.purchase_orders;
DROP POLICY IF EXISTS "Enable all access for staff" ON public.purchase_order_items;

-- 3. Recrear políticas limpias utilizando las funciones is_staff() y is_admin()

-- POLÍTICAS TABLA USUARIOS
CREATE POLICY "usuarios_read" ON public.usuarios FOR SELECT TO authenticated
    USING (auth_id = auth.uid() OR public.is_admin());

CREATE POLICY "usuarios_update" ON public.usuarios FOR UPDATE TO authenticated
    USING (auth_id = auth.uid() OR public.is_admin());

CREATE POLICY "usuarios_admin_all" ON public.usuarios FOR ALL TO authenticated
    USING (public.is_admin());

-- POLÍTICAS CONFIGURACIÓN DEL NEGOCIO
CREATE POLICY "business_select" ON public.business_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "business_admin_modify" ON public.business_config FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- POLÍTICAS PRODUCTOS
CREATE POLICY "prod_select" ON public.productos FOR SELECT TO authenticated USING (true);
CREATE POLICY "prod_staff_insert" ON public.productos FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "prod_staff_update" ON public.productos FOR UPDATE TO authenticated USING (public.is_staff());
CREATE POLICY "prod_admin_delete" ON public.productos FOR DELETE TO authenticated USING (public.is_admin());

-- POLÍTICAS CLIENTES (CUSTOMERS)
CREATE POLICY "cust_select" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "cust_staff_insert" ON public.customers FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "cust_staff_update" ON public.customers FOR UPDATE TO authenticated USING (public.is_staff());
CREATE POLICY "cust_admin_delete" ON public.customers FOR DELETE TO authenticated USING (public.is_admin());

-- POLÍTICAS PROVEEDORES (SUPPLIERS)
CREATE POLICY "supp_select" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "supp_staff_insert" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "supp_staff_update" ON public.suppliers FOR UPDATE TO authenticated USING (public.is_staff());
CREATE POLICY "supp_staff_delete" ON public.suppliers FOR DELETE TO authenticated USING (public.is_staff());

-- POLÍTICAS MOVIMIENTOS INVENTARIO
CREATE POLICY "inv_select" ON public.inventario_movimientos FOR SELECT TO authenticated USING (true);
CREATE POLICY "inv_insert" ON public.inventario_movimientos FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "inv_admin_update" ON public.inventario_movimientos FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "inv_admin_delete" ON public.inventario_movimientos FOR DELETE TO authenticated USING (public.is_admin());

-- POLÍTICAS VENTAS (SALES ORDERS & ITEMS)
CREATE POLICY "so_staff_all" ON public.sales_orders FOR ALL TO authenticated
    USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY "soi_staff_all" ON public.sales_order_items FOR ALL TO authenticated
    USING (public.is_staff()) WITH CHECK (public.is_staff());

-- POLÍTICAS COMPRAS (PURCHASE ORDERS & ITEMS)
CREATE POLICY "po_staff_all" ON public.purchase_orders FOR ALL TO authenticated
    USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY "poi_staff_all" ON public.purchase_order_items FOR ALL TO authenticated
    USING (public.is_staff()) WITH CHECK (public.is_staff());

-- POLÍTICAS PAGOS
CREATE POLICY "pay_staff_all" ON public.payments FOR ALL TO authenticated
    USING (public.is_staff()) WITH CHECK (public.is_staff());
