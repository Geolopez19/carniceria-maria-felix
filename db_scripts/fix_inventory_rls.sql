-- Enable RLS on inventario_movimientos
ALTER TABLE "public"."inventario_movimientos" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for all staff" ON "public"."inventario_movimientos";
DROP POLICY IF EXISTS "Enable insert for all staff" ON "public"."inventario_movimientos";
DROP POLICY IF EXISTS "Enable update for admins only" ON "public"."inventario_movimientos";
DROP POLICY IF EXISTS "Enable delete for admins only" ON "public"."inventario_movimientos";

-- 1. View: Allow all authenticated users (staff) to view movements
CREATE POLICY "Enable read access for all staff"
ON "public"."inventario_movimientos"
FOR SELECT
TO authenticated
USING (true);

-- 2. Insert: Allow all authenticated users to record movements
CREATE POLICY "Enable insert for all staff"
ON "public"."inventario_movimientos"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Update: Restrict to Admins only
CREATE POLICY "Enable update for admins only"
ON "public"."inventario_movimientos"
FOR UPDATE
TO authenticated
USING (
  (SELECT rol FROM public.usuarios WHERE auth_id = auth.uid()) = 'admin'
);

-- 4. Delete: Restrict to Admins only
CREATE POLICY "Enable delete for admins only"
ON "public"."inventario_movimientos"
FOR DELETE
TO authenticated
USING (
  (SELECT rol FROM public.usuarios WHERE auth_id = auth.uid()) = 'admin'
);
