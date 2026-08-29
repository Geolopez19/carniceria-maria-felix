-- Enable RLS on suppliers table
ALTER TABLE "public"."suppliers" ENABLE ROW LEVEL SECURITY;

-- Drop potentially restrictive existing policies
DROP POLICY IF EXISTS "Enable read access for all staff" ON "public"."suppliers";
DROP POLICY IF EXISTS "Enable insert for all staff" ON "public"."suppliers";
DROP POLICY IF EXISTS "Enable update for all staff" ON "public"."suppliers";
DROP POLICY IF EXISTS "Enable delete for all staff" ON "public"."suppliers";

-- Create permissive policies for all authenticated users (Staff)

-- 1. View: Allow seeing all suppliers
CREATE POLICY "Enable read access for all staff"
ON "public"."suppliers"
FOR SELECT
TO authenticated
USING (true);

-- 2. Insert: Allow creating suppliers
CREATE POLICY "Enable insert for all staff"
ON "public"."suppliers"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Update: Allow updating suppliers
CREATE POLICY "Enable update for all staff"
ON "public"."suppliers"
FOR UPDATE
TO authenticated
USING (true);

-- 4. Delete: Allow deleting suppliers (consistent with customers)
CREATE POLICY "Enable delete for all staff"
ON "public"."suppliers"
FOR DELETE
TO authenticated
USING (true);
