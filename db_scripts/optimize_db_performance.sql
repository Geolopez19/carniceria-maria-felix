-- Optimizing Supabase RLS and Indexes
-- This script addresses warnings about:
-- 1. "Auth RLS Initialization Plan" (wrapping auth calls in select)
-- 2. "Multiple Permissive Policies" (removing redundant policies)
-- 3. "Duplicate Index" (removing duplicate indexes)

-- ==============================================================================
-- 1. REMOVE REDUNDANT/LEGACY POLICIES
-- ==============================================================================

-- CUSTOMERS: Broad "Enable ... for all staff" policies already exist.
DROP POLICY IF EXISTS "cust_insert" ON "public"."customers";
DROP POLICY IF EXISTS "cust_select" ON "public"."customers";
DROP POLICY IF EXISTS "cust_update" ON "public"."customers";
DROP POLICY IF EXISTS "cust_delete" ON "public"."customers";

-- SALES_ORDERS: Broad "Enable all access for staff" policy exists.
DROP POLICY IF EXISTS "allow_all_for_authenticated_sales_orders_select" ON "public"."sales_orders";
DROP POLICY IF EXISTS "allow_all_for_authenticated_sales_orders_insert" ON "public"."sales_orders";
DROP POLICY IF EXISTS "allow_all_for_authenticated_sales_orders_update" ON "public"."sales_orders";
DROP POLICY IF EXISTS "allow_all_for_authenticated_sales_orders_delete" ON "public"."sales_orders";

-- SALES_ORDER_ITEMS: Broad "Enable all access for staff" policy exists.
DROP POLICY IF EXISTS "allow_all_for_authenticated_items_select" ON "public"."sales_order_items";
DROP POLICY IF EXISTS "allow_all_for_authenticated_items_insert" ON "public"."sales_order_items";
DROP POLICY IF EXISTS "allow_all_for_authenticated_items_update" ON "public"."sales_order_items";
DROP POLICY IF EXISTS "allow_all_for_authenticated_items_delete" ON "public"."sales_order_items";


-- ==============================================================================
-- 2. OPTIMIZE POLICIES (Fix "Auth RLS Init Plan" by using (select auth.xxx()))
-- CORRECTION: Using table 'public.usuarios' and column 'rol' based on project schema.
-- ==============================================================================

-- PAYMENTS
DROP POLICY IF EXISTS "pay_select" ON "public"."payments";
CREATE POLICY "pay_select" ON "public"."payments" FOR SELECT TO authenticated USING (
  created_by = (select auth.uid()) OR EXISTS (
    SELECT 1 FROM public.usuarios WHERE auth_id = (select auth.uid()) AND rol IN ('admin', 'collaborator')
  )
);

DROP POLICY IF EXISTS "pay_insert" ON "public"."payments";
CREATE POLICY "pay_insert" ON "public"."payments" FOR INSERT TO authenticated WITH CHECK (
  created_by = (select auth.uid()) OR EXISTS (
    SELECT 1 FROM public.usuarios WHERE auth_id = (select auth.uid()) AND rol IN ('admin', 'collaborator')
  )
);

DROP POLICY IF EXISTS "pay_update" ON "public"."payments";
CREATE POLICY "pay_update" ON "public"."payments" FOR UPDATE TO authenticated USING (
  created_by = (select auth.uid()) OR EXISTS (
    SELECT 1 FROM public.usuarios WHERE auth_id = (select auth.uid()) AND rol IN ('admin', 'collaborator')
  )
);

DROP POLICY IF EXISTS "pay_delete" ON "public"."payments";
CREATE POLICY "pay_delete" ON "public"."payments" FOR DELETE TO authenticated USING (
  created_by = (select auth.uid()) OR EXISTS (
    SELECT 1 FROM public.usuarios WHERE auth_id = (select auth.uid()) AND rol IN ('admin', 'collaborator')
  )
);

-- INVENTARIO_MOVIMIENTOS
-- Fix: Enable update for admins only
DROP POLICY IF EXISTS "Enable update for admins only" ON "public"."inventario_movimientos";
CREATE POLICY "Enable update for admins only" ON "public"."inventario_movimientos" FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.usuarios WHERE auth_id = (select auth.uid()) AND rol = 'admin'
  )
);

-- Fix: Enable delete for admins only
DROP POLICY IF EXISTS "Enable delete for admins only" ON "public"."inventario_movimientos";
CREATE POLICY "Enable delete for admins only" ON "public"."inventario_movimientos" FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.usuarios WHERE auth_id = (select auth.uid()) AND rol = 'admin'
  )
);

-- USUARIOS
-- Fix: Users can view their own profile
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON "public"."usuarios";
CREATE POLICY "Usuarios pueden ver su propio perfil" ON "public"."usuarios" FOR SELECT TO authenticated USING (
  auth_id = (select auth.uid())
);

-- Fix: Users can update their own profile
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON "public"."usuarios";
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON "public"."usuarios" FOR UPDATE TO authenticated USING (
  auth_id = (select auth.uid())
);

-- BUSINESS_CONFIG
DROP POLICY IF EXISTS "Enable read for authenticated users" ON "public"."business_config";
CREATE POLICY "Enable read for authenticated users" ON "public"."business_config" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON "public"."business_config";
CREATE POLICY "Enable update for authenticated users" ON "public"."business_config" FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = (select auth.uid()) AND rol = 'admin')
);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."business_config";
CREATE POLICY "Enable insert for authenticated users" ON "public"."business_config" FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = (select auth.uid()) AND rol = 'admin')
);


-- PRODUCTOS
-- Fix: Enable delete for admins only
DROP POLICY IF EXISTS "Enable delete for admins only" ON "public"."productos";
CREATE POLICY "Enable delete for admins only" ON "public"."productos" FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.usuarios WHERE auth_id = (select auth.uid()) AND rol = 'admin'
  )
);

-- ==============================================================================
-- 3. REMOVE DUPLICATE INDEXES
-- ==============================================================================

-- DROP duplicated indexes on sales_order_items
DROP INDEX IF EXISTS "public"."idx_so_items_order_id";
DROP INDEX IF EXISTS "public"."idx_so_items_product_id";
-- Keeping "idx_sales_order_items_order_id" and "idx_sales_order_items_product_id"
