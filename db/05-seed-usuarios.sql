-- =============================================================================
-- VP Finanzas: usuarios de demostración
-- Requiere: 01-schema.sql, 02-seed.sql. psql 15 o superior (por \getenv)
--
-- Crea usuarios para probar el portal con cada rol. Todos comparten la contraseña
-- de la variable de entorno SEED_USER_PASSWORD (ver la decisión S4).
--
-- Las contraseñas se guardan con bcrypt, generado por la extensión pgcrypto
-- (crypt + gen_salt('bf')). El formato es compatible con la librería bcrypt
-- que usa el backend para verificar el login. Cada usuario recibe una sal distinta.
-- =============================================================================

\set ON_ERROR_STOP on

\getenv seed_password SEED_USER_PASSWORD

\if :{?seed_password}
\else
    DO $$ BEGIN RAISE EXCEPTION 'Falta la variable de entorno SEED_USER_PASSWORD'; END $$;
\endif
SELECT length(:'seed_password') < 8 AS password_corta \gset
\if :password_corta
    DO $$ BEGIN RAISE EXCEPTION 'SEED_USER_PASSWORD debe tener al menos 8 caracteres'; END $$;
\endif

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Usuarios por rol, según la matriz de permisos (S3):
--   - 1 Administrador: aprueba y rechaza notas de crédito de todos los departamentos
--   - 4 Jefes de Departamento: los gerentes, uno por departamento
--   - 4 Colaboradores activos: uno por departamento
--   - 2 casos para probar el login rechazado:
--       * colaborador inactivo (dejó la VP) con usuario activo
--       * colaborador activo con el usuario desactivado
INSERT INTO usuario (colaborador_id, rol_id, hashed_password, activo)
SELECT c.colaborador_id, r.rol_id, crypt(:'seed_password', gen_salt('bf', 12)), v.activo
FROM (VALUES
    ('andres.quintero@vpfinanzas.example',    'Administrador',        TRUE),
    ('valeria.montiel@vpfinanzas.example',    'Jefe de Departamento', TRUE),
    ('ricardo.palencia@vpfinanzas.example',   'Jefe de Departamento', TRUE),
    ('beatriz.oropeza@vpfinanzas.example',    'Jefe de Departamento', TRUE),
    ('patricia.velasquez@vpfinanzas.example', 'Jefe de Departamento', TRUE),
    ('mariana.ochoa@vpfinanzas.example',      'Colaborador',          TRUE),
    ('elena.carvajal@vpfinanzas.example',     'Colaborador',          TRUE),
    ('oscar.marcano@vpfinanzas.example',      'Colaborador',          TRUE),
    ('manuel.alfonzo@vpfinanzas.example',     'Colaborador',          TRUE),
    ('tomas.villalba@vpfinanzas.example',     'Colaborador',          TRUE),
    ('sofia.bracho@vpfinanzas.example',       'Colaborador',          FALSE)
) AS v (correo, rol, activo)
JOIN colaborador c ON c.correo = v.correo
JOIN rol         r ON r.nombre = v.rol;

-- Verificación: un correo o un rol mal escrito descartaría la fila sin error.
DO $$
BEGIN
    IF (SELECT count(*) FROM usuario) <> 11 THEN
        RAISE EXCEPTION 'Seed inválido: se esperaban 11 usuarios';
    END IF;
END
$$;

COMMIT;
