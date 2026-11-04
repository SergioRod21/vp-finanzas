# Errores detectados en respuestas de la AI

Errores o malas prácticas en respuestas de la AI, cómo se detectaron y cómo se corrigieron (sección 5 del enunciado).

## E1. Capa de repositorio aplicada solo a un módulo del backend

- **Fecha:** 2026-11-04 · **Herramienta:** Claude Code (Opus 5.5)
- **Qué hizo la AI:** al implementar el módulo de notas de crédito (fase 9), la AI creó una capa de repositorio (`nota_credito_repository.py`) para concentrar su SQL. Sin embargo, dejó los módulos de solo lectura (Colaboradores, Cargos y funciones, Mi perfil) y la autenticación con el SQL escrito directamente dentro de sus servicios. Lo justificó porque esos módulos solo leen datos y no necesitaban otra capa.
- **Por qué era una mala práctica:** el backend quedaba con dos formas distintas de acceder a la base de datos, según el módulo. Eso rompe la consistencia de la arquitectura: quien lee el código no puede saber dónde está el SQL sin revisar cada módulo, la separación entre reglas de negocio y acceso a datos dependía del caso, y la decisión obligaba a justificar una excepción en lugar de aplicar un principio. Además, el criterio "solo lectura" no se sostenía: el servicio de autenticación también ejecutaba SQL por su cuenta.
- **Cómo lo detecté:** al revisar la estructura del backend, noté que el repositorio existía solo para un módulo y lo cuestioné

  La AI reconoció que la diferencia era una decisión suya, no acordada, y que perjudicaba la consistencia.
- **Corrección:** pedí el refactor en la misma rama, antes de mergear la fase:

  - Se crearon `organizacion_repository.py` y `usuario_repository.py` con todo el SQL de esos módulos.
  - Los servicios conservan solo las reglas: deciden qué filtros corresponden a cada rol (alcance por departamento, solo activos, cargo propio) y se los pasan al repositorio.
  - La comprobación de conexión del endpoint de salud pasó a `core/db.py`, por ser infraestructura y no datos de negocio.
  - Resultado: una sola regla en todo el backend. Ningún router, servicio ni dependencia ejecuta SQL; solo los repositorios hablan con la base de datos.
- **Evidencia:** `backend/app/repositories/`. Los 151 tests (unitarios y de integración contra PostgreSQL) pasan sin cambios después del refactor.
