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

## 7. Mecanismo de sesión

- **Fecha:** 2026-11-04 · **Herramienta:** Claude Code (Opus 5.5)
- **Contexto:** con el stack definido (FastAPI, React servido desde el mismo origen y PostgreSQL), faltaba decidir cómo se mantiene la sesión después del login, antes de implementar la autenticación.
- **Lo que pedí:** las opciones de sesión que se adaptan al stack y al objetivo del portal, con sus características y ordenadas por viabilidad.
- **Prompts:**
  > hablame de los posibles mecanismos de sesiones que se adaptan a nuestro stack tecnologico y cumplen con nuestro objetivo, listamelos con cada una de sus caracteristicas, en orden de viabilidad

  > vamos con la opción 1, documentalo en S2
- **Aporte de la AI:** comparó seis mecanismos (JWT en cookie `httpOnly`, sesión en servidor, JWT Bearer, cookie de sesión firmada, JWT de acceso con refresh token y proveedor de identidad externo) y recomendó el JWT en cookie `httpOnly`, con estas reglas:
  - El token solo contiene `sub` y `exp`; el rol, el departamento y los indicadores `activo` se leen de la base de datos en cada petición
  - Cookie `httpOnly`, `SameSite=Strict` y `Path=/api`, más `Secure` con HTTPS
  - Expiración corta y secreto en la variable de entorno `JWT_SECRET`
- **Decisión:** ✅ Aceptada
- **Por qué:** protege contra XSS y CSRF sin agregar tablas al esquema. Leer el usuario en cada petición compensa la principal debilidad del JWT, la revocación, porque un usuario desactivado pierde el acceso en su siguiente petición.
- **Evidencia:** decisión S2 en `docs/decisiones-tecnicas.md`
