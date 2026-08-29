-- Ensure RLS is enabled
ALTER TABLE "public"."productos" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "productos_role_insert" ON "public"."productos";
DROP POLICY IF EXISTS "productos_role_update" ON "public"."productos";
DROP POLICY IF EXISTS "productos_role_delete" ON "public"."productos";
DROP POLICY IF EXISTS "Enable insert for all staff" ON "public"."productos";
DROP POLICY IF EXISTS "Enable update for all staff" ON "public"."productos";

-- Create permissive policies for Staff

-- 1. Insert: Allow creating products
CREATE POLICY "Enable insert for all staff"
ON "public"."productos"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. Update: Allow updating products
CREATE POLICY "Enable update for all staff"
ON "public"."productos"
FOR UPDATE
TO authenticated
USING (true);

-- 3. Delete: Restrict to Admins only
CREATE POLICY "Enable delete for admins only"
ON "public"."productos"
FOR DELETE
TO authenticated
USING (
  (SELECT rol FROM public.usuarios WHERE auth_id = auth.uid()) = 'admin'
);
