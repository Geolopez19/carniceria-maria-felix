-- Drop the potentially restrictive existing select policy
DROP POLICY IF EXISTS "productos_role_select" ON "public"."productos";

-- Create a new policy that allows everyone (anon and authenticated) to view products
CREATE POLICY "Enable read access for all users"
ON "public"."productos"
FOR SELECT
TO public
USING (true);
