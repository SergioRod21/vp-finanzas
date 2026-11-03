-- =============================================================================
-- VP Finanzas: datos semilla del core organizacional
-- Requiere: 01-schema.sql
--
-- TODOS LOS DATOS SON FICTICIOS. Los nombres de los colaboradores son inventados
-- y los correos usan el dominio reservado .example (RFC 2606), que no puede
-- pertenecer a ninguna organización real.
--
-- Las PKs son IDENTITY, así que las FKs se resuelven por llave natural
-- (nombre, título, código ISO) en lugar de usar IDs fijos.
--
-- No incluye la tabla usuario: las credenciales no deben ir en un script versionado.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Catálogos
-- -----------------------------------------------------------------------------

INSERT INTO pais (codigo_iso, nombre) VALUES
    ('VE', 'Venezuela'),
    ('CO', 'Colombia'),
    ('PA', 'Panamá'),
    ('MX', 'México');

INSERT INTO departamento (nombre) VALUES
    ('Planificación Financiera'),
    ('Tesorería'),
    ('Contraloría'),
    ('Contabilidad');

INSERT INTO nivel (nombre) VALUES
    ('Junior'),
    ('Semi-Senior'),
    ('Senior'),
    ('Jefatura');

INSERT INTO rol (nombre) VALUES
    ('Administrador'),
    ('Jefe de Departamento'),
    ('Colaborador');

INSERT INTO funcion (descripcion) VALUES
    -- Transversales
    ('Supervisar al equipo del departamento'),
    ('Aprobar solicitudes del departamento'),
    ('Elaborar reportes de gestión del área'),
    -- Planificación Financiera
    ('Elaborar el presupuesto anual'),
    ('Proyectar escenarios financieros'),
    ('Analizar desviaciones presupuestarias'),
    ('Consolidar información para el cierre presupuestario'),
    -- Tesorería
    ('Gestionar el flujo de caja'),
    ('Conciliar cuentas bancarias'),
    ('Programar pagos a proveedores'),
    ('Gestionar relaciones con entidades bancarias'),
    -- Contraloría
    ('Diseñar controles internos'),
    ('Ejecutar auditorías de procesos'),
    ('Dar seguimiento a hallazgos de auditoría'),
    ('Verificar cumplimiento de políticas'),
    -- Contabilidad
    ('Registrar asientos contables'),
    ('Preparar estados financieros'),
    ('Realizar el cierre contable mensual'),
    ('Conciliar cuentas contables');

-- -----------------------------------------------------------------------------
-- Cargos: 4 por departamento, uno por nivel
-- -----------------------------------------------------------------------------

INSERT INTO cargo (departamento_id, nivel_id, titulo)
SELECT d.departamento_id, n.nivel_id, v.titulo
FROM (VALUES
    ('Planificación Financiera', 'Jefatura',    'Gerente de Planificación Financiera'),
    ('Planificación Financiera', 'Senior',      'Analista Senior de Planificación Financiera'),
    ('Planificación Financiera', 'Semi-Senior', 'Analista de Presupuesto'),
    ('Planificación Financiera', 'Junior',      'Analista Junior de Planificación'),
    ('Tesorería',                'Jefatura',    'Gerente de Tesorería'),
    ('Tesorería',                'Senior',      'Analista Senior de Tesorería'),
    ('Tesorería',                'Semi-Senior', 'Analista de Tesorería'),
    ('Tesorería',                'Junior',      'Asistente de Tesorería'),
    ('Contraloría',              'Jefatura',    'Gerente de Contraloría'),
    ('Contraloría',              'Senior',      'Auditor Senior'),
    ('Contraloría',              'Semi-Senior', 'Analista de Control Interno'),
    ('Contraloría',              'Junior',      'Asistente de Auditoría'),
    ('Contabilidad',             'Jefatura',    'Gerente de Contabilidad'),
    ('Contabilidad',             'Senior',      'Contador Senior'),
    ('Contabilidad',             'Semi-Senior', 'Analista Contable'),
    ('Contabilidad',             'Junior',      'Asistente Contable')
) AS v (departamento, nivel, titulo)
JOIN departamento d ON d.nombre = v.departamento
JOIN nivel        n ON n.nombre = v.nivel;

