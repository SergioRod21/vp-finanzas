# AI log: Seguridad y autenticación

## 5. Usuario de base de datos para la aplicación

- **Fecha:** 2026-11-03 · **Herramienta:** Claude Code (Opus 5.5)
- **Contexto:** al dockerizar PostgreSQL, la AI propuso que el backend no se conectara con el superusuario de la imagen, sino con un usuario de aplicación de privilegios mínimos (`vp_app`), creado mediante un script de bash (`db/00-app-user.sh`).
- **Lo que pedí:** mantener el usuario dedicado, pero sin depender de un script de bash.
- **Prompt:**
  > no me gusta ese script para la creacion del usuario, no podemos no depender de el?
- **Aporte de la AI:**
  - Usuario `vp_app` con `SELECT/INSERT/UPDATE/DELETE` y sin permisos para crear, alterar ni eliminar tablas
  - Reemplazo del script de bash por SQL puro (`db/00-app-user.sql`), que lee las credenciales del entorno con `\getenv` de psql
  - Validación de las variables y uso de `current_database()` y del rol actual, para no depender de `POSTGRES_USER`
  - `ALTER DEFAULT PRIVILEGES`, para que las tablas futuras hereden los permisos
- **Decisión:** ✏️ Modificada. Acepté el usuario dedicado y rechacé su implementación en bash.
- **Por qué:** el superusuario de la imagen le daría a la aplicación control total sobre la base de datos ante cualquier vulnerabilidad. Con SQL puro, la inicialización queda en el mismo formato que `01-schema.sql` y `02-seed.sql`.
- **Evidencia:** `db/00-app-user.sql`, decisión S1 en `docs/decisiones-tecnicas.md`. Se verificó que `vp_app` puede leer y escribir filas, y que no puede ejecutar `DROP`, `CREATE` ni `TRUNCATE`.
