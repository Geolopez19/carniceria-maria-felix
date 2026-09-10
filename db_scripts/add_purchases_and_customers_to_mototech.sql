-- ==============================================================================
-- SCRIPT DE ADICIÓN PARA ESQUEMA: mototech (Compras, Proveedores y Clientes)
-- ==============================================================================

-- 1. TABLA DE CLIENTES (mototech.customers)
-- Usamos 'customers' idéntico a public para que use los mismos campos y lógica
CREATE TABLE IF NOT EXISTS mototech.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    national_id TEXT,
    national_id_norm TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE PROVEEDORES (mototech.suppliers)
CREATE TABLE IF NOT EXISTS mototech.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA COMPRAS (mototech.purchase_orders)
CREATE TABLE IF NOT EXISTS mototech.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number SERIAL,
    supplier_id UUID REFERENCES mototech.suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'cancelled')),
    total NUMERIC DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DETALLE DE COMPRAS (mototech.purchase_order_items)
CREATE TABLE IF NOT EXISTS mototech.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES mototech.purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES mototech.productos(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    qty NUMERIC NOT NULL DEFAULT 1 CHECK (qty > 0),
    unit_cost NUMERIC NOT NULL DEFAULT 0,
    line_total NUMERIC NOT NULL DEFAULT 0,
    tipo_ingreso TEXT DEFAULT 'unidad',
    peso_caja NUMERIC,
    codigo_lote TEXT,
    paquetes_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. HABILITAR RLS Y PERMISOS
ALTER TABLE mototech.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mototech.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mototech.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE mototech.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mototech_customers_all" ON mototech.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mototech_suppliers_all" ON mototech.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mototech_purchase_orders_all" ON mototech.purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mototech_purchase_items_all" ON mototech.purchase_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON ALL TABLES IN SCHEMA mototech TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA mototech TO anon, authenticated, service_role;
