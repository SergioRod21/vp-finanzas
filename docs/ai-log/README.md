# Registro de uso de AI

Registro de los prompts que llevaron a decisiones de arquitectura, modelo de datos o seguridad (sección 5 del enunciado).

Cada entrada separa **lo que pedí** (mi decisión de qué construir) del **aporte de la AI** (lo que propuso por su cuenta). Las sugerencias de la AI se marcan una por una como aceptadas, modificadas o rechazadas.

## Herramientas

| Herramienta | Uso |
|---|---|
| Claude Code (Opus 5.5) | Modelado de datos y documentación |

## Resumen

| # | Tema | Lo que pedí | Aporte de la AI | Resultado | Detalle |
|---|---|---|---|---|---|
| 1 | Modelo | Versión Mermaid del ERD | Transcripción fiel, sin cambios de diseño | ✅ Aceptado | [01-modelo-datos](01-modelo-datos.md#1-versión-mermaid-del-erd-lógico) |
| 2 | Modelo | Schema SQL (PostgreSQL) a partir del ERD | Decisiones físicas: identity, CHECKs, `ON DELETE`, índices | ✅ Aceptado | [01-modelo-datos](01-modelo-datos.md#2-schema-sql-a-partir-del-erd-lógico) |