-- -----------------------------------------------------------------------------
-- Funciones por cargo
-- -----------------------------------------------------------------------------

INSERT INTO cargo_funcion (cargo_id, funcion_id)
SELECT c.cargo_id, f.funcion_id
FROM (VALUES
    -- Planificación Financiera
    ('Gerente de Planificación Financiera',         'Supervisar al equipo del departamento'),
    ('Gerente de Planificación Financiera',         'Aprobar solicitudes del departamento'),
    ('Gerente de Planificación Financiera',         'Elaborar el presupuesto anual'),
    ('Analista Senior de Planificación Financiera', 'Proyectar escenarios financieros'),
    ('Analista Senior de Planificación Financiera', 'Analizar desviaciones presupuestarias'),
    ('Analista Senior de Planificación Financiera', 'Elaborar reportes de gestión del área'),
    ('Analista de Presupuesto',                     'Analizar desviaciones presupuestarias'),
    ('Analista de Presupuesto',                     'Consolidar información para el cierre presupuestario'),
    ('Analista Junior de Planificación',            'Consolidar información para el cierre presupuestario'),
    -- Tesorería
    ('Gerente de Tesorería',                        'Supervisar al equipo del departamento'),
    ('Gerente de Tesorería',                        'Aprobar solicitudes del departamento'),
    ('Gerente de Tesorería',                        'Gestionar relaciones con entidades bancarias'),
    ('Analista Senior de Tesorería',                'Gestionar el flujo de caja'),
    ('Analista Senior de Tesorería',                'Programar pagos a proveedores'),
    ('Analista Senior de Tesorería',                'Elaborar reportes de gestión del área'),
    ('Analista de Tesorería',                       'Conciliar cuentas bancarias'),
    ('Analista de Tesorería',                       'Programar pagos a proveedores'),
    ('Asistente de Tesorería',                      'Conciliar cuentas bancarias'),
    -- Contraloría
    ('Gerente de Contraloría',                      'Supervisar al equipo del departamento'),
    ('Gerente de Contraloría',                      'Aprobar solicitudes del departamento'),
    ('Gerente de Contraloría',                      'Diseñar controles internos'),
    ('Auditor Senior',                              'Ejecutar auditorías de procesos'),
    ('Auditor Senior',                              'Dar seguimiento a hallazgos de auditoría'),
    ('Auditor Senior',                              'Elaborar reportes de gestión del área'),
    ('Analista de Control Interno',                 'Verificar cumplimiento de políticas'),
    ('Analista de Control Interno',                 'Dar seguimiento a hallazgos de auditoría'),
    ('Asistente de Auditoría',                      'Verificar cumplimiento de políticas'),
    -- Contabilidad
    ('Gerente de Contabilidad',                     'Supervisar al equipo del departamento'),
    ('Gerente de Contabilidad',                     'Aprobar solicitudes del departamento'),
    ('Gerente de Contabilidad',                     'Preparar estados financieros'),
    ('Contador Senior',                             'Realizar el cierre contable mensual'),
    ('Contador Senior',                             'Preparar estados financieros'),
    ('Contador Senior',                             'Elaborar reportes de gestión del área'),
    ('Analista Contable',                           'Registrar asientos contables'),
    ('Analista Contable',                           'Conciliar cuentas contables'),
    ('Asistente Contable',                          'Registrar asientos contables')
) AS v (cargo, funcion)
JOIN cargo   c ON c.titulo      = v.cargo
JOIN funcion f ON f.descripcion = v.funcion;

-- -----------------------------------------------------------------------------
-- Colaboradores: 10 por departamento
-- (1 jefatura, 2 senior, 3 semi-senior, 4 junior; 3 inactivos en total)
-- -----------------------------------------------------------------------------

