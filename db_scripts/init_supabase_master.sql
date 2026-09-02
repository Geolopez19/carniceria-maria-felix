-- ==============================================================================
-- SISTEMA CARNICERÍA MARÍA - SCRIPT INICIAL MAESTRO SUPABASE
-- Ejecutar este script completo en el SQL Editor de un nuevo proyecto Supabase.
-- ==============================================================================

-- 1. HABILITAR EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. CREACIÓN DE TABLAS
-- ==============================================================================

-- A. TABLA USUARIOS (Perfiles extendidos vinculados a auth.users)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT,
    rol TEXT DEFAULT 'colaborador' CHECK (rol IN ('admin', 'colaborador', 'collaborator')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- B. TABLA CONFIGURACIÓN DEL NEGOCIO
CREATE TABLE IF NOT EXISTS public.business_config (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT DEFAULT 'Carnicería María',
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    ruc TEXT,
    currency TEXT DEFAULT 'C$',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- C. TABLA PRODUCTOS
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    codigo TEXT UNIQUE,
    categoria TEXT,
    unidad_medida TEXT DEFAULT 'lbs',
    stock NUMERIC DEFAULT 0 CHECK (stock >= 0),
    precio NUMERIC DEFAULT 0 CHECK (precio >= 0),
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- D. TABLA CLIENTES (CUSTOMERS)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    national_id TEXT,
    national_id_norm TEXT GENERATED ALWAYS AS (LOWER(REGEXP_REPLACE(COALESCE(national_id, ''), '[^a-zA-Z0-9]', '', 'g'))) STORED,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- E. TABLA PROVEEDORES (SUPPLIERS)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- F. TABLA MOVIMIENTOS DE INVENTARIO (KARDEX/AUDITORÍA)
CREATE TABLE IF NOT EXISTS public.inventario_movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
    producto_nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
    cantidad NUMERIC NOT NULL CHECK (cantidad > 0),
    stock_anterior NUMERIC NOT NULL,
    stock_nuevo NUMERIC NOT NULL,
    motivo TEXT,
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- G. TABLA VENTAS / FACTURAS (SALES ORDERS)
CREATE TABLE IF NOT EXISTS public.sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number BIGINT GENERATED ALWAYS AS IDENTITY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'paid', 'cancelled')),
    subtotal NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    tax NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    paid_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- H. TABLA DETALLE DE VENTAS (SALES ORDER ITEMS)
CREATE TABLE IF NOT EXISTS public.sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    qty NUMERIC NOT NULL DEFAULT 1 CHECK (qty > 0),
    unit_price NUMERIC NOT NULL DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    tax_rate NUMERIC DEFAULT 0,
    line_total NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- I. TABLA COMPRAS (PURCHASE ORDERS)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'cancelled')),
    total NUMERIC DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- J. TABLA DETALLE DE COMPRAS (PURCHASE ORDER ITEMS)
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    qty NUMERIC NOT NULL DEFAULT 1 CHECK (qty > 0),
    unit_cost NUMERIC NOT NULL DEFAULT 0,
    line_total NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- K. TABLA PAGOS (PAYMENTS)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_method TEXT DEFAULT 'efectivo',
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. ÍNDICES DE RENDIMIENTO (OPTIMIZADOS SIN DUPLICADOS)
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_productos_nombre ON public.productos (nombre);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON public.productos (categoria);
CREATE INDEX IF NOT EXISTS idx_customers_national_id ON public.customers (national_id_norm);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status_date ON public.sales_orders (status, created_at, paid_at);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_order_id ON public.sales_order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_product_id ON public.sales_order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status_date ON public.purchase_orders (status, created_at, completed_at);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_id ON public.purchase_order_items (purchase_id);
CREATE INDEX IF NOT EXISTS idx_inventario_mov_prod_date ON public.inventario_movimientos (producto_id, created_at DESC);

-- ==============================================================================
-- 4. FUNCIONES Y TRIGGERS AUTOMÁTICOS
-- ==============================================================================

