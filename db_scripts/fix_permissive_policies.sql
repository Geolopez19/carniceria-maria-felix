-- Fix "RLS Policy Always True" Warnings
-- This script tightens security by requiring that an authenticated user 
-- also has a valid record in 'public.usuarios' (Staff/Admin profile).
-- It replaces open `USING (true)` policies with `USING (EXISTS ...)`

-- ==============================================================================
-- 1. Helper Function (Optional but cleaner)
-- To avoid repeating the subquery, we can rely on the subquery directly.
-- ==============================================================================

-- CUSTOMERS
DROP POLICY IF EXISTS "Enable insert for all staff" ON "public"."customers";
CREATE POLICY "Enable insert for all staff" ON "public"."customers" FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Enable update for all staff" ON "public"."customers";
CREATE POLICY "Enable update for all staff" ON "public"."customers" FOR UPDATE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid()));

-- INVENTARIO_MOVIMIENTOS
DROP POLICY IF EXISTS "Enable insert for all staff" ON "public"."inventario_movimientos";
CREATE POLICY "Enable insert for all staff" ON "public"."inventario_movimientos" FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid()));

-- PRODUCTOS
DROP POLICY IF EXISTS "Enable insert for all staff" ON "public"."productos";
CREATE POLICY "Enable insert for all staff" ON "public"."productos" FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Enable update for all staff" ON "public"."productos";
CREATE POLICY "Enable update for all staff" ON "public"."productos" FOR UPDATE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid()));

-- SUPPLIERS
DROP POLICY IF EXISTS "Enable insert for all staff" ON "public"."suppliers";
CREATE POLICY "Enable insert for all staff" ON "public"."suppliers" FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Enable update for all staff" ON "public"."suppliers";
CREATE POLICY "Enable update for all staff" ON "public"."suppliers" FOR UPDATE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Enable delete for all staff" ON "public"."suppliers";
CREATE POLICY "Enable delete for all staff" ON "public"."suppliers" FOR DELETE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid()));

-- SALES & PURCHASES (ALL Operations)
-- Recreating "Enable all access for staff"

-- Purchase Orders
DROP POLICY IF EXISTS "Enable all access for staff" ON "public"."purchase_orders";
CREATE POLICY "Enable all access for staff" ON "public"."purchase_orders" FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Enable all access for staff" ON "public"."purchase_order_items";
CREATE POLICY "Enable all access for staff" ON "public"."purchase_order_items" FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid()));

-- Sales Orders
DROP POLICY IF EXISTS "Enable all access for staff" ON "public"."sales_orders";
CREATE POLICY "Enable all access for staff" ON "public"."sales_orders" FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Enable all access for staff" ON "public"."sales_order_items";
CREATE POLICY "Enable all access for staff" ON "public"."sales_order_items" FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios WHERE auth_id = auth.uid()));

-- Note: "app-registro.registros" policy is INTENTIONALLY excluded as per plan.

