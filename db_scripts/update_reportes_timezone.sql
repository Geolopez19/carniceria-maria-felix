-- Actualizar función de reportes para manejar correctamente la zona horaria de Nicaragua (UTC-6)
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

    -- Ventas por día (Ajustado a la zona horaria de Nicaragua / Centroamérica UTC-6)
    SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) INTO v_ventas_por_dia
    FROM (
        SELECT DATE(COALESCE(paid_at, created_at) AT TIME ZONE 'America/Managua')::text AS fecha,
               COUNT(id) AS cantidad,
               SUM(total) AS total
        FROM public.sales_orders
        WHERE status = 'paid'
          AND COALESCE(paid_at, created_at) BETWEEN p_fecha_inicio AND p_fecha_fin
        GROUP BY DATE(COALESCE(paid_at, created_at) AT TIME ZONE 'America/Managua')
        ORDER BY fecha ASC
    ) d;

    -- Compras por día (Ajustado a la zona horaria de Nicaragua / Centroamérica UTC-6)
    SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) INTO v_compras_por_dia
    FROM (
        SELECT DATE(COALESCE(completed_at, created_at) AT TIME ZONE 'America/Managua')::text AS fecha,
               COUNT(id) AS cantidad,
               SUM(total) AS total
        FROM public.purchase_orders
        WHERE status = 'completed'
          AND COALESCE(completed_at, created_at) BETWEEN p_fecha_inicio AND p_fecha_fin
        GROUP BY DATE(COALESCE(completed_at, created_at) AT TIME ZONE 'America/Managua')
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
