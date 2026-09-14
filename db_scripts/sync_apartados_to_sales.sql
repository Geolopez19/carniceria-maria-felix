-- ==============================================================================
-- SCRIPT DE SINCRONIZACIÓN: REGISTRAR APARTADOS ENTREGADOS EN VENTAS (SALES ORDERS)
-- ==============================================================================

-- 1. Insertar las ventas en mototech.sales_orders para apartados que ya fueron entregados
DO $$
DECLARE
    r RECORD;
    v_order_id UUID;
    v_item RECORD;
BEGIN
    FOR r IN SELECT * FROM mototech.apartados WHERE status = 'entregado' LOOP
        -- Verificar si ya existe una orden de venta con el nombre de este apartado
        IF NOT EXISTS (
            SELECT 1 FROM mototech.sales_orders 
            WHERE customer_name LIKE '%' || r.codigo_apartado || '%'
        ) THEN
            INSERT INTO mototech.sales_orders (
                customer_id,
                customer_name,
                status,
                subtotal,
                discount,
                tax,
                total,
                paid_at,
                created_at
            ) VALUES (
                r.customer_id,
                r.customer_name || ' (Apartado ' || r.codigo_apartado || ')',
                'paid',
                r.total,
                0,
                0,
                r.total,
                COALESCE(r.entregado_at, r.updated_at, NOW()),
                r.created_at
            ) RETURNING id INTO v_order_id;

            -- Insertar los items correspondientes
            FOR v_item IN SELECT * FROM mototech.apartados_items WHERE apartado_id = r.id LOOP
                INSERT INTO mototech.sales_order_items (
                    order_id,
                    product_id,
                    product_name,
                    qty,
                    unit_price,
                    discount,
                    tax_rate,
                    line_total
                ) VALUES (
                    v_order_id,
                    v_item.product_id,
                    v_item.product_name,
                    v_item.qty,
                    v_item.unit_price,
                    0,
                    0,
                    v_item.line_total
                );
            END LOOP;
        END IF;
    END LOOP;
END $$;
