# Decisiones técnicas

## Decisiones de seguridad

### S1. Usuario de base de datos dedicado para la aplicación

- **Decisión:** el backend se conecta a PostgreSQL con un usuario propio (`APP_DB_USER`) que solo puede leer y modificar filas (`SELECT`, `INSERT`, `UPDATE`, `DELETE`). No puede crear, alterar ni eliminar tablas, ni crear roles. El usuario administrador (`POSTGRES_USER`) solo se usa para inicializar la base de datos: crear el usuario de la aplicación, el schema y el seed.
- **Alternativa descartada:** que el backend use el usuario administrador. Simplifica la configuración, pero ese usuario es superusuario: una vulnerabilidad en el backend, como una inyección SQL, daría control total sobre la base de datos.
- **Implementación:** `db/00-app-user.sql` crea el usuario y define permisos por defecto (`ALTER DEFAULT PRIVILEGES`) para todas las tablas que el administrador cree después, incluidas las de módulos futuros. El nombre y la contraseña se leen de variables de entorno con `\getenv` de psql, así que ninguna credencial queda en el repositorio.
- **En un despliegue real:**
  - Restringir más las tablas de auditoría: solo `INSERT` y `SELECT`, para que el historial no pueda modificarse ni borrarse desde la aplicación.
  - Gestionar las credenciales con un gestor de secretos (por ejemplo, Docker secrets o el servicio del proveedor cloud) en lugar de un archivo `.env`, y rotarlas periódicamente.