-- A. Función para actualizar automáticamente la columna updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers de updated_at
CREATE TRIGGER trg_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_business_config_updated_at BEFORE UPDATE ON public.business_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_productos_updated_at BEFORE UPDATE ON public.productos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sales_orders_updated_at BEFORE UPDATE ON public.sales_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- B. Sincronización automática de nuevos usuarios registrados en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios (auth_id, email, nombre, rol)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'rol', 'colaborador')
    )
    ON CONFLICT (auth_id) DO UPDATE SET
        email = EXCLUDED.email,
        nombre = COALESCE(EXCLUDED.nombre, public.usuarios.nombre);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger sobre auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- C. RPC: Sincronizar usuario después del registro (llamada cliente)
CREATE OR REPLACE FUNCTION public.sync_user_after_signup(
    p_auth_id UUID,
    p_email TEXT,
    p_nombre TEXT DEFAULT NULL,
    p_rol TEXT DEFAULT 'colaborador'
)
RETURNS JSONB AS $$
DECLARE
    v_user public.usuarios;
BEGIN
    INSERT INTO public.usuarios (auth_id, email, nombre, rol)
    VALUES (p_auth_id, p_email, COALESCE(p_nombre, split_part(p_email, '@', 1)), COALESCE(p_rol, 'colaborador'))
    ON CONFLICT (auth_id) DO UPDATE SET
        email = EXCLUDED.email,
        nombre = COALESCE(EXCLUDED.nombre, public.usuarios.nombre),
        rol = COALESCE(EXCLUDED.rol, public.usuarios.rol)
    RETURNING * INTO v_user;

    RETURN to_jsonb(v_user);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- D. RPC: Cambiar rol / datos de un usuario
