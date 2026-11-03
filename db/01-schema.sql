-- =============================================================================
-- VP Finanzas: schema del core organizacional y de acceso
-- Motor: PostgreSQL 15 o superior
-- Requiere: 00-app-user.sql, ejecutado antes por el mismo rol administrador
-- Fuente: docs/modelo-datos/erd.md
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Catálogos
-- -----------------------------------------------------------------------------

CREATE TABLE pais (
    pais_id     INTEGER GENERATED ALWAYS AS IDENTITY,
    codigo_iso  CHAR(2)      NOT NULL,
    nombre      VARCHAR(100) NOT NULL,

    CONSTRAINT pk_pais            PRIMARY KEY (pais_id),
    CONSTRAINT uk_pais_codigo_iso UNIQUE (codigo_iso),
    CONSTRAINT uk_pais_nombre     UNIQUE (nombre),
    CONSTRAINT ck_pais_codigo_iso CHECK (codigo_iso ~ '^[A-Z]{2}$'),
    CONSTRAINT ck_pais_nombre     CHECK (btrim(nombre) <> '')
);

CREATE TABLE departamento (
    departamento_id INTEGER GENERATED ALWAYS AS IDENTITY,
    nombre          VARCHAR(100) NOT NULL,

    CONSTRAINT pk_departamento        PRIMARY KEY (departamento_id),
    CONSTRAINT uk_departamento_nombre UNIQUE (nombre),
    CONSTRAINT ck_departamento_nombre CHECK (btrim(nombre) <> '')
);

CREATE TABLE nivel (
    nivel_id INTEGER GENERATED ALWAYS AS IDENTITY,
    nombre   VARCHAR(50) NOT NULL,

    CONSTRAINT pk_nivel        PRIMARY KEY (nivel_id),
    CONSTRAINT uk_nivel_nombre UNIQUE (nombre),
    CONSTRAINT ck_nivel_nombre CHECK (btrim(nombre) <> '')
);

CREATE TABLE funcion (
    funcion_id  INTEGER GENERATED ALWAYS AS IDENTITY,
    descripcion VARCHAR(200) NOT NULL,

    CONSTRAINT pk_funcion             PRIMARY KEY (funcion_id),
    CONSTRAINT uk_funcion_descripcion UNIQUE (descripcion),
    CONSTRAINT ck_funcion_descripcion CHECK (btrim(descripcion) <> '')
);

CREATE TABLE rol (
    rol_id INTEGER GENERATED ALWAYS AS IDENTITY,
    nombre VARCHAR(50) NOT NULL,

    CONSTRAINT pk_rol        PRIMARY KEY (rol_id),
    CONSTRAINT uk_rol_nombre UNIQUE (nombre),
    CONSTRAINT ck_rol_nombre CHECK (btrim(nombre) <> '')
);

-- -----------------------------------------------------------------------------
-- Estructura organizacional
-- -----------------------------------------------------------------------------

CREATE TABLE cargo (
    cargo_id        INTEGER GENERATED ALWAYS AS IDENTITY,
    departamento_id INTEGER      NOT NULL,
    nivel_id        INTEGER      NOT NULL,
    titulo          VARCHAR(100) NOT NULL,

    CONSTRAINT pk_cargo              PRIMARY KEY (cargo_id),
    CONSTRAINT fk_cargo_departamento FOREIGN KEY (departamento_id)
        REFERENCES departamento (departamento_id) ON DELETE RESTRICT,
    CONSTRAINT fk_cargo_nivel        FOREIGN KEY (nivel_id)
        REFERENCES nivel (nivel_id) ON DELETE RESTRICT,
    CONSTRAINT ck_cargo_titulo       CHECK (btrim(titulo) <> '')
);

CREATE TABLE cargo_funcion (
    cargo_id   INTEGER NOT NULL,
    funcion_id INTEGER NOT NULL,

    CONSTRAINT pk_cargo_funcion         PRIMARY KEY (cargo_id, funcion_id),
    CONSTRAINT fk_cargo_funcion_cargo   FOREIGN KEY (cargo_id)
        REFERENCES cargo (cargo_id) ON DELETE CASCADE,
    CONSTRAINT fk_cargo_funcion_funcion FOREIGN KEY (funcion_id)
        REFERENCES funcion (funcion_id) ON DELETE RESTRICT
);

