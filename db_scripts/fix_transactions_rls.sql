-- Enable RLS on Purchase Orders
ALTER TABLE "public"."purchase_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."purchase_order_items" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Sales Orders (Invoices/Offers)
ALTER TABLE "public"."sales_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sales_order_items" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable all access for staff" ON "public"."purchase_orders";
DROP POLICY IF EXISTS "Enable all access for staff" ON "public"."purchase_order_items";
DROP POLICY IF EXISTS "Enable all access for staff" ON "public"."sales_orders";
DROP POLICY IF EXISTS "Enable all access for staff" ON "public"."sales_order_items";

-- Create General "Allow All" Policies for Staff (Authenticated Users)

-- Purchases
CREATE POLICY "Enable all access for staff" ON "public"."purchase_orders"
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for staff" ON "public"."purchase_order_items"
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Sales
CREATE POLICY "Enable all access for staff" ON "public"."sales_orders"
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for staff" ON "public"."sales_order_items"
FOR ALL TO authenticated USING (true) WITH CHECK (true);
