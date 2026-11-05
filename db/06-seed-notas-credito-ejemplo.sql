-- =============================================================================
-- VP Finanzas: notas de crédito de ejemplo
-- Requiere: 04-seed-notas-credito.sql (motivos), 05-seed-usuarios.sql (usuarios)
--
-- Datos ficticios para probar el módulo: notas en los cuatro estados, cada una
-- con su historial completo, siguiendo la matriz de permisos (S3):
--   - las solicita un Colaborador o un Jefe de Departamento, para su propio departamento
--   - la de un Colaborador la aprueba o rechaza el Jefe de su departamento;
--     la de un Jefe, el Administrador (nivel_aprobacion)
--   - las anula su propio solicitante, mientras están pendientes
--
-- Cada nota y sus eventos se insertan respetando las mismas reglas que el backend:
-- todos los CHECK de 03-notas-credito.sql se aplican también a estos datos.
-- =============================================================================

BEGIN;

DO $$
DECLARE
    nota            record;
    v_admin_id      integer;
    v_solicitante_id integer;
    v_rol           text;
    v_depto_id      integer;
    v_nivel         text;
    v_aprobador_id  integer;
    v_nota_id       integer;
BEGIN
    SELECT u.usuario_id INTO STRICT v_admin_id
    FROM usuario u
    JOIN colaborador c USING (colaborador_id)
    WHERE c.correo = 'andres.quintero@vpfinanzas.example';

    FOR nota IN
        SELECT * FROM (VALUES
            -- Solicitadas por Jefes de Departamento: las resuelve el Administrador
            ('ricardo.palencia@vpfinanzas.example', 'Devolución de mercancía', 1250.00::numeric,
             'Devolución de un lote de 50 unidades con vencimiento cercano', 'APROBADA',
             '2026-10-06 09:15-04'::timestamptz, '2026-10-06 15:40-04'::timestamptz,
             'Validado con el acta de devolución firmada por el cliente'),
            ('ricardo.palencia@vpfinanzas.example', 'Error de facturación', 3480.75,
             'Factura emitida con la cantidad de unidades duplicada', 'PENDIENTE',
             '2026-11-02 10:05-04', NULL, NULL),
            ('patricia.velasquez@vpfinanzas.example', 'Diferencia de precio', 812.40,
             'Se aplicó un precio de lista desactualizado en la factura', 'RECHAZADA',
             '2026-10-14 11:20-04', '2026-10-15 09:10-04',
             'El precio facturado corresponde a la lista vigente en la fecha de la venta'),
            ('patricia.velasquez@vpfinanzas.example', 'Descuento comercial no aplicado', 560.00,
             'Descuento por volumen acordado con el cliente y no reflejado en la factura', 'PENDIENTE',
             '2026-11-03 14:30-04', NULL, NULL),
            ('valeria.montiel@vpfinanzas.example', 'Servicio no prestado o cancelado', 2100.00,
             'Servicio de mantenimiento facturado y cancelado antes de su ejecución', 'APROBADA',
             '2026-09-22 08:30-04', '2026-09-23 10:15-04',
             'Confirmada la cancelación con el área de operaciones'),
            ('valeria.montiel@vpfinanzas.example', 'Error de facturación', 945.10,
             'Factura emitida a nombre de un cliente equivocado', 'ANULADA',
             '2026-10-20 08:45-04', '2026-10-20 10:00-04',
             'Se corrigió con una refacturación; la nota ya no es necesaria'),
            ('beatriz.oropeza@vpfinanzas.example', 'Producto dañado o defectuoso', 1520.00,
             'Mercancía recibida por el cliente con el empaque dañado', 'PENDIENTE',
             '2026-11-03 16:00-04', NULL, NULL),
            ('beatriz.oropeza@vpfinanzas.example', 'Devolución de mercancía', 4300.00,
             'Devolución solicitada por el cliente 60 días después de la compra', 'RECHAZADA',
             '2026-10-01 13:00-04', '2026-10-02 09:30-04',
             'Fuera del plazo de devolución establecido en la política comercial'),
            -- Solicitadas por Colaboradores: las resuelve el Jefe de su departamento
            ('elena.carvajal@vpfinanzas.example', 'Diferencia de precio', 275.30,
             'El cliente pagó con un descuento de pronto pago que no se reflejó en la factura', 'PENDIENTE',
             '2026-11-04 08:40-04', NULL, NULL),
            ('elena.carvajal@vpfinanzas.example', 'Devolución de mercancía', 640.00,
             'Devolución de 8 unidades por error en el pedido del cliente', 'APROBADA',
             '2026-10-27 11:10-04', '2026-10-27 16:25-04',
             'Verificado con la guía de devolución del almacén'),
            ('mariana.ochoa@vpfinanzas.example', 'Descuento comercial no aplicado', 1180.00,
             'Descuento por campaña promocional no aplicado en la factura', 'RECHAZADA',
             '2026-10-21 10:00-04', '2026-10-22 08:50-04',
             'La campaña promocional había terminado antes de la fecha de la venta'),
            ('oscar.marcano@vpfinanzas.example', 'Error de facturación', 390.00,
             'Factura con el RIF del cliente equivocado', 'ANULADA',
             '2026-10-29 14:15-04', '2026-10-29 15:00-04',
             'Se emitió una nueva factura con los datos correctos'),
            ('manuel.alfonzo@vpfinanzas.example', 'Producto dañado o defectuoso', 2750.50,
             'Equipo entregado con fallas de fábrica', 'PENDIENTE',
             '2026-11-03 09:30-04', NULL, NULL)
        ) AS v (correo_solicitante, motivo, monto, detalle, estado, creada_en, resuelta_en, comentario)
    LOOP
        -- El departamento de la nota es el del solicitante (colaborador → cargo).
        SELECT u.usuario_id, r.nombre, ca.departamento_id
        INTO STRICT v_solicitante_id, v_rol, v_depto_id
        FROM usuario u
        JOIN rol r USING (rol_id)
        JOIN colaborador c USING (colaborador_id)
        JOIN cargo ca USING (cargo_id)
        WHERE c.correo = nota.correo_solicitante;

        -- Quién aprueba según el rol del solicitante (misma regla que el backend).
        IF v_rol = 'Jefe de Departamento' THEN
            v_nivel := 'ADMINISTRADOR';
            v_aprobador_id := v_admin_id;
        ELSE
            v_nivel := 'JEFE_DEPARTAMENTO';
            -- El Jefe del departamento de la nota. STRICT: debe haber exactamente uno.
            SELECT u.usuario_id INTO STRICT v_aprobador_id
            FROM usuario u
            JOIN rol r USING (rol_id)
            JOIN colaborador c USING (colaborador_id)
            JOIN cargo ca USING (cargo_id)
            WHERE r.nombre = 'Jefe de Departamento' AND ca.departamento_id = v_depto_id;
        END IF;

        -- STRICT: si el motivo no existe, el INSERT no devuelve filas y el seed falla.
        INSERT INTO nota_credito (solicitante_id, resolutor_id, departamento_id,
                                  motivo_nota_credito_id, monto, detalle, estado_actual,
                                  nivel_aprobacion, creada_en, actualizada_en)
        SELECT v_solicitante_id,
               CASE WHEN nota.estado IN ('APROBADA', 'RECHAZADA') THEN v_aprobador_id END,
               v_depto_id, m.motivo_nota_credito_id, nota.monto, nota.detalle, nota.estado,
               v_nivel, nota.creada_en, COALESCE(nota.resuelta_en, nota.creada_en)
        FROM motivo_nota_credito m
        WHERE m.descripcion = nota.motivo
        RETURNING nota_credito_id INTO STRICT v_nota_id;

        INSERT INTO nota_credito_historico (nota_credito_id, usuario_id, accion,
                                            estado_anterior, estado_nuevo, ocurrido_en)
        VALUES (v_nota_id, v_solicitante_id, 'CREAR', NULL, 'PENDIENTE', nota.creada_en);

        IF nota.estado <> 'PENDIENTE' THEN
            INSERT INTO nota_credito_historico (nota_credito_id, usuario_id, accion,
                                                estado_anterior, estado_nuevo, comentario,
                                                ocurrido_en)
            VALUES (
                v_nota_id,
                -- La anula su solicitante; la aprueba o rechaza quien corresponde por nivel.
                CASE WHEN nota.estado = 'ANULADA' THEN v_solicitante_id ELSE v_aprobador_id END,
                CASE nota.estado WHEN 'APROBADA'  THEN 'APROBAR'
                                 WHEN 'RECHAZADA' THEN 'RECHAZAR'
                                 ELSE 'ANULAR' END,
                'PENDIENTE', nota.estado, nota.comentario, nota.resuelta_en
            );
        END IF;
    END LOOP;

    IF (SELECT count(*) FROM nota_credito) <> 13 THEN
        RAISE EXCEPTION 'Seed inválido: se esperaban 13 notas de crédito';
    END IF;
    IF (SELECT count(*) FROM nota_credito_historico) <> 21 THEN
        RAISE EXCEPTION 'Seed inválido: se esperaban 21 eventos en el historial';
    END IF;
END
$$;

COMMIT;