CREATE TABLE colaborador (
    colaborador_id INTEGER GENERATED ALWAYS AS IDENTITY,
    pais_id        INTEGER      NOT NULL,
    cargo_id       INTEGER      NOT NULL,
    correo         VARCHAR(254) NOT NULL,
    nombre         VARCHAR(100) NOT NULL,
    apellido       VARCHAR(100) NOT NULL,
    fecha_ingreso  DATE         NOT NULL,
    activo         BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT pk_colaborador          PRIMARY KEY (colaborador_id),
    CONSTRAINT fk_colaborador_pais     FOREIGN KEY (pais_id)
        REFERENCES pais (pais_id) ON DELETE RESTRICT,
    CONSTRAINT fk_colaborador_cargo    FOREIGN KEY (cargo_id)
        REFERENCES cargo (cargo_id) ON DELETE RESTRICT,
    CONSTRAINT uk_colaborador_correo   UNIQUE (correo),
    -- El correo se guarda en minúsculas para que la unicidad no dependa de mayúsculas.
    CONSTRAINT ck_colaborador_correo   CHECK (
        correo = lower(correo)
        AND correo ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
    ),
    CONSTRAINT ck_colaborador_nombre   CHECK (btrim(nombre) <> ''),
    CONSTRAINT ck_colaborador_apellido CHECK (btrim(apellido) <> '')
);

-- -----------------------------------------------------------------------------
-- Acceso
-- -----------------------------------------------------------------------------

CREATE TABLE usuario (
    usuario_id      INTEGER GENERATED ALWAYS AS IDENTITY,
    colaborador_id  INTEGER      NOT NULL,
    rol_id          INTEGER      NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT pk_usuario             PRIMARY KEY (usuario_id),
    CONSTRAINT fk_usuario_colaborador FOREIGN KEY (colaborador_id)
        REFERENCES colaborador (colaborador_id) ON DELETE RESTRICT,
    CONSTRAINT fk_usuario_rol         FOREIGN KEY (rol_id)
        REFERENCES rol (rol_id) ON DELETE RESTRICT,
    -- UNIQUE sobre la FK: un colaborador tiene como máximo un usuario (relación 1:0..1).
    CONSTRAINT uk_usuario_colaborador UNIQUE (colaborador_id)
);

-- -----------------------------------------------------------------------------
-- Índices sobre FKs
-- PostgreSQL no indexa automáticamente las columnas FK. Las que ya están cubiertas
-- por una PK o un UNIQUE (cargo_funcion.cargo_id, usuario.colaborador_id) se omiten.
-- -----------------------------------------------------------------------------

CREATE INDEX ix_cargo_departamento_id     ON cargo (departamento_id);
CREATE INDEX ix_cargo_nivel_id            ON cargo (nivel_id);
CREATE INDEX ix_cargo_funcion_funcion_id  ON cargo_funcion (funcion_id);
CREATE INDEX ix_colaborador_pais_id       ON colaborador (pais_id);
CREATE INDEX ix_colaborador_cargo_id      ON colaborador (cargo_id);
CREATE INDEX ix_usuario_rol_id            ON usuario (rol_id);

-- -----------------------------------------------------------------------------
-- Documentación en el catálogo de la base de datos
-- -----------------------------------------------------------------------------

COMMENT ON TABLE pais          IS 'Catálogo de países de residencia';
COMMENT ON TABLE departamento  IS 'Departamentos de la VP de Finanzas';
COMMENT ON TABLE nivel         IS 'Catálogo de seniority';
COMMENT ON TABLE cargo         IS 'Puesto dentro de un departamento';
COMMENT ON TABLE funcion       IS 'Catálogo de funciones';
COMMENT ON TABLE cargo_funcion IS 'Tabla asociativa cargo ↔ función';
COMMENT ON TABLE colaborador   IS 'Ficha laboral de cada persona';
COMMENT ON TABLE rol           IS 'Roles de acceso (Administrador, Jefe de Departamento, Colaborador)';
COMMENT ON TABLE usuario       IS 'Credencial de acceso al portal';

COMMENT ON COLUMN colaborador.activo     IS 'Situación laboral: sigue o no en la VP';
COMMENT ON COLUMN usuario.activo         IS 'Habilitación del acceso al portal; el login exige además colaborador.activo';
COMMENT ON COLUMN usuario.hashed_password IS 'Hash de la contraseña (bcrypt/argon2); nunca texto plano';

COMMIT;
