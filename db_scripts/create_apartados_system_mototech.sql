-- ==============================================================================
-- SISTEMA DE APARTADOS Y ABONOS (JyG MotoTech)
-- ==============================================================================

-- 1. TABLA PRINCIPAL DE APARTADOS
CREATE TABLE IF NOT EXISTS mototech.apartados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero SERIAL,
    codigo_apartado TEXT,
    customer_id UUID REFERENCES mototech.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_abonado NUMERIC(12, 2) NOT NULL DEFAULT 0,
    saldo_pendiente NUMERIC(12, 2) NOT NULL DEFAULT 0,
    fecha_limite DATE,
    status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'liquidado', 'entregado', 'cancelado')),
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    liquidado_at TIMESTAMPTZ,
    entregado_at TIMESTAMPTZ
);

-- Trigger para generar código tipo 'AP-0001'
CREATE OR REPLACE FUNCTION mototech.trg_set_apartado_codigo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo_apartado IS NULL OR NEW.codigo_apartado = '' THEN
        NEW.codigo_apartado := 'AP-' || LPAD(NEW.numero::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_apartado_codigo ON mototech.apartados;
CREATE TRIGGER trg_apartado_codigo
BEFORE INSERT ON mototech.apartados
FOR EACH ROW EXECUTE FUNCTION mototech.trg_set_apartado_codigo();

-- 2. TABLA DETALLE DE PRODUCTOS EN APARTADO
CREATE TABLE IF NOT EXISTS mototech.apartados_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apartado_id UUID NOT NULL REFERENCES mototech.apartados(id) ON DELETE CASCADE,
    product_id UUID REFERENCES mototech.productos(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    qty NUMERIC(12, 2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    line_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA HISTORIAL DE ABONOS
CREATE TABLE IF NOT EXISTS mototech.apartados_abonos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apartado_id UUID NOT NULL REFERENCES mototech.apartados(id) ON DELETE CASCADE,
    numero_abono INT NOT NULL DEFAULT 1,
    monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
    payment_method TEXT DEFAULT 'efectivo',
    amount_received NUMERIC(12, 2) DEFAULT 0,
    change_given NUMERIC(12, 2) DEFAULT 0,
    saldo_anterior NUMERIC(12, 2) NOT NULL DEFAULT 0,
    saldo_nuevo NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cajero_nombre TEXT,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FUNCIÓN RPC PARA CREAR APARTADO Y RESERVAR STOCK
CREATE OR REPLACE FUNCTION mototech.fn_crear_apartado(
    p_customer_id UUID,
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_fecha_limite DATE,
    p_notas TEXT,
    p_items JSONB,
    p_prima_monto NUMERIC,
    p_payment_method TEXT DEFAULT 'efectivo',
    p_amount_received NUMERIC DEFAULT 0,
    p_change_given NUMERIC DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_apartado mototech.apartados;
    v_total NUMERIC := 0;
    v_item RECORD;
    v_prod mototech.productos;
    v_item_data JSONB;
BEGIN
    -- Calcular total
    FOR v_item_data IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_total := v_total + ((v_item_data->>'qty')::NUMERIC * (v_item_data->>'unit_price')::NUMERIC);
    END LOOP;

    -- Insertar encabezado de apartado
    INSERT INTO mototech.apartados (
        customer_id, customer_name, customer_phone, total,
        total_abonado, saldo_pendiente, fecha_limite, status, notas
    ) VALUES (
        p_customer_id, p_customer_name, p_customer_phone, v_total,
        COALESCE(p_prima_monto, 0), (v_total - COALESCE(p_prima_monto, 0)),
        p_fecha_limite,
        CASE WHEN COALESCE(p_prima_monto, 0) >= v_total THEN 'liquidado' ELSE 'activo' END,
        p_notas
    ) RETURNING * INTO v_apartado;

    -- Insertar items y reservar stock
    FOR v_item_data IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        INSERT INTO mototech.apartados_items (
            apartado_id, product_id, product_name, qty, unit_price, line_total
        ) VALUES (
            v_apartado.id,
            (v_item_data->>'product_id')::UUID,
            v_item_data->>'product_name',
            (v_item_data->>'qty')::NUMERIC,
            (v_item_data->>'unit_price')::NUMERIC,
            ((v_item_data->>'qty')::NUMERIC * (v_item_data->>'unit_price')::NUMERIC)
        );

        -- Descontar del stock disponible y registrar reserva
        IF (v_item_data->>'product_id') IS NOT NULL THEN
            SELECT * INTO v_prod FROM mototech.productos WHERE id = (v_item_data->>'product_id')::UUID FOR UPDATE;
            IF FOUND THEN
                UPDATE mototech.productos 
                SET stock = stock - (v_item_data->>'qty')::NUMERIC 
                WHERE id = v_prod.id;

                INSERT INTO mototech.inventario_movimientos (
                    producto_id, producto_nombre, tipo, cantidad, stock_anterior, stock_nuevo, motivo
                ) VALUES (
                    v_prod.id, v_prod.nombre, 'salida', (v_item_data->>'qty')::NUMERIC,
                    v_prod.stock, (v_prod.stock - (v_item_data->>'qty')::NUMERIC),
                    'Reserva por Apartado #' || v_apartado.codigo_apartado
                );
            END IF;
        END IF;
    END LOOP;

    -- Si hubo prima inicial, registrar el primer abono
    IF COALESCE(p_prima_monto, 0) > 0 THEN
        INSERT INTO mototech.apartados_abonos (
            apartado_id, numero_abono, monto, payment_method,
            amount_received, change_given, saldo_anterior, saldo_nuevo, notas
        ) VALUES (
            v_apartado.id, 1, p_prima_monto, p_payment_method,
            p_amount_received, p_change_given, v_total, (v_total - p_prima_monto),
            'Prima / Abono Inicial'
        );
    END IF;

    RETURN to_jsonb(v_apartado);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNCIÓN RPC PARA REGISTRAR ABONO POSTERIOR
CREATE OR REPLACE FUNCTION mototech.fn_registrar_abono(
    p_apartado_id UUID,
    p_monto NUMERIC,
    p_payment_method TEXT DEFAULT 'efectivo',
    p_amount_received NUMERIC DEFAULT 0,
    p_change_given NUMERIC DEFAULT 0,
    p_notas TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_apartado mototech.apartados;
    v_abono mototech.apartados_abonos;
    v_next_num INT;
    v_nuevo_abonado NUMERIC;
    v_nuevo_saldo NUMERIC;
    v_new_status TEXT;
BEGIN
    SELECT * INTO v_apartado FROM mototech.apartados WHERE id = p_apartado_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Apartado no encontrado';
    END IF;

    IF v_apartado.status IN ('entregado', 'cancelado') THEN
        RAISE EXCEPTION 'No se pueden registrar abonos a un apartado %', v_apartado.status;
    END IF;

    SELECT COALESCE(MAX(numero_abono), 0) + 1 INTO v_next_num FROM mototech.apartados_abonos WHERE apartado_id = p_apartado_id;

    v_nuevo_abonado := v_apartado.total_abonado + p_monto;
    v_nuevo_saldo := GREATEST(0, v_apartado.saldo_pendiente - p_monto);
    v_new_status := CASE WHEN v_nuevo_saldo <= 0 THEN 'liquidado' ELSE 'activo' END;

    -- Registrar abono
    INSERT INTO mototech.apartados_abonos (
        apartado_id, numero_abono, monto, payment_method,
        amount_received, change_given, saldo_anterior, saldo_nuevo, notas
    ) VALUES (
        p_apartado_id, v_next_num, p_monto, p_payment_method,
        p_amount_received, p_change_given, v_apartado.saldo_pendiente, v_nuevo_saldo, p_notas
    ) RETURNING * INTO v_abono;

    -- Actualizar apartado
    UPDATE mototech.apartados
    SET total_abonado = v_nuevo_abonado,
        saldo_pendiente = v_nuevo_saldo,
        status = v_new_status,
        liquidado_at = CASE WHEN v_nuevo_saldo <= 0 AND liquidado_at IS NULL THEN NOW() ELSE liquidado_at END,
        updated_at = NOW()
    WHERE id = p_apartado_id
    RETURNING * INTO v_apartado;

    RETURN jsonb_build_object(
        'apartado', to_jsonb(v_apartado),
        'abono', to_jsonb(v_abono)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNCIÓN RPC PARA CANCELAR APARTADO Y REINTEGRAR STOCK
CREATE OR REPLACE FUNCTION mototech.fn_cancelar_apartado(p_apartado_id UUID, p_motivo TEXT DEFAULT 'Cancelado por cliente')
RETURNS JSONB AS $$
DECLARE
    v_apartado mototech.apartados;
    v_item RECORD;
    v_prod mototech.productos;
BEGIN
    SELECT * INTO v_apartado FROM mototech.apartados WHERE id = p_apartado_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Apartado no encontrado';
    END IF;

    IF v_apartado.status = 'entregado' THEN
        RAISE EXCEPTION 'No se puede cancelar un apartado ya entregado';
    END IF;

    -- Devolver stock de los productos reservados
    FOR v_item IN SELECT * FROM mototech.apartados_items WHERE apartado_id = p_apartado_id LOOP
        IF v_item.product_id IS NOT NULL THEN
            SELECT * INTO v_prod FROM mototech.productos WHERE id = v_item.product_id FOR UPDATE;
            IF FOUND THEN
                UPDATE mototech.productos 
                SET stock = stock + v_item.qty 
                WHERE id = v_item.product_id;

                INSERT INTO mototech.inventario_movimientos (
                    producto_id, producto_nombre, tipo, cantidad, stock_anterior, stock_nuevo, motivo
                ) VALUES (
                    v_item.product_id, v_prod.nombre, 'entrada', v_item.qty,
                    v_prod.stock, (v_prod.stock + v_item.qty),
                    'Reintegro por Cancelación de Apartado #' || v_apartado.codigo_apartado
                );
            END IF;
        END IF;
    END LOOP;

    UPDATE mototech.apartados
    SET status = 'cancelado', notas = COALESCE(notas, '') || ' | ' || p_motivo, updated_at = NOW()
    WHERE id = p_apartado_id
    RETURNING * INTO v_apartado;

    RETURN to_jsonb(v_apartado);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. HABILITAR RLS Y PERMISOS
ALTER TABLE mototech.apartados ENABLE ROW LEVEL SECURITY;
ALTER TABLE mototech.apartados_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mototech.apartados_abonos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mototech_apartados_all" ON mototech.apartados FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mototech_apartados_items_all" ON mototech.apartados_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mototech_apartados_abonos_all" ON mototech.apartados_abonos FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON ALL TABLES IN SCHEMA mototech TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA mototech TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA mototech TO anon, authenticated, service_role;
