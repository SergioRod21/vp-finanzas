# AI log: Modelo de datos

## 1. Versión Mermaid del ERD lógico

- **Fecha:** 2026-11-02 · **Herramienta:** Claude Code (Opus 5.5)
- **Contexto:** el ERD lógico del core ya estaba dibujado (`docs/modelo-datos/ERD.png`) y documentado en el diccionario de tablas (`docs/modelo-datos/erd.md`).
- **Lo que pedí:** una versión en texto del diagrama, que se pueda versionar y ver directamente en GitHub, sin alterar el modelo.
- **Prompt:**
  > Tomando en cuenta el Logical ERD plasmado en @docs/modelo-datos/ERD.png y el diccionario de tablas en @docs/modelo-datos/erd.md, generame la version en Mermaid del diagrama, respetando las entidades, sus atributos y relaciones.
- **Aporte de la AI:** transcripción del PNG a un bloque `erDiagram`. No propuso cambios de diseño.

  | Elemento | Mi decisión | Por qué |
  |---|---|---|
  | Transcripción de las 9 entidades, sus atributos, llaves y las 8 cardinalidades | ✅ Aceptado | Verifiqué que coincide con el PNG |
  | Etiquetas de relación vacías (`""`), porque el PNG no tiene verbos | ✅ Aceptado | Mantiene la fidelidad con el diagrama original |

- **Evidencia:** `docs/modelo-datos/erd.md`, sección "Diagrama"

## 2. Schema SQL a partir del ERD lógico

- **Fecha:** 2026-11-03 · **Herramienta:** Claude Code (Opus 5.5)
- **Contexto:** con el ERD lógico documentado en `docs/modelo-datos/erd.md`, faltaba el script de creación de tablas que exige el entregable 1, en la rama `feat/db-schema`.
- **Lo que pedí:** el script de creación de la base de datos en PostgreSQL, derivado del ERD.
- **Prompt:**
  > En base al archivo @docs/modelo-datos/erd.md y la estructura definida en el, generame el schema.sql para la creacion de la BDD usando PostgresSQL
- **Aporte de la AI:** generó `db/01-schema.sql` con las 9 tablas del ERD dentro de una transacción. Las decisiones físicas que no estaban en el ERD fueron propuestas suyas:

  - PKs `GENERATED ALWAYS AS IDENTITY`
  - Restricciones con nombre (`pk_`, `fk_`, `uk_`, `ck_`)
  - CHECK de código ISO: dos letras mayúsculas
  - CHECK de correo: minúsculas y formato básico
  - CHECK de textos no vacíos (`btrim(x) <> ''`)
  - `ON DELETE RESTRICT` en general y `CASCADE` solo en `cargo_funcion.cargo_id`
  - Índices sobre las FK que no cubre una PK o un UNIQUE
  - `COMMENT ON` con los textos del diccionario

  Lo que vino directamente del ERD (tablas, columnas, PK/FK/UK, `NOT NULL` en las FK obligatorias) no es una sugerencia de la AI.
- **Decisión:** ✅ Aceptada
- **Evidencia:** `db/01-schema.sql`

## 3. Datos semilla del core

- **Fecha:** 2026-11-03 · **Herramienta:** Claude Code (Opus 5.5)
- **Contexto:** con `db/01-schema.sql` listo, faltaban los datos ficticios que exige la sección 3.1 del enunciado.
- **Lo que pedí:** el script de datos semilla para la base de datos.
- **Prompt:**
  > Generame tambien el script de seed para la db
- **Aporte de la AI:** generó `db/02-seed.sql`. Propuso por su cuenta:
  - Contenido: 4 países, 4 departamentos, 4 niveles, 3 roles, 19 funciones, 16 cargos (uno por nivel en cada departamento), 36 asignaciones cargo-función y 40 colaboradores (10 por departamento, 3 inactivos)
  - Correos con el dominio reservado `.example` (RFC 2606), que no puede pertenecer a ninguna organización real
  - FKs resueltas por llave natural (`JOIN … ON titulo = …`), porque las PKs `IDENTITY ALWAYS` no admiten IDs fijos
  - Un bloque `DO` final que verifica los conteos y aborta la transacción si falta alguna fila
  - No crear usuarios en el seed: un hash fijo en un script versionado equivale a una contraseña conocida en el repositorio
- **Decisión:** ✅ Aceptada
- **Evidencia:** `db/02-seed.sql`. Se verificó en PostgreSQL 17 (Docker): 40 colaboradores, 10 por departamento
