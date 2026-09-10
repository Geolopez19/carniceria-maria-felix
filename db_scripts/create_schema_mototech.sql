-- ==============================================================================
-- SCRIPT DE CREACIÓN PARA ESQUEMA: mototech (JyG MotoTech - Cascos y Accesorios)
-- ==============================================================================

-- 1. CREAR ESQUEMA
CREATE SCHEMA IF NOT EXISTS mototech;

-- 2. OTORGAR PERMISOS A ROLES DE SUPABASE (anon, authenticated, service_role)
GRANT USAGE ON SCHEMA mototech TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA mototech TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA mototech TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA mototech TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA mototech GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA mototech GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA mototech GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 3. TABLA DE CONFIGURACIÓN DEL NEGOCIO (mototech.business_config)
CREATE TABLE IF NOT EXISTS mototech.business_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'JyG MotoTech',
    address TEXT DEFAULT 'Managua, Nicaragua',
    phone TEXT DEFAULT '+505 0000-0000',
    email TEXT DEFAULT 'contacto@jygmototech.com',
    website TEXT DEFAULT 'https://www.jygmototech.com',
    ruc TEXT DEFAULT '',
    currency TEXT DEFAULT 'C$',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración inicial por defecto si no existe
INSERT INTO mototech.business_config (name, address, phone, email, currency)
SELECT 'JyG MotoTech', 'Managua, Nicaragua', '+505 86758928', 'contacto@jygmototech.com', 'C$'
WHERE NOT EXISTS (SELECT 1 FROM mototech.business_config);

-- 4. TABLA DE CLIENTES (mototech.clientes)
CREATE TABLE IF NOT EXISTS mototech.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA DE PRODUCTOS (mototech.productos)
-- Diseñada para Cascos, Accesorios, Tallas, Colores y Marcas
CREATE TABLE IF NOT EXISTS mototech.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE,
    codigo_barra TEXT,
    nombre TEXT NOT NULL,
    categoria TEXT DEFAULT 'Cascos', -- 'Cascos', 'Guantes', 'Chaquetas', 'Accesorios', 'Repuestos', etc.
    marca TEXT,                      -- 'LS2', 'Shaft', 'Bell', 'HJC', 'Alpinestars', etc.
    modelo TEXT,                     -- 'Rookie', 'Storm', 'Stream', etc.
    talla TEXT,                      -- 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Universal'
    color TEXT,                      -- 'Negro Mate', 'Blanco', 'Rojo/Negro', etc.
    precio NUMERIC(12, 2) NOT NULL DEFAULT 0,
    precio_taller NUMERIC(12, 2) DEFAULT 0, -- Precio preferencial si aplica
    costo NUMERIC(12, 2) DEFAULT 0,
    stock NUMERIC(12, 2) NOT NULL DEFAULT 0,
    stock_minimo NUMERIC(12, 2) DEFAULT 2,
    unidad_medida TEXT DEFAULT 'und',
    tipo_venta TEXT DEFAULT 'UNIDAD',
    garantia_meses INT DEFAULT 0,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_mototech_prod_nombre ON mototech.productos (nombre);
CREATE INDEX IF NOT EXISTS idx_mototech_prod_codigo ON mototech.productos (codigo);
CREATE INDEX IF NOT EXISTS idx_mototech_prod_marca ON mototech.productos (marca);
CREATE INDEX IF NOT EXISTS idx_mototech_prod_talla ON mototech.productos (talla);

