-- =============================================================================
-- VP Finanzas: datos semilla del módulo de notas de crédito
-- Requiere: 03-notas-credito.sql
--
-- Solo carga el catálogo de motivos. Las notas de crédito de ejemplo se agregan
-- después de crear los usuarios, porque cada nota necesita un solicitante.
-- =============================================================================

BEGIN;

INSERT INTO motivo_nota_credito (descripcion) VALUES
    ('Devolución de mercancía'),
    ('Producto dañado o defectuoso'),
    ('Error de facturación'),
    ('Diferencia de precio'),
    ('Descuento comercial no aplicado'),
    ('Servicio no prestado o cancelado');

DO $$
BEGIN
    IF (SELECT count(*) FROM motivo_nota_credito) <> 6 THEN
        RAISE EXCEPTION 'Seed inválido: se esperaban 6 motivos de nota de crédito';
    END IF;
END
$$;

COMMIT;