CREATE OR REPLACE FUNCTION public.update_user_role(
    p_user_id UUID,
    p_new_rol TEXT,
    p_nombre TEXT DEFAULT NULL,
    p_activo BOOLEAN DEFAULT NULL,
    p_email TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user public.usuarios;
BEGIN
    UPDATE public.usuarios
    SET 
        rol = COALESCE(p_new_rol, rol),
        nombre = COALESCE(p_nombre, nombre),
        activo = COALESCE(p_activo, activo),
        email = COALESCE(p_email, email),
        updated_at = NOW()
    WHERE id = p_user_id
    RETURNING * INTO v_user;

    RETURN to_jsonb(v_user);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- E. RPC: Finalizar Factura / Venta
CREATE OR REPLACE FUNCTION public.fn_finalize_order(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_order public.sales_orders;
BEGIN
    UPDATE public.sales_orders
    SET status = 'paid',
        paid_at = NOW()
    WHERE id = p_order_id
    RETURNING * INTO v_order;

    RETURN to_jsonb(v_order);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- F. RPC: Cancelar Factura / Venta
CREATE OR REPLACE FUNCTION public.fn_cancel_order(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_order public.sales_orders;
BEGIN
    UPDATE public.sales_orders
    SET status = 'cancelled'
    WHERE id = p_order_id
    RETURNING * INTO v_order;

    RETURN to_jsonb(v_order);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- G. RPC: Finalizar Compra y Actualizar Inventario en Lote
CREATE OR REPLACE FUNCTION public.finalize_purchase_batch(p_purchase_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_item RECORD;
    v_stock_actual NUMERIC;
    v_stock_nuevo NUMERIC;
    v_purchase public.purchase_orders;
BEGIN
    FOR v_item IN SELECT * FROM public.purchase_order_items WHERE purchase_id = p_purchase_id LOOP
        IF v_item.product_id IS NOT NULL AND v_item.qty > 0 THEN
            SELECT stock INTO v_stock_actual FROM public.productos WHERE id = v_item.product_id FOR UPDATE;
            
            IF FOUND THEN
                v_stock_actual := COALESCE(v_stock_actual, 0);
                v_stock_nuevo := v_stock_actual + v_item.qty;

                UPDATE public.productos
                SET stock = v_stock_nuevo
                WHERE id = v_item.product_id;

                INSERT INTO public.inventario_movimientos (
                    producto_id, producto_nombre, tipo, cantidad, stock_anterior, stock_nuevo, motivo
                ) VALUES (
                    v_item.product_id, v_item.product_name, 'entrada', v_item.qty, v_stock_actual, v_stock_nuevo, 'Compra - Orden #' || p_purchase_id
                );
            END IF;
        END IF;
    END LOOP;

    UPDATE public.purchase_orders
    SET status = 'completed',
        completed_at = NOW()
    WHERE id = p_purchase_id
    RETURNING * INTO v_purchase;

    RETURN to_jsonb(v_purchase);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- H. RPC: Reportes Financieros y Métricas Completas
CREATE OR REPLACE FUNCTION public.get_reportes_completos(
    p_fecha_inicio TIMESTAMPTZ,
    p_fecha_fin TIMESTAMPTZ
)
RETURNS JSONB AS $$
DECLARE
    v_ingresos NUMERIC := 0;
    v_gastos NUMERIC := 0;
    v_total_ventas INT := 0;
    v_total_compras INT := 0;
    v_ventas_por_dia JSONB;
    v_compras_por_dia JSONB;
    v_top_productos JSONB;
BEGIN
    -- Ingresos por ventas pagadas
    SELECT COALESCE(SUM(total), 0), COUNT(id)
    INTO v_ingresos, v_total_ventas
    FROM public.sales_orders
    WHERE status = 'paid'
      AND COALESCE(paid_at, created_at) BETWEEN p_fecha_inicio AND p_fecha_fin;

    -- Gastos por compras completadas
    SELECT COALESCE(SUM(total), 0), COUNT(id)
    INTO v_gastos, v_total_compras
    FROM public.purchase_orders
    WHERE status = 'completed'
      AND COALESCE(completed_at, created_at) BETWEEN p_fecha_inicio AND p_fecha_fin;

    -- Ventas por día
    SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) INTO v_ventas_por_dia
    FROM (
        SELECT DATE(COALESCE(paid_at, created_at))::text AS fecha,
               COUNT(id) AS cantidad,
               SUM(total) AS total
        FROM public.sales_orders
        WHERE status = 'paid'
          AND COALESCE(paid_at, created_at) BETWEEN p_fecha_inicio AND p_fecha_fin
        GROUP BY DATE(COALESCE(paid_at, created_at))
        ORDER BY fecha ASC
    ) d;

    -- Compras por día
    SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) INTO v_compras_por_dia
    FROM (
        SELECT DATE(COALESCE(completed_at, created_at))::text AS fecha,
               COUNT(id) AS cantidad,
               SUM(total) AS total
        FROM public.purchase_orders
        WHERE status = 'completed'
          AND COALESCE(completed_at, created_at) BETWEEN p_fecha_inicio AND p_fecha_fin
        GROUP BY DATE(COALESCE(completed_at, created_at))
        ORDER BY fecha ASC
    ) d;

    -- Productos más vendidos
    SELECT COALESCE(jsonb_agg(p), '[]'::jsonb) INTO v_top_productos
    FROM (
        SELECT i.product_id,
               i.product_name,
               SUM(i.qty) AS cantidad,
               SUM(i.line_total) AS ingresos
        FROM public.sales_order_items i
        JOIN public.sales_orders o ON o.id = i.order_id
        WHERE o.status = 'paid'
          AND COALESCE(o.paid_at, o.created_at) BETWEEN p_fecha_inicio AND p_fecha_fin
        GROUP BY i.product_id, i.product_name
        ORDER BY cantidad DESC
        LIMIT 10
    ) p;

    RETURN jsonb_build_object(
        'resumen', jsonb_build_object(
            'ingresos', v_ingresos,
            'gastos', v_gastos,
            'ganancia', v_ingresos - v_gastos,
            'totalVentas', v_total_ventas,
            'totalCompras', v_total_compras
        ),
        'ventasPorDia', v_ventas_por_dia,
        'comprasPorDia', v_compras_por_dia,
        'productosMasVendidos', v_top_productos
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ==============================================================================
-- 5. POLÍTICAS DE SEGURIDAD RLS (ROW LEVEL SECURITY) OPTIMIZADAS
-- ==============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- FUNCIONES DE VERIFICACIÓN DE SEGURIDAD (Sin recursión)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE auth_id = auth.uid() 
          AND COALESCE(activo, true) = true
    );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE auth_id = auth.uid() 
          AND rol = 'admin' 
          AND COALESCE(activo, true) = true
    );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- POLÍTICA USUARIOS
CREATE POLICY "usuarios_read" ON public.usuarios FOR SELECT TO authenticated
    USING (auth_id = auth.uid() OR public.is_admin());

CREATE POLICY "usuarios_update" ON public.usuarios FOR UPDATE TO authenticated
    USING (auth_id = auth.uid() OR public.is_admin());

CREATE POLICY "usuarios_admin_all" ON public.usuarios FOR ALL TO authenticated
    USING (public.is_admin());

-- POLÍTICA CONFIGURACIÓN DEL NEGOCIO
CREATE POLICY "business_select" ON public.business_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "business_admin_modify" ON public.business_config FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- POLÍTICA PRODUCTOS
CREATE POLICY "prod_select" ON public.productos FOR SELECT TO authenticated USING (true);
CREATE POLICY "prod_staff_insert" ON public.productos FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "prod_staff_update" ON public.productos FOR UPDATE TO authenticated USING (public.is_staff());
CREATE POLICY "prod_admin_delete" ON public.productos FOR DELETE TO authenticated USING (public.is_admin());

-- POLÍTICA CLIENTES
CREATE POLICY "cust_select" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "cust_staff_insert" ON public.customers FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "cust_staff_update" ON public.customers FOR UPDATE TO authenticated USING (public.is_staff());
CREATE POLICY "cust_admin_delete" ON public.customers FOR DELETE TO authenticated USING (public.is_admin());

-- POLÍTICA PROVEEDORES
CREATE POLICY "supp_select" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "supp_staff_insert" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "supp_staff_update" ON public.suppliers FOR UPDATE TO authenticated USING (public.is_staff());
CREATE POLICY "supp_staff_delete" ON public.suppliers FOR DELETE TO authenticated USING (public.is_staff());

-- POLÍTICA MOVIMIENTOS INVENTARIO
CREATE POLICY "inv_select" ON public.inventario_movimientos FOR SELECT TO authenticated USING (true);
CREATE POLICY "inv_insert" ON public.inventario_movimientos FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "inv_admin_update" ON public.inventario_movimientos FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "inv_admin_delete" ON public.inventario_movimientos FOR DELETE TO authenticated USING (public.is_admin());

-- POLÍTICA VENTAS (SALES)
CREATE POLICY "so_staff_all" ON public.sales_orders FOR ALL TO authenticated
    USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY "soi_staff_all" ON public.sales_order_items FOR ALL TO authenticated
    USING (public.is_staff()) WITH CHECK (public.is_staff());

-- POLÍTICA COMPRAS (PURCHASES)
CREATE POLICY "po_staff_all" ON public.purchase_orders FOR ALL TO authenticated
    USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY "poi_staff_all" ON public.purchase_order_items FOR ALL TO authenticated
    USING (public.is_staff()) WITH CHECK (public.is_staff());

-- POLÍTICA PAGOS
CREATE POLICY "pay_staff_all" ON public.payments FOR ALL TO authenticated
    USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ==============================================================================
-- 6. DATOS INICIALES POR DEFECTO
-- ==============================================================================
INSERT INTO public.business_config (name, currency)
VALUES ('Carnicería María', 'C$')
ON CONFLICT DO NOTHING;