-- 6. TABLA DE VENTAS / OFERTAS (mototech.sales_orders)
CREATE TABLE IF NOT EXISTS mototech.sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number SERIAL,
    invoice_number INT,
    customer_id UUID REFERENCES mototech.clientes(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    subtotal NUMERIC(12, 2) DEFAULT 0,
    discount_total NUMERIC(12, 2) DEFAULT 0,
    tax_total NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) DEFAULT 0,
    status TEXT DEFAULT 'draft', -- 'draft', 'paid', 'cancelled'
    payment_method TEXT,        -- 'efectivo', 'tarjeta', 'transferencia', 'otro'
    apply_tax BOOLEAN DEFAULT false,
    amount_received NUMERIC(12, 2) DEFAULT 0,
    change_given NUMERIC(12, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA DE DETALLES DE VENTA (mototech.sales_order_items)
CREATE TABLE IF NOT EXISTS mototech.sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES mototech.sales_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES mototech.productos(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    qty NUMERIC(12, 2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(12, 2) DEFAULT 0,
    tax_rate NUMERIC(5, 2) DEFAULT 0,
    line_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA DE MOVIMIENTOS DE INVENTARIO (mototech.inventario_movimientos)
CREATE TABLE IF NOT EXISTS mototech.inventario_movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES mototech.productos(id) ON DELETE CASCADE,
    producto_nombre TEXT,
    tipo TEXT NOT NULL, -- 'entrada', 'salida', 'ajuste'
    cantidad NUMERIC(12, 2) NOT NULL,
    stock_anterior NUMERIC(12, 2),
    stock_nuevo NUMERIC(12, 2),
    motivo TEXT,
    usuario_id UUID,
    usuario_nombre TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. FUNCIONES RPC PARA FINALIZAR Y CANCELAR EN mototech
CREATE OR REPLACE FUNCTION mototech.fn_finalize_order(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_order mototech.sales_orders;
    v_item RECORD;
    v_prod mototech.productos;
    v_stock_anterior NUMERIC;
    v_stock_nuevo NUMERIC;
    v_next_inv INT;
BEGIN
    SELECT * INTO v_order FROM mototech.sales_orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Venta no encontrada en mototech';
    END IF;

    IF v_order.status = 'paid' THEN
        RETURN to_jsonb(v_order);
    END IF;

    -- Asignar consecutivo de factura si no lo tiene
    IF v_order.invoice_number IS NULL THEN
        SELECT COALESCE(MAX(invoice_number), 0) + 1 INTO v_next_inv FROM mototech.sales_orders WHERE status = 'paid';
        UPDATE mototech.sales_orders SET invoice_number = v_next_inv WHERE id = p_order_id;
    END IF;

    -- Descontar stock
    FOR v_item IN SELECT * FROM mototech.sales_order_items WHERE order_id = p_order_id LOOP
        IF v_item.product_id IS NOT NULL THEN
            SELECT * INTO v_prod FROM mototech.productos WHERE id = v_item.product_id FOR UPDATE;
            IF FOUND THEN
                IF v_prod.stock < v_item.qty THEN
                    RAISE EXCEPTION 'INSUFFICIENT_STOCK for product % (need %, have %)', v_item.product_id, v_item.qty, v_prod.stock;
                END IF;

                v_stock_anterior := v_prod.stock;
                v_stock_nuevo := v_prod.stock - v_item.qty;

                UPDATE mototech.productos SET stock = v_stock_nuevo WHERE id = v_item.product_id;

                INSERT INTO mototech.inventario_movimientos (
                    producto_id, producto_nombre, tipo, cantidad, stock_anterior, stock_nuevo, motivo
                ) VALUES (
                    v_item.product_id, v_prod.nombre, 'salida', v_item.qty, v_stock_anterior, v_stock_nuevo, 'Venta Factura #' || COALESCE(v_order.invoice_number, 0)
                );
            END IF;
        END IF;
    END LOOP;

    UPDATE mototech.sales_orders
    SET status = 'paid', paid_at = NOW(), updated_at = NOW()
    WHERE id = p_order_id
    RETURNING * INTO v_order;

    RETURN to_jsonb(v_order);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mototech.fn_cancel_order(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_order mototech.sales_orders;
    v_item RECORD;
    v_prod mototech.productos;
BEGIN
    SELECT * INTO v_order FROM mototech.sales_orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Venta no encontrada en mototech';
    END IF;

    IF v_order.status = 'cancelled' THEN
        RETURN to_jsonb(v_order);
    END IF;

    -- Si estaba pagada, devolver stock
    IF v_order.status = 'paid' THEN
        FOR v_item IN SELECT * FROM mototech.sales_order_items WHERE order_id = p_order_id LOOP
            IF v_item.product_id IS NOT NULL THEN
                SELECT * INTO v_prod FROM mototech.productos WHERE id = v_item.product_id FOR UPDATE;
                IF FOUND THEN
                    UPDATE mototech.productos SET stock = stock + v_item.qty WHERE id = v_item.product_id;

                    INSERT INTO mototech.inventario_movimientos (
                        producto_id, producto_nombre, tipo, cantidad, stock_anterior, stock_nuevo, motivo
                    ) VALUES (
                        v_item.product_id, v_prod.nombre, 'entrada', v_item.qty, v_prod.stock, v_prod.stock + v_item.qty, 'Cancelación Venta #' || COALESCE(v_order.invoice_number, 0)
                    );
                END IF;
            END IF;
        END LOOP;
    END IF;

    UPDATE mototech.sales_orders
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = p_order_id
    RETURNING * INTO v_order;

    RETURN to_jsonb(v_order);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE mototech.business_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE mototech.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mototech.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE mototech.sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mototech.inventario_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mototech.clientes ENABLE ROW LEVEL SECURITY;

-- Políticas para acceso autenticado
CREATE POLICY "mototech_config_all" ON mototech.business_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mototech_prod_all" ON mototech.productos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mototech_orders_all" ON mototech.sales_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mototech_items_all" ON mototech.sales_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mototech_movs_all" ON mototech.inventario_movimientos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mototech_clientes_all" ON mototech.clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
