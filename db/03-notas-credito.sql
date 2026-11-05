-- =============================================================================
-- VP Finanzas: schema del módulo de notas de crédito (sección 3.4, opción 2)
-- Motor: PostgreSQL 15 o superior
-- Requiere: 00-app-user.sql, 01-schema.sql
-- Fuente: docs/modelo-datos/erd.md y decisión S3 de docs/decisiones-tecnicas.md
--
-- Las reglas críticas del proceso se garantizan también aquí, no solo en el backend:
--   - montos positivos con precisión decimal exacta
--   - solo estados y transiciones válidas
--   - quien solicita no puede resolver su propia nota
--   - cada nota indica qué rol debe aprobarla (nivel_aprobacion)
--   - el historial no se puede modificar ni borrar desde la aplicación
-- =============================================================================

\set ON_ERROR_STOP on
\getenv app_user APP_DB_USER

BEGIN;

-- -----------------------------------------------------------------------------
-- Catálogo de motivos
-- -----------------------------------------------------------------------------

CREATE TABLE motivo_nota_credito (
    motivo_nota_credito_id INTEGER GENERATED ALWAYS AS IDENTITY,
    descripcion            VARCHAR(150) NOT NULL,

    CONSTRAINT pk_motivo_nota_credito             PRIMARY KEY (motivo_nota_credito_id),
    CONSTRAINT uk_motivo_nota_credito_descripcion UNIQUE (descripcion),
    CONSTRAINT ck_motivo_nota_credito_descripcion CHECK (btrim(descripcion) <> '')
);

-- -----------------------------------------------------------------------------
-- Notas de crédito
-- -----------------------------------------------------------------------------

-- Número legible para las personas (NC-000001), independiente de la PK.
CREATE SEQUENCE nota_credito_numero_seq;

CREATE TABLE nota_credito (
    nota_credito_id        INTEGER GENERATED ALWAYS AS IDENTITY,
    solicitante_id         INTEGER       NOT NULL,
    resolutor_id           INTEGER,
    departamento_id        INTEGER       NOT NULL,
    motivo_nota_credito_id INTEGER       NOT NULL,
    numero                 VARCHAR(20)   NOT NULL
        DEFAULT 'NC-' || lpad(nextval('nota_credito_numero_seq')::text, 6, '0'),
    monto                  NUMERIC(14,2) NOT NULL,
    detalle                VARCHAR(500)  NOT NULL,
    estado_actual          VARCHAR(20)   NOT NULL DEFAULT 'PENDIENTE',
    nivel_aprobacion       VARCHAR(30)   NOT NULL,
    creada_en              TIMESTAMPTZ   NOT NULL DEFAULT now(),
    actualizada_en         TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT pk_nota_credito              PRIMARY KEY (nota_credito_id),
    CONSTRAINT uk_nota_credito_numero       UNIQUE (numero),
    CONSTRAINT fk_nota_credito_solicitante  FOREIGN KEY (solicitante_id)
        REFERENCES usuario (usuario_id) ON DELETE RESTRICT,
    CONSTRAINT fk_nota_credito_resolutor    FOREIGN KEY (resolutor_id)
        REFERENCES usuario (usuario_id) ON DELETE RESTRICT,
    CONSTRAINT fk_nota_credito_departamento FOREIGN KEY (departamento_id)
        REFERENCES departamento (departamento_id) ON DELETE RESTRICT,
    CONSTRAINT fk_nota_credito_motivo       FOREIGN KEY (motivo_nota_credito_id)
        REFERENCES motivo_nota_credito (motivo_nota_credito_id) ON DELETE RESTRICT,

    CONSTRAINT ck_nota_credito_numero  CHECK (numero ~ '^NC-[0-9]{6,}$'),
    CONSTRAINT ck_nota_credito_monto   CHECK (monto > 0),
    CONSTRAINT ck_nota_credito_detalle CHECK (btrim(detalle) <> ''),
    CONSTRAINT ck_nota_credito_estado  CHECK (
        estado_actual IN ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'ANULADA')
    ),
    -- Quién debe aprobarla, según el rol de quien la solicitó: la nota de un
    -- Colaborador la aprueba el Jefe de su departamento; la de un Jefe, el Administrador.
    CONSTRAINT ck_nota_credito_nivel_aprobacion CHECK (
        nivel_aprobacion IN ('JEFE_DEPARTAMENTO', 'ADMINISTRADOR')
    ),
    -- Segregación de funciones: nadie resuelve su propia solicitud.
    CONSTRAINT ck_nota_credito_no_autoaprobacion CHECK (resolutor_id <> solicitante_id),
    -- Coherencia entre estado y resolutor: solo las notas aprobadas o rechazadas
    -- tienen resolutor. Una nota pendiente o anulada (por su solicitante) no lo tiene.
    CONSTRAINT ck_nota_credito_resolutor_segun_estado CHECK (
        (estado_actual IN ('APROBADA', 'RECHAZADA')) = (resolutor_id IS NOT NULL)
    ),
    CONSTRAINT ck_nota_credito_fechas CHECK (actualizada_en >= creada_en)
);

