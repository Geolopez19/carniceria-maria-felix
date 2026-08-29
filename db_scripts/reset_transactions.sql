-- DANGER: Full Database Reset
-- This will delete ALL business data.
-- Kept: Users (so you can still login)
-- Deleted: Invoices, Purchases, Inventory, Products, Suppliers, Customers

-- 1. Transactions & History
TRUNCATE TABLE "public"."inventario_movimientos" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "public"."sales_orders" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "public"."sales_order_items" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "public"."purchase_orders" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "public"."purchase_order_items" RESTART IDENTITY CASCADE;

-- 2. Catalogs (Products, Suppliers, Customers)
TRUNCATE TABLE "public"."productos" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "public"."suppliers" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "public"."customers" RESTART IDENTITY CASCADE;

-- 3. NUCLEAR OPTION: Reset ALL Sequences to 1
-- This guarantees that 'invoice_number', 'id', etc. start from 1 again.
DO $$
DECLARE
    seq RECORD;
BEGIN
    FOR seq IN 
        SELECT sequence_schema, sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(seq.sequence_schema) || '.' || quote_ident(seq.sequence_name) || ' RESTART WITH 1';
    END LOOP;
END $$;

-- Note: public.usuarios (Users) is NOT deleted.