INSERT INTO colaborador (pais_id, cargo_id, correo, nombre, apellido, fecha_ingreso, activo)
SELECT p.pais_id, c.cargo_id, v.correo, v.nombre, v.apellido, v.fecha_ingreso::date, v.activo
FROM (VALUES
    -- Planificación Financiera
    ('VE', 'Gerente de Planificación Financiera',         'valeria.montiel@vpfinanzas.example',    'Valeria',   'Montiel',    '2016-03-14', TRUE),
    ('VE', 'Analista Senior de Planificación Financiera', 'andres.quintero@vpfinanzas.example',    'Andrés',    'Quintero',   '2018-07-02', TRUE),
    ('CO', 'Analista Senior de Planificación Financiera', 'daniela.uzcategui@vpfinanzas.example',  'Daniela',   'Uzcátegui',  '2019-01-21', TRUE),
    ('VE', 'Analista de Presupuesto',                     'gabriel.fermin@vpfinanzas.example',     'Gabriel',   'Fermín',     '2020-09-01', TRUE),
    ('CO', 'Analista de Presupuesto',                     'lucia.barrios@vpfinanzas.example',      'Lucía',     'Barrios',    '2021-04-12', TRUE),
    ('PA', 'Analista de Presupuesto',                     'tomas.villalba@vpfinanzas.example',     'Tomás',     'Villalba',   '2022-02-07', FALSE),
    ('VE', 'Analista Junior de Planificación',            'mariana.ochoa@vpfinanzas.example',      'Mariana',   'Ochoa',      '2023-06-19', TRUE),
    ('VE', 'Analista Junior de Planificación',            'samuel.arocha@vpfinanzas.example',      'Samuel',    'Arocha',     '2024-01-15', TRUE),
    ('CO', 'Analista Junior de Planificación',            'paola.linares@vpfinanzas.example',      'Paola',     'Linares',    '2024-08-05', TRUE),
    ('VE', 'Analista Junior de Planificación',            'ivan.salcedo@vpfinanzas.example',       'Iván',      'Salcedo',    '2025-03-03', TRUE),
    -- Tesorería
    ('VE', 'Gerente de Tesorería',                        'ricardo.palencia@vpfinanzas.example',   'Ricardo',   'Palencia',   '2015-05-11', TRUE),
    ('VE', 'Analista Senior de Tesorería',                'elena.carvajal@vpfinanzas.example',     'Elena',     'Carvajal',   '2017-10-23', TRUE),
    ('CO', 'Analista Senior de Tesorería',                'hector.sanabria@vpfinanzas.example',    'Héctor',    'Sanabria',   '2019-06-03', TRUE),
    ('VE', 'Analista de Tesorería',                       'natalia.briceno@vpfinanzas.example',    'Natalia',   'Briceño',    '2020-02-17', TRUE),
    ('VE', 'Analista de Tesorería',                       'julian.montero@vpfinanzas.example',     'Julián',    'Montero',    '2021-11-08', TRUE),
    ('CO', 'Analista de Tesorería',                       'carolina.peraza@vpfinanzas.example',    'Carolina',  'Peraza',     '2022-05-30', TRUE),
    ('VE', 'Asistente de Tesorería',                      'diego.alcala@vpfinanzas.example',       'Diego',     'Alcalá',     '2023-09-11', FALSE),
    ('PA', 'Asistente de Tesorería',                      'fernanda.guevara@vpfinanzas.example',   'Fernanda',  'Guevara',    '2024-04-22', TRUE),
    ('VE', 'Asistente de Tesorería',                      'martin.escalona@vpfinanzas.example',    'Martín',    'Escalona',   '2025-01-13', TRUE),
    ('VE', 'Asistente de Tesorería',                      'sofia.bracho@vpfinanzas.example',       'Sofía',     'Bracho',     '2025-07-07', TRUE),
    -- Contraloría
    ('VE', 'Gerente de Contraloría',                      'beatriz.oropeza@vpfinanzas.example',    'Beatriz',   'Oropeza',    '2014-09-15', TRUE),
    ('VE', 'Auditor Senior',                              'rafael.colmenares@vpfinanzas.example',  'Rafael',    'Colmenares', '2017-03-06', TRUE),
    ('CO', 'Auditor Senior',                              'adriana.pineda@vpfinanzas.example',     'Adriana',   'Pineda',     '2018-11-26', TRUE),
    ('VE', 'Analista de Control Interno',                 'oscar.marcano@vpfinanzas.example',      'Óscar',     'Marcano',    '2020-07-20', TRUE),
    ('MX', 'Analista de Control Interno',                 'veronica.tovar@vpfinanzas.example',     'Verónica',  'Tovar',      '2021-08-16', TRUE),
    ('VE', 'Analista de Control Interno',                 'luis.gamboa@vpfinanzas.example',        'Luis',      'Gamboa',     '2022-10-03', TRUE),
    ('CO', 'Asistente de Auditoría',                      'camila.requena@vpfinanzas.example',     'Camila',    'Requena',    '2023-03-27', TRUE),
    ('VE', 'Asistente de Auditoría',                      'esteban.lugo@vpfinanzas.example',       'Esteban',   'Lugo',       '2024-06-10', TRUE),
    ('VE', 'Asistente de Auditoría',                      'isabel.chirinos@vpfinanzas.example',    'Isabel',    'Chirinos',   '2025-02-24', FALSE),
    ('VE', 'Asistente de Auditoría',                      'jorge.mujica@vpfinanzas.example',       'Jorge',     'Mujica',     '2025-09-08', TRUE),
    -- Contabilidad
    ('VE', 'Gerente de Contabilidad',                     'patricia.velasquez@vpfinanzas.example', 'Patricia',  'Velásquez',  '2015-01-19', TRUE),
    ('CO', 'Contador Senior',                             'alejandro.duque@vpfinanzas.example',    'Alejandro', 'Duque',      '2016-08-29', TRUE),
    ('VE', 'Contador Senior',                             'gabriela.isturiz@vpfinanzas.example',   'Gabriela',  'Istúriz',    '2019-04-15', TRUE),
    ('VE', 'Analista Contable',                           'manuel.alfonzo@vpfinanzas.example',     'Manuel',    'Alfonzo',    '2020-12-07', TRUE),
    ('CO', 'Analista Contable',                           'andrea.zambrano@vpfinanzas.example',    'Andrea',    'Zambrano',   '2021-06-21', TRUE),
    ('VE', 'Analista Contable',                           'simon.blanco@vpfinanzas.example',       'Simón',     'Blanco',     '2022-08-29', TRUE),
    ('VE', 'Asistente Contable',                          'rebeca.toro@vpfinanzas.example',        'Rebeca',    'Toro',       '2023-11-20', TRUE),
    ('PA', 'Asistente Contable',                          'nicolas.yepez@vpfinanzas.example',      'Nicolás',   'Yépez',      '2024-02-12', TRUE),
    ('VE', 'Asistente Contable',                          'laura.mendible@vpfinanzas.example',     'Laura',     'Mendible',   '2024-10-28', TRUE),
    ('CO', 'Asistente Contable',                          'felipe.arraiz@vpfinanzas.example',      'Felipe',    'Arráiz',     '2025-05-19', TRUE)
) AS v (pais, cargo, correo, nombre, apellido, fecha_ingreso, activo)
JOIN pais  p ON p.codigo_iso = v.pais
JOIN cargo c ON c.titulo     = v.cargo;

-- -----------------------------------------------------------------------------
-- Verificación
-- Los INSERT ... JOIN descartan sin error las filas cuya llave natural no existe
-- (por ejemplo, un título de cargo mal escrito). Si falta alguna fila, se aborta
-- la transacción completa.
-- -----------------------------------------------------------------------------

DO $$
BEGIN
    IF (SELECT count(*) FROM cargo) <> 16 THEN
        RAISE EXCEPTION 'Seed inválido: se esperaban 16 cargos';
    END IF;
    IF (SELECT count(*) FROM cargo_funcion) <> 36 THEN
        RAISE EXCEPTION 'Seed inválido: se esperaban 36 asignaciones cargo-función';
    END IF;
    IF (SELECT count(*) FROM colaborador) <> 40 THEN
        RAISE EXCEPTION 'Seed inválido: se esperaban 40 colaboradores';
    END IF;
END
$$;

COMMIT;
