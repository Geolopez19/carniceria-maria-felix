-- Enable RLS on customers table
ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;

-- Drop potentially restrictive existing policies (e.g., only own rows)
DROP POLICY IF EXISTS "Enable read access for own customers" ON "public"."customers";
DROP POLICY IF EXISTS "customers_role_select" ON "public"."customers";
DROP POLICY IF EXISTS "Enable insert for own customers" ON "public"."customers";
DROP POLICY IF EXISTS "Enable update for own customers" ON "public"."customers";

-- Create permissive policies for all authenticated users (Staff)

-- 1. View: Allow seeing all customers
CREATE POLICY "Enable read access for all staff"
ON "public"."customers"
FOR SELECT
TO authenticated
USING (true);

-- 2. Insert: Allow creating customers
CREATE POLICY "Enable insert for all staff"
ON "public"."customers"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Update: Allow updating any customer
CREATE POLICY "Enable update for all staff"
ON "public"."customers"
FOR UPDATE
TO authenticated
USING (true);