ALTER SEQUENCE nota_credito_numero_seq OWNED BY nota_credito.numero;

-- -----------------------------------------------------------------------------
-- Historial de acciones (auditoría)
-- -----------------------------------------------------------------------------

CREATE TABLE nota_credito_historico (
    nota_credito_historico_id INTEGER GENERATED ALWAYS AS IDENTITY,
    nota_credito_id           INTEGER      NOT NULL,
    usuario_id                INTEGER      NOT NULL,
    accion                    VARCHAR(20)  NOT NULL,
    estado_anterior           VARCHAR(20),
    estado_nuevo              VARCHAR(20)  NOT NULL,
    comentario                VARCHAR(500),
    ocurrido_en               TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_nota_credito_historico         PRIMARY KEY (nota_credito_historico_id),
    -- RESTRICT y no CASCADE: el historial nunca debe desaparecer junto con la nota.
    CONSTRAINT fk_nota_credito_historico_nota    FOREIGN KEY (nota_credito_id)
        REFERENCES nota_credito (nota_credito_id) ON DELETE RESTRICT,
    CONSTRAINT fk_nota_credito_historico_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuario (usuario_id) ON DELETE RESTRICT,
    CONSTRAINT ck_nota_credito_historico_comentario CHECK (
        comentario IS NULL OR btrim(comentario) <> ''
    ),
    -- Máquina de estados: cada acción solo admite su transición válida.
    --   CREAR:    (ninguno) → PENDIENTE
    --   APROBAR:  PENDIENTE → APROBADA
    --   RECHAZAR: PENDIENTE → RECHAZADA
    --   ANULAR:   PENDIENTE → ANULADA
    CONSTRAINT ck_nota_credito_historico_transicion CHECK (
           (accion = 'CREAR'    AND estado_anterior IS NULL        AND estado_nuevo = 'PENDIENTE')
        OR (accion = 'APROBAR'  AND estado_anterior = 'PENDIENTE'  AND estado_nuevo = 'APROBADA')
        OR (accion = 'RECHAZAR' AND estado_anterior = 'PENDIENTE'  AND estado_nuevo = 'RECHAZADA')
        OR (accion = 'ANULAR'   AND estado_anterior = 'PENDIENTE'  AND estado_nuevo = 'ANULADA')
    )
);

-- -----------------------------------------------------------------------------
-- Índices sobre FKs y columnas de filtro frecuente
-- -----------------------------------------------------------------------------

CREATE INDEX ix_nota_credito_solicitante_id  ON nota_credito (solicitante_id);
CREATE INDEX ix_nota_credito_resolutor_id    ON nota_credito (resolutor_id);
CREATE INDEX ix_nota_credito_departamento_id ON nota_credito (departamento_id);
CREATE INDEX ix_nota_credito_motivo_id       ON nota_credito (motivo_nota_credito_id);
CREATE INDEX ix_nota_credito_estado_actual   ON nota_credito (estado_actual);
-- El historial de una nota se consulta siempre ordenado en el tiempo.
CREATE INDEX ix_nota_credito_historico_nota  ON nota_credito_historico (nota_credito_id, ocurrido_en);
CREATE INDEX ix_nota_credito_historico_usuario_id ON nota_credito_historico (usuario_id);

-- -----------------------------------------------------------------------------
-- Permisos del usuario de la aplicación
-- 00-app-user.sql le da SELECT, INSERT, UPDATE y DELETE sobre todas las tablas.
-- En este módulo se restringen:
--   - las notas no se borran: se anulan
--   - el historial solo se inserta y se consulta (append-only)
-- -----------------------------------------------------------------------------

REVOKE DELETE         ON nota_credito           FROM :"app_user";
REVOKE UPDATE, DELETE ON nota_credito_historico FROM :"app_user";

-- -----------------------------------------------------------------------------
-- Documentación en el catálogo de la base de datos
-- -----------------------------------------------------------------------------

COMMENT ON TABLE motivo_nota_credito    IS 'Catálogo de motivos de las notas de crédito';
COMMENT ON TABLE nota_credito           IS 'Solicitud de nota de crédito y su estado actual';
COMMENT ON TABLE nota_credito_historico IS 'Historial de acciones sobre cada nota de crédito (auditoría, solo inserción)';

COMMENT ON COLUMN nota_credito.numero          IS 'Identificador legible (NC-000001), generado por secuencia';
COMMENT ON COLUMN nota_credito.resolutor_id    IS 'Usuario que aprobó o rechazó la nota; NULL mientras está pendiente o si fue anulada';
COMMENT ON COLUMN nota_credito.departamento_id IS 'Departamento de origen; se guarda como fotografía histórica aunque el solicitante cambie de departamento';
COMMENT ON COLUMN nota_credito.nivel_aprobacion IS 'Rol que debe aprobar la nota (JEFE_DEPARTAMENTO o ADMINISTRADOR), fijado al crearla según el rol del solicitante';

COMMIT;
