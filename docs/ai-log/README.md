# Registro de uso de AI

Registro de los prompts que llevaron a decisiones de arquitectura, modelo de datos o seguridad (sección 5 del enunciado).

Cada entrada separa **lo que pedí** (mi decisión de qué construir) del **aporte de la AI** (lo que propuso por su cuenta), y registra si ese aporte se aceptó, se modificó o se rechazó.

## Herramientas

| Herramienta | Uso |
|---|---|
| Claude Code (Opus 5.5) | Modelado de datos, scripts SQL, infraestructura con Docker y documentación |

## Resumen

| # | Tema | Lo que pedí | Aporte de la AI | Resultado | Detalle |
|---|---|---|---|---|---|
| 1 | Modelo | Versión Mermaid del ERD | Transcripción fiel, sin cambios de diseño | ✅ Aceptado | [01-modelo-datos](01-modelo-datos.md#1-versión-mermaid-del-erd-lógico) |
| 2 | Modelo | Schema SQL (PostgreSQL) a partir del ERD | Decisiones físicas: identity, CHECKs, `ON DELETE`, índices | ✅ Aceptado | [01-modelo-datos](01-modelo-datos.md#2-schema-sql-a-partir-del-erd-lógico) |
| 3 | Modelo | Script de datos semilla | Datos ficticios con dominio `.example`, FKs por llave natural, verificación de conteos | ✅ Aceptado | [01-modelo-datos](01-modelo-datos.md#3-datos-semilla-del-core) |
| 4 | Arquitectura | Separación en contenedores y dockerizar PostgreSQL | Un contenedor por capa, red interna, puerto solo en `127.0.0.1` | ✅ Aceptado | [02-stack-arquitectura](02-stack-arquitectura.md#4-separación-en-contenedores-y-dockerización-de-postgresql) |
| 5 | Seguridad | Conexión de la aplicación a la base de datos | Usuario `vp_app` con privilegios mínimos | ✏️ Modificado | [03-seguridad-auth](03-seguridad-auth.md#5-usuario-de-base-de-datos-para-la-aplicación) |
| 6 | Arquitectura | Comparación de framework y ORM para el backend | Recomendó FastAPI + SQLAlchemy 2.0 | ✏️ Modificado: FastAPI sí, SQLModel en lugar de SQLAlchemy | [02-stack-arquitectura](02-stack-arquitectura.md#6-framework-y-orm-del-backend) |
| 7 | Seguridad | Mecanismo de sesión adaptado al stack | JWT en cookie `httpOnly`, con el usuario leído de la BD en cada petición | ✅ Aceptado | [03-seguridad-auth](03-seguridad-auth.md#7-mecanismo-de-sesión) |
