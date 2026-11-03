-- =============================================================================
-- VP Finanzas: usuario de base de datos de la aplicación (privilegios mínimos)
-- Requiere: psql 15 o superior (por \getenv)
--
-- Debe ejecutarlo, ANTES de 01-schema.sql, el mismo rol administrador que luego
-- crea las tablas: los permisos por defecto se aplican a los objetos que ese rol
-- cree después.
--
-- El nombre y la contraseña se leen de las variables de entorno APP_DB_USER y
-- APP_DB_PASSWORD. psql las inserta como identificador y literal escapados.
-- Ninguna credencial queda en el repositorio.
-- =============================================================================

\set ON_ERROR_STOP on

\getenv app_user     APP_DB_USER
\getenv app_password APP_DB_PASSWORD

-- Validar las variables antes de usarlas.
\if :{?app_user}
\else
    DO $$ BEGIN RAISE EXCEPTION 'Falta la variable de entorno APP_DB_USER'; END $$;
\endif
\if :{?app_password}
\else
    DO $$ BEGIN RAISE EXCEPTION 'Falta la variable de entorno APP_DB_PASSWORD'; END $$;
\endif
SELECT length(:'app_password') = 0 AS password_vacio \gset
\if :password_vacio
    DO $$ BEGIN RAISE EXCEPTION 'APP_DB_PASSWORD no puede estar vacía'; END $$;
\endif

SELECT current_database() AS db_name \gset

CREATE ROLE :"app_user" LOGIN PASSWORD :'app_password';

-- Solo el usuario de la aplicación (y el administrador) pueden conectarse a esta base.
REVOKE ALL ON DATABASE :"db_name" FROM PUBLIC;
GRANT CONNECT ON DATABASE :"db_name" TO :"app_user";

-- Puede usar el schema, pero no crear objetos en él.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO :"app_user";

-- Permisos sobre las tablas y secuencias que el rol actual cree después
-- (01-schema.sql y siguientes): manipular filas, sin CREATE, ALTER, DROP ni TRUNCATE.
-- USAGE en las secuencias es necesario para insertar en columnas IDENTITY.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"app_user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO :"app_user";
